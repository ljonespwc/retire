'use client'

/**
 * Recalculate Confirmation Modal
 *
 * Warns users when recalculating will clear their active variant scenario.
 * Prevents confusion from stale variant data after baseline changes.
 */

import { X, AlertCircle } from 'lucide-react'

interface RecalculateConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  variantName: string
  isDarkMode?: boolean
}

export function RecalculateConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  variantName,
  isDarkMode = false
}: RecalculateConfirmModalProps) {
  // Early return if modal is closed
  if (!isOpen) return null

  // Theme-aware colors (matching existing modal patterns)
  const overlayBg = 'bg-black/50'
  const modalBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const modalBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'

  // Button styles
  const buttonPrimary = isDarkMode
    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
    : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'

  const buttonSecondary = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'

  // Warning box colors
  const warningBg = isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50'
  const warningBorder = isDarkMode ? 'border-orange-700' : 'border-orange-200'
  const warningText = isDarkMode ? 'text-orange-300' : 'text-orange-700'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm`}
      onClick={onClose}
    >
      <div
        className={`${modalBg} border ${modalBorder} rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔄</div>
            <h3 className={`text-2xl font-bold ${textPrimary}`}>
              Recalculate Your Plan?
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${buttonSecondary} transition-colors`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4">
          <p className={`${textSecondary} leading-relaxed`}>
            You have a what-if scenario open. Recalculating will update your baseline plan and clear the variant comparison.
          </p>

          <p className={`${textSecondary} leading-relaxed`}>
            You can re-run the what-if scenario after the new calculation completes.
          </p>

          {/* Warning Box */}
          <div className={`${warningBg} border ${warningBorder} rounded-lg p-4`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`w-5 h-5 ${warningText} flex-shrink-0 mt-0.5`} />
              <p className={`text-sm ${warningText}`}>
                Your <strong>"{variantName}"</strong> scenario will be cleared.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 px-6 py-3 ${buttonSecondary} rounded-lg font-medium transition-all`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 ${buttonPrimary} text-white rounded-lg font-medium transition-all shadow-lg`}
          >
            Recalculate
          </button>
        </div>
      </div>
    </div>
  )
}
