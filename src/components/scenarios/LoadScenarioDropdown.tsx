'use client'

/**
 * Load Scenario Dropdown
 *
 * Displays saved retirement scenarios and loads them into the form.
 */

import { useState, useEffect } from 'react'
import { FileText, Loader2, ChevronDown, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getScenarios } from '@/lib/supabase/queries'
import { scenarioToFormData, type FormData } from '@/lib/scenarios/scenario-mapper'

interface LoadScenarioDropdownProps {
  onLoad: (formData: FormData, scenarioName: string) => void
  isDarkMode?: boolean
}

interface SavedScenario {
  id: string
  name: string
  inputs: any
  created_at: string
  updated_at: string
}

export function LoadScenarioDropdown({ onLoad, isDarkMode = false }: LoadScenarioDropdownProps) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Theme-aware colors
  const cardBg = isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
  const cardBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600'
  const textMuted = isDarkMode ? 'text-gray-500' : 'text-gray-500'
  const buttonBg = isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
  const dropdownBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const dropdownBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const itemHover = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'

  useEffect(() => {
    loadScenarios()
  }, [])

  const loadScenarios = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const client = createClient()

      // Check if user is authenticated
      const { data: { user } } = await client.auth.getUser()

      if (!user) {
        // Not authenticated - just show empty state
        setScenarios([])
        setIsLoading(false)
        return
      }

      const { data, error: fetchError } = await getScenarios(client, {
        orderBy: 'updated_at',
        ascending: false,
        limit: 10,
      })

      if (fetchError) {
        throw fetchError
      }

      setScenarios((data || []) as SavedScenario[])
    } catch (err) {
      console.error('Error loading scenarios:', err)
      setError('Failed to load scenarios')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectScenario = (scenario: SavedScenario) => {
    try {
      // Convert database structure to form data
      const formData = scenarioToFormData({
        name: scenario.name,
        basic_inputs: scenario.inputs.basic_inputs,
        assets: scenario.inputs.assets,
        income_sources: scenario.inputs.income_sources,
        expenses: scenario.inputs.expenses,
        assumptions: scenario.inputs.assumptions,
      })

      onLoad(formData, scenario.name)
      setIsOpen(false)
    } catch (err) {
      console.error('Error loading scenario:', err)
      setError('Failed to load scenario data')
    }
  }

  return (
    <div className="relative">
      {/* Dropdown Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || scenarios.length === 0}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 ${cardBg} border ${cardBorder} rounded-lg ${buttonBg} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          <span className={`text-sm font-medium ${textPrimary}`}>
            {isLoading ? 'Loading...' : scenarios.length > 0 ? 'Load Saved Plan' : 'No saved plans'}
          </span>
        </div>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
        ) : scenarios.length > 0 ? (
          <ChevronDown className={`w-4 h-4 ${textSecondary} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        ) : null}
      </button>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && scenarios.length > 0 && (
        <div className={`absolute top-full left-0 right-0 mt-2 ${dropdownBg} border ${dropdownBorder} rounded-lg shadow-xl z-10 max-h-80 overflow-y-auto`}>
          <div className="p-2">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 mb-2">
              <span className={`text-xs font-semibold ${textSecondary} uppercase tracking-wide`}>
                Saved Scenarios
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded ${buttonBg}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                className={`w-full text-left px-3 py-3 rounded-lg ${itemHover} transition-colors`}
              >
                <div className={`font-medium ${textPrimary} mb-1`}>
                  {scenario.name}
                </div>
                <div className={`text-xs ${textMuted}`}>
                  Updated {new Date(scenario.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
