'use client'

/**
 * Income Composition Chart
 *
 * Shows breakdown of retirement income sources over time,
 * stacked to show total income composition.
 */

import { useState, useMemo } from 'react'
import { CalculationResults } from '@/types/calculator'
import { formatIncomeData, formatCompactCurrency } from '@/lib/calculations/results-formatter'
import { HelpCircle } from 'lucide-react'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts'

interface IncomeCompositionChartProps {
  results: CalculationResults
  isDarkMode?: boolean
}

export function IncomeCompositionChart({ results, isDarkMode = false }: IncomeCompositionChartProps) {
  const data = formatIncomeData(results)

  // State for toggling income source visibility
  const [visibleSources, setVisibleSources] = useState({
    rrsp: true,
    tfsa: true,
    nonRegistered: true,
    cpp: true,
    oas: true,
    pension: true,
    other: true,
    netIncome: true  // After-tax income line
  })

  // State for help tooltip
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  // Find milestones for markers
  const milestones = data.filter(d => d.milestone)

  // Income source colors (matching brand palette)
  const colors = {
    rrsp: '#f97316',      // Orange for RRSP
    tfsa: '#3b82f6',      // Blue for TFSA
    nonRegistered: '#a855f7', // Purple for Non-Registered
    cpp: '#10b981',       // Green for CPP
    oas: '#8b5cf6',       // Purple for OAS
    pension: '#f59e0b',   // Amber for pension
    other: '#94a3b8'      // Gray for other income (rental, etc.)
  }

  // Calculate total lifetime income per source for sorting
  const incomeSourceTotals = useMemo(() => {
    const totals = {
      rrsp: 0,
      tfsa: 0,
      nonRegistered: 0,
      cpp: 0,
      oas: 0,
      pension: 0,
      other: 0
    }

    data.forEach(point => {
      totals.rrsp += point.rrspIncome
      totals.tfsa += point.tfsaIncome
      totals.nonRegistered += point.nonRegisteredIncome
      totals.cpp += point.cppIncome
      totals.oas += point.oasIncome
      totals.pension += point.pensionIncome
      totals.other += point.otherIncome
    })

    return totals
  }, [data])

  // Create sorted income source metadata (largest to smallest = bottom to top in stack)
  const sortedIncomeSources = useMemo(() => {
    const sources = [
      { key: 'rrsp', name: 'RRSP/RRIF', dataKey: 'rrspIncome', color: colors.rrsp, gradient: 'rrspGradient', total: incomeSourceTotals.rrsp },
      { key: 'tfsa', name: 'TFSA', dataKey: 'tfsaIncome', color: colors.tfsa, gradient: 'tfsaGradient', total: incomeSourceTotals.tfsa },
      { key: 'nonRegistered', name: 'Non-Registered', dataKey: 'nonRegisteredIncome', color: colors.nonRegistered, gradient: 'nonRegisteredGradient', total: incomeSourceTotals.nonRegistered },
      { key: 'cpp', name: 'CPP', dataKey: 'cppIncome', color: colors.cpp, gradient: 'cppGradient', total: incomeSourceTotals.cpp },
      { key: 'oas', name: 'OAS', dataKey: 'oasIncome', color: colors.oas, gradient: 'oasGradient', total: incomeSourceTotals.oas },
      { key: 'pension', name: 'Pension', dataKey: 'pensionIncome', color: colors.pension, gradient: 'pensionGradient', total: incomeSourceTotals.pension },
      { key: 'other', name: 'Other', dataKey: 'otherIncome', color: colors.other, gradient: 'otherGradient', total: incomeSourceTotals.other }
    ]

    // Sort descending by total (largest first = bottom of stack)
    return sources.sort((a, b) => b.total - a.total)
  }, [incomeSourceTotals, colors])

  // Theme-aware colors
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const cardBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const gridStroke = isDarkMode ? '#374151' : '#e5e7eb'
  const axisStroke = isDarkMode ? '#9ca3af' : '#6b7280'
  const markerStroke = isDarkMode ? '#1f2937' : '#ffffff'

  return (
    <div className={`${cardBg} rounded-lg border ${cardBorder} p-6`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className={`text-lg font-semibold ${textPrimary}`}>
          Income Sources Over Time
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

              {/* Tooltip content - centered under icon */}
              <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] p-4 rounded-lg shadow-xl text-sm leading-relaxed z-50 ${isDarkMode ? 'bg-gray-900 border border-gray-700 text-gray-200' : 'bg-white border border-gray-300 text-gray-700'}`}>
                <div className={`font-semibold mb-2 ${textPrimary}`}>What This Shows</div>
                <p className="mb-3">Where your retirement income comes from each year. Each color represents a different source stacked on top of each other.</p>

                <div className={`font-semibold mb-1.5 ${textPrimary}`}>Income Sources Include:</div>
                <ul className="space-y-1 ml-4 mb-3">
                  <li className="list-disc">Portfolio withdrawals (RRSP/RRIF, TFSA, Non-Reg)</li>
                  <li className="list-disc">CPP (starts at your chosen age: 60-70)</li>
                  <li className="list-disc">OAS (starts at 65)</li>
                  <li className="list-disc">Pension (if applicable)</li>
                  <li className="list-disc">Other income (rental, part-time work, etc.)</li>
                </ul>

                <p className="text-xs">
                  The mix changes as government benefits kick in and withdrawal strategies adjust over time.
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
              <linearGradient id="rrspGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.rrsp} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.rrsp} stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="tfsaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.tfsa} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.tfsa} stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="nonRegisteredGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.nonRegistered} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.nonRegistered} stopOpacity={0.2} />
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
              content={(props) => (
                <CustomTooltip
                  {...props}
                  isDarkMode={isDarkMode}
                  visibleSources={visibleSources}
                  sortedIncomeSources={sortedIncomeSources}
                />
              )}
            />

            {/* Dynamically render areas in sorted order (largest = bottom) */}
            {sortedIncomeSources.map(source => (
              visibleSources[source.key as keyof typeof visibleSources] && (
                <Area
                  key={source.key}
                  type="monotone"
                  dataKey={source.dataKey}
                  stackId="1"
                  stroke={source.color}
                  fill={`url(#${source.gradient})`}
                  name={source.name}
                />
              )
            ))}

            {/* After-tax income line overlay */}
            {visibleSources.netIncome && (
              <Line
                type="monotone"
                dataKey="netIncome"
                stroke="#22c55e"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={false}
                name="After-Tax Income"
              />
            )}

            {/* Milestone markers */}
            {milestones.map((milestone, index) => {
              // Calculate total income at this age for marker positioning
              const totalIncome =
                milestone.rrspIncome +
                milestone.tfsaIncome +
                milestone.nonRegisteredIncome +
                milestone.cppIncome +
                milestone.oasIncome +
                milestone.pensionIncome +
                milestone.otherIncome

              return (
                <ReferenceDot
                  key={index}
                  x={milestone.age}
                  y={totalIncome}
                  r={6}
                  fill="#10b981"
                  stroke={markerStroke}
                  strokeWidth={2}
                />
              )
            })}
          </AreaChart>
        </ResponsiveContainer>

      {/* Interactive Income Source Legend */}
      <div className="mt-6">
        <div className="flex flex-wrap gap-3">
          {sortedIncomeSources.map(source => (
            <button
              key={source.key}
              onClick={() => setVisibleSources(prev => ({ ...prev, [source.key]: !prev[source.key as keyof typeof prev] }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm ${
                visibleSources[source.key as keyof typeof visibleSources]
                  ? `${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} opacity-100`
                  : `${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} opacity-40 hover:opacity-60`
              }`}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: source.color }}
              />
              <span className={`${textSecondary} ${!visibleSources[source.key as keyof typeof visibleSources] ? 'line-through' : ''}`}>
                {source.name}
              </span>
            </button>
          ))}

          {/* After-Tax Income Line Toggle */}
          <button
            onClick={() => setVisibleSources(prev => ({ ...prev, netIncome: !prev.netIncome }))}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm border-2 border-dashed ${
              visibleSources.netIncome
                ? `${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-green-500' : 'bg-gray-100 hover:bg-gray-200 border-green-500'} opacity-100`
                : `${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'} opacity-40 hover:opacity-60`
            }`}
          >
            <div
              className="w-6 h-0.5 rounded-sm"
              style={{ backgroundColor: '#22c55e', borderStyle: 'dashed' }}
            />
            <span className={`${textSecondary} font-medium ${!visibleSources.netIncome ? 'line-through' : ''}`}>
              After-Tax Income
            </span>
          </button>
        </div>
      </div>

      {/* Milestone Legend */}
      {milestones.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {milestones.map((milestone, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-green-500 border-2 ${isDarkMode ? 'border-gray-800' : 'border-white'}`} />
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
 * Custom tooltip for income composition chart
 */
interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  isDarkMode: boolean
  visibleSources: Record<string, boolean>
  sortedIncomeSources: Array<{
    key: string
    name: string
    dataKey: string
    color: string
    gradient: string
    total: number
  }>
}

function CustomTooltip({
  active,
  payload,
  isDarkMode,
  visibleSources,
  sortedIncomeSources
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload

  // Calculate total income from only visible sources (dynamic)
  const totalIncome = sortedIncomeSources.reduce((sum, source) => {
    if (visibleSources[source.key]) {
      return sum + (data[source.dataKey] || 0)
    }
    return sum
  }, 0)

  const tooltipBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const tooltipBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'

  return (
    <div className={`${tooltipBg} border ${tooltipBorder} rounded-lg shadow-lg p-3`}>
      <div className={`font-medium ${textPrimary} mb-2`}>Age {data.age}</div>
      <div className="space-y-1 text-sm">
        <div className={`font-semibold ${textPrimary} border-b ${tooltipBorder} pb-1`}>
          Gross: {formatCompactCurrency(totalIncome)}
        </div>

        {/* After-Tax Income (if visible) */}
        {visibleSources.netIncome && data.netIncome > 0 && (
          <div className="flex justify-between gap-4 text-green-600 font-semibold">
            <span>After-Tax:</span>
            <span>{formatCompactCurrency(data.netIncome)}</span>
          </div>
        )}

        {/* Dynamic iteration in reversed order (smallest to largest, matching chart visual order) */}
        {[...sortedIncomeSources].reverse().map(source => {
          const incomeAmount = data[source.dataKey] || 0
          const isVisible = visibleSources[source.key]

          if (!isVisible || incomeAmount <= 0) {
            return null
          }

          return (
            <div key={source.key} className="flex justify-between gap-4">
              <span className={textSecondary}>{source.name}:</span>
              <span className={`font-medium ${textPrimary}`}>
                {formatCompactCurrency(incomeAmount)}
              </span>
            </div>
          )
        })}
      </div>

      {data.milestone && (
        <div className="text-sm text-green-600 mt-1 font-medium">
          {data.milestone}
        </div>
      )}
    </div>
  )
}
