'use client'

import { useLayercodeVoice } from '@/hooks/useLayercodeVoice'
import { useState } from 'react'
import { Province } from '@/types/constants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Sparkles } from 'lucide-react'

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

export function VoiceFirstContentV1() {
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

  // Helper function to trigger glow effect on a field
  const triggerGlow = (fieldName: string) => {
    setGlowingFields(prev => new Set(prev).add(fieldName))
    setTimeout(() => {
      setGlowingFields(prev => {
        const next = new Set(prev)
        next.delete(fieldName)
        return next
      })
    }, 1000) // Glow for 1 second
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        <div className="relative max-w-5xl mx-auto px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-4xl font-bold tracking-tight">Retirement Calculator</h1>
          </div>
          <p className="text-indigo-100 text-lg">V1: Modern Financial • Voice-First Experience</p>
        </div>
      </div>

      {/* Main Content - Single Column Centered */}
      <div className="max-w-5xl mx-auto px-8 py-12 space-y-8">
        {/* Voice Control Card */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Voice Conversation
            </CardTitle>
            <CardDescription className="text-base">
              Start a natural conversation to plan your retirement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected && !isConnecting && (
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                  <Button
                    onClick={connect}
                    size="lg"
                    className="relative bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-xl px-12 py-8 text-xl rounded-2xl"
                  >
                    <Mic className="w-8 h-8 mr-3" />
                    Start Voice Conversation
                  </Button>
                </div>
                <p className="mt-6 text-gray-600">
                  Tap to begin your retirement planning journey
                </p>
              </div>
            )}

            {isConnecting && (
              <div className="text-center py-12">
                <div className="inline-block w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 animate-pulse mb-4"></div>
                <p className="text-gray-600 text-lg">Connecting to your AI assistant...</p>
              </div>
            )}

            {isConnected && (
              <div className="space-y-6">
                {/* Progress */}
                {progress && !isComplete && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Section {progress.current} of {progress.total}
                      </span>
                      <Badge className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border-0">
                        {Math.round((progress.current / progress.total) * 100)}%
                      </Badge>
                    </div>
                    <Progress
                      value={(progress.current / progress.total) * 100}
                      className="h-3 bg-gray-200"
                    />
                  </div>
                )}

                {/* Audio Visualizers */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                      <span>You</span>
                      <span className="text-indigo-600">{Math.round((userAudioLevel || 0) * 100)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-100 rounded-full"
                        style={{ width: `${(userAudioLevel || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                      <span>Assistant</span>
                      <span className="text-cyan-600">{Math.round((agentAudioLevel || 0) * 100)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-100 rounded-full"
                        style={{ width: `${(agentAudioLevel || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Status and Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {isComplete ? 'Conversation complete' : 'Listening...'}
                    </span>
                  </div>
                  <Button
                    onClick={disconnect}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    <MicOff className="w-4 h-4 mr-2" />
                    End Call
                  </Button>
                </div>

                {isComplete && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                    <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      All data collected! Review your information below
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions Display */}
        {batchPrompts.length > 0 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Current Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {batchPrompts.map((batch, idx) => (
                  <div key={batch.batchId} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                        {batch.batchIndex + 1}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">{batch.batchTitle}</h3>
                    </div>
                    <ul className="ml-11 space-y-2">
                      {batch.questions.map(q => (
                        <li key={q.id} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-indigo-500 font-bold">•</span>
                          <span>{q.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Preview Card */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Your Information</CardTitle>
                <CardDescription className="mt-1">Live preview of collected data</CardDescription>
              </div>
              {isComplete && (
                <Button
                  onClick={() => setEditMode(!editMode)}
                  variant="outline"
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  {editMode ? 'Done' : '✏️ Edit'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-8">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-4 gap-6">
                <DataField
                  label="Current Age"
                  value={currentAge}
                  editMode={editMode}
                  onEdit={setCurrentAge}
                  type="number"
                  isGlowing={glowingFields.has('current_age')}
                />
                <DataField
                  label="Retirement Age"
                  value={retirementAge}
                  editMode={editMode}
                  onEdit={setRetirementAge}
                  type="number"
                  isGlowing={glowingFields.has('retirement_age')}
                />
                <DataField
                  label="Life Expectancy"
                  value={longevityAge}
                  editMode={editMode}
                  onEdit={setLongevityAge}
                  type="number"
                  isGlowing={glowingFields.has('longevity_age')}
                />
                <DataField
                  label="Current Income"
                  value={currentIncome}
                  editMode={editMode}
                  onEdit={setCurrentIncome}
                  type="currency"
                  isGlowing={glowingFields.has('current_income')}
                />
              </div>

              <DataField
                label="Province/Territory"
                value={province ? provinceNames[province] : null}
                editMode={false}
                type="text"
                isGlowing={glowingFields.has('province')}
              />

              {/* Accounts Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full"></span>
                  Account Balances & Contributions
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <DataField label="RRSP Balance" value={rrsp} editMode={editMode} onEdit={setRrsp} type="currency" isGlowing={glowingFields.has('rrsp')} />
                  <DataField label="RRSP Contribution" value={rrspContribution} editMode={editMode} onEdit={setRrspContribution} type="currency" isGlowing={glowingFields.has('rrsp_contribution')} />
                  <DataField label="TFSA Balance" value={tfsa} editMode={editMode} onEdit={setTfsa} type="currency" isGlowing={glowingFields.has('tfsa')} />
                  <DataField label="TFSA Contribution" value={tfsaContribution} editMode={editMode} onEdit={setTfsaContribution} type="currency" isGlowing={glowingFields.has('tfsa_contribution')} />
                  <DataField label="Non-Registered Balance" value={nonRegistered} editMode={editMode} onEdit={setNonRegistered} type="currency" isGlowing={glowingFields.has('non_registered')} />
                  <DataField label="Non-Registered Contribution" value={nonRegisteredContribution} editMode={editMode} onEdit={setNonRegisteredContribution} type="currency" isGlowing={glowingFields.has('non_registered_contribution')} />
                </div>
              </div>

              {/* Retirement Income Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full"></span>
                  Retirement Income
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <DataField label="Monthly Spending" value={monthlySpending} editMode={editMode} onEdit={setMonthlySpending} type="currency" isGlowing={glowingFields.has('monthly_spending')} />
                  <DataField label="Pension Income" value={pensionIncome} editMode={editMode} onEdit={setPensionIncome} type="currency" isGlowing={glowingFields.has('pension_income')} />
                  <DataField label="Other Income" value={otherIncome} editMode={editMode} onEdit={setOtherIncome} type="currency" isGlowing={glowingFields.has('other_income')} />
                  <DataField label="CPP Start Age" value={cppStartAge} editMode={editMode} onEdit={setCppStartAge} type="number" isGlowing={glowingFields.has('cpp_start_age')} />
                </div>
              </div>

              {/* Rate Assumptions */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full"></span>
                  Rate Assumptions
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <DataField label="Pre-Retirement Return" value={investmentReturn} editMode={editMode} onEdit={setInvestmentReturn} type="percentage" isGlowing={glowingFields.has('investment_return')} />
                  <DataField label="Post-Retirement Return" value={postRetirementReturn} editMode={editMode} onEdit={setPostRetirementReturn} type="percentage" isGlowing={glowingFields.has('post_retirement_return')} />
                  <DataField label="Inflation Rate" value={inflationRate} editMode={editMode} onEdit={setInflationRate} type="percentage" isGlowing={glowingFields.has('inflation_rate')} />
                </div>
              </div>

              {/* Calculate Button */}
              {isComplete && (
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-xl py-6 text-lg font-semibold rounded-xl"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Calculate Retirement Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper component for data fields
function DataField({
  label,
  value,
  editMode,
  onEdit,
  type,
  isGlowing
}: {
  label: string
  value: any
  editMode: boolean
  onEdit?: (val: any) => void
  type: 'number' | 'currency' | 'percentage' | 'text'
  isGlowing?: boolean
}) {
  const formatValue = () => {
    if (value === null || value === undefined) return <span className="text-gray-400 text-sm">—</span>
    if (type === 'currency') return <span className="text-gray-900 font-bold text-lg">${value.toLocaleString()}</span>
    if (type === 'percentage') return <span className="text-gray-900 font-bold text-lg">{value}%</span>
    if (type === 'number') return <span className="text-gray-900 font-bold text-lg">{value}</span>
    return <span className="text-gray-900 font-medium">{value}</span>
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {editMode && onEdit ? (
        <input
          type={type === 'text' ? 'text' : 'number'}
          value={value || ''}
          onChange={(e) => onEdit(type === 'text' ? e.target.value : Number(e.target.value) || null)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          step={type === 'percentage' ? '0.1' : '1'}
        />
      ) : (
        <div className={`px-4 py-3 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-lg border transition-all duration-300 ${
          isGlowing
            ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse'
            : 'border-gray-200'
        }`}>
          {formatValue()}
        </div>
      )}
    </div>
  )
}
