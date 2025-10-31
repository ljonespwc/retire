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
  createExhaustPortfolioVariant
} from '@/lib/calculations/scenario-variants'
import { calculateCPPAdjustmentFactor, calculateOASAdjustmentFactor } from '@/lib/calculations/government-benefits'

/**
 * Supported variant types
 */
export type VariantType =
  | 'front-load'
  | 'delay-cpp-oas'
  | 'retire-early'
  | 'exhaust-portfolio'

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
      // Check if config has yearsEarlier parameter
      const yearsEarlier = config?.yearsEarlier || 3
      return createRetireEarlyVariant(baseScenario, yearsEarlier)
    case 'exhaust-portfolio':
      // Use stored optimized spending from config (calculated during original optimization)
      const optimizedSpending = config?.optimizedSpending || baseScenario.expenses.fixed_monthly
      return createExhaustPortfolioVariant(baseScenario, optimizedSpending)
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
    'exhaust-portfolio': 'Exhaust Your Portfolio'
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
      const baseline = scenario?.expenses.fixed_monthly || 0
      const retirementAge = scenario?.basic_inputs.retirement_age || 65

      // Format baseline spending reference (simplified since insight already mentions name)
      const baselineSpendingLabel = baselineSnapshot
        ? 'Baseline Plan Spending'
        : 'Baseline Spending'

      return {
        title: 'Front-Load the Fun (Go-Go, Slow-Go, No-Go)',
        items: [
          {
            label: `Ages ${retirementAge}-${retirementAge + 9} (Go-Go Years)`,
            value: `$${Math.round(baseline * 1.30).toLocaleString()}/month (+30%)`
          },
          {
            label: `Ages ${retirementAge + 10}-${retirementAge + 19} (Slow-Go Years)`,
            value: `$${Math.round(baseline * 0.85).toLocaleString()}/month (-15%)`
          },
          {
            label: `Ages ${retirementAge + 20}+ (No-Go Years)`,
            value: `$${Math.round(baseline * 0.75).toLocaleString()}/month (-25%)`
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

    default:
      return {
        title: 'Variant Details',
        items: []
      }
  }
}
