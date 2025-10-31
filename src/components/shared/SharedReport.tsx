'use client'

/**
 * Shared Report Component
 *
 * Read-only retirement report view for shared scenarios.
 * Reuses all existing result components with no interactive elements.
 */

import { CalculationResults } from '@/types/calculator'
import { Scenario } from '@/types/calculator'
import { ResultsSummary } from '@/components/results/ResultsSummary'
import { BalanceOverTimeChart } from '@/components/results/BalanceOverTimeChart'
import { IncomeCompositionChart } from '@/components/results/IncomeCompositionChart'
import { TaxSummaryCard } from '@/components/results/TaxSummaryCard'
import { RetirementNarrative } from '@/components/results/RetirementNarrative'
import { VariantDetailsBanner } from '@/components/results/VariantDetailsBanner'
import { getVariantMetadata } from '@/lib/scenarios/variant-metadata'
import { formatCompactCurrency, formatCurrency } from '@/lib/calculations/results-formatter'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

interface SharedReportProps {
  scenario: Scenario
  results: CalculationResults
  narrative?: string | null
  isDarkMode?: boolean
  rawInputs?: any  // Raw inputs from database for variant detection
}

export function SharedReport({
  scenario,
  results,
  narrative,
  isDarkMode = false,
  rawInputs
}: SharedReportProps) {
  // Check if this is a variant scenario (needs raw inputs from database)
  const variantMetadata = rawInputs ? getVariantMetadata(rawInputs) : null

  // Theme colors
  const bgPrimary = isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
  const bgCard = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const badgeBg = isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
  const badgeText = isDarkMode ? 'text-blue-300' : 'text-blue-700'
  const ctaBg = isDarkMode
    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
    : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'

  return (
    <div className={`min-h-screen ${bgPrimary} py-8 px-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with Read-Only Badge */}
        <div className={`${bgCard} rounded-lg border ${borderColor} p-6 mb-6`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-2xl sm:text-3xl font-bold ${textPrimary}`}>
                  {scenario.name}
                </h1>
                <span className={`px-3 py-1 ${badgeBg} ${badgeText} text-sm font-semibold rounded-full`}>
                  Read-Only
                </span>
              </div>
              <p className={`text-sm ${textSecondary}`}>
                Shared retirement scenario • View-only access
              </p>
            </div>
            <Link
              href="/calculator/home"
              className={`${ctaBg} text-white px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-xl`}
            >
              Create Your Own Plan
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Variant Details Banner (if applicable) */}
        {variantMetadata && (
          <div className="mb-6">
            <VariantDetailsBanner
              variantMetadata={variantMetadata}
              scenario={scenario}
              isDarkMode={isDarkMode}
              isCollapsible={false}
            />
          </div>
        )}

        {/* Variant Comparison Table (if baseline snapshot exists) */}
        {variantMetadata && variantMetadata.baseline_snapshot && (
          <div className={`${bgCard} border ${borderColor} rounded-lg p-6 mb-6`}>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
              Comparison: {variantMetadata.baseline_snapshot.name} vs {scenario.name}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${borderColor}`}>
                    <th className={`text-left py-3 px-4 ${textPrimary} font-semibold`}>
                      Metric
                    </th>
                    <th className={`text-left py-3 px-4 ${textPrimary} font-semibold`}>
                      {variantMetadata.baseline_snapshot.name}
                    </th>
                    <th className={`text-left py-3 px-4 ${textPrimary} font-semibold`}>
                      {scenario.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Monthly Spending */}
                  <tr className={`border-b ${borderColor}`}>
                    <td className={`py-3 px-4 ${textSecondary}`}>Monthly Spending</td>
                    <td className={`py-3 px-4 ${textPrimary}`}>
                      {formatCurrency(variantMetadata.baseline_snapshot.monthly_spending, 0)}
                    </td>
                    <td className={`py-3 px-4 ${textPrimary}`}>
                      {scenario.expenses.age_based_changes && scenario.expenses.age_based_changes.length > 0 ? (
                        <div className="space-y-1">
                          {scenario.expenses.age_based_changes.map((change, index) => {
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
                        formatCurrency(scenario.expenses.fixed_monthly, 0)
                      )}
                    </td>
                  </tr>

                  {/* Portfolio Depletion */}
                  <tr className={`border-b ${borderColor}`}>
                    <td className={`py-3 px-4 ${textSecondary}`}>Portfolio Depletion</td>
                    <td className={`py-3 px-4 ${textPrimary}`}>
                      {variantMetadata.baseline_snapshot.portfolio_depleted_age
                        ? `Age ${variantMetadata.baseline_snapshot.portfolio_depleted_age}`
                        : 'Never (surplus)'}
                    </td>
                    <td className={`py-3 px-4 ${textPrimary}`}>
                      {results.portfolio_depleted_age
                        ? `Age ${results.portfolio_depleted_age}`
                        : 'Never (surplus)'}
                    </td>
                  </tr>

                  {/* Ending Balance */}
                  <tr className={`border-b ${borderColor}`}>
                    <td className={`py-3 px-4 ${textSecondary}`}>Ending Balance</td>
                    <td className={`py-3 px-4 ${textPrimary}`}>
                      {formatCompactCurrency(variantMetadata.baseline_snapshot.ending_balance)}
                    </td>
                    <td className={`py-3 px-4 ${textPrimary}`}>
                      {formatCompactCurrency(results.final_portfolio_value)}
                      {results.final_portfolio_value > variantMetadata.baseline_snapshot.ending_balance && (
                        <span className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'} ml-2`}>
                          (+{formatCompactCurrency(results.final_portfolio_value - variantMetadata.baseline_snapshot.ending_balance)})
                        </span>
                      )}
                      {results.final_portfolio_value < variantMetadata.baseline_snapshot.ending_balance && (
                        <span className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} ml-2`}>
                          ({formatCompactCurrency(results.final_portfolio_value - variantMetadata.baseline_snapshot.ending_balance)})
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI-Generated Narrative */}
        {narrative && (
          <div className="mb-6">
            <RetirementNarrative
              narrative={narrative}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-6">
          <ResultsSummary
            results={results}
            retirementAge={scenario.basic_inputs.retirement_age}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BalanceOverTimeChart
            results={results}
            isDarkMode={isDarkMode}
          />
          <IncomeCompositionChart
            results={results}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Tax Summary */}
        <div className="mb-6">
          <TaxSummaryCard
            results={results}
            retirementAge={scenario.basic_inputs.retirement_age}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Footer CTA */}
        <div className={`${bgCard} rounded-lg border ${borderColor} p-8 text-center`}>
          <h2 className={`text-xl sm:text-2xl font-bold ${textPrimary} mb-3`}>
            Ready to Plan Your Retirement?
          </h2>
          <p className={`text-base ${textSecondary} mb-6 max-w-2xl mx-auto`}>
            Create your own personalized retirement scenario with detailed projections,
            tax optimization, and what-if analysis.
          </p>
          <Link
            href="/calculator/home"
            className={`inline-flex items-center gap-2 ${ctaBg} text-white px-8 py-4 rounded-lg font-bold text-base transition-all shadow-lg hover:shadow-xl`}
          >
            Start Planning Now
            <ExternalLink className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
