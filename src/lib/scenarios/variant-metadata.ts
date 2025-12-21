/**
 * Variant Metadata Utilities
 *
 * Handles persistence and regeneration of scenario variants.
 * Variants are temporary explorations that can be saved as new scenarios.
 * When saved, variant metadata is stored to allow regeneration on load.
 */

import { Scenario } from '@/types/calculator'
import {
  createFrontLoadVariant,
  createDelayCppOasVariant,
  createRetireEarlyVariant,
  createExhaustPortfolioVariant,
  createLegacyVariant,
  createLumpSumWithdrawalVariant,
  createLongevityVariant,
  createPartTimeWorkVariant,
  createMarketCrashVariant,
  createMoveProvincesVariant,
  createReceiveInheritanceVariant,
  createDownsizeHomeVariant
} from '@/lib/calculations/scenario-variants'
import { Province } from '@/types/constants'
import { calculateCPPAdjustmentFactor, calculateOASAdjustmentFactor } from '@/lib/calculations/government-benefits'

/**
 * Supported variant types
 */
export type VariantType =
  | 'front-load'
  | 'delay-cpp-oas'
  | 'retire-early'
  | 'exhaust-portfolio'
  | 'legacy'
  | 'lump-sum'
  | 'longevity'
  | 'part-time-work'
  | 'market-crash'
  | 'move-provinces'
  | 'receive-inheritance'
  | 'downsize-home'

/**
 * Baseline snapshot stored with variants for standalone comparison context
 */
export interface BaselineSnapshot {
  name: string // Baseline scenario name
  ending_balance: number // Final portfolio value
  monthly_spending: number // Monthly spending amount
  retirement_age: number // Retirement age
  cpp_start_age: number // CPP start age
  oas_start_age: number // OAS start age
  portfolio_depleted_age?: number // Age when portfolio depletes (if applicable)
}

/**
 * Variant metadata structure stored in scenario inputs
 */
export interface VariantMetadata {
  variant_type: VariantType
  variant_config?: Record<string, any> // Optional config for parameterized variants
  created_from_baseline_id?: string // Optional reference to original baseline
  baseline_snapshot?: BaselineSnapshot // Snapshot of baseline scenario for standalone context
  created_at?: string // ISO timestamp when variant was created
  ai_insight?: string // AI-generated comparison insight (snapshot from creation)
  ai_narrative?: string // AI-generated retirement summary (snapshot from creation)
}

/**
 * Check if a scenario has variant metadata
 */
export function hasVariantMetadata(inputs: any): boolean {
  return inputs?.__metadata?.variant_type !== undefined
}

/**
 * Extract variant metadata from scenario inputs
 */
export function getVariantMetadata(inputs: any): VariantMetadata | null {
  if (!hasVariantMetadata(inputs)) {
    return null
  }
  return inputs.__metadata as VariantMetadata
}

/**
 * Add variant metadata to scenario inputs
 */
export function addVariantMetadata(
  inputs: any,
  variantType: VariantType,
  config?: Record<string, any>,
  baselineId?: string,
  baselineSnapshot?: BaselineSnapshot,
  aiInsight?: string,
  aiNarrative?: string
): any {
  return {
    ...inputs,
    __metadata: {
      variant_type: variantType,
      variant_config: config,
      created_from_baseline_id: baselineId,
      baseline_snapshot: baselineSnapshot,
      created_at: new Date().toISOString(),
      ai_insight: aiInsight,
      ai_narrative: aiNarrative
    } as VariantMetadata
  }
}

/**
 * Remove variant metadata from scenario inputs
 */
export function removeVariantMetadata(inputs: any): any {
  const { __metadata, ...cleanInputs } = inputs
  return cleanInputs
}

/**
 * Regenerate a variant from its metadata and baseline scenario
 *
 * This is used when loading a saved variant to recreate the
 * variant-specific modifications from the current baseline values.
 */
export function regenerateVariant(
  baseScenario: Scenario,
  variantType: VariantType,
  config?: Record<string, any>
): Scenario {
  switch (variantType) {
    case 'front-load':
      return createFrontLoadVariant(baseScenario)
    case 'delay-cpp-oas':
      return createDelayCppOasVariant(baseScenario)
    case 'retire-early':
      // Check if config has newRetirementAge parameter
      const newRetirementAge = config?.newRetirementAge || baseScenario.basic_inputs.retirement_age - 3
      return createRetireEarlyVariant(baseScenario, newRetirementAge)
    case 'exhaust-portfolio':
      // Use stored optimized spending from config (calculated during original optimization)
      const optimizedSpending = config?.optimizedSpending || baseScenario.expenses.fixed_monthly
      return createExhaustPortfolioVariant(baseScenario, optimizedSpending)
    case 'legacy': {
      // Use stored percentage from config or default to 25%
      const percentage = config?.percentage || 0.25
      const variant = createLegacyVariant(baseScenario, percentage)

      // Use stored optimized spending if available (avoids re-running optimization)
      if (config?.optimizedSpending) {
        variant.expenses.fixed_monthly = config.optimizedSpending
      }

      return variant
    }
    case 'lump-sum': {
      // Use stored config values or defaults
      const amount = config?.amount || 100000
      const withdrawalAge = config?.withdrawalAge || baseScenario.basic_inputs.retirement_age + 5
      const sourceAccount = config?.sourceAccount || 'smart'
      return createLumpSumWithdrawalVariant(baseScenario, amount, withdrawalAge, sourceAccount)
    }
    case 'longevity': {
      const newLongevityAge = config?.newLongevityAge || 100
      return createLongevityVariant(baseScenario, newLongevityAge)
    }
    case 'part-time-work': {
      const incomePercentage = config?.incomePercentage || 0.25
      const durationYears = config?.durationYears || 5
      return createPartTimeWorkVariant(baseScenario, incomePercentage, durationYears)
    }
    case 'market-crash': {
      const crashMagnitude = config?.crashMagnitude || -0.40
      const recoveryYears = config?.recoveryYears || 5
      return createMarketCrashVariant(baseScenario, crashMagnitude, recoveryYears)
    }
    case 'move-provinces': {
      const newProvince = (config?.newProvince || 'AB') as Province
      const moveAge = config?.moveAge || baseScenario.basic_inputs.retirement_age
      return createMoveProvincesVariant(baseScenario, newProvince, moveAge)
    }
    case 'receive-inheritance': {
      const amount = config?.amount || 100000
      const receiveAge = config?.receiveAge || baseScenario.basic_inputs.retirement_age + 5
      const sourceType = config?.sourceType || 'cash'
      return createReceiveInheritanceVariant(baseScenario, amount, receiveAge, sourceType)
    }
    case 'downsize-home': {
      const currentHomeValue = config?.currentHomeValue || 600000
      const downsizeAge = config?.downsizeAge || baseScenario.basic_inputs.retirement_age + 5
      const buyOrRent = config?.buyOrRent || 'buy'
      const newCostOrRent = config?.newCostOrRent || 400000
      const sellingCostsPct = config?.sellingCostsPct || 0.05
      return createDownsizeHomeVariant(baseScenario, currentHomeValue, downsizeAge, buyOrRent, newCostOrRent, sellingCostsPct)
    }
    default:
      // Unknown variant type - return base scenario unchanged
      console.warn(`Unknown variant type: ${variantType}`)
      return baseScenario
  }
}

/**
 * Get user-friendly variant name
 */
export function getVariantDisplayName(variantType: VariantType): string {
  const names: Record<VariantType, string> = {
    'front-load': 'Front-Load the Fun',
    'delay-cpp-oas': 'Delay CPP/OAS to Age 70',
    'retire-early': 'Retire Early',
    'exhaust-portfolio': 'Exhaust Your Portfolio',
    'legacy': 'Leave a Legacy',
    'lump-sum': 'Lump Sum Withdrawal',
    'longevity': 'Live to 100',
    'part-time-work': 'Work Part-Time',
    'market-crash': 'Markets Crash',
    'move-provinces': 'Move Provinces',
    'receive-inheritance': 'Receive Inheritance',
    'downsize-home': 'Downsize Home'
  }
  const baseName = names[variantType] || variantType
  return `What-If Variant: ${baseName}`
}

/**
 * Get variant type from scenario name (for backwards compatibility)
 */
export function detectVariantTypeFromName(name: string): VariantType | null {
  const lowercaseName = name.toLowerCase()

  if (lowercaseName.includes('front-load') || lowercaseName.includes('front load')) {
    return 'front-load'
  }
  if (lowercaseName.includes('delay cpp') || lowercaseName.includes('delay-cpp') || lowercaseName.includes('delay oas')) {
    return 'delay-cpp-oas'
  }
  if (lowercaseName.includes('retire early') || lowercaseName.includes('retire-early') || lowercaseName.includes('earlier')) {
    return 'retire-early'
  }
  if (lowercaseName.includes('exhaust') || lowercaseName.includes('maximize') || lowercaseName.includes('maximum')) {
    return 'exhaust-portfolio'
  }
  if (lowercaseName.includes('legacy') || lowercaseName.includes('leave') || lowercaseName.includes('preserve')) {
    return 'legacy'
  }
  if (lowercaseName.includes('lump sum') || lowercaseName.includes('lump-sum') || lowercaseName.includes('withdrawal')) {
    return 'lump-sum'
  }
  if (lowercaseName.includes('live to') || lowercaseName.includes('longevity')) {
    return 'longevity'
  }
  if (lowercaseName.includes('part-time') || lowercaseName.includes('part time')) {
    return 'part-time-work'
  }
  if (lowercaseName.includes('crash') || lowercaseName.includes('market')) {
    return 'market-crash'
  }
  if (lowercaseName.includes('move to') || lowercaseName.includes('move-provinces')) {
    return 'move-provinces'
  }
  if (lowercaseName.includes('inherit') || lowercaseName.includes('inheritance')) {
    return 'receive-inheritance'
  }
  if (lowercaseName.includes('downsize') || lowercaseName.includes('sell & rent')) {
    return 'downsize-home'
  }

  return null
}

/**
 * Variant detail item for display
 */
export interface VariantDetailItem {
  label: string
  value: string
}

/**
 * Variant details structure for display
 */
export interface VariantDetails {
  title: string
  items: VariantDetailItem[]
}

/**
 * Get detailed breakdown of variant changes for display
 *
 * @param variantType - Type of variant
 * @param scenario - The scenario with variant applied (optional, for specific values)
 * @param baselineSnapshot - Optional baseline snapshot for contextual comparison labels
 * @returns Structured details for UI display
 */
export function getVariantDetails(
  variantType: VariantType,
  scenario?: Scenario,
  baselineSnapshot?: BaselineSnapshot
): VariantDetails {
  switch (variantType) {
    case 'front-load': {
      const baseline = baselineSnapshot?.monthly_spending || scenario?.expenses.fixed_monthly || 0
      const retirementAge = scenario?.basic_inputs.retirement_age || 65
      const inflationRate = scenario?.assumptions.inflation_rate || 0.02

      // Match the actual formula from createFrontLoadVariant
      const goGoMultiplier = 1.30
      const goGoAmount = baseline * goGoMultiplier

      // Pre-deflated amounts (what's actually stored in age_based_changes)
      const slowGoNominalTarget = baseline * goGoMultiplier * 0.65
      const slowGoBase = slowGoNominalTarget / Math.pow(1 + inflationRate, 10)

      const noGoNominalTarget = baseline * goGoMultiplier * 0.50
      const noGoBase = noGoNominalTarget / Math.pow(1 + inflationRate, 20)

      // Format baseline spending reference
      const baselineSpendingLabel = baselineSnapshot
        ? 'Baseline Plan Spending'
        : 'Baseline Spending'

      return {
        title: 'Front-Load the Fun (Go-Go, Slow-Go, No-Go)',
        items: [
          {
            label: `Ages ${retirementAge}-${retirementAge + 9} (Go-Go Years)`,
            value: `$${Math.round(goGoAmount).toLocaleString()}/month (+30%)`
          },
          {
            label: `Ages ${retirementAge + 10}-${retirementAge + 19} (Slow-Go Years)`,
            value: `$${Math.round(slowGoBase).toLocaleString()}/month (→ ~$${Math.round(slowGoNominalTarget).toLocaleString()} with inflation)`
          },
          {
            label: `Ages ${retirementAge + 20}+ (No-Go Years)`,
            value: `$${Math.round(noGoBase).toLocaleString()}/month (→ ~$${Math.round(noGoNominalTarget).toLocaleString()} with inflation)`
          },
          {
            label: baselineSpendingLabel,
            value: `$${Math.round(baseline).toLocaleString()}/month (for comparison)`
          }
        ]
      }
    }

    case 'delay-cpp-oas': {
      // Variant always sets to age 70
      const variantCppAge = 70
      const variantOasAge = 70

      const cppMonthlyAt65 = scenario?.income_sources.cpp?.monthly_amount_at_65 || 1364.60
      const oasMonthlyAt65 = scenario?.income_sources.oas?.monthly_amount || 713.34

      // Get baseline ages (from snapshot or default to 65)
      const baselineCppAge = baselineSnapshot?.cpp_start_age || 65
      const baselineOasAge = baselineSnapshot?.oas_start_age || 65

      // Calculate adjustment factors
      const cppBaselineFactor = calculateCPPAdjustmentFactor(baselineCppAge).factor
      const cppVariantFactor = calculateCPPAdjustmentFactor(variantCppAge).factor
      const oasBaselineFactor = calculateOASAdjustmentFactor(baselineOasAge).factor
      const oasVariantFactor = calculateOASAdjustmentFactor(variantOasAge).factor

      // Calculate amounts at age 70
      const cppAt70 = cppMonthlyAt65 * cppVariantFactor
      const oasAt70 = oasMonthlyAt65 * oasVariantFactor

      // Calculate percentage increases from baseline
      const cppPercentIncrease = Math.round((cppVariantFactor / cppBaselineFactor - 1) * 100)
      const oasPercentIncrease = Math.round((oasVariantFactor / oasBaselineFactor - 1) * 100)

      // Format baseline references
      const cppBaselineRef = baselineSnapshot
        ? `(vs baseline plan: Age ${baselineCppAge})`
        : '(vs 65 baseline)'

      const oasBaselineRef = baselineSnapshot
        ? `(vs baseline plan: Age ${baselineOasAge})`
        : '(vs 65 baseline)'

      return {
        title: 'Delay Government Benefits to Age 70',
        items: [
          {
            label: 'CPP Start Age',
            value: `Age ${variantCppAge} ${cppBaselineRef}`
          },
          {
            label: 'CPP Monthly at 70',
            value: `$${Math.round(cppAt70).toLocaleString()}/month (+${cppPercentIncrease}% vs age ${baselineCppAge})`
          },
          {
            label: 'OAS Start Age',
            value: `Age ${variantOasAge} ${oasBaselineRef}`
          },
          {
            label: 'OAS Monthly at 70',
            value: `$${Math.round(oasAt70).toLocaleString()}/month (+${oasPercentIncrease}% vs age ${baselineOasAge})`
          },
          {
            label: 'Total Monthly at 70',
            value: `$${Math.round(cppAt70 + oasAt70).toLocaleString()}/month`
          }
        ]
      }
    }

    case 'retire-early': {
      const newRetirementAge = scenario?.basic_inputs.retirement_age || 62
      const baselineRetirementAge = baselineSnapshot?.retirement_age || (newRetirementAge + 3) // Use snapshot or estimate
      const yearsEarlier = baselineRetirementAge - newRetirementAge

      // Format baseline reference (simplified since insight already mentions name)
      const retirementBaselineRef = baselineSnapshot
        ? `(vs baseline plan: Age ${baselineRetirementAge})`
        : `(vs ${baselineRetirementAge} baseline)`

      return {
        title: `Retire ${yearsEarlier} Years Earlier`,
        items: [
          {
            label: 'New Retirement Age',
            value: `Age ${newRetirementAge} ${retirementBaselineRef}`
          },
          {
            label: 'Extra Years in Retirement',
            value: `${yearsEarlier} additional years`
          },
          {
            label: 'Impact',
            value: 'Portfolio must support longer retirement period'
          }
        ]
      }
    }

    case 'exhaust-portfolio': {
      const optimizedSpending = scenario?.expenses.fixed_monthly || 0
      const baselineSpending = baselineSnapshot?.monthly_spending || optimizedSpending

      const monthlyDifference = optimizedSpending - baselineSpending
      const annualDifference = monthlyDifference * 12
      const percentChange = baselineSpending > 0 ? Math.round((monthlyDifference / baselineSpending) * 100) : 0

      // Format baseline reference
      const baselineSpendingLabel = baselineSnapshot
        ? 'Baseline Plan Spending'
        : 'Previous Spending'

      return {
        title: 'Maximize Your Lifestyle (Exhaust Portfolio)',
        items: [
          {
            label: 'Optimized Monthly Spending',
            value: `$${Math.round(optimizedSpending).toLocaleString()}/month`
          },
          {
            label: baselineSpendingLabel,
            value: `$${Math.round(baselineSpending).toLocaleString()}/month (for comparison)`
          },
          {
            label: 'Monthly Difference',
            value: monthlyDifference >= 0
              ? `+$${Math.round(Math.abs(monthlyDifference)).toLocaleString()}/month (+${percentChange}%)`
              : `-$${Math.round(Math.abs(monthlyDifference)).toLocaleString()}/month (${percentChange}%)`
          },
          {
            label: 'Annual Difference',
            value: annualDifference >= 0
              ? `+$${Math.round(Math.abs(annualDifference)).toLocaleString()}/year`
              : `-$${Math.round(Math.abs(annualDifference)).toLocaleString()}/year`
          },
          {
            label: 'Strategy',
            value: 'Portfolio depletes to ~$0 at your longevity age'
          }
        ]
      }
    }

    case 'legacy': {
      const percentage = scenario?.expenses.legacy_preservation_percentage || 0.25

      // Calculate starting portfolio total
      const startingPortfolio =
        (scenario?.assets.rrsp?.balance || 0) +
        (scenario?.assets.tfsa?.balance || 0) +
        (scenario?.assets.non_registered?.balance || 0)

      const legacyTarget = startingPortfolio * percentage

      // Get optimized spending from scenario
      const optimizedSpending = scenario?.expenses.fixed_monthly || 0
      const baselineSpending = baselineSnapshot?.monthly_spending || optimizedSpending

      // Calculate spending difference
      const spendingDiff = optimizedSpending - baselineSpending
      const spendingChangeText = spendingDiff > 0
        ? `+$${Math.round(Math.abs(spendingDiff)).toLocaleString()}/month (+${Math.round((spendingDiff / baselineSpending) * 100)}%)`
        : spendingDiff < 0
        ? `-$${Math.round(Math.abs(spendingDiff)).toLocaleString()}/month (${Math.round((spendingDiff / baselineSpending) * 100)}%)`
        : 'No change'

      // Format baseline reference
      const baselineLabel = baselineSnapshot
        ? 'Baseline Plan Spending'
        : 'Current Spending'

      return {
        title: `Leave a Legacy (${percentage * 100}% Preservation)`,
        items: [
          {
            label: 'Starting Portfolio',
            value: `$${Math.round(startingPortfolio).toLocaleString()}`
          },
          {
            label: 'Legacy Target',
            value: `$${Math.round(legacyTarget).toLocaleString()} (${percentage * 100}%)`
          },
          {
            label: 'Optimized Spending',
            value: `$${Math.round(optimizedSpending).toLocaleString()}/month`
          },
          {
            label: baselineLabel,
            value: `$${Math.round(baselineSpending).toLocaleString()}/month (${spendingChangeText})`
          },
          {
            label: 'Strategy',
            value: 'Spending optimized to end at legacy target'
          }
        ]
      }
    }

    case 'lump-sum': {
      // Get withdrawal details from scenario
      const withdrawal = scenario?.expenses.one_time_withdrawals?.[0]
      const amount = withdrawal?.amount || 0
      const withdrawalAge = withdrawal?.age || scenario?.basic_inputs.retirement_age || 65
      const sourceAccount = withdrawal?.source || 'smart'

      // Format amount
      const amountFormatted = amount >= 1_000_000
        ? `$${(amount / 1_000_000).toFixed(1)}M`
        : `$${Math.round(amount / 1000).toLocaleString()}K`

      // Format source account label
      const sourceLabels: Record<string, string> = {
        'smart': 'Tax-Optimized (Smart)',
        'non_registered': 'Non-Registered Account',
        'rrsp': 'RRSP/RRIF',
        'tfsa': 'TFSA'
      }
      const sourceLabel = sourceLabels[sourceAccount] || sourceAccount

      // Get baseline ending balance for comparison
      const baselineEndingBalance = baselineSnapshot?.ending_balance
      const comparisonNote = baselineEndingBalance
        ? `(vs baseline: $${Math.round(baselineEndingBalance).toLocaleString()})`
        : ''

      return {
        title: 'Lump Sum Withdrawal',
        items: [
          {
            label: 'Withdrawal Amount',
            value: amountFormatted
          },
          {
            label: 'Withdrawal Age',
            value: `Age ${withdrawalAge}`
          },
          {
            label: 'Source Account',
            value: sourceLabel
          },
          {
            label: 'Purpose',
            value: withdrawal?.description || 'One-time withdrawal'
          },
          {
            label: 'Impact',
            value: `Portfolio reduced by withdrawal amount ${comparisonNote}`
          }
        ]
      }
    }

    case 'longevity': {
      const newLongevityAge = scenario?.basic_inputs.longevity_age || 100
      const baselineLongevity = baselineSnapshot ? 95 : (newLongevityAge - 5) // Estimate baseline
      const extraYears = newLongevityAge - baselineLongevity

      return {
        title: `Live to ${newLongevityAge}`,
        items: [
          {
            label: 'Extended Longevity',
            value: `Age ${newLongevityAge}`
          },
          {
            label: 'Additional Years',
            value: `${extraYears} more years to fund`
          },
          {
            label: 'Impact',
            value: 'Tests if your portfolio can survive a longer retirement'
          }
        ]
      }
    }

    case 'part-time-work': {
      // Find part-time work entry in other_income
      const partTimeIncome = scenario?.income_sources.other_income?.find(
        inc => inc.description === 'Part-time work'
      )
      const annualIncome = partTimeIncome?.annual_amount || 0
      const startAge = partTimeIncome?.start_age || scenario?.basic_inputs.retirement_age || 65
      const endAge = partTimeIncome?.end_age || startAge + 5
      const durationYears = endAge - startAge
      const totalIncome = annualIncome * durationYears

      return {
        title: 'Work Part-Time After Retirement',
        items: [
          {
            label: 'Annual Income',
            value: `$${annualIncome.toLocaleString()}/year`
          },
          {
            label: 'Duration',
            value: `${durationYears} years (ages ${startAge}-${endAge})`
          },
          {
            label: 'Total Earnings',
            value: `$${totalIncome.toLocaleString()}`
          },
          {
            label: 'Impact',
            value: 'Reduces portfolio withdrawals during working years'
          }
        ]
      }
    }

    case 'market-crash': {
      const overrides = scenario?.assumptions.year_return_overrides || {}
      const years = Object.keys(overrides).map(Number).sort((a, b) => a - b)
      const crashYear = years[0]
      const crashMagnitude = overrides[crashYear] || -0.40
      const recoveryYears = years.length - 1

      // Calculate recovery return
      const recoveryReturn = recoveryYears > 0
        ? (overrides[years[1]] || 0)
        : 0

      return {
        title: 'Markets Crash Stress Test',
        items: [
          {
            label: 'Crash Severity',
            value: `${Math.abs(crashMagnitude * 100)}% drop in year 1`
          },
          {
            label: 'Recovery Period',
            value: `${recoveryYears} years`
          },
          {
            label: 'Recovery Return',
            value: `${(recoveryReturn * 100).toFixed(1)}%/year to recover`
          },
          {
            label: 'Impact',
            value: 'Tests portfolio survival after a major market downturn'
          }
        ]
      }
    }

    case 'move-provinces': {
      // Get province overrides from scenario
      const overrides = scenario?.assumptions.year_province_overrides || {}
      const years = Object.keys(overrides).map(Number).sort((a, b) => a - b)
      const moveYear = years[0] || new Date().getFullYear()
      const newProvince = overrides[moveYear] || 'AB'
      const currentProvince = scenario?.basic_inputs.province || 'ON'

      // Calculate move age from year
      const currentYear = new Date().getFullYear()
      const currentAge = scenario?.basic_inputs.current_age || 55
      const moveAge = currentAge + (moveYear - currentYear)

      return {
        title: 'Move Provinces',
        items: [
          {
            label: 'Move From',
            value: currentProvince
          },
          {
            label: 'Move To',
            value: newProvince as string
          },
          {
            label: 'Move Age',
            value: `Age ${moveAge}`
          },
          {
            label: 'Impact',
            value: 'Tax rates change based on new province of residence'
          }
        ]
      }
    }

    case 'receive-inheritance': {
      // Get inheritance details from one_time_incomes
      const inheritance = scenario?.expenses.one_time_incomes?.find(
        inc => inc.description === 'Inheritance'
      )
      const amount = inheritance?.amount || 0
      const receiveAge = inheritance?.age || 70
      const sourceType = inheritance?.source_type || 'cash'

      // Format amount
      const amountFormatted = amount >= 1_000_000
        ? `$${(amount / 1_000_000).toFixed(1)}M`
        : `$${Math.round(amount).toLocaleString()}`

      // Tax treatment labels
      const taxTreatment: Record<string, string> = {
        'cash': 'No tax (estate paid)',
        'rrsp_inherited': 'Fully taxable as income',
        'investments': 'No tax (stepped-up cost basis)',
        'property': 'No tax (principal residence exemption)'
      }

      return {
        title: 'Receive Inheritance',
        items: [
          {
            label: 'Inheritance Amount',
            value: amountFormatted
          },
          {
            label: 'Receive Age',
            value: `Age ${receiveAge}`
          },
          {
            label: 'Source Type',
            value: sourceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
          },
          {
            label: 'Tax Treatment',
            value: taxTreatment[sourceType] || 'Varies'
          },
          {
            label: 'Destination',
            value: 'Non-registered account'
          }
        ]
      }
    }

    case 'downsize-home': {
      // Get downsize details from one_time_incomes
      const homeProceeds = scenario?.expenses.one_time_incomes?.find(
        inc => inc.description?.includes('Home') || inc.description?.includes('downsize')
      )
      const amount = homeProceeds?.amount || 0
      const downsizeAge = homeProceeds?.age || 70

      // Check if switching to rent (look for age_based_changes at same age)
      const rentChange = scenario?.expenses.age_based_changes?.find(
        change => change.age === downsizeAge
      )
      const isRenting = homeProceeds?.description === 'Home sale proceeds'

      // Format amount
      const amountFormatted = amount >= 1_000_000
        ? `$${(amount / 1_000_000).toFixed(1)}M`
        : `$${Math.round(amount).toLocaleString()}`

      return {
        title: isRenting ? 'Sell Home & Rent' : 'Downsize Home',
        items: [
          {
            label: isRenting ? 'Sale Proceeds' : 'Net Equity Unlocked',
            value: amountFormatted
          },
          {
            label: 'Downsize Age',
            value: `Age ${downsizeAge}`
          },
          {
            label: 'Strategy',
            value: isRenting ? 'Sell home and switch to renting' : 'Buy smaller home'
          },
          ...(isRenting && rentChange ? [{
            label: 'New Monthly Expenses',
            value: `$${Math.round(rentChange.monthly_amount).toLocaleString()}/month (includes rent)`
          }] : []),
          {
            label: 'Tax Treatment',
            value: 'No tax (principal residence exemption)'
          }
        ]
      }
    }

    default:
      return {
        title: 'Variant Details',
        items: []
      }
  }
}
