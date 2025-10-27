/**
 * Batch Response Parser for Retirement Planning
 *
 * Parses multiple question answers from a single natural language response.
 * Used for batch-based conversation flow in /calculator/home.
 */

import { getAIProvider } from '@/lib/ai-provider'
import { Province } from '@/types/constants'
import type { QuestionBatch } from './batch-flow-manager'
import { z } from 'zod'

/**
 * Cached examples for LLM prompt (never change, so we cache them)
 */
const PARSING_EXAMPLES = `Example batch responses:
"I'm 58, retiring at 65, expect to live to 90, I live in Ontario, and make 120k a year"
  → current_age: 58 (conf: 1.0), retirement_age: 65 (conf: 1.0), longevity_age: 90 (conf: 1.0), province: "ON" (conf: 1.0), current_income: 120000 (conf: 1.0)

"1.7 million TFSA, 300k non-registered" (RRSP not mentioned)
  → rrsp_amount: null (conf: 0.0 - NOT MENTIONED), tfsa_amount: 1700000 (conf: 1.0), non_registered_amount: 300000 (conf: 1.0)

"1.7 million RRSP, 300k TFSA, no non-registered" (user said "no")
  → rrsp_amount: 1700000 (conf: 1.0), tfsa_amount: 300000 (conf: 1.0), non_registered_amount: null (conf: 1.0 - user said "no")

"CPP at 60, no pension, no other income" (monthly_spending not mentioned)
  → monthly_spending: null (conf: 0.0 - NOT MENTIONED), pension_income: null (conf: 1.0 - user said "no"), cpp_start_age: 60 (conf: 1.0), other_income: null (conf: 1.0 - user said "no")

"$2500" (monthly_spending provided, pension/cpp/other already collected)
  With [ALREADY COLLECTED] tags: pension_income [none/zero], cpp_start_age [60], other_income [none/zero]
  → monthly_spending: 2500 (conf: 1.0), pension_income: null (conf: 1.0 - preserved), cpp_start_age: 60 (conf: 1.0 - preserved), other_income: null (conf: 1.0 - preserved)

"I'm not sure about returns, just use standard assumptions"
  → investment_return: 6 (conf: 1.0 - using default), post_retirement_return: 4 (conf: 1.0 - using default), inflation_rate: 2 (conf: 1.0 - using default)`

/**
 * Build validation rules for a question
 * Extracted as helper to keep main function clean
 */
function getValidationRule(qId: string, qType: string): string {
  switch (qType) {
    case 'age':
      if (qId === 'current_age') return `${qId}: 18-100 (error: "Age must be between 18 and 100")`
      if (qId === 'retirement_age') return `${qId}: 50-80 (error: "Retirement age must be between 50 and 80")`
      if (qId === 'longevity_age') return `${qId}: 65-105 (error: "Life expectancy must be between 65 and 105")`
      if (qId === 'cpp_start_age') return `${qId}: 60-70 (error: "CPP can only start between age 60 and 70")`
      return `${qId}: valid age`
    case 'amount':
      if (qId === 'current_income') return `${qId}: >= 0, max 1000000 (error: "Income must be under $1 million")`
      if (qId === 'monthly_spending') return `${qId}: > 0, max 100000 (error: "Monthly spending must be > $0")`
      return `${qId}: null for "none"/"zero", number for actual amounts`
    case 'province':
      return `${qId}: Map province/territory names to 2-letter codes. Alberta→AB, British Columbia/BC→BC, Manitoba→MB, New Brunswick→NB, Newfoundland→NL, Northwest Territories→NT, Nova Scotia→NS, Nunavut→NU, Ontario→ON, PEI/Prince Edward Island→PE, Quebec→QC, Saskatchewan→SK, Yukon→YT. If not mentioned: null, conf 0.0`
    case 'percentage':
      if (qId === 'investment_return') return `${qId}: 0-20 (default 6 if "not sure"). If not mentioned: null, conf 0.0`
      if (qId === 'post_retirement_return') return `${qId}: 0-20 (default 4 if "not sure"). If not mentioned: null, conf 0.0`
      if (qId === 'inflation_rate') return `${qId}: 0-10 (default 2 if "not sure"). If not mentioned: null, conf 0.0`
      return `${qId}: 0-20. If not mentioned: null, conf 0.0`
    default:
      return `${qId}: valid value`
  }
}

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

  // Detect if this is a re-prompt turn (filling in missing fields from previous attempt)
  const isRepromptTurn = existingValues.size > 0

  // Build question list for prompt, marking already-collected values
  const questionList = batch.questions.map((q, idx) => {
    const hasValue = existingValues.has(q.id)  // Check if key exists in Map (works for null too!)
    const existingValue = existingValues.get(q.id)
    return `${idx + 1}. ${q.id} (${q.type}): "${q.text}"${hasValue ? ` [ALREADY COLLECTED: ${existingValue === null ? 'none/zero' : existingValue}]` : ''}`
  }).join('\n')

  // Build validation rules using helper function
  const validationRules = batch.questions.map(q => getValidationRule(q.id, q.type)).join('\n')

  // Special instruction for re-prompt turns to prevent mentioning fields in transition
  const repromptInstruction = isRepromptTurn && nextBatch
    ? `\n\n⚠️ RE-PROMPT CONTEXT: User is filling in missing fields from a previous turn. If the batch is now complete with this response, give ONLY a brief 1-2 word acknowledgment like "Perfect!", "Great!", or "Got it!". DO NOT mention specific field names or values in the transition.`
    : ''

  const systemPrompt = `Parse user's response for retirement planning questions.${repromptInstruction}

⚠️ CRITICAL REQUIREMENTS:
1. You MUST return ALL ${batch.questions.length} fields in the JSON response
2. MANDATORY: Include every field listed below - incomplete JSON causes errors
3. Every field must have a value (number/string/null) AND confidence score

QUESTIONS:
${questionList}

USER'S RESPONSE: "${userText}"

VALIDATION RULES:
${validationRules}

PARSING RULES:
1. 🔴 [ALREADY COLLECTED] fields: Return exact value shown with conf 1.0 (MANDATORY - preserves previous data)
   Example: "pension [ALREADY COLLECTED: none/zero]" → return null, conf 1.0
2. Extract values user mentioned in THIS response
3. Validate against rules above
4. Invalid values: Low conf (< 0.5) + explain error in spokenResponse
5. NOT mentioned AND NOT collected: null, conf 0.0 (triggers re-prompt)
6. User said "none"/"zero"/"don't have": null, conf 1.0 (valid answer)
7. Generate spoken response:
   - Invalid values: Explain error + ask again
   - Missing fields: Acknowledge received + ask for missing (ignore [ALREADY COLLECTED])
   - All complete: ${nextBatch ? `ONLY say "Perfect!", "Great!", or "Got it!" - NO field names` : `Tell them to click the Calculate button`}

CONFIDENCE SCORING:
- 1.0 = [ALREADY COLLECTED] (always), explicit value, or user said "none"
- 0.0 = NOT mentioned (triggers re-prompt)
- <0.5 = Invalid/out-of-range

TIME PERIODS:
- monthly_spending: MONTHLY. All others (income, contributions): ANNUAL
- "5k a month" for income = 5000 × 12 = 60000

EXAMPLES:
${PARSING_EXAMPLES}

Return ONLY JSON (no text before/after). ALL ${batch.questions.length} fields REQUIRED:
{
  "values": {${batch.questions.map(q => `"${q.id}": <value|null>`).join(', ')}},
  "confidence": {${batch.questions.map(q => `"${q.id}": <0.0-1.0>`).join(', ')}},
  "missingFields": [<IDs user didn't answer>],
  "spokenResponse": "<response under 20 words>"
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
  ], { temperature: 0.2, maxTokens: 1200 })

  console.log(`🤖 parseBatchResponse raw: "${response}"`)

  try {
    // Strip markdown code blocks and extract JSON
    let cleanedResponse = response.trim()
      .replace(/^```(?:json)?\s*\n/, '')  // Remove opening code block
      .replace(/\n```\s*$/, '')            // Remove closing code block
      .replace(/^[^{]*/, '')               // Remove any preamble before {

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

    console.log(`✅ parseBatchResponse result:`, {
      values: Object.fromEntries(values),
      missingFields: validated.missingFields
    })

    // Webhook will calculate actual missing fields after merging with existing values
    return {
      values,
      confidence,
      missingFields: validated.missingFields,  // Pass through LLM's assessment
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
