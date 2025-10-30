'use client'

/**
 * Variant Details Banner Component
 *
 * Displays detailed information about what makes a saved what-if variant
 * unique, including AI insights and specific changes (spending patterns,
 * benefit ages, etc.)
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { VariantMetadata, getVariantDetails } from '@/lib/scenarios/variant-metadata'
import { Scenario } from '@/types/calculator'

interface VariantDetailsBannerProps {
  variantMetadata: VariantMetadata
  scenario?: Scenario
  isDarkMode?: boolean
  isCollapsible?: boolean
}

export function VariantDetailsBanner({
  variantMetadata,
  scenario,
  isDarkMode = false,
  isCollapsible = true
}: VariantDetailsBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Get variant details
  const details = getVariantDetails(variantMetadata.variant_type, scenario)

  // Theme-aware colors
  const bannerBg = isDarkMode
    ? 'bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40'
    : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50'
  const bannerBorder = isDarkMode ? 'border-blue-700/50' : 'border-blue-200'
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500'
  const labelBg = isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
  const labelText = isDarkMode ? 'text-blue-300' : 'text-blue-800'
  const dividerColor = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const insightBg = isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'

  return (
    <div className={`${bannerBg} border-2 ${bannerBorder} rounded-2xl shadow-xl overflow-hidden`}>
      {/* Header */}
      <div
        className={`px-6 py-4 flex items-center justify-between ${isCollapsible ? 'cursor-pointer' : ''}`}
        onClick={() => isCollapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Info className={`w-6 h-6 ${labelText}`} />
          <div>
            <h3 className={`text-lg font-bold ${textPrimary}`}>
              What-If Scenario Details
            </h3>
            <p className={`text-sm ${textMuted} mt-0.5`}>
              {details.title}
            </p>
          </div>
        </div>

        {isCollapsible && (
          <button
            className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${textSecondary}`}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* AI Insight Section */}
          {variantMetadata.ai_insight && (
            <div className={`${insightBg} rounded-lg p-4 border ${dividerColor}`}>
              <div className={`flex items-center gap-2 mb-2`}>
                <span className="text-xl">💡</span>
                <h4 className={`text-sm font-bold ${textPrimary}`}>Key Insight</h4>
              </div>
              <p className={`text-sm ${textSecondary} leading-relaxed`}>
                {variantMetadata.ai_insight}
              </p>
            </div>
          )}

          {/* Divider */}
          {variantMetadata.ai_insight && details.items.length > 0 && (
            <div className={`border-t ${dividerColor}`} />
          )}

          {/* Detailed Breakdown */}
          {details.items.length > 0 && (
            <div>
              <h4 className={`text-sm font-bold ${textPrimary} mb-3`}>
                What's Different:
              </h4>
              <div className="space-y-2">
                {details.items.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-start justify-between gap-4 py-2 ${
                      index < details.items.length - 1 ? `border-b ${dividerColor}` : ''
                    }`}
                  >
                    <span className={`text-sm ${textSecondary} font-medium flex-1`}>
                      {item.label}
                    </span>
                    <span className={`text-sm ${textPrimary} font-bold text-right`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Footer */}
          {variantMetadata.created_at && (
            <>
              <div className={`border-t ${dividerColor} pt-3`} />
              <div className={`flex items-center justify-between text-xs ${textMuted}`}>
                <span>
                  Variant created: {new Date(variantMetadata.created_at).toLocaleDateString()}
                </span>
                {variantMetadata.created_from_baseline_id && (
                  <span className={`${labelBg} ${labelText} px-2 py-1 rounded-full font-medium`}>
                    Derived from baseline
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
