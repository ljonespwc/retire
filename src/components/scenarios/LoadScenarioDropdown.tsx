'use client'

/**
 * Load Scenario Dropdown
 *
 * Displays saved retirement scenarios and loads them into the form.
 */

import { useState, useEffect, useRef } from 'react'
import { FileText, Loader2, ChevronDown, X, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getScenarios, deleteScenario } from '@/lib/supabase/queries'
import { scenarioToFormData, type FormData } from '@/lib/scenarios/scenario-mapper'
import { useAuth } from '@/contexts/AuthContext'

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
  const { user, loading: authLoading } = useAuth()
  const [scenarios, setScenarios] = useState<SavedScenario[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // Wait for auth to initialize before loading scenarios
  useEffect(() => {
    console.log('📂 LoadScenarioDropdown - Auth state:', {
      authLoading,
      hasUser: !!user,
      userId: user?.id,
      isAnonymous: user?.isAnonymous
    })

    if (!authLoading && user) {
      console.log('📂 LoadScenarioDropdown - Calling loadScenarios()')
      loadScenarios()
    } else if (!authLoading && !user) {
      console.log('📂 LoadScenarioDropdown - Auth complete but no user (should not happen)')
    }
  }, [authLoading, user])

  const loadScenarios = async () => {
    console.log('📂 LoadScenarioDropdown - loadScenarios() started')
    setIsLoading(true)
    setError(null)

    try {
      const client = createClient()
      console.log('📂 LoadScenarioDropdown - Supabase client created')

      // Get all scenarios, then filter to only manually saved ones
      const { data, error: fetchError } = await getScenarios(client, {
        orderBy: 'updated_at',
        ascending: false,
        limit: 50,  // Increased limit to ensure we get enough manual scenarios
      })

      if (fetchError) {
        throw fetchError
      }

      // Filter to only show manually saved scenarios (exclude auto-saved voice conversations)
      const manualScenarios = (data || []).filter((s: any) => s.source !== 'voice')

      setScenarios(manualScenarios as SavedScenario[])
    } catch (err) {
      console.error('📂 LoadScenarioDropdown - Error loading scenarios:', err)
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

  const handleDeleteScenario = async (scenarioId: string) => {
    setIsDeleting(true)
    setError(null)

    try {
      const client = createClient()
      const { error: deleteError } = await deleteScenario(client, scenarioId)

      if (deleteError) {
        throw deleteError
      }

      console.log('✅ Scenario deleted successfully')

      // Refresh scenario list
      await loadScenarios()

      // Clear confirmation state
      setConfirmDeleteId(null)
    } catch (err) {
      console.error('Error deleting scenario:', err)
      setError('Failed to delete scenario')
    } finally {
      setIsDeleting(false)
    }
  }

  // Calculate dropdown position when opening
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative">
      {/* Dropdown Toggle Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={(authLoading || isLoading) || scenarios.length === 0}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 ${cardBg} border ${cardBorder} rounded-lg ${buttonBg} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          <span className={`text-sm font-medium ${textPrimary}`}>
            {(authLoading || isLoading) ? 'Loading...' : scenarios.length > 0 ? 'Load Saved Plan' : 'No saved plans'}
          </span>
        </div>
        {(authLoading || isLoading) ? (
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

      {/* Dropdown Menu - Fixed positioning to escape overflow:hidden parent */}
      {isOpen && scenarios.length > 0 && dropdownPosition && (
        <div className={`fixed ${dropdownBg} border ${dropdownBorder} rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto`}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
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
              <div
                key={scenario.id}
                className={`group relative rounded-lg ${itemHover} transition-colors`}
              >
                {confirmDeleteId === scenario.id ? (
                  // Confirmation state
                  <div className="px-3 py-3">
                    <div className={`text-sm ${textPrimary} mb-3`}>
                      Delete "{scenario.name}"?
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteScenario(scenario.id)}
                        disabled={isDeleting}
                        className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        className={`flex-1 px-3 py-1.5 ${buttonBg} text-xs rounded transition-colors disabled:opacity-50`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal state
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectScenario(scenario)}
                      className="flex-1 text-left px-3 py-3"
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDeleteId(scenario.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 px-3 py-3 text-red-600 hover:text-red-700 transition-all"
                      aria-label="Delete scenario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
