'use client'

import { useLayercodeVoice } from '@/hooks/useLayercodeVoice'
import { useState, useEffect } from 'react'
import { Province } from '@/types/constants'

type InputMode = 'voice' | 'manual'

export function WizardContent() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [inputMode, setInputMode] = useState<InputMode>('voice')

  // Form data
  const [currentAge, setCurrentAge] = useState<string>('')
  const [retirementAge, setRetirementAge] = useState<string>('')
  const [province, setProvince] = useState<Province | ''>('')
  const [hasRrsp, setHasRrsp] = useState<boolean | null>(null)
  const [rrsp, setRrsp] = useState<string>('')
  const [hasTfsa, setHasTfsa] = useState<boolean | null>(null)
  const [tfsa, setTfsa] = useState<string>('')
  const [hasNonReg, setHasNonReg] = useState<boolean | null>(null)
  const [nonRegistered, setNonRegistered] = useState<string>('')
  const [monthlySpending, setMonthlySpending] = useState<string>('')
  const [investmentReturn, setInvestmentReturn] = useState<string>('5.0')

  const [voiceCompleted, setVoiceCompleted] = useState(false)

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

      if (content.type === 'complete') {
        setVoiceCompleted(true)

        // Populate all fields
        const d = content.collectedData
        if (d.currentAge) setCurrentAge(String(d.currentAge))
        if (d.retirementAge) setRetirementAge(String(d.retirementAge))
        if (d.province) setProvince(d.province)
        if (d.rrsp) {
          setHasRrsp(true)
          setRrsp(String(d.rrsp))
        }
        if (d.tfsa) {
          setHasTfsa(true)
          setTfsa(String(d.tfsa))
        }
        if (d.non_registered) {
          setHasNonReg(true)
          setNonRegistered(String(d.non_registered))
        }
        if (d.monthlySpending) setMonthlySpending(String(d.monthlySpending))
        if (d.investmentReturn) setInvestmentReturn(String(d.investmentReturn))

        // Jump to review step
        setCurrentStep(steps.length - 1)
      }
    }
  })

  // Wizard steps
  const steps = [
    { id: 'mode', title: 'Choose Input Method' },
    { id: 'basics', title: 'Basic Information' },
    { id: 'accounts', title: 'Your Accounts' },
    { id: 'spending', title: 'Retirement Spending' },
    { id: 'review', title: 'Review & Calculate' },
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Start voice mode
  const startVoiceMode = () => {
    setInputMode('voice')
    connect()
    nextStep() // Skip to next step since voice will handle everything
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Retirement Calculator</h1>
          <p className="text-sm text-gray-600">Prototype C: Wizard</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      idx <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium hidden sm:inline ${
                      idx <= currentStep ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      idx < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-8">
          {/* STEP 0: Choose Input Mode */}
          {currentStep === 0 && (
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">How would you like to provide your information?</h2>
              <p className="text-gray-600 mb-8">
                Choose the method that works best for you
              </p>

              <div className="grid grid-cols-2 gap-6">
                {/* Voice Option */}
                <button
                  onClick={startVoiceMode}
                  className="p-6 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="text-4xl mb-4">🎤</div>
                  <h3 className="text-lg font-semibold mb-2">Voice</h3>
                  <p className="text-sm text-gray-600">
                    Have a quick 2-minute conversation. Fast and easy.
                  </p>
                  <div className="mt-4 text-sm text-blue-600 font-medium">
                    Recommended →
                  </div>
                </button>

                {/* Manual Option */}
                <button
                  onClick={() => {
                    setInputMode('manual')
                    nextStep()
                  }}
                  className="p-6 border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-4xl mb-4">⌨️</div>
                  <h3 className="text-lg font-semibold mb-2">Manual Entry</h3>
                  <p className="text-sm text-gray-600">
                    Fill out a step-by-step form at your own pace.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Basic Information (Manual Mode) */}
          {currentStep === 1 && inputMode === 'manual' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

              <div className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What is your current age?
                  </label>
                  <input
                    type="number"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(e.target.value)}
                    placeholder="e.g., 58"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    At what age do you plan to retire?
                  </label>
                  <input
                    type="number"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(e.target.value)}
                    placeholder="e.g., 65"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Which province or territory do you live in?
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value as Province)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  >
                    <option value="">Select...</option>
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
              </div>
            </div>
          )}

          {/* STEP 1: Voice Active */}
          {currentStep === 1 && inputMode === 'voice' && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎤</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Voice conversation active</h2>
                <p className="text-gray-600">
                  Answer the questions naturally - I'll guide you through everything
                </p>
              </div>

              {/* Audio Levels */}
              <div className="max-w-md mx-auto space-y-3 mb-6">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>You</span>
                    <span>{Math.round((userAudioLevel || 0) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-100"
                      style={{ width: `${(userAudioLevel || 0) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Assistant</span>
                    <span>{Math.round((agentAudioLevel || 0) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all duration-100"
                      style={{ width: `${(agentAudioLevel || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  disconnect()
                  setCurrentStep(0)
                  setInputMode('voice')
                }}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                End conversation and switch to manual
              </button>
            </div>
          )}

          {/* STEP 2: Accounts (Manual Mode) */}
          {currentStep === 2 && inputMode === 'manual' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Your Accounts</h2>

              <div className="space-y-6 max-w-xl">
                {/* RRSP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Do you have an RRSP?
                  </label>
                  <div className="flex gap-4 mb-3">
                    <button
                      onClick={() => setHasRrsp(true)}
                      className={`px-6 py-2 rounded-lg font-medium ${
                        hasRrsp === true
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setHasRrsp(false)}
                      className={`px-6 py-2 rounded-lg font-medium ${
                        hasRrsp === false
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                  {hasRrsp && (
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500 text-lg">$</span>
                      <input
                        type="text"
                        value={rrsp}
                        onChange={(e) => setRrsp(e.target.value)}
                        placeholder="RRSP balance"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      />
                    </div>
                  )}
                </div>

                {/* TFSA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Do you have a TFSA?
                  </label>
                  <div className="flex gap-4 mb-3">
                    <button
                      onClick={() => setHasTfsa(true)}
                      className={`px-6 py-2 rounded-lg font-medium ${
                        hasTfsa === true
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setHasTfsa(false)}
                      className={`px-6 py-2 rounded-lg font-medium ${
                        hasTfsa === false
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                  {hasTfsa && (
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500 text-lg">$</span>
                      <input
                        type="text"
                        value={tfsa}
                        onChange={(e) => setTfsa(e.target.value)}
                        placeholder="TFSA balance"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Non-Registered */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Do you have non-registered investments?
                  </label>
                  <div className="flex gap-4 mb-3">
                    <button
                      onClick={() => setHasNonReg(true)}
                      className={`px-6 py-2 rounded-lg font-medium ${
                        hasNonReg === true
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setHasNonReg(false)}
                      className={`px-6 py-2 rounded-lg font-medium ${
                        hasNonReg === false
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                  {hasNonReg && (
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500 text-lg">$</span>
                      <input
                        type="text"
                        value={nonRegistered}
                        onChange={(e) => setNonRegistered(e.target.value)}
                        placeholder="Non-registered balance"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Spending (Manual Mode) */}
          {currentStep === 3 && inputMode === 'manual' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Retirement Spending</h2>

              <div className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How much do you expect to spend per month in retirement?
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 text-lg">$</span>
                    <input
                      type="text"
                      value={monthlySpending}
                      onChange={(e) => setMonthlySpending(e.target.value)}
                      placeholder="e.g., 5000"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Include all expenses: housing, food, travel, healthcare, etc.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What annual investment return do you expect?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={investmentReturn}
                      onChange={(e) => setInvestmentReturn(e.target.value)}
                      placeholder="5.0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                    <span className="absolute right-4 top-3 text-gray-500 text-lg">%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Most people use 4-7%. Default is 5%.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Review Your Information</h2>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Current Age:</span>
                      <span className="ml-2 font-medium">{currentAge || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Retirement Age:</span>
                      <span className="ml-2 font-medium">{retirementAge || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Province:</span>
                      <span className="ml-2 font-medium">{province || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Accounts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">RRSP:</span>
                      <span className="font-medium">{rrsp ? `$${Number(rrsp).toLocaleString()}` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">TFSA:</span>
                      <span className="font-medium">{tfsa ? `$${Number(tfsa).toLocaleString()}` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Non-Registered:</span>
                      <span className="font-medium">{nonRegistered ? `$${Number(nonRegistered).toLocaleString()}` : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Retirement Plan</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Spending:</span>
                      <span className="font-medium">{monthlySpending ? `$${Number(monthlySpending).toLocaleString()}` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Investment Return:</span>
                      <span className="font-medium">{investmentReturn}%</span>
                    </div>
                  </div>
                </div>

                <button
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
                >
                  Calculate My Retirement Plan
                </button>
              </div>
            </div>
          )}

          {/* Navigation (Manual Mode) */}
          {inputMode === 'manual' && currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="mt-8 flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Back to Edit (Review Step) */}
          {currentStep === steps.length - 1 && inputMode === 'manual' && (
            <div className="mt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Edit information
              </button>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Prototype C - Wizard:</strong> Step-by-step progression with choice of voice or manual input.
            Clear navigation and progress tracking. Best for users who want structured guidance.
          </p>
        </div>
      </div>
    </div>
  )
}
