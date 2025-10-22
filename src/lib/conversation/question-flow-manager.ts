/**
 * Question Flow Manager for Retirement Planning Conversations
 *
 * Manages the conversational flow for collecting retirement planning data.
 * Implements a state machine that tracks progress and determines next questions.
 */

import { extractAge, extractAmount, extractProvince, extractPercentage, extractYesNo, detectSkipIntent } from './llm-parser'
import { Province } from '@/types/constants'

/**
 * Question definition
 */
export interface Question {
  id: string
  text: string
  type: 'age' | 'amount' | 'province' | 'percentage' | 'yes_no'
  required: boolean
  validation?: (value: any) => boolean
  followUp?: (response: string, allResponses: Map<string, QuestionResponse>) => string | null // Returns next question ID or null to continue normal flow
}

/**
 * Response to a question
 */
export interface QuestionResponse {
  questionId: string
  questionText: string
  rawText: string
  parsedValue: any
  timestamp: Date
}

/**
 * Conversation state
 */
export interface ConversationState {
  conversationId: string
  currentQuestionIndex: number
  responses: Map<string, QuestionResponse>
  questionFlow: QuestionFlow
  startedAt: Date
  completedAt?: Date
}

/**
 * Question flow definition
 */
export interface QuestionFlow {
  name: string
  questions: Question[]
}

/**
 * Default retirement planning question flow (Basic Tier)
 */
const BASIC_RETIREMENT_FLOW: QuestionFlow = {
  name: 'Basic Retirement Planning',
  questions: [
    {
      id: 'current_age',
      text: "Let's start with the basics. How old are you currently?",
      type: 'age',
      required: true,
      validation: (age: number) => age >= 18 && age <= 100
    },
    {
      id: 'retirement_age',
      text: "At what age are you planning to retire?",
      type: 'age',
      required: true,
      validation: (age: number) => age >= 50 && age <= 80
    },
    {
      id: 'province',
      text: "Which province or territory do you live in?",
      type: 'province',
      required: true
    },
    {
      id: 'rrsp_amount',
      text: "What's the current balance in your RRSP? If you don't have one, just say 'none' or 'zero'.",
      type: 'amount',
      required: true  // User must answer (even if "none")
    },
    {
      id: 'tfsa_amount',
      text: "What's your TFSA balance? Say 'none' if you don't have one.",
      type: 'amount',
      required: true  // User must answer (even if "none")
    },
    {
      id: 'non_registered_amount',
      text: "What's the total value of your non-registered investments? Say 'none' if you don't have any.",
      type: 'amount',
      required: true  // User must answer (even if "none")
    },
    {
      id: 'monthly_spending',
      text: "How much do you think you'll need to spend each month in retirement?",
      type: 'amount',
      required: true,
      validation: (amount: number) => amount > 0 && amount < 100000
    },
    {
      id: 'investment_return',
      text: "What annual investment return are you expecting? If you're not sure, just say 5%.",
      type: 'percentage',
      required: true,  // User must answer (5% if unsure)
      validation: (pct: number) => pct >= 0 && pct <= 20
    }
  ]
}

/**
 * In-memory conversation state store
 * In production, use Redis or database
 */
const conversationStates = new Map<string, ConversationState>()

/**
 * Initialize a new conversation
 */
export function initializeConversation(
  conversationId: string,
  flow: QuestionFlow = BASIC_RETIREMENT_FLOW
): ConversationState {
  const state: ConversationState = {
    conversationId,
    currentQuestionIndex: 0,
    responses: new Map(),
    questionFlow: flow,
    startedAt: new Date()
  }

  conversationStates.set(conversationId, state)
  console.log(`📋 Initialized conversation ${conversationId} with ${flow.questions.length} questions`)

  return state
}

/**
 * Get conversation state
 */
export function getConversationState(conversationId: string): ConversationState | null {
  return conversationStates.get(conversationId) || null
}

/**
 * Get current question
 */
export function getCurrentQuestion(conversationId: string): Question | null {
  const state = conversationStates.get(conversationId)
  if (!state) return null

  if (state.currentQuestionIndex >= state.questionFlow.questions.length) {
    return null // Conversation complete
  }

  return state.questionFlow.questions[state.currentQuestionIndex]
}

/**
 * Store response and move to next question
 * Now async because we use LLM for parsing
 */
export async function storeResponse(
  conversationId: string,
  questionId: string,
  questionText: string,
  rawText: string
): Promise<QuestionResponse | null> {
  console.log(`🎯 storeResponse called for ${questionId}, text="${rawText}"`)

  const state = conversationStates.get(conversationId)
  if (!state) {
    console.error(`❌ No state found for conversation ${conversationId}`)
    return null
  }

  const currentQuestion = getCurrentQuestion(conversationId)
  if (!currentQuestion || currentQuestion.id !== questionId) {
    console.warn(`❌ Question mismatch: expected ${currentQuestion?.id}, got ${questionId}`)
    return null
  }

  console.log(`✅ Current question matches: ${questionId}, type: ${currentQuestion.type}`)

  // Check for skip intent ONLY for optional questions (performance optimization)
  if (!currentQuestion.required) {
    const shouldSkip = await detectSkipIntent(rawText)
    if (shouldSkip) {
      console.log(`⏭️ User skipped optional question: ${questionId}`)

      const response: QuestionResponse = {
        questionId,
        questionText,
        rawText,
        parsedValue: null,
        timestamp: new Date()
      }

      state.responses.set(questionId, response)
      return response
    }
  }

  // Parse response based on question type (all async now)
  let parsedValue: any = null
  switch (currentQuestion.type) {
    case 'age':
      parsedValue = await extractAge(rawText)
      break
    case 'amount':
      parsedValue = await extractAmount(rawText)
      break
    case 'province':
      parsedValue = await extractProvince(rawText)
      break
    case 'percentage':
      parsedValue = await extractPercentage(rawText)
      break
    case 'yes_no':
      parsedValue = await extractYesNo(rawText)
      break
  }

  // Validate parsed value
  if (parsedValue !== null && currentQuestion.validation) {
    console.log(`🔍 Validating ${questionId}: ${parsedValue}`)
    const isValid = currentQuestion.validation(parsedValue)
    console.log(`📋 Validation result: ${isValid}`)
    if (!isValid) {
      console.warn(`❌ Validation failed for ${questionId}: ${parsedValue}`)
      return null // Don't store invalid response
    }
  }

  // Store response
  const response: QuestionResponse = {
    questionId,
    questionText,
    rawText,
    parsedValue,
    timestamp: new Date()
  }

  state.responses.set(questionId, response)
  console.log(`💾 Stored response for ${questionId}: ${parsedValue}`)

  return response
}

/**
 * Peek at next question WITHOUT modifying state
 * Used for combined LLM call optimization
 */
export function peekNextQuestion(conversationId: string): Question | null {
  const state = conversationStates.get(conversationId)
  if (!state) return null

  const nextIndex = state.currentQuestionIndex + 1

  if (nextIndex >= state.questionFlow.questions.length) {
    return null // Conversation will be complete after current question
  }

  return state.questionFlow.questions[nextIndex]
}

/**
 * Get next question based on current state and follow-up logic
 */
export function getNextQuestion(
  conversationId: string,
  lastResponse: string
): Question | null {
  const state = conversationStates.get(conversationId)
  if (!state) return null

  const currentQuestion = getCurrentQuestion(conversationId)
  if (!currentQuestion) return null

  // Check if current question has follow-up logic
  if (currentQuestion.followUp) {
    const nextQuestionId = currentQuestion.followUp(lastResponse, state.responses)
    if (nextQuestionId) {
      // Jump to specific question
      const nextIndex = state.questionFlow.questions.findIndex(q => q.id === nextQuestionId)
      if (nextIndex !== -1) {
        state.currentQuestionIndex = nextIndex
        console.log(`↪️ Following up to question: ${nextQuestionId}`)
        return state.questionFlow.questions[nextIndex]
      }
    }
  }

  // Move to next question
  state.currentQuestionIndex++

  if (state.currentQuestionIndex >= state.questionFlow.questions.length) {
    state.completedAt = new Date()
    console.log(`✅ Conversation ${conversationId} completed`)
    return null
  }

  return state.questionFlow.questions[state.currentQuestionIndex]
}

/**
 * Get progress (current question number / total questions)
 */
export function getProgress(conversationId: string): { current: number; total: number } | null {
  const state = conversationStates.get(conversationId)
  if (!state) return null

  return {
    current: state.currentQuestionIndex + 1,
    total: state.questionFlow.questions.length
  }
}

/**
 * Get all collected data formatted for calculator
 */
export function getCollectedData(conversationId: string): {
  currentAge?: number
  retirementAge?: number
  province?: Province
  rrsp?: number | null
  tfsa?: number | null
  non_registered?: number | null
  monthlySpending?: number
  investmentReturn?: number
} {
  const state = conversationStates.get(conversationId)
  if (!state) return {}

  const rrsp = state.responses.get('rrsp_amount')?.parsedValue
  const tfsa = state.responses.get('tfsa_amount')?.parsedValue
  const nonReg = state.responses.get('non_registered_amount')?.parsedValue

  return {
    currentAge: state.responses.get('current_age')?.parsedValue,
    retirementAge: state.responses.get('retirement_age')?.parsedValue,
    province: state.responses.get('province')?.parsedValue,
    rrsp: rrsp !== undefined ? rrsp : undefined,
    tfsa: tfsa !== undefined ? tfsa : undefined,
    non_registered: nonReg !== undefined ? nonReg : undefined,
    monthlySpending: state.responses.get('monthly_spending')?.parsedValue,
    investmentReturn: state.responses.get('investment_return')?.parsedValue || 5.0 // Default to 5%
  }
}

/**
 * Mark conversation as complete
 */
export function completeConversation(conversationId: string): void {
  const state = conversationStates.get(conversationId)
  if (state) {
    state.completedAt = new Date()
    console.log(`✅ Marked conversation ${conversationId} as complete`)
  }
}

/**
 * Clean up conversation (remove from memory)
 */
export function cleanupConversation(conversationId: string): void {
  conversationStates.delete(conversationId)
  console.log(`🧹 Cleaned up conversation ${conversationId}`)
}

/**
 * Get all responses as array
 */
export function getResponses(conversationId: string): QuestionResponse[] {
  const state = conversationStates.get(conversationId)
  if (!state) return []
  return Array.from(state.responses.values())
}
