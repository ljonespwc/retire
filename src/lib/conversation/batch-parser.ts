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
    const hasValue = existingValues.has(q.id)  // Check if key exists in Map (works for null too!)
    const existingValue = existingValues.get(q.id)
    return `${idx + 1}. ${q.id} (${q.type}): "${q.text}"${hasValue ? ` [ALREADY COLLECTED: ${existingValue === null ? 'none/zero' : existingValue}]` : ''}`
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
        if (q.id === 'investment_return') return `${q.id}: 0-20. If user says "not sure"/"defaults"/"standard" use 6. If not mentioned, return null with confidence 0.0 (error if invalid: "Return must be between 0% and 20%")`
        if (q.id === 'post_retirement_return') return `${q.id}: 0-20. If user says "not sure"/"defaults"/"standard" use 4. If not mentioned, return null with confidence 0.0 (error if invalid: "Return must be between 0% and 20%")`
        if (q.id === 'inflation_rate') return `${q.id}: 0-10. If user says "not sure"/"defaults"/"standard" use 2. If not mentioned, return null with confidence 0.0 (error if invalid: "Inflation rate must be between 0% and 10%")`
        return `${q.id}: 0-20. If not mentioned, return null with confidence 0.0`
      default:
        return `${q.id}: valid value`
    }
  }).join('\n')

  // Build examples
  const examples = `Example batch responses:
"I'm 58, retiring at 65, expect to live to 90, I live in Ontario, and make 120k a year"
  → current_age: 58 (conf: 1.0), retirement_age: 65 (conf: 1.0), longevity_age: 90 (conf: 1.0), province: "ON" (conf: 1.0), current_income: 120000 (conf: 1.0)

"1.7 million TFSA, 300k non-registered" (RRSP not mentioned)
  → rrsp_amount: null (conf: 0.0 - NOT MENTIONED, triggers re-prompt), tfsa_amount: 1700000 (conf: 1.0), non_registered_amount: 300000 (conf: 1.0)

"1.7 million RRSP, 300k TFSA, no non-registered" (user said "no")
  → rrsp_amount: 1700000 (conf: 1.0), tfsa_amount: 300000 (conf: 1.0), non_registered_amount: null (conf: 1.0 - user said "no")

"I put 7k in TFSA, nothing in non-registered" (RRSP not mentioned)
  → rrsp_contribution: null (conf: 0.0 - NOT MENTIONED), tfsa_contribution: 7000 (conf: 1.0), non_registered_contribution: null (conf: 1.0 - user said "nothing")

"CPP at 60, no pension, no other income" (monthly_spending not mentioned, FIRST turn)
  → monthly_spending: null (conf: 0.0 - NOT MENTIONED), pension_income: null (conf: 1.0 - user said "no"), cpp_start_age: 60 (conf: 1.0), other_income: null (conf: 1.0 - user said "no")

"$2500" (monthly_spending provided, pension/cpp/other already collected from previous turn)
  With [ALREADY COLLECTED] tags: pension_income [none/zero], cpp_start_age [60], other_income [none/zero]
  → monthly_spending: 2500 (conf: 1.0), pension_income: null (conf: 1.0 - preserved), cpp_start_age: 60 (conf: 1.0 - preserved), other_income: null (conf: 1.0 - preserved)

"About 5 thousand a month, CPP at 65" (pension and other_income not mentioned)
  → monthly_spending: 5000 (conf: 1.0), pension_income: null (conf: 0.0 - NOT MENTIONED), cpp_start_age: 65 (conf: 1.0), other_income: null (conf: 0.0 - NOT MENTIONED)

"I'm expecting 5% before retirement, 4% after" (inflation not mentioned)
  → investment_return: 5 (conf: 1.0), post_retirement_return: 4 (conf: 1.0), inflation_rate: null (conf: 0.0 - NOT MENTIONED)

"I'm not sure about returns, just use standard assumptions"
  → investment_return: 6 (conf: 1.0 - using default), post_retirement_return: 4 (conf: 1.0 - using default), inflation_rate: 2 (conf: 1.0 - using default)`

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
1. FIRST: For ALL fields marked [ALREADY COLLECTED: value], return that exact value with confidence 1.0
   - This is MANDATORY and happens BEFORE parsing user's new response
   - Example: If you see "pension_income [ALREADY COLLECTED: none/zero]", you MUST return pension_income: null, confidence: 1.0
2. Extract values the user mentioned in THIS response
3. Validate each value against the rules above
4. For invalid values: Set low confidence (< 0.5) and explain the error in spokenResponse
5. For values NOT mentioned and NOT already collected: return null with confidence 0.0 (triggers re-prompt)
6. For values where user EXPLICITLY said "none"/"zero"/"don't have" in THIS response: return null with confidence 1.0
7. Include confidence scores (see CONFIDENCE SCORING RULES below)
8. Generate a spoken response:
   - If some values are invalid: Politely explain the SPECIFIC error and ask again (use error messages from validation rules)
   - If some fields are still missing (not yet collected): Acknowledge what you got + ask ONLY for the MISSING questions (ignore [ALREADY COLLECTED])
   - If user answered ALL questions VALIDLY: ${nextBatch ? `Brief acknowledgment (e.g., "Perfect!", "Got it!", "Thanks!")` : `Thank them warmly and tell them to click the orange Calculate button to see their retirement projection`}

IMPORTANT RULES:
- 🔴 CRITICAL: Questions marked [ALREADY COLLECTED] are DONE - return the exact value shown with confidence 1.0
- 🔴 CRITICAL: NEVER return low confidence (< 1.0) for [ALREADY COLLECTED] fields - this will cause re-asking
- NEVER ask about questions marked [ALREADY COLLECTED] - they are done
- Only ask for questions without the [ALREADY COLLECTED] tag
- For amount type: ONLY return null if user EXPLICITLY says "none"/"zero"/"don't have" (this means they don't have it)
- If user doesn't mention a field at all, return null with confidence 0.0 (this will trigger re-prompt)
- Don't assume values user didn't mention
- Be conversational and friendly
- Keep spoken response SHORT - under 20 words
- When all questions answered, just acknowledge briefly (don't introduce the next section)

⚠️ CRITICAL FIELD PRESERVATION RULE:
- For fields marked [ALREADY COLLECTED: value]: ALWAYS return that EXACT value in your response
- DO NOT return null or any other value for [ALREADY COLLECTED] fields
- Examples:
  * "rrsp_amount [ALREADY COLLECTED: 300000]" → return "rrsp_amount": 300000 with confidence 1.0
  * "pension_income [ALREADY COLLECTED: none/zero]" → return "pension_income": null with confidence 1.0
  * "cpp_start_age [ALREADY COLLECTED: 65]" → return "cpp_start_age": 65 with confidence 1.0
- This prevents accidentally overwriting previously collected data
- When you see "none/zero" as the value, return null (not the string "none/zero")

⚠️ CONFIDENCE SCORING RULES:
- 1.0 = Field marked [ALREADY COLLECTED] - ALWAYS confidence 1.0 regardless of user's new response
- 1.0 = User explicitly stated a value (e.g., "500k RRSP", "7% return")
- 1.0 = User explicitly said "none"/"zero"/"don't have" (return null with confidence 1.0)
- 0.0 = Field NOT mentioned in user's response AND not already collected (return null with confidence 0.0 to trigger re-prompt)
- 0.0-0.5 = Invalid or out-of-range values (triggers re-prompt with error message)

TIME PERIODS FOR AMOUNTS:
- monthly_spending: MONTHLY amount (per month)
- current_income, pension_income, other_income: ANNUAL amounts (per year)
- All contribution amounts (rrsp_contribution, tfsa_contribution, non_registered_contribution): ANNUAL amounts (per year)
- If user says "$5000" or "five thousand" for other_income without specifying monthly/annual, assume ANNUAL
- If user says "5k a month" for other_income, multiply by 12 to get annual: 5000 × 12 = 60000

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
