'use client'

/**
 * Scenario Comparison
 *
 * Tabbed interface showing comprehensive results for baseline and variant scenarios.
 * Each tab displays all result visualizations with scenario-specific actions.
 */

import { useState } from 'react'
import { Share2, Loader2, X, MessageSquare, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { CalculationResults, Scenario } from '@/types/calculator'
import { formatCompactCurrency, formatCurrency } from '@/lib/calculations/results-formatter'
import { ResultsSummary } from './ResultsSummary'
import { BalanceOverTimeChart } from './BalanceOverTimeChart'
import { IncomeCompositionChart } from './IncomeCompositionChart'
import { TaxSummaryCard } from './TaxSummaryCard'
import { RetirementNarrative } from './RetirementNarrative'
import { VariantDetailsBanner } from './VariantDetailsBanner'
import { ShareScenarioModal } from '@/components/scenarios/ShareScenarioModal'
import { getVariantMetadata, type VariantMetadata, type VariantType } from '@/lib/scenarios/variant-metadata'

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
  variantConfigs?: Array<Record<string, any> | undefined> // Variant configs with variant_type
  variantNeedsSave?: boolean[] // Track which variants need saving (created/modified this session)
  isDarkMode?: boolean
  activeTab?: number // Control active tab from parent
  onTabChange?: (index: number) => void // Notify parent of tab changes
  onSave?: (index: number) => void
  onShareChange?: (index: number, shareToken: string | null, isShared: boolean) => void // Notify parent of share changes
  onTryAnother?: () => void
  onRemoveVariant?: (index: number) => void // Remove a variant tab (unsaved)
  onDeleteVariant?: (index: number) => void // Delete a saved variant from database
  isSavingNarrative?: boolean // Loading state while generating AI narrative for save
  onFeedbackClick?: () => void // Open feedback modal
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
  variantConfigs = [],
  variantNeedsSave = [],
  isDarkMode = false,
  activeTab: controlledActiveTab,
  onTabChange,
  onSave,
  onShareChange,
  onTryAnother,
  onRemoveVariant,
  onDeleteVariant,
  isSavingNarrative = false,
  onFeedbackClick
}: ScenarioComparisonProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<number>(0) // 0 = first variant, -1 = baseline
  const [removeConfirmIndex, setRemoveConfirmIndex] = useState<number | null>(null)
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)
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

  // Emoji mapping for variant types
  const variantEmojis: Record<string, string> = {
    'baseline': '📊',
    'front-load': '🎉',
    'delay-cpp-oas': '⏰',
    'exhaust-portfolio': '💰',
    'retire-early': '🏃',
    'legacy': '🏛️',
    'lump-sum': '💵',
    'longevity': '🎂',
    'part-time-work': '💼',
    'market-crash': '📉',
    'move-provinces': '🍁',
    'receive-inheritance': '🎁',
    'downsize-home': '🏠',
  }

  // Get emoji from variant type or detect from name
  const getTabEmoji = (variantType?: string, scenarioName?: string): string => {
    if (variantType && variantEmojis[variantType]) return variantEmojis[variantType]
    // Fallback: detect from name
    if (scenarioName) {
      const name = scenarioName.toLowerCase()
      if (name.includes('front-load') || name.includes('front load')) return '🎉'
      if (name.includes('delay cpp') || name.includes('delay benefits') || name.includes('delay-cpp')) return '⏰'
      if (name.includes('exhaust')) return '💰'
      if (name.includes('retire') && (name.includes('early') || name.includes('earlier'))) return '🏃'
      if (name.includes('legacy')) return '🏛️'
      if (name.includes('lump sum') || name.includes('lump-sum')) return '💵'
      if (name.includes('live to') || name.includes('longevity')) return '🎂'
      if (name.includes('part-time') || name.includes('part time')) return '💼'
      if (name.includes('crash') || name.includes('market')) return '📉'
      if (name.includes('move') && name.includes('province')) return '🍁'
      if (name.includes('inherit')) return '🎁'
      if (name.includes('downsize') || name.includes('home')) return '🏠'
    }
    return '📋' // default
  }

  // Helper to shorten variant names for compact tabs
  const getShortTabLabel = (name: string): string => {
    if (name.includes('Front-Load')) return 'Front-Load'
    if (name.includes('Delay CPP') || name.includes('Delay Benefits')) return 'Delay CPP'
    if (name.includes('Exhaust')) return 'Exhaust'
    if (name.includes('Retire') && (name.includes('Early') || name.includes('Earlier'))) return 'Retire Early'
    if (name.includes('Legacy')) return 'Legacy'
    if (name.includes('Lump Sum')) return 'Lump Sum'
    if (name.includes('Live to')) return 'Live to 100'
    if (name.includes('Part-Time')) return 'Part-Time'
    if (name.includes('Markets Crash') || name.includes('Crash')) return 'Crash'
    if (name.includes('Move') && name.includes('Province')) return 'Move Prov'
    if (name.includes('Inherit')) return 'Inheritance'
    if (name.includes('Downsize')) return 'Downsize'
    // Fallback: truncate long names
    return name.length > 15 ? name.substring(0, 12) + '...' : name
  }

  // Get full label for mobile dropdown (more space available)
  const getFullTabLabel = (name: string): string => {
    if (name.includes('Front-Load')) return 'Front-Load the Fun'
    if (name.includes('Delay CPP') || name.includes('Delay Benefits')) return 'Delay CPP/OAS'
    if (name.includes('Exhaust')) return 'Exhaust Portfolio'
    if (name.includes('Retire') && (name.includes('Early') || name.includes('Earlier'))) return 'Retire Early'
    if (name.includes('Legacy')) return 'Leave a Legacy'
    if (name.includes('Lump Sum')) return 'Lump Sum'
    if (name.includes('Live to')) return 'Live to 100'
    if (name.includes('Part-Time')) return 'Work Part-Time'
    if (name.includes('Markets Crash') || name.includes('Crash')) return 'Markets Crash'
    if (name.includes('Move') && name.includes('Province')) return 'Move Provinces'
    if (name.includes('Inherit')) return 'Inheritance'
    if (name.includes('Downsize')) return 'Downsize Home'
    return name
  }

  // Tab styling - pill chips
  const pillBase = 'px-3 py-1.5 rounded-full border text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer'

  // Baseline tab (green - always distinct)
  const baselineActive = 'bg-emerald-500 text-white border-emerald-500'
  const baselineInactive = isDarkMode
    ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700 hover:bg-emerald-900/50 hover:border-emerald-600'
    : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'

  // Variant tabs (blue active, gray inactive)
  const variantActive = 'bg-blue-500 text-white border-blue-500'
  const variantInactive = isDarkMode
    ? 'bg-gray-800 text-gray-300 border-gray-600 hover:border-blue-400 hover:bg-gray-700'
    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'

  // Extract baseline metrics
  const baselineMonthly = baselineScenario.expenses.fixed_monthly
  const baselineDepletion = baselineResults.portfolio_depleted_age
  const baselineEndBalance = baselineResults.final_portfolio_value

  return (
    <div className={`${cardBg} rounded-lg border ${cardBorder} mt-8 mb-8`}>
      {/* Tab Navigation - Responsive: Desktop wrap pills, Mobile dropdown */}
      <div className={`border-b ${cardBorder} ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-100'}`}>

        {/* Desktop: Wrap-style pill tabs */}
        <div className="hidden md:flex flex-wrap gap-2 p-3">
          {/* Baseline Tab - Green, no close button */}
          <button
            onClick={() => setActiveTab(-1)}
            className={`${pillBase} ${activeTab === -1 ? baselineActive : baselineInactive}`}
          >
            <span>📊</span>
            <span>Baseline</span>
          </button>

          {/* Variant Tabs */}
          {variantScenarios.map((variant, index) => {
            const isActive = activeTab === index
            const variantType = variantConfigs[index]?.variant_type
            const emoji = getTabEmoji(variantType, variant.name)
            const label = getShortTabLabel(variant.name)

            return (
              <div key={index} className="relative flex items-center">
                <button
                  onClick={() => setActiveTab(index)}
                  className={`${pillBase} pr-7 ${isActive ? variantActive : variantInactive}`}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
                {/* Close/Delete button - X for unsaved, Trash for saved */}
                {variantScenarioIds[index] ? (
                  // Saved variant: show trash icon for delete
                  onDeleteVariant && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirmIndex(index)
                      }}
                      className={`absolute right-1.5 p-0.5 rounded-full transition-colors ${
                        isDarkMode
                          ? 'hover:bg-white/20 text-red-400 hover:text-red-300'
                          : 'hover:bg-black/10 text-red-500 hover:text-red-600'
                      }`}
                      title="Delete saved scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )
                ) : (
                  // Unsaved variant: show X for close with confirmation
                  onRemoveVariant && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setRemoveConfirmIndex(index)
                      }}
                      className={`absolute right-1.5 p-0.5 rounded-full transition-colors ${
                        isDarkMode
                          ? 'hover:bg-white/20 text-current'
                          : 'hover:bg-black/10 text-current'
                      }`}
                      title="Close tab"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: Native select dropdown */}
        <div className="md:hidden p-3">
          <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Viewing Scenario
          </label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(Number(e.target.value))}
            className={`w-full p-3 rounded-lg border text-base font-medium ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value={-1}>📊 Baseline</option>
            {variantScenarios.map((variant, index) => {
              const variantType = variantConfigs[index]?.variant_type
              const emoji = getTabEmoji(variantType, variant.name)
              const label = getFullTabLabel(variant.name)
              return (
                <option key={index} value={index}>
                  {emoji} {label}
                </option>
              )
            })}
          </select>
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
            onFeedbackClick={onFeedbackClick}
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
            baselineScenarioName={baselineScenarioName}
            variantConfig={variantConfigs[activeTab]}
            needsSave={variantNeedsSave[activeTab]}
            onFeedbackClick={onFeedbackClick}
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
        isVariant={shareModalIndex >= 0}
      />

      {/* Remove Confirmation Modal (for unsaved variants) */}
      {removeConfirmIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border shadow-xl p-6 max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Close unsaved scenario?
            </h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              "{variantScenarios[removeConfirmIndex]?.name}" hasn't been saved. Are you sure you want to close it?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRemoveConfirmIndex(null)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemoveVariant?.(removeConfirmIndex)
                  setRemoveConfirmIndex(null)
                }}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDarkMode
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Close without saving
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (for saved variants) */}
      {deleteConfirmIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border shadow-xl p-6 max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Delete saved scenario?
            </h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              "{variantScenarios[deleteConfirmIndex]?.name}" will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmIndex(null)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteVariant?.(deleteConfirmIndex)
                  setDeleteConfirmIndex(null)
                }}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDarkMode
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
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
  scenarioName,
  onFeedbackClick
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
  onFeedbackClick?: () => void
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
        expenses={scenario.expenses}
        isDarkMode={isDarkMode}
        actionButtons={
          <div className="flex items-center gap-3">
            {/* Save Button - only shown for fresh, unsaved baseline calculations */}
            {onSave && !scenarioId && (
              <button
                onClick={onSave}
                className={`px-6 py-3 text-sm font-medium text-white rounded-xl shadow-lg transition-all ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'
                }`}
              >
                SAVE THIS PLAN
              </button>
            )}

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

            {/* Feedback Button */}
            {onFeedbackClick && (
              <button
                onClick={onFeedbackClick}
                className={`feedback-button-glow px-6 py-3 text-sm font-medium rounded-xl transition-all ${buttonSecondary}`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                GIVE FEEDBACK
              </button>
            )}
          </div>
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
  scenarioName,
  baselineScenarioName,
  variantConfig,
  needsSave,
  onFeedbackClick
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
  baselineScenarioName?: string
  onFeedbackClick?: () => void
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
  variantConfig?: Record<string, any>
  needsSave?: boolean
}) {
  // Theme colors for share button
  const buttonSecondary = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'

  // Construct variant metadata from variantConfig (for temporary variants)
  // or extract from loaded scenario data
  const variantMetadata: VariantMetadata | null = variantConfig?.variant_type
    ? {
        variant_type: variantConfig.variant_type as VariantType,
        variant_config: variantConfig,
        ai_insight: variantInsight,
        baseline_snapshot: {
          name: baselineScenarioName || baselineScenario.name || 'Your Baseline',
          monthly_spending: baselineMonthly,
          portfolio_depleted_age: baselineDepletion,
          ending_balance: baselineEndBalance,
          retirement_age: baselineScenario.basic_inputs.retirement_age,
          cpp_start_age: baselineScenario.income_sources.cpp?.start_age || 65,
          oas_start_age: baselineScenario.income_sources.oas?.start_age || 65,
        }
      }
    : null

  const baselineName = baselineScenarioName || variantMetadata?.baseline_snapshot?.name || baselineScenario.name || 'Your Baseline'

  return (
    <div className="space-y-6">
      {/* Variant Details Banner - What's Different (with Save button) */}
      {variantMetadata && (
        <VariantDetailsBanner
          variantMetadata={variantMetadata}
          scenario={variantScenario}
          isDarkMode={isDarkMode}
          isCollapsible={false}
          onSave={onSave}
          scenarioId={scenarioId}
          needsSave={needsSave}
          isSavingNarrative={isSavingNarrative}
        />
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
          Compare to Baseline
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

      {/* Key Insight - Only show if banner doesn't have it (temporary variants) */}
      {variantInsight && !variantMetadata?.ai_insight && (
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
        expenses={variantScenario.expenses}
        isDarkMode={isDarkMode}
        actionButtons={
          <div className="flex gap-3">
            {scenarioId && onShare && (
              <button
                onClick={onShare}
                className={`px-6 py-3 text-sm font-medium rounded-xl shadow-lg transition-all ${buttonSecondary}`}
              >
                <Share2 className="w-4 h-4 inline mr-2" />
                SHARE
              </button>
            )}
            {onFeedbackClick && (
              <button
                onClick={onFeedbackClick}
                className={`feedback-button-glow px-6 py-3 text-sm font-medium rounded-xl transition-all ${buttonSecondary}`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                GIVE FEEDBACK
              </button>
            )}
          </div>
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

