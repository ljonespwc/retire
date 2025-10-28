'use client'

/**
 * Scenario Comparison
 *
 * Tabbed interface showing comprehensive results for baseline and variant scenarios.
 * Each tab displays all result visualizations with scenario-specific actions.
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { CalculationResults, Scenario } from '@/types/calculator'
import { formatCompactCurrency, formatCurrency } from '@/lib/calculations/results-formatter'
import { ResultsSummary } from './ResultsSummary'
import { BalanceOverTimeChart } from './BalanceOverTimeChart'
import { IncomeCompositionChart } from './IncomeCompositionChart'
import { TaxSummaryCard } from './TaxSummaryCard'
import { RetirementNarrative } from './RetirementNarrative'

interface ScenarioComparisonProps {
  baselineScenario: Scenario
  baselineResults: CalculationResults
  variantScenario: Scenario
  variantResults: CalculationResults
  isDarkMode?: boolean
  onSave?: () => void
  onTryAnother?: () => void
  onReset: () => void
}

export function ScenarioComparison({
  baselineScenario,
  baselineResults,
  variantScenario,
  variantResults,
  isDarkMode = false,
  onSave,
  onTryAnother,
  onReset
}: ScenarioComparisonProps) {
  const [activeTab, setActiveTab] = useState<'baseline' | 'variant'>('variant')

  // Theme-aware colors
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const cardBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const tableBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const headerBg = isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
  const highlightGreen = isDarkMode ? 'text-green-400' : 'text-green-600'
  const highlightYellow = isDarkMode ? 'text-yellow-400' : 'text-yellow-600'

  // Tab styling
  const tabInactive = isDarkMode
    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  const tabActive = isDarkMode
    ? 'text-white bg-gray-700 border-b-2 border-blue-500'
    : 'text-gray-900 bg-gray-50 border-b-2 border-orange-500'

  // Extract key metrics for comparison table
  const baselineMonthly = baselineScenario.expenses.fixed_monthly
  const baselineDepletion = baselineResults.portfolio_depleted_age
  const baselineEndBalance = baselineResults.final_portfolio_value

  const variantAgeChanges = variantScenario.expenses.age_based_changes
  const hasAgeBasedSpending = Boolean(variantAgeChanges && variantAgeChanges.length > 0)
  const variantDepletion = variantResults.portfolio_depleted_age
  const variantEndBalance = variantResults.final_portfolio_value

  const depletionDiff = variantDepletion && baselineDepletion
    ? variantDepletion - baselineDepletion
    : variantDepletion && !baselineDepletion
    ? -(variantScenario.basic_inputs.longevity_age - variantDepletion)
    : null

  return (
    <div className={`${cardBg} rounded-lg border ${cardBorder} mt-8 mb-8`}>
      {/* Tab Navigation */}
      <div className={`border-b ${cardBorder}`}>
        <div className="flex items-center">
          {/* Baseline Tab */}
          <button
            onClick={() => setActiveTab('baseline')}
            className={`px-6 py-4 font-medium transition-all ${
              activeTab === 'baseline' ? tabActive : tabInactive
            }`}
          >
            Your Plan
          </button>

          {/* Variant Tab */}
          <button
            onClick={() => setActiveTab('variant')}
            className={`px-6 py-4 font-medium transition-all flex items-center gap-2 ${
              activeTab === 'variant' ? tabActive : tabInactive
            }`}
          >
            <span>{variantScenario.name}</span>
            <X
              className="w-4 h-4 opacity-60 hover:opacity-100 hover:text-red-500 transition-all"
              onClick={(e) => {
                e.stopPropagation()
                onReset()
              }}
            />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'baseline' ? (
          <BaselineTab
            scenario={baselineScenario}
            results={baselineResults}
            isDarkMode={isDarkMode}
            onSave={onSave}
            onTryAnother={onTryAnother}
          />
        ) : (
          <VariantTab
            baselineScenario={baselineScenario}
            baselineResults={baselineResults}
            variantScenario={variantScenario}
            variantResults={variantResults}
            isDarkMode={isDarkMode}
            onSave={onSave}
            baselineMonthly={baselineMonthly}
            baselineDepletion={baselineDepletion}
            baselineEndBalance={baselineEndBalance}
            hasAgeBasedSpending={hasAgeBasedSpending}
            variantAgeChanges={variantAgeChanges}
            variantDepletion={variantDepletion}
            variantEndBalance={variantEndBalance}
            depletionDiff={depletionDiff}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            tableBorder={tableBorder}
            headerBg={headerBg}
            highlightGreen={highlightGreen}
            highlightYellow={highlightYellow}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Baseline Tab - Shows comprehensive results for user's plan
 */
function BaselineTab({
  scenario,
  results,
  isDarkMode,
  onSave,
  onTryAnother
}: {
  scenario: Scenario
  results: CalculationResults
  isDarkMode: boolean
  onSave?: () => void
  onTryAnother?: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <ResultsSummary
        results={results}
        retirementAge={scenario.basic_inputs.retirement_age}
        isDarkMode={isDarkMode}
      />

      {/* Balance Chart */}
      <BalanceOverTimeChart results={results} isDarkMode={isDarkMode} />

      {/* Income Composition */}
      <IncomeCompositionChart results={results} isDarkMode={isDarkMode} />

      {/* Tax Summary */}
      <TaxSummaryCard
        results={results}
        retirementAge={scenario.basic_inputs.retirement_age}
        isDarkMode={isDarkMode}
      />

      {/* AI Narrative */}
      <RetirementNarrative results={results} isDarkMode={isDarkMode} />

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center items-center gap-3 pt-4">
        {onSave && (
          <button
            onClick={onSave}
            className={`px-6 py-3 text-sm font-medium text-white rounded-xl shadow-lg transition-all ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
                : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'
            }`}
          >
            Save This Scenario
          </button>
        )}
        {onTryAnother && (
          <button
            onClick={onTryAnother}
            className={`px-6 py-3 text-sm font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg transition-colors`}
          >
            Try a What-If
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Variant Tab - Shows comprehensive results plus comparison table
 */
function VariantTab({
  baselineScenario,
  baselineResults,
  variantScenario,
  variantResults,
  isDarkMode,
  onSave,
  baselineMonthly,
  baselineDepletion,
  baselineEndBalance,
  hasAgeBasedSpending,
  variantAgeChanges,
  variantDepletion,
  variantEndBalance,
  depletionDiff,
  textPrimary,
  textSecondary,
  tableBorder,
  headerBg,
  highlightGreen,
  highlightYellow
}: {
  baselineScenario: Scenario
  baselineResults: CalculationResults
  variantScenario: Scenario
  variantResults: CalculationResults
  isDarkMode: boolean
  onSave?: () => void
  baselineMonthly: number
  baselineDepletion: number | undefined
  baselineEndBalance: number
  hasAgeBasedSpending: boolean
  variantAgeChanges: any[] | undefined
  variantDepletion: number | undefined
  variantEndBalance: number
  depletionDiff: number | null
  textPrimary: string
  textSecondary: string
  tableBorder: string
  headerBg: string
  highlightGreen: string
  highlightYellow: string
}) {
  return (
    <div className="space-y-6">
      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
          Comparison: Your Plan vs {variantScenario.name}
        </h3>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${tableBorder}`}>
              <th className={`text-left py-3 px-4 ${headerBg} ${textPrimary} font-semibold`}>
                Metric
              </th>
              <th className={`text-left py-3 px-4 ${headerBg} ${textPrimary} font-semibold`}>
                Your Plan
              </th>
              <th className={`text-left py-3 px-4 ${headerBg} ${textPrimary} font-semibold`}>
                {variantScenario.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Monthly Spending */}
            <tr className={`border-b ${tableBorder}`}>
              <td className={`py-3 px-4 ${textSecondary}`}>Monthly Spending</td>
              <td className={`py-3 px-4 ${textPrimary}`}>
                {formatCurrency(baselineMonthly, 0)}
                <div className={`text-xs ${textSecondary} mt-0.5`}>(all years)</div>
              </td>
              <td className={`py-3 px-4 ${textPrimary}`}>
                {hasAgeBasedSpending ? (
                  <div className="space-y-1">
                    {variantAgeChanges!.map((change, index) => {
                      const phaseLabel =
                        index === 0 ? `Ages ${change.age}-${change.age + 9}` :
                        index === 1 ? `Ages ${change.age}-${change.age + 9}` :
                        `Ages ${change.age}+`
                      return (
                        <div key={index}>
                          {formatCurrency(change.monthly_amount, 0)}
                          <span className={`text-xs ${textSecondary} ml-2`}>({phaseLabel})</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  formatCurrency(variantScenario.expenses.fixed_monthly, 0)
                )}
              </td>
            </tr>

            {/* Portfolio Depletion */}
            <tr className={`border-b ${tableBorder}`}>
              <td className={`py-3 px-4 ${textSecondary}`}>Portfolio Depletion</td>
              <td className={`py-3 px-4 ${textPrimary}`}>
                {baselineDepletion ? `Age ${baselineDepletion}` : 'Never (surplus)'}
              </td>
              <td className={`py-3 px-4 ${textPrimary}`}>
                {variantDepletion ? (
                  <>
                    Age {variantDepletion}
                    {depletionDiff && depletionDiff < 0 && (
                      <span className={`text-xs ${highlightYellow} ml-2`}>
                        ({depletionDiff} years)
                      </span>
                    )}
                  </>
                ) : (
                  'Never (surplus)'
                )}
              </td>
            </tr>

            {/* Ending Balance */}
            <tr className={`border-b ${tableBorder}`}>
              <td className={`py-3 px-4 ${textSecondary}`}>Ending Balance</td>
              <td className={`py-3 px-4 ${textPrimary}`}>
                {formatCompactCurrency(baselineEndBalance)}
              </td>
              <td className={`py-3 px-4 ${textPrimary}`}>
                {formatCompactCurrency(variantEndBalance)}
                {variantEndBalance > baselineEndBalance && (
                  <span className={`text-xs ${highlightGreen} ml-2`}>
                    (+{formatCompactCurrency(variantEndBalance - baselineEndBalance)})
                  </span>
                )}
                {variantEndBalance < baselineEndBalance && (
                  <span className={`text-xs ${highlightYellow} ml-2`}>
                    ({formatCompactCurrency(variantEndBalance - baselineEndBalance)})
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Key Insight */}
      {variantScenario.name === 'Front-Load the Fun' && hasAgeBasedSpending && (
        <div className={`${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <div className={`font-semibold ${textPrimary} mb-1`}>Key Insight</div>
              <div className={`text-sm ${textSecondary}`}>
                {calculateFrontLoadInsight(baselineMonthly, variantAgeChanges![0].monthly_amount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <ResultsSummary
        results={variantResults}
        retirementAge={variantScenario.basic_inputs.retirement_age}
        isDarkMode={isDarkMode}
      />

      {/* Balance Chart */}
      <BalanceOverTimeChart results={variantResults} isDarkMode={isDarkMode} />

      {/* Income Composition */}
      <IncomeCompositionChart results={variantResults} isDarkMode={isDarkMode} />

      {/* Tax Summary */}
      <TaxSummaryCard
        results={variantResults}
        retirementAge={variantScenario.basic_inputs.retirement_age}
        isDarkMode={isDarkMode}
      />

      {/* AI Narrative */}
      <RetirementNarrative results={variantResults} isDarkMode={isDarkMode} />

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        {onSave && (
          <button
            onClick={onSave}
            className={`px-6 py-3 text-sm font-medium text-white rounded-xl shadow-lg transition-all ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
                : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'
            }`}
          >
            Save This Scenario
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Calculate insight message for Front-Load scenario
 */
function calculateFrontLoadInsight(baselineMonthly: number, goGoMonthly: number): string {
  const extraPerMonth = goGoMonthly - baselineMonthly
  const extraPerYear = extraPerMonth * 12
  const goGoYears = 10
  const totalExtra = extraPerYear * goGoYears

  return `This scenario gives you an extra ${formatCompactCurrency(totalExtra)} to enjoy during your most active retirement years (go-go phase), while reducing spending in later years when you're less active.`
}
