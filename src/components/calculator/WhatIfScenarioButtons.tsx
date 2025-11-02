/**
 * WhatIfScenarioButtons Component
 *
 * Displays clickable buttons for creating scenario variants.
 * Shows loading states, active states, and disabled states based on variant status.
 */

import { Heart } from 'lucide-react'
import { Scenario } from '@/types/calculator'
import { type VariantMetadata } from '@/lib/scenarios/variant-metadata'

interface WhatIfScenarioButtonsProps {
  isDarkMode: boolean
  theme: any
  loadedVariantMetadata: VariantMetadata | null
  variantScenarios: Scenario[]
  generatingVariantType: 'front_load' | 'delay_benefits' | 'exhaust' | 'retire_early' | 'legacy' | null
  onScenarioClick: (type: 'front_load' | 'delay_benefits' | 'exhaust' | 'retire_early' | 'legacy') => void
}

export function WhatIfScenarioButtons({
  isDarkMode,
  theme,
  loadedVariantMetadata,
  variantScenarios,
  generatingVariantType,
  onScenarioClick
}: WhatIfScenarioButtonsProps) {
  return (
    <div className={`${theme.card} rounded-lg border-2 ${isDarkMode ? 'border-blue-500/30 shadow-xl shadow-blue-500/10' : 'border-orange-300 shadow-xl shadow-orange-500/10'} p-6 max-w-7xl mx-auto`}>
      <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4 text-center`}>
        Try What-If Scenarios
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          onClick={() => onScenarioClick('front_load')}
          disabled={!!loadedVariantMetadata || variantScenarios.some(v => v.name === 'Front-Load the Fun')}
          className={`text-left p-4 rounded-lg border transition-colors ${
            loadedVariantMetadata || variantScenarios.some(v => v.name === 'Front-Load the Fun')
              ? isDarkMode ? 'border-gray-600 bg-gray-700/50 opacity-60 cursor-not-allowed' : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
              : generatingVariantType === 'front_load'
              ? isDarkMode ? 'border-blue-500 bg-blue-900/30 animate-pulse' : 'border-orange-400 bg-orange-100/50 animate-pulse'
              : isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            {generatingVariantType === 'front_load' ? (
              <Heart className="w-6 h-6 text-rose-500 animate-pulse mt-0.5" fill="currentColor" />
            ) : (
              <span className="text-2xl">🎯</span>
            )}
            <div className="flex-1">
              <div className={`font-semibold ${theme.text.primary} mb-1`}>
                Front-Load the Fun
              </div>
              <p className={`text-sm ${theme.text.secondary}`}>
                {generatingVariantType === 'front_load'
                  ? 'Generating scenario...'
                  : 'Spend more early, scale back later'}
              </p>
            </div>
            {variantScenarios.some(v => v.name === 'Front-Load the Fun') && !generatingVariantType && (
              <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-orange-600'} font-medium`}>Active</span>
            )}
          </div>
        </button>

        <button
          onClick={() => onScenarioClick('delay_benefits')}
          disabled={!!loadedVariantMetadata || variantScenarios.some(v => v.name === 'Delay CPP/OAS to 70')}
          className={`text-left p-4 rounded-lg border transition-colors ${
            loadedVariantMetadata || variantScenarios.some(v => v.name === 'Delay CPP/OAS to 70')
              ? isDarkMode ? 'border-gray-600 bg-gray-700/50 opacity-60 cursor-not-allowed' : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
              : generatingVariantType === 'delay_benefits'
              ? isDarkMode ? 'border-blue-500 bg-blue-900/30 animate-pulse' : 'border-orange-400 bg-orange-100/50 animate-pulse'
              : isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            {generatingVariantType === 'delay_benefits' ? (
              <Heart className="w-6 h-6 text-rose-500 animate-pulse mt-0.5" fill="currentColor" />
            ) : (
              <span className="text-2xl">⏰</span>
            )}
            <div className="flex-1">
              <div className={`font-semibold ${theme.text.primary} mb-1`}>
                Delay CPP/OAS to 70
              </div>
              <p className={`text-sm ${theme.text.secondary}`}>
                {generatingVariantType === 'delay_benefits'
                  ? 'Generating scenario...'
                  : 'Maximize government benefits'}
              </p>
            </div>
            {variantScenarios.some(v => v.name === 'Delay CPP/OAS to 70') && !generatingVariantType && (
              <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-orange-600'} font-medium`}>Active</span>
            )}
          </div>
        </button>

        <button
          onClick={() => onScenarioClick('exhaust')}
          disabled={!!loadedVariantMetadata || variantScenarios.some(v => v.name === 'Exhaust Your Portfolio')}
          className={`text-left p-4 rounded-lg border transition-colors ${
            loadedVariantMetadata || variantScenarios.some(v => v.name === 'Exhaust Your Portfolio')
              ? isDarkMode ? 'border-gray-600 bg-gray-700/50 opacity-60 cursor-not-allowed' : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
              : generatingVariantType === 'exhaust'
              ? isDarkMode ? 'border-blue-500 bg-blue-900/30 animate-pulse' : 'border-orange-400 bg-orange-100/50 animate-pulse'
              : isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            {generatingVariantType === 'exhaust' ? (
              <Heart className="w-6 h-6 text-rose-500 animate-pulse mt-0.5" fill="currentColor" />
            ) : (
              <span className="text-2xl">💰</span>
            )}
            <div className="flex-1">
              <div className={`font-semibold ${theme.text.primary} mb-1`}>
                Exhaust Your Portfolio
              </div>
              <p className={`text-sm ${theme.text.secondary}`}>
                {generatingVariantType === 'exhaust'
                  ? 'Optimizing maximum spending...'
                  : 'Maximize your lifestyle'}
              </p>
            </div>
            {variantScenarios.some(v => v.name === 'Exhaust Your Portfolio') && !generatingVariantType && (
              <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-orange-600'} font-medium`}>Active</span>
            )}
          </div>
        </button>

        {/* Retire Earlier - NOW ENABLED */}
        <button
          onClick={() => onScenarioClick('retire_early')}
          disabled={!!loadedVariantMetadata || variantScenarios.some(v => v.name.includes('Retire') && v.name.includes('Earlier'))}
          className={`text-left p-4 rounded-lg border transition-colors ${
            loadedVariantMetadata || variantScenarios.some(v => v.name.includes('Retire') && v.name.includes('Earlier'))
              ? isDarkMode ? 'border-gray-600 bg-gray-700/50 opacity-60 cursor-not-allowed' : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
              : generatingVariantType === 'retire_early'
              ? isDarkMode ? 'border-blue-500 bg-blue-900/30 animate-pulse' : 'border-orange-400 bg-orange-100/50 animate-pulse'
              : isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            {generatingVariantType === 'retire_early' ? (
              <Heart className="w-6 h-6 text-rose-500 animate-pulse mt-0.5" fill="currentColor" />
            ) : (
              <span className="text-2xl">🚀</span>
            )}
            <div className="flex-1">
              <div className={`font-semibold ${theme.text.primary} mb-1`}>
                Retire Earlier
              </div>
              <p className={`text-sm ${theme.text.secondary}`}>
                {generatingVariantType === 'retire_early'
                  ? 'Generating scenario...'
                  : 'Test retiring 1-5 years sooner'}
              </p>
            </div>
            {variantScenarios.some(v => v.name.includes('Retire') && v.name.includes('Earlier')) && !generatingVariantType && (
              <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-orange-600'} font-medium`}>Active</span>
            )}
          </div>
        </button>

        {/* Leave a Legacy - NOW ENABLED */}
        <button
          onClick={() => onScenarioClick('legacy')}
          disabled={!!loadedVariantMetadata || variantScenarios.some(v => v.name.includes('Leave') && v.name.includes('Legacy'))}
          className={`text-left p-4 rounded-lg border transition-colors ${
            loadedVariantMetadata || variantScenarios.some(v => v.name.includes('Leave') && v.name.includes('Legacy'))
              ? isDarkMode ? 'border-gray-600 bg-gray-700/50 opacity-60 cursor-not-allowed' : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
              : generatingVariantType === 'legacy'
              ? isDarkMode ? 'border-blue-500 bg-blue-900/30 animate-pulse' : 'border-orange-400 bg-orange-100/50 animate-pulse'
              : isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            {generatingVariantType === 'legacy' ? (
              <Heart className="w-6 h-6 text-rose-500 animate-pulse mt-0.5" fill="currentColor" />
            ) : (
              <span className="text-2xl">🏛️</span>
            )}
            <div className="flex-1">
              <div className={`font-semibold ${theme.text.primary} mb-1`}>
                Leave a Legacy
              </div>
              <p className={`text-sm ${theme.text.secondary}`}>
                {generatingVariantType === 'legacy'
                  ? 'Generating scenario...'
                  : 'Preserve 10-50% for heirs'}
              </p>
            </div>
            {variantScenarios.some(v => v.name.includes('Leave') && v.name.includes('Legacy')) && !generatingVariantType && (
              <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-orange-600'} font-medium`}>Active</span>
            )}
          </div>
        </button>

        {/* Lump Sum Withdrawal - Disabled for now */}
        <button
          disabled
          className={`text-left p-4 rounded-lg border transition-colors ${
            isDarkMode ? 'border-gray-600 bg-gray-700/50 opacity-60 cursor-not-allowed' : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl opacity-50">💵</span>
            <div className="flex-1">
              <div className={`font-semibold ${theme.text.primary} mb-1`}>
                Lump Sum Withdrawal
              </div>
              <p className={`text-sm ${theme.text.secondary}`}>
                Test a one-time large withdrawal
              </p>
            </div>
            <span className={`text-xs ${theme.text.muted} font-medium`}>Coming Soon</span>
          </div>
        </button>
      </div>

      {/* Disabled message for saved variants */}
      {loadedVariantMetadata && (
        <p className={`text-sm text-center mt-4 ${theme.text.secondary}`}>
          ℹ️ Not available for previously saved what-if scenarios
        </p>
      )}
    </div>
  )
}
