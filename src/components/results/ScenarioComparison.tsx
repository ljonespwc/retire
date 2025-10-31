'use client'

/**
 * Scenario Comparison
 *
 * Tabbed interface showing comprehensive results for baseline and variant scenarios.
 * Each tab displays all result visualizations with scenario-specific actions.
 */

import { useState } from 'react'
import { X, Share2, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { CalculationResults, Scenario } from '@/types/calculator'
import { formatCompactCurrency, formatCurrency } from '@/lib/calculations/results-formatter'
import { ResultsSummary } from './ResultsSummary'
import { BalanceOverTimeChart } from './BalanceOverTimeChart'
import { IncomeCompositionChart } from './IncomeCompositionChart'
import { TaxSummaryCard } from './TaxSummaryCard'
import { RetirementNarrative } from './RetirementNarrative'
import { ShareScenarioModal } from '@/components/scenarios/ShareScenarioModal'
import { getVariantMetadata } from '@/lib/scenarios/variant-metadata'

interface ScenarioComparisonProps {
  baselineScenario: Scenario
  baselineResults: CalculationResults
  baselineNarrative?: string | null
  baselineScenarioId?: string
  baselineScenarioName?: string
  baselineShareToken?: string | null
  baselineIsShared?: boolean
  variantScenarios: Scenario[]
  variantResults: CalculationResults[]
  variantInsights?: string[]
  variantNarratives?: string[]
  variantScenarioIds?: (string | undefined)[]
  variantShareTokens?: (string | null)[]
  variantIsShared?: boolean[]
  isDarkMode?: boolean
  activeTab?: number // Control active tab from parent
  onTabChange?: (index: number) => void // Notify parent of tab changes
  onSave?: (index: number) => void
  onShareChange?: (index: number, shareToken: string | null, isShared: boolean) => void // Notify parent of share changes
  onTryAnother?: () => void
  onReset: (index: number) => void
  isSavingNarrative?: boolean // Loading state while generating AI narrative for save
}

export function ScenarioComparison({
  baselineScenario,
  baselineResults,
  baselineNarrative,
  baselineScenarioId,
  baselineScenarioName,
  baselineShareToken,
  baselineIsShared,
  variantScenarios,
  variantResults,
  variantInsights = [],
  variantNarratives = [],
  variantScenarioIds = [],
  variantShareTokens = [],
  variantIsShared = [],
  isDarkMode = false,
  activeTab: controlledActiveTab,
  onTabChange,
  onSave,
  onShareChange,
  onTryAnother,
  onReset,
  isSavingNarrative = false
}: ScenarioComparisonProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<number>(0) // 0 = first variant, -1 = baseline
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareModalScenarioId, setShareModalScenarioId] = useState<string>('')
  const [shareModalScenarioName, setShareModalScenarioName] = useState<string>('')
  const [shareModalToken, setShareModalToken] = useState<string | null>(null)
  const [shareModalIsShared, setShareModalIsShared] = useState<boolean>(false)
  const [shareModalIndex, setShareModalIndex] = useState<number>(-1) // -1 for baseline, >= 0 for variants

  // Use controlled activeTab if provided, otherwise use internal state
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab
  const setActiveTab = (index: number) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(index)
    }
    onTabChange?.(index)
  }

  // Handle share button clicks
  const handleShareBaseline = () => {
    if (baselineScenarioId && baselineScenarioName) {
      setShareModalScenarioId(baselineScenarioId)
      setShareModalScenarioName(baselineScenarioName)
      setShareModalToken(baselineShareToken || null)
      setShareModalIsShared(baselineIsShared || false)
      setShareModalIndex(-1) // -1 for baseline
      setShareModalOpen(true)
    }
  }

  const handleShareVariant = (index: number) => {
    const scenarioId = variantScenarioIds[index]
    const scenarioName = variantScenarios[index]?.name
    if (scenarioId && scenarioName) {
      setShareModalScenarioId(scenarioId)
      setShareModalScenarioName(scenarioName)
      setShareModalToken(variantShareTokens[index] || null)
      setShareModalIsShared(variantIsShared[index] || false)
      setShareModalIndex(index)
      setShareModalOpen(true)
    }
  }

  const handleSharingChange = (token: string | null, shared: boolean) => {
    onShareChange?.(shareModalIndex, token, shared)
  }

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

  // Extract baseline metrics
  const baselineMonthly = baselineScenario.expenses.fixed_monthly
  const baselineDepletion = baselineResults.portfolio_depleted_age
  const baselineEndBalance = baselineResults.final_portfolio_value

  return (
    <div className={`${cardBg} rounded-lg border ${cardBorder} mt-8 mb-8`}>
      {/* Tab Navigation */}
      <div className={`border-b ${cardBorder} ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
        <div className="flex items-center flex-wrap">
          {/* Baseline Tab */}
          <button
            onClick={() => setActiveTab(-1)}
            className={`px-6 py-4 font-medium transition-all ${
              activeTab === -1 ? tabActive : tabInactive
            }`}
          >
            Your Baseline
          </button>

          {/* Variant Tabs */}
          {variantScenarios.map((variant, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-4 font-medium transition-all flex items-center gap-2 ${
                activeTab === index ? tabActive : tabInactive
              }`}
            >
              <span>{variant.name}</span>
              <X
                className="w-4 h-4 opacity-60 hover:opacity-100 hover:text-red-500 transition-all"
                onClick={(e) => {
                  e.stopPropagation()
                  onReset(index)
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === -1 ? (
          <BaselineTab
            scenario={baselineScenario}
            results={baselineResults}
            narrative={baselineNarrative}
            isDarkMode={isDarkMode}
            onSave={onSave ? () => onSave(-1) : undefined}
            onShare={baselineScenarioId && baselineScenarioName ? handleShareBaseline : undefined}
            onTryAnother={onTryAnother}
            scenarioId={baselineScenarioId}
            scenarioName={baselineScenarioName}
          />
        ) : (
          <VariantTab
            baselineScenario={baselineScenario}
            baselineResults={baselineResults}
            variantScenario={variantScenarios[activeTab]}
            variantResults={variantResults[activeTab]}
            isDarkMode={isDarkMode}
            onSave={onSave ? () => onSave(activeTab) : undefined}
            onShare={variantScenarioIds[activeTab] ? () => handleShareVariant(activeTab) : undefined}
            isSavingNarrative={isSavingNarrative}
            baselineMonthly={baselineMonthly}
            baselineDepletion={baselineDepletion}
            baselineEndBalance={baselineEndBalance}
            hasAgeBasedSpending={Boolean(variantScenarios[activeTab].expenses.age_based_changes && variantScenarios[activeTab].expenses.age_based_changes.length > 0)}
            variantAgeChanges={variantScenarios[activeTab].expenses.age_based_changes}
            variantDepletion={variantResults[activeTab].portfolio_depleted_age}
            variantEndBalance={variantResults[activeTab].final_portfolio_value}
            depletionDiff={
              variantResults[activeTab].portfolio_depleted_age && baselineDepletion
                ? variantResults[activeTab].portfolio_depleted_age - baselineDepletion
                : variantResults[activeTab].portfolio_depleted_age && !baselineDepletion
                ? -(variantScenarios[activeTab].basic_inputs.longevity_age - variantResults[activeTab].portfolio_depleted_age)
                : null
            }
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            tableBorder={tableBorder}
            headerBg={headerBg}
            highlightGreen={highlightGreen}
            highlightYellow={highlightYellow}
            variantInsight={variantInsights[activeTab]}
            variantNarrative={variantNarratives[activeTab]}
            scenarioId={variantScenarioIds[activeTab]}
            scenarioName={variantScenarios[activeTab].name}
          />
        )}
      </div>

      {/* Share Modal */}
      <ShareScenarioModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        scenarioId={shareModalScenarioId}
        scenarioName={shareModalScenarioName}
        existingShareToken={shareModalToken}
        isCurrentlyShared={shareModalIsShared}
        isDarkMode={isDarkMode}
        onSharingChange={handleSharingChange}
      />
    </div>
  )
}

/**
 * Baseline Tab - Shows comprehensive results for user's plan
 */
function BaselineTab({
  scenario,
  results,
  narrative,
  isDarkMode,
  onSave,
  onShare,
  onTryAnother,
  scenarioId,
  scenarioName
}: {
  scenario: Scenario
  results: CalculationResults
  narrative?: string | null
  isDarkMode: boolean
  onSave?: () => void
  onShare?: () => void
  onTryAnother?: () => void
  scenarioId?: string
  scenarioName?: string
}) {
  // Theme colors for share button
  const buttonSecondary = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'

  return (
    <div className="space-y-6">
      {/* Summary */}
      <ResultsSummary
        results={results}
        retirementAge={scenario.basic_inputs.retirement_age}
        isDarkMode={isDarkMode}
        actionButtons={
          onSave && (
            <div className="flex items-center gap-3">
              <button
                onClick={onSave}
                className={`px-6 py-3 text-sm font-medium text-white rounded-xl shadow-lg transition-all ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'
                }`}
              >
                {scenarioId && scenarioName
                  ? `UPDATE THIS SCENARIO: ${scenarioName}`
                  : 'SAVE THIS SCENARIO: Baseline'}
              </button>

              {/* Share Button (only visible if scenario is saved) */}
              {scenarioId && scenarioName && onShare && (
                <button
                  onClick={onShare}
                  className={`px-6 py-3 text-sm font-medium rounded-xl shadow-lg transition-all ${buttonSecondary}`}
                >
                  <Share2 className="w-4 h-4 inline mr-2" />
                  SHARE
                </button>
              )}
            </div>
          )
        }
      />

      {/* AI Narrative */}
      <RetirementNarrative narrative={narrative} isDarkMode={isDarkMode} />

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
  onShare,
  isSavingNarrative,
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
  highlightYellow,
  variantInsight,
  variantNarrative,
  scenarioId,
  scenarioName
}: {
  baselineScenario: Scenario
  baselineResults: CalculationResults
  variantScenario: Scenario
  variantResults: CalculationResults
  isDarkMode: boolean
  onSave?: () => void
  onShare?: () => void
  isSavingNarrative?: boolean
  scenarioId?: string
  scenarioName?: string
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
  variantInsight?: string
  variantNarrative?: string
}) {
  // Theme colors for share button
  const buttonSecondary = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'

  // Extract baseline name from variant metadata (for standalone saved variants)
  // or use current baseline scenario name (for active comparisons)
  const variantMetadata = getVariantMetadata(variantScenario)
  const baselineName = variantMetadata?.baseline_snapshot?.name || baselineScenario.name || 'Your Baseline'

  return (
    <div className="space-y-6">
      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
          Comparison: {baselineName} vs {variantScenario.name}
        </h3>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${tableBorder}`}>
              <th className={`text-left py-3 px-4 ${headerBg} ${textPrimary} font-semibold`}>
                Metric
              </th>
              <th className={`text-left py-3 px-4 ${headerBg} ${textPrimary} font-semibold`}>
                {baselineName}
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
                {baselineDepletion ? `Age ${Math.round(Number(baselineDepletion))}` : 'Never (surplus)'}
              </td>
              <td className={`py-3 px-4 ${textPrimary}`}>
                {variantDepletion ? (
                  <>
                    Age {Math.round(Number(variantDepletion))}
                    {depletionDiff !== null && depletionDiff < 0 && (
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

      {/* Key Insight - LLM Generated */}
      {variantInsight && (
        <div className={`${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <div className={`font-semibold ${textPrimary} mb-1`}>Key Insight</div>
              <div className={`text-sm ${textSecondary} prose prose-sm max-w-none prose-p:my-2 ${isDarkMode ? 'prose-invert' : ''}`}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="my-2">{children}</p>,
                    strong: ({ children }) => (
                      <strong className={`font-semibold ${isDarkMode ? '!text-orange-400' : '!text-orange-600'}`}>
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {variantInsight}
                </ReactMarkdown>
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
        actionButtons={
          onSave && (
            <div className="flex items-center gap-3">
              <button
                onClick={onSave}
                disabled={isSavingNarrative}
                className={`px-6 py-3 text-sm font-medium text-white rounded-xl shadow-lg transition-all ${
                  isSavingNarrative
                    ? 'opacity-50 cursor-not-allowed bg-gradient-to-r from-gray-500 to-gray-600'
                    : isDarkMode
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'
                }`}
              >
                {isSavingNarrative ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Generating AI Analysis...
                  </>
                ) : scenarioId && scenarioName ? (
                  `UPDATE THIS SCENARIO: ${scenarioName}`
                ) : (
                  `SAVE THIS SCENARIO: ${variantScenario.name}`
                )}
              </button>

              {/* Share Button (only visible if scenario is saved) */}
              {scenarioId && scenarioName && onShare && (
                <button
                  onClick={onShare}
                  className={`px-6 py-3 text-sm font-medium rounded-xl shadow-lg transition-all ${buttonSecondary}`}
                >
                  <Share2 className="w-4 h-4 inline mr-2" />
                  SHARE
                </button>
              )}
            </div>
          )
        }
      />

      {/* AI Narrative - Only shown for saved variants, undefined for temporary what-if variants (saves tokens) */}
      <RetirementNarrative narrative={variantNarrative} isDarkMode={isDarkMode} />

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
    </div>
  )
}

