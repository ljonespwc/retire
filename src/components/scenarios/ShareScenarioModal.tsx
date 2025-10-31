'use client'

/**
 * Share Scenario Modal
 *
 * Modal for enabling/disabling scenario sharing and copying share links.
 */

import { useState, useEffect } from 'react'
import { X, Share2, Copy, Check, ExternalLink, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { enableScenarioSharing, disableScenarioSharing } from '@/lib/supabase/queries'

interface ShareScenarioModalProps {
  isOpen: boolean
  onClose: () => void
  scenarioId: string
  scenarioName: string
  existingShareToken?: string | null
  isCurrentlyShared?: boolean
  isDarkMode?: boolean
  onSharingChange?: (shareToken: string | null, isShared: boolean) => void
}

export function ShareScenarioModal({
  isOpen,
  onClose,
  scenarioId,
  scenarioName,
  existingShareToken,
  isCurrentlyShared = false,
  isDarkMode = false,
  onSharingChange,
}: ShareScenarioModalProps) {
  const [shareToken, setShareToken] = useState<string | null>(existingShareToken || null)
  const [isShared, setIsShared] = useState(isCurrentlyShared)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShareToken(existingShareToken || null)
      setIsShared(isCurrentlyShared)
      setError(null)
      setCopied(false)
    }
  }, [isOpen, existingShareToken, isCurrentlyShared])

  if (!isOpen) return null

  // Theme-aware colors
  const overlayBg = 'bg-black/50'
  const modalBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const modalBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const linkBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
  const linkBorder = isDarkMode ? 'border-gray-600' : 'border-gray-300'
  const linkText = isDarkMode ? 'text-gray-200' : 'text-gray-700'
  const buttonPrimary = isDarkMode
    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
    : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'
  const buttonSecondary = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  const buttonDanger = isDarkMode
    ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700'
    : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-300'

  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : ''

  const handleEnableSharing = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const client = createClient()
      const { data, error: sharingError } = await enableScenarioSharing(client, scenarioId)

      if (sharingError || !data) {
        throw sharingError || new Error('Failed to enable sharing')
      }

      setShareToken(data.share_token)
      setIsShared(true)
      onSharingChange?.(data.share_token, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable sharing')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableSharing = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const client = createClient()
      const { error: sharingError } = await disableScenarioSharing(client, scenarioId)

      if (sharingError) {
        throw sharingError
      }

      setIsShared(false)
      onSharingChange?.(shareToken, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable sharing')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('Failed to copy link')
    }
  }

  const handleOpenLink = () => {
    window.open(shareUrl, '_blank')
  }

  return (
    <div className={`fixed inset-0 ${overlayBg} flex items-center justify-center z-50 p-4`}>
      <div className={`${modalBg} rounded-2xl border ${modalBorder} shadow-2xl w-full max-w-2xl relative`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${modalBorder}`}>
          <div className="flex items-center gap-3">
            <Share2 className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-rose-500'}`} />
            <div>
              <h2 className={`text-xl font-bold ${textPrimary}`}>Share Scenario</h2>
              <p className={`text-sm ${textSecondary}`}>{scenarioName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`${buttonSecondary} p-2 rounded-lg transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className={`${isDarkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300'} border rounded-lg p-4 flex items-start gap-3`}>
              <XCircle className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'} flex-shrink-0 mt-0.5`} />
              <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          )}

          {/* Sharing Status */}
          {!isShared ? (
            <div>
              <h3 className={`text-base font-semibold ${textPrimary} mb-2`}>
                Share this scenario
              </h3>
              <p className={`text-sm ${textSecondary} mb-4`}>
                Create a read-only link that anyone can view without logging in.
                Perfect for sharing with friends, family, or financial advisors.
              </p>
              <button
                onClick={handleEnableSharing}
                disabled={isLoading}
                className={`${buttonPrimary} text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                <Share2 className="w-5 h-5" />
                {isLoading ? 'Creating Link...' : 'Create Share Link'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className={`text-base font-semibold ${textPrimary} mb-2`}>
                  Share Link
                </h3>
                <p className={`text-sm ${textSecondary} mb-3`}>
                  Anyone with this link can view this scenario (read-only).
                </p>
              </div>

              {/* Link Display */}
              <div className={`${linkBg} border ${linkBorder} rounded-lg p-4`}>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className={`flex-1 ${linkBg} ${linkText} text-sm font-mono bg-transparent border-none outline-none`}
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`${buttonSecondary} px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleOpenLink}
                    className={`${buttonSecondary} px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </button>
                </div>
              </div>

              {/* Disable Sharing Button */}
              <button
                onClick={handleDisableSharing}
                disabled={isLoading}
                className={`${buttonDanger} px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                <XCircle className="w-4 h-4" />
                {isLoading ? 'Disabling...' : 'Disable Sharing'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${modalBorder}`}>
          <button
            onClick={onClose}
            className={`${buttonSecondary} px-6 py-3 rounded-lg font-semibold transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
