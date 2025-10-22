/**
 * Batch Response Parser for Retirement Planning
 *
 * Parses multiple question answers from a single natural language response.
 * Used for batch-based conversation flow in test-voice-first.
 */

import { getAIProvider } from '@/lib/ai-provider'
import { Province } from '@/types/constants'
import type { QuestionBatch } from './batch-flow-manager'

/**
 * Batch parse result
 */
export interface BatchParseResult {
  values: Map<string, any>  // questionId -> parsed value
  confidence: Map<string, number>  // questionId -> confidence (0.0-1.0)
  missingFields: string[]  // question IDs user didn't answer
  spokenResponse: string  // AI's response to user
}

/**
 * Parse user's response for an entire batch of questions
 *
 * Takes a batch of questions and user's natural language response.
 * Returns all extracted values, confidence scores, and missing fields.
 */
export async function parseBatchResponse(
  batch: QuestionBatch,
  userText: string,
  nextBatch: QuestionBatch | null
): Promise<BatchParseResult> {
  const aiProvider = getAIProvider()

  console.log(`🎯 parseBatchResponse: batch=${batch.id}, questions=${batch.questions.length}`)

  // Build question list for prompt
  const questionList = batch.questions.map((q, idx) =>
    `${idx + 1}. ${q.id} (${q.type}): "${q.text}"`
  ).join('\n')

  // Build validation rules for each question
  const validationRules = batch.questions.map(q => {
    switch (q.type) {
      case 'age':
        if (q.id === 'current_age') return `${q.id}: 18-100`
        if (q.id === 'retirement_age') return `${q.id}: 50-80`
        if (q.id === 'longevity_age') return `${q.id}: 65-105`
        if (q.id === 'cpp_start_age') return `${q.id}: 60-70`
        return `${q.id}: valid age`
      case 'amount':
        if (q.id === 'current_income') return `${q.id}: >= 0, max 1000000`
        if (q.id === 'monthly_spending') return `${q.id}: > 0, max 100000`
        return `${q.id}: >= 0, or null for "none"/"zero"`
      case 'province':
        return `${q.id}: AB, BC, MB, NB, NL, NT, NS, NU, ON, PE, QC, SK, YT`
      case 'percentage':
        if (q.id === 'inflation_rate') return `${q.id}: 0-10`
        return `${q.id}: 0-20`
      default:
        return `${q.id}: valid value`
    }
  }).join('\n')

  // Build examples
  const examples = `Example batch responses:
"I'm 58, retiring at 65, expect to live to 90, I live in Ontario, and make 120k a year"
  → current_age: 58, retirement_age: 65, longevity_age: 90, province: "ON", current_income: 120000

"1.7 million RRSP, 300k TFSA, no non-registered"
  → rrsp_amount: 1700000, tfsa_amount: 300000, non_registered_amount: null

"I put 18k in RRSP, 7k in TFSA, and nothing in non-registered"
  → rrsp_contribution: 18000, tfsa_contribution: 7000, non_registered_contribution: null

"About 5 thousand a month, no pension, and I'll start CPP at 65"
  → monthly_spending: 5000, pension_income: null, cpp_start_age: 65

"I'm expecting 5% before retirement, 4% after, and 2% inflation"
  → investment_return: 5, post_retirement_return: 4, inflation_rate: 2`

  const systemPrompt = `You are parsing a user's response for MULTIPLE retirement planning questions.

QUESTIONS IN THIS BATCH:
${questionList}

USER'S RESPONSE:
"${userText}"

VALIDATION RULES:
${validationRules}

EXAMPLES:
${examples}

TASK:
1. Extract ALL values the user mentioned (they may answer 1, 2, or all 3 questions)
2. For values not mentioned, return null
3. Include confidence scores (0.0 = not sure, 1.0 = certain)
4. Generate a spoken response:
   ${nextBatch
     ? `- If user answered ALL questions: Brief acknowledgment + "${nextBatch.title}" prompt
   - If user missed some: Acknowledge what you got + ask for missing ones`
     : `- Thank them and say you're calculating their retirement projection`
   }

IMPORTANT:
- For amount type, null is VALID (means "none"/"zero")
- Don't assume values user didn't mention
- Be conversational and friendly
- Keep spoken response under 30 words

Return JSON with this EXACT structure:
{
  "values": {
    "${batch.questions[0].id}": <value|null>,
    ${batch.questions.slice(1).map(q => `"${q.id}": <value|null>`).join(',\n    ')}
  },
  "confidence": {
    "${batch.questions[0].id}": <0.0-1.0>,
    ${batch.questions.slice(1).map(q => `"${q.id}": <0.0-1.0>`).join(',\n    ')}
  },
  "missingFields": [<array of question IDs user didn't answer>],
  "spokenResponse": "<your natural response>"
}`

  const response = await aiProvider.generateCompletion([
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: 'Parse and respond:'
    }
  ], { temperature: 0.7, maxTokens: 200 })

  console.log(`🤖 parseBatchResponse raw: "${response}"`)

  try {
    // Strip markdown code blocks if present
    let cleanedResponse = response.trim()
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n/, '')
      cleanedResponse = cleanedResponse.replace(/\n```\s*$/, '')
      console.log(`🧹 Stripped markdown`)
    }

    // Parse JSON response
    const parsed = JSON.parse(cleanedResponse)

    // Convert to Maps
    const values = new Map<string, any>(Object.entries(parsed.values))
    const confidence = new Map<string, number>(Object.entries(parsed.confidence))

    console.log(`✅ parseBatchResponse result:`, {
      values: Object.fromEntries(values),
      missingFields: parsed.missingFields
    })

    return {
      values,
      confidence,
      missingFields: parsed.missingFields || [],
      spokenResponse: parsed.spokenResponse
    }
  } catch (error) {
    console.error('❌ Failed to parse batch LLM response:', error)

    // Fallback: treat as all missing
    const values = new Map<string, any>()
    const confidence = new Map<string, number>()
    const missingFields: string[] = []

    for (const q of batch.questions) {
      values.set(q.id, null)
      confidence.set(q.id, 0.0)
      missingFields.push(q.id)
    }

    return {
      values,
      confidence,
      missingFields,
      spokenResponse: `I'm sorry, I didn't quite catch that. Could you tell me about ${batch.title.toLowerCase()}?`
    }
  }
}
