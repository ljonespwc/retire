/**
 * Scenario Mapper
 *
 * Transforms data between form state (flat 17 fields) and database Scenario structure (nested).
 */

import { Scenario } from '@/types/calculator'
import { Province } from '@/types/constants'

/**
 * Form state interface matching VoiceFirstContentV2 state
 */
export interface FormData {
  // Basic inputs (5 fields)
  currentAge: number | null
  retirementAge: number | null
  longevityAge: number | null
  province: string | null
  currentIncome: number | null

  // Assets (3 fields)
  rrspAmount: number | null
  tfsaAmount: number | null
  nonRegisteredAmount: number | null

  // Contributions (3 fields)
  rrspContribution: number | null
  tfsaContribution: number | null
  nonRegisteredContribution: number | null

  // Income & expenses (4 fields)
  monthlySpending: number | null
  pensionIncome: number | null
  otherIncome: number | null
  cppStartAge: number | null

  // Assumptions (3 fields)
  investmentReturn: number | null
  postRetirementReturn: number | null
  inflationRate: number | null
}

/**
 * Convert form data to Scenario structure for database storage
 */
export function formDataToScenario(
  formData: FormData,
  name: string
): Scenario {
  return {
    name,
    basic_inputs: {
      current_age: formData.currentAge || 40,
      retirement_age: formData.retirementAge || 65,
      longevity_age: formData.longevityAge || 95,
      province: (formData.province as Province) || Province.ON,
    },
    assets: {
      rrsp: formData.rrspAmount
        ? {
            balance: formData.rrspAmount,
            annual_contribution: formData.rrspContribution || 0,
            rate_of_return: (formData.investmentReturn || 6) / 100,
          }
        : undefined,
      tfsa: formData.tfsaAmount
        ? {
            balance: formData.tfsaAmount,
            annual_contribution: formData.tfsaContribution || 0,
            rate_of_return: (formData.investmentReturn || 6) / 100,
          }
        : undefined,
      non_registered: formData.nonRegisteredAmount
        ? {
            balance: formData.nonRegisteredAmount,
            cost_base: formData.nonRegisteredAmount * 0.7, // Default 70% cost base
            annual_contribution: formData.nonRegisteredContribution || 0,
            rate_of_return: (formData.investmentReturn || 6) / 100,
          }
        : undefined,
    },
    income_sources: {
      cpp: formData.cppStartAge
        ? {
            monthly_amount_at_65: 1364.60, // 2025 max
            start_age: formData.cppStartAge,
          }
        : undefined,
      oas: {
        monthly_amount: 713.34, // 2025 max
        start_age: 65,
      },
      other_income: [
        ...(formData.pensionIncome
          ? [
              {
                description: 'Pension',
                annual_amount: formData.pensionIncome * 12, // Convert monthly to annual
                start_age: formData.retirementAge || 65,
                indexed_to_inflation: false,
              },
            ]
          : []),
        ...(formData.otherIncome
          ? [
              {
                description: 'Other Income',
                annual_amount: formData.otherIncome,
                start_age: formData.retirementAge || 65,
                indexed_to_inflation: false,
              },
            ]
          : []),
      ],
    },
    expenses: {
      fixed_monthly: formData.monthlySpending || 5000,
      variable_annual: 0,
      indexed_to_inflation: true,
      age_based_changes: [],
    },
    assumptions: {
      inflation_rate: (formData.inflationRate || 2) / 100,
      pre_retirement_return: (formData.investmentReturn || 6) / 100,
      post_retirement_return: (formData.postRetirementReturn || 5) / 100,
    },
  }
}

/**
 * Convert Scenario structure from database to form data
 */
export function scenarioToFormData(scenario: Scenario): FormData {
  return {
    // Basic inputs
    currentAge: scenario.basic_inputs.current_age,
    retirementAge: scenario.basic_inputs.retirement_age,
    longevityAge: scenario.basic_inputs.longevity_age,
    province: scenario.basic_inputs.province,
    currentIncome: null, // Not stored in scenario

    // Assets
    rrspAmount: scenario.assets.rrsp?.balance || null,
    tfsaAmount: scenario.assets.tfsa?.balance || null,
    nonRegisteredAmount: scenario.assets.non_registered?.balance || null,

    // Contributions
    rrspContribution: scenario.assets.rrsp?.annual_contribution || null,
    tfsaContribution: scenario.assets.tfsa?.annual_contribution || null,
    nonRegisteredContribution: scenario.assets.non_registered?.annual_contribution || null,

    // Income & expenses
    monthlySpending: scenario.expenses.fixed_monthly,
    pensionIncome: scenario.income_sources.other_income?.find(i => i.description === 'Pension')
      ? scenario.income_sources.other_income.find(i => i.description === 'Pension')!.annual_amount / 12
      : null,
    otherIncome: scenario.income_sources.other_income?.find(i => i.description === 'Other Income')?.annual_amount || null,
    cppStartAge: scenario.income_sources.cpp?.start_age || null,

    // Assumptions (convert from decimal to percentage)
    investmentReturn: scenario.assumptions.pre_retirement_return * 100,
    postRetirementReturn: scenario.assumptions.post_retirement_return * 100,
    inflationRate: scenario.assumptions.inflation_rate * 100,
  }
}

/**
 * Generate default scenario name with current date
 */
export function getDefaultScenarioName(): string {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `Retirement Plan - ${dateStr}`
}
