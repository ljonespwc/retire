'use client'

import { useState } from 'react'

/**
 * Scenario Modal
 *
 * Interactive dialog that explains what-if scenarios,
 * shows quick estimates, and triggers scenario calculations.
 */

interface ScenarioModalProps {
  isOpen: boolean
  onClose: () => void
  scenarioType: 'front_load' | 'exhaust' | 'legacy' | 'delay_benefits' | 'retire_early'
  baselineMonthly: number
  retirementAge: number
  currentAge: number
  totalAssets?: number // Total starting portfolio for legacy calculations
  isDarkMode?: boolean
  onRun: (config?: any) => void // Config for parameterized scenarios
}

export function ScenarioModal({
  isOpen,
  onClose,
  scenarioType,
  baselineMonthly,
  retirementAge,
  currentAge,
  totalAssets = 0,
  isDarkMode = false,
  onRun
}: ScenarioModalProps) {
  // State for retire early age selection (default to 3 years earlier, but not before current age)
  const getDefaultRetireAge = () => Math.max(retirementAge - 3, currentAge)
  const [selectedRetireAge, setSelectedRetireAge] = useState(getDefaultRetireAge())

  // State for legacy percentage selection (default to 25%)
  const [selectedLegacyPercentage, setSelectedLegacyPercentage] = useState(25)

  // Reset state when modal opens (only on isOpen transition from false to true)
  const [previousIsOpen, setPreviousIsOpen] = useState(isOpen)

  if (isOpen !== previousIsOpen) {
    setPreviousIsOpen(isOpen)
    if (isOpen) {
      setSelectedRetireAge(getDefaultRetireAge())
      setSelectedLegacyPercentage(25)
    }
  }

  if (!isOpen) return null

  const scenario = getScenarioConfig(scenarioType, baselineMonthly, retirementAge, totalAssets, selectedRetireAge, selectedLegacyPercentage)

  // Handle run with config for retire_early and legacy
  const handleRun = () => {
    if (scenarioType === 'retire_early') {
      onRun({ newRetirementAge: selectedRetireAge })
    } else if (scenarioType === 'legacy') {
      onRun({ legacyPercentage: selectedLegacyPercentage / 100 }) // Convert to decimal
    } else {
      onRun()
    }
    onClose()
  }

  // Theme-aware colors
  const overlayBg = isDarkMode ? 'bg-black/60' : 'bg-black/40'
  const modalBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const modalBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const closeBtnHover = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
  const estimateBg = isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50'
  const estimateBorder = isDarkMode ? 'border-gray-600' : 'border-blue-200'

  // Handle ESC key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayBg}`}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      {/* Modal */}
      <div
        className={`${modalBg} border ${modalBorder} rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className={`flex items-start justify-between p-6 border-b ${modalBorder}`}>
          <div>
            <h2 id="modal-title" className={`text-xl font-semibold ${textPrimary}`}>
              {scenario.icon} {scenario.title}
            </h2>
            <p className={`text-sm ${textSecondary} mt-1`}>
              {scenario.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`${textSecondary} ${closeBtnHover} rounded-md p-1 transition-colors`}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Preview Note */}
          <div className={`text-xs ${textSecondary} italic px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            Preview shows typical values. Actual results calculated when you run scenario.
          </div>

          {/* Description */}
          <div>
            <h3 className={`text-sm font-semibold ${textPrimary} mb-2`}>What This Does:</h3>
            <p className={`text-sm ${textSecondary}`}>
              {scenario.description}
            </p>
          </div>

          {/* Retire Early Age Selector */}
          {scenarioType === 'retire_early' && (
            <div>
              <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                Test Retirement Age:
              </h3>
              <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4 space-y-3`}>
                <div className={`text-xs ${textSecondary} mb-2`}>
                  Your baseline retirement age: <span className={`font-semibold ${textPrimary}`}>Age {retirementAge}</span>
                </div>

                {/* Age Selection Radio Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[retirementAge - 5, retirementAge - 4, retirementAge - 3, retirementAge - 2, retirementAge - 1]
                    .filter(age => age >= currentAge) // Only show ages >= current age
                    .map((age) => (
                    <button
                      key={age}
                      onClick={() => setSelectedRetireAge(age)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        selectedRetireAge === age
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Age {age}
                      <div className={`text-xs mt-0.5 ${selectedRetireAge === age ? 'text-blue-100' : textSecondary}`}>
                        {retirementAge - age} yr{retirementAge - age > 1 ? 's' : ''} earlier
                      </div>
                    </button>
                  ))}
                </div>

                {/* Quick Impact Preview */}
                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className={`text-xs ${textSecondary} space-y-1`}>
                    <div>• Retire {retirementAge - selectedRetireAge} year{retirementAge - selectedRetireAge > 1 ? 's' : ''} earlier (age {selectedRetireAge})</div>
                    <div>• Gain: {retirementAge - selectedRetireAge} extra year{retirementAge - selectedRetireAge > 1 ? 's' : ''} of freedom</div>
                    <div>• Portfolio may deplete ~{(retirementAge - selectedRetireAge) * 2} years sooner</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legacy Percentage Selector */}
          {scenarioType === 'legacy' && (
            <div>
              <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                Legacy Preservation Amount:
              </h3>
              <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4 space-y-3`}>
                <div className={`text-xs ${textSecondary} mb-2`}>
                  Starting Portfolio: <span className={`font-semibold ${textPrimary}`}>
                    {totalAssets >= 1_000_000 ? `$${(totalAssets / 1_000_000).toFixed(1)}M` : `$${Math.round(totalAssets / 1000)}K`}
                  </span>
                </div>

                {/* Percentage Selection Radio Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50].map((pct) => {
                    const targetAmount = totalAssets * (pct / 100)
                    const targetFormatted = targetAmount >= 1_000_000
                      ? `$${(targetAmount / 1_000_000).toFixed(1)}M`
                      : `$${Math.round(targetAmount / 1000)}K`

                    return (
                      <button
                        key={pct}
                        onClick={() => setSelectedLegacyPercentage(pct)}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          selectedLegacyPercentage === pct
                            ? isDarkMode
                              ? 'bg-blue-600 text-white border-2 border-blue-500'
                              : 'bg-blue-600 text-white border-2 border-blue-500'
                            : isDarkMode
                            ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pct}%
                        <div className={`text-xs mt-0.5 ${selectedLegacyPercentage === pct ? 'text-blue-100' : textSecondary}`}>
                          {targetFormatted}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Quick Impact Preview */}
                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className={`text-xs ${textSecondary} space-y-1`}>
                    <div>• Preserve {selectedLegacyPercentage}% of portfolio ({
                      totalAssets * (selectedLegacyPercentage / 100) >= 1_000_000
                        ? `$${((totalAssets * selectedLegacyPercentage / 100) / 1_000_000).toFixed(1)}M`
                        : `$${Math.round((totalAssets * selectedLegacyPercentage / 100) / 1000)}K`
                    }) for heirs</div>
                    <div>• Portfolio will never drop below this target</div>
                    <div>• May require reduced monthly spending</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Parameters */}
          {scenario.parameters && (
            <div>
              <h3 className={`text-sm font-semibold ${textPrimary} mb-2`}>
                {scenario.parametersTitle}:
              </h3>
              <ul className="space-y-2">
                {scenario.parameters.map((param, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className={`${textPrimary} mt-0.5`}>•</span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${textPrimary}`}>
                        {param.label}
                      </div>
                      {param.detail && (
                        <div className={`text-xs ${textSecondary} mt-0.5`}>
                          {param.detail}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${modalBorder}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium ${textSecondary} ${closeBtnHover} rounded-md transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Run Scenario
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Scenario configuration and quick estimates
 */
function getScenarioConfig(
  type: string,
  baselineMonthly: number,
  retirementAge: number,
  totalAssets: number,
  selectedRetireAge?: number,
  selectedLegacyPercentage?: number
) {
  const baselineAnnual = baselineMonthly * 12

  switch (type) {
    case 'front_load':
      const goGoYears = 10 // Ages 65-75 (adjust if retirement age differs)
      const extraPerYear = baselineAnnual * 0.30
      const totalExtraGoGo = extraPerYear * goGoYears

      return {
        icon: '🎯',
        title: 'Front-Load the Fun',
        subtitle: 'Spend more early, scale back later',
        description:
          'Model the "go-go, slow-go, no-go" phases of retirement by adjusting your spending based on age and activity level.',
        parametersTitle: 'Spending Adjustments',
        parameters: [
          {
            label: `Ages ${retirementAge}-${retirementAge + 10} (Go-Go): +30%`,
            detail: 'Travel, hobbies, active lifestyle'
          },
          {
            label: `Ages ${retirementAge + 10}-${retirementAge + 20} (Slow-Go): -15%`,
            detail: 'Reduced activity, more home-based'
          },
          {
            label: `Ages ${retirementAge + 20}+ (No-Go): -25%`,
            detail: 'Minimal travel, healthcare focus'
          }
        ],
        estimates: [
          `Extra spending in go-go years: ~$${Math.round(totalExtraGoGo / 1000)}K`,
          'Portfolio impact: Depletes ~2 years earlier'
        ]
      }

    case 'exhaust':
      return {
        icon: '💰',
        title: 'Exhaust Your Portfolio',
        subtitle: 'Maximize lifestyle - use every dollar',
        description:
          'Find the maximum monthly spending that uses your entire portfolio by your longevity age. This optimization takes ~1 second to calculate.',
        parametersTitle: null,
        parameters: null,
        estimates: [
          'Searching for optimal spending level...',
          'Will show exact amount after calculation'
        ]
      }

    case 'legacy':
      const percentage = selectedLegacyPercentage || 25
      const legacyTarget = totalAssets * (percentage / 100)
      const legacyTargetFormatted = legacyTarget >= 1_000_000
        ? `$${(legacyTarget / 1_000_000).toFixed(1)}M`
        : `$${Math.round(legacyTarget / 1000)}K`

      return {
        icon: '🏛️',
        title: 'Leave a Legacy',
        subtitle: `Preserve ${percentage}% for heirs`,
        description:
          `Constrain your withdrawals to preserve ${percentage}% of your starting portfolio for estate planning. Shows the spending trade-off required to leave ${legacyTargetFormatted} to your heirs.`,
        parametersTitle: 'Legacy Settings',
        parameters: [
          {
            label: `Starting Portfolio: ${totalAssets >= 1_000_000 ? `$${(totalAssets / 1_000_000).toFixed(1)}M` : `$${Math.round(totalAssets / 1000)}K`}`,
            detail: 'Total across all accounts (RRSP, TFSA, Non-Registered)'
          },
          {
            label: `Preservation Target: ${legacyTargetFormatted} (${percentage}%)`,
            detail: 'Amount preserved for heirs at longevity age'
          }
        ],
        estimates: [
          'Required spending adjustment: TBD (run to calculate)',
          'Portfolio will never drop below legacy target'
        ]
      }

    case 'delay_benefits':
      return {
        icon: '⏰',
        title: 'Delay CPP/OAS',
        subtitle: 'Start government benefits at 70 instead of 65',
        description:
          'Compare starting CPP and OAS at age 70 vs 65. CPP increases 42% and OAS increases 36% with delay, but requires 5 years of portfolio withdrawals.',
        parametersTitle: 'Benefit Increases',
        parameters: [
          {
            label: 'CPP at 70: +42% vs age 65',
            detail: '~$22K/year instead of $15.5K'
          },
          {
            label: 'OAS at 70: +36% vs age 65',
            detail: '~$12K/year instead of $8.8K'
          }
        ],
        estimates: [
          'Lifetime income gain: ~$127K (to age 95)',
          'Requires: $250K extra portfolio at 65'
        ]
      }

    case 'retire_early':
      const newRetireAge = selectedRetireAge || retirementAge - 3
      const yearsEarlier = retirementAge - newRetireAge
      return {
        icon: '🚀',
        title: 'Retire Earlier',
        subtitle: `What if you retired ${yearsEarlier} year${yearsEarlier > 1 ? 's' : ''} early?`,
        description:
          `Explore retiring at age ${newRetireAge} instead of ${retirementAge}. Shows the portfolio impact of starting retirement earlier.`,
        parametersTitle: null,
        parameters: null,
        estimates: [
          `+${yearsEarlier} extra year${yearsEarlier > 1 ? 's' : ''} of retirement`,
          `Portfolio depletes ~${yearsEarlier * 2} years earlier`
        ]
      }

    default:
      return {
        icon: '🚧',
        title: 'Under Construction',
        subtitle: 'Coming soon',
        description: 'This scenario is currently being built. Check back soon!',
        parametersTitle: null,
        parameters: null,
        estimates: ['Feature in development']
      }
  }
}
