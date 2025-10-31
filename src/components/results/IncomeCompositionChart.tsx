'use client'

/**
 * Income Composition Chart
 *
 * Shows breakdown of retirement income sources over time,
 * stacked to show total income composition.
 */

import { useState } from 'react'
import { CalculationResults } from '@/types/calculator'
import { formatIncomeData, formatCompactCurrency } from '@/lib/calculations/results-formatter'
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
    other: true
  })

  // Find milestones for markers
  const milestones = data.filter(d => d.milestone)

  // Income source colors (matching brand palette)
  const colors = {
    rrsp: '#f97316',      // Orange for RRSP
    tfsa: '#3b82f6',      // Blue for TFSA
    nonRegistered: '#a855f7', // Purple for Non-Registered
    cpp: '#10b981',       // Green for CPP
    oas: '#8b5cf6',       // Purple for OAS
    other: '#f59e0b'      // Amber for pension & other (combined)
  }

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
      <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
        Income Sources Over Time
      </h3>

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

            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} visibleSources={visibleSources} />} />

            {/* Stack areas from bottom to top - conditionally rendered based on visibility */}
            {visibleSources.rrsp && (
              <Area
                type="monotone"
                dataKey="rrspIncome"
                stackId="1"
                stroke={colors.rrsp}
                fill="url(#rrspGradient)"
                name="RRSP/RRIF"
              />
            )}
            {visibleSources.tfsa && (
              <Area
                type="monotone"
                dataKey="tfsaIncome"
                stackId="1"
                stroke={colors.tfsa}
                fill="url(#tfsaGradient)"
                name="TFSA"
              />
            )}
            {visibleSources.nonRegistered && (
              <Area
                type="monotone"
                dataKey="nonRegisteredIncome"
                stackId="1"
                stroke={colors.nonRegistered}
                fill="url(#nonRegisteredGradient)"
                name="Non-Registered"
              />
            )}
            {visibleSources.cpp && (
              <Area
                type="monotone"
                dataKey="cppIncome"
                stackId="1"
                stroke={colors.cpp}
                fill="url(#cppGradient)"
                name="CPP"
              />
            )}
            {visibleSources.oas && (
              <Area
                type="monotone"
                dataKey="oasIncome"
                stackId="1"
                stroke={colors.oas}
                fill="url(#oasGradient)"
                name="OAS"
              />
            )}
            {visibleSources.other && (
              <Area
                type="monotone"
                dataKey="otherIncome"
                stackId="1"
                stroke={colors.other}
                fill="url(#otherGradient)"
                name="Pension & Other"
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
          {[
            { key: 'rrsp', name: 'RRSP/RRIF', color: colors.rrsp },
            { key: 'tfsa', name: 'TFSA', color: colors.tfsa },
            { key: 'nonRegistered', name: 'Non-Registered', color: colors.nonRegistered },
            { key: 'cpp', name: 'CPP', color: colors.cpp },
            { key: 'oas', name: 'OAS', color: colors.oas },
            { key: 'other', name: 'Pension & Other', color: colors.other }
          ].map(source => (
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
function CustomTooltip({ active, payload, isDarkMode, visibleSources }: any) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload

  // Calculate total income from only visible sources
  let totalIncome = 0
  if (visibleSources.rrsp) totalIncome += data.rrspIncome
  if (visibleSources.tfsa) totalIncome += data.tfsaIncome
  if (visibleSources.nonRegistered) totalIncome += data.nonRegisteredIncome
  if (visibleSources.cpp) totalIncome += data.cppIncome
  if (visibleSources.oas) totalIncome += data.oasIncome
  if (visibleSources.other) totalIncome += data.otherIncome

  const tooltipBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const tooltipBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'

  return (
    <div className={`${tooltipBg} border ${tooltipBorder} rounded-lg shadow-lg p-3`}>
      <div className={`font-medium ${textPrimary} mb-2`}>Age {data.age}</div>
      <div className="space-y-1 text-sm">
        <div className={`font-semibold ${textPrimary} border-b ${tooltipBorder} pb-1`}>
          Total: {formatCompactCurrency(totalIncome)}
        </div>
        {visibleSources.rrsp && data.rrspIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className={textSecondary}>RRSP/RRIF:</span>
            <span className={`font-medium ${textPrimary}`}>{formatCompactCurrency(data.rrspIncome)}</span>
          </div>
        )}
        {visibleSources.tfsa && data.tfsaIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className={textSecondary}>TFSA:</span>
            <span className={`font-medium ${textPrimary}`}>{formatCompactCurrency(data.tfsaIncome)}</span>
          </div>
        )}
        {visibleSources.nonRegistered && data.nonRegisteredIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className={textSecondary}>Non-Registered:</span>
            <span className={`font-medium ${textPrimary}`}>{formatCompactCurrency(data.nonRegisteredIncome)}</span>
          </div>
        )}
        {visibleSources.cpp && data.cppIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className={textSecondary}>CPP:</span>
            <span className={`font-medium ${textPrimary}`}>{formatCompactCurrency(data.cppIncome)}</span>
          </div>
        )}
        {visibleSources.oas && data.oasIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className={textSecondary}>OAS:</span>
            <span className={`font-medium ${textPrimary}`}>{formatCompactCurrency(data.oasIncome)}</span>
          </div>
        )}
        {visibleSources.other && data.otherIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className={textSecondary}>Pension & Other:</span>
            <span className={`font-medium ${textPrimary}`}>{formatCompactCurrency(data.otherIncome)}</span>
          </div>
        )}
      </div>
      {data.milestone && (
        <div className="text-sm text-green-600 mt-1 font-medium">
          {data.milestone}
        </div>
      )}
    </div>
  )
}
