/**
 * Layercode Voice Webhook Handler
 *
 * This endpoint receives Server-Sent Events (SSE) from Layercode's voice agent.
 * It handles the conversation flow for retirement planning data collection.
 *
 * Event types:
 * - session.start: New conversation started
 * - message: User spoke (text is already transcribed by Layercode STT)
 * - session.end: Conversation ended
 * - session.update: Session metadata updated
 * - user.transcript.interim_delta: Real-time transcription (informational only)
 */

import { streamResponse } from '@layercode/node-server-sdk'
import { getAIProvider } from '@/lib/ai-provider'
import {
  initializeConversation,
  getConversationState,
  getCurrentQuestion,
  storeResponse,
  getNextQuestion,
  getProgress,
  getCollectedData,
  completeConversation,
  cleanupConversation
} from '@/lib/conversation/question-flow-manager'

export const dynamic = 'force-dynamic'

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
  type: 'message' | 'session.start' | 'session.update' | 'session.end' | 'user.transcript.interim_delta' | string
  content?: string
  delta_counter?: number
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json() as WebhookRequest

    // Verify webhook secret if configured
    const webhookSecret = process.env.LAYERCODE_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('x-layercode-signature')
      // TODO: Implement signature verification if needed
    }

    // Handle different webhook event types
    const { type, text, turn_id, session_id, conversation_id, interruption_context } = requestBody

    // Use conversation_id as the primary key
    const conversationKey = conversation_id || session_id || 'unknown'

    return streamResponse(requestBody, async ({ stream }) => {
      try {
        // SESSION START - Initialize conversation and ask first question
        if (type === 'session.start') {
          try {
            console.log(`✅ Started retirement planning session ${conversationKey}`)

            // Initialize conversation state with question flow
            const state = initializeConversation(conversationKey)
            const firstQuestion = getCurrentQuestion(conversationKey)

            if (!firstQuestion) {
              throw new Error('No questions in flow')
            }

            // Generate natural greeting + first question using AI (STREAMED for low latency!)
            const aiProvider = getAIProvider()
            const greetingStream = await aiProvider.generateStream([
              {
                role: 'system',
                content: `You are a friendly Canadian retirement planning assistant. Greet the user warmly (1 sentence), mention this will take about 2 minutes, then ask the EXACT question provided. Do not rephrase the question. Be conversational and encouraging.`
              },
              {
                role: 'user',
                content: `Ask this question word-for-word: "${firstQuestion.text}"`
              }
            ], { temperature: 0.7, maxTokens: 100 })

            // Stream greeting via text-to-speech (user hears first words in ~300ms!)
            await stream.ttsTextStream(greetingStream)

            // Send progress data
            stream.data({
              type: 'progress',
              current: 1,
              total: state.questionFlow.questions.length,
              currentQuestion: firstQuestion.id
            })

            console.log(`💬 Sent greeting with first question (streamed for low latency)`)
          } catch (error) {
            console.error('Error initializing session:', error)
            stream.tts("I'm sorry, there was an error starting our conversation. Please try again.")
          }

          stream.end()
          return
        }

        // SESSION END - Clean up conversation state
        if (type === 'session.end') {
          cleanupConversation(conversationKey)
          console.log(`🧹 Ended retirement planning session ${conversationKey}`)
          stream.end()
          return
        }

        // SESSION UPDATE - Acknowledge
        if (type === 'session.update') {
          stream.end()
          return
        }

        // INTERIM TRANSCRIPT - Informational only, no response needed
        if (type === 'user.transcript.interim_delta') {
          stream.end()
          return
        }

        // MESSAGE - User spoke, process their answer
        if (type === 'message' && text) {
          try {
            let state = getConversationState(conversationKey)
            if (!state) {
              // Session might have been lost, reinitialize
              console.warn(`⚠️ State not found for ${conversationKey}, reinitializing`)
              state = initializeConversation(conversationKey)
            }

            const currentQuestion = getCurrentQuestion(conversationKey)
            if (!currentQuestion) {
              // Conversation complete - send summary (STREAMED)
              const collectedData = getCollectedData(conversationKey)
              console.log(`✅ Conversation complete. Collected data:`, collectedData)

              const aiProvider = getAIProvider()
              const summaryStream = await aiProvider.generateStream([
                {
                  role: 'system',
                  content: `You've just finished collecting retirement planning data from a user. Thank them warmly and mention that you'll now calculate their retirement projection. Keep it brief (2 sentences).`
                },
                {
                  role: 'user',
                  content: `User's data: Age ${collectedData.currentAge}, retiring at ${collectedData.retirementAge}, in ${collectedData.province}`
                }
              ], { temperature: 0.7, maxTokens: 80 })

              await stream.ttsTextStream(summaryStream)
              stream.data({
                type: 'complete',
                collectedData
              })

              stream.end()
              return
            }

            console.log(`💬 User answered "${currentQuestion.id}": "${text.substring(0, 50)}..."`)

            // Store response (this parses and validates using LLM)
            const response = await storeResponse(conversationKey, currentQuestion.id, currentQuestion.text, text)

            console.log(`📊 Parse result:`, { response, parsedValue: response?.parsedValue })

            // Check if parse failed (null is OK for optional questions!)
            const parseFailed = !response || (response.parsedValue === null && currentQuestion.required)

            console.log(`🔍 Parse failed check:`, { parseFailed, hasResponse: !!response, parsedValue: response?.parsedValue, required: currentQuestion.required })

            if (parseFailed) {
              console.warn(`⚠️ Parse failed for ${currentQuestion.id}`)

              // Failed to parse - ask for clarification (STREAMED)
              const aiProvider = getAIProvider()
              const clarificationStream = await aiProvider.generateStream([
                {
                  role: 'system',
                  content: `The user's answer to your question wasn't clear. Politely ask them to rephrase, then repeat the EXACT question word-for-word. Do not rephrase the question. Be warm and encouraging. Keep it brief (under 30 words).`
                },
                {
                  role: 'user',
                  content: `Question was: "${currentQuestion.text}"\nThey said: "${text}"\n\nAsk for clarification and repeat the question word-for-word:`
                }
              ], { temperature: 0.7, maxTokens: 100 })

              await stream.ttsTextStream(clarificationStream)
              stream.end()
              return
            }

            console.log(`💾 Parsed value: ${response.parsedValue}`)

            // Get next question
            const nextQuestion = getNextQuestion(conversationKey, text)

            if (nextQuestion) {
              // Generate natural transition to next question (STREAMED)
              const aiProvider = getAIProvider()
              const transitionStream = await aiProvider.generateStream([
                {
                  role: 'system',
                  content: `You're collecting retirement planning info. The user just answered. Say a brief acknowledgment like "got it", "thanks", or "perfect", then ask the EXACT question provided word-for-word. Do not rephrase the question. Keep it under 25 words total.`
                },
                {
                  role: 'user',
                  content: `Ask this question word-for-word: "${nextQuestion.text}"`
                }
              ], { temperature: 0.7, maxTokens: 80 })

              await stream.ttsTextStream(transitionStream)

              // Send progress with parsed value for debugging
              const progress = getProgress(conversationKey)
              if (progress) {
                stream.data({
                  type: 'progress',
                  current: progress.current,
                  total: progress.total,
                  currentQuestion: nextQuestion.id,
                  lastAnswer: {
                    questionId: currentQuestion.id,
                    rawText: text,
                    parsedValue: response.parsedValue
                  }
                })
              }
            } else {
              // Final question - wrap up
              completeConversation(conversationKey)
              const collectedData = getCollectedData(conversationKey)

              console.log(`✅ Conversation complete. Collected data:`, collectedData)

              const aiProvider = getAIProvider()
              const thanksStream = await aiProvider.generateStream([
                {
                  role: 'system',
                  content: `You've finished collecting retirement planning data. Thank the user warmly and mention you're now calculating their retirement projection. Keep it brief (2 sentences).`
                },
                {
                  role: 'user',
                  content: `Final answer was: "${text}"`
                }
              ], { temperature: 0.7, maxTokens: 80 })

              await stream.ttsTextStream(thanksStream)

              stream.data({
                type: 'complete',
                collectedData
              })
            }
          } catch (error) {
            console.error('Error processing message:', error)
            stream.tts("I'm sorry, I didn't quite catch that. Could you try again?")
            stream.end()
            return
          }
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
