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
 *
 * The multipliers are calculated dynamically to account for inflation,
 * so that NOMINAL spending actually drops at each phase transition.
 * Without this adjustment, inflation would cause slow-go and no-go
 * spending to inflate back up to near go-go levels.
 */
export function createFrontLoadVariant(baseScenario: Scenario): Scenario {
  const baseline = baseScenario.expenses.fixed_monthly
  const retirementAge = baseScenario.basic_inputs.retirement_age
  const inflationRate = baseScenario.assumptions.inflation_rate

  const goGoMultiplier = 1.30

  // Target: slow-go nominal = 65% of go-go nominal at retirement
  // Pre-deflate by 10 years of inflation so inflated value hits target
  const slowGoNominalTarget = baseline * goGoMultiplier * 0.65
  const slowGoBase = slowGoNominalTarget / Math.pow(1 + inflationRate, 10)

  // Target: no-go nominal = 50% of go-go nominal at retirement
  // Pre-deflate by 20 years of inflation so inflated value hits target
  const noGoNominalTarget = baseline * goGoMultiplier * 0.50
  const noGoBase = noGoNominalTarget / Math.pow(1 + inflationRate, 20)

  return {
    ...baseScenario,
    name: 'Front-Load the Fun',
    expenses: {
      ...baseScenario.expenses,
      age_based_changes: [
        {
          age: retirementAge, // Go-go years start
          monthly_amount: baseline * goGoMultiplier // +30% of baseline
        },
        {
          age: retirementAge + 10, // Slow-go years start
          monthly_amount: slowGoBase // ~65% of go-go nominal
        },
        {
          age: retirementAge + 20, // No-go years start
          monthly_amount: noGoBase // ~50% of go-go nominal
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
 * @param baseScenario - Base retirement scenario
 * @param percentage - Percentage to preserve (default 0.25 = 25%)
 */
export function createLegacyVariant(
  baseScenario: Scenario,
  percentage: number = 0.25
): Scenario {
  return {
    ...baseScenario,
    name: `Leave Legacy (${percentage * 100}%)`,
    expenses: {
      ...baseScenario.expenses,
      legacy_preservation_percentage: percentage
    }
  }
}

/**
 * Create "Retire Earlier" variant
 * Sets retirement age to specific age
 *
 * @param baseScenario - Base retirement scenario
 * @param newRetirementAge - Target retirement age (or years earlier if < 20)
 */
export function createRetireEarlyVariant(
  baseScenario: Scenario,
  newRetirementAge: number
): Scenario {
  // If newRetirementAge is small (< 20), treat it as "years earlier"
  // Otherwise, treat it as the actual retirement age
  const targetAge = newRetirementAge < 20
    ? baseScenario.basic_inputs.retirement_age - newRetirementAge
    : newRetirementAge

  const yearsEarlier = baseScenario.basic_inputs.retirement_age - targetAge

  return {
    ...baseScenario,
    name: `Retire ${yearsEarlier} Year${yearsEarlier !== 1 ? 's' : ''} Earlier`,
    basic_inputs: {
      ...baseScenario.basic_inputs,
      retirement_age: targetAge
    },
    income_sources: {
      ...baseScenario.income_sources,
      // Update employment end age if present
      employment: baseScenario.income_sources.employment ? {
        ...baseScenario.income_sources.employment,
        until_age: targetAge
      } : undefined,
      // Update pension start age to match new retirement age
      pension: baseScenario.income_sources.pension ? {
        ...baseScenario.income_sources.pension,
        start_age: targetAge
      } : undefined
    }
  }
}

/**
 * Create "Exhaust Portfolio" variant
 * Uses optimized spending amount to deplete portfolio at longevity age
 *
 * @param baseScenario - Base retirement scenario
 * @param optimizedSpending - Monthly spending calculated by binary search optimization
 */
export function createExhaustPortfolioVariant(
  baseScenario: Scenario,
  optimizedSpending: number
): Scenario {
  return {
    ...baseScenario,
    name: 'Exhaust Your Portfolio',
    expenses: {
      ...baseScenario.expenses,
      fixed_monthly: optimizedSpending
    }
  }
}

/**
 * Create "Lump Sum Withdrawal" variant
 * Models impact of a large one-time withdrawal
 *
 * @param baseScenario - Base retirement scenario
 * @param amount - Withdrawal amount
 * @param withdrawalAge - Age at which withdrawal occurs
 * @param sourceAccount - Account to withdraw from ('smart' for tax-optimized)
 */
export function createLumpSumWithdrawalVariant(
  baseScenario: Scenario,
  amount: number,
  withdrawalAge: number,
  sourceAccount: 'non_registered' | 'rrsp' | 'tfsa' | 'smart' = 'smart'
): Scenario {
  const amountFormatted = amount >= 1_000_000
    ? `$${(amount / 1_000_000).toFixed(1)}M`
    : `$${Math.round(amount / 1000)}K`

  return {
    ...baseScenario,
    name: `${amountFormatted} Lump Sum at ${withdrawalAge}`,
    expenses: {
      ...baseScenario.expenses,
      one_time_withdrawals: [
        {
          age: withdrawalAge,
          amount,
          source: sourceAccount,
          description: 'One-time withdrawal'
        }
      ]
    }
  }
}

