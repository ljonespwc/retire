/**
 * LLM-Based Data Parser for Retirement Planning
 *
 * Uses AI to extract structured data from natural language responses.
 * More reliable than regex patterns and handles edge cases naturally.
 */

import { getAIProvider } from '@/lib/ai-provider'
import { Province } from '@/types/constants'

// Import Question type for combined parsing
interface Question {
  id: string
  text: string
  type: 'age' | 'amount' | 'province' | 'percentage' | 'yes_no'
  required: boolean
  validation?: (value: any) => boolean
}

/**
 * Extract age using LLM
 */
export async function extractAge(text: string): Promise<number | null> {
  const aiProvider = getAIProvider()

  console.log(`🔍 extractAge input: "${text}"`)

  const response = await aiProvider.generateCompletion([
    {
      role: 'system',
      content: `Extract the age from the user's response. Return ONLY a number between 18-120, or "null" if no valid age is found.

Examples:
"I'm 45" → 45
"forty-five" → 45
"mid-forties" → 45
"retire at 65" → 65
"probably around 60" → 60
"I don't know" → null`
    },
    {
      role: 'user',
      content: text
    }
  ], { temperature: 0.1, maxTokens: 10 })

  console.log(`🤖 extractAge LLM response: "${response}"`)

  const cleaned = response.trim().toLowerCase()
  if (cleaned === 'null' || cleaned === 'none') {
    console.log(`❌ extractAge returning null (cleaned="${cleaned}")`)
    return null
  }

  const age = parseInt(cleaned)
  if (!isNaN(age) && age >= 18 && age <= 120) {
    console.log(`✅ extractAge returning: ${age}`)
    return age
  }

  console.log(`❌ extractAge failed to parse: "${cleaned}", age=${age}`)
  return null
}

/**
 * Extract dollar amount using LLM
 */
export async function extractAmount(text: string): Promise<number | null> {
  const aiProvider = getAIProvider()

  const response = await aiProvider.generateCompletion([
    {
      role: 'system',
      content: `Extract the dollar amount from the user's response. Return ONLY the numeric value (no commas, no dollar signs), or "null" if they don't have it.

Examples:
"$500,000" → 500000
"500k" → 500000
"half a million" → 500000
"1.5 million" → 1500000
"about 300,000" → 300000
"zero" → null
"nothing" → null
"none" → null
"I don't have one" → null
"I don't have any" → null`
    },
    {
      role: 'user',
      content: text
    }
  ], { temperature: 0.1, maxTokens: 20 })

  const cleaned = response.trim().toLowerCase()
  if (cleaned === 'null' || cleaned === 'none') {
    return null
  }

  const amount = parseFloat(cleaned)
  if (!isNaN(amount) && amount >= 0) {
    return amount
  }

  return null
}

/**
 * Extract province using LLM
 */
export async function extractProvince(text: string): Promise<Province | null> {
  const aiProvider = getAIProvider()

  const response = await aiProvider.generateCompletion([
    {
      role: 'system',
      content: `Extract the Canadian province or territory code from the user's response. Return ONLY the 2-letter province code (AB, BC, MB, NB, NL, NT, NS, NU, ON, PE, QC, SK, YT), or "null" if none found.

Examples:
"Ontario" → ON
"British Columbia" → BC
"I live in Alberta" → AB
"BC" → BC
"Quebec" → QC
"PEI" → PE
"Prince Edward Island" → PE
"I'm not sure" → null`
    },
    {
      role: 'user',
      content: text
    }
  ], { temperature: 0.1, maxTokens: 10 })

  const cleaned = response.trim().toUpperCase()
  if (cleaned === 'NULL' || cleaned === 'NONE') {
    return null
  }

  // Validate it's a real province code
  const validProvinces = Object.values(Province)
  if (validProvinces.includes(cleaned as Province)) {
    return cleaned as Province
  }

  return null
}

/**
 * Extract percentage using LLM
 */
export async function extractPercentage(text: string): Promise<number | null> {
  const aiProvider = getAIProvider()

  console.log(`🔍 extractPercentage input: "${text}"`)

  const response = await aiProvider.generateCompletion([
    {
      role: 'system',
      content: `Extract the percentage from the user's response. Return ONLY the numeric value (without % sign), or "null" if no valid percentage is found.

Examples:
"5%" → 5
"five percent" → 5
"about 6.5%" → 6.5
"0.05" → 5
"I think 4 or 5 percent" → 4.5
"not sure" → null`
    },
    {
      role: 'user',
      content: text
    }
  ], { temperature: 0.1, maxTokens: 10 })

  console.log(`🤖 extractPercentage LLM response: "${response}"`)

  const cleaned = response.trim().toLowerCase()
  if (cleaned === 'null' || cleaned === 'none') {
    console.log(`❌ extractPercentage returning null (cleaned="${cleaned}")`)
    return null
  }

  const pct = parseFloat(cleaned)
  if (!isNaN(pct) && pct >= 0 && pct <= 100) {
    console.log(`✅ extractPercentage returning: ${pct}`)
    return pct
  }

  console.log(`❌ extractPercentage failed to parse: "${cleaned}", pct=${pct}`)
  return null
}

/**
 * Extract CPP start age using LLM (60-70 range)
 */
export async function extractCPPStartAge(text: string): Promise<number | null> {
  const aiProvider = getAIProvider()

  console.log(`🔍 extractCPPStartAge input: "${text}"`)

  const response = await aiProvider.generateCompletion([
    {
      role: 'system',
      content: `Extract the CPP start age from the user's response. CPP can start between ages 60-70. Return ONLY a number between 60-70, or "null" if no valid age is found.

Examples:
"65" → 65
"age 65" → 65
"at 60" → 60
"seventy" → 70
"I'll start at 67" → 67
"when I retire at 62" → 62
"I don't know" → null
"45" → null (out of range)
"80" → null (out of range)`
    },
    {
      role: 'user',
      content: text
    }
  ], { temperature: 0.1, maxTokens: 10 })

  console.log(`🤖 extractCPPStartAge LLM response: "${response}"`)

  const cleaned = response.trim().toLowerCase()
  if (cleaned === 'null' || cleaned === 'none') {
    console.log(`❌ extractCPPStartAge returning null (cleaned="${cleaned}")`)
    return null
  }

  const age = parseInt(cleaned)
  if (!isNaN(age) && age >= 60 && age <= 70) {
    console.log(`✅ extractCPPStartAge returning: ${age}`)
    return age
  }

  console.log(`❌ extractCPPStartAge failed to parse or out of range: "${cleaned}", age=${age}`)
  return null
}

/**
 * Extract yes/no using LLM
 */
export async function extractYesNo(text: string): Promise<boolean | null> {
  const aiProvider = getAIProvider()

  const response = await aiProvider.generateCompletion([
    {
      role: 'system',
      content: `Determine if the user's response is yes or no. Return ONLY "true" for yes, "false" for no, or "null" if unclear.

Examples:
"yes" → true
"yeah" → true
"yep" → true
"I do" → true
"no" → false
"nope" → false
"I don't" → false
"not sure" → null
"maybe" → null`
    },
    {
      role: 'user',
      content: text
    }
  ], { temperature: 0.1, maxTokens: 10 })

  const cleaned = response.trim().toLowerCase()
  if (cleaned === 'true') return true
  if (cleaned === 'false') return false
  return null
}

/**
 * Detect skip/decline intent using LLM
 */
export async function detectSkipIntent(text: string): Promise<boolean> {
  const aiProvider = getAIProvider()

  const response = await aiProvider.generateCompletion([
    {
      role: 'system',
      content: `Determine if the user wants to skip the question. Return ONLY "true" if they want to skip, "false" otherwise.

IMPORTANT: "none", "zero", "nothing" are NOT skip intents - they are valid answers meaning they don't have something.

Examples:
"skip" → true
"pass" → true
"I'd rather not say" → true
"next question" → true
"I'm 45" → false
"yes" → false
"none" → false
"zero" → false
"I don't have one" → false`
    },
    {
      role: 'user',
      content: text
    }
  ], { temperature: 0.1, maxTokens: 10 })

  return response.trim().toLowerCase() === 'true'
}

/**
 * COMBINED: Parse answer AND generate response in single LLM call
 *
 * This is a major performance optimization that combines:
 * 1. Data extraction (extractAge, extractAmount, etc.)
 * 2. Validation
 * 3. Response generation (transition to next question or clarification)
 *
 * Result: 50% fewer LLM calls, 50% lower latency per turn
 */
export async function parseAndGenerateResponse(
  currentQuestion: Question,
  userText: string,
  nextQuestion: Question | null
): Promise<{
  parsedValue: any
  isValid: boolean
  spokenResponse: string
}> {
  const aiProvider = getAIProvider()

  console.log(`🎯 parseAndGenerateResponse: question=${currentQuestion.id}, type=${currentQuestion.type}`)

  // Build validation rules text
  let validationRules = ''
  switch (currentQuestion.type) {
    case 'age':
      if (currentQuestion.id === 'current_age') {
        validationRules = 'Must be between 18-100'
      } else if (currentQuestion.id === 'retirement_age') {
        validationRules = 'Must be between 50-80'
      } else if (currentQuestion.id === 'longevity_age') {
        validationRules = 'Must be between 65-105'
      } else if (currentQuestion.id === 'cpp_start_age') {
        validationRules = 'Must be between 60-70 (CPP eligibility range)'
      }
      break
    case 'amount':
      validationRules = 'Must be >= 0. "none", "zero", "nothing" should return null (valid answer meaning they don\'t have it)'
      break
    case 'province':
      validationRules = 'Must be valid Canadian province code: AB, BC, MB, NB, NL, NT, NS, NU, ON, PE, QC, SK, YT'
      break
    case 'percentage':
      validationRules = 'Must be between 0-20'
      break
    case 'yes_no':
      validationRules = 'Must be true or false'
      break
  }

  // Build examples for this question type
  let examples = ''
  switch (currentQuestion.type) {
    case 'age':
      if (currentQuestion.id === 'longevity_age') {
        examples = `"90" → 90
"probably 95" → 95
"I expect to live to 85" → 85
"maybe 100" → 100`
      } else if (currentQuestion.id === 'cpp_start_age') {
        examples = `"65" → 65
"age 60" → 60
"I'll start at 67" → 67
"when I retire at 62" → 62`
      } else {
        examples = `"I'm 45" → 45
"forty-five" → 45
"mid-forties" → 45
"probably around 60" → 60`
      }
      break
    case 'amount':
      examples = `"$500,000" → 500000
"500k" → 500000
"half a million" → 500000
"none" → null
"zero" → null
"I don't have one" → null`
      break
    case 'province':
      examples = `"Ontario" → "ON"
"British Columbia" → "BC"
"I live in Alberta" → "AB"
"BC" → "BC"`
      break
    case 'percentage':
      examples = `"5%" → 5
"five percent" → 5
"about 6.5%" → 6.5
"I think 4 or 5 percent" → 4.5`
      break
    case 'yes_no':
      examples = `"yes" → true
"yeah" → true
"I do" → true
"no" → false
"nope" → false`
      break
  }

  const systemPrompt = `You are helping collect retirement planning data. Parse the user's answer and generate an appropriate spoken response.

CURRENT QUESTION:
"${currentQuestion.text}"
Type: ${currentQuestion.type}
Validation: ${validationRules}

USER'S ANSWER:
"${userText}"

PARSING EXAMPLES FOR ${currentQuestion.type}:
${examples}

TASK:
1. Extract the ${currentQuestion.type} value from the user's answer
2. Validate it against the rules
3. Generate a natural spoken response:
   ${nextQuestion
     ? `- If VALID: Brief acknowledgment (like "got it", "perfect", "thanks") + ask the next question WORD-FOR-WORD: "${nextQuestion.text}"`
     : `- If VALID: Thank them warmly and say you're calculating their retirement projection (2 sentences max)`
   }
   - If INVALID or unclear: Politely ask for clarification, then repeat the CURRENT question word-for-word: "${currentQuestion.text}"

IMPORTANT:
- For amount type, null is VALID (means "none"/"zero")
- Keep responses under 25 words
- Be conversational and friendly
- Don't rephrase questions - use exact wording

Return JSON with this EXACT structure:
{
  "parsedValue": <number|string|boolean|null>,
  "isValid": <true|false>,
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
  ], { temperature: 0.7, maxTokens: 150 })

  console.log(`🤖 parseAndGenerateResponse raw: "${response}"`)

  try {
    // Strip markdown code blocks if present (LLM sometimes returns ```json...```)
    let cleanedResponse = response.trim()
    if (cleanedResponse.startsWith('```')) {
      // Remove opening ```json or ```
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n/, '')
      // Remove closing ```
      cleanedResponse = cleanedResponse.replace(/\n```\s*$/, '')
      console.log(`🧹 Stripped markdown, cleaned: "${cleanedResponse}"`)
    }

    // Parse JSON response
    const parsed = JSON.parse(cleanedResponse)

    console.log(`✅ parseAndGenerateResponse result: parsedValue=${parsed.parsedValue}, isValid=${parsed.isValid}`)

    return {
      parsedValue: parsed.parsedValue,
      isValid: parsed.isValid === true,
      spokenResponse: parsed.spokenResponse
    }
  } catch (error) {
    console.error('❌ Failed to parse LLM response as JSON:', error)
    // Fallback: treat as invalid and ask for clarification
    return {
      parsedValue: null,
      isValid: false,
      spokenResponse: `I'm sorry, I didn't quite catch that. ${currentQuestion.text}`
    }
  }
}
