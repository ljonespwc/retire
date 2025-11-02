/**
 * CalculateButton Component
 *
 * Primary action button for running retirement calculations.
 * Shows different states: Calculate, Calculating (with animation), and Recalculate.
 */

import { Button } from '@/components/ui/button'
import { Heart, Calculator, Lock } from 'lucide-react'
import { CalculationResults } from '@/types/calculator'
import { VariantMetadata } from '@/lib/scenarios/variant-metadata'

interface CalculateButtonProps {
  isCalculating: boolean
  isMandatoryFieldsComplete: boolean
  editMode: boolean
  calculationResults: CalculationResults | null
  justCalculated: boolean
  theme: any
  onClick: () => void
  loadedVariantMetadata?: VariantMetadata | null
}

export function CalculateButton({
  isCalculating,
  isMandatoryFieldsComplete,
  editMode,
  calculationResults,
  justCalculated,
  theme,
  onClick,
  loadedVariantMetadata
}: CalculateButtonProps) {
  // Disable button when a variant scenario is loaded
  const isVariantLoaded = !!loadedVariantMetadata
  const isDisabled = isCalculating || !isMandatoryFieldsComplete || (editMode && !!calculationResults) || justCalculated || isVariantLoaded

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        onClick={onClick}
        data-calculate-button
        disabled={isDisabled}
        className={`w-full ${theme.button.primary} text-white shadow-2xl py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isCalculating ? (
          <>
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 animate-pulse" fill="white" />
            Calculating...
          </>
        ) : isVariantLoaded ? (
          <>
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            Recalculate (Locked)
          </>
        ) : calculationResults ? (
          <>
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            Recalculate
          </>
        ) : (
          <>
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            Calculate
          </>
        )}
      </Button>

      {/* Helper text when variant is loaded */}
      {isVariantLoaded && (
        <p className={`text-xs text-center ${theme.text.muted}`}>
          Variant scenarios cannot be recalculated. Click "Start Planning" to create a new scenario.
        </p>
      )}
    </div>
  )
}
