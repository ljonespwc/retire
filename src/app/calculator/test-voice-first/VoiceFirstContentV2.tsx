'use client'

import { useLayercodeVoice } from '@/hooks/useLayercodeVoice'
import { useState } from 'react'
import { Province } from '@/types/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Heart, CheckCircle2, MessageCircle, BarChart3, Calculator, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { SavePromptModal } from '@/components/auth/SavePromptModal'
import { CalculationResults } from '@/types/calculator'
import { ResultsSummary } from '@/components/results/ResultsSummary'
import { BalanceOverTimeChart } from '@/components/results/BalanceOverTimeChart'
import { IncomeCompositionChart } from '@/components/results/IncomeCompositionChart'
import { TaxSummaryCard } from '@/components/results/TaxSummaryCard'
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

export function VoiceFirstContentV2() {
  // Get auth context for user ID
  const { user, isAnonymous } = useAuth()

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
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [scenarioId, setScenarioId] = useState<string | undefined>(undefined)
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

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

  const {
    isConnected,
    isConnecting,
    userAudioLevel,
    agentAudioLevel,
    connect,
    disconnect,
  } = useLayercodeVoice({
    autoConnect: false,
    metadata: user?.id ? { user_id: user.id } : undefined, // Pass user ID to webhook
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
          console.log('📊 Calculation results received:', content.calculationResults)
          setCalculationResults(content.calculationResults)
        }

        // Show save modal for anonymous users
        if (isAnonymous) {
          setShowSaveModal(true)
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
          pension: pensionIncome ? { annual_amount: pensionIncome } : undefined,
          other: otherIncome ? { annual_amount: otherIncome } : undefined
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
        console.log('✅ Calculation successful:', data.results)
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

  // WarmDataField - theme-aware form field component
  function WarmDataField({
    label,
    value,
    editMode,
    onEdit,
    type,
    isGlowing,
    options,
    editValue
  }: {
    label: string
    value: any
    editMode: boolean
    onEdit?: (val: any) => void
    type: 'number' | 'currency' | 'percentage' | 'text' | 'select'
    isGlowing?: boolean
    options?: { value: string; label: string }[]
    editValue?: any
  }) {
    const formatValue = () => {
      if (value === null || value === undefined) return <span className={`${theme.text.muted} text-sm`}>—</span>
      if (type === 'currency') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>${value.toLocaleString()}</span>
      if (type === 'percentage') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>{value}%</span>
      if (type === 'number') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>{value}</span>
      return <span className={`${theme.text.primary} font-semibold text-base sm:text-lg`}>{value}</span>
    }

    const glowClass = isGlowing ? theme.glow : ''

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
              value={value || ''}
              onChange={(e) => onEdit(type === 'text' ? e.target.value : Number(e.target.value) || null)}
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

      {/* Asymmetric Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Conversation (40%) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Voice Card */}
            <Card className={`border-0 shadow-lg rounded-3xl overflow-hidden ${theme.card}`}>
              <CardContent className="pt-6 sm:pt-8 lg:pt-10">
                {!isConnected && !isConnecting && (
                  <div className="text-center py-6 sm:py-8 lg:py-10 px-4">
                    <p className={`${theme.text.secondary} mb-6 text-base sm:text-lg leading-relaxed`}>
                      Let's figure out your retirement together. Just tap and our AI retirement expert will assist you!
                    </p>
                    <Button
                      onClick={connect}
                      size="lg"
                      className={`${theme.button.secondary} text-white px-6 sm:px-8 lg:px-10 py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-semibold rounded-2xl shadow-xl w-full sm:w-auto`}
                    >
                      <Mic className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                      Start Conversation
                    </Button>
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
            <Card className={`border-0 shadow-xl rounded-3xl ${theme.card} lg:sticky lg:top-8`}>
              <CardHeader className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} pb-4 sm:pb-6 px-4 sm:px-6`}>
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className={`text-2xl sm:text-3xl font-bold ${theme.text.primary}`}>Your Details</CardTitle>
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
                    <WarmDataField label="Current Age" value={currentAge} editMode={editMode} onEdit={setCurrentAge} type="number" isGlowing={glowingFields.has('current_age')} />
                    <WarmDataField label="Retirement Age" value={retirementAge} editMode={editMode} onEdit={setRetirementAge} type="number" isGlowing={glowingFields.has('retirement_age')} />
                    <WarmDataField label="Life Expectancy Age" value={longevityAge} editMode={editMode} onEdit={setLongevityAge} type="number" isGlowing={glowingFields.has('longevity_age')} />
                    <WarmDataField label="Current Income (Annual)" value={currentIncome} editMode={editMode} onEdit={setCurrentIncome} type="currency" isGlowing={glowingFields.has('current_income')} />
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
                  />

                  {/* Accounts */}
                  <div className="space-y-4">
                    <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-blue-700' : 'border-rose-200'}`}>
                      💰 Your Accounts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <WarmDataField label="RRSP Balance" value={rrsp} editMode={editMode} onEdit={setRrsp} type="currency" isGlowing={glowingFields.has('rrsp')} />
                      <WarmDataField label="RRSP Contribution (Annual)" value={rrspContribution} editMode={editMode} onEdit={setRrspContribution} type="currency" isGlowing={glowingFields.has('rrsp_contribution')} />
                      <WarmDataField label="TFSA Balance" value={tfsa} editMode={editMode} onEdit={setTfsa} type="currency" isGlowing={glowingFields.has('tfsa')} />
                      <WarmDataField label="TFSA Contribution (Annual)" value={tfsaContribution} editMode={editMode} onEdit={setTfsaContribution} type="currency" isGlowing={glowingFields.has('tfsa_contribution')} />
                      <WarmDataField label="Non-Registered Balance" value={nonRegistered} editMode={editMode} onEdit={setNonRegistered} type="currency" isGlowing={glowingFields.has('non_registered')} />
                      <WarmDataField label="Non-Registered Contribution (Annual)" value={nonRegisteredContribution} editMode={editMode} onEdit={setNonRegisteredContribution} type="currency" isGlowing={glowingFields.has('non_registered_contribution')} />
                    </div>
                  </div>

                  {/* Retirement */}
                  <div className="space-y-4">
                    <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-indigo-700' : 'border-orange-200'}`}>
                      🏖️ In Retirement
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <WarmDataField label="Desired Monthly Income (Net)" value={monthlySpending} editMode={editMode} onEdit={setMonthlySpending} type="currency" isGlowing={glowingFields.has('monthly_spending')} />
                      <WarmDataField label="Expected Pension Income (Annual)" value={pensionIncome} editMode={editMode} onEdit={setPensionIncome} type="currency" isGlowing={glowingFields.has('pension_income')} />
                      <WarmDataField label="Other Income (Annual)" value={otherIncome} editMode={editMode} onEdit={setOtherIncome} type="currency" isGlowing={glowingFields.has('other_income')} />
                      <WarmDataField label="CPP Start Age" value={cppStartAge} editMode={editMode} onEdit={setCppStartAge} type="number" isGlowing={glowingFields.has('cpp_start_age')} />
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="space-y-4">
                    <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-purple-700' : 'border-teal-200'}`}>
                      📊 Rate Assumptions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                      <WarmDataField label="Pre-Retirement" value={investmentReturn} editMode={editMode} onEdit={setInvestmentReturn} type="percentage" isGlowing={glowingFields.has('investment_return')} />
                      <WarmDataField label="Post-Retirement" value={postRetirementReturn} editMode={editMode} onEdit={setPostRetirementReturn} type="percentage" isGlowing={glowingFields.has('post_retirement_return')} />
                      <WarmDataField label="Inflation" value={inflationRate} editMode={editMode} onEdit={setInflationRate} type="percentage" isGlowing={glowingFields.has('inflation_rate')} />
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
          <div className="w-full mt-12">
            <div className="text-center mb-8">
              <h2 className={`text-3xl sm:text-4xl font-bold ${theme.text.primary}`}>Your Retirement Projection</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <ResultsSummary results={calculationResults} retirementAge={retirementAge || 65} isDarkMode={isDarkMode} />
              <TaxSummaryCard results={calculationResults} retirementAge={retirementAge || 65} isDarkMode={isDarkMode} />
              <div className="lg:col-span-2">
                <BalanceOverTimeChart results={calculationResults} />
              </div>
              <div className="lg:col-span-2">
                <IncomeCompositionChart results={calculationResults} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Prompt Modal (only for anonymous users) */}
      <SavePromptModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        scenarioName={`Retirement Plan ${new Date().toLocaleDateString()}`}
      />
    </div>
  )
}
