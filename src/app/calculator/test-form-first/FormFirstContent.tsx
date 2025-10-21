'use client'

import { useLayercodeVoice } from '@/hooks/useLayercodeVoice'
import { useState, useEffect } from 'react'
import { Province } from '@/types/constants'

export function FormFirstContent() {
  // Form state
  const [currentAge, setCurrentAge] = useState<string>('')
  const [retirementAge, setRetirementAge] = useState<string>('')
  const [province, setProvince] = useState<Province | ''>('')
  const [rrsp, setRrsp] = useState<string>('')
  const [tfsa, setTfsa] = useState<string>('')
  const [nonRegistered, setNonRegistered] = useState<string>('')
  const [monthlySpending, setMonthlySpending] = useState<string>('')
  const [investmentReturn, setInvestmentReturn] = useState<string>('5.0')

  const [showVoicePanel, setShowVoicePanel] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [collectedData, setCollectedData] = useState<any>(null)

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
      }

      if (content.type === 'complete') {
        setCollectedData(content.collectedData)

        // Update form fields from voice data
        if (content.collectedData.currentAge) setCurrentAge(String(content.collectedData.currentAge))
        if (content.collectedData.retirementAge) setRetirementAge(String(content.collectedData.retirementAge))
        if (content.collectedData.province) setProvince(content.collectedData.province)
        if (content.collectedData.rrsp) setRrsp(String(content.collectedData.rrsp))
        if (content.collectedData.tfsa) setTfsa(String(content.collectedData.tfsa))
        if (content.collectedData.non_registered) setNonRegistered(String(content.collectedData.non_registered))
        if (content.collectedData.monthlySpending) setMonthlySpending(String(content.collectedData.monthlySpending))
        if (content.collectedData.investmentReturn) setInvestmentReturn(String(content.collectedData.investmentReturn))
      }
    }
  })

  const handleVoiceToggle = () => {
    if (isConnected) {
      disconnect()
      setShowVoicePanel(false)
    } else {
      connect()
      setShowVoicePanel(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Retirement Calculator</h1>
          <p className="text-sm text-gray-600">Prototype A: Form-First</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Voice Assistant Button */}
        <div className="mb-6">
          <button
            onClick={handleVoiceToggle}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isConnected
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isConnecting ? '🔄 Connecting...' : isConnected ? '🎤 Stop Voice' : '🎤 Start Voice Assistant'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            {isConnected ? 'Voice assistant active - speak naturally to fill the form' : 'Click to fill this form by voice'}
          </p>
        </div>

        {/* Voice Panel (when active) */}
        {showVoicePanel && isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-4">Voice Assistant Active</h3>

            {/* Progress */}
            {progress && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-800">
                    Question {progress.current} of {progress.total}
                  </span>
                  <span className="text-sm text-blue-800">
                    {Math.round((progress.current / progress.total) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
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
                <div className="flex justify-between text-xs text-blue-800 mb-1">
                  <span>You</span>
                  <span>{Math.round((userAudioLevel || 0) * 100)}%</span>
                </div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-100"
                    style={{ width: `${(userAudioLevel || 0) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-blue-800 mb-1">
                  <span>Assistant</span>
                  <span>{Math.round((agentAudioLevel || 0) * 100)}%</span>
                </div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all duration-100"
                    style={{ width: `${(agentAudioLevel || 0) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Your Information</h2>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Age
                </label>
                <input
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(e.target.value)}
                  placeholder="e.g., 58"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retirement Age
                </label>
                <input
                  type="number"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(e.target.value)}
                  placeholder="e.g., 65"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Province/Territory
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value as Province)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select province...</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="MB">Manitoba</option>
                <option value="NB">New Brunswick</option>
                <option value="NL">Newfoundland and Labrador</option>
                <option value="NT">Northwest Territories</option>
                <option value="NS">Nova Scotia</option>
                <option value="NU">Nunavut</option>
                <option value="ON">Ontario</option>
                <option value="PE">Prince Edward Island</option>
                <option value="QC">Quebec</option>
                <option value="SK">Saskatchewan</option>
                <option value="YT">Yukon</option>
              </select>
            </div>

            {/* Accounts */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Account Balances</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RRSP Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={rrsp}
                      onChange={(e) => setRrsp(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TFSA Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={tfsa}
                      onChange={(e) => setTfsa(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Non-Registered Accounts
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={nonRegistered}
                      onChange={(e) => setNonRegistered(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Spending & Returns */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Spending (Retirement)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={monthlySpending}
                    onChange={(e) => setMonthlySpending(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Return (% annually)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={investmentReturn}
                    onChange={(e) => setInvestmentReturn(e.target.value)}
                    placeholder="5.0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-4 top-2 text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Calculate Retirement Plan
              </button>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Prototype A - Form-First:</strong> Traditional form layout with optional voice assistant.
            Voice fills the form automatically, or you can type manually. Best for users who prefer visual control.
          </p>
        </div>
      </div>
    </div>
  )
}
