/**
 * Layercode Batch Voice Webhook Handler
 *
 * This endpoint handles batch-based conversation flow for test-voice-first page.
 * Questions are grouped into 3 batches (3+3+2 questions).
 *
 * Different from /api/agent which does sequential 1-by-1 questions.
 */

import { streamResponse } from '@layercode/node-server-sdk'
import {
  initializeBatchConversation,
  getBatchConversationState,
  getCurrentBatch,
  storeBatchResponse,
  getNextBatch,
  getBatchProgress,
  getBatchCollectedData,
  completeBatchConversation,
  cleanupBatchConversation
} from '@/lib/conversation/batch-flow-manager'
import { parseBatchResponse } from '@/lib/conversation/batch-parser'

export const dynamic = 'force-dynamic'

// Webhook request type
type WebhookRequest = {
  conversation_id: string
  session_id?: string
  text?: string
  turn_id?: string
  type: 'message' | 'session.start' | 'session.update' | 'session.end' | string
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json() as WebhookRequest

    console.log(`🌐 Batch webhook received: type=${requestBody.type}, conversation_id=${requestBody.conversation_id}`)

    const { type, text, conversation_id } = requestBody
    const conversationKey = conversation_id

    return streamResponse(requestBody, async ({ stream }) => {
      console.log(`🎬 Batch streamResponse started for type=${type}`)
      try {
        // SESSION START - Initialize and ask first batch
        if (type === 'session.start') {
          console.log(`📌 Handling batch session.start`)

          const state = initializeBatchConversation(conversationKey)
          const firstBatch = getCurrentBatch(conversationKey)

          if (!firstBatch) {
            throw new Error('No batches in flow')
          }

          // Generate greeting + first batch prompt
          const questionList = firstBatch.questions.map(q => `• ${q.text}`).join('\n')

          const greeting = `Hello! I'm going to help you plan for retirement. This will take about 2 minutes.

Let's start with some basics. Tell me about:
${questionList}`

          stream.tts(greeting)

          // Send batch data to UI for display
          stream.data({
            type: 'batch_prompt',
            batchId: firstBatch.id,
            batchTitle: firstBatch.title,
            questions: firstBatch.questions,
            batchIndex: 0,
            totalBatches: state.batches.length
          })

          console.log(`💬 Sent greeting with first batch (${firstBatch.questions.length} questions)`)

          stream.end()
          return
        }

        // SESSION END - Clean up
        if (type === 'session.end') {
          cleanupBatchConversation(conversationKey)
          console.log(`🧹 Ended batch conversation ${conversationKey}`)
          stream.end()
          return
        }

        // SESSION UPDATE - Acknowledge
        if (type === 'session.update') {
          stream.end()
          return
        }

        // MESSAGE - User spoke, parse batch response
        if (type === 'message' && text) {
          try {
            let state = getBatchConversationState(conversationKey)
            if (!state) {
              console.warn(`⚠️ State not found for ${conversationKey}, reinitializing`)
              state = initializeBatchConversation(conversationKey)
            }

            const currentBatch = getCurrentBatch(conversationKey)
            if (!currentBatch) {
              // Conversation complete
              const collectedData = getBatchCollectedData(conversationKey)
              console.log(`✅ Batch conversation complete. Collected data:`, collectedData)

              stream.tts("Perfect! I have everything I need. I'm now calculating your retirement projection.")
              stream.data({
                type: 'complete',
                collectedData
              })

              stream.end()
              return
            }

            console.log(`💬 User answered batch "${currentBatch.id}": "${text.substring(0, 50)}..."`)

            // Peek at next batch for response generation
            const nextBatch = state.batches[state.currentBatchIndex + 1] || null

            // Parse batch response (all questions at once)
            const result = await parseBatchResponse(currentBatch, text, nextBatch)

            console.log(`📊 Batch parse result:`, {
              values: Object.fromEntries(result.values),
              missingFields: result.missingFields
            })

            // Store all parsed values
            storeBatchResponse(conversationKey, currentBatch.id, result.values, text)

            // Send parsed values to UI for form update
            stream.data({
              type: 'batch_response',
              batchId: currentBatch.id,
              values: Object.fromEntries(result.values),
              missingFields: result.missingFields
            })

            // Check if we got all values or need clarification
            if (result.missingFields.length > 0) {
              // User didn't answer all questions - ask for missing ones
              console.warn(`⚠️ Missing fields in batch ${currentBatch.id}:`, result.missingFields)
              stream.tts(result.spokenResponse)
              stream.end()
              return
            }

            // All values received - move to next batch
            const nextBatchObj = getNextBatch(conversationKey)

            if (nextBatchObj) {
              // More batches to go - ask next batch
              const questionList = nextBatchObj.questions.map(q => `• ${q.text}`).join('\n')

              const batchPrompt = `${result.spokenResponse}

${nextBatchObj.title}:
${questionList}`

              stream.tts(batchPrompt)

              // Send next batch data to UI
              const progress = getBatchProgress(conversationKey)
              stream.data({
                type: 'batch_prompt',
                batchId: nextBatchObj.id,
                batchTitle: nextBatchObj.title,
                questions: nextBatchObj.questions,
                batchIndex: progress?.current || 0,
                totalBatches: progress?.total || 0
              })

              stream.end()
              return
            } else {
              // Final batch complete
              completeBatchConversation(conversationKey)
              const collectedData = getBatchCollectedData(conversationKey)

              console.log(`✅ Batch conversation complete. Collected data:`, collectedData)

              stream.tts(result.spokenResponse)
              stream.data({
                type: 'complete',
                collectedData
              })

              stream.end()
              return
            }
          } catch (error) {
            console.error('Error processing batch message:', error)
            stream.tts("I'm sorry, I didn't quite catch that. Could you try again?")
            stream.end()
            return
          }
        }

        stream.end()
      } catch (error) {
        console.error('Error in batch webhook handler:', error)
        stream.tts("I apologize, but I encountered an error. Please try again.")
        stream.end()
      }
    })
  } catch (error) {
    console.error('Batch webhook error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
