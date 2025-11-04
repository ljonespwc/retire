'use client'

/**
 * Results Summary Component
 *
 * Top-level overview of retirement calculation results showing
 * monthly income, success indicator, and key metrics.
 */

import { CalculationResults, Expenses } from '@/types/calculator'
import { formatSummary, formatCurrency, formatCompactCurrency } from '@/lib/calculations/results-formatter'

interface ResultsSummaryProps {
  results: CalculationResults
  retirementAge: number
  expenses?: Expenses
}

interface ExtendedResultsSummaryProps extends ResultsSummaryProps {
  isDarkMode?: boolean
  variantName?: string // Optional variant name to display indicator
  actionButtons?: React.ReactNode // Optional buttons to display between income and banner
}

export function ResultsSummary({ results, retirementAge, expenses, isDarkMode = false, variantName, actionButtons }: ExtendedResultsSummaryProps) {
  const summary = formatSummary(results, retirementAge, expenses)

  // Calculate additional helpful metrics
  const avgAnnualWithdrawal = summary.totalAssets > 0
    ? (summary.totalAssets - summary.endingBalance) / summary.yearsInRetirement
    : 0

  const portfolioSuccessRate = summary.depletionAge === undefined ? 100 : 0

  const successConfig = {
    sufficient: {
      bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-50',
      border: isDarkMode ? 'border-green-700' : 'border-green-200',
      text: isDarkMode ? 'text-green-300' : 'text-green-800',
      label: 'Your retirement plan looks solid',
      icon: '✓'
    },
    concerning: {
      bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50',
      border: isDarkMode ? 'border-yellow-700' : 'border-yellow-200',
      text: isDarkMode ? 'text-yellow-300' : 'text-yellow-800',
      label: 'Your plan may need adjustments',
      icon: '⚠'
    },
    depleted: {
      // Contextual colors/text based on income coverage
      bg: summary.incomeCoverageRatio && summary.incomeCoverageRatio >= 1.0
        ? (isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50')
        : summary.incomeCoverageRatio && summary.incomeCoverageRatio >= 0.7
        ? (isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50')
        : (isDarkMode ? 'bg-red-900/30' : 'bg-red-50'),
      border: summary.incomeCoverageRatio && summary.incomeCoverageRatio >= 1.0
        ? (isDarkMode ? 'border-yellow-700' : 'border-yellow-200')
        : summary.incomeCoverageRatio && summary.incomeCoverageRatio >= 0.7
        ? (isDarkMode ? 'border-orange-700' : 'border-orange-200')
        : (isDarkMode ? 'border-red-700' : 'border-red-200'),
      text: summary.incomeCoverageRatio && summary.incomeCoverageRatio >= 1.0
        ? (isDarkMode ? 'text-yellow-300' : 'text-yellow-800')
        : summary.incomeCoverageRatio && summary.incomeCoverageRatio >= 0.7
        ? (isDarkMode ? 'text-orange-300' : 'text-orange-800')
        : (isDarkMode ? 'text-red-300' : 'text-red-800'),
      label: summary.incomeCoverageRatio && summary.incomeCoverageRatio >= 1.0
        ? 'Portfolio depletes, but ongoing income covers expenses'
        : summary.incomeCoverageRatio && summary.incomeCoverageRatio >= 0.7
        ? 'Portfolio depletes with moderate income shortfall'
        : 'Funds may run out before end of retirement',
      icon: summary.incomeCoverageRatio && summary.incomeCoverageRatio >= 1.0
        ? '⚠️'
        : summary.incomeCoverageRatio && summary.incomeCoverageRatio >= 0.7
        ? '⚠️'
        : '✕'
    }
  }

  const config = successConfig[summary.successIndicator]

  // Theme-aware text colors
  const labelColor = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const subLabelColor = isDarkMode ? 'text-gray-400' : 'text-gray-500'
  const valueColor = isDarkMode ? 'text-white' : 'text-gray-900'
  const cardBg = isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'

  return (
    <div className="space-y-6">
      {/* Monthly Income - Prominent Display */}
      <div className="text-center">
        <div className={`text-sm ${labelColor} mb-2 font-medium`}>
          Year 1 After-Tax Income
        </div>

        {summary.hasYear1Lumpsum ? (
          <>
            {/* Split display for lumpsum scenarios */}
            <div className={`text-6xl font-bold ${valueColor}`}>
              {formatCurrency(summary.recurringMonthlyIncome!)}/mth
            </div>
            <div className={`text-sm ${labelColor} mt-3 font-medium`}>
              (Plus: {formatCurrency(summary.year1LumpsumAmount!)} one-time withdrawal)
            </div>
          </>
        ) : (
          <>
            {/* Normal display */}
            <div className={`text-6xl font-bold ${valueColor}`}>
              {formatCurrency(summary.monthlyAfterTaxIncome)}/mth
            </div>
          </>
        )}

        <div className={`text-sm ${subLabelColor} mt-2`}>
          Lifetime total: {formatCompactCurrency(summary.lifetimeNetIncome)} after taxes
        </div>
      </div>

      {/* Action Buttons (Save/Share) */}
      {actionButtons && (
        <div className="flex justify-center">
          {actionButtons}
        </div>
      )}

      {/* Success Indicator */}
      <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
        <div className={`flex items-center justify-between ${config.text}`}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">{config.icon}</div>
            <div className="font-medium">{config.label}</div>
          </div>
          {/* Variant Indicator Badge */}
          {variantName && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-purple-900/50 border border-purple-700 text-purple-300' : 'bg-purple-100 border border-purple-300 text-purple-700'}`}>
              {variantName}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Grid - 3 columns for better balance */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Retirement Age */}
        <div className={`${cardBg} rounded-lg p-4`}>
          <div className={`text-sm ${labelColor} mb-1`}>Retirement Age</div>
          <div className={`text-2xl font-bold ${valueColor}`}>
            {summary.retirementAge}
          </div>
        </div>

        {/* Years in Retirement */}
        <div className={`${cardBg} rounded-lg p-4`}>
          <div className={`text-sm ${labelColor} mb-1`}>Years in Retirement</div>
          <div className={`text-2xl font-bold ${valueColor}`}>
            {summary.yearsInRetirement}
          </div>
        </div>

        {/* Success Rate */}
        <div className={`${cardBg} rounded-lg p-4`}>
          <div className={`text-sm ${labelColor} mb-1`}>Plan Success Rate</div>
          <div className={`text-2xl font-bold ${valueColor}`}>
            {portfolioSuccessRate}%
          </div>
        </div>

        {/* Starting Assets */}
        <div className={`${cardBg} rounded-lg p-4`}>
          <div className={`text-sm ${labelColor} mb-1`}>Starting Assets</div>
          <div className={`text-2xl font-bold ${valueColor}`}>
            {formatCompactCurrency(summary.totalAssets)}
          </div>
        </div>

        {/* Ending Balance */}
        <div className={`${cardBg} rounded-lg p-4`}>
          <div className={`text-sm ${labelColor} mb-1`}>Ending Balance</div>
          <div className={`text-2xl font-bold ${valueColor}`}>
            {formatCompactCurrency(summary.endingBalance)}
          </div>
        </div>

        {/* Net Portfolio Change */}
        <div className={`${cardBg} rounded-lg p-4`}>
          <div className={`text-sm ${labelColor} mb-1`}>Net Portfolio Change</div>
          <div className={`text-2xl font-bold ${valueColor} flex flex-wrap items-baseline gap-x-2`}>
            {avgAnnualWithdrawal >= 0 ? (
              // Portfolio depleting - show as negative with red indicator
              <>
                <span>-{formatCompactCurrency(avgAnnualWithdrawal)}/year</span>
                <span className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  (depleting)
                </span>
              </>
            ) : (
              // Portfolio growing - show as positive growth with green indicator
              <>
                <span>+{formatCompactCurrency(Math.abs(avgAnnualWithdrawal))}/year</span>
                <span className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  (growing!)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Depletion Warning (if applicable) - Contextual based on income coverage */}
      {summary.depletionAge !== undefined && (
        <>
          {summary.incomeCoverageRatio !== undefined && summary.incomeCoverageRatio >= 1.0 ? (
            // Ongoing income covers expenses - yellow warning
            <div className={`${isDarkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
              <div className={isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}>
                <div className="font-medium mb-1">
                  ⚠️ Portfolio Depleted at Age {summary.depletionAge}
                </div>
                <div className="text-sm">
                  Your ongoing income ({formatCurrency(summary.ongoingIncomeAtDepletion!)}/year) covers your expenses.
                  You'll continue to receive pension, CPP, and OAS benefits.
                </div>
              </div>
            </div>
          ) : summary.incomeCoverageRatio !== undefined && summary.incomeCoverageRatio >= 0.7 ? (
            // Partial coverage - orange warning
            <div className={`${isDarkMode ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
              <div className={isDarkMode ? 'text-orange-300' : 'text-orange-800'}>
                <div className="font-medium mb-1">
                  ⚠️ Portfolio Depleted at Age {summary.depletionAge}
                </div>
                <div className="text-sm">
                  Shortfall: {formatCurrency(summary.incomeShortfall!)}/year (~{Math.round((1 - summary.incomeCoverageRatio) * 100)}% of expenses).
                  Consider adjusting spending or exploring additional income sources.
                </div>
              </div>
            </div>
          ) : (
            // Major shortfall or no income data - red warning (keep current behavior)
            <div className={`${isDarkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
              <div className={isDarkMode ? 'text-red-300' : 'text-red-800'}>
                <div className="font-medium mb-1">
                  ✕ Funds Depleted at Age {summary.depletionAge}
                </div>
                <div className="text-sm">
                  {summary.incomeShortfall && summary.incomeShortfall > 0
                    ? `Significant shortfall: ${formatCurrency(summary.incomeShortfall)}/year. Consider retiring later, reducing spending, or increasing savings.`
                    : 'Consider retiring later, reducing spending, or increasing savings to extend your retirement funds.'
                  }
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
