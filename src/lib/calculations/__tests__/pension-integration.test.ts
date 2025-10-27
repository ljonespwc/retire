/**
 * Pension Integration Tests
 *
 * Verifies that private pensions (other_income) are properly integrated
 * into retirement calculations, including:
 * - Income inclusion in year-by-year results
 * - Tax calculations on pension income
 * - Inflation indexing
 * - Withdrawal reduction (pension reduces need to withdraw from portfolio)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateRetirementProjection } from '../engine';
import { createMockClient, type MockSupabaseClient } from './test-helpers';
import type { Scenario } from '@/types/calculator';
import { Province } from '@/types/constants';

describe('Pension Integration', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });
  it('should include pension income in retirement years', async () => {
    const scenario: Scenario = {
      name: 'Pension Test',
      basic_inputs: {
        current_age: 60,
        retirement_age: 65,
        longevity_age: 75,
        province: Province.ON,
      },
      assets: {
        rrsp: {
          balance: 500000,
          rate_of_return: 0.06,
        },
      },
      income_sources: {
        other_income: [
          {
            description: 'Company Pension',
            annual_amount: 30000,
            start_age: 65,
            indexed_to_inflation: true,
          },
        ],
      },
      expenses: {
        fixed_monthly: 4000,
        indexed_to_inflation: true,
      },
      assumptions: {
        pre_retirement_return: 0.06,
        post_retirement_return: 0.04,
        inflation_rate: 0.02,
      },
    };

    const results = await calculateRetirementProjection(mockClient, scenario);

    // Find first retirement year (age 65)
    const firstRetirementYear = results.year_by_year.find((y) => y.age === 65);

    expect(firstRetirementYear).toBeDefined();
    expect(firstRetirementYear!.income.other).toBe(30000);
    expect(firstRetirementYear!.income.total).toBeGreaterThan(30000); // Should include pension + withdrawals
  });

  it('should apply inflation indexing to pension income', async () => {
    const scenario: Scenario = {
      name: 'Pension Inflation Test',
      basic_inputs: {
        current_age: 60,
        retirement_age: 65,
        longevity_age: 75,
        province: Province.ON,
      },
      assets: {
        rrsp: {
          balance: 500000,
          rate_of_return: 0.06,
        },
      },
      income_sources: {
        other_income: [
          {
            description: 'Indexed Pension',
            annual_amount: 30000,
            start_age: 65,
            indexed_to_inflation: true,
          },
        ],
      },
      expenses: {
        fixed_monthly: 4000,
        indexed_to_inflation: true,
      },
      assumptions: {
        pre_retirement_return: 0.06,
        post_retirement_return: 0.04,
        inflation_rate: 0.02,
      },
    };

    const results = await calculateRetirementProjection(mockClient, scenario);

    const year1 = results.year_by_year.find((y) => y.age === 65)!;
    const year5 = results.year_by_year.find((y) => y.age === 69)!;

    // After 4 years of 2% inflation: 30000 * 1.02^4 = 32,472.96
    expect(year1.income.other).toBeCloseTo(30000, 0);
    expect(year5.income.other).toBeCloseTo(32472.96, 0);
  });

  it('should NOT apply inflation to non-indexed pension', async () => {
    const scenario: Scenario = {
      name: 'Non-Indexed Pension Test',
      basic_inputs: {
        current_age: 60,
        retirement_age: 65,
        longevity_age: 75,
        province: Province.ON,
      },
      assets: {
        rrsp: {
          balance: 500000,
          rate_of_return: 0.06,
        },
      },
      income_sources: {
        other_income: [
          {
            description: 'Fixed Pension',
            annual_amount: 30000,
            start_age: 65,
            indexed_to_inflation: false,
          },
        ],
      },
      expenses: {
        fixed_monthly: 4000,
        indexed_to_inflation: true,
      },
      assumptions: {
        pre_retirement_return: 0.06,
        post_retirement_return: 0.04,
        inflation_rate: 0.02,
      },
    };

    const results = await calculateRetirementProjection(mockClient, scenario);

    const year1 = results.year_by_year.find((y) => y.age === 65)!;
    const year5 = results.year_by_year.find((y) => y.age === 69)!;

    // Should remain constant (no inflation)
    expect(year1.income.other).toBe(30000);
    expect(year5.income.other).toBe(30000);
  });

  it('should reduce portfolio withdrawals when pension covers expenses', async () => {
    // Scenario 1: No pension (baseline)
    const scenarioNoPension: Scenario = {
      name: 'No Pension',
      basic_inputs: {
        current_age: 60,
        retirement_age: 65,
        longevity_age: 75,
        province: Province.ON,
      },
      assets: {
        rrsp: {
          balance: 500000,
          rate_of_return: 0.06,
        },
      },
      income_sources: {},
      expenses: {
        fixed_monthly: 4000, // $48,000/year
        indexed_to_inflation: false,
      },
      assumptions: {
        pre_retirement_return: 0.06,
        post_retirement_return: 0.04,
        inflation_rate: 0.02,
      },
    };

    // Scenario 2: With pension
    const scenarioWithPension: Scenario = {
      ...scenarioNoPension,
      name: 'With Pension',
      income_sources: {
        other_income: [
          {
            description: 'Pension',
            annual_amount: 30000, // Covers $30k of $48k expenses
            start_age: 65,
            indexed_to_inflation: false,
          },
        ],
      },
    };

    const resultsNoPension = await calculateRetirementProjection(mockClient, scenarioNoPension);
    const resultsWithPension = await calculateRetirementProjection(mockClient, scenarioWithPension);

    const year1NoPension = resultsNoPension.year_by_year.find((y) => y.age === 65)!;
    const year1WithPension = resultsWithPension.year_by_year.find((y) => y.age === 65)!;

    // With pension, withdrawals should be roughly $18k less (48k - 30k)
    const withdrawalReduction = year1NoPension.withdrawals.total - year1WithPension.withdrawals.total;

    // Account for taxes - pension income is taxed, so withdrawal reduction won't be exactly $30k
    // But should be significantly less
    expect(withdrawalReduction).toBeGreaterThan(15000);
    expect(withdrawalReduction).toBeLessThan(35000);
  });

  it('should include pension income in taxable income', async () => {
    const scenario: Scenario = {
      name: 'Pension Tax Test',
      basic_inputs: {
        current_age: 60,
        retirement_age: 65,
        longevity_age: 75,
        province: Province.ON,
      },
      assets: {
        rrsp: {
          balance: 500000,
          rate_of_return: 0.06,
        },
      },
      income_sources: {
        other_income: [
          {
            description: 'Taxable Pension',
            annual_amount: 40000,
            start_age: 65,
            indexed_to_inflation: false,
          },
        ],
      },
      expenses: {
        fixed_monthly: 4000,
        indexed_to_inflation: false,
      },
      assumptions: {
        pre_retirement_return: 0.06,
        post_retirement_return: 0.04,
        inflation_rate: 0.02,
      },
    };

    const results = await calculateRetirementProjection(mockClient, scenario);

    const firstYear = results.year_by_year.find((y) => y.age === 65)!;

    // Tax should be greater than 0 (pension is taxable)
    expect(firstYear.tax.total).toBeGreaterThan(0);

    // Income.other should match pension amount
    expect(firstYear.income.other).toBe(40000);
  });

  it('should handle multiple other income sources', async () => {
    const scenario: Scenario = {
      name: 'Multiple Income Sources',
      basic_inputs: {
        current_age: 60,
        retirement_age: 65,
        longevity_age: 75,
        province: Province.ON,
      },
      assets: {
        rrsp: {
          balance: 500000,
          rate_of_return: 0.06,
        },
      },
      income_sources: {
        other_income: [
          {
            description: 'Company Pension',
            annual_amount: 30000,
            start_age: 65,
            indexed_to_inflation: true,
          },
          {
            description: 'Rental Income',
            annual_amount: 12000,
            start_age: 65,
            indexed_to_inflation: false,
          },
        ],
      },
      expenses: {
        fixed_monthly: 4000,
        indexed_to_inflation: false,
      },
      assumptions: {
        pre_retirement_return: 0.06,
        post_retirement_return: 0.04,
        inflation_rate: 0.02,
      },
    };

    const results = await calculateRetirementProjection(mockClient, scenario);

    const firstYear = results.year_by_year.find((y) => y.age === 65)!;

    // Should sum both income sources
    expect(firstYear.income.other).toBe(42000); // 30000 + 12000
  });
});
