'use client'

/**
 * Balance Over Time Chart
 *
 * Shows portfolio balance projection from retirement age to end of plan,
 * with milestone markers for CPP/OAS start and RRIF conversion.
 */

import { useState, useEffect } from 'react'
import { CalculationResults } from '@/types/calculator'
import { formatBalanceData, formatCompactCurrency } from '@/lib/calculations/results-formatter'
import { HelpCircle } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts'

interface BalanceOverTimeChartProps {
  results: CalculationResults
  isDarkMode?: boolean
}

export function BalanceOverTimeChart({ results, isDarkMode = false }: BalanceOverTimeChartProps) {
  const data = formatBalanceData(results)
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  // Find milestones for markers
  const milestones = data.filter(d => d.milestone)

  // Theme-aware colors
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const cardBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const gridStroke = isDarkMode ? '#374151' : '#e5e7eb'
  const axisStroke = isDarkMode ? '#9ca3af' : '#6b7280'
  const tooltipBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const tooltipBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const markerStroke = isDarkMode ? '#1f2937' : '#fff'

  return (
    <div className={`${cardBg} rounded-lg border ${cardBorder} p-6`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className={`text-lg font-semibold ${textPrimary}`}>
          Portfolio Balance Over Time
        </h3>
        <div className="relative inline-flex items-center">
          <button
            onClick={() => setIsTooltipOpen(!isTooltipOpen)}
            className={`cursor-help focus:outline-none ${isTooltipOpen ? 'opacity-100' : 'opacity-60 hover:opacity-100'} transition-opacity`}
            aria-label="Help"
          >
            <HelpCircle className={`w-4 h-4 ${textSecondary}`} />
          </button>

          {/* Tooltip */}
          {isTooltipOpen && (
            <>
              {/* Backdrop - tap to close on mobile */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsTooltipOpen(false)}
              />

              {/* Tooltip content */}
              <div className={`absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] p-4 rounded-lg shadow-xl text-sm leading-relaxed z-50 ${isDarkMode ? 'bg-gray-900 border border-gray-700 text-gray-200' : 'bg-white border border-gray-300 text-gray-700'}`}>
                <div className={`font-semibold mb-2 ${textPrimary}`}>What This Shows</div>
                <p className="mb-3">Your total portfolio value across all accounts (RRSP, TFSA, Non-Registered).</p>

                <div className={`font-semibold mb-1.5 ${textPrimary}`}>Balance Changes Due To:</div>
                <ul className="space-y-1 ml-4 mb-3">
                  <li className="list-disc">Investment returns (growth)</li>
                  <li className="list-disc">Withdrawals to fund spending</li>
                  <li className="list-disc">Required RRIF minimums (age 71+)</li>
                </ul>

                <p className="text-xs">
                  <span className="font-medium">Rising balance:</span> Investments growing faster than withdrawals<br/>
                  <span className="font-medium">Declining balance:</span> Withdrawals exceeding growth
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 15 }}
          >
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />

            <XAxis
              dataKey="age"
              stroke={axisStroke}
              style={{ fontSize: '12px' }}
              label={{ value: 'Age', position: 'insideBottom', offset: -5, fill: axisStroke }}
            />

            <YAxis
              stroke={axisStroke}
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatCompactCurrency(value)}
            />

            <Tooltip
              content={<CustomTooltip isDarkMode={isDarkMode} />}
              cursor={{ stroke: '#9ca3af', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#balanceGradient)"
            />

            {/* Milestone markers */}
            {milestones.map((milestone, index) => (
              <ReferenceDot
                key={index}
                x={milestone.age}
                y={milestone.balance}
                r={6}
                fill="#f59e0b"
                stroke={markerStroke}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>

      {/* Milestone Legend */}
      {milestones.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          {milestones.map((milestone, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-amber-500 border-2 ${isDarkMode ? 'border-gray-800' : 'border-white'}`} />
              <span className={textSecondary}>
                {milestone.milestone} (Age {milestone.age})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Custom tooltip for balance chart
 */
function CustomTooltip({ active, payload, isDarkMode }: any) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload

  const tooltipBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const tooltipBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'

  return (
    <div className={`${tooltipBg} border ${tooltipBorder} rounded-lg shadow-lg p-3`}>
      <div className={`font-medium ${textPrimary} mb-2`}>Age {data.age}</div>
      <div className={`text-sm ${textSecondary}`}>
        Balance: <span className={`font-semibold ${textPrimary}`}>
          {formatCompactCurrency(data.balance)}
        </span>
      </div>
      {data.milestone && (
        <div className="text-sm text-amber-600 mt-1 font-medium">
          {data.milestone}
        </div>
      )}
    </div>
  )
}
