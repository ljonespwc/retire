'use client'

import { useLayercodeVoice } from '@/hooks/useLayercodeVoice'
import { useState } from 'react'
import { Province } from '@/types/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Heart, CheckCircle2, MessageCircle } from 'lucide-react'

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

export function VoiceFirstContentV2Dark() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Dark Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0">
              🇨🇦
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                The Ultimate Canadian Retirement Calculator
              </h1>
              <p className="text-white/90 text-sm sm:text-base lg:text-lg mt-1">Voice-powered. Tax-accurate. Future teller.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetric Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Conversation (40%) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Voice Card */}
            <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-slate-800">
              <CardContent className="pt-6 sm:pt-8 lg:pt-10">
                {!isConnected && !isConnecting && (
                  <div className="text-center py-6 sm:py-8 lg:py-10 px-4">
                    <p className="text-gray-300 mb-6 text-base sm:text-lg leading-relaxed">
                      Let's figure out your retirement together. Just tap and our AI retirement expert will assist you!
                    </p>
                    <Button
                      onClick={connect}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 lg:px-10 py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-semibold rounded-2xl shadow-xl w-full sm:w-auto"
                    >
                      <Mic className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                      Start Conversation
                    </Button>
                  </div>
                )}

                {isConnecting && (
                  <div className="text-center py-6 sm:py-8 lg:py-10 px-4">
                    <div className="inline-block w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 animate-pulse mb-4"></div>
                    <p className="text-gray-300 text-base sm:text-lg">Getting ready...</p>
                  </div>
                )}

                {isConnected && (
                  <div className="space-y-6">
                    {/* Audio Levels */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm font-semibold text-gray-200">
                          <span>You're speaking</span>
                          <span className="text-blue-400">{Math.round(Math.min((userAudioLevel || 0) * 300, 100))}%</span>
                        </div>
                        <div className="h-4 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-100 rounded-full"
                            style={{ width: `${Math.min((userAudioLevel || 0) * 300, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm font-semibold text-gray-200">
                          <span>I'm speaking</span>
                          <span className="text-purple-400">{Math.round(Math.min((agentAudioLevel || 0) * 300, 100))}%</span>
                        </div>
                        <div className="h-4 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-100 rounded-full"
                            style={{ width: `${Math.min((agentAudioLevel || 0) * 300, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-200">
                          {isComplete ? 'All done! 🎉' : 'Listening...'}
                        </span>
                      </div>
                      <Button
                        onClick={disconnect}
                        variant="outline"
                        className="border-blue-700 text-blue-400 hover:bg-blue-900/30 rounded-xl"
                        size="sm"
                      >
                        <MicOff className="w-4 h-4 mr-2" />
                        End
                      </Button>
                    </div>

                    {isComplete && (
                      <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 rounded-2xl p-5 border-2 border-emerald-700">
                        <p className="text-emerald-300 font-bold flex items-center gap-2 text-center justify-center">
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
              <Card className="border-0 shadow-lg rounded-3xl bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-100">What we're discussing</CardTitle>
                  <p className="text-sm text-gray-400 mt-2">If something doesn't apply to you, just say the item name and "none" or "zero"</p>
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
                            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                          ) : isActive ? (
                            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                              {section.index + 1}
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-slate-700 flex items-center justify-center text-gray-500 font-bold">
                              {section.index + 1}
                            </div>
                          )}
                          <h4 className={`font-bold ${isInactive ? 'text-gray-500' : 'text-gray-200'}`}>
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
            <Card className="border-0 shadow-xl rounded-3xl bg-slate-800 lg:sticky lg:top-8">
              <CardHeader className="border-b border-slate-700 pb-4 sm:pb-6 px-4 sm:px-6">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-100">Your Details</CardTitle>
                  </div>
                  {isComplete && (
                    <Button
                      onClick={() => setEditMode(!editMode)}
                      variant="outline"
                      className="border-blue-700 text-blue-400 hover:bg-blue-900/30 rounded-xl text-sm sm:text-base flex-shrink-0"
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
                    <DarkDataField label="Current Age" value={currentAge} editMode={editMode} onEdit={setCurrentAge} type="number" isGlowing={glowingFields.has('current_age')} />
                    <DarkDataField label="Retirement Age" value={retirementAge} editMode={editMode} onEdit={setRetirementAge} type="number" isGlowing={glowingFields.has('retirement_age')} />
                    <DarkDataField label="Plan Until Age" value={longevityAge} editMode={editMode} onEdit={setLongevityAge} type="number" isGlowing={glowingFields.has('longevity_age')} />
                    <DarkDataField label="Current Income (Annual)" value={currentIncome} editMode={editMode} onEdit={setCurrentIncome} type="currency" isGlowing={glowingFields.has('current_income')} />
                  </div>

                  <DarkDataField
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
                    <h3 className="text-base sm:text-lg font-bold text-gray-100 pb-2 border-b-2 border-blue-700">
                      💰 Your Accounts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <DarkDataField label="RRSP Balance" value={rrsp} editMode={editMode} onEdit={setRrsp} type="currency" isGlowing={glowingFields.has('rrsp')} />
                      <DarkDataField label="RRSP Contribution (Annual)" value={rrspContribution} editMode={editMode} onEdit={setRrspContribution} type="currency" isGlowing={glowingFields.has('rrsp_contribution')} />
                      <DarkDataField label="TFSA Balance" value={tfsa} editMode={editMode} onEdit={setTfsa} type="currency" isGlowing={glowingFields.has('tfsa')} />
                      <DarkDataField label="TFSA Contribution (Annual)" value={tfsaContribution} editMode={editMode} onEdit={setTfsaContribution} type="currency" isGlowing={glowingFields.has('tfsa_contribution')} />
                      <DarkDataField label="Non-Registered Balance" value={nonRegistered} editMode={editMode} onEdit={setNonRegistered} type="currency" isGlowing={glowingFields.has('non_registered')} />
                      <DarkDataField label="Non-Registered Contribution (Annual)" value={nonRegisteredContribution} editMode={editMode} onEdit={setNonRegisteredContribution} type="currency" isGlowing={glowingFields.has('non_registered_contribution')} />
                    </div>
                  </div>

                  {/* Retirement */}
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-100 pb-2 border-b-2 border-indigo-700">
                      🏖️ In Retirement
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <DarkDataField label="Monthly Income Needs" value={monthlySpending} editMode={editMode} onEdit={setMonthlySpending} type="currency" isGlowing={glowingFields.has('monthly_spending')} />
                      <DarkDataField label="Expected Pension Income (Annual)" value={pensionIncome} editMode={editMode} onEdit={setPensionIncome} type="currency" isGlowing={glowingFields.has('pension_income')} />
                      <DarkDataField label="Other Income (Annual)" value={otherIncome} editMode={editMode} onEdit={setOtherIncome} type="currency" isGlowing={glowingFields.has('other_income')} />
                      <DarkDataField label="CPP Start Age" value={cppStartAge} editMode={editMode} onEdit={setCppStartAge} type="number" isGlowing={glowingFields.has('cpp_start_age')} />
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-100 pb-2 border-b-2 border-purple-700">
                      📊 Rate Assumptions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                      <DarkDataField label="Pre-Retirement" value={investmentReturn} editMode={editMode} onEdit={setInvestmentReturn} type="percentage" isGlowing={glowingFields.has('investment_return')} />
                      <DarkDataField label="Post-Retirement" value={postRetirementReturn} editMode={editMode} onEdit={setPostRetirementReturn} type="percentage" isGlowing={glowingFields.has('post_retirement_return')} />
                      <DarkDataField label="Inflation" value={inflationRate} editMode={editMode} onEdit={setInflationRate} type="percentage" isGlowing={glowingFields.has('inflation_rate')} />
                    </div>
                  </div>

                  {/* Calculate Button */}
                  {isComplete && (
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-2xl py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-bold rounded-2xl"
                    >
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="white" />
                      Calculate My Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Dark data field component
function DarkDataField({
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
  editValue?: any  // Separate value for edit mode (e.g., province code vs name)
}) {
  const formatValue = () => {
    if (value === null || value === undefined) return <span className="text-gray-600 text-sm">—</span>
    if (type === 'currency') return <span className="text-gray-100 font-bold text-lg sm:text-xl">${value.toLocaleString()}</span>
    if (type === 'percentage') return <span className="text-gray-100 font-bold text-lg sm:text-xl">{value}%</span>
    if (type === 'number') return <span className="text-gray-100 font-bold text-lg sm:text-xl">{value}</span>
    return <span className="text-gray-100 font-semibold text-base sm:text-lg">{value}</span>
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      {editMode && onEdit ? (
        type === 'select' ? (
          <select
            value={editValue !== undefined ? editValue : value || ''}
            onChange={(e) => onEdit(e.target.value || null)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-600 rounded-2xl text-gray-100 text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-900"
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
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-600 rounded-2xl text-gray-100 text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-900"
            step={type === 'percentage' ? '0.1' : '1'}
          />
        )
      ) : (
        <div className={`px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl border-2 transition-all duration-300 ${
          isGlowing
            ? 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.7)] animate-pulse'
            : 'border-slate-600'
        }`}>
          {formatValue()}
        </div>
      )}
    </div>
  )
}
