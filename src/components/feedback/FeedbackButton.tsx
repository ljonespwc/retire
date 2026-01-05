'use client'

/**
 * Feedback Button
 *
 * Floating button that appears in the bottom-right corner
 * after a user completes their first calculation.
 */

import { MessageSquare } from 'lucide-react'

interface FeedbackButtonProps {
  onClick: () => void
  isDarkMode: boolean
}

export function FeedbackButton({ onClick, isDarkMode }: FeedbackButtonProps) {
  const buttonBg = isDarkMode
    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
    : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-40 ${buttonBg} text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:scale-105`}
      aria-label="Give feedback"
    >
      <MessageSquare className="w-5 h-5" />
      <span className="hidden sm:inline font-medium">Feedback</span>
    </button>
  )
}
