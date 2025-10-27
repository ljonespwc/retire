'use client'

/**
 * Scenario Generator Buttons
 *
 * "What-If" quick explorer buttons for instant scenario comparison.
 * Currently displays coming soon modal when clicked.
 */

import { useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  Mountain,
  Wallet,
  Gift,
  TrendingDown,
  Clock,
  Target
} from 'lucide-react'

interface ScenarioGeneratorButtonsProps {
  isDarkMode?: boolean
}

interface ScenarioButton {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  emoji: string
}

export function ScenarioGeneratorButtons({ isDarkMode = false }: ScenarioGeneratorButtonsProps) {
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<string>('')

  // Theme configuration
  const theme = {
    card: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: {
      primary: isDarkMode ? 'text-gray-100' : 'text-gray-900',
      secondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
      muted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    },
    button: isDarkMode
      ? 'bg-gray-700/50 hover:bg-gray-600/50 border-gray-600 hover:border-gray-500'
      : 'bg-gradient-to-br from-white to-orange-50/30 hover:from-orange-50 hover:to-rose-50/30 border-gray-200 hover:border-orange-300',
    iconBg: isDarkMode ? 'bg-gray-600' : 'bg-gradient-to-br from-orange-100 to-rose-100',
  }

  const scenarios: ScenarioButton[] = [
    {
      id: 'retire-early',
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Retire 3 Years Earlier',
      description: 'See if your portfolio can handle an early exit',
      emoji: '🎯'
    },
    {
      id: 'spend-more',
      icon: <DollarSign className="w-5 h-5" />,
      title: 'Spend 20% More',
      description: 'Live it up - but will your money last?',
      emoji: '💎'
    },
    {
      id: 'active-years',
      icon: <Mountain className="w-5 h-5" />,
      title: 'Front-Load the Fun',
      description: 'Spend more early (travel years), less later',
      emoji: '🏔️'
    },
    {
      id: 'max-rrsp',
      icon: <Wallet className="w-5 h-5" />,
      title: 'Max Out Your RRSP',
      description: 'Contribute the legal maximum and watch it grow',
      emoji: '💰'
    },
    {
      id: 'windfall',
      icon: <Gift className="w-5 h-5" />,
      title: 'Add $100K Windfall',
      description: 'Inheritance, bonus, or lottery - how much changes?',
      emoji: '🎁'
    },
    {
      id: 'save-more',
      icon: <TrendingDown className="w-5 h-5" />,
      title: 'Save 10% More',
      description: 'Small sacrifice now, big impact later',
      emoji: '📈'
    },
    {
      id: 'optimize-cpp',
      icon: <Clock className="w-5 h-5" />,
      title: 'Optimize CPP/OAS Timing',
      description: 'Should you start at 60, 65, or 70?',
      emoji: '⏰'
    },
    {
      id: 'leave-legacy',
      icon: <Target className="w-5 h-5" />,
      title: 'Leave a Legacy',
      description: 'Keep $500K intact for your kids',
      emoji: '🎯'
    }
  ]

  const handleButtonClick = (scenario: ScenarioButton) => {
    setSelectedScenario(scenario.title)
    setShowComingSoon(true)
  }

  return (
    <>
      <div className={`rounded-3xl border ${theme.card} shadow-xl p-6 sm:p-8`}>
        <div className="mb-6">
          <h2 className={`text-2xl sm:text-3xl font-bold ${theme.text.primary} mb-2`}>
            What If...?
          </h2>
          <p className={`${theme.text.secondary} text-sm sm:text-base`}>
            Explore different retirement scenarios with one click. See how small changes today impact your future.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handleButtonClick(scenario)}
              className={`group relative rounded-2xl border-2 p-4 text-left transition-all duration-200 ${theme.button} hover:shadow-lg hover:scale-105`}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${theme.iconBg} mb-3 transition-transform group-hover:scale-110`}>
                <span className="text-2xl">{scenario.emoji}</span>
              </div>

              {/* Title */}
              <h3 className={`font-bold text-base mb-1 ${theme.text.primary}`}>
                {scenario.title}
              </h3>

              {/* Description */}
              <p className={`text-xs ${theme.text.muted} leading-relaxed`}>
                {scenario.description}
              </p>

              {/* Hover indicator */}
              <div className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity`}>
                {scenario.icon}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <ComingSoonModal
          scenarioName={selectedScenario}
          onClose={() => setShowComingSoon(false)}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  )
}

interface ComingSoonModalProps {
  scenarioName: string
  onClose: () => void
  isDarkMode: boolean
}

function ComingSoonModal({ scenarioName, onClose, isDarkMode }: ComingSoonModalProps) {
  const theme = {
    overlay: 'bg-black/50 backdrop-blur-sm',
    modal: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: {
      primary: isDarkMode ? 'text-gray-100' : 'text-gray-900',
      secondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    },
    button: isDarkMode
      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
      : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600',
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.overlay}`}
      onClick={onClose}
    >
      <div
        className={`relative max-w-md w-full rounded-3xl border-2 ${theme.modal} shadow-2xl p-8 transform transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="mb-6 text-6xl">
            🚧
          </div>

          <h3 className={`text-2xl font-bold ${theme.text.primary} mb-3`}>
            Coming Soon
          </h3>

          <p className={`text-lg ${theme.text.secondary} mb-6`}>
            <span className="font-semibold">{scenarioName}</span>
          </p>

          <p className={`text-sm ${theme.text.secondary} mb-6`}>
            This feature is currently in development. Check back soon to explore this scenario.
          </p>

          <button
            onClick={onClose}
            className={`w-full ${theme.button} text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl`}
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  )
}
