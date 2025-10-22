/**
 * Batch Question Flow Manager for Retirement Planning
 *
 * Groups questions into contextual batches for more natural conversation.
 * Used by test-voice-first page for batch-based data collection.
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
        id: 'province',
        text: 'Which province or territory you live in',
        type: 'province'
      }
    ]
  },
  {
    id: 'savings',
    title: 'Tell me about your savings',
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
    id: 'expectations',
    title: 'Tell me about your retirement expectations',
    questions: [
      {
        id: 'monthly_spending',
        text: 'How much you think you\'ll need to spend each month in retirement',
        type: 'amount'
      },
      {
        id: 'investment_return',
        text: 'What annual investment return you\'re expecting (say 5% if unsure)',
        type: 'percentage'
      }
    ]
  }
]

/**
 * In-memory batch conversation state store
 */
const batchConversationStates = new Map<string, BatchConversationState>()

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

  batchConversationStates.set(conversationId, state)
  console.log(`📋 Initialized batch conversation ${conversationId} with ${RETIREMENT_BATCHES.length} batches`)

  return state
}

/**
 * Get batch conversation state
 */
export function getBatchConversationState(conversationId: string): BatchConversationState | null {
  return batchConversationStates.get(conversationId) || null
}

/**
 * Get current batch
 */
export function getCurrentBatch(conversationId: string): QuestionBatch | null {
  const state = batchConversationStates.get(conversationId)
  if (!state) return null

  if (state.currentBatchIndex >= state.batches.length) {
    return null // Conversation complete
  }

  return state.batches[state.currentBatchIndex]
}

/**
 * Store batch response and move to next batch
 */
export function storeBatchResponse(
  conversationId: string,
  batchId: string,
  values: Map<string, any>,
  rawText: string
): boolean {
  const state = batchConversationStates.get(conversationId)
  if (!state) {
    console.error(`❌ No state found for conversation ${conversationId}`)
    return false
  }

  const response: BatchResponse = {
    batchId,
    values,
    rawText,
    timestamp: new Date()
  }

  state.batchResponses.set(batchId, response)
  console.log(`💾 Stored batch response for ${batchId}:`, Object.fromEntries(values))

  return true
}

/**
 * Move to next batch
 */
export function getNextBatch(conversationId: string): QuestionBatch | null {
  const state = batchConversationStates.get(conversationId)
  if (!state) return null

  // Move to next batch
  state.currentBatchIndex++

  if (state.currentBatchIndex >= state.batches.length) {
    state.completedAt = new Date()
    console.log(`✅ Batch conversation ${conversationId} completed`)
    return null
  }

  return state.batches[state.currentBatchIndex]
}

/**
 * Get progress (current batch / total batches)
 */
export function getBatchProgress(conversationId: string): { current: number; total: number } | null {
  const state = batchConversationStates.get(conversationId)
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
  province?: Province
  rrsp?: number | null
  tfsa?: number | null
  non_registered?: number | null
  monthlySpending?: number
  investmentReturn?: number
} {
  const state = batchConversationStates.get(conversationId)
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
    province: allValues.get('province'),
    rrsp: allValues.get('rrsp_amount'),
    tfsa: allValues.get('tfsa_amount'),
    non_registered: allValues.get('non_registered_amount'),
    monthlySpending: allValues.get('monthly_spending'),
    investmentReturn: allValues.get('investment_return') || 5.0
  }
}

/**
 * Mark batch conversation as complete
 */
export function completeBatchConversation(conversationId: string): void {
  const state = batchConversationStates.get(conversationId)
  if (state) {
    state.completedAt = new Date()
    console.log(`✅ Marked batch conversation ${conversationId} as complete`)
  }
}

/**
 * Clean up batch conversation (remove from memory)
 */
export function cleanupBatchConversation(conversationId: string): void {
  batchConversationStates.delete(conversationId)
  console.log(`🧹 Cleaned up batch conversation ${conversationId}`)
}
