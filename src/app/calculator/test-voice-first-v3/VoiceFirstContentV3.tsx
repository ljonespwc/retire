'use client'

import { useLayercodeVoice } from '@/hooks/useLayercodeVoice'
import { useState } from 'react'
import { Province } from '@/types/constants'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Mic, MicOff, Circle } from 'lucide-react'

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

export function VoiceFirstContentV3() {
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
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [glowingFields, setGlowingFields] = useState<Set<string>>(new Set())

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
        setProgress({ current: content.batchIndex + 1, total: content.totalBatches })
      }

      if (content.type === 'batch_response') {
        const values = content.values
        if (values.current_age !== undefined) {
          setCurrentAge(values.current_age)
          triggerGlow('current_age')
        }
        if (values.retirement_age !== undefined) {
          setRetirementAge(values.retirement_age)
          triggerGlow('retirement_age')
        }
        if (values.longevity_age !== undefined) {
          setLongevityAge(values.longevity_age)
          triggerGlow('longevity_age')
        }
        if (values.province !== undefined) {
          setProvince(values.province)
          triggerGlow('province')
        }
        if (values.current_income !== undefined) {
          setCurrentIncome(values.current_income)
          triggerGlow('current_income')
        }
        if (values.rrsp_amount !== undefined) {
          setRrsp(values.rrsp_amount)
          triggerGlow('rrsp')
        }
        if (values.rrsp_contribution !== undefined) {
          setRrspContribution(values.rrsp_contribution)
          triggerGlow('rrsp_contribution')
        }
        if (values.tfsa_amount !== undefined) {
          setTfsa(values.tfsa_amount)
          triggerGlow('tfsa')
        }
        if (values.tfsa_contribution !== undefined) {
          setTfsaContribution(values.tfsa_contribution)
          triggerGlow('tfsa_contribution')
        }
        if (values.non_registered_amount !== undefined) {
          setNonRegistered(values.non_registered_amount)
          triggerGlow('non_registered')
        }
        if (values.non_registered_contribution !== undefined) {
          setNonRegisteredContribution(values.non_registered_contribution)
          triggerGlow('non_registered_contribution')
        }
        if (values.monthly_spending !== undefined) {
          setMonthlySpending(values.monthly_spending)
          triggerGlow('monthly_spending')
        }
        if (values.pension_income !== undefined) {
          setPensionIncome(values.pension_income)
          triggerGlow('pension_income')
        }
        if (values.other_income !== undefined) {
          setOtherIncome(values.other_income)
          triggerGlow('other_income')
        }
        if (values.cpp_start_age !== undefined) {
          setCppStartAge(values.cpp_start_age)
          triggerGlow('cpp_start_age')
        }
        if (values.investment_return !== undefined) {
          setInvestmentReturn(values.investment_return)
          triggerGlow('investment_return')
        }
        if (values.post_retirement_return !== undefined) {
          setPostRetirementReturn(values.post_retirement_return)
          triggerGlow('post_retirement_return')
        }
        if (values.inflation_rate !== undefined) {
          setInflationRate(values.inflation_rate)
          triggerGlow('inflation_rate')
        }
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

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
        <div className="max-w-7xl mx-auto px-16 py-12">
          <h1 className="text-5xl font-light tracking-tight text-gray-900 mb-2" style={{ letterSpacing: '-0.02em' }}>
            Retirement Calculator
          </h1>
          <p className="text-gray-500 text-sm tracking-wide uppercase">V3: Minimalist • Voice-First</p>
        </div>
      </div>

      {/* Split Screen Layout - Exact 50/50 */}
      <div className="flex" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Left Panel - Voice */}
        <div className="w-1/2 border-r" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="h-full flex flex-col px-16 py-16">
            <div className="mb-12">
              <h2 className="text-2xl font-light text-gray-900 mb-2">Conversation</h2>
              <p className="text-gray-500 text-sm leading-relaxed">Speak naturally about your retirement plans</p>
            </div>

            {!isConnected && !isConnecting && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <button
                  onClick={connect}
                  className="group relative w-32 h-32 mb-10 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 rounded-full border-2 border-gray-300 group-hover:border-gray-900 transition-colors"></div>
                  <div className="absolute inset-2 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors flex items-center justify-center">
                    <Mic className="w-12 h-12 text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                </button>
                <p className="text-gray-600 text-base leading-relaxed max-w-md text-center">
                  Begin voice conversation
                </p>
              </div>
            )}

            {isConnecting && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-gray-300 animate-pulse mb-6"></div>
                <p className="text-gray-500 text-sm">Connecting</p>
              </div>
            )}

            {isConnected && (
              <div className="flex-1 flex flex-col space-y-10">
                {/* Progress */}
                {progress && !isComplete && (
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-600 font-light">
                        Section {progress.current} / {progress.total}
                      </span>
                      <span className="text-xs text-gray-400">{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <Progress
                      value={(progress.current / progress.total) * 100}
                      className="h-px bg-gray-200"
                    />
                  </div>
                )}

                {/* Audio Levels - Minimalist */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 font-light">
                      <span>You</span>
                      <span>{Math.round((userAudioLevel || 0) * 100)}</span>
                    </div>
                    <div className="h-px bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-gray-900 transition-all duration-100"
                        style={{ width: `${(userAudioLevel || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 font-light">
                      <span>Assistant</span>
                      <span>{Math.round((agentAudioLevel || 0) * 100)}</span>
                    </div>
                    <div className="h-px bg-gray-200 overflow-hidden">
                      <div
                        className="h-full transition-all duration-100"
                        style={{
                          width: `${(agentAudioLevel || 0) * 100}%`,
                          backgroundColor: '#D4AF37'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                {batchPrompts.length > 0 && (
                  <div className="flex-1 overflow-auto">
                    <div className="space-y-8">
                      {batchPrompts.map((batch) => (
                        <div key={batch.batchId} className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Circle className="w-3 h-3" style={{ color: '#D4AF37' }} />
                            <h3 className="text-sm font-light text-gray-900">{batch.batchTitle}</h3>
                          </div>
                          <ul className="ml-7 space-y-2">
                            {batch.questions.map(q => (
                              <li key={q.id} className="text-xs text-gray-500 leading-relaxed">
                                {q.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Bar */}
                <div className="pt-6 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>
                      <span className="text-xs text-gray-600 font-light">
                        {isComplete ? 'Complete' : 'Active'}
                      </span>
                    </div>
                    <button
                      onClick={disconnect}
                      className="text-xs text-gray-500 hover:text-gray-900 transition-colors underline underline-offset-2"
                    >
                      End
                    </button>
                  </div>
                </div>

                {isComplete && (
                  <div className="py-4 px-6 border" style={{ borderColor: '#D4AF37' }}>
                    <p className="text-xs text-gray-700 text-center">
                      Data collection complete
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Data */}
        <div className="w-1/2 overflow-auto">
          <div className="px-16 py-16">
            <div className="mb-12 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-2">Information</h2>
                <p className="text-gray-500 text-sm">Collected data summary</p>
              </div>
              {isComplete && (
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors underline underline-offset-2"
                >
                  {editMode ? 'Done' : 'Edit'}
                </button>
              )}
            </div>

            <div className="space-y-12">
              {/* Basic */}
              <div className="grid grid-cols-2 gap-8">
                <ZenField label="Current Age" value={currentAge} editMode={editMode} onEdit={setCurrentAge} type="number" isGlowing={glowingFields.has('current_age')} />
                <ZenField label="Retirement Age" value={retirementAge} editMode={editMode} onEdit={setRetirementAge} type="number" isGlowing={glowingFields.has('retirement_age')} />
                <ZenField label="Life Expectancy" value={longevityAge} editMode={editMode} onEdit={setLongevityAge} type="number" isGlowing={glowingFields.has('longevity_age')} />
                <ZenField label="Current Income" value={currentIncome} editMode={editMode} onEdit={setCurrentIncome} type="currency" isGlowing={glowingFields.has('current_income')} />
              </div>

              <ZenField
                label="Province"
                value={province ? provinceNames[province] : null}
                editMode={false}
                type="text"
                isGlowing={glowingFields.has('province')}
              />

              <Separator className="bg-gray-200" style={{ height: '0.5px' }} />

              {/* Accounts */}
              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-widest text-gray-400">Accounts</h3>
                <div className="grid grid-cols-2 gap-8">
                  <ZenField label="RRSP Balance" value={rrsp} editMode={editMode} onEdit={setRrsp} type="currency" isGlowing={glowingFields.has('rrsp')} />
                  <ZenField label="RRSP Contribution" value={rrspContribution} editMode={editMode} onEdit={setRrspContribution} type="currency" isGlowing={glowingFields.has('rrsp_contribution')} />
                  <ZenField label="TFSA Balance" value={tfsa} editMode={editMode} onEdit={setTfsa} type="currency" isGlowing={glowingFields.has('tfsa')} />
                  <ZenField label="TFSA Contribution" value={tfsaContribution} editMode={editMode} onEdit={setTfsaContribution} type="currency" isGlowing={glowingFields.has('tfsa_contribution')} />
                  <ZenField label="Non-Registered" value={nonRegistered} editMode={editMode} onEdit={setNonRegistered} type="currency" isGlowing={glowingFields.has('non_registered')} />
                  <ZenField label="Non-Reg Contribution" value={nonRegisteredContribution} editMode={editMode} onEdit={setNonRegisteredContribution} type="currency" isGlowing={glowingFields.has('non_registered_contribution')} />
                </div>
              </div>

              <Separator className="bg-gray-200" style={{ height: '0.5px' }} />

              {/* Retirement */}
              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-widest text-gray-400">Retirement</h3>
                <div className="grid grid-cols-2 gap-8">
                  <ZenField label="Monthly Spending" value={monthlySpending} editMode={editMode} onEdit={setMonthlySpending} type="currency" isGlowing={glowingFields.has('monthly_spending')} />
                  <ZenField label="Pension Income" value={pensionIncome} editMode={editMode} onEdit={setPensionIncome} type="currency" isGlowing={glowingFields.has('pension_income')} />
                  <ZenField label="Other Income" value={otherIncome} editMode={editMode} onEdit={setOtherIncome} type="currency" isGlowing={glowingFields.has('other_income')} />
                  <ZenField label="CPP Start Age" value={cppStartAge} editMode={editMode} onEdit={setCppStartAge} type="number" isGlowing={glowingFields.has('cpp_start_age')} />
                </div>
              </div>

              <Separator className="bg-gray-200" style={{ height: '0.5px' }} />

              {/* Rates */}
              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-widest text-gray-400">Assumptions</h3>
                <div className="grid grid-cols-3 gap-8">
                  <ZenField label="Pre-Retirement" value={investmentReturn} editMode={editMode} onEdit={setInvestmentReturn} type="percentage" isGlowing={glowingFields.has('investment_return')} />
                  <ZenField label="Post-Retirement" value={postRetirementReturn} editMode={editMode} onEdit={setPostRetirementReturn} type="percentage" isGlowing={glowingFields.has('post_retirement_return')} />
                  <ZenField label="Inflation" value={inflationRate} editMode={editMode} onEdit={setInflationRate} type="percentage" isGlowing={glowingFields.has('inflation_rate')} />
                </div>
              </div>

              {/* Calculate */}
              {isComplete && (
                <button
                  className="w-full py-6 border-2 border-gray-900 text-gray-900 text-sm font-light tracking-wide uppercase hover:bg-gray-900 hover:text-white transition-all duration-300"
                >
                  Calculate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Zen minimalist field
function ZenField({
  label,
  value,
  editMode,
  onEdit,
  type,
  isGlowing = false
}: {
  label: string
  value: any
  editMode: boolean
  onEdit?: (val: any) => void
  type: 'number' | 'currency' | 'percentage' | 'text'
  isGlowing?: boolean
}) {
  const formatValue = () => {
    if (value === null || value === undefined) return <span className="text-gray-300">—</span>
    if (type === 'currency') return <span className="text-gray-900">${value.toLocaleString()}</span>
    if (type === 'percentage') return <span className="text-gray-900">{value}%</span>
    if (type === 'number') return <span className="text-gray-900">{value}</span>
    return <span className="text-gray-900">{value}</span>
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs text-gray-400 uppercase tracking-widest font-light">
        {label}
      </label>
      {editMode && onEdit ? (
        <input
          type={type === 'text' ? 'text' : 'number'}
          value={value || ''}
          onChange={(e) => onEdit(type === 'text' ? e.target.value : Number(e.target.value) || null)}
          className="w-full py-3 border-b border-gray-300 text-gray-900 text-lg font-light focus:border-gray-900 focus:outline-none transition-colors bg-transparent"
          step={type === 'percentage' ? '0.1' : '1'}
        />
      ) : (
        <div
          className={`py-3 border-b text-lg font-light transition-all duration-300 ${
            isGlowing
              ? 'border-[#D4AF37] shadow-[0_2px_15px_rgba(212,175,55,0.5)] animate-pulse'
              : 'border-gray-200'
          }`}
        >
          {formatValue()}
        </div>
      )}
    </div>
  )
}
