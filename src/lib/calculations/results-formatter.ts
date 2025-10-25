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
  annualEstimate: number
  grossIncome: number
  netIncome: number
}

/**
 * Format calculation results into summary metrics
 */
export function formatSummary(results: CalculationResults): FormattedSummary {
  // Find first retirement year
  const firstRetirementYear = results.year_by_year[0] // First year in results is retirement start
  const lastYear = results.year_by_year[results.year_by_year.length - 1]

  // Calculate monthly after-tax income (first year of retirement)
  const annualAfterTax = firstRetirementYear
    ? firstRetirementYear.income.total - firstRetirementYear.tax.total
    : 0
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
    totalAssets: results.year_by_year[0].balances.total, // Starting balance
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

    // Add milestone markers (simple version - could be enhanced)
    // Note: We'd need additional metadata to know CPP/OAS start ages
    // For now, use common ages
    if (year.income.cpp > 0 && results.year_by_year[results.year_by_year.indexOf(year) - 1]?.income.cpp === 0) {
      dataPoint.milestone = 'CPP Starts'
    } else if (year.income.oas > 0 && results.year_by_year[results.year_by_year.indexOf(year) - 1]?.income.oas === 0) {
      dataPoint.milestone = 'OAS Starts'
    } else if (year.age === 71) {
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
export function formatTaxSummary(results: CalculationResults): FormattedTaxSummary {
  const totalTaxPaid = results.total_taxes_paid_in_retirement
  const totalGrossIncome = results.year_by_year.reduce(
    (sum, year) => sum + year.income.total,
    0
  )
  const totalNetIncome = totalGrossIncome - totalTaxPaid
  const effectiveRate = results.average_tax_rate_in_retirement * 100 // Convert to percentage

  const yearsInRetirement = results.year_by_year.length
  const annualEstimate = yearsInRetirement > 0
    ? totalTaxPaid / yearsInRetirement
    : 0

  return {
    totalTaxPaid,
    effectiveRate,
    annualEstimate,
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
