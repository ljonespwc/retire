'use client'

/**
 * Tax Summary Card
 *
 * Shows tax impact summary including total tax paid,
 * effective rate, and gross vs net comparison.
 */

import { CalculationResults } from '@/types/calculator'
import { formatTaxSummary, formatCurrency, formatPercentage, formatCompactCurrency } from '@/lib/calculations/results-formatter'

interface TaxSummaryCardProps {
  results: CalculationResults
}

export function TaxSummaryCard({ results }: TaxSummaryCardProps) {
  const taxSummary = formatTaxSummary(results)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Tax Impact Summary
      </h3>

      <div className="space-y-4">
        {/* Effective Tax Rate - Prominent */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
          <div className="text-sm text-gray-600 mb-1">
            Effective Tax Rate
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {formatPercentage(taxSummary.effectiveRate)}
          </div>
        </div>

        {/* Total Tax Paid */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-600">Total Tax Paid (Retirement)</span>
          <span className="font-semibold text-gray-900">
            {formatCompactCurrency(taxSummary.totalTaxPaid)}
          </span>
        </div>

        {/* Annual Tax Estimate */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-600">Annual Average</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(taxSummary.annualEstimate)}
          </span>
        </div>

        {/* Gross vs Net Comparison */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Gross vs Net Income
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Gross Income</span>
              <span className="font-medium text-gray-900">
                {formatCompactCurrency(taxSummary.grossIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center text-red-600">
              <span className="text-sm">Less: Total Tax</span>
              <span className="font-medium">
                -{formatCompactCurrency(taxSummary.totalTaxPaid)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
              <span className="text-sm font-medium text-gray-900">Net Income</span>
              <span className="font-bold text-gray-900">
                {formatCompactCurrency(taxSummary.netIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* Tax Efficiency Note */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-4">
          <div className="text-xs text-blue-800">
            <div className="font-medium mb-1">Tax Efficiency Tips</div>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>TFSA withdrawals are tax-free</li>
              <li>Income splitting can reduce tax burden</li>
              <li>CPP/OAS timing affects total tax paid</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
