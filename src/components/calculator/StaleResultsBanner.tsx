'use client'

/**
 * Stale Results Banner
 *
 * Floating banner that appears when form inputs have changed since the last calculation.
 * Prompts user to recalculate with a prominent button.
 */

interface StaleResultsBannerProps {
  isVisible: boolean
  onRecalculate: () => void
  isCalculating?: boolean
  isDarkMode?: boolean
}

export function StaleResultsBanner({
  isVisible,
  onRecalculate,
  isCalculating = false,
  isDarkMode = false
}: StaleResultsBannerProps) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div
        className={`
          px-5 py-3 rounded-full shadow-lg flex items-center gap-3
          ${isDarkMode
            ? 'bg-orange-900/95 border border-orange-700/50 text-orange-100'
            : 'bg-orange-500 text-white'
          }
        `}
      >
        <span className="text-sm font-medium">
          Your inputs changed.
        </span>
        <button
          onClick={onRecalculate}
          disabled={isCalculating}
          className={`
            px-4 py-1.5 rounded-full font-semibold text-sm transition-all
            ${isCalculating ? 'opacity-60 cursor-not-allowed' : ''}
            ${isDarkMode
              ? 'bg-orange-700 hover:bg-orange-600 disabled:hover:bg-orange-700'
              : 'bg-white text-orange-600 hover:bg-orange-50 disabled:hover:bg-white'
            }
          `}
        >
          {isCalculating ? 'Calculating...' : 'Recalculate'}
        </button>
      </div>
    </div>
  )
}
