/**
 * Batch Question Flow Manager for Retirement Planning
 *
 * Groups questions into contextual batches for more natural conversation.
 * Used by test-voice-first page for batch-based data collection.
 *
 * State is stored in-memory (will be lost on hot reload).
 */

import { Province } from '@/types/constants'

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
 * In-memory conversation state storage
 * Note: Will be lost on serverless cold starts in production
 */
const conversationStates = new Map<string, BatchConversationState>()

/**
 * Initialize a new batch conversation
 */
export function initializeBatchConversation(conversationId: string): BatchConversationState {
  const state: BatchConversationState = {
    conversationId,
    currentBatchIndex: 0,
    batchResponses: new Map(),
    batches: RETIREMENT_BATCHES,
    startedAt: new Date()
  }

  conversationStates.set(conversationId, state)
  console.log(`📋 Initialized batch conversation ${conversationId} with ${RETIREMENT_BATCHES.length} batches`)

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
 * Store batch response and move to next batch
 * Merges new values with existing values (accumulates across multiple turns)
 */
export function storeBatchResponse(
  conversationId: string,
  batchId: string,
  values: Map<string, any>,
  rawText: string
): boolean {
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
  // Store actual values (including 0 which means "none")
  // Don't store null (means not mentioned) or undefined
  for (const [key, value] of values) {
    if (value !== undefined && value !== null) {
      mergedValues.set(key, value)  // Only store real values (including 0)
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

  return true
}

/**
 * Move to next batch
 */
export function getNextBatch(conversationId: string): QuestionBatch | null {
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
    return null
  }

  const nextBatch = state.batches[state.currentBatchIndex]
  console.log(`➡️ getNextBatch: Moved to batch #${state.currentBatchIndex + 1} (${nextBatch.id})`)
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
 */
export function completeBatchConversation(conversationId: string): void {
  const state = conversationStates.get(conversationId)
  if (state) {
    state.completedAt = new Date()
    console.log(`✅ Marked batch conversation ${conversationId} as complete`)
  }
}

/**
 * Clean up batch conversation (remove from memory)
 */
export function cleanupBatchConversation(conversationId: string): void {
  conversationStates.delete(conversationId)
  console.log(`🧹 Cleaned up batch conversation ${conversationId}`)
}
