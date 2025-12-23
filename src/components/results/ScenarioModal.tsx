'use client'

import { useState } from 'react'

/**
 * Scenario Modal
 *
 * Interactive dialog that explains what-if scenarios,
 * shows quick estimates, and triggers scenario calculations.
 */

import { Province } from '@/types/constants'

interface ScenarioModalProps {
  isOpen: boolean
  onClose: () => void
  scenarioType: 'front_load' | 'exhaust' | 'legacy' | 'delay_benefits' | 'retire_early' | 'lump_sum' | 'longevity' | 'part_time_work' | 'market_crash' | 'move_provinces' | 'receive_inheritance' | 'downsize_home'
  baselineMonthly: number
  retirementAge: number
  currentAge: number
  longevityAge?: number // For lump sum age validation
  totalAssets?: number // Total starting portfolio for legacy calculations
  rrspBalance?: number // For lump sum source account selection
  tfsaBalance?: number // For lump sum source account selection
  nonRegisteredBalance?: number // For lump sum source account selection
  cppStartAge?: number // For delay benefits modal to show baseline CPP age
  oasStartAge?: number // For delay benefits modal to show baseline OAS age
  employmentIncome?: number // For part-time work calculations
  currentProvince?: Province // For move provinces variant
  isDarkMode?: boolean
  onRun: (config?: any) => void // Config for parameterized scenarios
}

export function ScenarioModal({
  isOpen,
  onClose,
  scenarioType,
  baselineMonthly,
  retirementAge,
  currentAge,
  longevityAge = 95,
  totalAssets = 0,
  rrspBalance = 0,
  tfsaBalance = 0,
  nonRegisteredBalance = 0,
  cppStartAge = 65,
  oasStartAge = 65,
  employmentIncome = 60000,
  currentProvince = 'ON' as Province,
  isDarkMode = false,
  onRun
}: ScenarioModalProps) {
  // State for retire early age selection (default to 3 years earlier, but not before current age)
  const getDefaultRetireAge = () => Math.max(retirementAge - 3, currentAge)
  const [selectedRetireAge, setSelectedRetireAge] = useState(getDefaultRetireAge())

  // State for legacy percentage selection (default to 25%)
  const [selectedLegacyPercentage, setSelectedLegacyPercentage] = useState(25)

  // State for lump sum withdrawal (default: $100K, age retirement+5, smart withdrawal)
  const [lumpSumAmount, setLumpSumAmount] = useState(100000)
  const [lumpSumAge, setLumpSumAge] = useState(Math.min(retirementAge + 5, longevityAge - 1))
  const [lumpSumSource, setLumpSumSource] = useState<'non_registered' | 'rrsp' | 'tfsa' | 'smart'>('smart')

  // State for longevity variant (default: 100)
  const [selectedLongevityAge, setSelectedLongevityAge] = useState(100)

  // State for part-time work variant
  const [partTimePercentage, setPartTimePercentage] = useState(25) // % of current income
  const [partTimeDuration, setPartTimeDuration] = useState(5) // years

  // State for market crash variant
  const [crashMagnitude, setCrashMagnitude] = useState(40) // % drop (stored as positive)
  const [recoveryYears, setRecoveryYears] = useState(5)

  // State for move provinces variant
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null)
  const [moveAge, setMoveAge] = useState(retirementAge)

  // State for receive inheritance variant
  const [inheritanceAmount, setInheritanceAmount] = useState(200000)
  const [inheritanceAge, setInheritanceAge] = useState(Math.min(retirementAge + 5, longevityAge - 1))
  const [inheritanceSource, setInheritanceSource] = useState<'cash' | 'rrsp_inherited' | 'investments' | 'property'>('cash')

  // State for downsize home variant
  const [homeValue, setHomeValue] = useState(800000)
  const [downsizeAge, setDownsizeAge] = useState(Math.min(retirementAge + 5, longevityAge - 1))
  const [buyOrRent, setBuyOrRent] = useState<'buy' | 'rent'>('buy')
  const [newHomeCost, setNewHomeCost] = useState(400000)
  const [monthlyRent, setMonthlyRent] = useState(2500)

  // Reset state when modal opens (only on isOpen transition from false to true)
  const [previousIsOpen, setPreviousIsOpen] = useState(isOpen)

  if (isOpen !== previousIsOpen) {
    setPreviousIsOpen(isOpen)
    if (isOpen) {
      setSelectedRetireAge(getDefaultRetireAge())
      setSelectedLegacyPercentage(25)
      setLumpSumAmount(100000)
      setLumpSumAge(Math.min(retirementAge + 5, longevityAge - 1))
      setLumpSumSource('smart')
      setSelectedLongevityAge(100)
      setPartTimePercentage(25)
      setPartTimeDuration(5)
      setCrashMagnitude(40)
      setRecoveryYears(5)
      setSelectedProvince(null)
      setMoveAge(retirementAge)
      setInheritanceAmount(200000)
      setInheritanceAge(Math.min(retirementAge + 5, longevityAge - 1))
      setInheritanceSource('cash')
      setHomeValue(800000)
      setDownsizeAge(Math.min(retirementAge + 5, longevityAge - 1))
      setBuyOrRent('buy')
      setNewHomeCost(400000)
      setMonthlyRent(2500)
    }
  }

  if (!isOpen) return null

  const scenario = getScenarioConfig(scenarioType, baselineMonthly, retirementAge, totalAssets, selectedRetireAge, selectedLegacyPercentage, cppStartAge, oasStartAge)

  // Handle run with config for parameterized scenarios
  const handleRun = () => {
    if (scenarioType === 'retire_early') {
      onRun({ newRetirementAge: selectedRetireAge })
    } else if (scenarioType === 'legacy') {
      onRun({ percentage: selectedLegacyPercentage / 100 }) // Convert to decimal
    } else if (scenarioType === 'lump_sum') {
      onRun({ amount: lumpSumAmount, withdrawalAge: lumpSumAge, sourceAccount: lumpSumSource })
    } else if (scenarioType === 'longevity') {
      onRun({ newLongevityAge: selectedLongevityAge })
    } else if (scenarioType === 'part_time_work') {
      onRun({ incomePercentage: partTimePercentage / 100, durationYears: partTimeDuration })
    } else if (scenarioType === 'market_crash') {
      onRun({ crashMagnitude: -crashMagnitude / 100, recoveryYears }) // Convert to negative decimal
    } else if (scenarioType === 'move_provinces') {
      if (!selectedProvince) return // Safety check - button should be disabled
      onRun({ newProvince: selectedProvince, moveAge })
    } else if (scenarioType === 'receive_inheritance') {
      onRun({ amount: inheritanceAmount, receiveAge: inheritanceAge, sourceType: inheritanceSource })
    } else if (scenarioType === 'downsize_home') {
      onRun({
        currentHomeValue: homeValue,
        downsizeAge,
        buyOrRent,
        newCostOrRent: buyOrRent === 'buy' ? newHomeCost : monthlyRent,
        sellingCostsPct: 0.05
      })
    } else {
      onRun()
    }
    onClose()
  }

  // Theme-aware colors
  const overlayBg = isDarkMode ? 'bg-black/60' : 'bg-black/40'
  const modalBg = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const modalBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600'
  const closeBtnHover = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
  const estimateBg = isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50'
  const estimateBorder = isDarkMode ? 'border-gray-600' : 'border-blue-200'

  // Handle ESC key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayBg}`}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      {/* Modal */}
      <div
        className={`${modalBg} border ${modalBorder} rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className={`flex items-start justify-between p-6 border-b ${modalBorder}`}>
          <div>
            <h2 id="modal-title" className={`text-xl font-semibold ${textPrimary}`}>
              {scenario.icon} {scenario.title}
            </h2>
            <p className={`text-sm ${textSecondary} mt-1`}>
              {scenario.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`${textSecondary} ${closeBtnHover} rounded-md p-1 transition-colors`}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Preview Note */}
          <div className={`text-xs ${textSecondary} italic px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            Preview shows typical values. Actual results calculated when you run scenario.
          </div>

          {/* Description */}
          <div>
            <h3 className={`text-sm font-semibold ${textPrimary} mb-2`}>What This Does:</h3>
            <p className={`text-sm ${textSecondary}`}>
              {scenario.description}
            </p>
          </div>

          {/* Retire Early Age Selector */}
          {scenarioType === 'retire_early' && (
            <div>
              <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                Test Retirement Age:
              </h3>
              <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4 space-y-3`}>
                <div className={`text-xs ${textSecondary} mb-2`}>
                  Your baseline retirement age: <span className={`font-semibold ${textPrimary}`}>Age {retirementAge}</span>
                </div>

                {/* Age Selection Radio Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[retirementAge - 5, retirementAge - 4, retirementAge - 3, retirementAge - 2, retirementAge - 1]
                    .filter(age => age >= currentAge) // Only show ages >= current age
                    .map((age) => (
                    <button
                      key={age}
                      onClick={() => setSelectedRetireAge(age)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        selectedRetireAge === age
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Age {age}
                      <div className={`text-xs mt-0.5 ${selectedRetireAge === age ? 'text-blue-100' : textSecondary}`}>
                        {retirementAge - age} yr{retirementAge - age > 1 ? 's' : ''} earlier
                      </div>
                    </button>
                  ))}
                </div>

                {/* Quick Impact Preview */}
                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className={`text-xs ${textSecondary} space-y-1`}>
                    <div>• Retire {retirementAge - selectedRetireAge} year{retirementAge - selectedRetireAge > 1 ? 's' : ''} earlier (age {selectedRetireAge})</div>
                    <div>• Gain: {retirementAge - selectedRetireAge} extra year{retirementAge - selectedRetireAge > 1 ? 's' : ''} of freedom</div>
                    <div>• Portfolio may deplete ~{(retirementAge - selectedRetireAge) * 2} years sooner</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legacy Percentage Selector */}
          {scenarioType === 'legacy' && (
            <div>
              <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                Legacy Preservation Amount:
              </h3>
              <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4 space-y-3`}>
                <div className={`text-xs ${textSecondary} mb-2`}>
                  Starting Portfolio: <span className={`font-semibold ${textPrimary}`}>
                    {totalAssets >= 1_000_000 ? `$${(totalAssets / 1_000_000).toFixed(1)}M` : `$${Math.round(totalAssets / 1000)}K`}
                  </span>
                </div>

                {/* Percentage Selection Radio Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50].map((pct) => {
                    const targetAmount = totalAssets * (pct / 100)
                    const targetFormatted = targetAmount >= 1_000_000
                      ? `$${(targetAmount / 1_000_000).toFixed(1)}M`
                      : `$${Math.round(targetAmount / 1000)}K`

                    return (
                      <button
                        key={pct}
                        onClick={() => setSelectedLegacyPercentage(pct)}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          selectedLegacyPercentage === pct
                            ? isDarkMode
                              ? 'bg-blue-600 text-white border-2 border-blue-500'
                              : 'bg-blue-600 text-white border-2 border-blue-500'
                            : isDarkMode
                            ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pct}%
                        <div className={`text-xs mt-0.5 ${selectedLegacyPercentage === pct ? 'text-blue-100' : textSecondary}`}>
                          {targetFormatted}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Quick Impact Preview */}
                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className={`text-xs ${textSecondary} space-y-1`}>
                    <div>• Preserve {selectedLegacyPercentage}% of portfolio ({
                      totalAssets * (selectedLegacyPercentage / 100) >= 1_000_000
                        ? `$${((totalAssets * selectedLegacyPercentage / 100) / 1_000_000).toFixed(1)}M`
                        : `$${Math.round((totalAssets * selectedLegacyPercentage / 100) / 1000)}K`
                    }) for heirs</div>
                    <div>• Portfolio will never drop below this target</div>
                    <div>• Spending will be optimized to reach target</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lump Sum Withdrawal Selector */}
          {scenarioType === 'lump_sum' && (
            <div className="space-y-4">
              {/* Withdrawal Amount */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Withdrawal Amount:
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[10000, 50000, 100000, 150000, 200000, 300000, 500000, 750000, 1000000, 1500000, 2000000, 3000000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setLumpSumAmount(amount)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        lumpSumAmount === amount
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      ${amount >= 1000000 ? `${(amount / 1000000).toFixed(1)}M` : `${amount / 1000}K`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Withdrawal Age */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Withdrawal Age:
                </h3>
                <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLumpSumAge(Math.max(lumpSumAge - 1, retirementAge))}
                      disabled={lumpSumAge <= retirementAge}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-xl font-bold transition-colors ${
                        lumpSumAge <= retirementAge
                          ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                          : isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={retirementAge}
                      max={longevityAge - 1}
                      value={lumpSumAge}
                      onChange={(e) => setLumpSumAge(Math.min(Math.max(parseInt(e.target.value) || retirementAge, retirementAge), longevityAge - 1))}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center ${
                        isDarkMode
                          ? 'bg-gray-600 text-white border-2 border-gray-500'
                          : 'bg-white text-gray-900 border-2 border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setLumpSumAge(Math.min(lumpSumAge + 1, longevityAge - 1))}
                      disabled={lumpSumAge >= longevityAge - 1}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-xl font-bold transition-colors ${
                        lumpSumAge >= longevityAge - 1
                          ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                          : isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <div className={`text-xs ${textSecondary} mt-2 text-center`}>
                    Age {retirementAge} (retirement) to {longevityAge - 1}
                  </div>
                </div>
              </div>

              {/* Source Account */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Withdraw From:
                </h3>
                <div className="space-y-2">
                  {[
                    { value: 'smart' as const, label: 'Smart Withdrawal (Tax-Optimized)', balance: null, recommended: true },
                    { value: 'rrsp' as const, label: 'RRSP', balance: rrspBalance, recommended: false },
                    { value: 'tfsa' as const, label: 'TFSA', balance: tfsaBalance, recommended: false },
                    { value: 'non_registered' as const, label: 'Non-Registered', balance: nonRegisteredBalance, recommended: false }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLumpSumSource(option.value)}
                      disabled={option.balance !== null && option.balance === 0}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${
                        lumpSumSource === option.value
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : option.balance === 0
                          ? isDarkMode
                            ? 'bg-gray-700 text-gray-500 border-2 border-gray-600 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{option.label}</span>
                          {option.recommended && (
                            <span className={`ml-2 text-xs ${lumpSumSource === option.value ? 'text-blue-200' : isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              (Recommended)
                            </span>
                          )}
                        </div>
                        {option.balance !== null && (
                          <span className={`text-xs ${lumpSumSource === option.value ? 'text-blue-100' : textSecondary}`}>
                            {option.balance >= 1000000 ? `$${(option.balance / 1000000).toFixed(1)}M` : `$${Math.round(option.balance / 1000)}K`}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Longevity Age Selector */}
          {scenarioType === 'longevity' && (
            <div>
              <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                Plan Until Age:
              </h3>
              <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4 space-y-3`}>
                <div className={`text-xs ${textSecondary} mb-2`}>
                  Current longevity age: <span className={`font-semibold ${textPrimary}`}>Age {longevityAge}</span>
                </div>

                {/* Age Selection Radio Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[95, 100, 105].map((age) => (
                    <button
                      key={age}
                      onClick={() => setSelectedLongevityAge(age)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        selectedLongevityAge === age
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Age {age}
                      <div className={`text-xs mt-0.5 ${selectedLongevityAge === age ? 'text-blue-100' : textSecondary}`}>
                        {age - longevityAge > 0 ? `+${age - longevityAge} years` : age === longevityAge ? 'Same' : `${age - longevityAge} years`}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Quick Impact Preview */}
                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className={`text-xs ${textSecondary} space-y-1`}>
                    <div>• Plan for {selectedLongevityAge - retirementAge} years of retirement</div>
                    <div>• Tests portfolio durability to age {selectedLongevityAge}</div>
                    <div>• ~{Math.round((selectedLongevityAge - longevityAge) * 0.03 * 100)}% less annual spending may be needed</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Part-Time Work Selector */}
          {scenarioType === 'part_time_work' && (
            <div className="space-y-4">
              {/* Income Percentage */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Income Level:
                </h3>
                <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4 space-y-3`}>
                  <div className={`text-xs ${textSecondary} mb-2`}>
                    Based on current income: <span className={`font-semibold ${textPrimary}`}>${employmentIncome.toLocaleString()}/year</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[25, 50, 75].map((pct) => {
                      const annualAmount = Math.round(employmentIncome * (pct / 100))
                      return (
                        <button
                          key={pct}
                          onClick={() => setPartTimePercentage(pct)}
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            partTimePercentage === pct
                              ? isDarkMode
                                ? 'bg-blue-600 text-white border-2 border-blue-500'
                                : 'bg-blue-600 text-white border-2 border-blue-500'
                              : isDarkMode
                              ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pct}%
                          <div className={`text-xs mt-0.5 ${partTimePercentage === pct ? 'text-blue-100' : textSecondary}`}>
                            ${Math.round(annualAmount / 1000)}K/yr
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Duration:
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 7, 10].map((years) => (
                    <button
                      key={years}
                      onClick={() => setPartTimeDuration(years)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        partTimeDuration === years
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {years} years
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Preview */}
              <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`text-xs ${textSecondary} space-y-1`}>
                  <div className={`font-semibold ${textPrimary} mb-2`}>
                    Total additional income: ${Math.round((employmentIncome * (partTimePercentage / 100) * partTimeDuration) / 1000)}K
                  </div>
                  <div>• Work ages {retirementAge} to {retirementAge + partTimeDuration}</div>
                  <div>• Earn ${Math.round(employmentIncome * (partTimePercentage / 100) / 1000)}K/year</div>
                  <div>• Reduces early withdrawal pressure</div>
                </div>
              </div>
            </div>
          )}

          {/* Market Crash Selector */}
          {scenarioType === 'market_crash' && (
            <div className="space-y-4">
              {/* Crash Severity */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Crash Severity:
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 40, 50].map((severity) => (
                    <button
                      key={severity}
                      onClick={() => setCrashMagnitude(severity)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        crashMagnitude === severity
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      -{severity}%
                      <div className={`text-xs mt-0.5 ${crashMagnitude === severity ? 'text-blue-100' : textSecondary}`}>
                        {severity === 30 ? 'Moderate' : severity === 40 ? 'Severe' : 'Extreme'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recovery Period */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Recovery Period:
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 7].map((years) => (
                    <button
                      key={years}
                      onClick={() => setRecoveryYears(years)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        recoveryYears === years
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {years} years
                      <div className={`text-xs mt-0.5 ${recoveryYears === years ? 'text-blue-100' : textSecondary}`}>
                        {years === 3 ? 'Fast' : years === 5 ? 'Normal' : 'Slow'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Preview */}
              <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`text-xs ${textSecondary} space-y-1`}>
                  <div className={`font-semibold ${textPrimary} mb-2`}>
                    Crash at age {retirementAge} (first year of retirement)
                  </div>
                  <div>• Portfolio drops {crashMagnitude}% in year 1</div>
                  <div>• Recovery over {recoveryYears} years back to baseline</div>
                  <div>• Tests "sequence of returns" risk</div>
                </div>
              </div>
            </div>
          )}

          {/* Move Provinces Selector */}
          {scenarioType === 'move_provinces' && (
            <div className="space-y-4">
              {/* Province Selection */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Move To:
                </h3>
                <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4 space-y-3`}>
                  <div className={`text-xs ${textSecondary} mb-2`}>
                    Current province: <span className={`font-semibold ${textPrimary}`}>{currentProvince}</span>
                  </div>

                  {/* Popular Provinces */}
                  <div className={`text-xs ${textSecondary} mb-2`}>Popular destinations:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['BC', 'AB', 'ON'] as Province[]).map((prov) => (
                      <button
                        key={prov}
                        onClick={() => setSelectedProvince(prov)}
                        disabled={prov === currentProvince}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          selectedProvince === prov
                            ? isDarkMode
                              ? 'bg-blue-600 text-white border-2 border-blue-500'
                              : 'bg-blue-600 text-white border-2 border-blue-500'
                            : prov === currentProvince
                            ? isDarkMode
                              ? 'bg-gray-700 text-gray-500 border-2 border-gray-600 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                            : isDarkMode
                            ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {prov}
                        <div className={`text-xs mt-0.5 ${selectedProvince === prov ? 'text-blue-100' : textSecondary}`}>
                          {prov === 'BC' ? 'Mild climate' : prov === 'AB' ? 'No PST' : 'Major cities'}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* All Other Provinces */}
                  <div className={`text-xs ${textSecondary} mt-3 mb-2`}>Other provinces:</div>
                  <div className="grid grid-cols-5 gap-2">
                    {(['SK', 'MB', 'QC', 'NB', 'NS', 'PE', 'NL', 'NT', 'NU', 'YT'] as Province[])
                      .filter(prov => prov !== currentProvince)
                      .map((prov) => (
                      <button
                        key={prov}
                        onClick={() => setSelectedProvince(prov)}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedProvince === prov
                            ? isDarkMode
                              ? 'bg-blue-600 text-white border-2 border-blue-500'
                              : 'bg-blue-600 text-white border-2 border-blue-500'
                            : isDarkMode
                            ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {prov}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Move Age */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Move at Age:
                </h3>
                <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMoveAge(Math.max(moveAge - 1, currentAge))}
                      disabled={moveAge <= currentAge}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-xl font-bold transition-colors ${
                        moveAge <= currentAge
                          ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                          : isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={currentAge}
                      max={longevityAge - 1}
                      value={moveAge}
                      onChange={(e) => setMoveAge(Math.min(Math.max(parseInt(e.target.value) || currentAge, currentAge), longevityAge - 1))}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center ${
                        isDarkMode
                          ? 'bg-gray-600 text-white border-2 border-gray-500'
                          : 'bg-white text-gray-900 border-2 border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setMoveAge(Math.min(moveAge + 1, longevityAge - 1))}
                      disabled={moveAge >= longevityAge - 1}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-xl font-bold transition-colors ${
                        moveAge >= longevityAge - 1
                          ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                          : isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <div className={`text-xs ${textSecondary} mt-2 text-center`}>
                    Default: retirement age ({retirementAge})
                  </div>
                </div>
              </div>

              {/* Impact Preview */}
              <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`text-xs ${textSecondary} space-y-1`}>
                  {selectedProvince ? (
                    <>
                      <div className={`font-semibold ${textPrimary} mb-2`}>
                        Moving from {currentProvince} to {selectedProvince} at age {moveAge}
                      </div>
                      <div>• Tax rates change based on new province</div>
                      <div>• Impact varies by your income level</div>
                      <div>• Full comparison shown after calculation</div>
                    </>
                  ) : (
                    <div className={`${textPrimary}`}>
                      👆 Select a destination province above
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Receive Inheritance Selector */}
          {scenarioType === 'receive_inheritance' && (
            <div className="space-y-4">
              {/* Inheritance Amount */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Inheritance Amount:
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[50000, 100000, 200000, 300000, 500000, 750000, 1000000, 2000000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setInheritanceAmount(amount)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        inheritanceAmount === amount
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      ${amount >= 1000000 ? `${(amount / 1000000).toFixed(1)}M` : `${amount / 1000}K`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receive Age */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Receive at Age:
                </h3>
                <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInheritanceAge(Math.max(inheritanceAge - 1, retirementAge))}
                      disabled={inheritanceAge <= retirementAge}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-xl font-bold transition-colors ${
                        inheritanceAge <= retirementAge
                          ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                          : isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={retirementAge}
                      max={longevityAge - 1}
                      value={inheritanceAge}
                      onChange={(e) => setInheritanceAge(Math.min(Math.max(parseInt(e.target.value) || retirementAge, retirementAge), longevityAge - 1))}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center ${
                        isDarkMode
                          ? 'bg-gray-600 text-white border-2 border-gray-500'
                          : 'bg-white text-gray-900 border-2 border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setInheritanceAge(Math.min(inheritanceAge + 1, longevityAge - 1))}
                      disabled={inheritanceAge >= longevityAge - 1}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-xl font-bold transition-colors ${
                        inheritanceAge >= longevityAge - 1
                          ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                          : isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <div className={`text-xs ${textSecondary} mt-2 text-center`}>
                    Age {retirementAge} (retirement) to {longevityAge - 1}
                  </div>
                </div>
              </div>

              {/* Source Type */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Inheritance Type:
                </h3>
                <div className="space-y-2">
                  {[
                    { value: 'cash' as const, label: 'Cash / Life Insurance', tax: 'No tax (estate paid)', recommended: true },
                    { value: 'investments' as const, label: 'Investments (non-reg)', tax: 'No tax (cost basis stepped up)', recommended: false },
                    { value: 'property' as const, label: 'Real Estate', tax: 'No tax (principal residence)', recommended: false },
                    { value: 'rrsp_inherited' as const, label: 'RRSP/RRIF (non-spouse)', tax: 'Fully taxable as income', recommended: false }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setInheritanceSource(option.value)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${
                        inheritanceSource === option.value
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{option.label}</span>
                          {option.recommended && (
                            <span className={`ml-2 text-xs ${inheritanceSource === option.value ? 'text-blue-200' : isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              (Most common)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`text-xs mt-1 ${inheritanceSource === option.value ? 'text-blue-100' : textSecondary}`}>
                        {option.tax}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Preview */}
              <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`text-xs ${textSecondary} space-y-1`}>
                  <div className={`font-semibold ${textPrimary} mb-2`}>
                    Receiving ${inheritanceAmount >= 1000000 ? `${(inheritanceAmount / 1000000).toFixed(1)}M` : `${inheritanceAmount / 1000}K`} at age {inheritanceAge}
                  </div>
                  <div>• Added to non-registered account</div>
                  {inheritanceSource === 'rrsp_inherited' && (
                    <div className="text-orange-500">⚠️ Will cause significant tax in receive year</div>
                  )}
                  <div>• See impact in portfolio chart</div>
                </div>
              </div>
            </div>
          )}

          {/* Downsize Home Selector */}
          {scenarioType === 'downsize_home' && (
            <div className="space-y-4">
              {/* Current Home Value */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Current Home Value:
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[400000, 600000, 800000, 1000000, 1200000, 1500000, 2000000, 3000000].map((value) => (
                    <button
                      key={value}
                      onClick={() => setHomeValue(value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        homeValue === value
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      ${value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${value / 1000}K`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Downsize Age */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Downsize at Age:
                </h3>
                <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDownsizeAge(Math.max(downsizeAge - 1, retirementAge))}
                      disabled={downsizeAge <= retirementAge}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-xl font-bold transition-colors ${
                        downsizeAge <= retirementAge
                          ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                          : isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={retirementAge}
                      max={longevityAge - 1}
                      value={downsizeAge}
                      onChange={(e) => setDownsizeAge(Math.min(Math.max(parseInt(e.target.value) || retirementAge, retirementAge), longevityAge - 1))}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center ${
                        isDarkMode
                          ? 'bg-gray-600 text-white border-2 border-gray-500'
                          : 'bg-white text-gray-900 border-2 border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setDownsizeAge(Math.min(downsizeAge + 1, longevityAge - 1))}
                      disabled={downsizeAge >= longevityAge - 1}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-xl font-bold transition-colors ${
                        downsizeAge >= longevityAge - 1
                          ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                          : isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <div className={`text-xs ${textSecondary} mt-2 text-center`}>
                    Age {retirementAge} (retirement) to {longevityAge - 1}
                  </div>
                </div>
              </div>

              {/* Buy vs Rent Toggle */}
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  After Selling:
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['buy', 'rent'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setBuyOrRent(option)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        buyOrRent === option
                          ? isDarkMode
                            ? 'bg-blue-600 text-white border-2 border-blue-500'
                            : 'bg-blue-600 text-white border-2 border-blue-500'
                          : isDarkMode
                          ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option === 'buy' ? '🏠 Buy Smaller Home' : '🏢 Rent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* New Home Cost (if buying) */}
              {buyOrRent === 'buy' && (
                <div>
                  <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                    New Home Cost:
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {[200000, 300000, 400000, 500000, 600000, 800000, 1000000, 1500000].map((cost) => (
                      <button
                        key={cost}
                        onClick={() => setNewHomeCost(cost)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          newHomeCost === cost
                            ? isDarkMode
                              ? 'bg-blue-600 text-white border-2 border-blue-500'
                              : 'bg-blue-600 text-white border-2 border-blue-500'
                            : isDarkMode
                            ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        ${cost >= 1000000 ? `${(cost / 1000000).toFixed(1)}M` : `${cost / 1000}K`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Rent (if renting) */}
              {buyOrRent === 'rent' && (
                <div>
                  <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                    Monthly Rent:
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000].map((rent) => (
                      <button
                        key={rent}
                        onClick={() => setMonthlyRent(rent)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          monthlyRent === rent
                            ? isDarkMode
                              ? 'bg-blue-600 text-white border-2 border-blue-500'
                              : 'bg-blue-600 text-white border-2 border-blue-500'
                            : isDarkMode
                            ? 'bg-gray-600 text-gray-200 border-2 border-gray-500 hover:bg-gray-500'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        ${rent.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Impact Preview */}
              <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`text-xs ${textSecondary} space-y-1`}>
                  {(() => {
                    const netProceeds = homeValue * 0.95 // 5% selling costs
                    const equityUnlocked = buyOrRent === 'buy' ? netProceeds - newHomeCost : netProceeds
                    const equityFormatted = equityUnlocked >= 1000000
                      ? `$${(equityUnlocked / 1000000).toFixed(1)}M`
                      : `$${Math.round(equityUnlocked / 1000)}K`
                    return (
                      <>
                        <div className={`font-semibold ${textPrimary} mb-2`}>
                          {buyOrRent === 'buy' ? 'Downsizing' : 'Selling & renting'} at age {downsizeAge}
                        </div>
                        <div>• Net proceeds after 5% costs: ${(netProceeds / 1000).toFixed(0)}K</div>
                        {buyOrRent === 'buy' && <div>• New home cost: ${(newHomeCost / 1000).toFixed(0)}K</div>}
                        <div className={`font-semibold ${textPrimary}`}>• Equity unlocked: {equityFormatted}</div>
                        {buyOrRent === 'rent' && <div>• Monthly rent added to expenses: ${monthlyRent.toLocaleString()}</div>}
                        <div>• No tax (principal residence exemption)</div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Parameters */}
          {scenario.parameters && (
            <div>
              <h3 className={`text-sm font-semibold ${textPrimary} mb-2`}>
                {scenario.parametersTitle}:
              </h3>
              <ul className="space-y-2">
                {scenario.parameters.map((param, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className={`${textPrimary} mt-0.5`}>•</span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${textPrimary}`}>
                        {param.label}
                      </div>
                      {param.detail && (
                        <div className={`text-xs ${textSecondary} mt-0.5`}>
                          {param.detail}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${modalBorder}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium ${textSecondary} ${closeBtnHover} rounded-md transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={scenarioType === 'move_provinces' && !selectedProvince}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
              scenarioType === 'move_provinces' && !selectedProvince
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Run Scenario
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Scenario configuration and quick estimates
 */
function getScenarioConfig(
  type: string,
  baselineMonthly: number,
  retirementAge: number,
  totalAssets: number,
  selectedRetireAge?: number,
  selectedLegacyPercentage?: number,
  cppStartAge: number = 65,
  oasStartAge: number = 65
) {
  const baselineAnnual = baselineMonthly * 12

  switch (type) {
    case 'front_load':
      const goGoYears = 10 // Ages 65-75 (adjust if retirement age differs)
      const extraPerYear = baselineAnnual * 0.30
      const totalExtraGoGo = extraPerYear * goGoYears

      return {
        icon: '🎯',
        title: 'Front-Load the Fun',
        subtitle: 'Spend more early, scale back later',
        description:
          'Model the "go-go, slow-go, no-go" phases of retirement by adjusting your spending based on age and activity level.',
        parametersTitle: 'Spending Adjustments',
        parameters: [
          {
            label: `Ages ${retirementAge}-${retirementAge + 10} (Go-Go): +30%`,
            detail: 'Travel, hobbies, active lifestyle'
          },
          {
            label: `Ages ${retirementAge + 10}-${retirementAge + 20} (Slow-Go): -15%`,
            detail: 'Reduced activity, more home-based'
          },
          {
            label: `Ages ${retirementAge + 20}+ (No-Go): -25%`,
            detail: 'Minimal travel, healthcare focus'
          }
        ],
        estimates: [
          `Extra spending in go-go years: ~$${Math.round(totalExtraGoGo / 1000)}K`,
          'Portfolio impact: Depletes ~2 years earlier'
        ]
      }

    case 'exhaust':
      return {
        icon: '💰',
        title: 'Exhaust Your Portfolio',
        subtitle: 'Maximize lifestyle - use every dollar',
        description:
          'Find the maximum monthly spending that uses your entire portfolio by your longevity age. This optimization takes ~1 second to calculate.',
        parametersTitle: null,
        parameters: null,
        estimates: [
          'Searching for optimal spending level...',
          'Will show exact amount after calculation'
        ]
      }

    case 'legacy':
      const percentage = selectedLegacyPercentage || 25
      const legacyTarget = totalAssets * (percentage / 100)
      const legacyTargetFormatted = legacyTarget >= 1_000_000
        ? `$${(legacyTarget / 1_000_000).toFixed(1)}M`
        : `$${Math.round(legacyTarget / 1000)}K`

      return {
        icon: '🏛️',
        title: 'Leave a Legacy',
        subtitle: `Preserve ${percentage}% for heirs`,
        description:
          `Optimize your spending to preserve ${percentage}% of your starting portfolio for estate planning. Calculates the maximum monthly spending that leaves ${legacyTargetFormatted} to your heirs.`,
        parametersTitle: 'Legacy Settings',
        parameters: [
          {
            label: `Starting Portfolio: ${totalAssets >= 1_000_000 ? `$${(totalAssets / 1_000_000).toFixed(1)}M` : `$${Math.round(totalAssets / 1000)}K`}`,
            detail: 'Total across all accounts (RRSP, TFSA, Non-Registered)'
          },
          {
            label: `Preservation Target: ${legacyTargetFormatted} (${percentage}%)`,
            detail: 'Amount preserved for heirs at longevity age'
          }
        ],
        estimates: [
          'Spending optimized to end at legacy target',
          'May increase or decrease from baseline'
        ]
      }

    case 'delay_benefits':
      // Calculate percentage increases from baseline CPP/OAS ages to 70
      const cppYearsDelay = 70 - cppStartAge
      const oasYearsDelay = 70 - oasStartAge
      const cppIncreasePct = cppYearsDelay * 8.4 // 0.7% per month = 8.4% per year
      const oasIncreasePct = oasYearsDelay * 7.2 // 0.6% per month = 7.2% per year

      return {
        icon: '⏰',
        title: 'Delay CPP/OAS',
        subtitle: `Start government benefits at 70 instead of ${cppStartAge}`,
        description:
          `Compare starting CPP and OAS at age 70 vs ${cppStartAge}. CPP increases ${cppIncreasePct.toFixed(0)}% and OAS increases ${oasIncreasePct.toFixed(0)}% with delay, but requires ${cppYearsDelay} years of portfolio withdrawals.`,
        parametersTitle: 'Benefit Increases',
        parameters: [
          {
            label: `CPP at 70: +${cppIncreasePct.toFixed(0)}% vs age ${cppStartAge}`,
            detail: cppStartAge === 65 ? '~$22K/year instead of $15.5K' : `${cppYearsDelay} year delay = ${cppIncreasePct.toFixed(0)}% increase`
          },
          {
            label: `OAS at 70: +${oasIncreasePct.toFixed(0)}% vs age ${oasStartAge}`,
            detail: oasStartAge === 65 ? '~$12K/year instead of $8.8K' : `${oasYearsDelay} year delay = ${oasIncreasePct.toFixed(0)}% increase`
          }
        ],
        estimates: [
          cppStartAge === 65 ? 'Lifetime income gain: ~$127K (to age 95)' : `${cppYearsDelay + oasYearsDelay} total years of delay`,
          cppStartAge === 65 ? 'Requires: $250K extra portfolio at 65' : `Higher monthly benefits for life`
        ]
      }

    case 'retire_early':
      const newRetireAge = selectedRetireAge || retirementAge - 3
      const yearsEarlier = retirementAge - newRetireAge
      return {
        icon: '🚀',
        title: 'Retire Earlier',
        subtitle: `What if you retired ${yearsEarlier} year${yearsEarlier > 1 ? 's' : ''} early?`,
        description:
          `Explore retiring at age ${newRetireAge} instead of ${retirementAge}. Shows the portfolio impact of starting retirement earlier.`,
        parametersTitle: null,
        parameters: null,
        estimates: [
          `+${yearsEarlier} extra year${yearsEarlier > 1 ? 's' : ''} of retirement`,
          `Portfolio depletes ~${yearsEarlier * 2} years earlier`
        ]
      }

    case 'lump_sum':
      return {
        icon: '💵',
        title: 'Lump Sum Withdrawal',
        subtitle: 'Test a one-time large withdrawal',
        description:
          'Model the impact of a large one-time withdrawal (wedding, renovation, travel, gift to family) on your retirement plan. See tax implications and portfolio recovery timeline.',
        parametersTitle: null,
        parameters: null,
        estimates: [
          'Configure withdrawal amount, age, and source account above',
          'Results show tax impact and portfolio longevity'
        ]
      }

    case 'longevity':
      return {
        icon: '💀',
        title: 'Live to 100',
        subtitle: 'Test your plan for a long life',
        description:
          'See if your retirement plan can sustain you well beyond average life expectancy. Tests portfolio durability with extra years of spending.',
        parametersTitle: null,
        parameters: null,
        estimates: [
          'Extends your planning horizon',
          'Shows if portfolio lasts through longevity'
        ]
      }

    case 'part_time_work':
      return {
        icon: '💼',
        title: 'Work Part-Time',
        subtitle: 'Earn income after retiring',
        description:
          'Model the impact of working part-time in early retirement. Even modest income can significantly extend your portfolio and reduce sequence-of-returns risk.',
        parametersTitle: null,
        parameters: null,
        estimates: [
          'Select income level and duration above',
          'Shows portfolio and tax impact'
        ]
      }

    case 'market_crash':
      return {
        icon: '📉',
        title: 'Markets Crash',
        subtitle: 'Stress test your plan',
        description:
          'Simulate a major market crash in the first year of retirement—the worst possible timing. See if your portfolio recovers and sustains your lifestyle.',
        parametersTitle: null,
        parameters: null,
        estimates: [
          'Configure crash severity and recovery period above',
          'Shows long-term portfolio impact'
        ]
      }

    case 'move_provinces':
      return {
        icon: '🍁',
        title: 'Move Provinces',
        subtitle: 'Compare tax impact of relocating',
        description:
          'Compare the tax impact of moving to a different province. Provincial tax rates vary by income level—the best province depends on your specific situation.',
        parametersTitle: null,
        parameters: null,
        estimates: [
          'Select destination province and move age above',
          'Shows tax impact in comparison view'
        ]
      }

    case 'receive_inheritance':
      return {
        icon: '💝',
        title: 'Receive Inheritance',
        subtitle: 'Model a windfall or bequest',
        description:
          'See how receiving an inheritance impacts your retirement. Tax treatment depends on the source—most inheritances (cash, investments, property) are tax-free to you.',
        parametersTitle: null,
        parameters: null,
        estimates: [
          'Select amount, age, and source type above',
          'Shows portfolio and tax impact'
        ]
      }

    case 'downsize_home':
      return {
        icon: '🏠',
        title: 'Downsize Home',
        subtitle: 'Unlock home equity for retirement',
        description:
          'Model selling your home and either buying smaller or renting. Principal residence gains are tax-free. 5% selling costs are automatically included.',
        parametersTitle: null,
        parameters: null,
        estimates: [
          'Configure home value and strategy above',
          'Shows equity unlocked and portfolio impact'
        ]
      }

    default:
      return {
        icon: '🚧',
        title: 'Under Construction',
        subtitle: 'Coming soon',
        description: 'This scenario is currently being built. Check back soon!',
        parametersTitle: null,
        parameters: null,
        estimates: ['Feature in development']
      }
  }
}
