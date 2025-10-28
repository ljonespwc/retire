/**
 * Scenario Variants
 *
 * Utility functions to create what-if scenario variations
 * from a baseline scenario for comparison.
 */

import { Scenario } from '@/types/calculator'

/**
 * Create "Front-Load the Fun" variant
 * Models go-go, slow-go, no-go retirement phases
 */
export function createFrontLoadVariant(baseScenario: Scenario): Scenario {
  const baseline = baseScenario.expenses.fixed_monthly
  const retirementAge = baseScenario.basic_inputs.retirement_age

  return {
    ...baseScenario,
    name: 'Front-Load the Fun',
    expenses: {
      ...baseScenario.expenses,
      age_based_changes: [
        {
          age: retirementAge, // Go-go years start
          monthly_amount: baseline * 1.30 // +30%
        },
        {
          age: retirementAge + 10, // Slow-go years start
          monthly_amount: baseline * 0.85 // -15%
        },
        {
          age: retirementAge + 20, // No-go years start
          monthly_amount: baseline * 0.75 // -25%
        }
      ]
    }
  }
}

/**
 * Create "Delay CPP/OAS" variant
 * Moves government benefit start ages to 70
 */
export function createDelayCppOasVariant(baseScenario: Scenario): Scenario {
  return {
    ...baseScenario,
    name: 'Delay CPP/OAS to 70',
    income_sources: {
      ...baseScenario.income_sources,
      cpp: baseScenario.income_sources.cpp ? {
        ...baseScenario.income_sources.cpp,
        start_age: 70
      } : undefined,
      oas: baseScenario.income_sources.oas ? {
        ...baseScenario.income_sources.oas,
        start_age: 70
      } : undefined
    }
  }
}

/**
 * Create "Leave a Legacy" variant
 * Preserves percentage of starting portfolio
 *
 * NOTE: This feature requires calculation engine support for legacy preservation.
 * Commented out until the Expenses interface includes legacy_preservation_percentage.
 */
/*
export function createLegacyVariant(
  baseScenario: Scenario,
  percentage: number = 0.25
): Scenario {
  return {
    ...baseScenario,
    name: `Leave Legacy (${percentage * 100}%)`,
    expenses: {
      ...baseScenario.expenses,
      // legacy_preservation_percentage: percentage
    }
  }
}
*/

/**
 * Create "Retire Earlier" variant
 * Reduces retirement age by specified years
 */
export function createRetireEarlyVariant(
  baseScenario: Scenario,
  yearsEarlier: number = 3
): Scenario {
  const newRetirementAge = baseScenario.basic_inputs.retirement_age - yearsEarlier

  return {
    ...baseScenario,
    name: `Retire ${yearsEarlier} Years Earlier`,
    basic_inputs: {
      ...baseScenario.basic_inputs,
      retirement_age: newRetirementAge
    }
  }
}

/**
 * Calculate quick estimates for a scenario variant
 * (Client-side, no full calculation)
 */
export interface QuickEstimate {
  extraSpendingGoGo?: number
  portfolioImpactYears?: number
  lifetimeIncomeGain?: number
  requiredPortfolioExtra?: number
  legacyTarget?: number
  spendingAdjustment?: number
}

export function estimateScenarioImpact(
  baseScenario: Scenario,
  variantType: 'front_load' | 'delay_benefits' | 'legacy' | 'retire_early'
): QuickEstimate {
  const baselineMonthly = baseScenario.expenses.fixed_monthly
  const baselineAnnual = baselineMonthly * 12
  const retirementAge = baseScenario.basic_inputs.retirement_age
  const longevityAge = baseScenario.basic_inputs.longevity_age

  switch (variantType) {
    case 'front_load':
      const goGoYears = 10
      const extraPerYear = baselineAnnual * 0.30
      const totalExtraGoGo = extraPerYear * goGoYears

      return {
        extraSpendingGoGo: totalExtraGoGo,
        portfolioImpactYears: 2 // Rough estimate: depletes ~2 years earlier
      }

    case 'delay_benefits':
      const yearsDelayed = 5 // 65 to 70
      const cppBase = 15679 // 2025 max CPP at 65
      const oasBase = 8764 // 2025 max OAS at 65
      const cppAt70 = cppBase * 1.42
      const oasAt70 = oasBase * 1.36
      const annualGain = (cppAt70 - cppBase) + (oasAt70 - oasBase)
      const yearsReceiving = longevityAge - 70
      const lifetimeGain = annualGain * yearsReceiving
      const requiredExtra = (cppBase + oasBase) * yearsDelayed

      return {
        lifetimeIncomeGain: lifetimeGain,
        requiredPortfolioExtra: requiredExtra
      }

    case 'legacy':
      // Calculate starting portfolio total
      const startingPortfolio =
        (baseScenario.assets.rrsp?.balance || 0) +
        (baseScenario.assets.tfsa?.balance || 0) +
        (baseScenario.assets.non_registered?.balance || 0)

      const legacyTarget = startingPortfolio * 0.25 // 25% preservation

      // Rough estimate: need to reduce spending by ~10-15% to preserve 25%
      const estimatedReduction = baselineMonthly * 0.13

      return {
        legacyTarget,
        spendingAdjustment: -estimatedReduction
      }

    case 'retire_early':
      return {
        portfolioImpactYears: 6 // Rough estimate: 3 extra years = ~6 years earlier depletion
      }

    default:
      return {}
  }
}
