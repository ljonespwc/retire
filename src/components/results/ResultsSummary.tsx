'use client'

/**
 * Results Summary Component
 *
 * Top-level overview of retirement calculation results showing
 * monthly income, success indicator, and key metrics.
 */

import { CalculationResults } from '@/types/calculator'
import { formatSummary, formatCurrency, formatCompactCurrency } from '@/lib/calculations/results-formatter'

interface ResultsSummaryProps {
  results: CalculationResults
  retirementAge: number
}

interface ExtendedResultsSummaryProps extends ResultsSummaryProps {
  isDarkMode?: boolean
}

export function ResultsSummary({ results, retirementAge, isDarkMode = false }: ExtendedResultsSummaryProps) {
  const summary = formatSummary(results, retirementAge)

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
      bg: isDarkMode ? 'bg-red-900/30' : 'bg-red-50',
      border: isDarkMode ? 'border-red-700' : 'border-red-200',
      text: isDarkMode ? 'text-red-300' : 'text-red-800',
      label: 'Funds may run out before end of retirement',
      icon: '✕'
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
        <div className={`text-5xl font-bold ${valueColor}`}>
          {formatCurrency(summary.monthlyAfterTaxIncome)}
        </div>
        <div className={`text-sm ${subLabelColor} mt-1`}>
          per month (year 1, after taxes)
        </div>
      </div>

      {/* Success Indicator */}
      <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
        <div className={`flex items-center gap-3 ${config.text}`}>
          <div className="text-2xl">{config.icon}</div>
          <div className="font-medium">{config.label}</div>
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

        {/* Average Annual Withdrawal */}
        <div className={`${cardBg} rounded-lg p-4`}>
          <div className={`text-sm ${labelColor} mb-1`}>Avg Annual Draw</div>
          <div className={`text-2xl font-bold ${valueColor}`}>
            {formatCompactCurrency(avgAnnualWithdrawal)}
          </div>
        </div>
      </div>

      {/* Depletion Warning (if applicable) */}
      {summary.depletionAge !== undefined && (
        <div className={`${isDarkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
          <div className={isDarkMode ? 'text-red-300' : 'text-red-800'}>
            <div className="font-medium mb-1">Funds Depleted at Age {summary.depletionAge}</div>
            <div className="text-sm">
              Consider retiring later, reducing spending, or increasing savings to extend your retirement funds.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
