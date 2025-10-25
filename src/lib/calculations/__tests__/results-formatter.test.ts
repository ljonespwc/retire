/**
 * Results Formatter Tests
 *
 * Comprehensive tests for results formatting functions that transform
 * raw calculation results into display-ready formats for UI components.
 *
 * Tests cover:
 * - Summary metrics formatting
 * - Balance data transformation
 * - Income composition data
 * - Tax summary calculations
 * - Currency and percentage formatting
 */

import { describe, it, expect } from 'vitest'
import {
  formatSummary,
  formatBalanceData,
  formatIncomeData,
  formatTaxSummary,
  formatCurrency,
  formatPercentage,
  formatCompactCurrency,
  type FormattedSummary,
  type BalanceDataPoint,
  type IncomeDataPoint,
  type FormattedTaxSummary
} from '../results-formatter'
import { CalculationResults, YearByYearResult } from '@/types/calculator'

/**
 * Helper to create minimal year-by-year result for testing
 */
function createYearResult(overrides: Partial<YearByYearResult>): YearByYearResult {
  return {
    age: 65,
    portfolio_balance: 1000000,
    balances: {
      rrsp_rrif: 400000,
      tfsa: 300000,
      non_registered: 300000,
      total: 1000000
    },
    income: {
      cpp: 15000,
      oas: 8000,
      pension: 0,
      other: 0,
      total: 23000
    },
    withdrawals: {
      rrsp_rrif: 0,
      tfsa: 0,
      non_registered: 0
    },
    tax: {
      federal: 2000,
      provincial: 1000,
      total: 3000
    },
    expenses: 48000,
    surplus_deficit: -28000,
    ...overrides
  }
}

/**
 * Helper to create minimal calculation results for testing
 */
function createCalculationResults(overrides: Partial<CalculationResults>): CalculationResults {
  return {
    scenario_name: 'Test Scenario',
    year_by_year: [
      createYearResult({ age: 65 }),
      createYearResult({ age: 66 }),
      createYearResult({ age: 67 })
    ],
    success: true,
    portfolio_depleted_age: undefined,
    final_portfolio_value: 900000,
    total_taxes_paid_in_retirement: 90000,
    average_tax_rate_in_retirement: 0.13,
    ...overrides
  }
}

describe('formatSummary', () => {
  it('should format basic summary metrics correctly', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({
          age: 65,
          income: { cpp: 15000, oas: 8000, pension: 0, other: 0, total: 23000 },
          tax: { federal: 2000, provincial: 1000, total: 3000 },
          balances: { rrsp_rrif: 400000, tfsa: 300000, non_registered: 300000, total: 1000000 }
        }),
        createYearResult({ age: 90, balances: { rrsp_rrif: 100000, tfsa: 50000, non_registered: 50000, total: 200000 } })
      ],
      final_portfolio_value: 200000
    })

    const summary = formatSummary(results, 65)

    expect(summary.retirementAge).toBe(65)
    expect(summary.yearsInRetirement).toBe(25)
    expect(summary.totalAssets).toBe(1000000)
    expect(summary.endingBalance).toBe(200000)
    expect(summary.monthlyAfterTaxIncome).toBeCloseTo((23000 - 3000) / 12, 2)
  })

  it('should calculate monthly after-tax income correctly', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({
          age: 65,
          income: { cpp: 15000, oas: 8000, pension: 12000, other: 5000, total: 40000 },
          tax: { federal: 4000, provincial: 2000, total: 6000 }
        })
      ]
    })

    const summary = formatSummary(results, 65)

    // Annual after-tax: 40000 - 6000 = 34000
    // Monthly: 34000 / 12 = 2833.33
    expect(summary.monthlyAfterTaxIncome).toBeCloseTo(2833.33, 2)
  })

  it('should indicate "sufficient" when ending balance is healthy', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({ age: 65, balances: { rrsp_rrif: 400000, tfsa: 300000, non_registered: 300000, total: 1000000 } }),
        createYearResult({ age: 90, balances: { rrsp_rrif: 350000, tfsa: 250000, non_registered: 200000, total: 800000 } })
      ],
      final_portfolio_value: 800000
    })

    const summary = formatSummary(results, 65)

    expect(summary.successIndicator).toBe('sufficient')
  })

  it('should indicate "concerning" when ending balance is low (< 30%)', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({ age: 65, balances: { rrsp_rrif: 400000, tfsa: 300000, non_registered: 300000, total: 1000000 } }),
        createYearResult({ age: 90, balances: { rrsp_rrif: 40000, tfsa: 30000, non_registered: 30000, total: 100000 } })
      ],
      final_portfolio_value: 500000
    })

    const summary = formatSummary(results, 65)

    // Ending balance (100000) < final_portfolio_value * 0.3 (500000 * 0.3 = 150000)
    expect(summary.successIndicator).toBe('concerning')
  })

  it('should indicate "depleted" when portfolio runs out', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({ age: 65 }),
        createYearResult({ age: 80, balances: { rrsp_rrif: 0, tfsa: 0, non_registered: 0, total: 0 } })
      ],
      portfolio_depleted_age: 80,
      final_portfolio_value: 0
    })

    const summary = formatSummary(results, 65)

    expect(summary.successIndicator).toBe('depleted')
    expect(summary.depletionAge).toBe(80)
  })

  it('should handle edge case with single year of data', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({ age: 65 })
      ]
    })

    const summary = formatSummary(results, 65)

    expect(summary.retirementAge).toBe(65)
    expect(summary.yearsInRetirement).toBe(0)
  })
})

describe('formatBalanceData', () => {
  it('should transform year-by-year data to balance data points', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({ age: 65, balances: { rrsp_rrif: 400000, tfsa: 300000, non_registered: 300000, total: 1000000 } }),
        createYearResult({ age: 66, balances: { rrsp_rrif: 380000, tfsa: 290000, non_registered: 280000, total: 950000 } }),
        createYearResult({ age: 67, balances: { rrsp_rrif: 360000, tfsa: 280000, non_registered: 260000, total: 900000 } })
      ]
    })

    const balanceData = formatBalanceData(results)

    expect(balanceData).toHaveLength(3)
    expect(balanceData[0]).toEqual({
      age: 65,
      balance: 1000000
    })
    expect(balanceData[1]).toEqual({
      age: 66,
      balance: 950000
    })
    expect(balanceData[2]).toEqual({
      age: 67,
      balance: 900000
    })
  })

  it('should add "CPP Starts" milestone when CPP income begins', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({ age: 64, income: { cpp: 0, oas: 0, pension: 0, other: 0, total: 0 } }),
        createYearResult({ age: 65, income: { cpp: 15000, oas: 8000, pension: 0, other: 0, total: 23000 } }),
        createYearResult({ age: 66, income: { cpp: 15000, oas: 8000, pension: 0, other: 0, total: 23000 } })
      ]
    })

    const balanceData = formatBalanceData(results)

    expect(balanceData[0].milestone).toBeUndefined()
    expect(balanceData[1].milestone).toBe('CPP Starts')
    expect(balanceData[2].milestone).toBeUndefined()
  })

  it('should add "OAS Starts" milestone when OAS income begins', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({ age: 64, income: { cpp: 0, oas: 0, pension: 0, other: 0, total: 0 } }),
        createYearResult({ age: 65, income: { cpp: 0, oas: 8000, pension: 0, other: 0, total: 8000 } })
      ]
    })

    const balanceData = formatBalanceData(results)

    expect(balanceData[1].milestone).toBe('OAS Starts')
  })

  it('should add "RRIF Conversion" milestone at age 71', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({ age: 70 }),
        createYearResult({ age: 71 }),
        createYearResult({ age: 72 })
      ]
    })

    const balanceData = formatBalanceData(results)

    expect(balanceData[0].milestone).toBeUndefined()
    expect(balanceData[1].milestone).toBe('RRIF Conversion')
    expect(balanceData[2].milestone).toBeUndefined()
  })

  it('should prioritize CPP/OAS milestones over RRIF at age 71', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({ age: 70, income: { cpp: 0, oas: 0, pension: 0, other: 0, total: 0 } }),
        createYearResult({ age: 71, income: { cpp: 15000, oas: 0, pension: 0, other: 0, total: 15000 } })
      ]
    })

    const balanceData = formatBalanceData(results)

    // CPP milestone takes priority over RRIF
    expect(balanceData[1].milestone).toBe('CPP Starts')
  })
})

describe('formatIncomeData', () => {
  it('should transform year-by-year data to income composition points', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({
          age: 65,
          income: { cpp: 15000, oas: 8000, pension: 0, other: 5000, total: 48000 },
          withdrawals: { rrsp_rrif: 18000, tfsa: 2000, non_registered: 0 }
        }),
        createYearResult({
          age: 66,
          income: { cpp: 15000, oas: 8000, pension: 0, other: 5000, total: 50000 },
          withdrawals: { rrsp_rrif: 20000, tfsa: 2000, non_registered: 0 }
        })
      ]
    })

    const incomeData = formatIncomeData(results)

    expect(incomeData).toHaveLength(2)
    expect(incomeData[0]).toEqual({
      age: 65,
      rrspIncome: 18000,
      tfsaIncome: 2000,
      cppIncome: 15000,
      oasIncome: 8000,
      pensionIncome: 0,
      otherIncome: 5000
    })
    expect(incomeData[1]).toEqual({
      age: 66,
      rrspIncome: 20000,
      tfsaIncome: 2000,
      cppIncome: 15000,
      oasIncome: 8000,
      pensionIncome: 0,
      otherIncome: 5000
    })
  })

  it('should handle missing withdrawal data gracefully', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({
          age: 65,
          income: { cpp: 15000, oas: 8000, pension: 0, other: 0, total: 23000 },
          withdrawals: { rrsp_rrif: undefined, tfsa: undefined, non_registered: undefined }
        })
      ]
    })

    const incomeData = formatIncomeData(results)

    expect(incomeData[0]).toEqual({
      age: 65,
      rrspIncome: 0,
      tfsaIncome: 0,
      cppIncome: 15000,
      oasIncome: 8000,
      pensionIncome: 0,
      otherIncome: 0
    })
  })

  it('should handle zero income sources', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({
          age: 60,
          income: { cpp: 0, oas: 0, pension: 0, other: 0, total: 0 },
          withdrawals: { rrsp_rrif: 0, tfsa: 0, non_registered: 0 }
        })
      ]
    })

    const incomeData = formatIncomeData(results)

    expect(incomeData[0]).toEqual({
      age: 60,
      rrspIncome: 0,
      tfsaIncome: 0,
      cppIncome: 0,
      oasIncome: 0,
      pensionIncome: 0,
      otherIncome: 0
    })
  })
})

describe('formatTaxSummary', () => {
  it('should calculate tax summary metrics correctly', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({
          age: 65,
          income: { cpp: 15000, oas: 8000, pension: 0, other: 0, total: 23000 },
          tax: { federal: 2000, provincial: 1000, total: 3000 }
        }),
        createYearResult({
          age: 66,
          income: { cpp: 15000, oas: 8000, pension: 0, other: 0, total: 23000 },
          tax: { federal: 2000, provincial: 1000, total: 3000 }
        })
      ],
      total_taxes_paid_in_retirement: 6000,
      average_tax_rate_in_retirement: 0.13
    })

    const taxSummary = formatTaxSummary(results, 65)

    expect(taxSummary.totalTaxPaid).toBe(6000)
    expect(taxSummary.effectiveRate).toBeCloseTo(13.0, 1) // Converted to percentage
    expect(taxSummary.annualEstimate).toBe(3000) // 6000 / 2 years
    expect(taxSummary.grossIncome).toBe(46000) // 23000 * 2
    expect(taxSummary.netIncome).toBe(40000) // 46000 - 6000
  })

  it('should handle single year correctly', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({
          age: 65,
          income: { cpp: 15000, oas: 8000, pension: 0, other: 0, total: 23000 },
          tax: { federal: 2000, provincial: 1000, total: 3000 }
        })
      ],
      total_taxes_paid_in_retirement: 3000,
      average_tax_rate_in_retirement: 0.13
    })

    const taxSummary = formatTaxSummary(results, 65)

    expect(taxSummary.annualEstimate).toBe(3000)
  })

  it('should handle zero tax scenario', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({
          age: 65,
          income: { cpp: 5000, oas: 0, pension: 0, other: 0, total: 5000 },
          tax: { federal: 0, provincial: 0, total: 0 }
        })
      ],
      total_taxes_paid_in_retirement: 0,
      average_tax_rate_in_retirement: 0
    })

    const taxSummary = formatTaxSummary(results, 65)

    expect(taxSummary.totalTaxPaid).toBe(0)
    expect(taxSummary.effectiveRate).toBe(0)
    expect(taxSummary.netIncome).toBe(5000)
  })

  it('should calculate effective rate as percentage', () => {
    // Create year with 25.6% effective rate: $5,888 tax on $23,000 income
    const results = createCalculationResults({
      year_by_year: [createYearResult({
        age: 65,
        tax: { federal: 4000, provincial: 1888, total: 5888 }
      })],
      average_tax_rate_in_retirement: 0.256
    })

    const taxSummary = formatTaxSummary(results, 65)

    expect(taxSummary.effectiveRate).toBeCloseTo(25.6, 1)
  })
})

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format currency with default zero decimals', () => {
      expect(formatCurrency(5000)).toBe('$5,000')
      expect(formatCurrency(1234567)).toBe('$1,234,567')
    })

    it('should format currency with specified decimals', () => {
      expect(formatCurrency(5000.50, 2)).toBe('$5,000.50')
      expect(formatCurrency(1234.567, 2)).toBe('$1,234.57')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-500)).toContain('-')
      expect(formatCurrency(-500)).toContain('500')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage with default 1 decimal', () => {
      expect(formatPercentage(12.5)).toBe('12.5%')
      expect(formatPercentage(100)).toBe('100.0%')
    })

    it('should format percentage with specified decimals', () => {
      expect(formatPercentage(12.567, 2)).toBe('12.57%')
      expect(formatPercentage(12.567, 0)).toBe('13%')
    })

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.0%')
    })

    it('should handle very small percentages', () => {
      expect(formatPercentage(0.05, 2)).toBe('0.05%')
    })
  })

  describe('formatCompactCurrency', () => {
    it('should format millions with M suffix', () => {
      expect(formatCompactCurrency(1000000)).toBe('$1.0M')
      expect(formatCompactCurrency(2500000)).toBe('$2.5M')
      expect(formatCompactCurrency(10000000)).toBe('$10.0M')
    })

    it('should format thousands with K suffix', () => {
      expect(formatCompactCurrency(1000)).toBe('$1K')
      expect(formatCompactCurrency(5500)).toBe('$6K')
      expect(formatCompactCurrency(999999)).toBe('$1000K')
    })

    it('should format amounts under 1000 normally', () => {
      expect(formatCompactCurrency(500)).toBe('$500')
      expect(formatCompactCurrency(99)).toBe('$99')
    })

    it('should handle zero', () => {
      expect(formatCompactCurrency(0)).toBe('$0')
    })

    it('should round thousands appropriately', () => {
      expect(formatCompactCurrency(1499)).toBe('$1K')
      expect(formatCompactCurrency(1500)).toBe('$2K')
    })
  })
})

describe('Edge Cases and Error Handling', () => {
  it('should handle empty year_by_year array gracefully', () => {
    const results = createCalculationResults({
      year_by_year: []
    })

    expect(() => formatBalanceData(results)).not.toThrow()
    expect(() => formatIncomeData(results)).not.toThrow()

    const balanceData = formatBalanceData(results)
    const incomeData = formatIncomeData(results)

    expect(balanceData).toEqual([])
    expect(incomeData).toEqual([])
  })

  it('should handle very large numbers', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({
          age: 65,
          balances: { rrsp_rrif: 50000000, tfsa: 50000000, non_registered: 50000000, total: 150000000 },
          income: { cpp: 15000, oas: 8000, pension: 1000000, other: 2000000, total: 3023000 }
        })
      ],
      final_portfolio_value: 150000000
    })

    const summary = formatSummary(results, 65)
    const balanceData = formatBalanceData(results)

    expect(summary.totalAssets).toBe(150000000)
    expect(balanceData[0].balance).toBe(150000000)
    expect(formatCompactCurrency(150000000)).toBe('$150.0M')
  })

  it('should handle very small numbers', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({
          age: 65,
          balances: { rrsp_rrif: 100, tfsa: 50, non_registered: 50, total: 200 },
          income: { cpp: 100, oas: 50, pension: 0, other: 0, total: 150 },
          tax: { federal: 0, provincial: 0, total: 0 }
        })
      ],
      final_portfolio_value: 200
    })

    const summary = formatSummary(results, 65)

    expect(summary.totalAssets).toBe(200)
    // With very small income (150) and zero tax, monthly after-tax should be positive
    expect(summary.monthlyAfterTaxIncome).toBeCloseTo(12.5, 1) // 150/12 = 12.5
  })

  it('should handle scenario with all zeros', () => {
    const results = createCalculationResults({
      year_by_year: [
        createYearResult({
          age: 65,
          balances: { rrsp_rrif: 0, tfsa: 0, non_registered: 0, total: 0 },
          income: { cpp: 0, oas: 0, pension: 0, other: 0, total: 0 },
          tax: { federal: 0, provincial: 0, total: 0 },
          withdrawals: { rrsp_rrif: 0, tfsa: 0, non_registered: 0 }
        })
      ],
      total_taxes_paid_in_retirement: 0,
      average_tax_rate_in_retirement: 0,
      final_portfolio_value: 0
    })

    const summary = formatSummary(results, 65)
    const taxSummary = formatTaxSummary(results, 65)
    const incomeData = formatIncomeData(results)

    expect(summary.totalAssets).toBe(0)
    expect(summary.monthlyAfterTaxIncome).toBe(0)
    expect(taxSummary.totalTaxPaid).toBe(0)
    expect(taxSummary.effectiveRate).toBe(0)
    expect(incomeData[0].rrspIncome).toBe(0)
  })
})
