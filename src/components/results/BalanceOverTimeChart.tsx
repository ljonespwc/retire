'use client'

/**
 * Balance Over Time Chart
 *
 * Shows portfolio balance projection from retirement age to end of plan,
 * with milestone markers for CPP/OAS start and RRIF conversion.
 */

import { CalculationResults } from '@/types/calculator'
import { formatBalanceData, formatCompactCurrency } from '@/lib/calculations/results-formatter'
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
}

export function BalanceOverTimeChart({ results }: BalanceOverTimeChartProps) {
  const data = formatBalanceData(results)

  // Find milestones for markers
  const milestones = data.filter(d => d.milestone)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Portfolio Balance Over Time
      </h3>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="age"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
            />

            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatCompactCurrency(value)}
            />

            <Tooltip
              content={<CustomTooltip />}
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
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Milestone Legend */}
      {milestones.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {milestones.map((milestone, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
              <span className="text-gray-600">
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
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="font-medium text-gray-900 mb-2">Age {data.age}</div>
      <div className="text-sm text-gray-600">
        Balance: <span className="font-semibold text-gray-900">
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
