/**
 * Results Formatter
 *
 * Transforms raw calculation results into display-ready formats
 * for visualization components.
 */

import { CalculationResults, YearByYearResult, Scenario, Expenses } from '@/types/calculator'

/**
 * Summary metrics for top-level overview
 */
export interface FormattedSummary {
  monthlyAfterTaxIncome: number
  lifetimeNetIncome: number  // Total after-tax income across entire retirement
  successIndicator: 'sufficient' | 'concerning' | 'depleted'
  retirementAge: number
  yearsInRetirement: number
  totalAssets: number
  endingBalance: number
  depletionAge?: number
  // Lumpsum-specific fields (when one-time withdrawal detected in Year 1)
  hasYear1Lumpsum?: boolean
  year1LumpsumAmount?: number
  recurringMonthlyIncome?: number
  // Income coverage at depletion (for contextual warnings)
  ongoingIncomeAtDepletion?: number   // Annual income (pension + CPP + OAS + other)
  expensesAtDepletion?: number        // Annual expenses at depletion age
  incomeShortfall?: number            // Shortfall (if any)
  incomeCoverageRatio?: number        // Income / Expenses (e.g., 1.2 = 120% coverage)
}

/**
 * Data point for balance over time chart
 */
export interface BalanceDataPoint {
  age: number
  balance: number
  milestone?: string
}

/**
 * Data point for income composition chart
 */
export interface IncomeDataPoint {
  age: number
  rrspIncome: number
  tfsaIncome: number
  nonRegisteredIncome: number
  cppIncome: number
  oasIncome: number
  pensionIncome: number
  otherIncome: number
  netIncome: number  // After-tax income (gross - taxes)
  milestone?: string
}

/**
 * Tax summary metrics
 */
export interface FormattedTaxSummary {
  totalTaxPaid: number
  effectiveRate: number
  marginalRate: number
  annualEstimate: number
  monthlyNetIncome: number
  grossIncome: number
  netIncome: number
}

/**
 * Format calculation results into summary metrics
 */
export function formatSummary(
  results: CalculationResults,
  retirementAge: number,
  expenses?: Expenses
): FormattedSummary {
  // Find first retirement year at/after retirement age
  // Use the FIRST year at/after retirement age, regardless of tax
  const firstRetirementYear = results.year_by_year.find(
    year => year.age >= retirementAge
  )
  const lastYear = results.year_by_year[results.year_by_year.length - 1]

  if (!firstRetirementYear) {
    throw new Error('No retirement years found in results')
  }

  // Calculate monthly after-tax income (first year of retirement)
  const annualAfterTax = firstRetirementYear.income.total - firstRetirementYear.tax.total
  const monthlyAfterTaxIncome = annualAfterTax / 12

  // Detect lumpsum withdrawal in Year 1
  let hasYear1Lumpsum = false
  let year1LumpsumAmount: number | undefined
  let recurringMonthlyIncome: number | undefined

  if (expenses?.one_time_withdrawals) {
    const year1Lumpsum = expenses.one_time_withdrawals.find(
      w => w.age === retirementAge
    )

    if (year1Lumpsum) {
      hasYear1Lumpsum = true
      year1LumpsumAmount = year1Lumpsum.amount

      // Use Year 2 income to show true recurring monthly income
      // Year 2 doesn't have lumpsum distortion or massive one-time taxes
      const year2 = results.year_by_year.find(
        year => year.age === retirementAge + 1
      )

      if (year2) {
        const year2AfterTax = year2.income.total - year2.tax.total
        recurringMonthlyIncome = year2AfterTax / 12
      } else {
        // Fallback: use baseline calculation if Year 2 doesn't exist
        recurringMonthlyIncome = monthlyAfterTaxIncome
      }
    }
  }

  // Determine success indicator
  let successIndicator: 'sufficient' | 'concerning' | 'depleted'
  if (results.portfolio_depleted_age !== undefined) {
    successIndicator = 'depleted'
  } else if (lastYear && lastYear.balances.total < results.final_portfolio_value * 0.3) {
    // Less than 30% remaining
    successIndicator = 'concerning'
  } else {
    successIndicator = 'sufficient'
  }

  // Calculate years in retirement
  const yearsInRetirement = lastYear.age - firstRetirementYear.age

  // Calculate lifetime total after-tax income (across all retirement years)
  const retirementYears = results.year_by_year.filter(year => year.age >= retirementAge)
  const lifetimeNetIncome = retirementYears.reduce((sum, year) => {
    return sum + (year.income.total - year.tax.total)
  }, 0)

  // If portfolio depletes, calculate ongoing income coverage for contextual warnings
  let ongoingIncomeAtDepletion: number | undefined
  let expensesAtDepletion: number | undefined
  let incomeShortfall: number | undefined
  let incomeCoverageRatio: number | undefined

  if (results.portfolio_depleted_age !== undefined) {
    const depletionYear = results.year_by_year.find(
      year => year.age === results.portfolio_depleted_age
    )

    if (depletionYear) {
      // Ongoing income = non-investment income (pension + CPP + OAS + other)
      ongoingIncomeAtDepletion =
        depletionYear.income.pension +
        depletionYear.income.cpp +
        depletionYear.income.oas +
        depletionYear.income.other

      expensesAtDepletion = depletionYear.expenses

      // Calculate after-tax ongoing income (approximation using year's tax)
      const afterTaxOngoingIncome = ongoingIncomeAtDepletion - depletionYear.tax.total

      incomeShortfall = Math.max(0, expensesAtDepletion - afterTaxOngoingIncome)
      incomeCoverageRatio = expensesAtDepletion > 0 ? afterTaxOngoingIncome / expensesAtDepletion : 0
    }
  }

  return {
    monthlyAfterTaxIncome,
    lifetimeNetIncome,
    successIndicator,
    retirementAge: firstRetirementYear.age,
    yearsInRetirement,
    totalAssets: results.year_by_year[0].balances.total, // Starting balance (current age)
    endingBalance: results.final_portfolio_value,
    depletionAge: results.portfolio_depleted_age,
    // Include lumpsum fields if detected
    ...(hasYear1Lumpsum && {
      hasYear1Lumpsum,
      year1LumpsumAmount,
      recurringMonthlyIncome
    }),
    // Include income coverage fields if portfolio depletes
    ...(results.portfolio_depleted_age !== undefined && {
      ongoingIncomeAtDepletion,
      expensesAtDepletion,
      incomeShortfall,
      incomeCoverageRatio
    })
  }
}

/**
 * Format year-by-year results for balance chart
 */
export function formatBalanceData(
  results: CalculationResults
): BalanceDataPoint[] {
  return results.year_by_year.map(year => {
    const dataPoint: BalanceDataPoint = {
      age: year.age,
      balance: year.balances.total
    }

    // Portfolio-specific milestone: RRIF conversion at age 71
    if (year.age === 71) {
      dataPoint.milestone = 'RRIF Conversion'
    }

    return dataPoint
  })
}

/**
 * Format year-by-year results for income composition chart
 */
export function formatIncomeData(
  results: CalculationResults
): IncomeDataPoint[] {
  return results.year_by_year.map(year => {
    const dataPoint: IncomeDataPoint = {
      age: year.age,
      rrspIncome: year.withdrawals.rrsp_rrif || 0,
      tfsaIncome: year.withdrawals.tfsa || 0,
      nonRegisteredIncome: year.withdrawals.non_registered || 0,
      cppIncome: year.income.cpp || 0,
      oasIncome: year.income.oas || 0,
      pensionIncome: year.income.pension || 0,
      otherIncome: year.income.other || 0,
      netIncome: year.income.total - year.tax.total  // After-tax income
    }

    // Income-specific milestones: CPP and OAS start
    const milestones: string[] = []
    const prevYear = results.year_by_year[results.year_by_year.indexOf(year) - 1]

    if (year.income.cpp > 0 && (!prevYear || prevYear.income.cpp === 0)) {
      milestones.push('CPP Starts')
    }

    if (year.income.oas > 0 && (!prevYear || prevYear.income.oas === 0)) {
      milestones.push('OAS Starts')
    }

    if (milestones.length > 0) {
      dataPoint.milestone = milestones.join(', ')
    }

    return dataPoint
  })
}

/**
 * Format tax information for summary card
 */
export function formatTaxSummary(results: CalculationResults, retirementAge: number): FormattedTaxSummary {
  // Only sum taxes and income from retirement years (not pre-retirement)
  const retirementYears = results.year_by_year.filter(year => year.age >= retirementAge)

  const totalTaxPaid = retirementYears.reduce(
    (sum, year) => sum + year.tax.total,
    0
  )
  const totalGrossIncome = retirementYears.reduce(
    (sum, year) => sum + year.income.total,
    0
  )
  const totalNetIncome = totalGrossIncome - totalTaxPaid

  // Calculate effective rate from retirement years only
  const effectiveRate = totalGrossIncome > 0
    ? (totalTaxPaid / totalGrossIncome) * 100
    : 0

  // Calculate average marginal rate across retirement years
  const totalMarginalRate = retirementYears.reduce(
    (sum, year) => sum + year.tax.marginal_rate,
    0
  )
  const marginalRate = retirementYears.length > 0
    ? (totalMarginalRate / retirementYears.length) * 100
    : 0

  const yearsInRetirement = retirementYears.length
  const annualEstimate = yearsInRetirement > 0
    ? totalTaxPaid / yearsInRetirement
    : 0

  // Calculate average monthly net income
  const monthlyNetIncome = yearsInRetirement > 0
    ? totalNetIncome / (yearsInRetirement * 12)
    : 0

  return {
    totalTaxPaid,
    effectiveRate,
    marginalRate,
    annualEstimate,
    monthlyNetIncome,
    grossIncome: totalGrossIncome,
    netIncome: totalNetIncome
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format large numbers with abbreviations (K, M)
 */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  } else if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  } else {
    return formatCurrency(amount)
  }
}
