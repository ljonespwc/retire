/**
 * Batch Parser Tests
 *
 * Tests for LLM-based batch response parsing.
 * Validates field extraction, confidence scoring, and field preservation logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseBatchResponse } from '../batch-parser'
import type { QuestionBatch } from '../batch-flow-manager'

// Create mock function before importing
const mockGenerateCompletion = vi.fn()

// Mock AI provider
vi.mock('@/lib/ai-provider', () => ({
  getAIProvider: () => ({
    generateCompletion: mockGenerateCompletion
  })
}))

describe('batch-parser: parseBatchResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Sample batch for testing
  const personalInfoBatch: QuestionBatch = {
    id: 'personal_info',
    title: 'Personal Information',
    questions: [
      { id: 'current_age', text: 'Your current age', type: 'age' },
      { id: 'retirement_age', text: 'When you plan to retire', type: 'age' },
      { id: 'province', text: 'Which province you live in', type: 'province' },
      { id: 'current_income', text: 'Your current income', type: 'amount' }
    ]
  }

  const savingsBatch: QuestionBatch = {
    id: 'savings',
    title: 'Current Savings',
    questions: [
      { id: 'rrsp_amount', text: 'Your RRSP balance', type: 'amount' },
      { id: 'tfsa_amount', text: 'Your TFSA balance', type: 'amount' },
      { id: 'non_registered_amount', text: 'Your non-registered investments', type: 'amount' }
    ]
  }

  describe('Full extraction - all values provided', () => {
    it('should extract all personal info values with high confidence', async () => {
      const mockResponse = JSON.stringify({
        values: {
          current_age: 58,
          retirement_age: 65,
          province: 'ON',
          current_income: 120000
        },
        confidence: {
          current_age: 1.0,
          retirement_age: 1.0,
          province: 1.0,
          current_income: 1.0
        },
        missingFields: [],
        spokenResponse: 'Perfect!'
      })

      mockGenerateCompletion.mockResolvedValue(mockResponse)

      const result = await parseBatchResponse(
        personalInfoBatch,
        "I'm 58, retiring at 65, live in Ontario, make 120k",
        null
      )

      expect(result.values.get('current_age')).toBe(58)
      expect(result.values.get('retirement_age')).toBe(65)
      expect(result.values.get('province')).toBe('ON')
      expect(result.values.get('current_income')).toBe(120000)
      expect(result.confidence.get('current_age')).toBe(1.0)
      expect(result.missingFields).toEqual([])
      expect(result.spokenResponse).toBe('Perfect!')
    })
  })

  describe('Partial extraction - missing fields', () => {
    it('should return null with conf 0.0 for fields NOT mentioned', async () => {
      const mockResponse = JSON.stringify({
        values: {
          rrsp_amount: 500000,
          tfsa_amount: 100000,
          non_registered_amount: null  // NOT mentioned, should be 0.0 confidence
        },
        confidence: {
          rrsp_amount: 1.0,
          tfsa_amount: 1.0,
          non_registered_amount: 0.0  // NOT mentioned
        },
        missingFields: ['non_registered_amount'],
        spokenResponse: 'Got it. And do you have any non-registered investments?'
      })

      mockGenerateCompletion.mockResolvedValue(mockResponse)

      const result = await parseBatchResponse(
        savingsBatch,
        '500k RRSP, 100k TFSA',
        null
      )

      expect(result.values.get('rrsp_amount')).toBe(500000)
      expect(result.values.get('tfsa_amount')).toBe(100000)
      expect(result.values.get('non_registered_amount')).toBeNull()
      expect(result.confidence.get('non_registered_amount')).toBe(0.0)  // NOT mentioned
      expect(result.missingFields).toContain('non_registered_amount')
    })
  })

  describe('User said "none" - valid answer', () => {
    it('should return null with conf 1.0 when user explicitly says "none"', async () => {
      const mockResponse = JSON.stringify({
        values: {
          rrsp_amount: 500000,
          tfsa_amount: 100000,
          non_registered_amount: null  // User said "none"
        },
        confidence: {
          rrsp_amount: 1.0,
          tfsa_amount: 1.0,
          non_registered_amount: 1.0  // User SAID "none" - valid answer
        },
        missingFields: [],
        spokenResponse: 'Perfect!'
      })

      mockGenerateCompletion.mockResolvedValue(mockResponse)

      const result = await parseBatchResponse(
        savingsBatch,
        '500k RRSP, 100k TFSA, no non-registered',
        null
      )

      expect(result.values.get('non_registered_amount')).toBeNull()
      expect(result.confidence.get('non_registered_amount')).toBe(1.0)  // User SAID "none"
      expect(result.missingFields).toEqual([])
    })
  })

  describe('Field preservation - [ALREADY COLLECTED] logic', () => {
    it('should preserve existing values when re-prompting for missing field', async () => {
      // First turn: User provided TFSA and non-registered (RRSP missing)
      const existingValues = new Map([
        ['tfsa_amount', 100000],
        ['non_registered_amount', null]  // User said "none" in first turn
      ])

      const mockResponse = JSON.stringify({
        values: {
          rrsp_amount: 500000,  // NEW value
          tfsa_amount: 100000,  // PRESERVED from existing
          non_registered_amount: null  // PRESERVED from existing
        },
        confidence: {
          rrsp_amount: 1.0,
          tfsa_amount: 1.0,  // PRESERVED - confidence 1.0
          non_registered_amount: 1.0  // PRESERVED - confidence 1.0
        },
        missingFields: [],
        spokenResponse: 'Perfect!'
      })

      mockGenerateCompletion.mockResolvedValue(mockResponse)

      const result = await parseBatchResponse(
        savingsBatch,
        '500k RRSP',  // Only mentioned RRSP this turn
        null,
        existingValues
      )

      // CRITICAL: Previously collected values should be preserved
      expect(result.values.get('rrsp_amount')).toBe(500000)
      expect(result.values.get('tfsa_amount')).toBe(100000)  // PRESERVED
      expect(result.values.get('non_registered_amount')).toBeNull()  // PRESERVED null
      expect(result.confidence.get('tfsa_amount')).toBe(1.0)  // High confidence
      expect(result.confidence.get('non_registered_amount')).toBe(1.0)  // High confidence
    })

    it('should NOT overwrite preserved fields even if user mentions them again', async () => {
      const existingValues = new Map([
        ['tfsa_amount', 100000]
      ])

      const mockResponse = JSON.stringify({
        values: {
          rrsp_amount: 500000,
          tfsa_amount: 100000,  // PRESERVED (not 120000!)
          non_registered_amount: null
        },
        confidence: {
          rrsp_amount: 1.0,
          tfsa_amount: 1.0,  // PRESERVED - always 1.0
          non_registered_amount: 0.0
        },
        missingFields: ['non_registered_amount'],
        spokenResponse: 'Got the RRSP. What about non-registered?'
      })

      mockGenerateCompletion.mockResolvedValue(mockResponse)

      const result = await parseBatchResponse(
        savingsBatch,
        '500k RRSP',  // User didn't mention TFSA this turn
        null,
        existingValues
      )

      expect(result.values.get('tfsa_amount')).toBe(100000)  // PRESERVED original value
      expect(result.confidence.get('tfsa_amount')).toBe(1.0)
    })
  })

  describe('Validation errors', () => {
    it('should return low confidence for out-of-range age', async () => {
      const mockResponse = JSON.stringify({
        values: {
          current_age: 150,  // Invalid
          retirement_age: null,
          province: null,
          current_income: null
        },
        confidence: {
          current_age: 0.3,  // Low confidence - out of range
          retirement_age: 0.0,
          province: 0.0,
          current_income: 0.0
        },
        missingFields: ['retirement_age', 'province', 'current_income'],
        spokenResponse: 'Age must be between 18 and 100. Could you provide your age again?'
      })

      mockGenerateCompletion.mockResolvedValue(mockResponse)

      const result = await parseBatchResponse(
        personalInfoBatch,
        "I'm 150 years old",
        null
      )

      expect(result.values.get('current_age')).toBe(150)
      expect(result.confidence.get('current_age')).toBe(0.3)  // Low confidence
      expect(result.spokenResponse).toContain('Age must be between 18 and 100')
    })
  })

  describe('JSON parsing robustness', () => {
    it('should strip markdown code blocks', async () => {
      const mockResponse = '```json\n' + JSON.stringify({
        values: { current_age: 58, retirement_age: 65, province: 'ON', current_income: 120000 },
        confidence: { current_age: 1.0, retirement_age: 1.0, province: 1.0, current_income: 1.0 },
        missingFields: [],
        spokenResponse: 'Perfect!'
      }) + '\n```'

      mockGenerateCompletion.mockResolvedValue(mockResponse)

      const result = await parseBatchResponse(personalInfoBatch, "I'm 58", null)

      expect(result.values.get('current_age')).toBe(58)
    })

    it('should strip preamble text before JSON', async () => {
      const mockResponse = 'Here is the parsed response:\n\n' + JSON.stringify({
        values: { current_age: 58, retirement_age: 65, province: 'ON', current_income: 120000 },
        confidence: { current_age: 1.0, retirement_age: 1.0, province: 1.0, current_income: 1.0 },
        missingFields: [],
        spokenResponse: 'Perfect!'
      })

      mockGenerateCompletion.mockResolvedValue(mockResponse)

      const result = await parseBatchResponse(personalInfoBatch, "I'm 58", null)

      expect(result.values.get('current_age')).toBe(58)
    })
  })

  describe('Error fallback', () => {
    it('should return all fields as missing on JSON parse error', async () => {
      mockGenerateCompletion.mockResolvedValue('invalid json {{{')

      const result = await parseBatchResponse(personalInfoBatch, "I'm 58", null)

      expect(result.values.get('current_age')).toBeNull()
      expect(result.confidence.get('current_age')).toBe(0.0)
      expect(result.missingFields).toEqual(['current_age', 'retirement_age', 'province', 'current_income'])
      expect(result.spokenResponse).toContain('didn\'t quite catch that')
    })

    it('should return all fields as missing on validation error', async () => {
      // Missing required field 'spokenResponse'
      const mockResponse = JSON.stringify({
        values: { current_age: 58, retirement_age: 65, province: 'ON', current_income: 120000 },
        confidence: { current_age: 1.0, retirement_age: 1.0, province: 1.0, current_income: 1.0 },
        missingFields: []
        // Missing spokenResponse!
      })

      mockGenerateCompletion.mockResolvedValue(mockResponse)

      const result = await parseBatchResponse(personalInfoBatch, "I'm 58", null)

      expect(result.missingFields).toEqual(['current_age', 'retirement_age', 'province', 'current_income'])
      expect(result.spokenResponse).toContain('didn\'t quite catch that')
    })
  })

  describe('Prompt optimization', () => {
    it('should include [ALREADY COLLECTED] tags in prompt for existing values', async () => {
      const existingValues = new Map([
        ['tfsa_amount', 100000],
        ['non_registered_amount', null]
      ])

      const mockResponse = JSON.stringify({
        values: { rrsp_amount: 500000, tfsa_amount: 100000, non_registered_amount: null },
        confidence: { rrsp_amount: 1.0, tfsa_amount: 1.0, non_registered_amount: 1.0 },
        missingFields: [],
        spokenResponse: 'Perfect!'
      })

      mockGenerateCompletion.mockResolvedValue(mockResponse)

      await parseBatchResponse(savingsBatch, '500k RRSP', null, existingValues)

      // Verify generateCompletion was called
      expect(mockGenerateCompletion).toHaveBeenCalledTimes(1)

      // Verify the prompt includes [ALREADY COLLECTED] tags
      const callArgs = mockGenerateCompletion.mock.calls[0]
      const systemPrompt = callArgs[0][0].content

      expect(systemPrompt).toContain('[ALREADY COLLECTED: 100000]')  // tfsa_amount
      expect(systemPrompt).toContain('[ALREADY COLLECTED: none/zero]')  // non_registered_amount (null)
    })

    it('should use condensed prompt format (not verbose)', async () => {
      const mockResponse = JSON.stringify({
        values: { current_age: 58, retirement_age: 65, province: 'ON', current_income: 120000 },
        confidence: { current_age: 1.0, retirement_age: 1.0, province: 1.0, current_income: 1.0 },
        missingFields: [],
        spokenResponse: 'Perfect!'
      })

      mockGenerateCompletion.mockResolvedValue(mockResponse)

      await parseBatchResponse(personalInfoBatch, "I'm 58", null)

      const callArgs = mockGenerateCompletion.mock.calls[0]
      const systemPrompt = callArgs[0][0].content

      // Should be condensed format (not 85 lines of repetition)
      expect(systemPrompt).toContain('PARSING RULES:')
      expect(systemPrompt).toContain('CONFIDENCE SCORING:')

      // Should NOT have redundant sections
      const rulesSectionCount = (systemPrompt.match(/PARSING RULES:/g) || []).length
      expect(rulesSectionCount).toBe(1)  // Only ONE section, not 4 repetitions
    })
  })
})
