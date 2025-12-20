/**
 * WhatIfScenarioButtons Component
 *
 * Displays clickable buttons for creating scenario variants.
 * Shows loading states, active states, and disabled states based on variant status.
 *
 * Button states:
 * - Variant exists (tab open): disabled + "Active" badge
 * - No variant: enabled (clicking generates new)
 */

import { Heart } from 'lucide-react'
import { Scenario } from '@/types/calculator'
import { type VariantMetadata } from '@/lib/scenarios/variant-metadata'

type VariantTypeKey = 'front_load' | 'delay_benefits' | 'exhaust' | 'retire_early' | 'legacy' | 'lump_sum' | 'longevity' | 'part_time_work' | 'market_crash'

interface WhatIfScenarioButtonsProps {
  isDarkMode: boolean
  theme: any
  loadedVariantMetadata: VariantMetadata | null
  variantScenarios: Scenario[]
  generatingVariantType: VariantTypeKey | null
  onScenarioClick: (type: VariantTypeKey) => void
}

// Helper to check if a tab is currently open for a variant type
function isTabOpen(variantScenarios: Scenario[], type: VariantTypeKey): boolean {
  const namePatterns: Record<VariantTypeKey, (name: string) => boolean> = {
    'front_load': (name) => name.includes('Front-Load'),
    'delay_benefits': (name) => name.includes('Delay CPP/OAS'),
    'exhaust': (name) => name.includes('Exhaust'),
    'retire_early': (name) => name.includes('Retire') && name.includes('Earlier'),
    'legacy': (name) => name.includes('Leave') && name.includes('Legacy'),
    'lump_sum': (name) => name.includes('Lump Sum'),
    'longevity': (name) => name.includes('Live to'),
    'part_time_work': (name) => name.includes('Part-Time'),
    'market_crash': (name) => name.includes('Markets Crash') || name.includes('Crash')
  }
  return variantScenarios.some(v => namePatterns[type](v.name))
}

export function WhatIfScenarioButtons({
  isDarkMode,
  theme,
  loadedVariantMetadata,
  variantScenarios,
  generatingVariantType,
  onScenarioClick
}: WhatIfScenarioButtonsProps) {

  // Helper to get button state for a variant type
  const getButtonState = (type: VariantTypeKey) => {
    const isActive = isTabOpen(variantScenarios, type)
    // Disabled if: variant metadata loaded OR variant already generated
    const isDisabled = !!loadedVariantMetadata || isActive
    const isGenerating = generatingVariantType === type

    return { isActive, isDisabled, isGenerating }
  }

  // Helper to get button className
  const getButtonClassName = (type: VariantTypeKey) => {
    const { isDisabled, isGenerating } = getButtonState(type)

    if (isDisabled) {
      return isDarkMode
        ? 'border-gray-600 bg-gray-700/50 opacity-60 cursor-not-allowed'
        : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
    }
    if (isGenerating) {
      return isDarkMode
        ? 'border-blue-500 bg-blue-900/30 animate-pulse'
        : 'border-orange-400 bg-orange-100/50 animate-pulse'
    }
    return isDarkMode
      ? 'border-gray-700 hover:bg-gray-700'
      : 'border-gray-200 hover:bg-gray-50'
  }

  // Variant button configuration
  const variants: Array<{
    type: VariantTypeKey
    emoji: string
    title: string
    description: string
    generatingText: string
  }> = [
    {
      type: 'front_load',
      emoji: '🎯',
      title: 'Front-Load the Fun',
      description: 'Spend more early, scale back later',
      generatingText: 'Generating scenario...'
    },
    {
      type: 'delay_benefits',
      emoji: '⏰',
      title: 'Delay CPP/OAS to 70',
      description: 'Maximize government benefits',
      generatingText: 'Generating scenario...'
    },
    {
      type: 'exhaust',
      emoji: '💰',
      title: 'Exhaust Your Portfolio',
      description: 'Maximize your lifestyle',
      generatingText: 'Optimizing maximum spending...'
    },
    {
      type: 'retire_early',
      emoji: '🚀',
      title: 'Retire Earlier',
      description: 'Test retiring 1-5 years sooner',
      generatingText: 'Generating scenario...'
    },
    {
      type: 'legacy',
      emoji: '🏛️',
      title: 'Leave a Legacy',
      description: 'Preserve 10-50% for heirs',
      generatingText: 'Generating scenario...'
    },
    {
      type: 'lump_sum',
      emoji: '💵',
      title: 'Lump Sum Withdrawal',
      description: 'Weddings, renovations, travel, gifts',
      generatingText: 'Generating scenario...'
    },
    {
      type: 'longevity',
      emoji: '💀',
      title: 'Live to 100',
      description: 'Test your plan for a long life',
      generatingText: 'Extending projections...'
    },
    {
      type: 'part_time_work',
      emoji: '💼',
      title: 'Work Part-Time',
      description: 'Earn income after retiring',
      generatingText: 'Calculating impact...'
    },
    {
      type: 'market_crash',
      emoji: '📉',
      title: 'Markets Crash',
      description: 'Stress test a major downturn',
      generatingText: 'Running crash scenario...'
    }
  ]

  return (
    <div className={`${theme.card} rounded-lg border-2 ${isDarkMode ? 'border-blue-500/30 shadow-xl shadow-blue-500/10' : 'border-orange-300 shadow-xl shadow-orange-500/10'} p-6 max-w-7xl mx-auto`}>
      <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4 text-center`}>
        Try What-If Scenarios
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {variants.map((variant) => {
          const state = getButtonState(variant.type)

          return (
            <button
              key={variant.type}
              onClick={() => onScenarioClick(variant.type)}
              disabled={state.isDisabled}
              className={`text-left p-4 rounded-lg border transition-colors ${getButtonClassName(variant.type)}`}
            >
              <div className="flex items-start gap-3">
                {state.isGenerating ? (
                  <Heart className="w-6 h-6 text-rose-500 animate-pulse mt-0.5" fill="currentColor" />
                ) : (
                  <span className="text-2xl">{variant.emoji}</span>
                )}
                <div className="flex-1">
                  <div className={`font-semibold ${theme.text.primary} mb-1`}>
                    {variant.title}
                  </div>
                  <p className={`text-sm ${theme.text.secondary}`}>
                    {state.isGenerating
                      ? variant.generatingText
                      : variant.description}
                  </p>
                </div>
                {state.isActive && !state.isGenerating && (
                  <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-orange-600'} font-medium`}>
                    Active
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Disabled message for saved variants */}
      {loadedVariantMetadata && (
        <p className={`text-sm text-center mt-4 ${theme.text.secondary}`}>
          ℹ️ Not available for previously saved what-if scenarios. Click "Create New Plan" to start a new scenario.
        </p>
      )}
    </div>
  )
}
