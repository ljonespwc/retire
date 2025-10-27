'use client'

/**
 * Merge Anonymous Scenarios Modal
 *
 * Appears when user logs in from a new device that has anonymous scenarios.
 * Prompts user to choose between:
 * - "Keep both" (merge anonymous scenarios into account)
 * - "Replace with my account" (discard anonymous work, load account data)
 */

import { useState } from 'react'
import { X, Folder, FolderOpen, AlertCircle } from 'lucide-react'
import { mergeAnonymousScenarios, deleteAnonymousScenarios } from '@/lib/scenarios/merge-helper'

interface MergeAnonymousScenariosModalProps {
  isOpen: boolean
  onClose: () => void
  anonymousUserId: string
  authenticatedUserId: string
  anonymousScenarioCount: number
  onMergeComplete: () => void
  isDarkMode?: boolean
}

export function MergeAnonymousScenariosModal({
  isOpen,
  onClose,
  anonymousUserId,
  authenticatedUserId,
  anonymousScenarioCount,
  onMergeComplete,
  isDarkMode = false,
}: MergeAnonymousScenariosModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  // Theme-aware colors
  const overlayBg = 'bg-black/50'
  const modalBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const modalBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const cardBg = isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
  const cardBorder = isDarkMode ? 'border-gray-600' : 'border-gray-200'
  const buttonPrimary = isDarkMode
    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
    : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'
  const buttonSecondary = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  const buttonDestructive = isDarkMode
    ? 'bg-red-700 hover:bg-red-800 text-white'
    : 'bg-red-600 hover:bg-red-700 text-white'

  const handleKeepBoth = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await mergeAnonymousScenarios(anonymousUserId, authenticatedUserId)

      if (result.success) {
        console.log('✅ Scenarios merged successfully')
        onMergeComplete()
        onClose()
      } else {
        setError(result.error || 'Failed to merge scenarios')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Merge error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReplaceWithAccount = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await deleteAnonymousScenarios(anonymousUserId)

      if (result.success) {
        console.log('✅ Anonymous scenarios deleted successfully')
        onMergeComplete()
        onClose()
      } else {
        setError(result.error || 'Failed to delete scenarios')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Delete error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm`}>
      <div className={`${modalBg} border ${modalBorder} rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <h3 className={`text-2xl font-bold ${textPrimary}`}>Scenarios Found</h3>
          </div>
          <button
            onClick={handleCancel}
            disabled={loading}
            className={`p-2 rounded-lg ${buttonSecondary} transition-colors disabled:opacity-50`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className={`${textSecondary} mb-6`}>
          <p className="mb-2">
            This device has <strong>{anonymousScenarioCount}</strong> unsaved retirement {anonymousScenarioCount === 1 ? 'plan' : 'plans'}.
          </p>
          <p>
            Would you like to keep them or replace them with your account's saved plans?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {/* Keep Both */}
          <button
            onClick={handleKeepBoth}
            disabled={loading}
            className={`w-full p-4 border ${cardBorder} rounded-lg ${cardBg} hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left`}
          >
            <div className="flex items-start gap-3">
              <FolderOpen className={`w-5 h-5 mt-0.5 ${textPrimary}`} />
              <div>
                <div className={`font-semibold ${textPrimary} mb-1`}>
                  Keep Both
                </div>
                <div className={`text-sm ${textSecondary}`}>
                  Merge this device's plans with your account. All scenarios will be preserved.
                </div>
              </div>
            </div>
          </button>

          {/* Replace */}
          <button
            onClick={handleReplaceWithAccount}
            disabled={loading}
            className={`w-full p-4 border ${cardBorder} rounded-lg ${cardBg} hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left`}
          >
            <div className="flex items-start gap-3">
              <Folder className={`w-5 h-5 mt-0.5 ${textPrimary}`} />
              <div>
                <div className={`font-semibold ${textPrimary} mb-1`}>
                  Replace with My Account
                </div>
                <div className={`text-sm ${textSecondary}`}>
                  Discard this device's plans and load only your account's scenarios.
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          disabled={loading}
          className={`w-full px-6 py-3 ${buttonSecondary} rounded-lg font-medium transition-all disabled:opacity-50`}
        >
          {loading ? 'Processing...' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
