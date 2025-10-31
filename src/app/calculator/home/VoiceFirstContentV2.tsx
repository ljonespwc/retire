'use client'

import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useState, useRef, useEffect } from 'react'
import { Province } from '@/types/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Calculator, Sun, Moon, LogIn, LogOut, User, Play, Lightbulb, Share2 } from 'lucide-react'
import { HELP_TIPS, DEFAULT_TIP } from '@/lib/calculator/help-tips'
import { MobileHelpBanner } from '@/components/help/MobileHelpBanner'
import { parseInteger, parsePercentage, roundPercentage } from '@/lib/utils/number-utils'
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
import { LoadScenarioDropdown } from '@/components/scenarios/LoadScenarioDropdown'
import { ScenarioModal } from '@/components/results/ScenarioModal'
import { ScenarioComparison } from '@/components/results/ScenarioComparison'
import { RecalculateConfirmModal } from '@/components/calculator/RecalculateConfirmModal'
import { createFrontLoadVariant, createDelayCppOasVariant } from '@/lib/calculations/scenario-variants'
import { type FormData } from '@/lib/scenarios/scenario-mapper'
import { regenerateVariant, getVariantDisplayName, detectVariantTypeFromName, type VariantMetadata, type VariantType } from '@/lib/scenarios/variant-metadata'
import { createClient } from '@/lib/supabase/client'
import { calculateRetirementProjection } from '@/lib/calculations/engine'
import { Scenario } from '@/types/calculator'
import confetti from 'canvas-confetti'

// WarmDataField - theme-aware form field component
function WarmDataField({
  label,
  value,
  editMode,
  onEdit,
  type,
  options,
  editValue,
  isDarkMode,
  theme,
  onFocus,
  isRequired = false
}: {
  label: string
  value: any
  editMode: boolean
  onEdit?: (val: any) => void
  type: 'number' | 'currency' | 'percentage' | 'text' | 'select'
  options?: { value: string; label: string }[]
  editValue?: any
  isDarkMode: boolean
  theme: any
  onFocus?: () => void
  isRequired?: boolean
}) {
  // Auto-scroll on mobile to keep focused field visible above banner
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (onFocus) onFocus()

    // Only on mobile (when help banner is visible)
    if (window.innerWidth >= 1024) return

    // Immediate scroll (no delay) so field is visible before banner animates in
    setTimeout(() => {
      const element = e.target
      const offset = 120 // Padding from top of viewport

      // Get element position
      const rect = element.getBoundingClientRect()
      const elementTop = rect.top + window.scrollY

      // Scroll so element is visible in upper half of viewport
      const scrollTo = elementTop - offset

      window.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      })
    }, 50) // Minimal delay, just enough for focus to register
  }
  const formatValue = () => {
    if (value === null || value === undefined) return <span className={`${theme.text.muted} text-sm`}>—</span>
    if (type === 'currency') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>${value.toLocaleString()}</span>
    if (type === 'percentage') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>{value}%</span>
    if (type === 'number') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>{value}</span>
    return <span className={`${theme.text.primary} font-semibold text-base sm:text-lg`}>{value}</span>
  }

  const isEmpty = value === null || value === undefined || value === '';
  const showRequiredBorder = isRequired && isEmpty && editMode;

  return (
    <div className="space-y-2">
      <label className={`block text-xs sm:text-xs font-bold ${theme.text.muted} uppercase tracking-wider`}>
        {label}
      </label>
      {editMode && onEdit ? (
        type === 'select' ? (
          <select
            value={editValue !== undefined ? editValue : value || ''}
            onChange={(e) => onEdit(e.target.value || null)}
            onFocus={handleFocus}
            autoComplete="off"
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-2xl text-base sm:text-lg focus:ring-2 transition-all ${theme.input} ${
              showRequiredBorder ? 'border-red-500 ring-2 ring-red-500/50' : ''
            } ${isDarkMode ? 'focus:ring-blue-400 focus:border-blue-400' : 'focus:ring-rose-400 focus:border-rose-400'}`}
          >
            <option value="">Select...</option>
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type === 'text' ? 'text' : 'number'}
            value={value ?? ''}
            onChange={(e) => {
              if (type === 'text') {
                onEdit(e.target.value || null)
              } else if (type === 'percentage') {
                // Percentages: allow 1 decimal place
                onEdit(parsePercentage(e.target.value))
              } else {
                // Ages and currency: integers only
                onEdit(parseInteger(e.target.value))
              }
            }}
            onFocus={handleFocus}
            autoComplete="off"
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-2xl text-base sm:text-lg focus:ring-2 transition-all ${theme.input} ${
              showRequiredBorder ? 'border-red-500 ring-2 ring-red-500/50' : ''
            } ${isDarkMode ? 'focus:ring-blue-400 focus:border-blue-400' : 'focus:ring-rose-400 focus:border-rose-400'}`}
            step={type === 'percentage' ? '0.1' : '1'}
          />
        )
      ) : (
        <div className={`px-4 sm:px-5 py-3 sm:py-4 rounded-2xl border-2 transition-all duration-300 ${
          isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800/20 border-gray-600' : 'bg-gradient-to-br from-gray-50 to-orange-50/20 border-gray-200'
        }`}>
          {formatValue()}
        </div>
      )}
    </div>
  )
}

// Help Sidebar - contextual tips based on focused field
function HelpSidebar({ focusedField, isDarkMode, theme, onStartPlanning, onLoadScenario, planningStarted, calculationResults, isMandatoryFieldsComplete }: {
  focusedField: string | null
  isDarkMode: boolean
  theme: any
  onStartPlanning: () => void
  onLoadScenario: (formData: FormData, scenarioName: string, variantMetadata?: VariantMetadata) => void
  planningStarted: boolean
  calculationResults: CalculationResults | null
  isMandatoryFieldsComplete: () => boolean
}) {
  const tip = focusedField && HELP_TIPS[focusedField] ? HELP_TIPS[focusedField] : null

  return (
    <Card className={`border-0 shadow-lg rounded-3xl ${theme.card} h-full`}>
      <CardContent className="pt-6 sm:pt-8 lg:pt-10">
        {tip ? (
          // Show tooltip when field is focused (highest priority)
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{tip.icon}</span>
              <h3 className={`text-xl font-bold ${theme.text.primary}`}>{tip.title}</h3>
            </div>
            <div className="space-y-3">
              {tip.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className={`${theme.text.secondary} text-base leading-relaxed`}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ) : !planningStarted || calculationResults ? (
          // Show welcome state if not started yet OR after calculation
          <div className="py-6 sm:py-8 lg:py-10 px-4 space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">🇨🇦</div>
              <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Let's Plan Your Retirement</h2>
              <p className={`${theme.text.secondary} text-base leading-relaxed`}>
                Fill out the form to see your personalized retirement projection. We'll calculate your income, taxes, and portfolio balance year by year.
              </p>
            </div>

            {/* Load Saved Scenario */}
            <div className="max-w-xs mx-auto">
              <LoadScenarioDropdown
                onLoad={onLoadScenario}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-4">
              <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <span className={`text-sm ${theme.text.muted}`}>or</span>
              <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </div>

            {/* Create New Plan Button */}
            <div className="text-center">
              <Button
                onClick={onStartPlanning}
                size="lg"
                className={`${theme.button.secondary} text-white px-6 sm:px-8 lg:px-10 py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-semibold rounded-2xl shadow-xl w-full sm:w-auto`}
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Create New Plan
              </Button>
            </div>
          </div>
        ) : isMandatoryFieldsComplete() ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">✅</span>
              <h3 className={`text-xl font-bold ${theme.text.primary}`}>Ready to Calculate</h3>
            </div>
            <p className={`${theme.text.secondary} text-base leading-relaxed`}>
              All required fields are complete! Click the <strong>Calculate</strong> button to see your personalized retirement projection.
            </p>
            <p className={`${theme.text.secondary} text-base leading-relaxed`}>
              You can add more details (like RRSP contributions or pension income) to get a more accurate projection, or calculate now and refine later.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Lightbulb className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-orange-500'}`} />
              <h3 className={`text-xl font-bold ${theme.text.primary}`}>Pro Tip</h3>
            </div>
            <p className={`${theme.text.secondary} text-base leading-relaxed`}>
              Click on any field to see helpful information about what it means and how it affects your retirement plan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


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

  // What-if scenario state
  const [showScenarioModal, setShowScenarioModal] = useState(false)
  const [selectedScenarioType, setSelectedScenarioType] = useState<'front_load' | 'exhaust' | 'legacy' | 'delay_benefits' | 'retire_early'>('front_load')
  const [variantScenarios, setVariantScenarios] = useState<Scenario[]>([])
  const [variantResultsArray, setVariantResultsArray] = useState<CalculationResults[]>([])
  const [variantInsights, setVariantInsights] = useState<string[]>([])
  const [variantNarratives, setVariantNarratives] = useState<string[]>([])
  const [variantScenarioIds, setVariantScenarioIds] = useState<(string | undefined)[]>([])
  const [isCalculatingVariant, setIsCalculatingVariant] = useState(false)
  const [generatingVariantType, setGeneratingVariantType] = useState<'front_load' | 'delay_benefits' | null>(null)
  const [activeVariantTab, setActiveVariantTab] = useState<number>(0)
  const [savingVariantIndex, setSavingVariantIndex] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [loadedVariantMetadata, setLoadedVariantMetadata] = useState<VariantMetadata | null>(null)
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

  // Confetti celebration effect
  const fireConfetti = () => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#f43f5e', '#fb923c', '#fbbf24', '#10b981', '#06b6d4']
      })

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#f43f5e', '#fb923c', '#fbbf24', '#10b981', '#06b6d4']
      })
    }, 250)
  }

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
    setVariantInsights([])
    setVariantNarratives([])
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
    fireConfetti()

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
          other_income: [
            ...(pensionIncome ? [{
              description: 'Pension',
              annual_amount: pensionIncome,
              start_age: retirementAge || 65,
              indexed_to_inflation: false
            }] : []),
            ...(otherIncome ? [{
              description: 'Other Income',
              annual_amount: otherIncome,
              start_age: retirementAge || 65,
              indexed_to_inflation: true
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
        setShowResults(true)
        setEditMode(false)
        setJustCalculated(true)
        setFocusedField(null) // Reset sidebar to original state
      } else {
        console.error('❌ Calculation failed:', data.error)
        alert(`Calculation failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Calculate error:', error)
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
      otherIncome,
      cppStartAge,
      investmentReturn,
      postRetirementReturn,
      inflationRate,
    }
  }

  // Handle loading a saved scenario
  const handleLoadScenario = (
    formData: FormData,
    scenarioName: string,
    variantMetadata?: VariantMetadata,
    scenarioId?: string,
    shareToken?: string | null,
    isShared?: boolean,
    results?: any | null,
    narrative?: string | null
  ) => {
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
    setOtherIncome(formData.otherIncome)
    setCppStartAge(formData.cppStartAge)
    // Round percentages to 1 decimal place
    setInvestmentReturn(formData.investmentReturn !== null ? roundPercentage(formData.investmentReturn) : null)
    setPostRetirementReturn(formData.postRetirementReturn !== null ? roundPercentage(formData.postRetirementReturn) : null)
    setInflationRate(formData.inflationRate !== null ? roundPercentage(formData.inflationRate) : null)

    setLoadedScenarioName(scenarioName)
    setPlanningStarted(true)
    setEditMode(false)

    // Clear any variant scenarios (when loading a baseline)
    setVariantScenarios([])
    setVariantResultsArray([])
    setVariantScenarioIds([])
    setVariantInsights([])
    setVariantNarratives([])

    // Store scenario ID if present
    if (scenarioId) {
      setScenarioId(scenarioId)
      console.log(`✅ Loaded scenario ID: ${scenarioId}`)
    }

    // Store sharing state if present
    if (shareToken || isShared !== undefined) {
      setShareToken(shareToken || null)
      setIsScenarioShared(isShared || false)
      console.log(`✅ Loaded sharing state: shared=${isShared}, token=${shareToken ? 'present' : 'none'}`)
    } else {
      setShareToken(null)
      setIsScenarioShared(false)
    }

    // Store variant metadata if present
    if (variantMetadata) {
      setLoadedVariantMetadata(variantMetadata)
      console.log(`✅ Loaded variant scenario: ${scenarioName} (type: ${variantMetadata.variant_type})`)
    } else {
      setLoadedVariantMetadata(null)
      console.log(`✅ Loaded scenario: ${scenarioName}`)
    }

    // Load stored results and narrative directly from database (no recalculation needed)
    if (results) {
      setCalculationResults(results)
      setShowResults(true)
      setJustCalculated(true)
      console.log(`✅ Loaded stored calculation results`)
    } else {
      // If no results stored, reset to allow calculation
      setCalculationResults(null)
      setShowResults(false)
      setJustCalculated(false)
    }

    // Load stored narrative if present
    if (narrative) {
      setBaselineNarrative(narrative)
      console.log(`✅ Loaded stored narrative`)
    } else {
      setBaselineNarrative(null)
    }
  }

  // Handle successful scenario save (baseline only, not variants)
  const handleSaveSuccess = (newScenarioId: string, newScenarioName: string) => {
    console.log(`💾 Scenario saved successfully - ID: ${newScenarioId}, Name: ${newScenarioName}`)
    setScenarioId(newScenarioId)
    setLoadedScenarioName(newScenarioName)
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

    const otherIncomeItems = []
    if (pensionIncome && pensionIncome > 0) {
      otherIncomeItems.push({
        description: 'Pension Income',
        annual_amount: pensionIncome,
        start_age: retirementAge || 65,
        indexed_to_inflation: true
      })
    }
    if (otherIncome && otherIncome > 0) {
      otherIncomeItems.push({
        description: 'Other Income',
        annual_amount: otherIncome,
        start_age: retirementAge || 65,
        indexed_to_inflation: true
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
        indexed_to_inflation: true
      },
      assumptions: {
        pre_retirement_return: defaultPreRetirementReturn,
        post_retirement_return: (postRetirementReturn || 4) / 100,
        inflation_rate: (inflationRate || 2) / 100
      }
    }
  }

  // Handle scenario button click
  const handleScenarioClick = (scenarioType: 'front_load' | 'exhaust' | 'legacy' | 'delay_benefits' | 'retire_early') => {
    setSelectedScenarioType(scenarioType)
    setShowScenarioModal(true)
  }

  // Handle running scenario calculation
  const handleRunScenario = async () => {
    if (!monthlySpending || !retirementAge) return

    setIsCalculatingVariant(true)
    setGeneratingVariantType(selectedScenarioType as 'front_load' | 'delay_benefits')
    try {
      const baseScenario = createScenarioFromFormData()

      console.log('🔍 BASE SCENARIO CPP:', baseScenario.income_sources.cpp)
      console.log('🔍 BASE SCENARIO OAS:', baseScenario.income_sources.oas)

      // Create variant based on selected type
      let variant: Scenario
      switch (selectedScenarioType) {
        case 'front_load':
          variant = createFrontLoadVariant(baseScenario)
          break
        case 'delay_benefits':
          variant = createDelayCppOasVariant(baseScenario)
          break
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

      const supabase = createClient()
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
          const insightResult = await fetch('/api/generate-insight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              baselineResults: calculationResults,
              variantResults: results,
              variantName: variant.name,
              baselineScenarioName: loadedScenarioName || undefined
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

        // Focus on the replaced variant tab
        setActiveVariantTab(existingIndex)
      } else {
        // Append new variant
        const newIndex = variantScenarios.length
        setVariantScenarios([...variantScenarios, variant])
        setVariantResultsArray([...variantResultsArray, results])
        setVariantInsights([...variantInsights, insight || ''])
        setVariantNarratives([...variantNarratives, narrative || ''])

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
      setActiveVariantTab(0)
    }
  }

  // Convert Scenario to FormData format
  const scenarioToFormData = (scenario: Scenario): FormData => {
    const pension = scenario.income_sources.other_income?.find(i => i.description === 'Pension Income')
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
      pensionIncome: pension?.annual_amount || null,
      otherIncome: other?.annual_amount || null,
      cppStartAge: scenario.income_sources.cpp?.start_age || null,
      investmentReturn: roundPercentage(scenario.assumptions.pre_retirement_return * 100),
      postRetirementReturn: roundPercentage(scenario.assumptions.post_retirement_return * 100),
      inflationRate: roundPercentage(scenario.assumptions.inflation_rate * 100),
    }
  }

  const handleSaveVariant = (index: number) => {
    if (index < 0 || index >= variantScenarios.length) return
    setSavingVariantIndex(index)
    setShowScenarioSaveModal(true)
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
      <div className={theme.headerBg}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-white/30 backdrop-blur flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0">
                🇨🇦
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  The Ultimate Canadian Retirement Calculator
                </h1>
                <p className="text-white/90 text-sm sm:text-base lg:text-lg mt-1">Tax-accurate. Future teller.</p>
              </div>
            </div>

            {/* Auth & Theme Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {!authLoading && (
                <>
                  {isAnonymous ? (
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur transition-all duration-200 text-white text-sm sm:text-base font-medium"
                      aria-label="Login"
                    >
                      <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Login</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 backdrop-blur text-white text-sm">
                        <User className="w-4 h-4" />
                        <span className="max-w-[120px] truncate">{user?.email}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur transition-all duration-200 text-white text-sm sm:text-base font-medium"
                        aria-label="Logout"
                      >
                        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Logout</span>
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-all duration-200"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : (
                  <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-6 lg:space-y-8">
        {/* Mobile Intro - Shown before planning starts OR after calculation, only on mobile */}
        {(!planningStarted || calculationResults) && (
          <div className="lg:hidden">
            <Card className={`border-0 shadow-lg rounded-3xl ${theme.card}`}>
              <CardContent className="pt-6 sm:pt-8">
                <div className="py-6 sm:py-8 px-4 space-y-6">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">🇨🇦</div>
                    <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Let's Plan Your Retirement</h2>
                    <p className={`${theme.text.secondary} text-base leading-relaxed`}>
                      Fill out the form to see your personalized retirement projection. We'll calculate your income, taxes, and portfolio balance year by year.
                    </p>
                  </div>

                  {/* Load Saved Scenario */}
                  <div className="max-w-xs mx-auto">
                    <LoadScenarioDropdown
                      onLoad={handleLoadScenario}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 my-4">
                    <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <span className={`text-sm ${theme.text.muted}`}>or</span>
                    <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  </div>

                  {/* Create New Plan Button */}
                  <div className="text-center">
                    <Button
                      onClick={handleStartPlanning}
                      size="lg"
                      className={`${theme.button.secondary} text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-2xl shadow-xl w-full sm:w-auto`}
                    >
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                      Create New Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Sidebar - Help/Tips (40%) - Desktop only */}
          <div className="hidden lg:block lg:col-span-5">
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
            <Card className={`border-0 shadow-xl rounded-3xl ${theme.card} lg:sticky lg:top-8`}>
              <CardHeader className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} pb-4 sm:pb-6 px-4 sm:px-6`}>
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className={`text-2xl sm:text-3xl font-bold ${theme.text.primary}`}>
                      Your Details{loadedScenarioName && <span className={`ml-2 text-lg ${theme.text.secondary}`}>- {loadedScenarioName}</span>}
                    </CardTitle>
                  </div>
                  {calculationResults && (
                    <Button
                      onClick={() => {
                        if (!editMode) {
                          // Entering edit mode - hide results display to avoid stale data errors
                          setShowResults(false)
                          // Clear loaded variant metadata when editing (user is now modifying baseline)
                          setLoadedVariantMetadata(null)
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
              <CardContent className={`pt-6 sm:pt-8 px-4 sm:px-6 ${planningStarted ? 'pb-[25vh] lg:pb-6' : ''}`}>
                <div className="space-y-6 sm:space-y-8">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <WarmDataField
                      label="Current Age"
                      value={currentAge}
                      editMode={editMode}
                      onEdit={setCurrentAge}
                      type="number"
                      isDarkMode={isDarkMode}
                      theme={theme}
                      onFocus={() => setFocusedField('currentAge')}
                      isRequired={true}
                    />
                    <WarmDataField
                      label="Retirement Age"
                      value={retirementAge}
                      editMode={editMode}
                      onEdit={setRetirementAge}
                      type="number"
                      isDarkMode={isDarkMode}
                      theme={theme}
                      onFocus={() => setFocusedField('retirementAge')}
                      isRequired={true}
                    />
                    <WarmDataField
                      label="Life Expectancy Age"
                      value={longevityAge}
                      editMode={editMode}
                      onEdit={setLongevityAge}
                      type="number"
                      isDarkMode={isDarkMode}
                      theme={theme}
                      onFocus={() => setFocusedField('longevityAge')}
                      isRequired={true}
                    />
                    <WarmDataField
                      label="Current Income (Annual)"
                      value={currentIncome}
                      editMode={editMode}
                      onEdit={setCurrentIncome}
                      type="currency"
                      isDarkMode={isDarkMode}
                      theme={theme}
                      onFocus={() => setFocusedField('currentIncome')}
                    />
                  </div>

                  <WarmDataField
                    label="Province/Territory"
                    value={province ? PROVINCE_NAMES[province as Province] : null}
                    editValue={province}
                    editMode={editMode}
                    onEdit={setProvince}
                    type="select"
                    options={PROVINCE_OPTIONS}
                    isDarkMode={isDarkMode}
                    theme={theme}
                    onFocus={() => setFocusedField('province')}
                    isRequired={true}
                  />

                  {/* Accounts */}
                  <div className="space-y-4">
                    <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-blue-700' : 'border-rose-200'}`}>
                      💰 Your Accounts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <WarmDataField label="RRSP Balance" value={rrsp} editMode={editMode} onEdit={setRrsp} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('rrsp')} />
                      <WarmDataField label="RRSP Contribution (Annual)" value={rrspContribution} editMode={editMode} onEdit={setRrspContribution} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('rrspContribution')} />
                      <WarmDataField label="TFSA Balance" value={tfsa} editMode={editMode} onEdit={setTfsa} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('tfsa')} />
                      <WarmDataField label="TFSA Contribution (Annual)" value={tfsaContribution} editMode={editMode} onEdit={setTfsaContribution} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('tfsaContribution')} />
                      <WarmDataField label="Non-Registered Balance" value={nonRegistered} editMode={editMode} onEdit={setNonRegistered} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('nonRegistered')} />
                      <WarmDataField label="Non-Registered Contribution (Annual)" value={nonRegisteredContribution} editMode={editMode} onEdit={setNonRegisteredContribution} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('nonRegisteredContribution')} />
                    </div>
                  </div>

                  {/* Retirement */}
                  <div className="space-y-4">
                    <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-indigo-700' : 'border-orange-200'}`}>
                      🏖️ In Retirement
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <WarmDataField label="Monthly Spending Goal (Pre-Tax)" value={monthlySpending} editMode={editMode} onEdit={setMonthlySpending} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('monthlySpending')} />
                      <WarmDataField label="Expected Pension Income (Annual)" value={pensionIncome} editMode={editMode} onEdit={setPensionIncome} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('pensionIncome')} />
                      <WarmDataField label="Other Income (Annual)" value={otherIncome} editMode={editMode} onEdit={setOtherIncome} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('otherIncome')} />
                      <WarmDataField label="CPP Start Age" value={cppStartAge} editMode={editMode} onEdit={setCppStartAge} type="number" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('cppStartAge')} />
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="space-y-4">
                    <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-purple-700' : 'border-teal-200'}`}>
                      📊 Rate Assumptions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                      <WarmDataField label="Pre-Retirement" value={investmentReturn} editMode={editMode} onEdit={setInvestmentReturn} type="percentage" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('investmentReturn')} />
                      <WarmDataField label="Post-Retirement" value={postRetirementReturn} editMode={editMode} onEdit={setPostRetirementReturn} type="percentage" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('postRetirementReturn')} />
                      <WarmDataField label="Inflation" value={inflationRate} editMode={editMode} onEdit={setInflationRate} type="percentage" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('inflationRate')} />
                    </div>
                  </div>

                  {/* Done Editing Button (Bottom) - Mobile convenience */}
                  {editMode && calculationResults && (
                    <div className={`pt-4 border-t-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <Button
                        size="lg"
                        onClick={() => setEditMode(false)}
                        className={`w-full ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:text-blue-300'
                            : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600 hover:text-rose-800'
                        } text-white shadow-2xl py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-bold rounded-2xl transition-all`}
                      >
                        ✓ Done Editing
                      </Button>
                    </div>
                  )}

                  {/* Calculate Button */}
                  <Button
                    size="lg"
                    onClick={handleCalculate}
                    data-calculate-button
                    disabled={isCalculating || !isMandatoryFieldsComplete() || (editMode && !!calculationResults) || justCalculated}
                    className={`w-full ${theme.button.primary} text-white shadow-2xl py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isCalculating ? (
                      <>
                        <Heart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 animate-pulse" fill="white" />
                        Calculating...
                      </>
                    ) : calculationResults ? (
                      <>
                        <Calculator className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                        Recalculate
                      </>
                    ) : (
                      <>
                        <Calculator className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                        Calculate
                      </>
                    )}
                  </Button>
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
              <div className={`${theme.card} rounded-lg border-2 ${isDarkMode ? 'border-blue-500/30 shadow-xl shadow-blue-500/10' : 'border-orange-300 shadow-xl shadow-orange-500/10'} p-6 max-w-6xl mx-auto`}>
                <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4 text-center`}>
                  Try What-If Scenarios
                </h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => handleScenarioClick('front_load')}
                    disabled={!!loadedVariantMetadata || variantScenarios.some(v => v.name === 'Front-Load the Fun')}
                    className={`flex-1 min-w-[280px] max-w-md text-left p-4 rounded-lg border transition-colors ${
                      loadedVariantMetadata || variantScenarios.some(v => v.name === 'Front-Load the Fun')
                        ? isDarkMode ? 'border-gray-600 bg-gray-700/50 opacity-60 cursor-not-allowed' : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                        : generatingVariantType === 'front_load'
                        ? isDarkMode ? 'border-blue-500 bg-blue-900/30 animate-pulse' : 'border-orange-400 bg-orange-100/50 animate-pulse'
                        : isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {generatingVariantType === 'front_load' ? (
                        <Heart className="w-6 h-6 text-rose-500 animate-pulse mt-0.5" fill="currentColor" />
                      ) : (
                        <span className="text-2xl">🎯</span>
                      )}
                      <div className="flex-1">
                        <div className={`font-semibold ${theme.text.primary} mb-1`}>
                          Front-Load the Fun
                        </div>
                        <p className={`text-sm ${theme.text.secondary}`}>
                          {generatingVariantType === 'front_load'
                            ? 'Generating scenario...'
                            : 'Spend more early, scale back later'}
                        </p>
                      </div>
                      {variantScenarios.some(v => v.name === 'Front-Load the Fun') && !generatingVariantType && (
                        <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-orange-600'} font-medium`}>Active</span>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => handleScenarioClick('delay_benefits')}
                    disabled={!!loadedVariantMetadata || variantScenarios.some(v => v.name === 'Delay CPP/OAS to 70')}
                    className={`flex-1 min-w-[280px] max-w-md text-left p-4 rounded-lg border transition-colors ${
                      loadedVariantMetadata || variantScenarios.some(v => v.name === 'Delay CPP/OAS to 70')
                        ? isDarkMode ? 'border-gray-600 bg-gray-700/50 opacity-60 cursor-not-allowed' : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                        : generatingVariantType === 'delay_benefits'
                        ? isDarkMode ? 'border-blue-500 bg-blue-900/30 animate-pulse' : 'border-orange-400 bg-orange-100/50 animate-pulse'
                        : isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {generatingVariantType === 'delay_benefits' ? (
                        <Heart className="w-6 h-6 text-rose-500 animate-pulse mt-0.5" fill="currentColor" />
                      ) : (
                        <span className="text-2xl">⏰</span>
                      )}
                      <div className="flex-1">
                        <div className={`font-semibold ${theme.text.primary} mb-1`}>
                          Delay CPP/OAS to 70
                        </div>
                        <p className={`text-sm ${theme.text.secondary}`}>
                          {generatingVariantType === 'delay_benefits'
                            ? 'Generating scenario...'
                            : 'Maximize government benefits'}
                        </p>
                      </div>
                      {variantScenarios.some(v => v.name === 'Delay CPP/OAS to 70') && !generatingVariantType && (
                        <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-orange-600'} font-medium`}>Active</span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Disabled message for saved variants */}
                {loadedVariantMetadata && (
                  <p className={`text-sm text-center mt-4 ${theme.text.secondary}`}>
                    ℹ️ Not available for previously saved what-if scenarios
                  </p>
                )}
              </div>
            </div>

            {/* Baseline Results (shown only when NO variants active) */}
            {variantScenarios.length === 0 && (
              <div className="space-y-6 lg:space-y-8">
                {/* Variant Details Banner (shown when loaded variant has metadata) */}
                {loadedVariantMetadata && (
                  <VariantDetailsBanner
                    variantMetadata={loadedVariantMetadata}
                    scenario={createScenarioFromFormData()}
                    isDarkMode={isDarkMode}
                    isCollapsible={true}
                  />
                )}

                <ResultsSummary
                  results={calculationResults}
                  retirementAge={retirementAge || 65}
                  isDarkMode={isDarkMode}
                  variantName={loadedVariantMetadata ? getVariantDisplayName(loadedVariantMetadata.variant_type) : undefined}
                />

                <RetirementNarrative narrative={baselineNarrative} isDarkMode={isDarkMode} />

                {/* Save and Share Buttons */}
                <div className="flex justify-center items-center gap-3 pt-2 pb-2">
                  <button
                    onClick={() => {
                      console.log('💾 Save Scenario clicked - isAnonymous:', isAnonymous, 'user:', user)
                      if (isAnonymous) {
                        console.log('💾 Opening SaveWithAccountModal (anonymous user)')
                        setShowSaveWithAccountModal(true)
                      } else {
                        console.log('💾 Opening SaveScenarioModal (authenticated user)')
                        setShowScenarioSaveModal(true)
                      }
                    }}
                    className={`px-6 py-3 text-sm font-medium text-white rounded-xl shadow-lg transition-all ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
                        : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'
                    }`}
                  >
                    {scenarioId && loadedScenarioName
                      ? `UPDATE THIS SCENARIO: ${loadedScenarioName}`
                      : 'SAVE THIS SCENARIO'}
                  </button>

                  {/* Share Button (only visible if scenario is saved) */}
                  {scenarioId && loadedScenarioName && (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className={`px-6 py-3 text-sm font-medium rounded-xl shadow-lg transition-all ${
                        isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Share2 className="w-4 h-4 inline mr-2" />
                      SHARE
                    </button>
                  )}
                </div>

                <BalanceOverTimeChart results={calculationResults} isDarkMode={isDarkMode} />
                <IncomeCompositionChart results={calculationResults} isDarkMode={isDarkMode} />
                <TaxSummaryCard results={calculationResults} retirementAge={retirementAge || 65} isDarkMode={isDarkMode} />
              </div>
            )}

            {/* Scenario Comparison Tabs (shown when variants exist) */}
            {variantScenarios.length > 0 && variantResultsArray.length > 0 && (
              <ScenarioComparison
                baselineScenario={createScenarioFromFormData()}
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
              />
            )}

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
        variantConfig={loadedVariantMetadata?.variant_config}
        scenarioId={savingVariantIndex !== null ? variantScenarioIds[savingVariantIndex] : scenarioId}
        baselineScenarioName={savingVariantIndex !== null ? (loadedScenarioName || 'Your Baseline') : undefined}
        baselineResults={savingVariantIndex !== null ? (calculationResults ?? undefined) : undefined}
        aiInsight={savingVariantIndex !== null && variantInsights[savingVariantIndex] ? variantInsights[savingVariantIndex] : loadedVariantMetadata?.ai_insight}
        aiNarrative={savingVariantIndex !== null && variantNarratives[savingVariantIndex] ? variantNarratives[savingVariantIndex] : loadedVariantMetadata?.ai_narrative}
        onSaveSuccess={savingVariantIndex === null ? handleSaveSuccess : handleVariantSaveSuccess}
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
