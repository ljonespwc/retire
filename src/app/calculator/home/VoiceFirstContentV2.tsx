'use client'

import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useConfetti } from '@/hooks/useConfetti'
import { useState, useRef, useEffect } from 'react'
import { Province } from '@/types/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Calculator, Share2, X } from 'lucide-react'
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
import { createFrontLoadVariant, createDelayCppOasVariant, createExhaustPortfolioVariant, createRetireEarlyVariant, createLegacyVariant, createLumpSumWithdrawalVariant, createLongevityVariant, createPartTimeWorkVariant, createMarketCrashVariant, createMoveProvincesVariant, createReceiveInheritanceVariant, createDownsizeHomeVariant } from '@/lib/calculations/scenario-variants'
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
import { StaleResultsBanner } from '@/components/calculator/StaleResultsBanner'
import posthog from 'posthog-js'

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

  // Stale results tracking - detect when form values differ from last calculation
  const [resultsAreStale, setResultsAreStale] = useState(false)
  const [lastCalculatedFormValues, setLastCalculatedFormValues] = useState<Record<string, any> | null>(null)

  // UI state
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
  const [selectedScenarioType, setSelectedScenarioType] = useState<'front_load' | 'exhaust' | 'legacy' | 'delay_benefits' | 'retire_early' | 'lump_sum' | 'longevity' | 'part_time_work' | 'market_crash' | 'move_provinces' | 'receive_inheritance' | 'downsize_home'>('front_load')
  const [variantScenarios, setVariantScenarios] = useState<Scenario[]>([])
  const [variantResultsArray, setVariantResultsArray] = useState<CalculationResults[]>([])
  const [variantInsights, setVariantInsights] = useState<string[]>([])
  const [variantNarratives, setVariantNarratives] = useState<string[]>([])
  const [variantScenarioIds, setVariantScenarioIds] = useState<(string | undefined)[]>([])
  const [variantConfigs, setVariantConfigs] = useState<Array<Record<string, any> | undefined>>([])
  const [isCalculatingVariant, setIsCalculatingVariant] = useState(false)
  const [generatingVariantType, setGeneratingVariantType] = useState<'front_load' | 'delay_benefits' | 'exhaust' | 'retire_early' | 'legacy' | 'lump_sum' | 'longevity' | 'part_time_work' | 'market_crash' | 'move_provinces' | 'receive_inheritance' | 'downsize_home' | null>(null)
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
  const [showEditWarningModal, setShowEditWarningModal] = useState(false)
  const [anonymousUserIdBeforeLogin, setAnonymousUserIdBeforeLogin] = useState<string | null>(null)
  const [anonymousScenarioCountBeforeLogin, setAnonymousScenarioCountBeforeLogin] = useState(0)

  // Compare Mode state - when baseline + variants are loaded together
  const [isCompareMode, setIsCompareMode] = useState(false)
  const [loadedVariantIds, setLoadedVariantIds] = useState<string[]>([])
  const [clickedVariantIndex, setClickedVariantIndex] = useState<number | null>(null)

  // Dropdown refresh coordination - increment to trigger scenario list refresh
  const [dropdownRefreshKey, setDropdownRefreshKey] = useState(0)


  const resultsRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to results when they appear
  useEffect(() => {
    if (calculationResults && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [calculationResults])

  // PostHog: Track calculator page view
  useEffect(() => {
    posthog.capture('calculator_page_viewed')
  }, [])

  // Detect when form values change after calculation (stale results)
  useEffect(() => {
    if (!lastCalculatedFormValues || !calculationResults) {
      setResultsAreStale(false)
      return
    }

    const current = {
      currentAge, retirementAge, longevityAge, province,
      rrsp, tfsa, nonRegistered, monthlySpending,
      pensionIncome, pensionIndexed, pensionHasBridge,
      otherIncome, cppStartAge, investmentReturn,
      postRetirementReturn, inflationRate,
      rrspContribution, tfsaContribution, nonRegisteredContribution,
      currentIncome
    }

    const isStale = Object.keys(current).some(key => {
      const currentVal = current[key as keyof typeof current]
      const lastVal = lastCalculatedFormValues[key]
      return currentVal !== lastVal
    })

    setResultsAreStale(isStale)
  }, [
    currentAge, retirementAge, longevityAge, province,
    rrsp, tfsa, nonRegistered, monthlySpending,
    pensionIncome, pensionIndexed, pensionHasBridge,
    otherIncome, cppStartAge, investmentReturn,
    postRetirementReturn, inflationRate,
    rrspContribution, tfsaContribution, nonRegisteredContribution,
    currentIncome, lastCalculatedFormValues, calculationResults
  ])

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

  // Confetti celebration effect
  const { startConfetti, stopConfetti } = useConfetti()

  // Handle Start Fresh button
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

    // PostHog: Track when user starts/restarts planning from calculator
    posthog.capture('planning_started', {
      source: 'calculator'
    })

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

    // Clear calculation results and stale tracking
    setShowResults(false)
    setCalculationResults(null)
    setBaselineNarrative(null)
    setLastCalculatedFormValues(null)
    setResultsAreStale(false)

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
        scenario = regenerateVariant(scenario, loadedVariantMetadata.variant_type, loadedVariantMetadata.variant_config)
      }

      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      })

      const data = await response.json()

      if (data.success && data.results) {
        setCalculationResults(data.results)
        setBaselineNarrative(data.narrative || null)

        // PostHog: Track calculation completed
        const totalAssets = (rrsp || 0) + (tfsa || 0) + (nonRegistered || 0)
        const assetRange = totalAssets < 100000 ? 'under_100k' :
                          totalAssets < 500000 ? '100k_500k' :
                          totalAssets < 1000000 ? '500k_1m' :
                          totalAssets < 2000000 ? '1m_2m' : 'over_2m'
        posthog.capture('calculation_completed', {
          province,
          retirement_age: retirementAge,
          has_pension: !!pensionIncome,
          total_assets_range: assetRange
        })

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

          // Clear scenario tracking for fresh calculations (enables save button)
          // After save, scenarioId gets set again, hiding the save button
          setScenarioId(undefined)
          setLoadedScenarioName(null)
        }

        // Capture form snapshot for stale detection
        setLastCalculatedFormValues({
          currentAge, retirementAge, longevityAge, province,
          rrsp, tfsa, nonRegistered, monthlySpending,
          pensionIncome, pensionIndexed, pensionHasBridge,
          otherIncome, cppStartAge, investmentReturn,
          postRetirementReturn, inflationRate,
          rrspContribution, tfsaContribution, nonRegisteredContribution,
          currentIncome
        })
        setResultsAreStale(false)

        setShowResults(true)
        stopConfetti() // Stop fireworks when results render
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

    // Set form snapshot for loaded scenario (so changes after load are detected as stale)
    setLastCalculatedFormValues({
      currentAge: formData.currentAge,
      retirementAge: formData.retirementAge,
      longevityAge: formData.longevityAge,
      province: formData.province,
      rrsp: formData.rrspAmount,
      tfsa: formData.tfsaAmount,
      nonRegistered: formData.nonRegisteredAmount,
      monthlySpending: formData.monthlySpending,
      pensionIncome: formData.pensionIncome,
      pensionIndexed: formData.pensionIndexed,
      pensionHasBridge: formData.pensionHasBridge,
      otherIncome: formData.otherIncome,
      cppStartAge: formData.cppStartAge,
      investmentReturn: formData.investmentReturn,
      postRetirementReturn: formData.postRetirementReturn,
      inflationRate: formData.inflationRate,
      rrspContribution: formData.rrspContribution,
      tfsaContribution: formData.tfsaContribution,
      nonRegisteredContribution: formData.nonRegisteredContribution,
      currentIncome: formData.currentIncome
    })
    setResultsAreStale(false)

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
    }

    // Store sharing state
    if (shareToken || isShared !== undefined) {
      setShareToken(shareToken || null)
      setIsScenarioShared(isShared || false)
    } else {
      setShareToken(null)
      setIsScenarioShared(false)
    }

    // Determine baseline ID for fetching what-if scenarios
    // If loading a variant, use the metadata's created_from_baseline_id; if loading baseline, use scenarioId
    const baselineIdForQuery = variantMetadata?.created_from_baseline_id || (!variantMetadata ? scenarioId : undefined)
    const isLoadingVariant = !!variantMetadata

    // Store variant metadata if present (for legacy single-variant display)
    if (variantMetadata) {
      setLoadedVariantMetadata(variantMetadata)

      if (variantScenario) {
        setLoadedVariantScenario(variantScenario)
      }

      if (variantMetadata.baseline_snapshot) {
        setBaselineSnapshot(variantMetadata.baseline_snapshot)
      }
    } else {
      setLoadedVariantMetadata(null)
      setLoadedVariantScenario(null)

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
    } else {
      setCalculationResults(null)
      setShowResults(false)
    }

    if (narrative) {
      setBaselineNarrative(narrative)
    } else {
      setBaselineNarrative(null)
    }

    // Fetch all what-if scenarios for this baseline (Compare Mode)
    try {
      const client = createClient()
      const { data: variants, error } = await getVariantsForBaseline(client, baselineIdForQuery)

      if (error) {
        console.error('Error fetching variants:', error)
        return
      }

      if (variants && variants.length > 0) {
        // Sort variants by fixed button order (matching what-if button layout)
        const variantTypeOrder = ['front-load', 'delay-cpp-oas', 'exhaust-portfolio', 'retire-early', 'legacy', 'lump-sum']
        const sortedVariants = [...variants].sort((a, b) => {
          const aType = (a.inputs as any)?.__metadata?.variant_type || ''
          const bType = (b.inputs as any)?.__metadata?.variant_type || ''
          const aIndex = variantTypeOrder.indexOf(aType)
          const bIndex = variantTypeOrder.indexOf(bType)
          // Unknown types go to end
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
        })

        // Build variant arrays from loaded scenarios
        const loadedScenarios: Scenario[] = []
        const loadedResults: CalculationResults[] = []
        const loadedIds: string[] = []
        const loadedConfigs: Array<Record<string, any> | undefined> = []
        const loadedInsights: string[] = []
        const loadedNarratives: string[] = []
        const loadedShareTokens: (string | null)[] = []
        const loadedIsShared: boolean[] = []

        let clickedIndex: number | null = null

        for (let i = 0; i < sortedVariants.length; i++) {
          const v = sortedVariants[i]
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

        // Enter Compare Mode
        setIsCompareMode(true)

        // If user clicked a variant, set the tab to that variant
        // If user clicked a baseline, show the baseline tab
        if (clickedIndex !== null) {
          setClickedVariantIndex(clickedIndex)
          setActiveVariantTab(clickedIndex)
        } else {
          setActiveVariantTab(-1)  // Show baseline tab when baseline is clicked
        }
      }
    } catch (err) {
      console.error('Error in Compare Mode setup:', err)
    }
  }

  // Handle successful scenario save (baseline only, not variants)
  const handleSaveSuccess = (newScenarioId: string, newScenarioName: string) => {
    setScenarioId(newScenarioId)
    setLoadedScenarioName(newScenarioName)

    // Update baseline snapshot name so variants created after save can link correctly
    // This fixes the issue where variants reference 'Your Baseline' instead of the saved name
    if (baselineSnapshot) {
      setBaselineSnapshot({
        ...baselineSnapshot,
        name: newScenarioName
      })
    }

    // Trigger dropdown refresh so new/updated scenario appears in list
    setDropdownRefreshKey(prev => prev + 1)
  }

  // Handle successful variant save
  const handleVariantSaveSuccess = (newScenarioId: string, newScenarioName: string) => {
    if (savingVariantIndex === null) return

    // Update the scenario ID for this variant
    setVariantScenarioIds(prev => {
      const updated = [...prev]
      updated[savingVariantIndex] = newScenarioId
      return updated
    })

    // Trigger dropdown refresh so new variant appears in list
    setDropdownRefreshKey(prev => prev + 1)
  }

  // Handle scenario deletion from dropdown
  const handleScenarioDeleted = (deletedScenarioId: string) => {
    // Only reset if the deleted scenario is the currently loaded one
    if (scenarioId === deletedScenarioId) {
      // Full reset - same as handleStartPlanning
      handleStartPlanning()
    }
  }

  // Handle login success
  const handleLoginSuccess = async () => {
    const anonCount = await getAnonymousScenarioCount()

    if (anonCount > 0 && user?.id) {
      setAnonymousUserIdBeforeLogin(user.id)
      setAnonymousScenarioCountBeforeLogin(anonCount)
      setShowMergeModal(true)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleMergeComplete = () => {
    // Merge complete, scenarios should now be visible
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

  // Handle confirmation to enter edit mode (when variants exist)
  const handleConfirmEdit = () => {
    // Close modal
    setShowEditWarningModal(false)

    // Hide results (variants will be cleared when user recalculates)
    setShowResults(false)
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

  // Handle scenario button click
  const handleScenarioClick = (scenarioType: 'front_load' | 'exhaust' | 'legacy' | 'delay_benefits' | 'retire_early' | 'lump_sum' | 'longevity' | 'part_time_work' | 'market_crash' | 'move_provinces' | 'receive_inheritance' | 'downsize_home') => {
    setSelectedScenarioType(scenarioType)
    setShowScenarioModal(true)
  }

  // Handle running scenario calculation
  const handleRunScenario = async (config?: any) => {
    if (!monthlySpending || !retirementAge) return

    setIsCalculatingVariant(true)
    setGeneratingVariantType(selectedScenarioType as 'front_load' | 'delay_benefits' | 'exhaust' | 'retire_early' | 'legacy' | 'lump_sum' | 'longevity' | 'part_time_work' | 'market_crash' | 'move_provinces' | 'receive_inheritance' | 'downsize_home')
    try {
      const baseScenario = createScenarioFromFormData()
      const supabase = createClient()

      // Create variant based on selected type
      let variant: Scenario
      let variantConfig: Record<string, any> | undefined
      switch (selectedScenarioType) {
        case 'front_load':
          variant = createFrontLoadVariant(baseScenario)
          variantConfig = { variant_type: 'front-load' }
          break
        case 'delay_benefits':
          variant = createDelayCppOasVariant(baseScenario)
          variantConfig = { variant_type: 'delay-cpp-oas' }
          break
        case 'retire_early': {
          const newRetirementAge = config?.newRetirementAge || baseScenario.basic_inputs.retirement_age - 3
          variant = createRetireEarlyVariant(baseScenario, newRetirementAge)

          // Store config for regeneration
          variantConfig = {
            variant_type: 'retire-early',
            newRetirementAge
          }
          break
        }
        case 'exhaust': {
          // Run binary search optimization to find maximum spending
          const { optimizeSpendingToExhaust } = await import('@/lib/calculations/scenario-optimizer')
          const optimizationResult = await optimizeSpendingToExhaust(supabase, baseScenario)

          variant = createExhaustPortfolioVariant(baseScenario, optimizationResult.optimizedSpending)

          // Store optimized spending in config for regeneration
          variantConfig = {
            variant_type: 'exhaust-portfolio',
            optimizedSpending: optimizationResult.optimizedSpending,
            iterations: optimizationResult.iterations,
            message: optimizationResult.message
          }
          break
        }
        case 'legacy': {
          const percentage = config?.percentage || 0.25

          // Run binary search optimization to find spending that preserves legacy target
          const { optimizeSpendingForLegacy } = await import('@/lib/calculations/scenario-optimizer')
          const optimizationResult = await optimizeSpendingForLegacy(supabase, baseScenario, percentage)

          variant = createLegacyVariant(baseScenario, percentage)
          // Override spending with optimized amount
          variant.expenses.fixed_monthly = optimizationResult.optimizedSpending

          // Store percentage and optimized spending in config for regeneration
          variantConfig = {
            variant_type: 'legacy',
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

          variant = createLumpSumWithdrawalVariant(baseScenario, amount, withdrawalAge, sourceAccount)

          // Store config for regeneration
          variantConfig = {
            variant_type: 'lump-sum',
            amount,
            withdrawalAge,
            sourceAccount
          }
          break
        }
        case 'longevity': {
          const newLongevityAge = config?.newLongevityAge || 100

          variant = createLongevityVariant(baseScenario, newLongevityAge)

          // Store config for regeneration
          variantConfig = {
            variant_type: 'longevity',
            newLongevityAge
          }
          break
        }
        case 'part_time_work': {
          const incomePercentage = config?.incomePercentage || 0.25
          const durationYears = config?.durationYears || 5

          variant = createPartTimeWorkVariant(baseScenario, incomePercentage, durationYears)

          // Store config for regeneration
          variantConfig = {
            variant_type: 'part-time-work',
            incomePercentage,
            durationYears
          }
          break
        }
        case 'market_crash': {
          const crashMagnitude = config?.crashMagnitude || -0.40
          const recoveryYears = config?.recoveryYears || 5

          variant = createMarketCrashVariant(baseScenario, crashMagnitude, recoveryYears)

          // Store config for regeneration
          variantConfig = {
            variant_type: 'market-crash',
            crashMagnitude,
            recoveryYears
          }
          break
        }
        case 'move_provinces': {
          const newProvince = (config?.newProvince || 'AB') as Province
          const moveAge = config?.moveAge || baseScenario.basic_inputs.retirement_age

          variant = createMoveProvincesVariant(baseScenario, newProvince, moveAge)

          // Store config for regeneration
          variantConfig = {
            variant_type: 'move-provinces',
            newProvince,
            moveAge
          }
          break
        }
        case 'receive_inheritance': {
          const amount = config?.amount || 200000
          const receiveAge = config?.receiveAge || baseScenario.basic_inputs.retirement_age + 5
          const sourceType = config?.sourceType || 'cash'

          variant = createReceiveInheritanceVariant(baseScenario, amount, receiveAge, sourceType)

          // Store config for regeneration
          variantConfig = {
            variant_type: 'receive-inheritance',
            amount,
            receiveAge,
            sourceType
          }
          break
        }
        case 'downsize_home': {
          const currentHomeValue = config?.currentHomeValue || 800000
          const downsizeAge = config?.downsizeAge || baseScenario.basic_inputs.retirement_age + 5
          const buyOrRent = config?.buyOrRent || 'buy'
          const newCostOrRent = config?.newCostOrRent || 400000
          const sellingCostsPct = config?.sellingCostsPct || 0.05

          variant = createDownsizeHomeVariant(baseScenario, currentHomeValue, downsizeAge, buyOrRent, newCostOrRent, sellingCostsPct)

          // Store config for regeneration
          variantConfig = {
            variant_type: 'downsize-home',
            currentHomeValue,
            downsizeAge,
            buyOrRent,
            newCostOrRent,
            sellingCostsPct
          }
          break
        }
        default:
          return
      }

      // Check if a variant of this type already exists (by pattern matching, same as WhatIfScenarioButtons)
      const namePatterns: Record<string, (name: string) => boolean> = {
        'front_load': (name) => name.includes('Front-Load'),
        'delay_benefits': (name) => name.includes('Delay CPP/OAS'),
        'exhaust': (name) => name.includes('Exhaust'),
        'retire_early': (name) => name.includes('Retire') && name.includes('Earlier'),
        'legacy': (name) => name.includes('Leave') && name.includes('Legacy'),
        'lump_sum': (name) => name.includes('Lump Sum'),
        'longevity': (name) => name.includes('Live to'),
        'part_time_work': (name) => name.includes('Part-Time'),
        'market_crash': (name) => name.includes('Markets Crash') || name.includes('Crash'),
        'move_provinces': (name) => name.includes('Move to'),
        'receive_inheritance': (name) => name.includes('Inherit'),
        'downsize_home': (name) => name.includes('Downsize') || name.includes('Sell & Rent')
      }
      const pattern = namePatterns[selectedScenarioType]
      const existingIndex = pattern ? variantScenarios.findIndex(v => pattern(v.name)) : -1

      // Clear loaded variant metadata (user is creating a NEW variant via what-if button)
      setLoadedVariantMetadata(null)

      const results = await calculateRetirementProjection(supabase, variant)

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

          // Build move provinces context (for Move Provinces variant)
          const moveProvincesContext = selectedScenarioType === 'move_provinces' && variantConfig ? {
            fromProvince: baseScenario.basic_inputs.province,
            toProvince: variantConfig.newProvince as string,
            moveAge: variantConfig.moveAge as number,
          } : undefined

          // Build receive inheritance context (for Receive Inheritance variant)
          const receiveInheritanceContext = selectedScenarioType === 'receive_inheritance' && variantConfig ? {
            amount: variantConfig.amount as number,
            receiveAge: variantConfig.receiveAge as number,
            sourceType: (variantConfig.sourceType || 'cash') as 'cash' | 'rrsp_inherited' | 'investments' | 'property',
            isTaxable: variantConfig.sourceType === 'rrsp_inherited',
          } : undefined

          // Build downsize home context (for Downsize Home variant)
          const downsizeHomeContext = selectedScenarioType === 'downsize_home' && variantConfig ? {
            currentHomeValue: variantConfig.currentHomeValue as number,
            netProceeds: variantConfig.netProceeds as number,
            downsizeAge: variantConfig.downsizeAge as number,
            strategy: (variantConfig.buyOrRent || 'buy') as 'buy' | 'rent',
            newCostOrRent: variantConfig.newCostOrRent as number,
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
              moveProvincesContext,
              receiveInheritanceContext,
              downsizeHomeContext,
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

      // PostHog: Track what-if variant created
      posthog.capture('what_if_created', {
        variant_type: selectedScenarioType
      })
    } catch (error) {
      console.error('Variant calculation failed:', error)
    } finally {
      setIsCalculatingVariant(false)
      setGeneratingVariantType(null)
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
        } else {
          console.error('⚠️  Failed to generate variant narrative (non-critical):', await narrativeResponse.text())
          // Continue to save modal anyway - narrative is optional
        }
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

  // Remove a variant tab
  const handleRemoveVariant = (index: number) => {
    // Remove from all variant arrays
    setVariantScenarios(prev => prev.filter((_, i) => i !== index))
    setVariantResultsArray(prev => prev.filter((_, i) => i !== index))
    setVariantInsights(prev => prev.filter((_, i) => i !== index))
    setVariantNarratives(prev => prev.filter((_, i) => i !== index))
    setVariantScenarioIds(prev => prev.filter((_, i) => i !== index))
    setVariantConfigs(prev => prev.filter((_, i) => i !== index))
    setVariantShareTokens(prev => prev.filter((_, i) => i !== index))
    setVariantIsShared(prev => prev.filter((_, i) => i !== index))

    // Adjust active tab if needed
    if (activeVariantTab >= index && activeVariantTab > 0) {
      setActiveVariantTab(activeVariantTab - 1)
    } else if (variantScenarios.length === 1) {
      // If removing the last variant, switch to baseline
      setActiveVariantTab(-1)
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
            onScenarioDeleted={handleScenarioDeleted}
            dropdownRefreshTrigger={dropdownRefreshKey}
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
              onScenarioDeleted={handleScenarioDeleted}
              dropdownRefreshTrigger={dropdownRefreshKey}
              planningStarted={planningStarted}
              calculationResults={calculationResults}
              isMandatoryFieldsComplete={isMandatoryFieldsComplete}
            />
          </div>

          {/* Right Column - Form (60%) */}
          <div className="lg:col-span-7">
            <Card className={`border-0 shadow-xl rounded-3xl ${theme.card}`}>
              <CardHeader className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} pb-4 sm:pb-6 px-4 sm:px-6`}>
                <div className="min-w-0">
                  <CardTitle className={`text-2xl sm:text-3xl font-bold ${theme.text.primary}`}>
                    Your Details{loadedScenarioName && <span className={`ml-2 text-lg ${theme.text.secondary}`}>- {loadedScenarioName}</span>}
                  </CardTitle>
                </div>
              </CardHeader>

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
                  editMode={true}
                  isDarkMode={isDarkMode}
                  theme={theme}
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
                  onFieldFocus={setFocusedField}
                />

                {/* Calculate Button */}
                <div className="mt-6 sm:mt-8">
                  <CalculateButton
                    isCalculating={isCalculating}
                    isMandatoryFieldsComplete={isMandatoryFieldsComplete()}
                    calculationResults={calculationResults}
                    theme={theme}
                    onClick={handleCalculate}
                    loadedVariantMetadata={loadedVariantMetadata}
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
                  if (isAnonymous) {
                    setShowSaveWithAccountModal(true)
                  } else {
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
                variantConfigs={variantConfigs}
                isDarkMode={isDarkMode}
                activeTab={activeVariantTab}
                onTabChange={setActiveVariantTab}
                onSave={handleSaveVariant}
                onShareChange={handleShareChange}
                onRemoveVariant={handleRemoveVariant}
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
        baselineId={savingVariantIndex !== null ? scenarioId : undefined}
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
        employmentIncome={currentIncome || 60000}
        isDarkMode={isDarkMode}
        currentProvince={province as Province || undefined}
        onRun={handleRunScenario}
      />

      <RecalculateConfirmModal
        isOpen={showRecalculateConfirmModal}
        onClose={() => setShowRecalculateConfirmModal(false)}
        onConfirm={handleConfirmRecalculate}
        variantName={variantScenarios.length === 1 ? variantScenarios[0].name : `${variantScenarios.length} active variants`}
        isDarkMode={isDarkMode}
      />

      {/* Edit Warning Modal - shown when clicking Edit with variants open */}
      <RecalculateConfirmModal
        isOpen={showEditWarningModal}
        onClose={() => setShowEditWarningModal(false)}
        onConfirm={handleConfirmEdit}
        variantName={variantScenarios.length === 1 ? variantScenarios[0].name : `${variantScenarios.length} active variants`}
        isDarkMode={isDarkMode}
        actionType="edit"
      />

      {/* Mobile Help Banner (Auto-showing) */}
      <MobileHelpBanner
        focusedField={focusedField}
        isDarkMode={isDarkMode}
        theme={theme}
        planningStarted={planningStarted}
      />

      {/* Stale Results Banner - shown when form values change after calculation */}
      <StaleResultsBanner
        isVisible={resultsAreStale && calculationResults !== null && !loadedVariantMetadata}
        onRecalculate={handleCalculate}
        isCalculating={isCalculating}
        isDarkMode={isDarkMode}
      />
    </div>
  )
}
