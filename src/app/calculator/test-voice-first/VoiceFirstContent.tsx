'use client'

import { useLayercodeVoice } from '@/hooks/useLayercodeVoice'
import { useState } from 'react'
import { Province } from '@/types/constants'

interface Message {
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

export function VoiceFirstContent() {
  // Form state (read-only preview)
  const [currentAge, setCurrentAge] = useState<number | null>(null)
  const [retirementAge, setRetirementAge] = useState<number | null>(null)
  const [province, setProvince] = useState<Province | null>(null)
  const [rrsp, setRrsp] = useState<number | null>(null)
  const [tfsa, setTfsa] = useState<number | null>(null)
  const [nonRegistered, setNonRegistered] = useState<number | null>(null)
  const [monthlySpending, setMonthlySpending] = useState<number | null>(null)
  const [investmentReturn, setInvestmentReturn] = useState<number | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Voice integration
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

      if (content.type === 'progress') {
        setProgress({ current: content.current, total: content.total })

        // Update live preview from last answer
        if (content.lastAnswer) {
          const { questionId, parsedValue } = content.lastAnswer

          if (questionId === 'current_age') setCurrentAge(parsedValue)
          if (questionId === 'retirement_age') setRetirementAge(parsedValue)
          if (questionId === 'province') setProvince(parsedValue)
          if (questionId === 'rrsp_amount') setRrsp(parsedValue)
          if (questionId === 'tfsa_amount') setTfsa(parsedValue)
          if (questionId === 'non_registered_amount') setNonRegistered(parsedValue)
          if (questionId === 'monthly_spending') setMonthlySpending(parsedValue)
          if (questionId === 'investment_return') setInvestmentReturn(parsedValue)
        }
      }

      if (content.type === 'complete') {
        setIsComplete(true)

        // Final data update
        const d = content.collectedData
        if (d.currentAge) setCurrentAge(d.currentAge)
        if (d.retirementAge) setRetirementAge(d.retirementAge)
        if (d.province) setProvince(d.province)
        if (d.rrsp) setRrsp(d.rrsp)
        if (d.tfsa) setTfsa(d.tfsa)
        if (d.non_registered) setNonRegistered(d.non_registered)
        if (d.monthlySpending) setMonthlySpending(d.monthlySpending)
        if (d.investmentReturn) setInvestmentReturn(d.investmentReturn)
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
                          Question {progress.current} of {progress.total}
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

            {/* Conversation Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Tips:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Speak naturally - the AI understands conversational language</li>
                <li>• Watch your data appear in real-time on the right</li>
                <li>• You can edit the form manually after the conversation</li>
                <li>• Say "skip" for optional questions</li>
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Balances</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        RRSP
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
                          {rrsp !== null ? `$${rrsp.toLocaleString()}` : <span className="text-gray-400">—</span>}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        TFSA
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
                          {tfsa !== null ? `$${tfsa.toLocaleString()}` : <span className="text-gray-400">—</span>}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Non-Registered
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
                          {nonRegistered !== null ? `$${nonRegistered.toLocaleString()}` : <span className="text-gray-400">—</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Spending & Returns */}
                <div className="pt-4 border-t">
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
                          {monthlySpending !== null ? `$${monthlySpending.toLocaleString()}` : <span className="text-gray-400">—</span>}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Expected Return
                      </label>
                      {editMode ? (
                        <input
                          type="number"
                          value={investmentReturn || ''}
                          onChange={(e) => setInvestmentReturn(Number(e.target.value) || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          placeholder="5.0"
                          step="0.1"
                        />
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">
                          {investmentReturn !== null ? `${investmentReturn}%` : <span className="text-gray-400">—</span>}
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
                <strong>Prototype B - Voice-First:</strong> Voice conversation is primary, with live preview
                showing data as it's collected. Best for users who prefer a guided, conversational experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
