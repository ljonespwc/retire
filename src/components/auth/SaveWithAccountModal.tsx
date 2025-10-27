'use client'

/**
 * Save With Account Modal
 *
 * Combined modal for anonymous users to create an account
 * and save their scenario in one step.
 */

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { CalculationResults } from '@/types/calculator'
import { type FormData, formDataToScenario } from '@/lib/scenarios/scenario-mapper'
import { Save, X } from 'lucide-react'
import confetti from 'canvas-confetti'

interface SaveWithAccountModalProps {
  isOpen: boolean
  onClose: () => void
  formData: FormData
  calculationResults: CalculationResults | null
}

export function SaveWithAccountModal({
  isOpen,
  onClose,
  formData,
  calculationResults
}: SaveWithAccountModalProps) {
  const { upgradeAccount } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [scenarioName, setScenarioName] = useState(`Retirement Plan ${new Date().toLocaleDateString()}`)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!email || !password || !scenarioName) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Step 1: Upgrade anonymous account to authenticated
      const result = await upgradeAccount(email, password)

      if (!result.success) {
        setError(result.error || 'Failed to create account')
        setLoading(false)
        return
      }

      console.log('✅ Account created successfully')

      // Step 2: Save scenario with custom name
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Failed to get user session')
        setLoading(false)
        return
      }

      // Convert form data to proper scenario structure
      const scenario = formDataToScenario(formData, scenarioName)

      const { error: saveError } = await supabase
        .from('scenarios')
        .insert({
          user_id: user.id,
          name: scenario.name,
          inputs: {
            basic_inputs: scenario.basic_inputs,
            assets: scenario.assets,
            income_sources: scenario.income_sources,
            expenses: scenario.expenses,
            assumptions: scenario.assumptions
          },
          results: calculationResults as any,
          source: 'manual'  // Manually saved by user
        } as any)

      if (saveError) {
        console.error('Failed to save scenario:', saveError)
        setError('Account created, but failed to save scenario')
        setLoading(false)
        return
      }

      console.log('✅ Scenario saved successfully')

      // Success feedback
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      onClose()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Save with account error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Save Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Create an account to save your retirement plan and access it anytime.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Scenario Name */}
          <div>
            <label htmlFor="scenarioName" className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name
            </label>
            <input
              id="scenarioName"
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="My Retirement Plan"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Re-enter password"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Creating Account...' : 'Create Account & Save'}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}
