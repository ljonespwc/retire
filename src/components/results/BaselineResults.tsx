/**
 * BaselineResults Component
 *
 * Displays complete baseline retirement calculation results including:
 * - Variant details banner (if loaded variant)
 * - Results summary with save/share actions
 * - AI-generated narrative
 * - Charts and visualizations
 */

import { Share2 } from 'lucide-react'
import { CalculationResults, Scenario } from '@/types/calculator'
import { type VariantMetadata, getVariantDisplayName } from '@/lib/scenarios/variant-metadata'
import { VariantDetailsBanner } from '@/components/results/VariantDetailsBanner'
import { ResultsSummary } from '@/components/results/ResultsSummary'
import { RetirementNarrative } from '@/components/results/RetirementNarrative'
import { BalanceOverTimeChart } from '@/components/results/BalanceOverTimeChart'
import { IncomeCompositionChart } from '@/components/results/IncomeCompositionChart'
import { TaxSummaryCard } from '@/components/results/TaxSummaryCard'

interface BaselineResultsProps {
  calculationResults: CalculationResults
  retirementAge: number
  isDarkMode: boolean
  baselineNarrative: string | null
  loadedVariantMetadata: VariantMetadata | null
  baselineScenario: Scenario
  scenarioId?: string
  loadedScenarioName: string | null
  isAnonymous: boolean
  theme: any
  onSaveClick: () => void
  onShareClick: () => void
}

export function BaselineResults({
  calculationResults,
  retirementAge,
  isDarkMode,
  baselineNarrative,
  loadedVariantMetadata,
  baselineScenario,
  scenarioId,
  loadedScenarioName,
  isAnonymous,
  theme,
  onSaveClick,
  onShareClick
}: BaselineResultsProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Variant Details Banner (shown when loaded variant has metadata) */}
      {loadedVariantMetadata && (
        <VariantDetailsBanner
          variantMetadata={loadedVariantMetadata}
          scenario={baselineScenario}
          isDarkMode={isDarkMode}
          isCollapsible={true}
        />
      )}

      <ResultsSummary
        results={calculationResults}
        retirementAge={retirementAge}
        isDarkMode={isDarkMode}
        variantName={loadedVariantMetadata ? getVariantDisplayName(loadedVariantMetadata.variant_type) : undefined}
        actionButtons={
          <div className="flex items-center gap-3">
            <button
              onClick={onSaveClick}
              className={`px-6 py-3 text-sm font-medium text-white rounded-xl shadow-lg transition-all ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
                  : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'
              }`}
            >
              {scenarioId && loadedScenarioName
                ? `UPDATE THIS SCENARIO: ${loadedScenarioName}`
                : 'SAVE THIS SCENARIO'}
            </button>

            {/* Share Button (only visible if scenario is saved) */}
            {scenarioId && loadedScenarioName && (
              <button
                onClick={onShareClick}
                className={`px-6 py-3 text-sm font-medium rounded-xl shadow-lg transition-all ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Share2 className="w-4 h-4 inline mr-2" />
                SHARE
              </button>
            )}
          </div>
        }
      />

      <RetirementNarrative narrative={baselineNarrative} isDarkMode={isDarkMode} />

      <BalanceOverTimeChart results={calculationResults} isDarkMode={isDarkMode} />
      <IncomeCompositionChart results={calculationResults} isDarkMode={isDarkMode} />
      <TaxSummaryCard results={calculationResults} retirementAge={retirementAge} isDarkMode={isDarkMode} />
    </div>
  )
}
