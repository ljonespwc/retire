/**
 * Number Parser for Retirement Planning Conversations
 *
 * Extracts structured data from natural language responses:
 * - Ages (current age, retirement age, longevity)
 * - Dollar amounts (accounts, income, expenses)
 * - Provinces (Canadian provinces/territories)
 * - Percentages (investment returns, spending increases)
 */

import { Province } from '@/types/constants'

/**
 * Extract age from text
 * Handles: "I'm 45", "45 years old", "forty-five", "mid-forties"
 */
export function extractAge(text: string): number | null {
  const normalizedText = text.toLowerCase()

  // Direct number patterns
  const directPatterns = [
    /(?:i'm|i am|age|currently)\s+(\d{1,3})/i,
    /(\d{1,3})\s+(?:years old|year old|yrs old|yr old)/i,
    /^(\d{1,3})$/  // Just a number
  ]

  for (const pattern of directPatterns) {
    const match = normalizedText.match(pattern)
    if (match) {
      const age = parseInt(match[1])
      if (age >= 18 && age <= 120) {
        return age
      }
    }
  }

  // Word-based ages
  const wordAges: Record<string, number> = {
    'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23, 'twenty-four': 24, 'twenty-five': 25,
    'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28, 'twenty-nine': 29,
    'thirty-one': 31, 'thirty-five': 35, 'forty-five': 45, 'fifty-five': 55, 'sixty-five': 65, 'seventy-five': 75
  }

  for (const [word, age] of Object.entries(wordAges)) {
    if (normalizedText.includes(word)) {
      return age
    }
  }

  // Range patterns ("mid-forties", "early sixties", "late fifties")
  const rangePatterns = [
    { pattern: /early\s+(?:twenty|twenties|20s)/i, value: 22 },
    { pattern: /mid\s+(?:twenty|twenties|20s)/i, value: 25 },
    { pattern: /late\s+(?:twenty|twenties|20s)/i, value: 28 },
    { pattern: /early\s+(?:thirty|thirties|30s)/i, value: 32 },
    { pattern: /mid\s+(?:thirty|thirties|30s)/i, value: 35 },
    { pattern: /late\s+(?:thirty|thirties|30s)/i, value: 38 },
    { pattern: /early\s+(?:forty|forties|40s)/i, value: 42 },
    { pattern: /mid\s+(?:forty|forties|40s)/i, value: 45 },
    { pattern: /late\s+(?:forty|forties|40s)/i, value: 48 },
    { pattern: /early\s+(?:fifty|fifties|50s)/i, value: 52 },
    { pattern: /mid\s+(?:fifty|fifties|50s)/i, value: 55 },
    { pattern: /late\s+(?:fifty|fifties|50s)/i, value: 58 },
    { pattern: /early\s+(?:sixty|sixties|60s)/i, value: 62 },
    { pattern: /mid\s+(?:sixty|sixties|60s)/i, value: 65 },
    { pattern: /late\s+(?:sixty|sixties|60s)/i, value: 68 },
    { pattern: /early\s+(?:seventy|seventies|70s)/i, value: 72 },
    { pattern: /mid\s+(?:seventy|seventies|70s)/i, value: 75 },
  ]

  for (const { pattern, value } of rangePatterns) {
    if (pattern.test(normalizedText)) {
      return value
    }
  }

  return null
}

/**
 * Extract dollar amount from text
 * Handles: "$500,000", "500k", "half a million", "1.5 million"
 */
export function extractAmount(text: string): number | null {
  const normalizedText = text.toLowerCase()

  // Remove common words that interfere with parsing
  const cleanText = normalizedText
    .replace(/about|around|approximately|roughly|maybe/gi, '')
    .trim()

  // Pattern: $X,XXX,XXX or $X.X million/thousand/billion
  const currencyPatterns = [
    /\$\s*([\d,]+(?:\.\d+)?)\s*(?:million|mil|m)\b/i,
    /\$\s*([\d,]+(?:\.\d+)?)\s*(?:thousand|k)\b/i,
    /\$\s*([\d,]+(?:\.\d+)?)\s*(?:billion|bil|b)\b/i,
    /\$\s*([\d,]+(?:\.\d+)?)/i  // Just $XXX
  ]

  for (const pattern of currencyPatterns) {
    const match = cleanText.match(pattern)
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''))
      if (pattern.source.includes('million|mil|m')) {
        return num * 1_000_000
      } else if (pattern.source.includes('thousand|k')) {
        return num * 1_000
      } else if (pattern.source.includes('billion|bil|b')) {
        return num * 1_000_000_000
      } else {
        return num
      }
    }
  }

  // Pattern: "500k", "1.5m", "2b" (no dollar sign)
  const shorthandPatterns = [
    /([\d,]+(?:\.\d+)?)\s*(?:million|mil|m)\b/i,
    /([\d,]+(?:\.\d+)?)\s*(?:thousand|k)\b/i,
    /([\d,]+(?:\.\d+)?)\s*(?:billion|bil|b)\b/i,
  ]

  for (const pattern of shorthandPatterns) {
    const match = cleanText.match(pattern)
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''))
      if (pattern.source.includes('million|mil|m')) {
        return num * 1_000_000
      } else if (pattern.source.includes('thousand|k')) {
        return num * 1_000
      } else if (pattern.source.includes('billion|bil|b')) {
        return num * 1_000_000_000
      }
    }
  }

  // Word-based amounts
  const wordAmounts: Record<string, number> = {
    'zero': 0, 'nothing': 0, 'none': 0,
    'hundred': 100, 'thousand': 1_000,
    'million': 1_000_000, 'billion': 1_000_000_000,
    'half a million': 500_000, 'quarter million': 250_000,
    'one million': 1_000_000, 'two million': 2_000_000, 'three million': 3_000_000,
    'five million': 5_000_000, 'ten million': 10_000_000
  }

  for (const [phrase, amount] of Object.entries(wordAmounts)) {
    if (cleanText.includes(phrase)) {
      return amount
    }
  }

  // Just a number (assume dollars if < 1000, otherwise exact value)
  const justNumber = cleanText.match(/^([\d,]+)$/)
  if (justNumber) {
    return parseFloat(justNumber[1].replace(/,/g, ''))
  }

  return null
}

/**
 * Extract province from text
 * Handles: "Ontario", "ON", "I live in BC", "from Quebec"
 */
export function extractProvince(text: string): Province | null {
  const normalizedText = text.toLowerCase()

  // Province name to code mapping
  const provinceMap: Record<string, Province> = {
    'alberta': Province.AB,
    'british columbia': Province.BC,
    'manitoba': Province.MB,
    'new brunswick': Province.NB,
    'newfoundland': Province.NL,
    'newfoundland and labrador': Province.NL,
    'northwest territories': Province.NT,
    'nova scotia': Province.NS,
    'nunavut': Province.NU,
    'ontario': Province.ON,
    'prince edward island': Province.PE,
    'pei': Province.PE,
    'quebec': Province.QC,
    'saskatchewan': Province.SK,
    'yukon': Province.YT,
  }

  // Check for full province names
  for (const [name, code] of Object.entries(provinceMap)) {
    if (normalizedText.includes(name)) {
      return code
    }
  }

  // Check for province codes (AB, BC, ON, etc.)
  const provinceCodePattern = /\b([A-Z]{2})\b/
  const codeMatch = text.match(provinceCodePattern)
  if (codeMatch) {
    const code = codeMatch[1] as Province
    if (Object.values(Province).includes(code)) {
      return code
    }
  }

  return null
}

/**
 * Extract percentage from text
 * Handles: "5%", "five percent", "5 percent", "0.05"
 */
export function extractPercentage(text: string): number | null {
  const normalizedText = text.toLowerCase()

  // Direct percentage patterns
  const percentPatterns = [
    /(\d+(?:\.\d+)?)\s*%/,  // "5%", "5.5%"
    /(\d+(?:\.\d+)?)\s+(?:percent|pct)/i,  // "5 percent"
  ]

  for (const pattern of percentPatterns) {
    const match = normalizedText.match(pattern)
    if (match) {
      const pct = parseFloat(match[1])
      if (pct >= 0 && pct <= 100) {
        return pct
      }
    }
  }

  // Word-based percentages
  const wordPercentages: Record<string, number> = {
    'zero percent': 0,
    'one percent': 1, 'two percent': 2, 'three percent': 3, 'four percent': 4, 'five percent': 5,
    'six percent': 6, 'seven percent': 7, 'eight percent': 8, 'nine percent': 9, 'ten percent': 10
  }

  for (const [phrase, pct] of Object.entries(wordPercentages)) {
    if (normalizedText.includes(phrase)) {
      return pct
    }
  }

  // Decimal patterns (0.05 = 5%)
  const decimalMatch = normalizedText.match(/0\.(\d+)/)
  if (decimalMatch) {
    const decimal = parseFloat('0.' + decimalMatch[1])
    if (decimal >= 0 && decimal <= 1) {
      return decimal * 100
    }
  }

  return null
}

/**
 * Detect skip/decline intent
 * Returns true if user wants to skip a question
 */
export function detectSkipIntent(text: string): boolean {
  const normalizedText = text.toLowerCase()

  const skipPhrases = [
    'skip', 'pass', 'next', 'don\'t know', 'not sure', 'unsure',
    'i don\'t have', 'don\'t have that', 'no idea', 'can\'t say',
    'rather not say', 'prefer not to', 'skip that', 'move on'
  ]

  return skipPhrases.some(phrase => normalizedText.includes(phrase))
}

/**
 * Extract yes/no from text
 * Returns true for yes, false for no, null for uncertain
 */
export function extractYesNo(text: string): boolean | null {
  const normalizedText = text.toLowerCase().trim()

  // Strong yes patterns
  const yesPatterns = ['yes', 'yeah', 'yep', 'sure', 'of course', 'definitely', 'absolutely', 'correct', 'right', 'affirmative', 'i do', 'i am', 'i have']
  if (yesPatterns.some(p => normalizedText.includes(p))) {
    return true
  }

  // Strong no patterns
  const noPatterns = ['no', 'nope', 'nah', 'not', 'negative', 'incorrect', 'wrong', 'i don\'t', 'i am not', 'i\'m not', 'i have not', 'i haven\'t']
  if (noPatterns.some(p => normalizedText.includes(p))) {
    return false
  }

  return null
}
