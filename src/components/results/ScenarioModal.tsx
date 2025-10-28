'use client'

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
  isDarkMode?: boolean
  onRun: () => void
}

export function ScenarioModal({
  isOpen,
  onClose,
  scenarioType,
  baselineMonthly,
  retirementAge,
  isDarkMode = false,
  onRun
}: ScenarioModalProps) {
  if (!isOpen) return null

  const scenario = getScenarioConfig(scenarioType, baselineMonthly, retirementAge)

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
          {/* Description */}
          <div>
            <h3 className={`text-sm font-semibold ${textPrimary} mb-2`}>What This Does:</h3>
            <p className={`text-sm ${textSecondary}`}>
              {scenario.description}
            </p>
          </div>

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

          {/* Quick Estimate */}
          <div className={`${estimateBg} border ${estimateBorder} rounded-lg p-4`}>
            <h3 className={`text-sm font-semibold ${textPrimary} mb-2`}>Quick Estimate:</h3>
            <div className="space-y-1">
              {scenario.estimates.map((estimate, index) => (
                <div key={index} className={`text-sm ${textSecondary}`}>
                  {estimate}
                </div>
              ))}
            </div>
          </div>
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
            onClick={() => {
              onRun()
              onClose()
            }}
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
  retirementAge: number
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
      return {
        icon: '🏛️',
        title: 'Leave a Legacy',
        subtitle: 'Preserve 25% for heirs',
        description:
          'Constrain your withdrawals to preserve 25% of your starting portfolio for estate planning. Shows the spending trade-off required.',
        parametersTitle: null,
        parameters: null,
        estimates: [
          `Preservation target: ~$${Math.round((baselineAnnual * 25) / 1000)}K`,
          'Required spending adjustment: TBD'
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
      return {
        icon: '🚀',
        title: 'Retire Earlier',
        subtitle: 'What if you retired 3 years early?',
        description:
          `Explore retiring at age ${retirementAge - 3} instead of ${retirementAge}. Shows the portfolio impact of starting retirement earlier.`,
        parametersTitle: null,
        parameters: null,
        estimates: [
          '+3 extra years of retirement',
          'Portfolio depletes ~6 years earlier'
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
