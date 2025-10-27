'use client'

/**
 * Login Modal
 *
 * Modal for existing users to log in to their account from any device.
 * Enables cross-device access to saved retirement scenarios.
 */

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { X, LogIn } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: () => void
  isDarkMode?: boolean
}

export function LoginModal({ isOpen, onClose, onLoginSuccess, isDarkMode = false }: LoginModalProps) {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  // Theme-aware colors
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const result = await login(email, password)

      if (result.success) {
        console.log('✅ Login successful')
        // Call success callback (may trigger merge modal)
        onLoginSuccess?.()
        // Close this modal
        onClose()
      } else {
        setError(result.error || 'Failed to log in')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setEmail('')
      setPassword('')
      setError(null)
      onClose()
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm`}>
      <div className={`${modalBg} border ${modalBorder} rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <LogIn className="w-6 h-6 text-orange-500" />
            <h3 className={`text-2xl font-bold ${textPrimary}`}>Login</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className={`p-2 rounded-lg ${buttonSecondary} transition-colors disabled:opacity-50`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className={`${textSecondary} mb-6`}>
          Log in to access your saved retirement plans from any device.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${textSecondary} mb-2`}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} ${inputText} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50`}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${textSecondary} mb-2`}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} ${inputText} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50`}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-6 py-3 ${buttonPrimary} text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className={`w-full px-6 py-3 ${buttonSecondary} rounded-lg font-medium transition-all disabled:opacity-50`}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}
