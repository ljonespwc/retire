/**
 * Scenario Variants
 *
 * Utility functions to create what-if scenario variations
 * from a baseline scenario for comparison.
 */

import { Scenario } from '@/types/calculator'
import { Province } from '@/types/constants'

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

/**
 * Create "Live to 100" variant
 * Extends longevity age to test plan durability
 *
 * @param baseScenario - Base retirement scenario
 * @param newLongevityAge - Target longevity age (default: 100)
 */
export function createLongevityVariant(
  baseScenario: Scenario,
  newLongevityAge: number = 100
): Scenario {
  return {
    ...baseScenario,
    name: `Live to ${newLongevityAge}`,
    basic_inputs: {
      ...baseScenario.basic_inputs,
      longevity_age: newLongevityAge
    }
  }
}

/**
 * Create "Work Part-Time" variant
 * Adds part-time income for specified years after retirement
 *
 * @param baseScenario - Base retirement scenario
 * @param incomePercentage - Percentage of current income (e.g., 0.25 for 25%)
 * @param durationYears - Number of years to work part-time
 */
export function createPartTimeWorkVariant(
  baseScenario: Scenario,
  incomePercentage: number,
  durationYears: number
): Scenario {
  // Calculate annual amount from current employment or use fallback
  const currentEmployment = baseScenario.income_sources.employment?.annual_amount || 60000
  const annualIncome = Math.round(currentEmployment * incomePercentage)
  const startAge = baseScenario.basic_inputs.retirement_age
  const endAge = startAge + durationYears

  return {
    ...baseScenario,
    name: `Part-Time Work (${Math.round(incomePercentage * 100)}% for ${durationYears}yr)`,
    income_sources: {
      ...baseScenario.income_sources,
      other_income: [
        ...(baseScenario.income_sources.other_income || []),
        {
          description: 'Part-time work',
          annual_amount: annualIncome,
          start_age: startAge,
          end_age: endAge,
          indexed_to_inflation: false
        }
      ]
    }
  }
}

/**
 * Create "Markets Crash" variant
 * Models a market crash in year 1 of retirement with recovery period
 *
 * @param baseScenario - Base retirement scenario
 * @param crashMagnitude - Crash severity (e.g., -0.40 for 40% drop)
 * @param recoveryYears - Years to recover to baseline
 */
export function createMarketCrashVariant(
  baseScenario: Scenario,
  crashMagnitude: number = -0.40,
  recoveryYears: number = 5
): Scenario {
  const retirementAge = baseScenario.basic_inputs.retirement_age
  const currentYear = new Date().getFullYear()
  const yearsUntilRetirement = retirementAge - baseScenario.basic_inputs.current_age
  const crashYear = currentYear + yearsUntilRetirement

  // Calculate recovery return rate needed to get back to baseline
  // Formula: (1 / (1 + crashMagnitude))^(1/recoveryYears) - 1
  const recoveryReturn = Math.pow(1 / (1 + crashMagnitude), 1 / recoveryYears) - 1

  // Build year override map
  const overrides: Record<number, number> = {
    [crashYear]: crashMagnitude // Crash year
  }
  // Recovery years get elevated returns
  for (let i = 1; i <= recoveryYears; i++) {
    overrides[crashYear + i] = recoveryReturn
  }

  return {
    ...baseScenario,
    name: `Markets Crash (${Math.abs(crashMagnitude * 100)}% drop)`,
    assumptions: {
      ...baseScenario.assumptions,
      year_return_overrides: overrides
    }
  }
}

/**
 * Create "Move Provinces" variant
 * Models tax impact of relocating to a different province
 *
 * @param baseScenario - Base retirement scenario
 * @param newProvince - Province to move to
 * @param moveAge - Age at which to move
 */
export function createMoveProvincesVariant(
  baseScenario: Scenario,
  newProvince: Province,
  moveAge: number
): Scenario {
  const currentYear = new Date().getFullYear()
  const yearsUntilMove = moveAge - baseScenario.basic_inputs.current_age
  const moveYear = currentYear + yearsUntilMove
  const yearsUntilLongevity = baseScenario.basic_inputs.longevity_age - baseScenario.basic_inputs.current_age
  const endYear = currentYear + yearsUntilLongevity

  // Build year override map from move year to end of plan
  const overrides: Record<number, Province> = {}
  for (let year = moveYear; year <= endYear; year++) {
    overrides[year] = newProvince
  }

  return {
    ...baseScenario,
    name: `Move to ${newProvince} at ${moveAge}`,
    assumptions: {
      ...baseScenario.assumptions,
      year_province_overrides: overrides
    }
  }
}

/**
 * Create "Receive Inheritance" variant
 * Models impact of receiving an inheritance at a specific age
 *
 * Tax treatment by source type:
 * - cash: No tax (estate paid it)
 * - rrsp_inherited: Fully taxable as income that year
 * - investments: No tax (stepped-up cost basis)
 * - property: No tax (principal residence exemption)
 *
 * @param baseScenario - Base retirement scenario
 * @param amount - Inheritance amount
 * @param receiveAge - Age when inheritance is received
 * @param sourceType - Source type determining tax treatment
 */
export function createReceiveInheritanceVariant(
  baseScenario: Scenario,
  amount: number,
  receiveAge: number,
  sourceType: 'cash' | 'rrsp_inherited' | 'investments' | 'property'
): Scenario {
  const amountFormatted = amount >= 1_000_000
    ? `$${(amount / 1_000_000).toFixed(1)}M`
    : `$${Math.round(amount / 1000)}K`

  return {
    ...baseScenario,
    name: `Inherit ${amountFormatted} at ${receiveAge}`,
    expenses: {
      ...baseScenario.expenses,
      one_time_incomes: [
        ...(baseScenario.expenses.one_time_incomes || []),
        {
          age: receiveAge,
          amount,
          source_type: sourceType,
          destination: 'non_registered' as const,
          description: 'Inheritance'
        }
      ]
    }
  }
}

/**
 * Create "Downsize Home" variant
 * Models unlocking home equity by downsizing or switching to rent
 *
 * @param baseScenario - Base retirement scenario
 * @param currentHomeValue - Current home value
 * @param downsizeAge - Age at which to downsize
 * @param buyOrRent - Whether to buy a smaller home or rent
 * @param newCostOrRent - Cost of new home (if buying) or monthly rent (if renting)
 * @param sellingCostsPct - Selling costs as percentage (default 5%)
 */
export function createDownsizeHomeVariant(
  baseScenario: Scenario,
  currentHomeValue: number,
  downsizeAge: number,
  buyOrRent: 'buy' | 'rent',
  newCostOrRent: number,
  sellingCostsPct: number = 0.05
): Scenario {
  const netProceeds = currentHomeValue * (1 - sellingCostsPct)

  if (buyOrRent === 'buy') {
    // Buying smaller home: net equity = proceeds - new home cost
    const netEquityUnlocked = netProceeds - newCostOrRent
    const amountFormatted = netEquityUnlocked >= 1_000_000
      ? `$${(netEquityUnlocked / 1_000_000).toFixed(1)}M`
      : `$${Math.round(netEquityUnlocked / 1000)}K`

    return {
      ...baseScenario,
      name: `Downsize at ${downsizeAge} (${amountFormatted})`,
      expenses: {
        ...baseScenario.expenses,
        one_time_incomes: [
          ...(baseScenario.expenses.one_time_incomes || []),
          {
            age: downsizeAge,
            amount: netEquityUnlocked,
            source_type: 'property' as const,
            destination: 'non_registered' as const,
            description: 'Home equity (downsize)'
          }
        ]
      }
    }
  } else {
    // Renting: full proceeds added, plus add rent to monthly expenses
    const inflationRate = baseScenario.assumptions.inflation_rate
    const yearsFromRetirement = downsizeAge - baseScenario.basic_inputs.retirement_age

    // Pre-deflate rent so it inflates to target value by downsize age
    const rentBase = yearsFromRetirement > 0
      ? newCostOrRent / Math.pow(1 + inflationRate, yearsFromRetirement)
      : newCostOrRent

    return {
      ...baseScenario,
      name: `Sell & Rent at ${downsizeAge}`,
      expenses: {
        ...baseScenario.expenses,
        one_time_incomes: [
          ...(baseScenario.expenses.one_time_incomes || []),
          {
            age: downsizeAge,
            amount: netProceeds,
            source_type: 'property' as const,
            destination: 'non_registered' as const,
            description: 'Home sale proceeds'
          }
        ],
        age_based_changes: [
          ...(baseScenario.expenses.age_based_changes || []),
          {
            age: downsizeAge,
            monthly_amount: baseScenario.expenses.fixed_monthly + rentBase
          }
        ]
      }
    }
  }
}

