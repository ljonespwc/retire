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
  baselineId?: string
): any {
  return {
    ...inputs,
    __metadata: {
      variant_type: variantType,
      variant_config: config,
      created_from_baseline_id: baselineId,
      created_at: new Date().toISOString()
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
