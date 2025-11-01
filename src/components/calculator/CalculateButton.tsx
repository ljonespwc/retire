/**
 * CalculateButton Component
 *
 * Primary action button for running retirement calculations.
 * Shows different states: Calculate, Calculating (with animation), and Recalculate.
 */

import { Button } from '@/components/ui/button'
import { Heart, Calculator } from 'lucide-react'
import { CalculationResults } from '@/types/calculator'

interface CalculateButtonProps {
  isCalculating: boolean
  isMandatoryFieldsComplete: boolean
  editMode: boolean
  calculationResults: CalculationResults | null
  justCalculated: boolean
  theme: any
  onClick: () => void
}

export function CalculateButton({
  isCalculating,
  isMandatoryFieldsComplete,
  editMode,
  calculationResults,
  justCalculated,
  theme,
  onClick
}: CalculateButtonProps) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      data-calculate-button
      disabled={isCalculating || !isMandatoryFieldsComplete || (editMode && !!calculationResults) || justCalculated}
      className={`w-full ${theme.button.primary} text-white shadow-2xl py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isCalculating ? (
        <>
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 animate-pulse" fill="white" />
          Calculating...
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
  )
}
