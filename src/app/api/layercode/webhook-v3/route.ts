/**
 * Hybrid Layercode Voice Webhook Handler (V3)
 *
 * Combines:
 * - V1's structured question flow (reliability)
 * - V2's single-LLM approach (speed)
 *
 * Key: Explicit question tracking + forced tool calls + validation
 */

import { streamResponse } from '@layercode/node-server-sdk'
import { streamText, tool } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import z from 'zod'
import { Province } from '@/types/constants'

export const dynamic = 'force-dynamic'

// AI Provider selection
const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini'
const aiClient = AI_PROVIDER === 'openai'
  ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

const model = AI_PROVIDER === 'openai'
  ? aiClient('gpt-4-1106-preview')
  : aiClient('gemini-2.0-flash-exp')

// Question definitions (explicit flow)
type ToolName = 'storeCurrentAge' | 'storeRetirementAge' | 'storeProvince' | 'storeRRSP' | 'storeTFSA' | 'storeNonRegistered' | 'storeMonthlySpending' | 'storeInvestmentReturn'

interface Question {
  id: string
  text: string
  toolName: ToolName
  required: boolean
}

const QUESTIONS: Question[] = [
  {
    id: 'current_age',
    text: "How old are you currently?",
    toolName: 'storeCurrentAge',
    required: true
  },
  {
    id: 'retirement_age',
    text: "At what age are you planning to retire?",
    toolName: 'storeRetirementAge',
    required: true
  },
  {
    id: 'province',
    text: "Which province or territory do you live in?",
    toolName: 'storeProvince',
    required: true
  },
  {
    id: 'rrsp_amount',
    text: "What's the current balance in your RRSP? If you don't have one, just say 'none' or 'zero'.",
    toolName: 'storeRRSP',
    required: false
  },
  {
    id: 'tfsa_amount',
    text: "What's your TFSA balance? Say 'none' if you don't have one.",
    toolName: 'storeTFSA',
    required: false
  },
  {
    id: 'non_registered_amount',
    text: "What's the total value of your non-registered investments? Say 'none' if you don't have any.",
    toolName: 'storeNonRegistered',
    required: false
  },
  {
    id: 'monthly_spending',
    text: "How much do you think you'll need to spend each month in retirement?",
    toolName: 'storeMonthlySpending',
    required: true
  },
  {
    id: 'investment_return',
    text: "What annual investment return are you expecting? Most people assume between 4% and 7%.",
    toolName: 'storeInvestmentReturn',
    required: false
  }
]

// Webhook request type
type WebhookRequest = {
  conversation_id: string
  text?: string
  turn_id?: string
  type: 'message' | 'session.start' | 'session.update' | 'session.end' | string
}

// Conversation state
interface ConversationState {
  currentQuestionIndex: number
  data: {
    currentAge?: number
    retirementAge?: number
    province?: Province
    rrsp?: number | null
    tfsa?: number | null
    non_registered?: number | null
    monthlySpending?: number
    investmentReturn?: number
  }
}

// In-memory storage
const conversations = new Map<string, ConversationState>()

export async function POST(request: Request) {
  try {
    const requestBody = await request.json() as WebhookRequest
    const { type, text, turn_id, conversation_id } = requestBody

    return streamResponse(requestBody, async ({ stream }) => {
      try {
        // SESSION START
        if (type === 'session.start') {
          console.log(`✅ Started session ${conversation_id}`)

          // Initialize state
          conversations.set(conversation_id, {
            currentQuestionIndex: 0,
            data: {}
          })

          // Send greeting + first question
          const greeting = `Hi! I'm here to help you plan your retirement. This will take about 2 minutes. Let's start - ${QUESTIONS[0].text}`
          stream.tts(greeting)

          stream.data({
            type: 'progress',
            current: 1,
            total: QUESTIONS.length,
            currentQuestion: QUESTIONS[0].id
          })

          stream.end()
          return
        }

        // SESSION END
        if (type === 'session.end') {
          conversations.delete(conversation_id)
          console.log(`🧹 Ended session ${conversation_id}`)
          stream.end()
          return
        }

        // SESSION UPDATE
        if (type === 'session.update') {
          stream.end()
          return
        }

        // MESSAGE
        if (type === 'message' && text) {
          const state = conversations.get(conversation_id)
          if (!state) {
            stream.tts("I'm sorry, I lost track of our conversation. Could you start over?")
            stream.end()
            return
          }

          const currentQuestion = QUESTIONS[state.currentQuestionIndex]
          if (!currentQuestion) {
            // All questions answered - send completion
            console.log(`✅ Data collection complete:`, state.data)

            stream.tts("Perfect! Thanks for sharing all that information. I'm now calculating your retirement projection.")
            stream.data({
              type: 'complete',
              collectedData: {
                ...state.data,
                investmentReturn: state.data.investmentReturn || 5.0
              }
            })
            stream.end()
            return
          }

          console.log(`💬 Q${state.currentQuestionIndex + 1}: ${currentQuestion.id} - User: "${text.substring(0, 50)}..."`)

          // Track if tool was called successfully
          let toolCalled = false
          let storedValue: any = undefined

          // Define tools - ONE TOOL PER QUESTION (explicit mapping)
          const tools = {
            storeCurrentAge: tool({
              description: 'Store the user\'s current age',
              inputSchema: z.object({
                age: z.number().min(18).max(100)
              }),
              execute: async ({ age }) => {
                state.data.currentAge = age
                toolCalled = true
                storedValue = age
                console.log(`💾 Stored current age: ${age}`)
                return { success: true }
              }
            }),

            storeRetirementAge: tool({
              description: 'Store the user\'s retirement age',
              inputSchema: z.object({
                age: z.number().min(50).max(80)
              }),
              execute: async ({ age }) => {
                state.data.retirementAge = age
                toolCalled = true
                storedValue = age
                console.log(`💾 Stored retirement age: ${age}`)
                return { success: true }
              }
            }),

            storeProvince: tool({
              description: 'Store the user\'s Canadian province',
              inputSchema: z.object({
                province: z.enum(['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'])
              }),
              execute: async ({ province }) => {
                state.data.province = province as Province
                toolCalled = true
                storedValue = province
                console.log(`💾 Stored province: ${province}`)
                return { success: true }
              }
            }),

            storeRRSP: tool({
              description: 'Store RRSP balance (use null if they don\'t have one)',
              inputSchema: z.object({
                amount: z.number().nullable()
              }),
              execute: async ({ amount }) => {
                state.data.rrsp = amount
                toolCalled = true
                storedValue = amount
                console.log(`💾 Stored RRSP: ${amount}`)
                return { success: true }
              }
            }),

            storeTFSA: tool({
              description: 'Store TFSA balance (use null if they don\'t have one)',
              inputSchema: z.object({
                amount: z.number().nullable()
              }),
              execute: async ({ amount }) => {
                state.data.tfsa = amount
                toolCalled = true
                storedValue = amount
                console.log(`💾 Stored TFSA: ${amount}`)
                return { success: true }
              }
            }),

            storeNonRegistered: tool({
              description: 'Store non-registered investments (use null if they don\'t have any)',
              inputSchema: z.object({
                amount: z.number().nullable()
              }),
              execute: async ({ amount }) => {
                state.data.non_registered = amount
                toolCalled = true
                storedValue = amount
                console.log(`💾 Stored non-registered: ${amount}`)
                return { success: true }
              }
            }),

            storeMonthlySpending: tool({
              description: 'Store monthly retirement spending',
              inputSchema: z.object({
                amount: z.number().min(1)
              }),
              execute: async ({ amount }) => {
                state.data.monthlySpending = amount
                toolCalled = true
                storedValue = amount
                console.log(`💾 Stored monthly spending: ${amount}`)
                return { success: true }
              }
            }),

            storeInvestmentReturn: tool({
              description: 'Store expected investment return percentage',
              inputSchema: z.object({
                percentage: z.number().min(0).max(20)
              }),
              execute: async ({ percentage }) => {
                state.data.investmentReturn = percentage
                toolCalled = true
                storedValue = percentage
                console.log(`💾 Stored investment return: ${percentage}%`)
                return { success: true }
              }
            })
          }

          // System prompt for this specific question
          const systemPrompt = `You are collecting retirement planning data. The user just answered a question.

**CURRENT QUESTION:** ${currentQuestion.text}
**YOUR TASK:** Parse their answer and call the ${currentQuestion.toolName} tool with the correct value.

**Rules:**
1. ONLY call the ${currentQuestion.toolName} tool - no other tools!
2. For "none", "zero", "nothing" responses to optional questions, use null
3. Extract numbers from natural language (e.g., "I'm 58" → 58, "500k" → 500000)
4. For provinces, convert to 2-letter codes (e.g., "Ontario" → "ON", "BC" → "BC")
5. If you can't parse the answer, respond with: "I didn't quite catch that. Could you tell me ${currentQuestion.text.toLowerCase()}?"
6. After successfully calling the tool, give a brief acknowledgment (3-5 words) and ask the next question

Keep all responses under 20 words.`

          // Generate response with FORCED tool choice
          const { textStream } = streamText({
            model,
            system: systemPrompt,
            messages: [
              { role: 'user', content: text }
            ],
            tools,
            toolChoice: {
              type: 'tool',
              toolName: currentQuestion.toolName
            },
            onFinish: async () => {
              // Check if tool was called successfully
              if (toolCalled) {
                // Move to next question
                state.currentQuestionIndex++
                conversations.set(conversation_id, state)

                const nextQuestion = QUESTIONS[state.currentQuestionIndex]

                // Send progress update
                stream.data({
                  type: 'progress',
                  current: state.currentQuestionIndex + 1,
                  total: QUESTIONS.length,
                  currentQuestion: nextQuestion?.id || 'complete',
                  lastAnswer: {
                    questionId: currentQuestion.id,
                    rawText: text,
                    parsedValue: storedValue
                  }
                })

                console.log(`✅ Question ${currentQuestion.id} complete, moving to ${nextQuestion?.id || 'done'}`)
              } else {
                console.warn(`⚠️ Tool not called for ${currentQuestion.id}`)
              }

              stream.end()
            }
          })

          // Stream response to TTS
          await stream.ttsTextStream(textStream)
        }

        stream.end()
      } catch (error) {
        console.error('Error in webhook handler:', error)
        stream.tts("I apologize, but I encountered an error. Please try again.")
        stream.end()
      }
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
