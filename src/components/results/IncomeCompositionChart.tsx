'use client'

/**
 * Income Composition Chart
 *
 * Shows breakdown of retirement income sources over time,
 * stacked to show total income composition.
 */

import { CalculationResults } from '@/types/calculator'
import { formatIncomeData, formatCompactCurrency } from '@/lib/calculations/results-formatter'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface IncomeCompositionChartProps {
  results: CalculationResults
}

export function IncomeCompositionChart({ results }: IncomeCompositionChartProps) {
  const data = formatIncomeData(results)

  // Income source colors (matching brand palette)
  const colors = {
    rrsp: '#f97316',      // Orange for RRSP
    tfsa: '#3b82f6',      // Blue for TFSA
    cpp: '#10b981',       // Green for CPP
    oas: '#8b5cf6',       // Purple for OAS
    pension: '#f59e0b',   // Amber for pension
    other: '#6b7280'      // Gray for other
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Income Sources Over Time
      </h3>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="rrspGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.rrsp} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.rrsp} stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="tfsaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.tfsa} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.tfsa} stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="cppGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.cpp} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.cpp} stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="oasGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.oas} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.oas} stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="pensionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.pension} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.pension} stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="otherGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.other} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.other} stopOpacity={0.2} />
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

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="square"
            />

            {/* Stack areas from bottom to top */}
            <Area
              type="monotone"
              dataKey="rrspIncome"
              stackId="1"
              stroke={colors.rrsp}
              fill="url(#rrspGradient)"
              name="RRSP/RRIF"
            />
            <Area
              type="monotone"
              dataKey="tfsaIncome"
              stackId="1"
              stroke={colors.tfsa}
              fill="url(#tfsaGradient)"
              name="TFSA"
            />
            <Area
              type="monotone"
              dataKey="cppIncome"
              stackId="1"
              stroke={colors.cpp}
              fill="url(#cppGradient)"
              name="CPP"
            />
            <Area
              type="monotone"
              dataKey="oasIncome"
              stackId="1"
              stroke={colors.oas}
              fill="url(#oasGradient)"
              name="OAS"
            />
            <Area
              type="monotone"
              dataKey="pensionIncome"
              stackId="1"
              stroke={colors.pension}
              fill="url(#pensionGradient)"
              name="Pension"
            />
            <Area
              type="monotone"
              dataKey="otherIncome"
              stackId="1"
              stroke={colors.other}
              fill="url(#otherGradient)"
              name="Other"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/**
 * Custom tooltip for income composition chart
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload
  const totalIncome =
    data.rrspIncome +
    data.tfsaIncome +
    data.cppIncome +
    data.oasIncome +
    data.pensionIncome +
    data.otherIncome

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="font-medium text-gray-900 mb-2">Age {data.age}</div>
      <div className="space-y-1 text-sm">
        <div className="font-semibold text-gray-900 border-b border-gray-200 pb-1">
          Total: {formatCompactCurrency(totalIncome)}
        </div>
        {data.rrspIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">RRSP/RRIF:</span>
            <span className="font-medium">{formatCompactCurrency(data.rrspIncome)}</span>
          </div>
        )}
        {data.tfsaIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">TFSA:</span>
            <span className="font-medium">{formatCompactCurrency(data.tfsaIncome)}</span>
          </div>
        )}
        {data.cppIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">CPP:</span>
            <span className="font-medium">{formatCompactCurrency(data.cppIncome)}</span>
          </div>
        )}
        {data.oasIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">OAS:</span>
            <span className="font-medium">{formatCompactCurrency(data.oasIncome)}</span>
          </div>
        )}
        {data.pensionIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Pension:</span>
            <span className="font-medium">{formatCompactCurrency(data.pensionIncome)}</span>
          </div>
        )}
        {data.otherIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Other:</span>
            <span className="font-medium">{formatCompactCurrency(data.otherIncome)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
