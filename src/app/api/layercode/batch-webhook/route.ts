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
  cleanupBatchConversation,
  hasExceededRetryLimit,
  incrementRetryCount,
  saveCompletedScenarioToDatabase
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
  metadata?: {
    user_id?: string
    [key: string]: any
  }
}

/**
 * Handle retry limit exceeded - skip to next batch or complete with partial data
 * Extracted as helper to simplify main webhook logic
 */
async function handleRetryLimitExceeded(
  conversationKey: string,
  currentBatch: any,
  missingFields: string[],
  stream: any,
  userId?: string
): Promise<void> {
  console.error(`❌ Exceeded retry limit for batch ${currentBatch.id}, skipping missing fields:`, missingFields)

  const nextBatchObj = await getNextBatch(conversationKey)

  if (nextBatchObj) {
    // Not final batch - move to next batch
    const nextPrompt = getBatchPrompt(nextBatchObj.id)
    const combinedMessage = `I'm having trouble collecting all the information for this section. Let's move on and you can fill in the missing details later. ${nextPrompt}`

    stream.tts(combinedMessage)

    const progress = getBatchProgress(conversationKey)
    stream.data({
      type: 'batch_prompt',
      batchId: nextBatchObj.id,
      batchTitle: nextBatchObj.title,
      questions: nextBatchObj.questions,
      batchIndex: (progress?.current || 1) - 1,
      totalBatches: progress?.total || 0
    })
    stream.end()
  } else {
    // Final batch - complete with partial data
    console.warn(`⚠️ Completing conversation with missing fields in final batch`)
    const completionMessage = "I'll use standard assumptions for the missing information. Your retirement projection is ready!"
    await completeAndSaveConversation(conversationKey, completionMessage, stream, userId)
  }
}

/**
 * Complete the conversation and save to database
 * Extracted as helper to avoid duplication
 *
 * NOTE: Calculation is now triggered by user clicking "Calculate" button
 * instead of auto-running here. This gives users a chance to review/edit
 * the collected data before running the projection.
 */
async function completeAndSaveConversation(
  conversationKey: string,
  spokenResponse: string,
  stream: any,
  userId?: string
): Promise<void> {
  await completeBatchConversation(conversationKey)
  const collectedData = getBatchCollectedData(conversationKey)

  console.log(`✅ Batch conversation complete. Collected data:`, collectedData)

  // Use provided userId or fall back to placeholder for backwards compatibility
  const userIdToUse = userId || '00000000-0000-0000-0000-000000000000'
  console.log(`💾 Saving scenario for user: ${userIdToUse}`)

  const scenarioId = await saveCompletedScenarioToDatabase(
    conversationKey,
    userIdToUse,
    `Retirement Plan ${new Date().toLocaleDateString()}`
  )

  // Send completion data (calculation will be triggered by UI button click)
  stream.tts(spokenResponse)
  stream.data({
    type: 'complete',
    collectedData,
    scenarioId: scenarioId || undefined  // Include scenario ID if saved successfully
  })

  stream.end()
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
      return "Now for your retirement income: how much you'll need to spend each month, any pension income you expect, when you want to start CPP, and any other income sources like rental or business income."

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

    const { type, text, conversation_id, metadata } = requestBody
    const conversationKey = conversation_id
    const userId = metadata?.user_id

    if (userId) {
      console.log(`👤 User ID from session metadata: ${userId}`)
    } else {
      console.warn(`⚠️ No user_id in metadata, will use fallback placeholder`)
    }

    return streamResponse(requestBody, async ({ stream }) => {
      console.log(`🎬 Batch streamResponse started for type=${type}`)
      try {
        // SESSION START - Initialize and ask first batch
        if (type === 'session.start') {
          console.log(`📌 Handling batch session.start`)

          const state = await initializeBatchConversation(conversationKey)
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

        // SESSION END - Clean up (keep in DB for potential recovery)
        if (type === 'session.end') {
          await cleanupBatchConversation(conversationKey, false)  // Keep DB state for recovery
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
              console.warn(`⚠️ State not found for ${conversationKey}, attempting to restore from DB`)
              state = await initializeBatchConversation(conversationKey)
            }

            const currentBatch = getCurrentBatch(conversationKey)
            if (!currentBatch) {
              // Conversation already complete - silently ignore further messages
              // This prevents the AI from responding after the "Calculate" message
              console.log(`🔇 Ignoring message - conversation ${conversationKey} already complete`)
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
              confidence: Object.fromEntries(result.confidence),
              missingFields: result.missingFields
            })

            // Filter out low-confidence values (< 0.7 confidence threshold)
            const CONFIDENCE_THRESHOLD = 0.7
            const highConfidenceValues = new Map<string, any>()
            const lowConfidenceFields: string[] = []

            for (const [questionId, value] of result.values) {
              const confidence = result.confidence.get(questionId) || 0
              if (confidence >= CONFIDENCE_THRESHOLD) {
                highConfidenceValues.set(questionId, value)
              } else if (value !== undefined) {
                // Low confidence - don't store, treat as missing
                lowConfidenceFields.push(questionId)
                console.warn(`⚠️ Low confidence (${confidence.toFixed(2)}) for ${questionId}, not storing`)
              }
            }

            if (lowConfidenceFields.length > 0) {
              console.log(`📉 Rejected ${lowConfidenceFields.length} low-confidence values:`, lowConfidenceFields)
            }

            // Store only high-confidence values (merges with existing) - AUTO-SAVES TO SUPABASE
            // Note: storeBatchResponse updates the in-memory state directly, no need to reload
            await storeBatchResponse(conversationKey, currentBatch.id, highConfidenceValues, text)

            // Get ACCUMULATED values from state (already updated by storeBatchResponse)
            const updatedResponse = state.batchResponses.get(currentBatch.id)
            const accumulatedValues = updatedResponse ? updatedResponse.values : new Map<string, any>()

            // Calculate ACTUAL missing fields based on accumulated values
            // CRITICAL SEMANTICS:
            // - undefined = not in Map = user hasn't answered yet = MISSING
            // - null = in Map with null value = user said "none"/"don't have" = VALID ANSWER (not missing!)
            // - 0 or number = in Map with value = user provided value = VALID ANSWER (not missing!)
            const actuallyMissingFields = currentBatch.questions
              .filter(q => {
                return !accumulatedValues.has(q.id)  // Not in map = not collected yet
              })
              .map(q => q.id)

            console.log(`📊 Accumulated values:`, Object.fromEntries(accumulatedValues))
            console.log(`📊 Actually missing fields:`, actuallyMissingFields)

            // Send accumulated values to UI for form update
            // DON'T send progress here - only send when batch is complete
            stream.data({
              type: 'batch_response',
              batchId: currentBatch.id,
              values: Object.fromEntries(accumulatedValues),
              missingFields: actuallyMissingFields
            })

            // Check if we got all values or need clarification
            if (actuallyMissingFields.length > 0) {
              // Increment retry counter FIRST (fixes off-by-one issue)
              incrementRetryCount(conversationKey, currentBatch.id)

              // Check retry limit to prevent infinite loops
              if (hasExceededRetryLimit(conversationKey, currentBatch.id)) {
                await handleRetryLimitExceeded(conversationKey, currentBatch, actuallyMissingFields, stream, userId)
                return
              }

              // User didn't answer all questions - ask for missing ones
              console.warn(`⚠️ Missing fields in batch ${currentBatch.id}:`, actuallyMissingFields)
              stream.tts(result.spokenResponse)
              stream.end()
              return
            }

            // All values received for current batch - move to next batch (AUTO-SAVES TO SUPABASE)
            const nextBatchObj = await getNextBatch(conversationKey)

            // Send progress update NOW (batch complete, fields filled, moving to next)
            const progress = getBatchProgress(conversationKey)
            stream.data({
              type: 'batch_complete',
              completedBatchId: currentBatch.id,
              progress: progress ? {
                current: progress.current,
                total: progress.total
              } : undefined
            })

            if (nextBatchObj) {
              console.log(`📨 Sending batch_prompt for: ${nextBatchObj.id}`)
              // More batches to go - ask next batch
              const nextPrompt = getBatchPrompt(nextBatchObj.id)

              // Combine acknowledgment + natural next batch prompt
              const transitionPrompt = `${result.spokenResponse} ${nextPrompt}`

              stream.tts(transitionPrompt)

              // Send next batch data to UI
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
              // Final batch complete (SAVES TO SUPABASE)
              await completeAndSaveConversation(conversationKey, result.spokenResponse, stream, userId)
              return
            }
          } catch (error) {
            console.error('Error processing batch message:', error)

            // Provide more helpful error message based on error type
            const errorMessage = error instanceof Error && error.message.includes('parse')
              ? "I had trouble understanding that. Could you try rephrasing?"
              : "I'm sorry, I didn't quite catch that. Could you try again?"

            stream.tts(errorMessage)
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
