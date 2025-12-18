'use client'

import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useConfetti } from '@/hooks/useConfetti'
import { useState, useRef, useEffect } from 'react'
import { Province } from '@/types/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Calculator, Share2, BarChart3, X } from 'lucide-react'
import { MobileHelpBanner } from '@/components/help/MobileHelpBanner'
import { roundPercentage } from '@/lib/utils/number-utils'
import { PROVINCE_NAMES, PROVINCE_OPTIONS } from '@/lib/calculator/province-data'
import { useAuth } from '@/contexts/AuthContext'
import { SaveWithAccountModal } from '@/components/auth/SaveWithAccountModal'
import { LoginModal } from '@/components/auth/LoginModal'
import { MergeAnonymousScenariosModal } from '@/components/scenarios/MergeAnonymousScenariosModal'
import { getAnonymousScenarioCount } from '@/lib/scenarios/merge-helper'
import { CalculationResults } from '@/types/calculator'
import { ResultsSummary } from '@/components/results/ResultsSummary'
import { BalanceOverTimeChart } from '@/components/results/BalanceOverTimeChart'
import { IncomeCompositionChart } from '@/components/results/IncomeCompositionChart'
import { TaxSummaryCard } from '@/components/results/TaxSummaryCard'
import { CalculationDisclosure } from '@/components/results/CalculationDisclosure'
import { RetirementNarrative } from '@/components/results/RetirementNarrative'
import { VariantDetailsBanner } from '@/components/results/VariantDetailsBanner'
import { SaveScenarioModal } from '@/components/scenarios/SaveScenarioModal'
import { ShareScenarioModal } from '@/components/scenarios/ShareScenarioModal'
import { ScenarioModal } from '@/components/results/ScenarioModal'
import { ScenarioComparison } from '@/components/results/ScenarioComparison'
import { RecalculateConfirmModal } from '@/components/calculator/RecalculateConfirmModal'
import { createFrontLoadVariant, createDelayCppOasVariant, createExhaustPortfolioVariant, createRetireEarlyVariant, createLegacyVariant, createLumpSumWithdrawalVariant } from '@/lib/calculations/scenario-variants'
import { type FormData } from '@/lib/scenarios/scenario-mapper'
import { regenerateVariant, getVariantDisplayName, detectVariantTypeFromName, type VariantMetadata, type VariantType, type BaselineSnapshot } from '@/lib/scenarios/variant-metadata'
import { createClient } from '@/lib/supabase/client'
import { getVariantsForBaseline } from '@/lib/supabase/queries'
import { calculateRetirementProjection } from '@/lib/calculations/engine'
import { Scenario } from '@/types/calculator'
import { WarmDataField } from '@/components/calculator/WarmDataField'
import { CalculatorHeader } from '@/components/calculator/CalculatorHeader'
import { HelpSidebar } from '@/components/help/HelpSidebar'
import { MobileIntroCard } from '@/components/calculator/MobileIntroCard'
import { WhatIfScenarioButtons } from '@/components/calculator/WhatIfScenarioButtons'
import { CalculateButton } from '@/components/calculator/CalculateButton'
import { BaselineResults } from '@/components/results/BaselineResults'
import { FormSections } from '@/components/calculator/FormSections'

export function VoiceFirstContentV2() {
  const { user, isAnonymous, loading: authLoading, logout } = useAuth()

  // Form state
  const [currentAge, setCurrentAge] = useState<number | null>(null)
  const [retirementAge, setRetirementAge] = useState<number | null>(null)
  const [longevityAge, setLongevityAge] = useState<number | null>(null)
  const [province, setProvince] = useState<string>('')
  const [currentIncome, setCurrentIncome] = useState<number | null>(null)
  const [rrsp, setRrsp] = useState<number | null>(null)
  const [rrspContribution, setRrspContribution] = useState<number | null>(null)
  const [tfsa, setTfsa] = useState<number | null>(null)
  const [tfsaContribution, setTfsaContribution] = useState<number | null>(null)
  const [nonRegistered, setNonRegistered] = useState<number | null>(null)
  const [nonRegisteredContribution, setNonRegisteredContribution] = useState<number | null>(null)
  const [monthlySpending, setMonthlySpending] = useState<number | null>(null)
  const [pensionIncome, setPensionIncome] = useState<number | null>(null)
  const [pensionIndexed, setPensionIndexed] = useState<boolean | null>(null)
  const [pensionHasBridge, setPensionHasBridge] = useState<boolean | null>(null)
  const [otherIncome, setOtherIncome] = useState<number | null>(null)
  const [cppStartAge, setCppStartAge] = useState<number | null>(null)
  const [investmentReturn, setInvestmentReturn] = useState<number | null>(null)
  const [postRetirementReturn, setPostRetirementReturn] = useState<number | null>(null)
  const [inflationRate, setInflationRate] = useState<number | null>(null)

  // UI state
  const [editMode, setEditMode] = useState(false)
  const [justCalculated, setJustCalculated] = useState(false)
  const [planningStarted, setPlanningStarted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [showSaveWithAccountModal, setShowSaveWithAccountModal] = useState(false)
  const [scenarioId, setScenarioId] = useState<string | undefined>(undefined)
  const [loadedScenarioName, setLoadedScenarioName] = useState<string | null>(null)
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null)
  const [baselineNarrative, setBaselineNarrative] = useState<string | null>(null)
  const [baselineSnapshot, setBaselineSnapshot] = useState<BaselineSnapshot | null>(null)

  // What-if scenario state
  const [showScenarioModal, setShowScenarioModal] = useState(false)
  const [selectedScenarioType, setSelectedScenarioType] = useState<'front_load' | 'exhaust' | 'legacy' | 'delay_benefits' | 'retire_early' | 'lump_sum'>('front_load')
  const [variantScenarios, setVariantScenarios] = useState<Scenario[]>([])
  const [variantResultsArray, setVariantResultsArray] = useState<CalculationResults[]>([])
  const [variantInsights, setVariantInsights] = useState<string[]>([])
  const [variantNarratives, setVariantNarratives] = useState<string[]>([])
  const [variantScenarioIds, setVariantScenarioIds] = useState<(string | undefined)[]>([])
  const [variantConfigs, setVariantConfigs] = useState<Array<Record<string, any> | undefined>>([])
  const [isCalculatingVariant, setIsCalculatingVariant] = useState(false)
  const [generatingVariantType, setGeneratingVariantType] = useState<'front_load' | 'delay_benefits' | 'exhaust' | 'retire_early' | 'legacy' | 'lump_sum' | null>(null)
  const [activeVariantTab, setActiveVariantTab] = useState<number>(0)
  const [savingVariantIndex, setSavingVariantIndex] = useState<number | null>(null)
  const [isSavingVariantNarrative, setIsSavingVariantNarrative] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [loadedVariantMetadata, setLoadedVariantMetadata] = useState<VariantMetadata | null>(null)
  const [loadedVariantScenario, setLoadedVariantScenario] = useState<Scenario | null>(null)
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false)
  const [showScenarioSaveModal, setShowScenarioSaveModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [isScenarioShared, setIsScenarioShared] = useState(false)
  const [variantShareTokens, setVariantShareTokens] = useState<(string | null)[]>([])
  const [variantIsShared, setVariantIsShared] = useState<boolean[]>([])
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showRecalculateConfirmModal, setShowRecalculateConfirmModal] = useState(false)
  const [anonymousUserIdBeforeLogin, setAnonymousUserIdBeforeLogin] = useState<string | null>(null)
  const [anonymousScenarioCountBeforeLogin, setAnonymousScenarioCountBeforeLogin] = useState(0)

  // Compare Mode state - when baseline + variants are loaded together
  const [isCompareMode, setIsCompareMode] = useState(false)
  const [loadedVariantIds, setLoadedVariantIds] = useState<string[]>([])
  const [clickedVariantIndex, setClickedVariantIndex] = useState<number | null>(null)

  // Track saved variants by type -> scenario ID (persists even when tab is closed)
  // This allows reopening saved variants instead of regenerating them
  const [savedVariants, setSavedVariants] = useState<Record<string, { id: string; index: number }>>({})

  const resultsRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to results when they appear
  useEffect(() => {
    if (calculationResults && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [calculationResults])

  // Theme configuration
  const theme = {
    background: isDarkMode ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800' : 'bg-gradient-to-br from-orange-50 via-rose-50 to-teal-50',
    headerBg: isDarkMode ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600' : 'bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400',
    card: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white',
    text: {
      primary: isDarkMode ? 'text-gray-100' : 'text-gray-800',
      secondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
      muted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    },
    button: {
      primary: isDarkMode
        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
        : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600',
      secondary: isDarkMode
        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
        : 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600',
    },
    input: isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-white border-gray-200',
  }

  // Convert VariantType (e.g., 'front-load') to UI key (e.g., 'front_load')
  const variantTypeToUiKey = (variantType: string): string => {
    const mapping: Record<string, string> = {
      'front-load': 'front_load',
      'delay-cpp-oas': 'delay_benefits',
      'exhaust-portfolio': 'exhaust',
      'retire-early': 'retire_early',
      'legacy': 'legacy',
      'lump-sum': 'lump_sum'
    }
    return mapping[variantType] || variantType
  }

  // Confetti celebration effect
  const { startConfetti, stopConfetti } = useConfetti()

  // Handle Create New Plan button
  // Check if mandatory fields are complete and valid
  const isMandatoryFieldsComplete = () => {
    // Check if required fields exist
    if (currentAge === null || retirementAge === null || longevityAge === null || province === '') {
      return false
    }

    // Check if ages are valid positive numbers
    if (currentAge <= 0 || retirementAge <= 0 || longevityAge <= 0) {
      return false
    }

    // Check logical age relationships
    if (retirementAge < currentAge) {
      return false
    }

    if (longevityAge <= retirementAge) {
      return false
    }

    // Check reasonable age ranges (1-120)
    if (currentAge > 120 || retirementAge > 120 || longevityAge > 120) {
      return false
    }

    return true
  }

  const handleStartPlanning = () => {
    setPlanningStarted(true)
    setEditMode(true)

    // Clear ALL form fields (user is starting completely fresh)
    setCurrentAge(null)
    setRetirementAge(null)
    setLongevityAge(null)
    setProvince('')
    setCurrentIncome(null)
    setRrsp(null)
    setRrspContribution(null)
    setTfsa(null)
    setTfsaContribution(null)
    setNonRegistered(null)
    setNonRegisteredContribution(null)
    setMonthlySpending(null)
    setPensionIncome(null)
    setPensionIndexed(null)
    setPensionHasBridge(null)
    setOtherIncome(null)
    setCppStartAge(65)

    // Set default rate assumptions
    setInvestmentReturn(6)
    setPostRetirementReturn(4)
    setInflationRate(2)

    // Clear scenario tracking and sidebar state
    setScenarioId(undefined)
    setLoadedScenarioName(null)
    setLoadedVariantMetadata(null)
    setFocusedField(null)
    setShareToken(null)
    setIsScenarioShared(false)

    // Clear calculation results
    setJustCalculated(false)
    setShowResults(false)
    setCalculationResults(null)
    setBaselineNarrative(null)

    // Clear any variant scenarios
    setVariantScenarios([])
    setVariantResultsArray([])
    setVariantScenarioIds([])
    setVariantConfigs([])
    setVariantInsights([])
    setVariantNarratives([])

    // Exit Compare Mode
    setIsCompareMode(false)
    setLoadedVariantIds([])
    setClickedVariantIndex(null)
    setSavedVariants({})
  }

  // Exit Compare Mode and enable editing
  const handleExitCompareMode = () => {
    console.log('👋 Exiting Compare Mode')
    setIsCompareMode(false)
    setEditMode(true)

    // Clear all variant data
    setVariantScenarios([])
    setVariantResultsArray([])
    setVariantScenarioIds([])
    setVariantConfigs([])
    setVariantInsights([])
    setVariantNarratives([])
    setVariantShareTokens([])
    setVariantIsShared([])
    setLoadedVariantIds([])
    setClickedVariantIndex(null)
    setActiveVariantTab(-1)  // Reset to baseline tab
    setSavedVariants({})

    // Clear variant-related metadata (keep baseline data)
    setLoadedVariantMetadata(null)
    setLoadedVariantScenario(null)
  }

  // Handle Calculate button click
  const handleCalculate = async () => {
    // Validate required fields with helpful error messages
    if (currentAge === null || retirementAge === null || longevityAge === null || province === '') {
      alert('Please complete all required fields:\n• Current Age\n• Retirement Age\n• Life Expectancy Age\n• Province')
      return
    }

    if (currentAge <= 0 || retirementAge <= 0 || longevityAge <= 0) {
      alert('Ages must be greater than 0')
      return
    }

    if (retirementAge < currentAge) {
      alert('Retirement age must be greater than or equal to current age')
      return
    }

    if (longevityAge <= retirementAge) {
      alert('Life expectancy age must be greater than retirement age')
      return
    }

    if (currentAge > 120 || retirementAge > 120 || longevityAge > 120) {
      alert('Ages must be 120 or less')
      return
    }

    // Check if variants are active - show confirmation modal instead of calculating
    if (variantScenarios.length > 0) {
      setShowRecalculateConfirmModal(true)
      return
    }

    setIsCalculating(true)
    startConfetti()

    try {
      let scenario: any = {
        id: scenarioId || 'temp-id',
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        name: `Retirement Plan ${new Date().toLocaleDateString()}`,
        basic_inputs: {
          current_age: currentAge,
          retirement_age: retirementAge,
          longevity_age: longevityAge,
          province
        },
        assets: {
          rrsp: rrsp !== null ? { balance: rrsp, rate_of_return: (investmentReturn || 6) / 100, annual_contribution: rrspContribution || 0 } : undefined,
          tfsa: tfsa !== null ? { balance: tfsa, rate_of_return: (investmentReturn || 6) / 100, annual_contribution: tfsaContribution || 0 } : undefined,
          non_registered: nonRegistered !== null ? {
            balance: nonRegistered,
            cost_base: nonRegistered * 0.7,
            rate_of_return: (investmentReturn || 6) / 100,
            annual_contribution: nonRegisteredContribution || 0
          } : undefined
        },
        income_sources: {
          ...(currentIncome && currentIncome > 0 ? {
            employment: {
              annual_amount: currentIncome,
              until_age: retirementAge || 65
            }
          } : {}),
          cpp: { start_age: cppStartAge || 65, monthly_amount_at_65: 1364.60 },
          oas: { start_age: 65, monthly_amount: 713.34 },
          ...(pensionIncome ? {
            pension: {
              annual_amount: pensionIncome,
              start_age: retirementAge || 65,
              indexed_to_inflation: pensionIndexed === true,
              ...(pensionHasBridge === true && {
                has_bridge_benefit: true,
                bridge_reduction_amount: 16374,
                bridge_reduction_age: 65
              })
            }
          } : {}),
          other_income: [
            ...(otherIncome ? [{
              description: 'Other Income',
              annual_amount: otherIncome,
              start_age: retirementAge || 65,
              indexed_to_inflation: false // Fixed income - does not grow with inflation
            }] : [])
          ]
        },
        expenses: {
          fixed_monthly: monthlySpending || 4000,
          indexed_to_inflation: true,
          age_based_changes: []
        },
        assumptions: {
          pre_retirement_return: (investmentReturn || 6) / 100,
          post_retirement_return: (postRetirementReturn || 4) / 100,
          inflation_rate: (inflationRate || 2) / 100
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // If loaded variant metadata exists, regenerate the variant
      if (loadedVariantMetadata) {
        console.log(`🔄 Regenerating variant: ${loadedVariantMetadata.variant_type}`)
        scenario = regenerateVariant(scenario, loadedVariantMetadata.variant_type, loadedVariantMetadata.variant_config)
        console.log('✅ Variant regenerated:', scenario.name)
      }

      console.log('📤 Sending calculation request for:', scenario.name)

      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      })

      const data = await response.json()

      if (data.success && data.results) {
        console.log('🔍 BASELINE RESULTS:', {
          final_portfolio: data.results.final_portfolio_value,
          total_cpp: data.results.total_cpp_received,
          total_oas: data.results.total_oas_received,
          first_year_income: data.results.first_year_retirement_income
        })
        setCalculationResults(data.results)
        setBaselineNarrative(data.narrative || null)

        // Create baseline snapshot for variant comparisons (only for non-variant calculations)
        if (!loadedVariantMetadata) {
          const snapshot: BaselineSnapshot = {
            name: loadedScenarioName || 'Your Baseline',
            ending_balance: data.results.final_portfolio_value,
            monthly_spending: monthlySpending || 4000,
            retirement_age: retirementAge || 65,
            cpp_start_age: cppStartAge || 65,
            oas_start_age: 65,
            portfolio_depleted_age: data.results.portfolio_depleted_age
          }
          setBaselineSnapshot(snapshot)
          console.log('📸 Created baseline snapshot:', snapshot)
        }

        setShowResults(true)
        stopConfetti() // Stop fireworks when results render
        setEditMode(false)
        setJustCalculated(true)
        setFocusedField(null) // Reset sidebar to original state
      } else {
        console.error('❌ Calculation failed:', data.error)
        stopConfetti() // Stop fireworks on error
        alert(`Calculation failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Calculate error:', error)
      stopConfetti() // Stop fireworks on error
      alert('An error occurred during calculation. Please try again.')
    } finally {
      setIsCalculating(false)
    }
  }

  // Get current form data for saving
  const getCurrentFormData = (): FormData => {
    return {
      currentAge,
      retirementAge,
      longevityAge,
      province,
      currentIncome,
      rrspAmount: rrsp,
      tfsaAmount: tfsa,
      nonRegisteredAmount: nonRegistered,
      rrspContribution,
      tfsaContribution,
      nonRegisteredContribution,
      monthlySpending,
      pensionIncome,
      pensionIndexed,
      pensionHasBridge,
      otherIncome,
      cppStartAge,
      investmentReturn,
      postRetirementReturn,
      inflationRate,
    }
  }

  // Handle loading a saved scenario
  const handleLoadScenario = async (
    formData: FormData,
    scenarioName: string,
    variantMetadata?: VariantMetadata,
    scenarioId?: string,
    shareToken?: string | null,
    isShared?: boolean,
    results?: any | null,
    narrative?: string | null,
    variantScenario?: any | null
  ) => {
    // Set form state
    setCurrentAge(formData.currentAge)
    setRetirementAge(formData.retirementAge)
    setLongevityAge(formData.longevityAge)
    setProvince(formData.province || '')
    setCurrentIncome(formData.currentIncome)
    setRrsp(formData.rrspAmount)
    setRrspContribution(formData.rrspContribution)
    setTfsa(formData.tfsaAmount)
    setTfsaContribution(formData.tfsaContribution)
    setNonRegistered(formData.nonRegisteredAmount)
    setNonRegisteredContribution(formData.nonRegisteredContribution)
    setMonthlySpending(formData.monthlySpending)
    setPensionIncome(formData.pensionIncome)
    setPensionIndexed(formData.pensionIndexed)
    setPensionHasBridge(formData.pensionHasBridge)
    setOtherIncome(formData.otherIncome)
    setCppStartAge(formData.cppStartAge)
    setInvestmentReturn(formData.investmentReturn)
    setPostRetirementReturn(formData.postRetirementReturn)
    setInflationRate(formData.inflationRate)

    setLoadedScenarioName(scenarioName)
    setPlanningStarted(true)
    setEditMode(false)

    // Reset Compare Mode state initially
    setIsCompareMode(false)
    setLoadedVariantIds([])
    setClickedVariantIndex(null)

    // Clear variant scenarios initially (will populate if variants found)
    setVariantScenarios([])
    setVariantResultsArray([])
    setVariantScenarioIds([])
    setVariantConfigs([])
    setVariantInsights([])
    setVariantNarratives([])
    setVariantShareTokens([])
    setVariantIsShared([])

    // Store scenario ID if present
    if (scenarioId) {
      setScenarioId(scenarioId)
      console.log(`✅ Loaded scenario ID: ${scenarioId}`)
    }

    // Store sharing state
    if (shareToken || isShared !== undefined) {
      setShareToken(shareToken || null)
      setIsScenarioShared(isShared || false)
    } else {
      setShareToken(null)
      setIsScenarioShared(false)
    }

    // Determine baseline name for fetching variants
    // If loading a variant, use the baseline_snapshot.name; if loading baseline, use scenarioName
    const baselineName = variantMetadata?.baseline_snapshot?.name || scenarioName
    const isLoadingVariant = !!variantMetadata

    // Store variant metadata if present (for legacy single-variant display)
    if (variantMetadata) {
      setLoadedVariantMetadata(variantMetadata)
      console.log(`✅ Loaded variant scenario: ${scenarioName} (type: ${variantMetadata.variant_type})`)

      if (variantScenario) {
        setLoadedVariantScenario(variantScenario)
      }

      if (variantMetadata.baseline_snapshot) {
        setBaselineSnapshot(variantMetadata.baseline_snapshot)
      }
    } else {
      setLoadedVariantMetadata(null)
      setLoadedVariantScenario(null)
      console.log(`✅ Loaded baseline scenario: ${scenarioName}`)

      // Create baseline snapshot from loaded data
      if (results) {
        const snapshot: BaselineSnapshot = {
          name: scenarioName,
          ending_balance: results.final_portfolio_value,
          monthly_spending: formData.monthlySpending || 4000,
          retirement_age: formData.retirementAge || 65,
          cpp_start_age: formData.cppStartAge || 65,
          oas_start_age: 65,
          portfolio_depleted_age: results.portfolio_depleted_age
        }
        setBaselineSnapshot(snapshot)
      }
    }

    // Load stored results and narrative
    if (results) {
      setCalculationResults(results)
      setShowResults(true)
      setJustCalculated(true)
    } else {
      setCalculationResults(null)
      setShowResults(false)
      setJustCalculated(false)
    }

    if (narrative) {
      setBaselineNarrative(narrative)
    } else {
      setBaselineNarrative(null)
    }

    // Fetch all variants for this baseline (Compare Mode)
    try {
      const client = createClient()
      const { data: variants, error } = await getVariantsForBaseline(client, baselineName)

      if (error) {
        console.error('Error fetching variants:', error)
        return
      }

      if (variants && variants.length > 0) {
        console.log(`📊 Found ${variants.length} variants for baseline "${baselineName}"`)

        // Build variant arrays from loaded scenarios
        const loadedScenarios: Scenario[] = []
        const loadedResults: CalculationResults[] = []
        const loadedIds: string[] = []
        const loadedConfigs: Array<Record<string, any> | undefined> = []
        const loadedInsights: string[] = []
        const loadedNarratives: string[] = []
        const loadedShareTokens: (string | null)[] = []
        const loadedIsShared: boolean[] = []
        const loadedSavedVariants: Record<string, { id: string; index: number }> = {}

        let clickedIndex: number | null = null

        for (let i = 0; i < variants.length; i++) {
          const v = variants[i]
          const vInputs = v.inputs as any
          const vMetadata = vInputs?.__metadata as VariantMetadata | undefined

          // Build scenario object from stored inputs
          const vScenario: Scenario = {
            name: v.name,
            basic_inputs: vInputs.basic_inputs,
            assets: vInputs.assets,
            income_sources: vInputs.income_sources,
            expenses: vInputs.expenses,
            assumptions: vInputs.assumptions
          }

          loadedScenarios.push(vScenario)
          loadedResults.push(v.results as unknown as CalculationResults)
          loadedIds.push(v.id)
          loadedConfigs.push(vMetadata?.variant_config)
          loadedInsights.push(vMetadata?.ai_insight || '')
          loadedNarratives.push(vMetadata?.ai_narrative || '')
          loadedShareTokens.push(v.share_token || null)
          loadedIsShared.push(v.is_shared || false)

          // Track saved variant type -> scenario ID mapping
          if (vMetadata?.variant_type) {
            const uiKey = variantTypeToUiKey(vMetadata.variant_type)
            loadedSavedVariants[uiKey] = { id: v.id, index: i }
          }

          // Track if this is the variant the user clicked
          if (isLoadingVariant && v.id === scenarioId) {
            clickedIndex = i
          }
        }

        // Set all variant state
        setVariantScenarios(loadedScenarios)
        setVariantResultsArray(loadedResults)
        setVariantScenarioIds(loadedIds)
        setVariantConfigs(loadedConfigs)
        setVariantInsights(loadedInsights)
        setVariantNarratives(loadedNarratives)
        setVariantShareTokens(loadedShareTokens)
        setVariantIsShared(loadedIsShared)
        setLoadedVariantIds(loadedIds)
        setSavedVariants(loadedSavedVariants)

        // Enter Compare Mode
        setIsCompareMode(true)

        // If user clicked a variant, set the tab to that variant
        // If user clicked a baseline, show the baseline tab
        if (clickedIndex !== null) {
          setClickedVariantIndex(clickedIndex)
          setActiveVariantTab(clickedIndex)
          console.log(`🎯 Auto-selecting variant tab: ${clickedIndex}`)
        } else {
          setActiveVariantTab(-1)  // Show baseline tab when baseline is clicked
          console.log(`🎯 Auto-selecting baseline tab`)
        }

        console.log(`📊 Entered Compare Mode with ${loadedScenarios.length} variants`)
      } else {
        console.log(`📊 No variants found for baseline "${baselineName}" - entering normal edit mode`)
      }
    } catch (err) {
      console.error('Error in Compare Mode setup:', err)
    }
  }

  // Handle successful scenario save (baseline only, not variants)
  const handleSaveSuccess = (newScenarioId: string, newScenarioName: string) => {
    console.log(`💾 Scenario saved successfully - ID: ${newScenarioId}, Name: ${newScenarioName}`)
    setScenarioId(newScenarioId)
    setLoadedScenarioName(newScenarioName)

    // Update baseline snapshot name so variants created after save can link correctly
    // This fixes the issue where variants reference 'Your Baseline' instead of the saved name
    if (baselineSnapshot) {
      setBaselineSnapshot({
        ...baselineSnapshot,
        name: newScenarioName
      })
      console.log(`📸 Updated baseline snapshot name to: ${newScenarioName}`)
    }
  }

  // Handle successful variant save
  const handleVariantSaveSuccess = (newScenarioId: string, newScenarioName: string) => {
    if (savingVariantIndex === null) return
    console.log(`💾 Variant saved successfully - Index: ${savingVariantIndex}, ID: ${newScenarioId}, Name: ${newScenarioName}`)

    // Update the scenario ID for this variant
    setVariantScenarioIds(prev => {
      const updated = [...prev]
      updated[savingVariantIndex] = newScenarioId
      return updated
    })
  }

  // Handle login success
  const handleLoginSuccess = async () => {
    console.log('🔐 Login successful, checking for anonymous scenarios...')
    const anonCount = await getAnonymousScenarioCount()
    console.log(`📊 Found ${anonCount} anonymous scenarios`)

    if (anonCount > 0 && user?.id) {
      setAnonymousUserIdBeforeLogin(user.id)
      setAnonymousScenarioCountBeforeLogin(anonCount)
      setShowMergeModal(true)
    }
  }

  const handleLogout = async () => {
    await logout()
    console.log('👋 Logged out successfully')
  }

  const handleMergeComplete = () => {
    console.log('✅ Merge complete, scenarios should now be visible')
  }

  const handleConfirmRecalculate = () => {
    // Close modal
    setShowRecalculateConfirmModal(false)

    // Clear all variants and loaded variant metadata
    setVariantScenarios([])
    setVariantResultsArray([])
    setVariantConfigs([])
    setLoadedVariantMetadata(null)

    // Proceed with calculation (handleCalculate will be called again without variants active)
    setTimeout(() => {
      const button = document.querySelector('button[data-calculate-button]') as HTMLButtonElement
      if (button) button.click()
    }, 100)
  }

  // Create scenario from current form data
  const createScenarioFromFormData = (): Scenario => {
    const defaultPreRetirementReturn = (investmentReturn || 6) / 100

    const assets: any = {}
    if (rrsp) {
      assets.rrsp = {
        balance: rrsp,
        annual_contribution: rrspContribution || 0,
        rate_of_return: defaultPreRetirementReturn
      }
    }
    if (tfsa) {
      assets.tfsa = {
        balance: tfsa,
        annual_contribution: tfsaContribution || 0,
        rate_of_return: defaultPreRetirementReturn
      }
    }
    if (nonRegistered) {
      assets.non_registered = {
        balance: nonRegistered,
        annual_contribution: nonRegisteredContribution || 0,
        rate_of_return: defaultPreRetirementReturn,
        cost_base: nonRegistered * 0.7
      }
    }

    const income_sources: any = {}
    if (currentIncome && currentIncome > 0) {
      income_sources.employment = {
        annual_amount: currentIncome,
        until_age: retirementAge || 65
      }
    }
    if (cppStartAge) {
      income_sources.cpp = {
        start_age: cppStartAge,
        monthly_amount_at_65: 1364.60
      }
    }
    income_sources.oas = {
      start_age: 65,
      monthly_amount: 713.34
    }

    // Pension as dedicated field (new format)
    if (pensionIncome && pensionIncome > 0) {
      income_sources.pension = {
        annual_amount: pensionIncome,
        start_age: retirementAge || 65,
        indexed_to_inflation: pensionIndexed === true,
        ...(pensionHasBridge === true && {
          has_bridge_benefit: true,
          bridge_reduction_amount: 16374,
          bridge_reduction_age: 65
        })
      }
    }

    // Other income (excludes pension)
    const otherIncomeItems = []
    if (otherIncome && otherIncome > 0) {
      otherIncomeItems.push({
        description: 'Other Income',
        annual_amount: otherIncome,
        start_age: retirementAge || 65,
        indexed_to_inflation: false // Fixed income - does not grow with inflation
      })
    }
    if (otherIncomeItems.length > 0) {
      income_sources.other_income = otherIncomeItems
    }

    return {
      name: loadedScenarioName || 'Current Plan',
      basic_inputs: {
        current_age: currentAge || 0,
        retirement_age: retirementAge || 65,
        longevity_age: longevityAge || 95,
        province: (province as Province) || Province.ON
      },
      assets,
      income_sources,
      expenses: {
        fixed_monthly: monthlySpending || 0,
        indexed_to_inflation: true,
        age_based_changes: []
      },
      assumptions: {
        pre_retirement_return: defaultPreRetirementReturn,
        post_retirement_return: (postRetirementReturn || 4) / 100,
        inflation_rate: (inflationRate || 2) / 100
      }
    }
  }

  // Helper to check if a tab is currently open for a variant type
  const isVariantTabOpen = (type: string): boolean => {
    const namePatterns: Record<string, (name: string) => boolean> = {
      'front_load': (name) => name.includes('Front-Load'),
      'delay_benefits': (name) => name.includes('Delay CPP/OAS'),
      'exhaust': (name) => name.includes('Exhaust'),
      'retire_early': (name) => name.includes('Retire') && name.includes('Earlier'),
      'legacy': (name) => name.includes('Leave') && name.includes('Legacy'),
      'lump_sum': (name) => name.includes('Lump Sum')
    }
    return variantScenarios.some(v => namePatterns[type]?.(v.name))
  }

  // Reopen a saved variant by restoring it to the variant arrays
  const reopenSavedVariant = async (type: string) => {
    const saved = savedVariants[type]
    if (!saved) return

    console.log(`🔄 Reopening saved variant: ${type} (ID: ${saved.id})`)

    // Fetch the variant from the database
    const supabase = createClient()
    const { data: variant, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', saved.id)
      .single()

    if (error || !variant) {
      console.error('Failed to fetch saved variant:', error)
      return
    }

    const vInputs = variant.inputs as any
    const vMetadata = vInputs?.__metadata as VariantMetadata | undefined

    // Build scenario object
    const vScenario: Scenario = {
      name: variant.name,
      basic_inputs: vInputs.basic_inputs,
      assets: vInputs.assets,
      income_sources: vInputs.income_sources,
      expenses: vInputs.expenses,
      assumptions: vInputs.assumptions
    }

    // Add to variant arrays
    setVariantScenarios(prev => [...prev, vScenario])
    setVariantResultsArray(prev => [...prev, variant.results as unknown as CalculationResults])
    setVariantScenarioIds(prev => [...prev, variant.id])
    setVariantConfigs(prev => [...prev, vMetadata?.variant_config])
    setVariantInsights(prev => [...prev, vMetadata?.ai_insight || ''])
    setVariantNarratives(prev => [...prev, vMetadata?.ai_narrative || ''])
    setVariantShareTokens(prev => [...prev, variant.share_token || null])
    setVariantIsShared(prev => [...prev, variant.is_shared || false])

    // Update savedVariants with new index
    const newIndex = variantScenarios.length  // This is the index after adding
    setSavedVariants(prev => ({
      ...prev,
      [type]: { ...prev[type], index: newIndex }
    }))

    // Switch to the reopened tab
    setActiveVariantTab(newIndex)
    console.log(`✅ Variant reopened at tab index: ${newIndex}`)
  }

  // Handle scenario button click
  const handleScenarioClick = (scenarioType: 'front_load' | 'exhaust' | 'legacy' | 'delay_benefits' | 'retire_early' | 'lump_sum') => {
    // Check if this variant is saved but tab is closed
    const isSaved = !!savedVariants[scenarioType]
    const tabOpen = isVariantTabOpen(scenarioType)

    if (isSaved && !tabOpen) {
      // Reopen the saved variant instead of generating new
      reopenSavedVariant(scenarioType)
      return
    }

    // Otherwise, show modal to generate new variant
    setSelectedScenarioType(scenarioType)
    setShowScenarioModal(true)
  }

  // Handle running scenario calculation
  const handleRunScenario = async (config?: any) => {
    if (!monthlySpending || !retirementAge) return

    setIsCalculatingVariant(true)
    setGeneratingVariantType(selectedScenarioType as 'front_load' | 'delay_benefits' | 'exhaust' | 'retire_early' | 'legacy' | 'lump_sum')
    try {
      const baseScenario = createScenarioFromFormData()
      const supabase = createClient()

      console.log('🔍 BASE SCENARIO CPP:', baseScenario.income_sources.cpp)
      console.log('🔍 BASE SCENARIO OAS:', baseScenario.income_sources.oas)

      // Create variant based on selected type
      let variant: Scenario
      let variantConfig: Record<string, any> | undefined
      switch (selectedScenarioType) {
        case 'front_load':
          variant = createFrontLoadVariant(baseScenario)
          break
        case 'delay_benefits':
          variant = createDelayCppOasVariant(baseScenario)
          break
        case 'retire_early': {
          const newRetirementAge = config?.newRetirementAge || baseScenario.basic_inputs.retirement_age - 3
          console.log(`🚀 Creating retire early variant: Age ${newRetirementAge}`)
          variant = createRetireEarlyVariant(baseScenario, newRetirementAge)

          // Store config for regeneration
          variantConfig = {
            newRetirementAge
          }
          break
        }
        case 'exhaust': {
          // Run binary search optimization to find maximum spending
          console.log('💰 Running binary search optimization...')
          const { optimizeSpendingToExhaust } = await import('@/lib/calculations/scenario-optimizer')
          const optimizationResult = await optimizeSpendingToExhaust(supabase, baseScenario)

          console.log(`✅ Optimization complete: $${Math.round(optimizationResult.optimizedSpending)}/mo after ${optimizationResult.iterations} iterations`)

          variant = createExhaustPortfolioVariant(baseScenario, optimizationResult.optimizedSpending)

          // Store optimized spending in config for regeneration
          variantConfig = {
            optimizedSpending: optimizationResult.optimizedSpending,
            iterations: optimizationResult.iterations,
            message: optimizationResult.message
          }
          break
        }
        case 'legacy': {
          const percentage = config?.percentage || 0.25
          console.log(`🏛️  Running legacy optimization for ${(percentage * 100).toFixed(0)}% preservation...`)

          // Run binary search optimization to find spending that preserves legacy target
          const { optimizeSpendingForLegacy } = await import('@/lib/calculations/scenario-optimizer')
          const optimizationResult = await optimizeSpendingForLegacy(supabase, baseScenario, percentage)

          console.log(`✅ Legacy optimization complete: $${Math.round(optimizationResult.optimizedSpending)}/mo preserves $${Math.round(optimizationResult.finalBalance).toLocaleString()} after ${optimizationResult.iterations} iterations`)

          variant = createLegacyVariant(baseScenario, percentage)
          // Override spending with optimized amount
          variant.expenses.fixed_monthly = optimizationResult.optimizedSpending

          // Store percentage and optimized spending in config for regeneration
          variantConfig = {
            percentage,
            optimizedSpending: optimizationResult.optimizedSpending,
            iterations: optimizationResult.iterations,
            finalBalance: optimizationResult.finalBalance
          }
          break
        }
        case 'lump_sum': {
          const amount = config?.amount || 100000
          const withdrawalAge = config?.withdrawalAge || retirementAge + 5
          const sourceAccount = config?.sourceAccount || 'smart'

          console.log(`💵 Creating lump sum withdrawal variant: $${amount.toLocaleString()} at age ${withdrawalAge} from ${sourceAccount}`)

          variant = createLumpSumWithdrawalVariant(baseScenario, amount, withdrawalAge, sourceAccount)

          // Store config for regeneration
          variantConfig = {
            amount,
            withdrawalAge,
            sourceAccount
          }
          break
        }
        default:
          console.error(`Unknown scenario type: ${selectedScenarioType}`)
          return
      }

      console.log('🔍 VARIANT CPP:', variant.income_sources.cpp)
      console.log('🔍 VARIANT OAS:', variant.income_sources.oas)

      // Check if this variant already exists (by name)
      const existingIndex = variantScenarios.findIndex(v => v.name === variant.name)

      // Clear loaded variant metadata (user is creating a NEW variant via what-if button)
      setLoadedVariantMetadata(null)

      const results = await calculateRetirementProjection(supabase, variant)

      console.log('🔍 VARIANT RESULTS:', {
        final_portfolio: results.final_portfolio_value,
        total_cpp: results.total_cpp_received,
        total_oas: results.total_oas_received,
        first_year_income: results.first_year_retirement_income
      })

      // Generate variant insight and narrative (non-blocking - if they fail, continue without them)
      let insight: string | undefined
      let narrative: string | undefined

      try {
        if (calculationResults) {
          // Only generate comparison insight (cheap, useful)
          // Skip full narrative for temporary variants (expensive, repetitive)
          // Narratives only shown for baseline and saved variants

          // Build spending comparison data (particularly important for legacy scenarios)
          const spendingComparison: any = {
            baselineMonthly: baseScenario.expenses.fixed_monthly,
            variantMonthly: variant.expenses.fixed_monthly
          }

          // Add legacy-specific data if this is a legacy variant
          if (selectedScenarioType === 'legacy' && variantConfig) {
            const startingPortfolio =
              (baseScenario.assets.rrsp?.balance || 0) +
              (baseScenario.assets.tfsa?.balance || 0) +
              (baseScenario.assets.non_registered?.balance || 0)

            spendingComparison.legacyPercentage = variantConfig.percentage
            spendingComparison.legacyTarget = startingPortfolio * variantConfig.percentage
          }

          // Build age-based expense changes
          const baselineAgeBasedChanges = baseScenario.expenses.age_based_changes || []
          const variantAgeBasedChanges = variant.expenses.age_based_changes || []

          // Build pension context
          const baselinePensionContext = baseScenario.income_sources.pension ? {
            annual_amount: baseScenario.income_sources.pension.annual_amount,
            indexed_to_inflation: baseScenario.income_sources.pension.indexed_to_inflation,
            has_bridge_benefit: baseScenario.income_sources.pension.has_bridge_benefit || false,
            bridge_reduction_amount: baseScenario.income_sources.pension.bridge_reduction_amount,
            bridge_reduction_age: baseScenario.income_sources.pension.bridge_reduction_age,
            start_age: baseScenario.income_sources.pension.start_age,
          } : undefined

          // Build retirement age comparison (for Retire Early variant)
          const retirementAgeComparison = baseScenario.basic_inputs.retirement_age !== variant.basic_inputs.retirement_age ? {
            baselineRetirementAge: baseScenario.basic_inputs.retirement_age,
            variantRetirementAge: variant.basic_inputs.retirement_age,
          } : undefined

          // Build benefit start age comparison (for Delay Benefits variant)
          const benefitStartAgeComparison = (
            baseScenario.income_sources.cpp?.start_age !== variant.income_sources.cpp?.start_age ||
            baseScenario.income_sources.oas?.start_age !== variant.income_sources.oas?.start_age
          ) ? {
            baselineCPPStartAge: baseScenario.income_sources.cpp?.start_age || 65,
            variantCPPStartAge: variant.income_sources.cpp?.start_age || 65,
            baselineOASStartAge: baseScenario.income_sources.oas?.start_age || 65,
            variantOASStartAge: variant.income_sources.oas?.start_age || 65,
          } : undefined

          const insightResult = await fetch('/api/generate-insight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              baselineResults: calculationResults,
              variantResults: results,
              variantName: variant.name,
              baselineScenarioName: loadedScenarioName || undefined,
              spendingComparison,
              baselineOneTimeWithdrawals: baseScenario.expenses.one_time_withdrawals || [],
              variantOneTimeWithdrawals: variant.expenses.one_time_withdrawals || [],
              baselineAgeBasedChanges,
              variantAgeBasedChanges,
              baselinePensionContext,
              variantPensionContext: undefined, // Pension doesn't change in variants
              retirementAgeComparison,
              benefitStartAgeComparison,
            })
          })
            .then(res => res.json())
            .then(data => data.insight)
            .catch(err => {
              console.error('⚠️  Failed to generate variant insight (non-critical):', err)
              return undefined
            })

          insight = insightResult
          narrative = undefined  // No narrative for temporary variants
        }
      } catch (error) {
        console.error('⚠️  Failed to generate variant AI content (non-critical):', error)
        // Continue without insight/narrative - graceful degradation
      }

      // Update or append to arrays
      if (existingIndex >= 0) {
        // Replace existing variant
        const newScenarios = [...variantScenarios]
        newScenarios[existingIndex] = variant
        setVariantScenarios(newScenarios)

        const newResults = [...variantResultsArray]
        newResults[existingIndex] = results
        setVariantResultsArray(newResults)

        const newInsights = [...variantInsights]
        newInsights[existingIndex] = insight || ''
        setVariantInsights(newInsights)

        const newNarratives = [...variantNarratives]
        newNarratives[existingIndex] = narrative || ''
        setVariantNarratives(newNarratives)

        const newIds = [...variantScenarioIds]
        newIds[existingIndex] = variantScenarioIds[existingIndex]  // Preserve for "update" on save
        setVariantScenarioIds(newIds)

        const newConfigs = [...variantConfigs]
        newConfigs[existingIndex] = variantConfig
        setVariantConfigs(newConfigs)

        // Focus on the replaced variant tab
        setActiveVariantTab(existingIndex)
      } else {
        // Append new variant
        const newIndex = variantScenarios.length
        setVariantScenarios([...variantScenarios, variant])
        setVariantResultsArray([...variantResultsArray, results])
        setVariantInsights([...variantInsights, insight || ''])
        setVariantNarratives([...variantNarratives, narrative || ''])
        setVariantConfigs([...variantConfigs, variantConfig])

        // Focus on the newly created variant tab
        setActiveVariantTab(newIndex)
      }
    } catch (error) {
      console.error('Variant calculation failed:', error)
    } finally {
      setIsCalculatingVariant(false)
      setGeneratingVariantType(null)
    }
  }

  const handleResetVariant = (index?: number) => {
    if (index !== undefined) {
      // Remove specific variant by index
      setVariantScenarios(variantScenarios.filter((_, i) => i !== index))
      setVariantResultsArray(variantResultsArray.filter((_, i) => i !== index))
      setVariantInsights(variantInsights.filter((_, i) => i !== index))
      setVariantNarratives(variantNarratives.filter((_, i) => i !== index))
      setVariantScenarioIds(variantScenarioIds.filter((_, i) => i !== index))
      setVariantConfigs(variantConfigs.filter((_, i) => i !== index))
      setVariantShareTokens(variantShareTokens.filter((_, i) => i !== index))
      setVariantIsShared(variantIsShared.filter((_, i) => i !== index))

      // Adjust active tab after removal
      if (activeVariantTab === index) {
        // If removing the active tab, switch to first variant
        setActiveVariantTab(0)
      } else if (activeVariantTab > index) {
        // If active tab is after the removed tab, decrement index
        setActiveVariantTab(activeVariantTab - 1)
      }
      // Otherwise keep activeVariantTab the same
    } else {
      // Clear all variants
      setVariantScenarios([])
      setVariantResultsArray([])
      setVariantInsights([])
      setVariantNarratives([])
      setVariantScenarioIds([])
      setVariantConfigs([])
      setVariantShareTokens([])
      setVariantIsShared([])
      setActiveVariantTab(0)
    }
  }

  // Convert Scenario to FormData format
  const scenarioToFormData = (scenario: Scenario): FormData => {
    const other = scenario.income_sources.other_income?.find(i => i.description === 'Other Income')

    return {
      currentAge: scenario.basic_inputs.current_age,
      retirementAge: scenario.basic_inputs.retirement_age,
      longevityAge: scenario.basic_inputs.longevity_age,
      province: scenario.basic_inputs.province,
      currentIncome: scenario.income_sources.employment?.annual_amount || null,
      rrspAmount: scenario.assets.rrsp?.balance || null,
      rrspContribution: scenario.assets.rrsp?.annual_contribution || null,
      tfsaAmount: scenario.assets.tfsa?.balance || null,
      tfsaContribution: scenario.assets.tfsa?.annual_contribution || null,
      nonRegisteredAmount: scenario.assets.non_registered?.balance || null,
      nonRegisteredContribution: scenario.assets.non_registered?.annual_contribution || null,
      monthlySpending: scenario.expenses.fixed_monthly,
      pensionIncome: scenario.income_sources.pension?.annual_amount || null,
      pensionIndexed: scenario.income_sources.pension?.indexed_to_inflation ?? null,
      pensionHasBridge: scenario.income_sources.pension?.has_bridge_benefit ?? null,
      otherIncome: other?.annual_amount || null,
      cppStartAge: scenario.income_sources.cpp?.start_age || null,
      investmentReturn: roundPercentage(scenario.assumptions.pre_retirement_return * 100),
      postRetirementReturn: roundPercentage(scenario.assumptions.post_retirement_return * 100),
      inflationRate: roundPercentage(scenario.assumptions.inflation_rate * 100),
    }
  }

  const handleSaveVariant = async (index: number) => {
    // Handle baseline save (index === -1)
    if (index === -1) {
      setShowScenarioSaveModal(true)
      return
    }

    // Validate variant index
    if (index >= variantScenarios.length) return

    // Set loading state and index
    setSavingVariantIndex(index)
    setIsSavingVariantNarrative(true)

    try {
      // Generate narrative for this variant if not already exists
      if (!variantNarratives[index]) {
        console.log(`📝 Generating AI narrative for variant: ${variantScenarios[index].name}`)

        const narrativeResponse = await fetch('/api/generate-narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: variantScenarios[index],
            results: variantResultsArray[index]
          })
        })

        if (narrativeResponse.ok) {
          const data = await narrativeResponse.json()
          const narrative = data.narrative

          // Update variantNarratives array with the new narrative
          const newNarratives = [...variantNarratives]
          newNarratives[index] = narrative || ''
          setVariantNarratives(newNarratives)

          console.log(`✅ AI narrative generated for variant: ${variantScenarios[index].name}`)
        } else {
          console.error('⚠️  Failed to generate variant narrative (non-critical):', await narrativeResponse.text())
          // Continue to save modal anyway - narrative is optional
        }
      } else {
        console.log(`✅ Using existing narrative for variant: ${variantScenarios[index].name}`)
      }
    } catch (error) {
      console.error('⚠️  Failed to generate variant narrative (non-critical):', error)
      // Continue to save modal anyway - narrative is optional
    } finally {
      setIsSavingVariantNarrative(false)
      setShowScenarioSaveModal(true)
    }
  }

  const handleShareChange = (index: number, shareToken: string | null, isShared: boolean) => {
    if (index === -1) {
      // Baseline sharing
      setShareToken(shareToken)
      setIsScenarioShared(isShared)
    } else {
      // Variant sharing
      setVariantShareTokens(prev => {
        const updated = [...prev]
        updated[index] = shareToken
        return updated
      })
      setVariantIsShared(prev => {
        const updated = [...prev]
        updated[index] = isShared
        return updated
      })
    }
  }

  return (
    <div className={`min-h-screen ${theme.background}`}>
      {/* Header */}
      <CalculatorHeader
        isDarkMode={isDarkMode}
        theme={theme}
        isAnonymous={isAnonymous}
        authLoading={authLoading}
        user={user}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-6 lg:space-y-8">
        {/* Mobile Intro - Shown before planning starts OR after calculation, only on mobile */}
        {(!planningStarted || calculationResults) && (
          <MobileIntroCard
            isDarkMode={isDarkMode}
            theme={theme}
            onStartPlanning={handleStartPlanning}
            onLoadScenario={handleLoadScenario}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Sidebar - Help/Tips (40%) - Desktop only */}
          <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-8 lg:self-start">
            <HelpSidebar
              focusedField={focusedField}
              isDarkMode={isDarkMode}
              theme={theme}
              onStartPlanning={handleStartPlanning}
              onLoadScenario={handleLoadScenario}
              planningStarted={planningStarted}
              calculationResults={calculationResults}
              isMandatoryFieldsComplete={isMandatoryFieldsComplete}
            />
          </div>

          {/* Right Column - Form (60%) */}
          <div className="lg:col-span-7">
            <Card className={`border-0 shadow-xl rounded-3xl ${theme.card}`}>
              <CardHeader className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} pb-4 sm:pb-6 px-4 sm:px-6`}>
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className={`text-2xl sm:text-3xl font-bold ${theme.text.primary}`}>
                      Your Details{loadedScenarioName && <span className={`ml-2 text-lg ${theme.text.secondary}`}>- {loadedScenarioName}</span>}
                    </CardTitle>
                  </div>
                  {calculationResults && !loadedVariantMetadata && !isCompareMode && (
                    <Button
                      onClick={() => {
                        if (!editMode) {
                          // Entering edit mode - hide results display to avoid stale data errors
                          setShowResults(false)
                          // Don't clear loadedVariantMetadata here - let it persist until recalculation
                          // This allows users to edit/review without losing variant context
                        } else {
                          // Exiting edit mode - clear focused field to show contextual help
                          setFocusedField(null)
                        }
                        setEditMode(!editMode)
                        setJustCalculated(false)
                      }}
                      variant="outline"
                      className={isDarkMode ? "border-blue-700 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 rounded-xl text-sm sm:text-base flex-shrink-0" : "border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-800 rounded-xl text-sm sm:text-base flex-shrink-0"}
                    >
                      {editMode ? 'Done Editing' : '✏️ Edit'}
                    </Button>
                  )}
                </div>
              </CardHeader>

              {/* Compare Mode Banner */}
              {isCompareMode && (
                <div className={`mx-4 sm:mx-6 mt-4 p-4 rounded-xl border-2 ${
                  isDarkMode
                    ? 'bg-blue-900/30 border-blue-500/50 text-blue-200'
                    : 'bg-orange-50 border-orange-300 text-orange-800'
                }`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-orange-500'}`} />
                      <div>
                        <div className="font-semibold">
                          Compare Mode: {loadedScenarioName} + {variantScenarios.length} variant{variantScenarios.length !== 1 ? 's' : ''}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-orange-600'}`}>
                          Form is locked while comparing scenarios
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleExitCompareMode}
                      variant="outline"
                      size="sm"
                      className={isDarkMode
                        ? 'border-blue-500 text-blue-300 hover:bg-blue-800/50'
                        : 'border-orange-400 text-orange-700 hover:bg-orange-100'
                      }
                    >
                      <X className="w-4 h-4 mr-1" />
                      Exit & Edit
                    </Button>
                  </div>
                </div>
              )}

              <CardContent className={`pt-6 sm:pt-8 px-4 sm:px-6 ${planningStarted ? 'pb-[25vh] lg:pb-6' : ''}`}>
                <FormSections
                  currentAge={currentAge}
                  retirementAge={retirementAge}
                  longevityAge={longevityAge}
                  currentIncome={currentIncome}
                  province={province}
                  rrsp={rrsp}
                  rrspContribution={rrspContribution}
                  tfsa={tfsa}
                  tfsaContribution={tfsaContribution}
                  nonRegistered={nonRegistered}
                  nonRegisteredContribution={nonRegisteredContribution}
                  monthlySpending={monthlySpending}
                  pensionIncome={pensionIncome}
                  pensionIndexed={pensionIndexed}
                  pensionHasBridge={pensionHasBridge}
                  otherIncome={otherIncome}
                  cppStartAge={cppStartAge}
                  investmentReturn={investmentReturn}
                  postRetirementReturn={postRetirementReturn}
                  inflationRate={inflationRate}
                  editMode={editMode}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  calculationResults={calculationResults}
                  setCurrentAge={setCurrentAge}
                  setRetirementAge={setRetirementAge}
                  setLongevityAge={setLongevityAge}
                  setCurrentIncome={setCurrentIncome}
                  setProvince={setProvince}
                  setRrsp={setRrsp}
                  setRrspContribution={setRrspContribution}
                  setTfsa={setTfsa}
                  setTfsaContribution={setTfsaContribution}
                  setNonRegistered={setNonRegistered}
                  setNonRegisteredContribution={setNonRegisteredContribution}
                  setMonthlySpending={setMonthlySpending}
                  setPensionIncome={setPensionIncome}
                  setPensionIndexed={setPensionIndexed}
                  setPensionHasBridge={setPensionHasBridge}
                  setOtherIncome={setOtherIncome}
                  setCppStartAge={setCppStartAge}
                  setInvestmentReturn={setInvestmentReturn}
                  setPostRetirementReturn={setPostRetirementReturn}
                  setInflationRate={setInflationRate}
                  setEditMode={setEditMode}
                  onFieldFocus={setFocusedField}
                  isCompareMode={isCompareMode}
                />

                {/* Calculate Button */}
                <div className="mt-6 sm:mt-8">
                  <CalculateButton
                    isCalculating={isCalculating}
                    isMandatoryFieldsComplete={isMandatoryFieldsComplete()}
                    editMode={editMode}
                    calculationResults={calculationResults}
                    justCalculated={justCalculated}
                    theme={theme}
                    onClick={handleCalculate}
                    loadedVariantMetadata={loadedVariantMetadata}
                    isCompareMode={isCompareMode}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results Section - Full Width Below Form */}
        {calculationResults && (
          <div ref={resultsRef} className="w-full" style={{ marginTop: '128px' }}>
            <div className="text-center mb-8">
              <h2 className={`text-3xl sm:text-4xl font-bold ${theme.text.primary} mb-4`}>Your Retirement Projection</h2>

              {/* What-If Scenarios Buttons */}
              <WhatIfScenarioButtons
                isDarkMode={isDarkMode}
                theme={theme}
                loadedVariantMetadata={loadedVariantMetadata}
                variantScenarios={variantScenarios}
                savedVariants={savedVariants}
                generatingVariantType={generatingVariantType}
                onScenarioClick={handleScenarioClick}
              />
            </div>

            {/* Baseline Results (shown only when NO variants active) */}
            {variantScenarios.length === 0 && (
              <BaselineResults
                calculationResults={calculationResults}
                retirementAge={loadedVariantScenario?.basic_inputs.retirement_age || retirementAge || 65}
                isDarkMode={isDarkMode}
                baselineNarrative={baselineNarrative}
                loadedVariantMetadata={loadedVariantMetadata}
                baselineScenario={loadedVariantScenario || createScenarioFromFormData()}
                scenarioId={scenarioId}
                loadedScenarioName={loadedScenarioName}
                isAnonymous={isAnonymous}
                theme={theme}
                onSaveClick={() => {
                  console.log('💾 Save Scenario clicked - isAnonymous:', isAnonymous, 'user:', user)
                  if (isAnonymous) {
                    console.log('💾 Opening SaveWithAccountModal (anonymous user)')
                    setShowSaveWithAccountModal(true)
                  } else {
                    console.log('💾 Opening SaveScenarioModal (authenticated user)')
                    setShowScenarioSaveModal(true)
                  }
                }}
                onShareClick={() => setShowShareModal(true)}
              />
            )}

            {/* Scenario Comparison Tabs (shown when variants exist) */}
            {variantScenarios.length > 0 && variantResultsArray.length > 0 && (() => {
              const baseScenario = createScenarioFromFormData()
              const reconstructedBaseline = loadedVariantMetadata && baselineSnapshot
                ? {
                    ...baseScenario,
                    basic_inputs: {
                      ...baseScenario.basic_inputs,
                      retirement_age: baselineSnapshot.retirement_age
                    },
                    income_sources: {
                      ...baseScenario.income_sources,
                      employment: baseScenario.income_sources.employment ? {
                        annual_amount: baseScenario.income_sources.employment.annual_amount,
                        until_age: baselineSnapshot.retirement_age
                      } : undefined,
                      cpp: baseScenario.income_sources.cpp ? {
                        monthly_amount_at_65: baseScenario.income_sources.cpp.monthly_amount_at_65,
                        start_age: baselineSnapshot.cpp_start_age
                      } : undefined,
                      oas: baseScenario.income_sources.oas ? {
                        monthly_amount: baseScenario.income_sources.oas.monthly_amount,
                        start_age: baselineSnapshot.oas_start_age
                      } : undefined
                    },
                    expenses: {
                      ...baseScenario.expenses,
                      fixed_monthly: baselineSnapshot.monthly_spending
                    }
                  } as Scenario
                : baseScenario

              return (
                <ScenarioComparison
                  baselineScenario={reconstructedBaseline}
                  baselineResults={calculationResults}
                baselineNarrative={baselineNarrative}
                baselineScenarioId={scenarioId}
                baselineScenarioName={loadedScenarioName || undefined}
                baselineShareToken={shareToken}
                baselineIsShared={isScenarioShared}
                variantScenarios={variantScenarios}
                variantResults={variantResultsArray}
                variantInsights={variantInsights}
                variantNarratives={variantNarratives}
                variantScenarioIds={variantScenarioIds}
                variantShareTokens={variantShareTokens}
                variantIsShared={variantIsShared}
                isDarkMode={isDarkMode}
                activeTab={activeVariantTab}
                onTabChange={setActiveVariantTab}
                onSave={handleSaveVariant}
                onShareChange={handleShareChange}
                onReset={handleResetVariant}
                isSavingNarrative={isSavingVariantNarrative}
              />
            )})()}

            {/* Calculation Disclosure */}
            <CalculationDisclosure isDark={isDarkMode} />
          </div>
        )}
      </div>

      {/* Modals */}
      <SaveWithAccountModal
        isOpen={showSaveWithAccountModal}
        onClose={() => setShowSaveWithAccountModal(false)}
        formData={getCurrentFormData()}
        calculationResults={calculationResults}
        onSaveSuccess={handleSaveSuccess}
      />

      <SaveScenarioModal
        isOpen={showScenarioSaveModal}
        onClose={() => {
          setShowScenarioSaveModal(false)
          setSavingVariantIndex(null)
        }}
        formData={savingVariantIndex !== null && variantScenarios[savingVariantIndex] ? scenarioToFormData(variantScenarios[savingVariantIndex]) : getCurrentFormData()}
        calculationResults={savingVariantIndex !== null && variantResultsArray[savingVariantIndex] ? variantResultsArray[savingVariantIndex] : calculationResults}
        isDarkMode={isDarkMode}
        defaultName={savingVariantIndex !== null && variantScenarios[savingVariantIndex] ? variantScenarios[savingVariantIndex].name : scenarioId ? loadedScenarioName || undefined : undefined}
        variantType={savingVariantIndex !== null && variantScenarios[savingVariantIndex] ? detectVariantTypeFromName(variantScenarios[savingVariantIndex].name) || undefined : loadedVariantMetadata?.variant_type}
        variantConfig={savingVariantIndex !== null ? variantConfigs[savingVariantIndex] : loadedVariantMetadata?.variant_config}
        scenarioId={savingVariantIndex !== null ? variantScenarioIds[savingVariantIndex] : scenarioId}
        baselineScenarioName={savingVariantIndex !== null ? (loadedScenarioName || 'Your Baseline') : undefined}
        baselineResults={savingVariantIndex !== null ? (calculationResults ?? undefined) : undefined}
        baselineSnapshot={savingVariantIndex !== null || loadedVariantMetadata ? baselineSnapshot : undefined}
        aiInsight={savingVariantIndex !== null && variantInsights[savingVariantIndex] ? variantInsights[savingVariantIndex] : loadedVariantMetadata?.ai_insight}
        aiNarrative={savingVariantIndex !== null && variantNarratives[savingVariantIndex] ? variantNarratives[savingVariantIndex] : baselineNarrative || undefined}
        onSaveSuccess={savingVariantIndex === null ? handleSaveSuccess : handleVariantSaveSuccess}
        scenario={savingVariantIndex !== null && variantScenarios[savingVariantIndex] ? variantScenarios[savingVariantIndex] : loadedVariantScenario || undefined}
      />

      <ShareScenarioModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        scenarioId={scenarioId || ''}
        scenarioName={loadedScenarioName || 'Unnamed Scenario'}
        existingShareToken={shareToken}
        isCurrentlyShared={isScenarioShared}
        isDarkMode={isDarkMode}
        onSharingChange={(token, shared) => {
          setShareToken(token)
          setIsScenarioShared(shared)
        }}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={isDarkMode}
      />

      {anonymousUserIdBeforeLogin && user && (
        <MergeAnonymousScenariosModal
          isOpen={showMergeModal}
          onClose={() => setShowMergeModal(false)}
          anonymousUserId={anonymousUserIdBeforeLogin}
          authenticatedUserId={user.id}
          anonymousScenarioCount={anonymousScenarioCountBeforeLogin}
          onMergeComplete={handleMergeComplete}
          isDarkMode={isDarkMode}
        />
      )}

      <ScenarioModal
        isOpen={showScenarioModal}
        onClose={() => setShowScenarioModal(false)}
        scenarioType={selectedScenarioType}
        baselineMonthly={monthlySpending || 0}
        retirementAge={retirementAge || 65}
        currentAge={currentAge || 18}
        longevityAge={longevityAge || 95}
        totalAssets={(rrsp || 0) + (tfsa || 0) + (nonRegistered || 0)}
        rrspBalance={rrsp || 0}
        tfsaBalance={tfsa || 0}
        nonRegisteredBalance={nonRegistered || 0}
        cppStartAge={cppStartAge || 65}
        oasStartAge={65}
        isDarkMode={isDarkMode}
        onRun={handleRunScenario}
      />

      <RecalculateConfirmModal
        isOpen={showRecalculateConfirmModal}
        onClose={() => setShowRecalculateConfirmModal(false)}
        onConfirm={handleConfirmRecalculate}
        variantName={variantScenarios.length === 1 ? variantScenarios[0].name : `${variantScenarios.length} active variants`}
        isDarkMode={isDarkMode}
      />

      {/* Mobile Help Banner (Auto-showing) */}
      <MobileHelpBanner
        focusedField={focusedField}
        isDarkMode={isDarkMode}
        theme={theme}
        planningStarted={planningStarted}
      />
    </div>
  )
}
