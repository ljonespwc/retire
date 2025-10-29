'use client'

/**
 * Mobile Help Banner
 *
 * Non-modal auto-showing banner that displays contextual help tips when users focus on form fields.
 * Only visible on mobile devices (hidden on desktop where sidebar is shown).
 *
 * Key features:
 * - No backdrop - form stays visible and editable
 * - Doesn't block scrolling
 * - Updates content as user moves between fields
 * - Smooth slide animations
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { HELP_TIPS, DEFAULT_TIP } from '@/lib/calculator/help-tips'

interface MobileHelpBannerProps {
  focusedField: string | null
  isDarkMode: boolean
  theme: any
  planningStarted: boolean
}

export function MobileHelpBanner({
  focusedField,
  isDarkMode,
  theme,
  planningStarted
}: MobileHelpBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Get current tip content
  const tip = focusedField && HELP_TIPS[focusedField] ? HELP_TIPS[focusedField] : DEFAULT_TIP

  // Auto-show logic with small delay to avoid flash on quick tab
  useEffect(() => {
    if (!planningStarted) {
      setIsVisible(false)
      return
    }

    if (focusedField === null) {
      setIsVisible(false)
      return
    }

    // User manually dismissed - don't show again until they focus a new field
    if (isDismissed) {
      setIsDismissed(false) // Reset for next field
    }

    // Small delay to avoid flashing on quick tab through fields
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 150)

    return () => clearTimeout(timer)
  }, [focusedField, planningStarted])

  // Handle user closing the banner
  const handleClose = () => {
    setIsVisible(false)
    setIsDismissed(true)
  }

  // Don't render on desktop (lg screens and up)
  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pointer-events-none">
      <div
        className={`pointer-events-auto ${theme.card} border-t-2 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        } rounded-t-3xl shadow-2xl transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{
          maxHeight: '50vh',
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tip.icon}</span>
            <h3 className={`text-lg font-bold ${theme.text.primary}`}>{tip.title}</h3>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
            aria-label="Close help"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(50vh - 73px)' }}>
          <div className="space-y-3 pb-4">
            {tip.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className={`${theme.text.secondary} text-base leading-relaxed`}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
