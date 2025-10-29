'use client'

/**
 * Tax Summary Card
 *
 * Shows tax impact summary including total tax paid,
 * effective rate, and gross vs net comparison.
 */

import { CalculationResults } from '@/types/calculator'
import { formatTaxSummary, formatCurrency, formatPercentage, formatCompactCurrency } from '@/lib/calculations/results-formatter'
import { HelpCircle } from 'lucide-react'

interface TaxSummaryCardProps {
  results: CalculationResults
  retirementAge: number
  isDarkMode?: boolean
}

export function TaxSummaryCard({ results, retirementAge, isDarkMode = false }: TaxSummaryCardProps) {
  const taxSummary = formatTaxSummary(results, retirementAge)

  // Theme-aware colors
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const cardBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const dividerBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'

  // Accent boxes
  const orangeBox = isDarkMode ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-100'
  const orangeText = isDarkMode ? 'text-orange-300' : 'text-orange-600'
  const purpleBox = isDarkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-100'
  const purpleText = isDarkMode ? 'text-purple-300' : 'text-purple-600'
  const blueBox = isDarkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-100'
  const blueText = isDarkMode ? 'text-blue-300' : 'text-blue-800'
  const blueTextMuted = isDarkMode ? 'text-blue-400' : 'text-blue-700'
  const grayBox = isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
  const grayBorder = isDarkMode ? 'border-gray-600' : 'border-gray-300'

  return (
    <div className={`${cardBg} rounded-lg border ${cardBorder} p-6`}>
      <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
        Tax Impact Summary
      </h3>

      <div className="space-y-4">
        {/* Tax Rates - Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Effective Tax Rate */}
          <div className={`${orangeBox} rounded-lg p-4 border`}>
            <div className={`text-sm ${textSecondary} mb-1 flex items-center gap-1.5`}>
              <span>Effective Tax Rate</span>
              <div
                className="group relative inline-flex items-center cursor-help"
                title="This rate applies only to taxable income. TFSA withdrawals are tax-free and excluded from this calculation."
              >
                <HelpCircle className="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
                <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 rounded-lg shadow-lg text-xs leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 ${isDarkMode ? 'bg-gray-900 border border-gray-700 text-gray-200' : 'bg-white border border-gray-300 text-gray-700'}`}>
                  <div className="font-medium mb-1">On Taxable Income Only</div>
                  This rate applies only to taxable income. TFSA withdrawals are tax-free and excluded from this calculation, which is why the rate may seem low compared to total income.
                </div>
              </div>
            </div>
            <div className={`text-3xl font-bold ${orangeText}`}>
              {formatPercentage(taxSummary.effectiveRate)}
            </div>
          </div>

          {/* Marginal Tax Rate */}
          <div className={`${purpleBox} rounded-lg p-4 border`}>
            <div className={`text-sm ${textSecondary} mb-1`}>
              Marginal Tax Rate
            </div>
            <div className={`text-3xl font-bold ${purpleText}`}>
              {formatPercentage(taxSummary.marginalRate)}
            </div>
          </div>
        </div>

        {/* Total Tax Paid */}
        <div className={`flex justify-between items-center py-3 border-b ${dividerBorder}`}>
          <span className={textSecondary}>Total Tax Paid (Retirement)</span>
          <span className={`font-semibold ${textPrimary}`}>
            {formatCompactCurrency(taxSummary.totalTaxPaid)}
          </span>
        </div>

        {/* Annual Tax Estimate */}
        <div className={`flex justify-between items-center py-3 border-b ${dividerBorder}`}>
          <span className={textSecondary}>Annual Average</span>
          <span className={`font-semibold ${textPrimary}`}>
            {formatCurrency(taxSummary.annualEstimate)}
          </span>
        </div>

        {/* Monthly Net Income */}
        <div className={`flex justify-between items-center py-3 border-b ${dividerBorder}`}>
          <span className={textSecondary}>Average After-Tax Income</span>
          <span className={`font-semibold ${textPrimary}`}>
            {formatCurrency(taxSummary.monthlyNetIncome)}<span className={`text-xs ml-1 ${textSecondary}`}>/mo</span>
          </span>
        </div>

        {/* Gross vs Net Comparison */}
        <div className={`${grayBox} rounded-lg p-4 mt-4`}>
          <div className={`text-sm font-medium ${textPrimary} mb-3`}>
            Gross vs Net Income
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${textSecondary}`}>Total Gross Income</span>
              <span className={`font-medium ${textPrimary}`}>
                {formatCompactCurrency(taxSummary.grossIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center text-red-600">
              <span className="text-sm">Less: Total Tax</span>
              <span className="font-medium">
                -{formatCompactCurrency(taxSummary.totalTaxPaid)}
              </span>
            </div>
            <div className={`flex justify-between items-center pt-2 border-t ${grayBorder}`}>
              <span className={`text-sm font-medium ${textPrimary}`}>Net Income</span>
              <span className={`font-bold ${textPrimary}`}>
                {formatCurrency(taxSummary.netIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* Tax Efficiency Note */}
        <div className={`${blueBox} border rounded-lg p-3 mt-4`}>
          <div className={`text-xs ${blueText}`}>
            <div className="font-medium mb-1">Tax Efficiency Tips</div>
            <ul className={`list-disc list-inside space-y-1 ${blueTextMuted}`}>
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
