'use client'

/**
 * Save Scenario Modal
 *
 * Modal for saving current retirement plan with a custom name.
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveScenario, updateScenario } from '@/lib/supabase/queries'
import { formDataToScenario, getDefaultScenarioName, type FormData } from '@/lib/scenarios/scenario-mapper'
import { addVariantMetadata, type VariantType, type BaselineSnapshot } from '@/lib/scenarios/variant-metadata'
import { CalculationResults } from '@/types/calculator'

interface SaveScenarioModalProps {
  isOpen: boolean
  onClose: () => void
  formData: FormData
  calculationResults: CalculationResults | null
  isDarkMode?: boolean
  defaultName?: string
  variantType?: VariantType // Optional variant metadata
  variantConfig?: Record<string, any> // Optional variant config
  baselineId?: string // Optional baseline scenario ID
  baselineScenarioName?: string // Optional baseline scenario name (for variants)
  baselineResults?: CalculationResults // Optional baseline results (for variants)
  scenarioId?: string // Optional scenario ID (for updates)
  aiInsight?: string // Optional AI-generated insight (for variants)
  aiNarrative?: string // Optional AI-generated narrative (for variants)
  onSaveSuccess?: (scenarioId: string, scenarioName: string) => void // Callback after successful save
}

export function SaveScenarioModal({
  isOpen,
  onClose,
  formData,
  calculationResults,
  isDarkMode = false,
  defaultName,
  variantType,
  variantConfig,
  baselineId,
  baselineScenarioName,
  baselineResults,
  scenarioId,
  aiInsight,
  aiNarrative,
  onSaveSuccess,
}: SaveScenarioModalProps) {
  const [scenarioName, setScenarioName] = useState(defaultName || getDefaultScenarioName())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Update scenario name when defaultName changes and modal opens
  useEffect(() => {
    if (isOpen) {
      setScenarioName(defaultName || getDefaultScenarioName())
    }
  }, [isOpen, defaultName])

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

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const client = createClient()

      // Convert form data to scenario structure
      const scenario = formDataToScenario(formData, scenarioName)

      // Prepare inputs object
      let inputs: any = {
        basic_inputs: scenario.basic_inputs,
        assets: scenario.assets,
        income_sources: scenario.income_sources,
        expenses: scenario.expenses,
        assumptions: scenario.assumptions,
      }

      // Add variant metadata if this is a variant scenario
      if (variantType) {
        // Create baseline snapshot if baseline data is available
        let baselineSnapshot: BaselineSnapshot | undefined
        if (baselineScenarioName && baselineResults && formData) {
          baselineSnapshot = {
            name: baselineScenarioName,
            ending_balance: baselineResults.final_portfolio_value,
            monthly_spending: formData.monthlySpending || 0,
            retirement_age: formData.retirementAge || 65,
            cpp_start_age: formData.cppStartAge || 65,
            oas_start_age: 65, // OAS typically starts at 65
            portfolio_depleted_age: baselineResults.portfolio_depleted_age,
          }
        }

        inputs = addVariantMetadata(inputs, variantType, variantConfig, baselineId, baselineSnapshot, aiInsight, aiNarrative)
      }

      if (scenarioId) {
        // UPDATE existing scenario
        const { data, error: updateError } = await updateScenario(client, scenarioId, {
          name: scenario.name,
          inputs,
          results: calculationResults as any,
        })

        if (updateError) {
          throw updateError
        }

        console.log('✅ Scenario updated successfully:', scenarioId)
      } else {
        // CREATE new scenario
        const { data, error: saveError } = await saveScenario(client, {
          name: scenario.name,
          inputs,
          results: calculationResults as any,
          source: 'manual',  // Manually saved by user
        })

        if (saveError) {
          throw saveError
        }

        console.log('✅ Scenario created successfully:', data?.id)

        // Notify parent of successful save (so it can track the new ID)
        if (onSaveSuccess && data?.id) {
          onSaveSuccess(data.id, scenario.name)
        }
      }

      // Success!
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setScenarioName(getDefaultScenarioName()) // Reset for next time
      }, 1500)
    } catch (err) {
      console.error('Error saving scenario:', err)
      setError(err instanceof Error ? err.message : 'Failed to save scenario')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onClose()
      setError(null)
      setSuccess(false)
      setScenarioName(getDefaultScenarioName())
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm`}>
      <div className={`${modalBg} border ${modalBorder} rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-2xl font-bold ${textPrimary}`}>
            {scenarioId ? 'Update Scenario' : 'Save Scenario'}
          </h3>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className={`p-2 rounded-lg ${buttonSecondary} transition-colors disabled:opacity-50`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
              Scenario Name
            </label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              disabled={isSaving || success || !!scenarioId}
              className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} ${inputText} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50 ${scenarioId ? 'cursor-not-allowed' : ''}`}
              placeholder="Enter a name for this scenario"
            />
            {scenarioId && (
              <p className={`text-xs ${textSecondary} mt-2`}>
                Scenario name cannot be changed when updating
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Scenario saved successfully!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className={`flex-1 px-6 py-3 ${buttonSecondary} rounded-lg font-medium transition-all disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !scenarioName.trim() || success}
            className={`flex-1 px-6 py-3 ${buttonPrimary} text-white rounded-lg font-medium transition-all disabled:opacity-50`}
          >
            {isSaving
              ? (scenarioId ? 'Updating...' : 'Saving...')
              : success
              ? (scenarioId ? 'Updated!' : 'Saved!')
              : (scenarioId ? 'Update' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}
