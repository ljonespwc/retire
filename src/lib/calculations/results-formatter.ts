/**
 * Results Formatter
 *
 * Transforms raw calculation results into display-ready formats
 * for visualization components.
 */

import { CalculationResults, YearByYearResult } from '@/types/calculator'

/**
 * Summary metrics for top-level overview
 */
export interface FormattedSummary {
  monthlyAfterTaxIncome: number
  successIndicator: 'sufficient' | 'concerning' | 'depleted'
  retirementAge: number
  yearsInRetirement: number
  totalAssets: number
  endingBalance: number
  depletionAge?: number
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
  cppIncome: number
  oasIncome: number
  pensionIncome: number
  otherIncome: number
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
export function formatSummary(results: CalculationResults, retirementAge: number): FormattedSummary {
  // Find first retirement year (first year where income > 0 or at retirement age)
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

  return {
    monthlyAfterTaxIncome,
    successIndicator,
    retirementAge: firstRetirementYear.age,
    yearsInRetirement,
    totalAssets: results.year_by_year[0].balances.total, // Starting balance (current age)
    endingBalance: results.final_portfolio_value,
    depletionAge: results.portfolio_depleted_age
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

    // Collect all milestones for this age (can have multiple)
    const milestones: string[] = []

    // Check for CPP start
    const prevYear = results.year_by_year[results.year_by_year.indexOf(year) - 1]
    if (year.income.cpp > 0 && (!prevYear || prevYear.income.cpp === 0)) {
      milestones.push('CPP Starts')
    }

    // Check for OAS start
    if (year.income.oas > 0 && (!prevYear || prevYear.income.oas === 0)) {
      milestones.push('OAS Starts')
    }

    // Check for RRIF conversion
    if (year.age === 71) {
      milestones.push('RRIF Conversion')
    }

    // Join multiple milestones with comma
    if (milestones.length > 0) {
      dataPoint.milestone = milestones.join(', ')
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
  return results.year_by_year.map(year => ({
    age: year.age,
    rrspIncome: year.withdrawals.rrsp_rrif || 0,
    tfsaIncome: year.withdrawals.tfsa || 0,
    cppIncome: year.income.cpp || 0,
    oasIncome: year.income.oas || 0,
    pensionIncome: 0, // Pension is included in "other" income
    otherIncome: year.income.other || 0
  }))
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
