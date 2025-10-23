/**
 * Batch Question Flow Manager for Retirement Planning
 *
 * Groups questions into contextual batches for more natural conversation.
 * Used by test-voice-first page for batch-based data collection.
 *
 * State is persisted to Supabase database for resilience.
 */

import { Province } from '@/types/constants'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Supabase client for state persistence (using service role to bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

/**
 * Question batch definition
 */
export interface QuestionBatch {
  id: string
  title: string
  questions: {
    id: string
    text: string
    type: 'age' | 'amount' | 'province' | 'percentage'
  }[]
}

/**
 * Batch response (all values for one batch)
 */
export interface BatchResponse {
  batchId: string
  values: Map<string, any>  // questionId -> parsed value
  rawText: string
  timestamp: Date
}

/**
 * Batch conversation state
 */
export interface BatchConversationState {
  conversationId: string
  currentBatchIndex: number
  batchResponses: Map<string, BatchResponse>  // batchId -> response
  batches: QuestionBatch[]
  startedAt: Date
  completedAt?: Date
  retryCount: Map<string, number>  // batchId -> retry count (prevents infinite loops)
}

/**
 * Question batches for retirement planning
 */
const RETIREMENT_BATCHES: QuestionBatch[] = [
  {
    id: 'personal_info',
    title: 'Tell me about yourself',
    questions: [
      {
        id: 'current_age',
        text: 'Your current age',
        type: 'age'
      },
      {
        id: 'retirement_age',
        text: 'When you plan to retire',
        type: 'age'
      },
      {
        id: 'longevity_age',
        text: 'How long you expect to live (most people say 90 or 95)',
        type: 'age'
      },
      {
        id: 'province',
        text: 'Which province or territory you live in',
        type: 'province'
      },
      {
        id: 'current_income',
        text: 'Your current annual income before taxes',
        type: 'amount'
      }
    ]
  },
  {
    id: 'savings',
    title: 'Tell me about your current savings',
    questions: [
      {
        id: 'rrsp_amount',
        text: "Your RRSP balance (say 'none' if you don't have one)",
        type: 'amount'
      },
      {
        id: 'tfsa_amount',
        text: "Your TFSA balance (say 'none' if you don't have one)",
        type: 'amount'
      },
      {
        id: 'non_registered_amount',
        text: "Your non-registered investments (say 'none' if you don't have any)",
        type: 'amount'
      }
    ]
  },
  {
    id: 'savings_contributions',
    title: 'Tell me about your annual contributions',
    questions: [
      {
        id: 'rrsp_contribution',
        text: "How much you contribute to RRSP each year (say 'none' if you don't)",
        type: 'amount'
      },
      {
        id: 'tfsa_contribution',
        text: "How much you contribute to TFSA each year (say 'none' if you don't)",
        type: 'amount'
      },
      {
        id: 'non_registered_contribution',
        text: "How much you contribute to non-registered accounts each year (say 'none' if you don't)",
        type: 'amount'
      }
    ]
  },
  {
    id: 'retirement_income',
    title: 'Tell me about your retirement income',
    questions: [
      {
        id: 'monthly_spending',
        text: 'How much you think you\'ll need to spend each month in retirement',
        type: 'amount'
      },
      {
        id: 'pension_income',
        text: "Expected annual pension income (say 'none' if you don't have a pension)",
        type: 'amount'
      },
      {
        id: 'cpp_start_age',
        text: 'At what age you want to start receiving CPP (between 60 and 70, say 65 if unsure)',
        type: 'age'
      }
    ]
  },
  {
    id: 'investment_assumptions',
    title: 'Tell me about your investment expectations',
    questions: [
      {
        id: 'investment_return',
        text: 'Expected annual return before retirement (say 5% if unsure)',
        type: 'percentage'
      },
      {
        id: 'post_retirement_return',
        text: 'Expected annual return after retirement (say 4% if unsure)',
        type: 'percentage'
      },
      {
        id: 'inflation_rate',
        text: 'Expected inflation rate for planning (say 2% if unsure)',
        type: 'percentage'
      }
    ]
  }
]

/**
 * In-memory conversation state cache (for performance)
 * Also persisted to Supabase for resilience against serverless cold starts
 */
const conversationStates = new Map<string, BatchConversationState>()

/**
 * Save conversation state to Supabase (for resilience)
 */
async function saveConversationStateToDb(state: BatchConversationState): Promise<void> {
  try {
    // Convert Map to plain objects for JSON storage
    const batchResponsesObj: Record<string, {
      batchId: string
      values: Record<string, any>
      rawText: string
      timestamp: string
    }> = {}

    for (const [batchId, response] of state.batchResponses) {
      batchResponsesObj[batchId] = {
        batchId: response.batchId,
        values: Object.fromEntries(response.values),
        rawText: response.rawText,
        timestamp: response.timestamp.toISOString()
      }
    }

    const stateJson = {
      conversationId: state.conversationId,
      currentBatchIndex: state.currentBatchIndex,
      batchResponses: batchResponsesObj,
      batches: state.batches,
      startedAt: state.startedAt.toISOString(),
      completedAt: state.completedAt?.toISOString(),
      retryCount: Object.fromEntries(state.retryCount)
    }

    const { error } = await supabase
      .from('conversation_states')
      .upsert({
        conversation_id: state.conversationId,
        state: stateJson as any,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error(`❌ Failed to save conversation state to DB:`, error)
    } else {
      console.log(`💾 Saved conversation ${state.conversationId} to Supabase`)
    }
  } catch (error) {
    console.error(`❌ Error saving conversation state:`, error)
  }
}

/**
 * Load conversation state from Supabase
 */
async function loadConversationStateFromDb(conversationId: string): Promise<BatchConversationState | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_states')
      .select('state')
      .eq('conversation_id', conversationId)
      .single()

    if (error || !data) {
      console.log(`📭 No saved state found for conversation ${conversationId}`)
      return null
    }

    const stateJson = data.state as any

    // Reconstruct Map from plain objects
    const batchResponses = new Map<string, BatchResponse>()
    for (const [batchId, responseData] of Object.entries(stateJson.batchResponses || {})) {
      const rd = responseData as any
      batchResponses.set(batchId, {
        batchId: rd.batchId,
        values: new Map(Object.entries(rd.values)),
        rawText: rd.rawText,
        timestamp: new Date(rd.timestamp)
      })
    }

    const state: BatchConversationState = {
      conversationId: stateJson.conversationId,
      currentBatchIndex: stateJson.currentBatchIndex,
      batchResponses,
      batches: stateJson.batches,
      startedAt: new Date(stateJson.startedAt),
      completedAt: stateJson.completedAt ? new Date(stateJson.completedAt) : undefined,
      retryCount: new Map(Object.entries(stateJson.retryCount || {}))
    }

    console.log(`📂 Loaded conversation ${conversationId} from Supabase`)
    return state
  } catch (error) {
    console.error(`❌ Error loading conversation state:`, error)
    return null
  }
}

/**
 * Initialize a new batch conversation
 * Now async to support loading from Supabase
 */
export async function initializeBatchConversation(conversationId: string): Promise<BatchConversationState> {
  // Try to load existing state from DB first
  const existingState = await loadConversationStateFromDb(conversationId)
  if (existingState) {
    conversationStates.set(conversationId, existingState)
    console.log(`📂 Restored batch conversation ${conversationId} from database`)
    return existingState
  }

  // Create new state
  const state: BatchConversationState = {
    conversationId,
    currentBatchIndex: 0,
    batchResponses: new Map(),
    batches: RETIREMENT_BATCHES,
    startedAt: new Date(),
    retryCount: new Map()
  }

  conversationStates.set(conversationId, state)

  // Save to DB immediately
  await saveConversationStateToDb(state)

  console.log(`📋 Initialized new batch conversation ${conversationId} with ${RETIREMENT_BATCHES.length} batches`)

  return state
}

/**
 * Get batch conversation state
 */
export function getBatchConversationState(conversationId: string): BatchConversationState | null {
  return conversationStates.get(conversationId) || null
}

/**
 * Get current batch
 */
export function getCurrentBatch(conversationId: string): QuestionBatch | null {
  const state = conversationStates.get(conversationId)
  if (!state) return null

  if (state.currentBatchIndex >= state.batches.length) {
    return null // Conversation complete
  }

  return state.batches[state.currentBatchIndex]
}

/**
 * Check if batch has exceeded retry limit
 * Returns true if should skip batch due to too many retries
 */
export function hasExceededRetryLimit(conversationId: string, batchId: string): boolean {
  const state = conversationStates.get(conversationId)
  if (!state) return false

  const MAX_RETRIES = 3
  const retries = state.retryCount.get(batchId) || 0
  return retries >= MAX_RETRIES
}

/**
 * Increment retry count for a batch
 */
export function incrementRetryCount(conversationId: string, batchId: string): number {
  const state = conversationStates.get(conversationId)
  if (!state) return 0

  const currentCount = state.retryCount.get(batchId) || 0
  const newCount = currentCount + 1
  state.retryCount.set(batchId, newCount)

  console.log(`🔁 Retry count for ${batchId}: ${newCount}`)
  return newCount
}

/**
 * Store batch response and move to next batch
 * Merges new values with existing values (accumulates across multiple turns)
 * Now async to support auto-save to Supabase
 */
export async function storeBatchResponse(
  conversationId: string,
  batchId: string,
  values: Map<string, any>,
  rawText: string
): Promise<boolean> {
  const state = conversationStates.get(conversationId)
  if (!state) {
    console.error(`❌ No state found for conversation ${conversationId}`)
    return false
  }

  // Get existing response if any
  const existingResponse = state.batchResponses.get(batchId)

  // Merge new values with existing values
  // Strategy: Update fields that were mentioned in this response
  const mergedValues = new Map<string, any>()

  // Start with existing values
  if (existingResponse) {
    for (const [key, value] of existingResponse.values) {
      mergedValues.set(key, value)
    }
  }

  // Overlay new values
  // IMPORTANT SEMANTICS:
  // - undefined = not mentioned (don't store, still missing)
  // - null = user said "none"/"don't have" (STORE as valid answer)
  // - 0 or any number = actual value (STORE)
  for (const [key, value] of values) {
    if (value !== undefined) {
      mergedValues.set(key, value)  // Store all non-undefined values (including null and 0)
    }
  }

  const response: BatchResponse = {
    batchId,
    values: mergedValues,
    rawText: existingResponse ? `${existingResponse.rawText} ${rawText}` : rawText,
    timestamp: new Date()
  }

  state.batchResponses.set(batchId, response)
  console.log(`💾 Stored batch response for ${batchId}:`, Object.fromEntries(mergedValues))

  // Auto-save to Supabase
  await saveConversationStateToDb(state)

  return true
}

/**
 * Move to next batch
 * Now async to support auto-save
 */
export async function getNextBatch(conversationId: string): Promise<QuestionBatch | null> {
  const state = conversationStates.get(conversationId)
  if (!state) {
    console.error(`❌ getNextBatch: No state found for ${conversationId}`)
    return null
  }

  const currentIndex = state.currentBatchIndex
  console.log(`📦 getNextBatch: Currently on batch #${currentIndex + 1} (${state.batches[currentIndex]?.id}), moving to next...`)

  // Move to next batch
  state.currentBatchIndex++

  if (state.currentBatchIndex >= state.batches.length) {
    state.completedAt = new Date()
    console.log(`✅ Batch conversation ${conversationId} completed - no more batches (was on #${currentIndex + 1} of ${state.batches.length})`)

    // Save completion to DB
    await saveConversationStateToDb(state)
    return null
  }

  const nextBatch = state.batches[state.currentBatchIndex]
  console.log(`➡️ getNextBatch: Moved to batch #${state.currentBatchIndex + 1} (${nextBatch.id})`)

  // Auto-save progress
  await saveConversationStateToDb(state)

  return nextBatch
}

/**
 * Get progress (current batch / total batches)
 */
export function getBatchProgress(conversationId: string): { current: number; total: number } | null {
  const state = conversationStates.get(conversationId)
  if (!state) return null

  return {
    current: state.currentBatchIndex + 1,
    total: state.batches.length
  }
}

/**
 * Get all collected data formatted for calculator
 */
export function getBatchCollectedData(conversationId: string): {
  currentAge?: number
  retirementAge?: number
  longevityAge?: number
  province?: Province
  currentIncome?: number
  rrsp?: number | null
  rrspContribution?: number | null
  tfsa?: number | null
  tfsaContribution?: number | null
  non_registered?: number | null
  nonRegisteredContribution?: number | null
  monthlySpending?: number
  pensionIncome?: number | null
  cppStartAge?: number
  investmentReturn?: number
  postRetirementReturn?: number
  inflationRate?: number
} {
  const state = conversationStates.get(conversationId)
  if (!state) return {}

  // Flatten all batch responses into single object
  const allValues = new Map<string, any>()
  for (const batchResponse of state.batchResponses.values()) {
    for (const [questionId, value] of batchResponse.values) {
      allValues.set(questionId, value)
    }
  }

  return {
    currentAge: allValues.get('current_age'),
    retirementAge: allValues.get('retirement_age'),
    longevityAge: allValues.get('longevity_age'),
    province: allValues.get('province'),
    currentIncome: allValues.get('current_income'),
    rrsp: allValues.get('rrsp_amount'),
    rrspContribution: allValues.get('rrsp_contribution'),
    tfsa: allValues.get('tfsa_amount'),
    tfsaContribution: allValues.get('tfsa_contribution'),
    non_registered: allValues.get('non_registered_amount'),
    nonRegisteredContribution: allValues.get('non_registered_contribution'),
    monthlySpending: allValues.get('monthly_spending'),
    pensionIncome: allValues.get('pension_income'),
    cppStartAge: allValues.get('cpp_start_age') || 65,
    investmentReturn: allValues.get('investment_return') || 6.0,
    postRetirementReturn: allValues.get('post_retirement_return') || 4.0,
    inflationRate: allValues.get('inflation_rate') || 2.0
  }
}

/**
 * Mark batch conversation as complete
 * Now async to support save
 */
export async function completeBatchConversation(conversationId: string): Promise<void> {
  const state = conversationStates.get(conversationId)
  if (state) {
    state.completedAt = new Date()
    await saveConversationStateToDb(state)
    console.log(`✅ Marked batch conversation ${conversationId} as complete`)
  }
}

/**
 * Clean up batch conversation (remove from memory and optionally from DB)
 * Now async to support DB deletion
 */
export async function cleanupBatchConversation(conversationId: string, deleteFromDb = false): Promise<void> {
  conversationStates.delete(conversationId)

  if (deleteFromDb) {
    try {
      await supabase
        .from('conversation_states')
        .delete()
        .eq('conversation_id', conversationId)
      console.log(`🧹 Cleaned up batch conversation ${conversationId} from memory and DB`)
    } catch (error) {
      console.error(`❌ Error deleting conversation from DB:`, error)
    }
  } else {
    console.log(`🧹 Cleaned up batch conversation ${conversationId} from memory`)
  }
}

/**
 * Save completed conversation as a permanent scenario
 *
 * @param conversationId - The conversation ID to save
 * @param userId - The user ID who owns this scenario
 * @param scenarioName - Optional name for the scenario (defaults to auto-generated)
 * @returns The created scenario ID, or null if failed
 */
export async function saveCompletedScenarioToDatabase(
  conversationId: string,
  userId: string,
  scenarioName?: string
): Promise<string | null> {
  try {
    // Get collected data from conversation
    const collectedData = getBatchCollectedData(conversationId)

    // Validate we have required data
    if (!collectedData.currentAge || !collectedData.retirementAge || !collectedData.longevityAge || !collectedData.province) {
      console.error(`❌ Cannot save scenario: missing required fields`)
      return null
    }

    // Import mapper (dynamic to avoid circular dependencies)
    const { mapVoiceDataToScenario } = await import('./voice-to-scenario-mapper')

    // Transform voice data to scenario format
    const scenarioData = mapVoiceDataToScenario(collectedData, scenarioName)

    // Insert into scenarios table
    const { data, error } = await supabase
      .from('scenarios')
      .insert({
        user_id: userId,
        name: scenarioData.name,
        inputs: {
          basic_inputs: scenarioData.basic_inputs,
          assets: scenarioData.assets,
          income_sources: scenarioData.income_sources,
          expenses: scenarioData.expenses,
          assumptions: scenarioData.assumptions
        } as any,
        results: null,
        source: 'voice',
        conversation_id: conversationId
      })
      .select('id')
      .single()

    if (error) {
      console.error(`❌ Failed to save scenario to database:`, error)
      return null
    }

    console.log(`💾 Saved scenario ${data.id} for user ${userId} from conversation ${conversationId}`)
    return data.id
  } catch (error) {
    console.error(`❌ Error saving scenario:`, error)
    return null
  }
}

/**
 * Clean up old conversations from database (older than 24 hours)
 * Call this periodically to prevent DB bloat
 */
export async function cleanupOldConversations(): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    const { data, error } = await supabase
      .from('conversation_states')
      .delete()
      .lt('updated_at', cutoffDate.toISOString())
      .select('conversation_id')

    if (error) {
      console.error(`❌ Error cleaning up old conversations:`, error)
      return 0
    }

    const count = data?.length || 0
    console.log(`🧹 Cleaned up ${count} old conversations from database`)
    return count
  } catch (error) {
    console.error(`❌ Error cleaning up old conversations:`, error)
    return 0
  }
}
