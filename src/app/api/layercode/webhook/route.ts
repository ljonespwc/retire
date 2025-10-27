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
 *
 * Local Development:
 * Use Layercode CLI tunnel for faster, more reliable local testing:
 *   npm run dev:tunnel
 * This automatically handles webhook URL configuration without manual ngrok setup.
 */

import { streamResponse } from '@layercode/node-server-sdk'
import { getAIProvider } from '@/lib/ai-provider'
import {
  initializeConversation,
  getConversationState,
  getCurrentQuestion,
  peekNextQuestion,
  getProgress,
  getCollectedData,
  completeConversation,
  cleanupConversation
} from '@/lib/conversation/question-flow-manager'
import { parseAndGenerateResponse } from '@/lib/conversation/llm-parser'

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

    console.log(`🌐 Webhook received: type=${requestBody.type}, conversation_id=${requestBody.conversation_id}`)

    // Verify webhook secret if configured
    const webhookSecret = process.env.LAYERCODE_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('x-layercode-signature')
      // TODO: Implement signature verification if needed
    }

    // Handle different webhook event types
    const { type, text, turn_id, session_id, conversation_id, interruption_context } = requestBody

    console.log(`📝 Event details: type=${type}, text="${text?.substring(0, 50)}", conversation_id=${conversation_id}`)

    // Use conversation_id as the primary key
    const conversationKey = conversation_id || session_id || 'unknown'

    return streamResponse(requestBody, async ({ stream }) => {
      console.log(`🎬 streamResponse started for type=${type}`)
      try {
        // SESSION START - Initialize conversation and ask first question
        if (type === 'session.start') {
          console.log(`📌 Handling session.start`)
          try {
            console.log(`✅ Started retirement planning session ${conversationKey}`)

            // Initialize conversation state with question flow
            const state = initializeConversation(conversationKey)
            console.log(`🔑 State created for ${conversationKey}, has ${state.questionFlow.questions.length} questions`)

            const firstQuestion = getCurrentQuestion(conversationKey)
            console.log(`❓ First question: ${firstQuestion?.id}`)

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

            // Send minimal progress data (reduced payload for performance)
            stream.data({ type: 'progress', current: 1, total: state.questionFlow.questions.length })

            console.log(`💬 Sent greeting with first question (streamed for low latency)`)
          } catch (error) {
            console.error('Error initializing session:', error)
            stream.tts("I'm sorry, there was an error starting our conversation. Please try again.")
          }

          console.log(`🏁 session.start completed for ${conversationKey}`)
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
              // Conversation complete - send summary
              const collectedData = getCollectedData(conversationKey)

              stream.tts("Thank you! I'm now calculating your retirement projection.")
              stream.data({
                type: 'complete',
                collectedData
              })

              stream.end()
              return
            }

            console.log(`💬 User answered "${currentQuestion.id}": "${text.substring(0, 50)}..."`)

            // Peek ahead to get next question (we need this for the combined LLM call)
            // Note: Use peek, not get - we'll advance state manually after storing response
            const nextQuestion = peekNextQuestion(conversationKey)

            // COMBINED LLM CALL: Parse answer AND generate response in one shot
            const result = await parseAndGenerateResponse(currentQuestion, text, nextQuestion)

            if (!result.isValid) {
              // Parse failed - LLM already generated clarification response
              console.warn(`⚠️ Parse failed for ${currentQuestion.id}`)
              stream.tts(result.spokenResponse)
              stream.end()
              return
            }

            // Manually store the parsed response (we already did the parsing)
            state.responses.set(currentQuestion.id, {
              questionId: currentQuestion.id,
              questionText: currentQuestion.text,
              rawText: text,
              parsedValue: result.parsedValue,
              timestamp: new Date()
            })

            // Move to next question
            state.currentQuestionIndex++

            // Speak the response (already generated by LLM)
            stream.tts(result.spokenResponse)

            if (nextQuestion) {
              // Send minimal progress
              const progress = getProgress(conversationKey)
              if (progress) {
                stream.data({ type: 'progress', current: progress.current, total: progress.total })
              }
            } else {
              // Final question - mark complete
              completeConversation(conversationKey)
              const collectedData = getCollectedData(conversationKey)

              stream.data({
                type: 'complete',
                collectedData
              })
            }

            stream.end()
            return
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
