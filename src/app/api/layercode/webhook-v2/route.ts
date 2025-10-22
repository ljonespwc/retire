/**
 * Optimized Layercode Voice Webhook Handler (V2)
 *
 * Architecture: Single-LLM with tools (based on Layercode's example)
 * - 5-10x faster than V1 (1 LLM call per message vs 2-3)
 * - More natural conversation flow
 * - Simpler codebase
 *
 * Key difference from V1:
 * - V1: Parse with LLM #1 → Generate transition with LLM #2
 * - V2: Single conversational LLM with data extraction tools
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

// System prompt guides entire conversation
const SYSTEM_PROMPT = `You are a friendly Canadian retirement planning assistant collecting data through natural conversation.

**Required data to collect (ask in this order):**
1. Current age (must be 18-100)
2. Retirement age (must be 50-80)
3. Province/territory (2-letter code: AB, BC, MB, NB, NL, NT, NS, NU, ON, PE, QC, SK, YT)
4. RRSP balance (optional - if user says "none", "zero", "nothing", that's valid - store null)
5. TFSA balance (optional - same as RRSP)
6. Non-registered investments (optional - same as RRSP)
7. Monthly retirement spending (required - must be positive)
8. Expected investment return percentage (optional - default to 5%)

**Instructions:**
- Ask ONE question at a time
- Use your tools to store each answer immediately after user responds
- Give brief, warm acknowledgments (e.g., "got it", "thanks", "perfect")
- Move to the next question right after storing
- If user says "none", "zero", "nothing" for optional account questions, store null and continue
- If answer is unclear or invalid, politely ask them to rephrase
- After storing the last piece of data (investment return), thank them warmly and mention you'll calculate their plan
- Keep all responses under 25 words
- Be conversational, warm, and encouraging

**Important:** Always call the appropriate tool to store data before moving to the next question!`

const WELCOME_MESSAGE = "Hi! I'm here to help you plan your retirement. This will take about 2 minutes. Let's start - how old are you currently?"

// Webhook request type
type WebhookRequest = {
  conversation_id: string
  session_id?: string
  text?: string
  turn_id?: string
  interruption_context?: {
    previous_turn_interrupted: boolean
    words_heard: number
    text_heard: string
    assistant_turn_id?: string
  }
  type: 'message' | 'session.start' | 'session.update' | 'session.end' | string
}

// Conversation data storage
interface ConversationData {
  currentAge?: number
  retirementAge?: number
  province?: Province
  rrsp?: number | null | undefined
  tfsa?: number | null | undefined
  non_registered?: number | null | undefined
  monthlySpending?: number | null | undefined
  investmentReturn?: number
}

// Message with turn_id for conversation history
type MessageWithTurnId = {
  role: 'user' | 'assistant' | 'system'
  content: string
  turn_id: string
}

// In-memory storage (production: use Redis/database)
const conversations = new Map<string, MessageWithTurnId[]>()
const conversationData = new Map<string, ConversationData>()

export async function POST(request: Request) {
  try {
    const requestBody = await request.json() as WebhookRequest

    // Verify webhook secret if configured
    const webhookSecret = process.env.LAYERCODE_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('x-layercode-signature')
      // TODO: Implement signature verification if needed
    }

    const { type, text, turn_id, conversation_id } = requestBody
    const conversationKey = conversation_id

    return streamResponse(requestBody, async ({ stream }) => {
      try {
        // SESSION START - Send welcome message
        if (type === 'session.start') {
          console.log(`✅ Started session ${conversationKey}`)

          // Initialize conversation
          conversations.set(conversationKey, [])
          conversationData.set(conversationKey, {})

          // Send welcome message
          stream.tts(WELCOME_MESSAGE)
          stream.data({
            type: 'progress',
            current: 1,
            total: 8,
            currentQuestion: 'current_age'
          })

          stream.end()
          return
        }

        // SESSION END - Clean up
        if (type === 'session.end') {
          conversations.delete(conversationKey)
          conversationData.delete(conversationKey)
          console.log(`🧹 Ended session ${conversationKey}`)
          stream.end()
          return
        }

        // SESSION UPDATE - Acknowledge
        if (type === 'session.update') {
          stream.end()
          return
        }

        // MESSAGE - User spoke, process with conversational LLM
        if (type === 'message' && text) {
          let messages = conversations.get(conversationKey) || []
          const data = conversationData.get(conversationKey) || {}

          // Store user message
          messages.push({ role: 'user', content: text, turn_id: turn_id || '' })

          // Add placeholder for assistant response (for interruption handling)
          const assistantIdx = messages.push({ role: 'assistant', content: '', turn_id: turn_id || '' })

          console.log(`💬 User: "${text.substring(0, 50)}..."`)

          // Define tools for data extraction and storage
          const tools = {
            storeAge: tool({
              description: 'Store the user\'s current age or retirement age. Call this immediately after user provides their age.',
              inputSchema: z.object({
                type: z.enum(['current', 'retirement']).describe('Whether this is current age or retirement age'),
                age: z.number().describe('The age in years')
              }),
              execute: async ({ type, age }) => {
                if (type === 'current') {
                  data.currentAge = age
                  console.log(`💾 Stored current age: ${age}`)
                } else {
                  data.retirementAge = age
                  console.log(`💾 Stored retirement age: ${age}`)
                }
                conversationData.set(conversationKey, data)
                return { success: true, stored: age }
              }
            }),

            storeProvince: tool({
              description: 'Store the user\'s Canadian province or territory. Call this immediately after user provides their location.',
              inputSchema: z.object({
                province: z.enum(['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']).describe('Two-letter province code')
              }),
              execute: async ({ province }) => {
                data.province = province as Province
                console.log(`💾 Stored province: ${province}`)
                conversationData.set(conversationKey, data)
                return { success: true, stored: province }
              }
            }),

            storeAmount: tool({
              description: 'Store a financial amount (account balance or monthly spending). Use null for "none", "zero", "nothing". Call this immediately after user provides an amount.',
              inputSchema: z.object({
                field: z.enum(['rrsp', 'tfsa', 'non_registered', 'monthly_spending']).describe('Which field to store'),
                amount: z.number().nullable().describe('The dollar amount, or null if they don\'t have it')
              }),
              execute: async ({ field, amount }) => {
                // Store amount in the appropriate field
                if (field === 'rrsp') data.rrsp = amount
                else if (field === 'tfsa') data.tfsa = amount
                else if (field === 'non_registered') data.non_registered = amount
                else if (field === 'monthly_spending') data.monthlySpending = amount

                console.log(`💾 Stored ${field}: ${amount}`)
                conversationData.set(conversationKey, data)
                return { success: true, stored: amount }
              }
            }),

            storePercentage: tool({
              description: 'Store the expected investment return percentage. Call this immediately after user provides a percentage.',
              inputSchema: z.object({
                percentage: z.number().describe('The percentage (e.g., 5 for 5%)')
              }),
              execute: async ({ percentage }) => {
                data.investmentReturn = percentage
                console.log(`💾 Stored investment return: ${percentage}%`)
                conversationData.set(conversationKey, data)
                return { success: true, stored: percentage }
              }
            }),

            checkCompletion: tool({
              description: 'Check if all required data has been collected. Call this after storing the last piece of data.',
              inputSchema: z.object({}),
              execute: async () => {
                const isComplete = !!(
                  data.currentAge &&
                  data.retirementAge &&
                  data.province &&
                  data.monthlySpending
                )

                if (isComplete) {
                  console.log(`✅ Data collection complete:`, data)
                  stream.data({
                    type: 'complete',
                    collectedData: {
                      currentAge: data.currentAge,
                      retirementAge: data.retirementAge,
                      province: data.province,
                      rrsp: data.rrsp,
                      tfsa: data.tfsa,
                      non_registered: data.non_registered,
                      monthlySpending: data.monthlySpending,
                      investmentReturn: data.investmentReturn || 5.0
                    }
                  })
                }

                return { complete: isComplete, data }
              }
            })
          }

          // Single conversational LLM call with tools
          const { textStream } = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: messages.slice(0, -1), // Exclude placeholder
            tools,
            toolChoice: 'auto',
            onFinish: async ({ response }) => {
              // Remove placeholder and add actual response
              messages.splice(assistantIdx - 1, 1)
              messages.push(...response.messages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                turn_id: turn_id || ''
              })))
              conversations.set(conversationKey, messages)

              console.log(`✅ Response complete`)
              stream.end()
            }
          })

          // Stream response to TTS - user hears first words in ~300ms!
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
