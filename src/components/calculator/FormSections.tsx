/**
 * FormSections Component
 *
 * Grid layout containing all calculator input fields organized into sections:
 * - Basic Info (age, income, province)
 * - Your Accounts (RRSP, TFSA, Non-Registered)
 * - In Retirement (spending, pension, CPP)
 * - Rate Assumptions (investment returns, inflation)
 */

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { WarmDataField } from '@/components/calculator/WarmDataField'
import { Province } from '@/types/constants'
import { PROVINCE_NAMES, PROVINCE_OPTIONS } from '@/lib/calculator/province-data'
import { CalculationResults } from '@/types/calculator'

interface FormSectionsProps {
  // Basic Info
  currentAge: number | null
  retirementAge: number | null
  longevityAge: number | null
  currentIncome: number | null
  province: string

  // Accounts
  rrsp: number | null
  rrspContribution: number | null
  tfsa: number | null
  tfsaContribution: number | null
  nonRegistered: number | null
  nonRegisteredContribution: number | null

  // Retirement
  monthlySpending: number | null
  pensionIncome: number | null
  pensionIndexed: boolean | null
  pensionHasBridge: boolean | null
  otherIncome: number | null
  cppStartAge: number | null

  // Rates
  investmentReturn: number | null
  postRetirementReturn: number | null
  inflationRate: number | null

  // UI State
  editMode: boolean
  isDarkMode: boolean
  theme: any
  calculationResults: CalculationResults | null

  // Setters
  setCurrentAge: (v: number | null) => void
  setRetirementAge: (v: number | null) => void
  setLongevityAge: (v: number | null) => void
  setCurrentIncome: (v: number | null) => void
  setProvince: (v: string) => void
  setRrsp: (v: number | null) => void
  setRrspContribution: (v: number | null) => void
  setTfsa: (v: number | null) => void
  setTfsaContribution: (v: number | null) => void
  setNonRegistered: (v: number | null) => void
  setNonRegisteredContribution: (v: number | null) => void
  setMonthlySpending: (v: number | null) => void
  setPensionIncome: (v: number | null) => void
  setPensionIndexed: (v: boolean | null) => void
  setPensionHasBridge: (v: boolean | null) => void
  setOtherIncome: (v: number | null) => void
  setCppStartAge: (v: number | null) => void
  setInvestmentReturn: (v: number | null) => void
  setPostRetirementReturn: (v: number | null) => void
  setInflationRate: (v: number | null) => void
  setEditMode: (v: boolean) => void

  // Focus handler
  onFieldFocus: (field: string) => void
}

export function FormSections({
  // Basic Info
  currentAge,
  retirementAge,
  longevityAge,
  currentIncome,
  province,

  // Accounts
  rrsp,
  rrspContribution,
  tfsa,
  tfsaContribution,
  nonRegistered,
  nonRegisteredContribution,

  // Retirement
  monthlySpending,
  pensionIncome,
  pensionIndexed,
  pensionHasBridge,
  otherIncome,
  cppStartAge,

  // Rates
  investmentReturn,
  postRetirementReturn,
  inflationRate,

  // UI State
  editMode,
  isDarkMode,
  theme,
  calculationResults,

  // Setters
  setCurrentAge,
  setRetirementAge,
  setLongevityAge,
  setCurrentIncome,
  setProvince,
  setRrsp,
  setRrspContribution,
  setTfsa,
  setTfsaContribution,
  setNonRegistered,
  setNonRegisteredContribution,
  setMonthlySpending,
  setPensionIncome,
  setPensionIndexed,
  setPensionHasBridge,
  setOtherIncome,
  setCppStartAge,
  setInvestmentReturn,
  setPostRetirementReturn,
  setInflationRate,
  setEditMode,

  // Focus handler
  onFieldFocus
}: FormSectionsProps) {
  return (
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
          onFocus={() => onFieldFocus('currentAge')}
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
          onFocus={() => onFieldFocus('retirementAge')}
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
          onFocus={() => onFieldFocus('longevityAge')}
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
          onFocus={() => onFieldFocus('currentIncome')}
        />
      </div>

      <WarmDataField
        label="Province/Territory"
        value={province ? PROVINCE_NAMES[province as Province] : null}
        editValue={province}
        editMode={editMode}
        onEdit={setProvince}
        type="select"
        options={PROVINCE_OPTIONS}
        isDarkMode={isDarkMode}
        theme={theme}
        onFocus={() => onFieldFocus('province')}
        isRequired={true}
      />

      {/* Accounts */}
      <div className="space-y-4">
        <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-blue-700' : 'border-rose-200'}`}>
          💰 Your Accounts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <WarmDataField label="RRSP Balance" value={rrsp} editMode={editMode} onEdit={setRrsp} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('rrsp')} />
          <WarmDataField label="RRSP Contribution (Annual)" value={rrspContribution} editMode={editMode} onEdit={setRrspContribution} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('rrspContribution')} />
          <WarmDataField label="TFSA Balance" value={tfsa} editMode={editMode} onEdit={setTfsa} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('tfsa')} />
          <WarmDataField label="TFSA Contribution (Annual)" value={tfsaContribution} editMode={editMode} onEdit={setTfsaContribution} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('tfsaContribution')} />
          <WarmDataField label="Non-Registered Balance" value={nonRegistered} editMode={editMode} onEdit={setNonRegistered} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('nonRegistered')} />
          <WarmDataField label="Non-Registered Contribution (Annual)" value={nonRegisteredContribution} editMode={editMode} onEdit={setNonRegisteredContribution} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('nonRegisteredContribution')} />
        </div>
      </div>

      {/* Retirement */}
      <div className="space-y-4">
        <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-indigo-700' : 'border-orange-200'}`}>
          🏖️ In Retirement
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <WarmDataField label="Monthly Spending Goal (Pre-Tax)" value={monthlySpending} editMode={editMode} onEdit={setMonthlySpending} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('monthlySpending')} />
          <WarmDataField label="Expected Pension Income (Annual)" value={pensionIncome} editMode={editMode} onEdit={setPensionIncome} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('pensionIncome')} />

          {/* Pension Options - Only show if pension income exists */}
          {pensionIncome !== null && pensionIncome > 0 && (
            <div className="col-span-1 sm:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pension-indexed"
                  checked={pensionIndexed === true}
                  onCheckedChange={(checked) => setPensionIndexed(checked as boolean)}
                  disabled={!editMode}
                />
                <label
                  htmlFor="pension-indexed"
                  className={`text-sm ${theme.text.primary} cursor-pointer select-none`}
                >
                  Indexed to inflation (cost-of-living adjustments)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="pension-bridge"
                  checked={pensionHasBridge === true}
                  onCheckedChange={(checked) => setPensionHasBridge(checked as boolean)}
                  disabled={!editMode || (pensionIncome !== null && pensionIncome < 16374)}
                />
                <label
                  htmlFor="pension-bridge"
                  className={`text-sm ${
                    pensionIncome !== null && pensionIncome < 16374
                      ? theme.text.muted
                      : theme.text.primary
                  } cursor-pointer select-none`}
                >
                  Has bridge benefit (reduces by $16,374 at age 65)
                  {pensionIncome !== null && pensionIncome < 16374 && (
                    <span className={`ml-2 text-xs ${theme.text.muted}`}>
                      (requires pension ≥ $16,374)
                    </span>
                  )}
                </label>
              </div>
            </div>
          )}

          <WarmDataField label="Other Income (Annual)" value={otherIncome} editMode={editMode} onEdit={setOtherIncome} type="currency" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('otherIncome')} />
          <WarmDataField label="CPP Start Age" value={cppStartAge} editMode={editMode} onEdit={setCppStartAge} type="number" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('cppStartAge')} />
        </div>
      </div>

      {/* Rates */}
      <div className="space-y-4">
        <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} pb-2 border-b-2 ${isDarkMode ? 'border-purple-700' : 'border-teal-200'}`}>
          📊 Rate Assumptions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <WarmDataField label="Pre-Retirement" value={investmentReturn} editMode={editMode} onEdit={setInvestmentReturn} type="percentage" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('investmentReturn')} />
          <WarmDataField label="Post-Retirement" value={postRetirementReturn} editMode={editMode} onEdit={setPostRetirementReturn} type="percentage" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('postRetirementReturn')} />
          <WarmDataField label="Inflation" value={inflationRate} editMode={editMode} onEdit={setInflationRate} type="percentage" isDarkMode={isDarkMode} theme={theme} onFocus={() => onFieldFocus('inflationRate')} />
        </div>
      </div>

      {/* Done Editing Button (Bottom) - Mobile convenience */}
      {editMode && calculationResults && (
        <div className={`pt-4 border-t-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button
            size="lg"
            onClick={() => setEditMode(false)}
            className={`w-full ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:text-blue-300'
                : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600 hover:text-rose-800'
            } text-white shadow-2xl py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-bold rounded-2xl transition-all`}
          >
            ✓ Done Editing
          </Button>
        </div>
      )}
    </div>
  )
}
