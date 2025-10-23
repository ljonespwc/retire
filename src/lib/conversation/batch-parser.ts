/**
 * Batch Response Parser for Retirement Planning
 *
 * Parses multiple question answers from a single natural language response.
 * Used for batch-based conversation flow in test-voice-first.
 */

import { getAIProvider } from '@/lib/ai-provider'
import { Province } from '@/types/constants'
import type { QuestionBatch } from './batch-flow-manager'
import { z } from 'zod'

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
 * Zod schema for validating LLM batch parse response
 */
const BatchParseResponseSchema = z.object({
  values: z.record(z.string(), z.string().or(z.number()).or(z.boolean()).or(z.null())),
  confidence: z.record(z.string(), z.number().min(0).max(1)),
  missingFields: z.array(z.string()),
  spokenResponse: z.string().min(1).max(500)  // Reasonable length limits
})

/**
 * Parse user's response for an entire batch of questions
 *
 * Takes a batch of questions and user's natural language response.
 * Returns all extracted values, confidence scores, and missing fields.
 */
export async function parseBatchResponse(
  batch: QuestionBatch,
  userText: string,
  nextBatch: QuestionBatch | null,
  existingValues: Map<string, any> = new Map()
): Promise<BatchParseResult> {
  const aiProvider = getAIProvider()

  console.log(`🎯 parseBatchResponse: batch=${batch.id}, questions=${batch.questions.length}, existing=${existingValues.size}`)

  // Build question list for prompt, marking already-collected values
  const questionList = batch.questions.map((q, idx) => {
    const existingValue = existingValues.get(q.id)
    const hasValue = existingValue !== null && existingValue !== undefined
    return `${idx + 1}. ${q.id} (${q.type}): "${q.text}"${hasValue ? ` [ALREADY COLLECTED: ${existingValue}]` : ''}`
  }).join('\n')

  // Build validation rules for each question WITH ERROR MESSAGES
  const validationRules = batch.questions.map(q => {
    switch (q.type) {
      case 'age':
        if (q.id === 'current_age') return `${q.id}: 18-100 (error if outside: "Age must be between 18 and 100")`
        if (q.id === 'retirement_age') return `${q.id}: 50-80 (error if outside: "Retirement age must be between 50 and 80")`
        if (q.id === 'longevity_age') return `${q.id}: 65-105 (error if outside: "Life expectancy must be between 65 and 105")`
        if (q.id === 'cpp_start_age') return `${q.id}: 60-70 (error if outside: "CPP can only start between age 60 and 70")`
        return `${q.id}: valid age`
      case 'amount':
        if (q.id === 'current_income') return `${q.id}: >= 0, max 1000000 (error if invalid: "Income must be a positive number under $1 million")`
        if (q.id === 'monthly_spending') return `${q.id}: > 0, max 100000 (error if invalid: "Monthly spending must be greater than $0")`
        return `${q.id}: return null for "none"/"zero"/"don't have", number for actual amounts`
      case 'province':
        return `${q.id}: AB, BC, MB, NB, NL, NT, NS, NU, ON, PE, QC, SK, YT (error if invalid: "Please provide a valid Canadian province or territory")`
      case 'percentage':
        if (q.id === 'investment_return') return `${q.id}: 0-20, use 6 if user says "not sure"/"defaults"/"standard" (error if invalid: "Return must be between 0% and 20%")`
        if (q.id === 'post_retirement_return') return `${q.id}: 0-20, use 4 if user says "not sure"/"defaults"/"standard" (error if invalid: "Return must be between 0% and 20%")`
        if (q.id === 'inflation_rate') return `${q.id}: 0-10, use 2 if user says "not sure"/"defaults"/"standard" (error if invalid: "Inflation rate must be between 0% and 10%")`
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
  → monthly_spending: 5000, pension_income: null, cpp_start_age: 65, other_income: null

"5k monthly, 20k pension, CPP at 65, and 10k rental income"
  → monthly_spending: 5000, pension_income: 20000, cpp_start_age: 65, other_income: 10000

"I'm expecting 5% before retirement, 4% after, and 2% inflation"
  → investment_return: 5, post_retirement_return: 4, inflation_rate: 2

"I'm not sure about returns, just use standard assumptions"
  → investment_return: 6, post_retirement_return: 4, inflation_rate: 2

"Yeah sounds good, use your defaults"
  → investment_return: 6, post_retirement_return: 4, inflation_rate: 2

"Just go with the standard values"
  → investment_return: 6, post_retirement_return: 4, inflation_rate: 2`

  const systemPrompt = `You are parsing a user's response for MULTIPLE retirement planning questions.

QUESTIONS IN THIS BATCH:
${questionList}

⚠️ CRITICAL: Questions marked [ALREADY COLLECTED] have been answered. DO NOT ask for them again.

USER'S RESPONSE:
"${userText}"

VALIDATION RULES:
${validationRules}

EXAMPLES:
${examples}

TASK:
1. Extract values the user mentioned in THIS response
2. Validate each value against the rules above
3. For invalid values: Set low confidence (< 0.5) and explain the error in spokenResponse
4. For values NOT mentioned: return null (we'll merge with existing)
5. Include confidence scores (0.0 = not sure/invalid, 1.0 = certain/valid)
6. Generate a spoken response:
   ${nextBatch
     ? `- If user answered ALL remaining questions VALIDLY: Brief acknowledgment (e.g., "Perfect!", "Got it!", "Thanks!")
   - If some are invalid: Politely explain the SPECIFIC error and ask again (use error messages from validation rules)
   - If some are still missing: Acknowledge new info + ask ONLY for the MISSING questions (ignore [ALREADY COLLECTED])`
     : `- Thank them and say you're calculating their retirement projection`
   }

IMPORTANT RULES:
- NEVER ask about questions marked [ALREADY COLLECTED] - they are done
- Only ask for questions without the [ALREADY COLLECTED] tag
- For amount type: return null for "none"/"zero"/"don't have" (this is a VALID answer meaning they don't have it). Only return null if user says they don't have it OR if not mentioned.
- Don't assume values user didn't mention
- Be conversational and friendly
- Keep spoken response SHORT - under 20 words
- When all questions answered, just acknowledge briefly (don't introduce the next section)

OUTPUT FORMAT:
- Return ONLY valid JSON, no explanation or commentary
- Do not write any text before or after the JSON
- Use the exact structure shown below

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
  ], { temperature: 0.7, maxTokens: 800 })

  console.log(`🤖 parseBatchResponse raw: "${response}"`)

  try {
    // Strip markdown code blocks and any preamble text
    let cleanedResponse = response.trim()

    // Remove any text before the JSON starts
    const jsonStart = cleanedResponse.search(/```(?:json)?\s*\n\{|^\{/)
    if (jsonStart > 0) {
      console.log(`🧹 Stripped ${jsonStart} chars of preamble text`)
      cleanedResponse = cleanedResponse.substring(jsonStart)
    }

    // Remove markdown code blocks if present
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n/, '')
      cleanedResponse = cleanedResponse.replace(/\n```\s*$/, '')
      console.log(`🧹 Stripped markdown`)
    }

    // Parse JSON response
    const parsed = JSON.parse(cleanedResponse)

    // Validate with Zod schema
    const validationResult = BatchParseResponseSchema.safeParse(parsed)
    if (!validationResult.success) {
      console.error('❌ LLM response failed schema validation:', validationResult.error.issues)
      throw new Error(`Schema validation failed: ${validationResult.error.issues[0].message}`)
    }

    const validated = validationResult.data

    // Convert to Maps
    const values = new Map<string, any>(Object.entries(validated.values))
    const confidence = new Map<string, number>(Object.entries(validated.confidence))

    // Calculate ACTUAL missing fields by merging existing + just parsed
    // This prevents asking about fields the user just answered
    const mergedValues = new Map(existingValues)
    for (const [key, value] of values) {
      if (value !== undefined) {
        mergedValues.set(key, value)
      }
    }

    const actualMissingFields = batch.questions
      .filter(q => !mergedValues.has(q.id))
      .map(q => q.id)

    console.log(`✅ parseBatchResponse result:`, {
      values: Object.fromEntries(values),
      missingFields: actualMissingFields
    })

    return {
      values,
      confidence,
      missingFields: actualMissingFields,
      spokenResponse: validated.spokenResponse
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
