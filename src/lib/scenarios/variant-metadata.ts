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
  createRetireEarlyVariant
} from '@/lib/calculations/scenario-variants'

/**
 * Supported variant types
 */
export type VariantType =
  | 'front-load'
  | 'delay-cpp-oas'
  | 'retire-early'

/**
 * Variant metadata structure stored in scenario inputs
 */
export interface VariantMetadata {
  variant_type: VariantType
  variant_config?: Record<string, any> // Optional config for parameterized variants
  created_from_baseline_id?: string // Optional reference to original baseline
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
  aiInsight?: string,
  aiNarrative?: string
): any {
  return {
    ...inputs,
    __metadata: {
      variant_type: variantType,
      variant_config: config,
      created_from_baseline_id: baselineId,
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
    'retire-early': 'Retire Early'
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
 * @returns Structured details for UI display
 */
export function getVariantDetails(
  variantType: VariantType,
  scenario?: Scenario
): VariantDetails {
  switch (variantType) {
    case 'front-load': {
      const baseline = scenario?.expenses.fixed_monthly || 0
      const retirementAge = scenario?.basic_inputs.retirement_age || 65

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
            label: 'Baseline Spending',
            value: `$${Math.round(baseline).toLocaleString()}/month (for comparison)`
          }
        ]
      }
    }

    case 'delay-cpp-oas': {
      const cppStartAge = scenario?.income_sources.cpp?.start_age || 70
      const oasStartAge = scenario?.income_sources.oas?.start_age || 70
      const cppMonthlyAt65 = scenario?.income_sources.cpp?.monthly_amount_at_65 || 1364.60
      const oasMonthlyAt65 = scenario?.income_sources.oas?.monthly_amount || 713.34

      // Calculate amounts at age 70
      const cppAt70 = cppMonthlyAt65 * 1.42 // 42% increase for delaying to 70
      const oasAt70 = oasMonthlyAt65 * 1.36 // 36% increase for delaying to 70

      return {
        title: 'Delay Government Benefits to Age 70',
        items: [
          {
            label: 'CPP Start Age',
            value: `Age ${cppStartAge} (vs 65 baseline)`
          },
          {
            label: 'CPP Monthly at 70',
            value: `$${Math.round(cppAt70).toLocaleString()}/month (+42% vs age 65)`
          },
          {
            label: 'OAS Start Age',
            value: `Age ${oasStartAge} (vs 65 baseline)`
          },
          {
            label: 'OAS Monthly at 70',
            value: `$${Math.round(oasAt70).toLocaleString()}/month (+36% vs age 65)`
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
      const baselineRetirementAge = newRetirementAge + (scenario?.id ? 3 : 3) // Estimate baseline
      const yearsEarlier = baselineRetirementAge - newRetirementAge

      return {
        title: `Retire ${yearsEarlier} Years Earlier`,
        items: [
          {
            label: 'New Retirement Age',
            value: `Age ${newRetirementAge} (vs ${baselineRetirementAge} baseline)`
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

    default:
      return {
        title: 'Variant Details',
        items: []
      }
  }
}
