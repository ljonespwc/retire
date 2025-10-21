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
        // SESSION START - Greet the user
        if (type === 'session.start') {
          try {
            console.log(`✅ Started retirement planning session ${conversationKey}`)

            // Generate greeting using AI
            const aiProvider = getAIProvider()
            const greeting = await aiProvider.generateCompletion([
              {
                role: 'system',
                content: `You are a friendly Canadian retirement planning assistant. Greet the user warmly and briefly explain you'll help them plan their retirement through a natural conversation. Be conversational and encouraging. Keep it under 30 words.`
              },
              {
                role: 'user',
                content: 'Start the conversation'
              }
            ], { temperature: 0.7, maxTokens: 100 })

            // Send greeting via text-to-speech
            stream.tts(greeting.trim())

            // Send initial progress data
            stream.data({
              type: 'session_started',
              message: 'Retirement planning session started'
            })

            console.log(`💬 Sent greeting: "${greeting.substring(0, 50)}..."`)
          } catch (error) {
            console.error('Error initializing session:', error)
            stream.tts("I'm sorry, there was an error starting our conversation. Please try again.")
          }

          stream.end()
          return
        }

        // SESSION END - Clean up
        if (type === 'session.end') {
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

        // MESSAGE - User spoke, text is already transcribed by Layercode
        if (type === 'message' && text) {
          try {
            console.log(`💬 User said: "${text.substring(0, 100)}..."`)

            // Generate AI response (for now, just acknowledge - full flow in Section 2)
            const aiProvider = getAIProvider()
            const response = await aiProvider.generateCompletion([
              {
                role: 'system',
                content: `You are a friendly Canadian retirement planning assistant. The user is talking to you about their retirement. Acknowledge what they said naturally and ask a simple follow-up question to keep the conversation going. Be warm and conversational. Keep it brief (under 40 words).`
              },
              {
                role: 'user',
                content: `User said: "${text}"\n\nYour response:`
              }
            ], { temperature: 0.7, maxTokens: 150 })

            // Send response via TTS
            stream.tts(response.trim())

            console.log(`🤖 AI response: "${response.substring(0, 50)}..."`)
          } catch (error) {
            console.error('Error processing message:', error)
            stream.tts("I'm sorry, I didn't quite catch that. Could you try again?")
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
