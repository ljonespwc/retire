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

/**
 * Generate natural conversational prompt for a batch
 * Instead of reading all questions verbatim, summarize naturally
 */
function getBatchPrompt(batchId: string): string {
  switch (batchId) {
    case 'personal_info':
      return "Let's start with some basics: your current age, when you plan to retire, how long you expect to live, which province you're in, and your current income."

    case 'savings':
      return "Now tell me about your current savings: your RRSP, TFSA, and any non-registered investments. Just say 'none' if you don't have any."

    case 'savings_contributions':
      return "How much do you contribute each year to your RRSP, TFSA, and non-registered accounts? Again, say 'none' if you don't contribute to any."

    case 'retirement_income':
      return "Now for your retirement income: how much you'll need to spend each month, any pension income you expect, and when you want to start CPP."

    case 'investment_assumptions':
      return "Finally, your investment expectations: what return you expect before and after retirement, and what inflation rate to plan for. If you're not sure, I'll use standard assumptions of 6%, 4%, and 2%."

    default:
      return "Tell me about this information."
  }
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
          const firstBatch = state.batches[state.currentBatchIndex]

          if (!firstBatch) {
            throw new Error('No batches in flow')
          }

          // Generate greeting + first batch prompt
          const batchPrompt = getBatchPrompt(firstBatch.id)
          const greeting = `Hello! I'm going to help you plan for retirement. This will take about 2 minutes. ${batchPrompt}`

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

            // Get existing accumulated values before parsing
            const existingResponse = state.batchResponses.get(currentBatch.id)
            const existingValues = existingResponse ? existingResponse.values : new Map<string, any>()

            // Peek at next batch for response generation
            const nextBatch = state.batches[state.currentBatchIndex + 1] || null

            // Parse batch response (all questions at once)
            const result = await parseBatchResponse(currentBatch, text, nextBatch, existingValues)

            console.log(`📊 Batch parse result:`, {
              values: Object.fromEntries(result.values),
              missingFields: result.missingFields
            })

            // Store all parsed values (merges with existing)
            storeBatchResponse(conversationKey, currentBatch.id, result.values, text)

            // Reload state to get ACCUMULATED values after storing
            state = getBatchConversationState(conversationKey)
            if (!state) throw new Error('State lost after storing')

            const updatedResponse = state.batchResponses.get(currentBatch.id)
            const accumulatedValues = updatedResponse ? updatedResponse.values : new Map<string, any>()

            // Calculate ACTUAL missing fields based on accumulated values
            // Note: null is VALID (means "none"), only undefined means not collected yet
            const actuallyMissingFields = currentBatch.questions
              .filter(q => {
                return !accumulatedValues.has(q.id)  // Not in map = not collected
              })
              .map(q => q.id)

            console.log(`📊 Accumulated values:`, Object.fromEntries(accumulatedValues))
            console.log(`📊 Actually missing fields:`, actuallyMissingFields)

            // Send accumulated values to UI for form update
            stream.data({
              type: 'batch_response',
              batchId: currentBatch.id,
              values: Object.fromEntries(accumulatedValues),
              missingFields: actuallyMissingFields
            })

            // Check if we got all values or need clarification
            if (actuallyMissingFields.length > 0) {
              // User didn't answer all questions - ask for missing ones
              console.warn(`⚠️ Missing fields in batch ${currentBatch.id}:`, actuallyMissingFields)
              stream.tts(result.spokenResponse)
              stream.end()
              return
            }

            // All values received - move to next batch
            const nextBatchObj = getNextBatch(conversationKey)

            if (nextBatchObj) {
              console.log(`📨 Sending batch_prompt for: ${nextBatchObj.id}`)
              // More batches to go - ask next batch
              const nextPrompt = getBatchPrompt(nextBatchObj.id)

              // Combine acknowledgment + natural next batch prompt
              const transitionPrompt = `${result.spokenResponse} ${nextPrompt}`

              stream.tts(transitionPrompt)

              // Send next batch data to UI
              const progress = getBatchProgress(conversationKey)
              stream.data({
                type: 'batch_prompt',
                batchId: nextBatchObj.id,
                batchTitle: nextBatchObj.title,
                questions: nextBatchObj.questions,
                batchIndex: (progress?.current || 1) - 1,  // Convert 1-indexed to 0-indexed for UI
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
