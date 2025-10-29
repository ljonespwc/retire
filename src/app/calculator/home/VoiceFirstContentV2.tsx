'use client'

import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useState, useRef, useEffect } from 'react'
import { Province } from '@/types/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Calculator, Sun, Moon, LogIn, LogOut, User, Play, Lightbulb } from 'lucide-react'
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
            onFocus={onFocus}
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
              } else {
                const numValue = e.target.value === '' ? null : Number(e.target.value)
                onEdit(numValue)
              }
            }}
            onFocus={onFocus}
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
function HelpSidebar({ focusedField, isDarkMode, theme, onStartPlanning, onLoadScenario, planningStarted }: {
  focusedField: string | null
  isDarkMode: boolean
  theme: any
  onStartPlanning: () => void
  onLoadScenario: (formData: FormData, scenarioName: string) => void
  planningStarted: boolean
}) {
  const tips: Record<string, { title: string; content: string; icon: string }> = {
    currentAge: {
      title: "Current Age",
      icon: "🎂",
      content: "Your age today. We calculate how many working years remain until retirement.\n\nMost Canadians start serious retirement planning in their 40s-50s, but starting earlier gives your investments more time to compound."
    },
    retirementAge: {
      title: "Retirement Age",
      icon: "🏖️",
      content: "When you plan to stop working full-time. The average Canadian retires at 64.\n\nEarlier retirement (55-60) requires more savings. Later retirement (67-70) means more time to save and higher CPP/OAS benefits."
    },
    longevityAge: {
      title: "Life Expectancy",
      icon: "📅",
      content: "How long you expect to live. Canadian life expectancy: men 81, women 85.\n\nMost planners use 90-95 to be safe. Planning longer ensures your money lasts—better to have leftovers than run out!"
    },
    province: {
      title: "Province",
      icon: "📍",
      content: "Your province determines your tax rates. Each province has different brackets and credits.\n\nLowest taxes: Alberta, SK. Highest: QC, NS, NL. Moving provinces in retirement can affect your after-tax income."
    },
    currentIncome: {
      title: "Current Income",
      icon: "💵",
      content: "Your annual employment income before taxes. Median Canadian income: ~$62,000.\n\nUsed to estimate your CPP contributions and future benefit. Higher income = higher CPP (up to max $17,200 at age 65)."
    },
    rrsp: {
      title: "RRSP Balance",
      icon: "🏦",
      content: "Registered Retirement Savings Plan. Tax-deferred growth—you pay income tax when you withdraw.\n\n2025 contribution limit: 18% of income (max $31,560). Converts to RRIF at age 71. Typical balance at 65: $200K-500K."
    },
    rrspContribution: {
      title: "RRSP Contributions",
      icon: "📈",
      content: "Annual RRSP contributions. Tax-deductible and grow tax-free until withdrawal.\n\nTypical: 5-10% of income. With employer matching, aim for 10-15%. Max $31,560/year (2025). Unused room carries forward."
    },
    tfsa: {
      title: "TFSA Balance",
      icon: "🌟",
      content: "Tax-Free Savings Account. Grows tax-free forever. Withdrawals are 100% tax-free—the best account for retirement income!\n\nCumulative limit since 2009: ~$95,000 if you never contributed. No age restrictions."
    },
    tfsaContribution: {
      title: "TFSA Contributions",
      icon: "💎",
      content: "Annual TFSA contributions. 2025 limit: $7,000. No tax deduction, but all growth and withdrawals are tax-free.\n\nIdeal for retirement: withdraw TFSA first to minimize taxable income and preserve OAS."
    },
    nonRegistered: {
      title: "Non-Registered",
      icon: "💼",
      content: "Taxable investment accounts. You pay capital gains tax (50% inclusion rate) on profits when you sell.\n\nUse these after maxing RRSP/TFSA. More tax-efficient for investments held long-term."
    },
    nonRegisteredContribution: {
      title: "Non-Registered Contributions",
      icon: "➕",
      content: "Annual contributions to taxable accounts. No limits, but no tax advantages either.\n\nMax out RRSP ($31,560) and TFSA ($7,000) first for better tax efficiency—that's $38,560/year in tax-sheltered savings."
    },
    monthlySpending: {
      title: "Monthly Spending",
      icon: "🛒",
      content: "Your desired monthly spending in retirement (pre-tax). Rule of thumb: 70-80% of pre-retirement income.\n\nMedian Canadian retiree: ~$4,000-5,000/month. We'll calculate taxes and adjust for inflation automatically."
    },
    pensionIncome: {
      title: "Pension Income",
      icon: "🏢",
      content: "Annual employer pension. Common for government, education, and union workers.\n\nTypical defined benefit pension: $30K-60K/year. Federal public service avg: ~$45K. Check if yours is indexed to inflation."
    },
    otherIncome: {
      title: "Other Income",
      icon: "💰",
      content: "Any other income in retirement: rental properties, part-time work, consulting, dividends from a business.\n\nReduces portfolio withdrawals and can delay CPP/OAS for higher benefits. Include annual amount."
    },
    cppStartAge: {
      title: "CPP Start Age",
      icon: "🇨🇦",
      content: "When you'll start Canada Pension Plan. 2025 max at 65: $17,200/year.\n\nStart at 60: 36% reduction ($11,000). Start at 70: 42% increase ($24,400). Break-even around age 74. Most Canadians start at 65."
    },
    investmentReturn: {
      title: "Pre-Retirement Return",
      icon: "📊",
      content: "Expected annual return while working (ages 30-65). Historical Canadian stock market: ~6-7%.\n\nConservative (bonds/GICs): 3-4%. Balanced (60/40): 5-6%. Aggressive (stocks): 7-8%. Default: 6%."
    },
    postRetirementReturn: {
      title: "Post-Retirement Return",
      icon: "🎯",
      content: "Expected return in retirement. Usually lower (4-5%) as you shift to bonds/GICs for stability and income.\n\nConservative: 3%. Balanced: 4-5%. Still some growth: 5-6%. Default: 4%."
    },
    inflationRate: {
      title: "Inflation Rate",
      icon: "📉",
      content: "Expected annual inflation. Canadian long-term average: 2-2.5%. Bank of Canada target: 2%.\n\nYour spending, CPP, and OAS will adjust for inflation. Using 2% is standard for retirement planning. Default: 2%."
    }
  }

  const tip = focusedField && tips[focusedField] ? tips[focusedField] : null

  return (
    <Card className={`border-0 shadow-lg rounded-3xl ${theme.card} h-full`}>
      <CardContent className="pt-6 sm:pt-8 lg:pt-10">
        {!planningStarted ? (
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

            {/* Start Planning Button */}
            <div className="text-center">
              <Button
                onClick={onStartPlanning}
                size="lg"
                className={`${theme.button.secondary} text-white px-6 sm:px-8 lg:px-10 py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-semibold rounded-2xl shadow-xl w-full sm:w-auto`}
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Start Planning
              </Button>
            </div>
          </div>
        ) : tip ? (
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
  const [investmentReturn, setInvestmentReturn] = useState<number | null>(6)
  const [postRetirementReturn, setPostRetirementReturn] = useState<number | null>(4)
  const [inflationRate, setInflationRate] = useState<number | null>(2)

  // UI state
  const [editMode, setEditMode] = useState(false)
  const [justCalculated, setJustCalculated] = useState(false)
  const [planningStarted, setPlanningStarted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
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
  const [savingVariant, setSavingVariant] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false)
  const [showScenarioSaveModal, setShowScenarioSaveModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
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

  // Handle Start Planning button
  // Check if mandatory fields are complete
  const isMandatoryFieldsComplete = () => {
    return currentAge !== null && retirementAge !== null && longevityAge !== null && province !== ''
  }

  const handleStartPlanning = () => {
    setPlanningStarted(true)
    setEditMode(true)
  }

  // Handle Calculate button click
  const handleCalculate = async () => {
    if (!isMandatoryFieldsComplete()) {
      alert('Please complete at least the basic information before calculating')
      return
    }

    setIsCalculating(true)
    fireConfetti()

    try {
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

      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      })

      const data = await response.json()

      if (data.success && data.results) {
        setCalculationResults(data.results)
        setShowResults(true)
        setEditMode(false)
        setJustCalculated(true)
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
    setInvestmentReturn(formData.investmentReturn)
    setPostRetirementReturn(formData.postRetirementReturn)
    setInflationRate(formData.inflationRate)

    setLoadedScenarioName(scenarioName)
    setPlanningStarted(true)
    setEditMode(false)

    console.log(`✅ Loaded scenario: ${scenarioName}`)
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

  // Create scenario from current form data
  const createScenarioFromFormData = (): Scenario => {
    const defaultPreRetirementReturn = (investmentReturn || 6) / 100

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
    try {
      const baseScenario = createScenarioFromFormData()
      const variant = createFrontLoadVariant(baseScenario)
      setVariantScenario(variant)

      const supabase = createClient()
      const results = await calculateRetirementProjection(supabase, variant)
      setVariantResults(results)
    } catch (error) {
      console.error('Variant calculation failed:', error)
    } finally {
      setIsCalculatingVariant(false)
    }
  }

  const handleResetVariant = () => {
    setVariantScenario(null)
    setVariantResults(null)
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

  const handleSaveVariant = () => {
    if (!variantScenario || !variantResults) return
    setSavingVariant(true)
    setShowScenarioSaveModal(true)
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Sidebar - Help/Tips (40%) */}
          <div className="lg:col-span-5">
            <HelpSidebar
              focusedField={focusedField}
              isDarkMode={isDarkMode}
              theme={theme}
              onStartPlanning={handleStartPlanning}
              onLoadScenario={handleLoadScenario}
              planningStarted={planningStarted}
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
                        }
                        setEditMode(!editMode)
                        setJustCalculated(false)
                      }}
                      variant="outline"
                      className={isDarkMode ? "border-blue-700 text-blue-400 hover:bg-blue-900/30 rounded-xl text-sm sm:text-base flex-shrink-0" : "border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm sm:text-base flex-shrink-0"}
                    >
                      {editMode ? 'Done Editing' : '✏️ Edit'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6">
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
                    value={province ? provinceNames[province as Province] : null}
                    editValue={province}
                    editMode={editMode}
                    onEdit={setProvince}
                    type="select"
                    options={provinceOptions}
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
                      <WarmDataField label="Monthly Spending (Pre-Tax)" value={monthlySpending} editMode={editMode} onEdit={setMonthlySpending} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => setFocusedField('monthlySpending')} />
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

                  {/* Calculate Button */}
                  <Button
                    size="lg"
                    onClick={handleCalculate}
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

      {/* Modals */}
      <SaveWithAccountModal
        isOpen={showSaveWithAccountModal}
        onClose={() => setShowSaveWithAccountModal(false)}
        formData={getCurrentFormData()}
        calculationResults={calculationResults}
      />

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
    </div>
  )
}
