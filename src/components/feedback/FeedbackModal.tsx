'use client'

/**
 * Feedback Modal
 *
 * Modal for collecting user feedback after running calculations.
 * Follows the same pattern as SaveScenarioModal.
 */

import { useState } from 'react'
import { X, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode?: boolean
}

export function FeedbackModal({
  isOpen,
  onClose,
  isDarkMode = false,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [gotAnswers, setGotAnswers] = useState<boolean | null>(null)
  const [whatDidntWork, setWhatDidntWork] = useState('')
  const [featureRequests, setFeatureRequests] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  // Theme-aware colors (same pattern as SaveScenarioModal lines 85-99)
  const overlayBg = 'bg-black/50'
  const modalBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const modalBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const inputBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
  const inputBorder = isDarkMode ? 'border-gray-600' : 'border-gray-300'
  const inputText = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const buttonPrimary = isDarkMode
    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
    : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'
  const buttonSecondary = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    if (gotAnswers === null) {
      setError('Please indicate if you got the answers you needed')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const client = createClient()
      const { error: insertError } = await client
        .from('calculator_feedback')
        .insert({
          rating,
          got_answers: gotAnswers,
          what_didnt_work: !gotAnswers && whatDidntWork ? whatDidntWork : null,
          feature_requests: featureRequests || null,
          email: email || null,
        })

      if (insertError) throw insertError

      setSuccess(true)
      // Store in sessionStorage to hide button for rest of session
      sessionStorage.setItem('feedbackSubmitted', 'true')

      // Close modal after showing success
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      // Mark as dismissed so button doesn't reappear this session
      sessionStorage.setItem('feedbackDismissed', 'true')
      onClose()
    }
  }

  const displayRating = hoveredRating || rating

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm`}>
      <div className={`${modalBg} border ${modalBorder} rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${textPrimary}`}>
            How was your experience?
          </h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className={`p-2 rounded-lg ${buttonSecondary} transition-colors disabled:opacity-50`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <p className={`text-lg font-medium ${textPrimary}`}>
              Thanks for your feedback!
            </p>
            <p className={`${textSecondary} mt-2`}>
              Your input helps make this calculator better.
            </p>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Body */}
            <div className="space-y-5">
              {/* Star Rating */}
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Rate your experience
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= displayRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : isDarkMode
                            ? 'text-gray-600'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Got Answers Toggle */}
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Did you get the answers you needed?
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setGotAnswers(true)}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                      gotAnswers === true
                        ? 'bg-green-500 text-white'
                        : `${buttonSecondary}`
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setGotAnswers(false)}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                      gotAnswers === false
                        ? 'bg-red-500 text-white'
                        : `${buttonSecondary}`
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Conditional: What didn't work */}
              {gotAnswers === false && (
                <div>
                  <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                    What didn't work? (optional)
                  </label>
                  <textarea
                    value={whatDidntWork}
                    onChange={(e) => setWhatDidntWork(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                    className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} ${inputText} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none disabled:opacity-50`}
                    placeholder="Tell us what went wrong..."
                  />
                </div>
              )}

              {/* Feature Requests */}
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Feature requests? (optional)
                </label>
                <textarea
                  value={featureRequests}
                  onChange={(e) => setFeatureRequests(e.target.value)}
                  disabled={isSubmitting}
                  rows={2}
                  className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} ${inputText} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none disabled:opacity-50`}
                  placeholder="What would you like to see added?"
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Email (optional, if you'd like a response)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} ${inputText} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${buttonSecondary} disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0 || gotAnswers === null}
                className={`flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all ${buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
