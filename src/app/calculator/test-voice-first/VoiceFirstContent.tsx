'use client'

import { useLayercodeVoice } from '@/hooks/useLayercodeVoice'
import { useState } from 'react'
import { Province } from '@/types/constants'

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

export function VoiceFirstContent() {
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
  const [cppStartAge, setCppStartAge] = useState<number | null>(null)
  const [investmentReturn, setInvestmentReturn] = useState<number | null>(null)
  const [postRetirementReturn, setPostRetirementReturn] = useState<number | null>(null)
  const [inflationRate, setInflationRate] = useState<number | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [batchPrompts, setBatchPrompts] = useState<BatchPrompt[]>([])  // Stack of batch prompts
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Voice integration
  // NOTE: To use batch mode, set webhook URL to /api/batch-agent in Layercode dashboard
  // or use: npx @layercode/cli tunnel --webhook-url /api/batch-agent
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

      console.log('📨 Received data message:', content.type, content)

      // Handle batch prompt (new batch of questions)
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

      // Handle batch response (parsed values from user's answer)
      if (content.type === 'batch_response') {
        const values = content.values

        // Update form with batch values
        if (values.current_age !== undefined) setCurrentAge(values.current_age)
        if (values.retirement_age !== undefined) setRetirementAge(values.retirement_age)
        if (values.longevity_age !== undefined) setLongevityAge(values.longevity_age)
        if (values.province !== undefined) setProvince(values.province)
        if (values.current_income !== undefined) setCurrentIncome(values.current_income)
        if (values.rrsp_amount !== undefined) setRrsp(values.rrsp_amount)
        if (values.rrsp_contribution !== undefined) setRrspContribution(values.rrsp_contribution)
        if (values.tfsa_amount !== undefined) setTfsa(values.tfsa_amount)
        if (values.tfsa_contribution !== undefined) setTfsaContribution(values.tfsa_contribution)
        if (values.non_registered_amount !== undefined) setNonRegistered(values.non_registered_amount)
        if (values.non_registered_contribution !== undefined) setNonRegisteredContribution(values.non_registered_contribution)
        if (values.monthly_spending !== undefined) setMonthlySpending(values.monthly_spending)
        if (values.pension_income !== undefined) setPensionIncome(values.pension_income)
        if (values.cpp_start_age !== undefined) setCppStartAge(values.cpp_start_age)
        if (values.investment_return !== undefined) setInvestmentReturn(values.investment_return)
        if (values.post_retirement_return !== undefined) setPostRetirementReturn(values.post_retirement_return)
        if (values.inflation_rate !== undefined) setInflationRate(values.inflation_rate)
      }

      // Handle completion
      if (content.type === 'complete') {
        setIsComplete(true)

        // Final data update
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Retirement Calculator</h1>
          <p className="text-sm text-gray-600">Prototype B: Voice-First</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 gap-6">
          {/* LEFT PANEL: Conversation */}
          <div className="space-y-6">
            {/* Connection Controls */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Voice Conversation</h2>

              {!isConnected && !isConnecting && (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Start a voice conversation to collect your retirement data
                  </p>
                  <button
                    onClick={connect}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    🎤 Start Voice Conversation
                  </button>
                </div>
              )}

              {isConnecting && (
                <div className="text-center py-8">
                  <div className="animate-pulse text-gray-600">
                    🔄 Connecting to voice assistant...
                  </div>
                </div>
              )}

              {isConnected && (
                <div className="space-y-4">
                  {/* Progress */}
                  {progress && !isComplete && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Section {progress.current} of {progress.total}
                        </span>
                        <span className="text-sm text-gray-600">
                          {Math.round((progress.current / progress.total) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Audio Levels */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>You</span>
                        <span>{Math.round((userAudioLevel || 0) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-100"
                          style={{ width: `${(userAudioLevel || 0) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Assistant</span>
                        <span>{Math.round((agentAudioLevel || 0) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 transition-all duration-100"
                          style={{ width: `${(agentAudioLevel || 0) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-gray-600">
                        {isComplete ? 'Conversation complete' : 'Listening...'}
                      </span>
                    </div>
                    <button
                      onClick={disconnect}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      End Call
                    </button>
                  </div>

                  {isComplete && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-green-800 font-medium">
                        ✅ All data collected! Review your information on the right →
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Batch Questions Display */}
            {batchPrompts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Questions</h2>
                <div className="space-y-4">
                  {batchPrompts.map((batch, idx) => (
                    <div key={batch.batchId} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                          {batch.batchIndex + 1}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700">{batch.batchTitle}</h3>
                      </div>
                      <ul className="ml-8 space-y-1.5">
                        {batch.questions.map(q => (
                          <li key={q.id} className="text-sm text-gray-600">
                            • {q.text}
                          </li>
                        ))}
                      </ul>
                      {idx < batchPrompts.length - 1 && (
                        <div className="ml-8 mt-3 border-t border-gray-200" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Tips:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Answer the questions naturally in your own words</li>
                <li>• You can answer all questions at once or one at a time</li>
                <li>• Watch your data appear in real-time on the right</li>
                <li>• You can edit the form manually after the conversation</li>
              </ul>
            </div>
          </div>

          {/* RIGHT PANEL: Live Form Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Your Information</h2>
                {isComplete && !editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ✏️ Edit
                  </button>
                )}
                {editMode && (
                  <button
                    onClick={() => setEditMode(false)}
                    className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Done
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Current Age
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        value={currentAge || ''}
                        onChange={(e) => setCurrentAge(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-gray-900">
                        {currentAge || <span className="text-gray-400">—</span>}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Retirement Age
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        value={retirementAge || ''}
                        onChange={(e) => setRetirementAge(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-gray-900">
                        {retirementAge || <span className="text-gray-400">—</span>}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Life Expectancy
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        value={longevityAge || ''}
                        onChange={(e) => setLongevityAge(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-gray-900">
                        {longevityAge || <span className="text-gray-400">—</span>}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Current Income
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        value={currentIncome || ''}
                        onChange={(e) => setCurrentIncome(Number(e.target.value) || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="0"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-gray-900">
                        {currentIncome !== undefined ? (
                          currentIncome === null ? <span className="text-gray-500">None</span> : `$${currentIncome.toLocaleString()}`
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Province */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Province/Territory
                  </label>
                  {editMode ? (
                    <select
                      value={province || ''}
                      onChange={(e) => setProvince(e.target.value as Province)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Select...</option>
                      {Object.entries(provinceNames).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-lg font-semibold text-gray-900">
                      {province ? provinceNames[province] : <span className="text-gray-400">—</span>}
                    </div>
                  )}
                </div>

                {/* Accounts */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Balances & Contributions</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          RRSP Balance
                        </label>
                        {editMode ? (
                          <input
                            type="number"
                            value={rrsp || ''}
                            onChange={(e) => setRrsp(Number(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            {rrsp !== undefined ? (
                              rrsp === null ? <span className="text-gray-500">None</span> : `$${rrsp.toLocaleString()}`
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Annual Contribution
                        </label>
                        {editMode ? (
                          <input
                            type="number"
                            value={rrspContribution || ''}
                            onChange={(e) => setRrspContribution(Number(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            {rrspContribution !== undefined ? (
                              rrspContribution === null ? <span className="text-gray-500">None</span> : `$${rrspContribution.toLocaleString()}`
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          TFSA Balance
                        </label>
                        {editMode ? (
                          <input
                            type="number"
                            value={tfsa || ''}
                            onChange={(e) => setTfsa(Number(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            {tfsa !== undefined ? (
                              tfsa === null ? <span className="text-gray-500">None</span> : `$${tfsa.toLocaleString()}`
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Annual Contribution
                        </label>
                        {editMode ? (
                          <input
                            type="number"
                            value={tfsaContribution || ''}
                            onChange={(e) => setTfsaContribution(Number(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            {tfsaContribution !== undefined ? (
                              tfsaContribution === null ? <span className="text-gray-500">None</span> : `$${tfsaContribution.toLocaleString()}`
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Non-Registered Balance
                        </label>
                        {editMode ? (
                          <input
                            type="number"
                            value={nonRegistered || ''}
                            onChange={(e) => setNonRegistered(Number(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            {nonRegistered !== undefined ? (
                              nonRegistered === null ? <span className="text-gray-500">None</span> : `$${nonRegistered.toLocaleString()}`
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Annual Contribution
                        </label>
                        {editMode ? (
                          <input
                            type="number"
                            value={nonRegisteredContribution || ''}
                            onChange={(e) => setNonRegisteredContribution(Number(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            {nonRegisteredContribution !== undefined ? (
                              nonRegisteredContribution === null ? <span className="text-gray-500">None</span> : `$${nonRegisteredContribution.toLocaleString()}`
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Retirement Income */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Retirement Income</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Monthly Spending
                        </label>
                        {editMode ? (
                          <input
                            type="number"
                            value={monthlySpending || ''}
                            onChange={(e) => setMonthlySpending(Number(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            {monthlySpending !== undefined ? (
                              monthlySpending === null ? <span className="text-gray-500">None</span> : `$${monthlySpending.toLocaleString()}`
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Pension Income
                        </label>
                        {editMode ? (
                          <input
                            type="number"
                            value={pensionIncome || ''}
                            onChange={(e) => setPensionIncome(Number(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            {pensionIncome !== undefined ? (
                              pensionIncome === null ? <span className="text-gray-500">None</span> : `$${pensionIncome.toLocaleString()}`
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        CPP Start Age
                        <span className="text-xs text-gray-400 ml-1">(default: 65)</span>
                      </label>
                      {editMode ? (
                        <input
                          type="number"
                          value={cppStartAge || ''}
                          onChange={(e) => setCppStartAge(Number(e.target.value) || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          placeholder="65"
                        />
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">
                          {cppStartAge || <span className="text-gray-400">65 (default)</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Investment Assumptions */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Investment Assumptions</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Pre-Retirement Return
                          <span className="text-xs text-gray-400 ml-1">(default: 6%)</span>
                        </label>
                        {editMode ? (
                          <input
                            type="number"
                            value={investmentReturn || ''}
                            onChange={(e) => setInvestmentReturn(Number(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="6.0"
                            step="0.1"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            {investmentReturn !== null ? `${investmentReturn}%` : <span className="text-gray-400">6% (default)</span>}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Post-Retirement Return
                          <span className="text-xs text-gray-400 ml-1">(default: 4%)</span>
                        </label>
                        {editMode ? (
                          <input
                            type="number"
                            value={postRetirementReturn || ''}
                            onChange={(e) => setPostRetirementReturn(Number(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="4.0"
                            step="0.1"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            {postRetirementReturn !== null ? `${postRetirementReturn}%` : <span className="text-gray-400">4% (default)</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Inflation Rate
                        <span className="text-xs text-gray-400 ml-1">(default: 2%)</span>
                      </label>
                      {editMode ? (
                        <input
                          type="number"
                          value={inflationRate || ''}
                          onChange={(e) => setInflationRate(Number(e.target.value) || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          placeholder="2.0"
                          step="0.1"
                        />
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">
                          {inflationRate !== null ? `${inflationRate}%` : <span className="text-gray-400">2% (default)</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Calculate Button */}
                {isComplete && (
                  <div className="pt-6">
                    <button
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Calculate Retirement Plan
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Prototype B - Voice-First (Batch Mode):</strong> Questions are grouped into 3 contextual
                sections. Answer naturally - you can respond to all questions at once or one at a time.
                Live preview shows data as it's collected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
