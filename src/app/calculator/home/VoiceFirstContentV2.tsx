'use client'

import { useLayercodeVoice } from '@/hooks/useLayercodeVoice'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Province } from '@/types/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Heart, CheckCircle2, MessageCircle, BarChart3, Calculator, Sun, Moon, Save, LogIn, LogOut, User } from 'lucide-react'
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
import { SaveScenarioModal } from '@/components/scenarios/SaveScenarioModal'
import { LoadScenarioDropdown } from '@/components/scenarios/LoadScenarioDropdown'
import { ScenarioModal } from '@/components/results/ScenarioModal'
import { ScenarioComparison } from '@/components/results/ScenarioComparison'
import { createFrontLoadVariant } from '@/lib/calculations/scenario-variants'
import { type FormData } from '@/lib/scenarios/scenario-mapper'
import { createClient } from '@/lib/supabase/client'
import { calculateRetirementProjection } from '@/lib/calculations/engine'
import { Scenario } from '@/types/calculator'
import confetti from 'canvas-confetti'

interface Message {
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

interface BatchPrompt {
  batchId: string
  batchTitle: string
  questions: {
    id: string
    text: string
    type: string
  }[]
  batchIndex: number
  totalBatches: number
}

// WarmDataField - theme-aware form field component (extracted to prevent re-creation on render)
function WarmDataField({
  label,
  value,
  editMode,
  onEdit,
  type,
  isGlowing,
  options,
  editValue,
  isDarkMode,
  theme
}: {
  label: string
  value: any
  editMode: boolean
  onEdit?: (val: any) => void
  type: 'number' | 'currency' | 'percentage' | 'text' | 'select'
  isGlowing?: boolean
  options?: { value: string; label: string }[]
  editValue?: any
  isDarkMode: boolean
  theme: any
}) {
  const formatValue = () => {
    if (value === null || value === undefined) return <span className={`${theme.text.muted} text-sm`}>—</span>
    if (type === 'currency') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>${value.toLocaleString()}</span>
    if (type === 'percentage') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>{value}%</span>
    if (type === 'number') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>{value}</span>
    return <span className={`${theme.text.primary} font-semibold text-base sm:text-lg`}>{value}</span>
  }

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
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-2xl text-base sm:text-lg focus:ring-2 transition-all ${theme.input} ${isDarkMode ? 'focus:ring-blue-400 focus:border-blue-400' : 'focus:ring-rose-400 focus:border-rose-400'}`}
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
              } else {
                const numValue = e.target.value === '' ? null : Number(e.target.value)
                onEdit(numValue)
              }
            }}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-2xl text-base sm:text-lg focus:ring-2 transition-all ${theme.input} ${isDarkMode ? 'focus:ring-blue-400 focus:border-blue-400' : 'focus:ring-rose-400 focus:border-rose-400'}`}
            step={type === 'percentage' ? '0.1' : '1'}
          />
        )
      ) : (
        <div className={`px-4 sm:px-5 py-3 sm:py-4 rounded-2xl border-2 transition-all duration-300 ${
          isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800/20' : 'bg-gradient-to-br from-gray-50 to-orange-50/20'
        } ${
          isGlowing
            ? `${isDarkMode ? 'border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.7)]' : 'border-orange-400 shadow-[0_0_25px_rgba(251,146,60,0.7)]'} animate-pulse`
            : isDarkMode ? 'border-gray-600' : 'border-gray-200'
        }`}>
          {formatValue()}
        </div>
      )}
    </div>
  )
}

export function VoiceFirstContentV2() {
  // Get auth context for user ID
  const { user, isAnonymous, loading: authLoading, logout } = useAuth()

  // Form state (read-only preview)
  const [currentAge, setCurrentAge] = useState<number | null>(null)
  const [retirementAge, setRetirementAge] = useState<number | null>(null)
  const [longevityAge, setLongevityAge] = useState<number | null>(null)
  const [province, setProvince] = useState<Province | null>(null)
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

  const [messages, setMessages] = useState<Message[]>([])
  const [batchPrompts, setBatchPrompts] = useState<BatchPrompt[]>([])
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [glowingFields, setGlowingFields] = useState<Set<string>>(new Set())
  const [completedBatches, setCompletedBatches] = useState<Set<string>>(new Set())
  const [showSaveWithAccountModal, setShowSaveWithAccountModal] = useState(false)
  const [scenarioId, setScenarioId] = useState<string | undefined>(undefined)
  const [loadedScenarioName, setLoadedScenarioName] = useState<string | null>(null)
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null)

  // What-if scenario state
  const [showScenarioModal, setShowScenarioModal] = useState(false)
  const [selectedScenarioType, setSelectedScenarioType] = useState<'front_load' | 'exhaust' | 'legacy' | 'delay_benefits' | 'retire_early'>('front_load')
  const [variantScenario, setVariantScenario] = useState<Scenario | null>(null)
  const [variantResults, setVariantResults] = useState<CalculationResults | null>(null)
  const [isCalculatingVariant, setIsCalculatingVariant] = useState(false)
  const [savingVariant, setSavingVariant] = useState(false) // Track if we're saving variant vs baseline
  const [showResults, setShowResults] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false)
  const [showScenarioSaveModal, setShowScenarioSaveModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [anonymousUserIdBeforeLogin, setAnonymousUserIdBeforeLogin] = useState<string | null>(null)
  const [anonymousScenarioCountBeforeLogin, setAnonymousScenarioCountBeforeLogin] = useState(0)
  const [formGlowing, setFormGlowing] = useState(false)

  // Ref for auto-scrolling to results
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
    progress: isDarkMode
      ? 'bg-gradient-to-r from-blue-500 to-purple-500'
      : 'bg-gradient-to-r from-rose-500 to-orange-500',
    badge: {
      active: isDarkMode ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white',
      inactive: isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700',
    },
    input: isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-white border-gray-200',
    glow: isDarkMode
      ? 'ring-4 ring-blue-400/50 ring-offset-2 ring-offset-gray-800'
      : 'ring-4 ring-rose-300/50 ring-offset-2 ring-offset-white',
  }

  // All question sections (shown immediately)
  const allSections = [
    { id: 'personal_info', title: 'Tell me about yourself', index: 0 },
    { id: 'savings', title: 'Tell me about your current savings', index: 1 },
    { id: 'savings_contributions', title: 'Tell me about your annual contributions', index: 2 },
    { id: 'retirement_income', title: 'Tell me about your retirement income', index: 3 },
    { id: 'investment_assumptions', title: 'Tell me about your investment expectations', index: 4 }
  ]

  // Helper function to trigger glow effect on a field
  const triggerGlow = (fieldName: string) => {
    setGlowingFields(prev => new Set(prev).add(fieldName))
    setTimeout(() => {
      setGlowingFields(prev => {
        const next = new Set(prev)
        next.delete(fieldName)
        return next
      })
    }, 1000)
  }

  // Handle login success - check for anonymous scenarios to merge
  const handleLoginSuccess = async () => {
    console.log('🔐 Login successful, checking for anonymous scenarios...')

    // Check if we had anonymous scenarios before login
    const anonCount = await getAnonymousScenarioCount()
    console.log(`📊 Found ${anonCount} anonymous scenarios`)

    if (anonCount > 0 && user?.id) {
      // Store anonymous user_id and count for merge modal
      setAnonymousUserIdBeforeLogin(user.id)
      setAnonymousScenarioCountBeforeLogin(anonCount)
      setShowMergeModal(true)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    await logout()
    console.log('👋 Logged out successfully')
  }

  // Handle merge complete - refresh scenario list
  const handleMergeComplete = () => {
    console.log('✅ Merge complete, scenarios should now be visible')
    // LoadScenarioDropdown will auto-refresh via useEffect when user changes
  }

  // Create metadata object that updates when user changes
  const metadata = useMemo(() => {
    if (user?.id) {
      console.log('📋 Creating Layercode metadata with user_id:', user.id)
      return { user_id: user.id }
    }
    console.warn('⚠️ No user_id available for Layercode metadata')
    return undefined
  }, [user?.id])

  const {
    isConnected,
    isConnecting,
    userAudioLevel,
    agentAudioLevel,
    connect,
    disconnect,
  } = useLayercodeVoice({
    autoConnect: false,
    metadata, // Pass user ID to webhook
    onDataMessage: (data) => {
      const content = data.type === 'response.data' ? data.content : data

      if (content.type === 'batch_prompt') {
        setBatchPrompts(prev => [...prev, {
          batchId: content.batchId,
          batchTitle: content.batchTitle,
          questions: content.questions,
          batchIndex: content.batchIndex,
          totalBatches: content.totalBatches
        }])
        // Mark this batch as the current active batch
        setCurrentBatchId(content.batchId)
        // Don't update progress here - wait for batch_response after fields are filled
      }

      if (content.type === 'batch_complete') {
        // Batch is fully complete - update progress and mark batch as completed
        if (content.progress) {
          setProgress({ current: content.progress.current, total: content.progress.total })
        }
        // Mark this batch as completed (for green checkmark)
        setCompletedBatches(prev => new Set(prev).add(content.completedBatchId))
      }

      if (content.type === 'batch_response') {
        const values = content.values
        // Fill fields with glow animation (progress updates later on batch_complete)
        if (values.current_age !== undefined) { setCurrentAge(values.current_age); triggerGlow('current_age') }
        if (values.retirement_age !== undefined) { setRetirementAge(values.retirement_age); triggerGlow('retirement_age') }
        if (values.longevity_age !== undefined) { setLongevityAge(values.longevity_age); triggerGlow('longevity_age') }
        if (values.province !== undefined) { setProvince(values.province); triggerGlow('province') }
        if (values.current_income !== undefined) { setCurrentIncome(values.current_income); triggerGlow('current_income') }
        if (values.rrsp_amount !== undefined) { setRrsp(values.rrsp_amount); triggerGlow('rrsp') }
        if (values.rrsp_contribution !== undefined) { setRrspContribution(values.rrsp_contribution); triggerGlow('rrsp_contribution') }
        if (values.tfsa_amount !== undefined) { setTfsa(values.tfsa_amount); triggerGlow('tfsa') }
        if (values.tfsa_contribution !== undefined) { setTfsaContribution(values.tfsa_contribution); triggerGlow('tfsa_contribution') }
        if (values.non_registered_amount !== undefined) { setNonRegistered(values.non_registered_amount); triggerGlow('non_registered') }
        if (values.non_registered_contribution !== undefined) { setNonRegisteredContribution(values.non_registered_contribution); triggerGlow('non_registered_contribution') }
        if (values.monthly_spending !== undefined) { setMonthlySpending(values.monthly_spending); triggerGlow('monthly_spending') }
        if (values.pension_income !== undefined) { setPensionIncome(values.pension_income); triggerGlow('pension_income') }
        if (values.other_income !== undefined) { setOtherIncome(values.other_income); triggerGlow('other_income') }
        if (values.cpp_start_age !== undefined) { setCppStartAge(values.cpp_start_age); triggerGlow('cpp_start_age') }
        if (values.investment_return !== undefined) { setInvestmentReturn(values.investment_return); triggerGlow('investment_return') }
        if (values.post_retirement_return !== undefined) { setPostRetirementReturn(values.post_retirement_return); triggerGlow('post_retirement_return') }
        if (values.inflation_rate !== undefined) { setInflationRate(values.inflation_rate); triggerGlow('inflation_rate') }
      }

      if (content.type === 'complete') {
        setIsComplete(true)
        const d = content.collectedData
        if (d.currentAge) setCurrentAge(d.currentAge)
        if (d.retirementAge) setRetirementAge(d.retirementAge)
        if (d.longevityAge) setLongevityAge(d.longevityAge)
        if (d.province) setProvince(d.province)
        if (d.currentIncome) setCurrentIncome(d.currentIncome)
        if (d.rrsp !== undefined) setRrsp(d.rrsp)
        if (d.rrspContribution !== undefined) setRrspContribution(d.rrspContribution)
        if (d.tfsa !== undefined) setTfsa(d.tfsa)
        if (d.tfsaContribution !== undefined) setTfsaContribution(d.tfsaContribution)
        if (d.non_registered !== undefined) setNonRegistered(d.non_registered)
        if (d.nonRegisteredContribution !== undefined) setNonRegisteredContribution(d.nonRegisteredContribution)
        if (d.monthlySpending) setMonthlySpending(d.monthlySpending)
        if (d.pensionIncome !== undefined) setPensionIncome(d.pensionIncome)
        if (d.otherIncome !== undefined) setOtherIncome(d.otherIncome)
        if (d.cppStartAge) setCppStartAge(d.cppStartAge)
        if (d.investmentReturn) setInvestmentReturn(d.investmentReturn)
        if (d.postRetirementReturn) setPostRetirementReturn(d.postRetirementReturn)
        if (d.inflationRate) setInflationRate(d.inflationRate)

        // Store scenario ID if returned from webhook
        if (content.scenarioId) {
          setScenarioId(content.scenarioId)
        }

        // Store calculation results if returned from webhook
        if (content.calculationResults) {
          setCalculationResults(content.calculationResults)
        }
      }
    }
  })

  const provinceNames: Record<Province, string> = {
    AB: 'Alberta',
    BC: 'British Columbia',
    MB: 'Manitoba',
    NB: 'New Brunswick',
    NL: 'Newfoundland and Labrador',
    NT: 'Northwest Territories',
    NS: 'Nova Scotia',
    NU: 'Nunavut',
    ON: 'Ontario',
    PE: 'Prince Edward Island',
    QC: 'Quebec',
    SK: 'Saskatchewan',
    YT: 'Yukon'
  }

  const provinceOptions = [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'YT', label: 'Yukon' }
  ]

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

      // Fire from left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#f43f5e', '#fb923c', '#fbbf24', '#10b981', '#06b6d4']
      })

      // Fire from right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#f43f5e', '#fb923c', '#fbbf24', '#10b981', '#06b6d4']
      })
    }, 250)
  }

  // Handle Calculate button click
  const handleCalculate = async () => {
    if (!currentAge || !retirementAge || !longevityAge || !province) {
      alert('Please complete at least the basic information before calculating')
      return
    }

    setIsCalculating(true)

    // Fire confetti celebration
    fireConfetti()

    try {
      // Build scenario object from collected data
      const scenario = {
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
          cpp: { start_age: cppStartAge || 65, monthly_amount_at_65: 1364.60 },
          oas: { start_age: 65, monthly_amount: 718.33 },
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

      // Call calculation API
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      })

      const data = await response.json()

      if (data.success && data.results) {
        setCalculationResults(data.results)
        setShowResults(true)
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
  const handleLoadScenario = (formData: FormData, scenarioName: string) => {
    // Populate all form fields
    setCurrentAge(formData.currentAge)
    setRetirementAge(formData.retirementAge)
    setLongevityAge(formData.longevityAge)
    setProvince(formData.province as Province | null)
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
    setInvestmentReturn(formData.investmentReturn)
    setPostRetirementReturn(formData.postRetirementReturn)
    setInflationRate(formData.inflationRate)

    // Mark as complete so form is visible
    setIsComplete(true)

    // Store the loaded scenario name
    setLoadedScenarioName(scenarioName)

    // Trigger green glow animation
    setFormGlowing(true)
    setTimeout(() => setFormGlowing(false), 2000) // 2 second glow

    // Show success feedback
    console.log(`✅ Loaded scenario: ${scenarioName}`)
  }

  // Create scenario from current form data
  const createScenarioFromFormData = (): Scenario => {
    const defaultPreRetirementReturn = (investmentReturn || 6) / 100

    // Build assets with contributions
    const assets: any = {}

    if (rrsp) {
      assets.rrsp = {
        balance: rrsp,
        annual_contribution: (rrspContribution || 0) * 12,
        rate_of_return: defaultPreRetirementReturn
      }
    }

    if (tfsa) {
      assets.tfsa = {
        balance: tfsa,
        annual_contribution: (tfsaContribution || 0) * 12,
        rate_of_return: defaultPreRetirementReturn
      }
    }

    if (nonRegistered) {
      assets.non_registered = {
        balance: nonRegistered,
        annual_contribution: (nonRegisteredContribution || 0) * 12,
        rate_of_return: defaultPreRetirementReturn,
        cost_base: nonRegistered * 0.7
      }
    }

    // Build income sources
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
        annual_amount: pensionIncome * 12,
        start_age: retirementAge || 65,
        indexed_to_inflation: true
      })
    }

    if (otherIncome && otherIncome > 0) {
      otherIncomeItems.push({
        description: 'Other Income',
        annual_amount: otherIncome * 12,
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
        province: province || Province.ON
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
    try {
      // Create variant scenario from current form data
      const baseScenario = createScenarioFromFormData()
      const variant = createFrontLoadVariant(baseScenario)
      setVariantScenario(variant)

      // Run calculation
      const supabase = createClient()
      const results = await calculateRetirementProjection(supabase, variant)
      setVariantResults(results)
    } catch (error) {
      console.error('Variant calculation failed:', error)
    } finally {
      setIsCalculatingVariant(false)
    }
  }

  // Handle resetting to baseline
  const handleResetVariant = () => {
    setVariantScenario(null)
    setVariantResults(null)
  }

  // Convert Scenario to FormData format
  const scenarioToFormData = (scenario: Scenario): FormData => {
    // Extract other income sources once to avoid repeated lookups
    const pension = scenario.income_sources.other_income?.find(i => i.description === 'Pension Income')
    const other = scenario.income_sources.other_income?.find(i => i.description === 'Other Income')

    return {
      currentAge: scenario.basic_inputs.current_age,
      retirementAge: scenario.basic_inputs.retirement_age,
      longevityAge: scenario.basic_inputs.longevity_age,
      province: scenario.basic_inputs.province,
      currentIncome: scenario.income_sources.employment?.annual_amount || 0,
      rrspAmount: scenario.assets.rrsp?.balance || 0,
      rrspContribution: scenario.assets.rrsp?.annual_contribution ? scenario.assets.rrsp.annual_contribution / 12 : 0,
      tfsaAmount: scenario.assets.tfsa?.balance || 0,
      tfsaContribution: scenario.assets.tfsa?.annual_contribution ? scenario.assets.tfsa.annual_contribution / 12 : 0,
      nonRegisteredAmount: scenario.assets.non_registered?.balance || 0,
      nonRegisteredContribution: scenario.assets.non_registered?.annual_contribution ? scenario.assets.non_registered.annual_contribution / 12 : 0,
      monthlySpending: scenario.expenses.fixed_monthly,
      pensionIncome: pension?.annual_amount ? pension.annual_amount / 12 : 0,
      otherIncome: other?.annual_amount ? other.annual_amount / 12 : 0,
      cppStartAge: scenario.income_sources.cpp?.start_age || 65,
      investmentReturn: scenario.assumptions.pre_retirement_return * 100,
      postRetirementReturn: scenario.assumptions.post_retirement_return * 100,
      inflationRate: scenario.assumptions.inflation_rate * 100,
    }
  }

  // Handle saving variant scenario
  const handleSaveVariant = () => {
    if (!variantScenario || !variantResults) return
    setSavingVariant(true)
    setShowScenarioSaveModal(true)
  }

  return (
    <div className={`min-h-screen ${theme.background}`}>
      {/* Header with Theme Toggle */}
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
                <p className="text-white/90 text-sm sm:text-base lg:text-lg mt-1">Voice-powered. Tax-accurate. Future teller.</p>
              </div>
            </div>
            {/* Auth & Theme Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Login/Logout */}
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

              {/* Theme Toggle Button */}
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

      {/* Asymmetric Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Conversation (40%) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Voice Card */}
            <Card className={`border-0 shadow-lg rounded-3xl overflow-hidden ${theme.card}`}>
              <CardContent className="pt-6 sm:pt-8 lg:pt-10">
                {!isConnected && !isConnecting && (
                  <div className="py-6 sm:py-8 lg:py-10 px-4 space-y-6">
                    <p className={`${theme.text.secondary} text-center text-base sm:text-lg leading-relaxed`}>
                      Let's figure out your retirement together. Just tap and our AI retirement expert will assist you!
                    </p>

                    {/* Load Saved Scenario */}
                    <div className="max-w-xs mx-auto">
                      <LoadScenarioDropdown onLoad={handleLoadScenario} isDarkMode={isDarkMode} />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-4">
                      <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <span className={`text-sm ${theme.text.muted}`}>or</span>
                      <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    </div>

                    {/* Start Conversation Button */}
                    <div className="text-center">
                      <Button
                        onClick={() => {
                          setIsComplete(false)  // Reset completion state when starting new conversation
                          connect()
                        }}
                        disabled={authLoading || !user}
                        size="lg"
                        className={`${theme.button.secondary} text-white px-6 sm:px-8 lg:px-10 py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-semibold rounded-2xl shadow-xl w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Mic className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                        {authLoading ? 'Loading...' : 'Start New Conversation'}
                      </Button>
                    </div>
                  </div>
                )}

                {isConnecting && (
                  <div className="text-center py-6 sm:py-8 lg:py-10 px-4">
                    <div className={`inline-block w-12 h-12 sm:w-16 sm:h-16 rounded-full ${theme.progress} animate-pulse mb-4`}></div>
                    <p className={`${theme.text.secondary} text-base sm:text-lg`}>Getting ready...</p>
                  </div>
                )}

                {isConnected && (
                  <div className="space-y-6">
                    {/* Audio Levels */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className={`flex items-center justify-between text-sm font-semibold ${theme.text.primary}`}>
                          <span>You're speaking</span>
                          <span className={isDarkMode ? "text-blue-400" : "text-rose-500"}>{Math.round(Math.min((userAudioLevel || 0) * 300, 100))}%</span>
                        </div>
                        <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full overflow-hidden`}>
                          <div
                            className={`h-full ${isDarkMode ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'} transition-all duration-100 rounded-full`}
                            style={{ width: `${Math.min((userAudioLevel || 0) * 300, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className={`flex items-center justify-between text-sm font-semibold ${theme.text.primary}`}>
                          <span>I'm speaking</span>
                          <span className={isDarkMode ? "text-purple-400" : "text-teal-500"}>{Math.round(Math.min((agentAudioLevel || 0) * 300, 100))}%</span>
                        </div>
                        <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full overflow-hidden`}>
                          <div
                            className={`h-full ${isDarkMode ? 'bg-gradient-to-r from-purple-400 to-purple-500' : 'bg-gradient-to-r from-teal-400 to-teal-500'} transition-all duration-100 rounded-full`}
                            style={{ width: `${Math.min((agentAudioLevel || 0) * 300, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    {!isComplete && (
                      <div className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                          <span className={`text-sm font-medium ${theme.text.primary}`}>
                            Listening...
                          </span>
                        </div>
                        <Button
                          onClick={disconnect}
                          variant="outline"
                          className={isDarkMode ? "border-blue-700 text-blue-400 hover:bg-blue-900/30 rounded-xl" : "border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl"}
                          size="sm"
                        >
                          <MicOff className="w-4 h-4 mr-2" />
                          End
                        </Button>
                      </div>
                    )}

                    {isComplete && (
                      <div className={isDarkMode ? "bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-2xl p-5 border-2 border-emerald-700" : "bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl p-5 border-2 border-emerald-200"}>
                        <p className={`${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'} font-bold flex items-center gap-2 text-center justify-center`}>
                          <CheckCircle2 className="w-6 h-6" />
                          Wonderful! We've got everything we need!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Questions Timeline */}
            {isConnected && (
              <Card className={`border-0 shadow-lg rounded-3xl ${theme.card}`}>
                <CardHeader>
                  <CardTitle className={`text-lg font-bold ${theme.text.primary}`}>What we're discussing</CardTitle>
                  <p className={`text-sm ${theme.text.secondary} mt-2`}>If something doesn't apply to you, just say the item name and "none" or "zero"</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {allSections.map((section) => {
                      const isCompleted = completedBatches.has(section.id)
                      const isActive = currentBatchId === section.id
                      const isInactive = !isCompleted && !isActive

                      return (
                        <div key={section.id} className="flex items-center gap-4">
                          {isCompleted ? (
                            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white shadow-lg">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                          ) : isActive ? (
                            <div className={`flex-shrink-0 w-10 h-10 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-gradient-to-br from-rose-400 to-orange-400'} flex items-center justify-center text-white font-bold shadow-lg`}>
                              {section.index + 1}
                            </div>
                          ) : (
                            <div className={`flex-shrink-0 w-10 h-10 rounded-2xl ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-500'} flex items-center justify-center font-bold`}>
                              {section.index + 1}
                            </div>
                          )}
                          <h4 className={`font-bold ${isInactive ? theme.text.muted : theme.text.primary}`}>
                            {section.title}
                          </h4>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Data (60%) */}
          <div className="lg:col-span-7">
            <Card className={`border-0 shadow-xl rounded-3xl ${theme.card} lg:sticky lg:top-8 transition-all duration-500 ${
              formGlowing
                ? 'ring-4 ring-emerald-500 shadow-emerald-500/50'
                : ''
            }`}>
              <CardHeader className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} pb-4 sm:pb-6 px-4 sm:px-6`}>
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className={`text-2xl sm:text-3xl font-bold ${theme.text.primary}`}>
                      Your Details{loadedScenarioName && <span className={`ml-2 text-lg ${theme.text.secondary}`}>- {loadedScenarioName}</span>}
                    </CardTitle>
                  </div>
                  {isComplete && (
                    <Button
                      onClick={() => setEditMode(!editMode)}
                      variant="outline"
                      className={isDarkMode ? "border-blue-700 text-blue-400 hover:bg-blue-900/30 rounded-xl text-sm sm:text-base flex-shrink-0" : "border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm sm:text-base flex-shrink-0"}
                    >
                      {editMode ? 'Done' : '✏️ Edit'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6">
                <div className="space-y-6 sm:space-y-8">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <WarmDataField label="Current Age" value={currentAge} editMode={editMode} onEdit={setCurrentAge} type="number" isGlowing={glowingFields.has('current_age')} isDarkMode={isDarkMode} theme={theme} />
                    <WarmDataField label="Retirement Age" value={retirementAge} editMode={editMode} onEdit={setRetirementAge} type="number" isGlowing={glowingFields.has('retirement_age')} isDarkMode={isDarkMode} theme={theme} />
                    <WarmDataField label="Life Expectancy Age" value={longevityAge} editMode={editMode} onEdit={setLongevityAge} type="number" isGlowing={glowingFields.has('longevity_age')} isDarkMode={isDarkMode} theme={theme} />
                    <WarmDataField label="Current Income (Annual)" value={currentIncome} editMode={editMode} onEdit={setCurrentIncome} type="currency" isGlowing={glowingFields.has('current_income')} isDarkMode={isDarkMode} theme={theme} />
                  </div>

                  <WarmDataField
                    label="Province/Territory"
                    value={province ? provinceNames[province] : null}
                    editValue={province}
                    editMode={editMode}
                    onEdit={setProvince}
                    type="select"
                    options={provinceOptions}
                    isGlowing={glowingFields.has('province')}
                    isDarkMode={isDarkMode}
                    theme={theme}
                  />

                  {/* Accounts */}
                  <div className="space-y-4">
                    <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-blue-700' : 'border-rose-200'}`}>
                      💰 Your Accounts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <WarmDataField label="RRSP Balance" value={rrsp} editMode={editMode} onEdit={setRrsp} type="currency" isGlowing={glowingFields.has('rrsp')} isDarkMode={isDarkMode} theme={theme} />
                      <WarmDataField label="RRSP Contribution (Annual)" value={rrspContribution} editMode={editMode} onEdit={setRrspContribution} type="currency" isGlowing={glowingFields.has('rrsp_contribution')} isDarkMode={isDarkMode} theme={theme} />
                      <WarmDataField label="TFSA Balance" value={tfsa} editMode={editMode} onEdit={setTfsa} type="currency" isGlowing={glowingFields.has('tfsa')} isDarkMode={isDarkMode} theme={theme} />
                      <WarmDataField label="TFSA Contribution (Annual)" value={tfsaContribution} editMode={editMode} onEdit={setTfsaContribution} type="currency" isGlowing={glowingFields.has('tfsa_contribution')} isDarkMode={isDarkMode} theme={theme} />
                      <WarmDataField label="Non-Registered Balance" value={nonRegistered} editMode={editMode} onEdit={setNonRegistered} type="currency" isGlowing={glowingFields.has('non_registered')} isDarkMode={isDarkMode} theme={theme} />
                      <WarmDataField label="Non-Registered Contribution (Annual)" value={nonRegisteredContribution} editMode={editMode} onEdit={setNonRegisteredContribution} type="currency" isGlowing={glowingFields.has('non_registered_contribution')} isDarkMode={isDarkMode} theme={theme} />
                    </div>
                  </div>

                  {/* Retirement */}
                  <div className="space-y-4">
                    <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-indigo-700' : 'border-orange-200'}`}>
                      🏖️ In Retirement
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <WarmDataField label="Monthly Spending (Pre-Tax)" value={monthlySpending} editMode={editMode} onEdit={setMonthlySpending} type="currency" isGlowing={glowingFields.has('monthly_spending')} isDarkMode={isDarkMode} theme={theme} />
                      <WarmDataField label="Expected Pension Income (Annual)" value={pensionIncome} editMode={editMode} onEdit={setPensionIncome} type="currency" isGlowing={glowingFields.has('pension_income')} isDarkMode={isDarkMode} theme={theme} />
                      <WarmDataField label="Other Income (Annual)" value={otherIncome} editMode={editMode} onEdit={setOtherIncome} type="currency" isGlowing={glowingFields.has('other_income')} isDarkMode={isDarkMode} theme={theme} />
                      <WarmDataField label="CPP Start Age" value={cppStartAge} editMode={editMode} onEdit={setCppStartAge} type="number" isGlowing={glowingFields.has('cpp_start_age')} isDarkMode={isDarkMode} theme={theme} />
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="space-y-4">
                    <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-purple-700' : 'border-teal-200'}`}>
                      📊 Rate Assumptions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                      <WarmDataField label="Pre-Retirement" value={investmentReturn} editMode={editMode} onEdit={setInvestmentReturn} type="percentage" isGlowing={glowingFields.has('investment_return')} isDarkMode={isDarkMode} theme={theme} />
                      <WarmDataField label="Post-Retirement" value={postRetirementReturn} editMode={editMode} onEdit={setPostRetirementReturn} type="percentage" isGlowing={glowingFields.has('post_retirement_return')} isDarkMode={isDarkMode} theme={theme} />
                      <WarmDataField label="Inflation" value={inflationRate} editMode={editMode} onEdit={setInflationRate} type="percentage" isGlowing={glowingFields.has('inflation_rate')} isDarkMode={isDarkMode} theme={theme} />
                    </div>
                  </div>

                  {/* Calculate/Recalculate Button */}
                  {isComplete && (
                    <Button
                      size="lg"
                      onClick={handleCalculate}
                      disabled={isCalculating}
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
                  )}
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
              <div className={`${theme.card} rounded-lg border p-6 max-w-3xl mx-auto`}>
                <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>
                  Try What-If Scenarios
                </h3>
                <button
                  onClick={() => handleScenarioClick('front_load')}
                  disabled={variantScenario?.name === 'Front-Load the Fun'}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    variantScenario?.name === 'Front-Load the Fun'
                      ? isDarkMode ? 'border-gray-600 bg-gray-700/50 opacity-60 cursor-not-allowed' : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                      : isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div className="flex-1">
                      <div className={`font-semibold ${theme.text.primary} mb-1`}>
                        Front-Load the Fun
                      </div>
                      <p className={`text-sm ${theme.text.secondary}`}>
                        Spend more early, scale back later
                      </p>
                    </div>
                    {variantScenario?.name === 'Front-Load the Fun' && (
                      <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-orange-600'} font-medium`}>Active</span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Baseline Results (shown only when NO variant active) */}
            {!variantScenario && (
              <div className="space-y-6 lg:space-y-8">
                <ResultsSummary results={calculationResults} retirementAge={retirementAge || 65} isDarkMode={isDarkMode} />
                <BalanceOverTimeChart results={calculationResults} isDarkMode={isDarkMode} />
                <IncomeCompositionChart results={calculationResults} isDarkMode={isDarkMode} />
                <TaxSummaryCard results={calculationResults} retirementAge={retirementAge || 65} isDarkMode={isDarkMode} />
                <RetirementNarrative results={calculationResults} isDarkMode={isDarkMode} />

                {/* Save Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => {
                      console.log('💾 Save Scenario clicked - isAnonymous:', isAnonymous, 'user:', user)
                      // Show appropriate modal based on user type
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
                    Save This Scenario
                  </button>
                </div>
              </div>
            )}

            {/* Scenario Comparison Tabs (shown when variant exists) */}
            {variantScenario && variantResults && (
              <ScenarioComparison
                baselineScenario={createScenarioFromFormData()}
                baselineResults={calculationResults}
                variantScenario={variantScenario}
                variantResults={variantResults}
                isDarkMode={isDarkMode}
                onSave={handleSaveVariant}
                onReset={handleResetVariant}
              />
            )}

            {/* Calculation Disclosure */}
            <CalculationDisclosure isDark={isDarkMode} />
          </div>
        )}
      </div>

      {/* Save With Account Modal (for anonymous users clicking Save Scenario) */}
      <SaveWithAccountModal
        isOpen={showSaveWithAccountModal}
        onClose={() => setShowSaveWithAccountModal(false)}
        formData={getCurrentFormData()}
        calculationResults={calculationResults}
      />

      {/* Save Scenario Modal (for authenticated users) */}
      <SaveScenarioModal
        isOpen={showScenarioSaveModal}
        onClose={() => {
          setShowScenarioSaveModal(false)
          setSavingVariant(false)
        }}
        formData={savingVariant && variantScenario ? scenarioToFormData(variantScenario) : getCurrentFormData()}
        calculationResults={savingVariant && variantResults ? variantResults : calculationResults}
        isDarkMode={isDarkMode}
        defaultName={savingVariant && variantScenario ? variantScenario.name : undefined}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={isDarkMode}
      />

      {/* Merge Anonymous Scenarios Modal */}
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

      {/* Scenario Modal */}
      <ScenarioModal
        isOpen={showScenarioModal}
        onClose={() => setShowScenarioModal(false)}
        scenarioType={selectedScenarioType}
        baselineMonthly={monthlySpending || 0}
        retirementAge={retirementAge || 65}
        isDarkMode={isDarkMode}
        onRun={handleRunScenario}
      />
    </div>
  )
}
