/**
 * Question Flow Manager for Retirement Planning Conversations
 *
 * Manages the conversational flow for collecting retirement planning data.
 * Implements a state machine that tracks progress and determines next questions.
 */

import { extractAge, extractAmount, extractProvince, extractPercentage, detectSkipIntent } from './number-parser'
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
      id: 'has_rrsp',
      text: "Do you have an RRSP account?",
      type: 'yes_no',
      required: false
    },
    {
      id: 'rrsp_amount',
      text: "What's the current balance in your RRSP?",
      type: 'amount',
      required: false,
      followUp: (response, allResponses) => {
        const hasRrsp = allResponses.get('has_rrsp')
        // Only ask if they said yes to having RRSP
        if (hasRrsp?.parsedValue === false) {
          return 'has_tfsa' // Skip to TFSA question
        }
        return null // Continue to next question normally
      }
    },
    {
      id: 'has_tfsa',
      text: "Do you have a TFSA account?",
      type: 'yes_no',
      required: false
    },
    {
      id: 'tfsa_amount',
      text: "What's your current TFSA balance?",
      type: 'amount',
      required: false,
      followUp: (response, allResponses) => {
        const hasTfsa = allResponses.get('has_tfsa')
        if (hasTfsa?.parsedValue === false) {
          return 'has_non_registered' // Skip to non-registered question
        }
        return null
      }
    },
    {
      id: 'has_non_registered',
      text: "Do you have any non-registered investment accounts?",
      type: 'yes_no',
      required: false
    },
    {
      id: 'non_registered_amount',
      text: "What's the total value of your non-registered investments?",
      type: 'amount',
      required: false,
      followUp: (response, allResponses) => {
        const hasNonReg = allResponses.get('has_non_registered')
        if (hasNonReg?.parsedValue === false) {
          return 'monthly_spending' // Skip to spending question
        }
        return null
      }
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
      text: "What annual investment return are you expecting? Most people assume between 4% and 7%.",
      type: 'percentage',
      required: false,
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
 */
export function storeResponse(
  conversationId: string,
  questionId: string,
  questionText: string,
  rawText: string
): QuestionResponse | null {
  const state = conversationStates.get(conversationId)
  if (!state) return null

  const currentQuestion = getCurrentQuestion(conversationId)
  if (!currentQuestion || currentQuestion.id !== questionId) {
    console.warn(`Question mismatch: expected ${currentQuestion?.id}, got ${questionId}`)
    return null
  }

  // Check for skip intent
  if (detectSkipIntent(rawText) && !currentQuestion.required) {
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

  // Parse response based on question type
  let parsedValue: any = null
  switch (currentQuestion.type) {
    case 'age':
      parsedValue = extractAge(rawText)
      break
    case 'amount':
      parsedValue = extractAmount(rawText)
      break
    case 'province':
      parsedValue = extractProvince(rawText)
      break
    case 'percentage':
      parsedValue = extractPercentage(rawText)
      break
    case 'yes_no':
      // Simple yes/no detection
      const lower = rawText.toLowerCase()
      if (lower.includes('yes') || lower.includes('yeah') || lower.includes('yep')) {
        parsedValue = true
      } else if (lower.includes('no') || lower.includes('nope') || lower.includes('nah')) {
        parsedValue = false
      }
      break
  }

  // Validate parsed value
  if (parsedValue !== null && currentQuestion.validation) {
    if (!currentQuestion.validation(parsedValue)) {
      console.warn(`Validation failed for ${questionId}: ${parsedValue}`)
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
  rrsp?: number
  tfsa?: number
  non_registered?: number
  monthlySpending?: number
  investmentReturn?: number
} {
  const state = conversationStates.get(conversationId)
  if (!state) return {}

  return {
    currentAge: state.responses.get('current_age')?.parsedValue,
    retirementAge: state.responses.get('retirement_age')?.parsedValue,
    province: state.responses.get('province')?.parsedValue,
    rrsp: state.responses.get('rrsp_amount')?.parsedValue,
    tfsa: state.responses.get('tfsa_amount')?.parsedValue,
    non_registered: state.responses.get('non_registered_amount')?.parsedValue,
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
