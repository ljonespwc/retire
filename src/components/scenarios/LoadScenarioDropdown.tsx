'use client'

/**
 * Load Scenario Dropdown
 *
 * Displays saved retirement scenarios and loads them into the form.
 */

import { useState, useEffect, useRef } from 'react'
import { FileText, Loader2, ChevronDown, X, Trash2, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getScenarios, deleteScenario } from '@/lib/supabase/queries'
import { scenarioToFormData, type FormData } from '@/lib/scenarios/scenario-mapper'
import { getVariantMetadata, type VariantMetadata } from '@/lib/scenarios/variant-metadata'
import { useAuth } from '@/contexts/AuthContext'

interface LoadScenarioDropdownProps {
  onLoad: (formData: FormData, scenarioName: string, variantMetadata?: VariantMetadata, scenarioId?: string, shareToken?: string | null, isShared?: boolean, results?: any | null, narrative?: string | null, variantScenario?: any | null) => void
  isDarkMode?: boolean
}

interface SavedScenario {
  id: string
  name: string
  inputs: any
  results: any | null
  created_at: string
  updated_at: string
  share_token?: string | null
  is_shared?: boolean
}

/**
 * Group scenarios into baselines and their variants for hierarchical display
 */
interface ScenarioGroup {
  baseline: SavedScenario
  variants: SavedScenario[]
}

function groupScenariosByBaseline(scenarios: SavedScenario[]): { groups: ScenarioGroup[]; orphanVariants: SavedScenario[] } {
  // Separate baselines (no variant metadata) from variants
  const baselines: SavedScenario[] = []
  const variants: SavedScenario[] = []

  for (const scenario of scenarios) {
    const metadata = getVariantMetadata(scenario.inputs)
    if (metadata?.variant_type) {
      variants.push(scenario)
    } else {
      baselines.push(scenario)
    }
  }

  // Group variants under their parent baseline by matching baseline_snapshot.name
  const groups: ScenarioGroup[] = baselines.map(baseline => ({
    baseline,
    variants: variants.filter(v => {
      const metadata = getVariantMetadata(v.inputs)
      return metadata?.baseline_snapshot?.name === baseline.name
    })
  }))

  // Sort groups by baseline name, then sort variants within each group by name
  groups.sort((a, b) => a.baseline.name.localeCompare(b.baseline.name))
  groups.forEach(g => g.variants.sort((a, b) => a.name.localeCompare(b.name)))

  // Find orphan variants (variants whose baseline no longer exists)
  const orphanVariants = variants.filter(v => {
    const metadata = getVariantMetadata(v.inputs)
    const parentName = metadata?.baseline_snapshot?.name
    return !baselines.some(b => b.name === parentName)
  })

  return { groups, orphanVariants }
}

/**
 * Individual scenario item with baseline/variant styling
 */
interface ScenarioItemProps {
  scenario: SavedScenario
  variantCount?: number
  confirmDeleteId: string | null
  isDeleting: boolean
  onSelect: (scenario: SavedScenario) => void
  onDelete: (id: string) => void
  onConfirmDelete: (id: string | null) => void
  isDarkMode: boolean
  textPrimary: string
  textMuted: string
  buttonBg: string
  itemHover: string
}

function ScenarioItem({
  scenario,
  variantCount = 0,
  confirmDeleteId,
  isDeleting,
  onSelect,
  onDelete,
  onConfirmDelete,
  isDarkMode,
  textPrimary,
  textMuted,
  buttonBg,
  itemHover
}: ScenarioItemProps) {
  return (
    <div
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
              onClick={() => onDelete(scenario.id)}
              disabled={isDeleting}
              className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => onConfirmDelete(null)}
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
            onClick={() => onSelect(scenario)}
            className="flex-1 text-left px-3 py-2.5 flex items-start gap-2"
          >
            <BarChart3 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-orange-500'}`} />
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${textPrimary} truncate`}>
                {scenario.name}
              </div>
              <div className={`text-xs ${textMuted}`}>
                Updated {new Date(scenario.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {variantCount > 0 && (
                  <span className={isDarkMode ? 'text-blue-400' : 'text-orange-600'}>
                    {' '}&bull; {variantCount} variant{variantCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onConfirmDelete(scenario.id)
            }}
            className="opacity-0 group-hover:opacity-100 px-3 py-3 text-red-600 hover:text-red-700 transition-all"
            aria-label="Delete scenario"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
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
    if (!authLoading && user) {
      loadScenarios()
    }
  }, [authLoading, user])

  const loadScenarios = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const client = createClient()

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
      // Extract variant metadata if present
      const variantMetadata = getVariantMetadata(scenario.inputs)

      // Store original scenario data (with variant values) for comparison display
      const originalScenario = variantMetadata ? {
        name: scenario.name,
        basic_inputs: scenario.inputs.basic_inputs,
        assets: scenario.inputs.assets,
        income_sources: scenario.inputs.income_sources,
        expenses: scenario.inputs.expenses,
        assumptions: scenario.inputs.assumptions,
      } : null

      // Convert database structure to form data
      let formData = scenarioToFormData({
        name: scenario.name,
        basic_inputs: scenario.inputs.basic_inputs,
        assets: scenario.inputs.assets,
        income_sources: scenario.inputs.income_sources,
        expenses: scenario.inputs.expenses,
        assumptions: scenario.inputs.assumptions,
      })

      // For variant scenarios, override form data with baseline snapshot values
      // so form displays baseline values, not variant values
      if (variantMetadata?.baseline_snapshot) {
        formData = {
          ...formData,
          monthlySpending: variantMetadata.baseline_snapshot.monthly_spending,
          retirementAge: variantMetadata.baseline_snapshot.retirement_age,
          cppStartAge: variantMetadata.baseline_snapshot.cpp_start_age,
          // Note: OAS start age is always 65 in baseline, but variants may change it
          // For now, we only handle monthly_spending, retirement_age, cpp_start_age
        }
      }

      // Extract baseline narrative if present (for baselines) or from metadata (for variants)
      let narrative: string | null = null
      if (variantMetadata?.ai_narrative) {
        narrative = variantMetadata.ai_narrative
      } else if (scenario.inputs.__baseline_narrative) {
        narrative = scenario.inputs.__baseline_narrative
      }

      // Pass sharing state along with other scenario data, plus results and narrative
      // Also pass original variant scenario (with variant values) for comparison display
      onLoad(
        formData,
        scenario.name,
        variantMetadata || undefined,
        scenario.id,
        scenario.share_token,
        scenario.is_shared,
        scenario.results,
        narrative,
        originalScenario
      )
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
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      })
    }
  }

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition()
    }
    setIsOpen(!isOpen)
  }

  // Update dropdown position on scroll/resize when open
  useEffect(() => {
    if (!isOpen) return

    const handleUpdate = () => {
      updateDropdownPosition()
    }

    window.addEventListener('scroll', handleUpdate, true) // Capture scroll from all elements
    window.addEventListener('resize', handleUpdate)

    return () => {
      window.removeEventListener('scroll', handleUpdate, true)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [isOpen])

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

            {(() => {
              const { groups } = groupScenariosByBaseline(scenarios)

              return (
                <>
                  {/* Baselines only - variants auto-load when baseline is selected */}
                  {groups.map((group) => (
                    <ScenarioItem
                      key={group.baseline.id}
                      scenario={group.baseline}
                      variantCount={group.variants.length}
                      confirmDeleteId={confirmDeleteId}
                      isDeleting={isDeleting}
                      onSelect={handleSelectScenario}
                      onDelete={handleDeleteScenario}
                      onConfirmDelete={setConfirmDeleteId}
                      isDarkMode={isDarkMode}
                      textPrimary={textPrimary}
                      textMuted={textMuted}
                      buttonBg={buttonBg}
                      itemHover={itemHover}
                    />
                  ))}
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
