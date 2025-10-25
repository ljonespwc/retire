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

export function ResultsSummary({ results, retirementAge }: ResultsSummaryProps) {
  const summary = formatSummary(results, retirementAge)

  const successConfig = {
    sufficient: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      label: 'Your retirement plan looks solid',
      icon: '✓'
    },
    concerning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      label: 'Your plan may need adjustments',
      icon: '⚠'
    },
    depleted: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      label: 'Funds may run out before end of retirement',
      icon: '✕'
    }
  }

  const config = successConfig[summary.successIndicator]

  return (
    <div className="space-y-6">
      {/* Monthly Income - Prominent Display */}
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-2">
          Monthly After-Tax Income in Retirement
        </div>
        <div className="text-5xl font-bold text-gray-900">
          {formatCurrency(summary.monthlyAfterTaxIncome)}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          per month
        </div>
      </div>

      {/* Success Indicator */}
      <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
        <div className={`flex items-center gap-3 ${config.text}`}>
          <div className="text-2xl">{config.icon}</div>
          <div className="font-medium">{config.label}</div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Retirement Age */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Retirement Age</div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.retirementAge}
          </div>
        </div>

        {/* Years in Retirement */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Years in Retirement</div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.yearsInRetirement}
          </div>
        </div>

        {/* Total Assets */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Starting Assets</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCompactCurrency(summary.totalAssets)}
          </div>
        </div>

        {/* Ending Balance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Ending Balance</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCompactCurrency(summary.endingBalance)}
          </div>
        </div>
      </div>

      {/* Depletion Warning (if applicable) */}
      {summary.depletionAge !== undefined && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
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
