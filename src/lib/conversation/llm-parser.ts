/**
 * LLM-Based Data Parser for Retirement Planning
 *
 * Uses AI to extract structured data from natural language responses.
 * More reliable than regex patterns and handles edge cases naturally.
 */

import { getAIProvider } from '@/lib/ai-provider'
import { Province } from '@/types/constants'

/**
 * Extract age using LLM
 */
export async function extractAge(text: string): Promise<number | null> {
  const aiProvider = getAIProvider()

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

  const cleaned = response.trim().toLowerCase()
  if (cleaned === 'null' || cleaned === 'none') {
    return null
  }

  const age = parseInt(cleaned)
  if (!isNaN(age) && age >= 18 && age <= 120) {
    return age
  }

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

  const cleaned = response.trim().toLowerCase()
  if (cleaned === 'null' || cleaned === 'none') {
    return null
  }

  const pct = parseFloat(cleaned)
  if (!isNaN(pct) && pct >= 0 && pct <= 100) {
    return pct
  }

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

Examples:
"skip" → true
"pass" → true
"I don't know" → true
"not sure" → true
"I'd rather not say" → true
"next question" → true
"I'm 45" → false
"yes" → false`
    },
    {
      role: 'user',
      content: text
    }
  ], { temperature: 0.1, maxTokens: 10 })

  return response.trim().toLowerCase() === 'true'
}
