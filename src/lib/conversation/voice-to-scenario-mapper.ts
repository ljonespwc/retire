/**
 * Voice-to-Scenario Mapper
 *
 * Transforms simplified voice data collection (17 flat fields) into the complex
 * nested structure required by the calculation engine.
 */

import type { BasicInputs, Assets, IncomeSources, Expenses, Assumptions, Scenario } from '@/types/calculator'
import type { Province } from '@/types/constants'

/**
 * Voice-collected data (simplified, flat structure)
 */
export interface VoiceCollectedData {
  currentAge?: number
  retirementAge?: number
  longevityAge?: number
  province?: Province
  currentIncome?: number
  rrsp?: number | null
  rrspContribution?: number | null
  tfsa?: number | null
  tfsaContribution?: number | null
  non_registered?: number | null
  nonRegisteredContribution?: number | null
  monthlySpending?: number
  pensionIncome?: number | null
  cppStartAge?: number
  investmentReturn?: number
  postRetirementReturn?: number
  inflationRate?: number
}

/**
 * Transform voice-collected data into calculator engine format
 *
 * @param voiceData - Simplified data from voice conversation
 * @param scenarioName - Optional name for the scenario (defaults to timestamp)
 * @returns Complete Scenario object ready for calculation engine
 */
export function mapVoiceDataToScenario(
  voiceData: VoiceCollectedData,
  scenarioName?: string
): Omit<Scenario, 'id' | 'created_at' | 'updated_at'> {

  // Validate required fields
  if (!voiceData.currentAge || !voiceData.retirementAge || !voiceData.longevityAge || !voiceData.province) {
    throw new Error('Missing required fields: currentAge, retirementAge, longevityAge, province')
  }

  // Basic inputs (direct mapping)
  const basic_inputs: BasicInputs = {
    current_age: voiceData.currentAge,
    retirement_age: voiceData.retirementAge,
    longevity_age: voiceData.longevityAge,
    province: voiceData.province
  }

  // Assets (nested structure with defaults)
  const assets: Assets = {}

  // Default rate of return (use investment_return or 6%)
  const defaultPreRetirementReturn = (voiceData.investmentReturn || 6) / 100

  if (voiceData.rrsp !== null && voiceData.rrsp !== undefined) {
    assets.rrsp = {
      balance: voiceData.rrsp,
      annual_contribution: voiceData.rrspContribution || undefined,
      rate_of_return: defaultPreRetirementReturn
    }
  }

  if (voiceData.tfsa !== null && voiceData.tfsa !== undefined) {
    assets.tfsa = {
      balance: voiceData.tfsa,
      annual_contribution: voiceData.tfsaContribution || undefined,
      rate_of_return: defaultPreRetirementReturn
    }
  }

  if (voiceData.non_registered !== null && voiceData.non_registered !== undefined) {
    assets.non_registered = {
      balance: voiceData.non_registered,
      annual_contribution: voiceData.nonRegisteredContribution || undefined,
      rate_of_return: defaultPreRetirementReturn,
      cost_base: voiceData.non_registered * 0.7  // Assume 70% cost base for capital gains
    }
  }

  // Income sources
  const income_sources: IncomeSources = {}

  // Employment income (if current_income provided and not yet retired)
  if (voiceData.currentIncome && voiceData.currentIncome > 0) {
    income_sources.employment = {
      annual_amount: voiceData.currentIncome,
      until_age: voiceData.retirementAge
    }
  }

  // CPP (with start age and estimated amount)
  if (voiceData.cppStartAge) {
    income_sources.cpp = {
      start_age: voiceData.cppStartAge,
      monthly_amount_at_65: 1364.60  // 2025 max CPP amount, calculation engine will adjust by earnings
    }
  }

  // OAS (default start at 65)
  income_sources.oas = {
    start_age: 65,
    monthly_amount: 713.34  // 2025 max OAS amount
  }

  // Other income (pensions)
  if (voiceData.pensionIncome && voiceData.pensionIncome > 0) {
    income_sources.other_income = [{
      description: 'Pension Income',
      annual_amount: voiceData.pensionIncome,
      start_age: voiceData.retirementAge,
      indexed_to_inflation: true
    }]
  }

  // Expenses
  const expenses: Expenses = {
    fixed_monthly: voiceData.monthlySpending || 0,
    indexed_to_inflation: true  // Default to inflation-adjusted
  }

  // Assumptions
  const assumptions: Assumptions = {
    pre_retirement_return: defaultPreRetirementReturn,
    post_retirement_return: (voiceData.postRetirementReturn || 4) / 100,
    inflation_rate: (voiceData.inflationRate || 2) / 100
  }

  // Build complete scenario
  const scenario: Omit<Scenario, 'id' | 'created_at' | 'updated_at'> = {
    name: scenarioName || `Voice Scenario ${new Date().toLocaleDateString()}`,
    basic_inputs,
    assets,
    income_sources,
    expenses,
    assumptions
  }

  return scenario
}

/**
 * Validate that voice-collected data is complete enough to create a scenario
 *
 * @param voiceData - Data to validate
 * @returns Object with isValid boolean and missing field names
 */
export function validateVoiceData(voiceData: VoiceCollectedData): {
  isValid: boolean
  missingFields: string[]
} {
  const required = ['currentAge', 'retirementAge', 'longevityAge', 'province', 'monthlySpending']
  const missing: string[] = []

  for (const field of required) {
    if (!voiceData[field as keyof VoiceCollectedData]) {
      missing.push(field)
    }
  }

  return {
    isValid: missing.length === 0,
    missingFields: missing
  }
}
