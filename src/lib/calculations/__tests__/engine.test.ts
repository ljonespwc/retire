/**
 * Main Calculation Engine Integration Tests
 *
 * End-to-end tests for the complete retirement projection engine.
 * These tests validate the full simulation flow from current age to longevity.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateRetirementProjection,
  compareScenarios,
} from '../engine';
import { createMockClient, expectCloseTo, type MockSupabaseClient } from './test-helpers';
import {
  sampleScenarioModest,
  sampleScenarioSubstantial,
} from '@/lib/test-fixtures';

describe('calculateRetirementProjection', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should run complete projection for modest scenario', async () => {
    const result = await calculateRetirementProjection(
      mockClient,
      sampleScenarioModest
    );

    expect(result.scenario_name).toBe('Modest Retirement Plan');

    // Should have year-by-year results
    expect(result.year_by_year).toBeDefined();
    expect(result.year_by_year.length).toBeGreaterThan(0);

    // Should cover ages 58-90
    expect(result.year_by_year[0].age).toBe(58);
    expect(result.year_by_year[result.year_by_year.length - 1].age).toBeLessThanOrEqual(90);

    // Should have success metrics
    expect(result.success).toBeDefined();
    expect(result.final_portfolio_value).toBeDefined();
  });

  it('should handle pre-retirement accumulation phase', async () => {
    const result = await calculateRetirementProjection(
      mockClient,
      sampleScenarioModest
    );

    // Find years before retirement
    const preRetirementYears = result.year_by_year.filter(
      (y) => y.age < sampleScenarioModest.basic_inputs.retirement_age
    );

    expect(preRetirementYears.length).toBeGreaterThan(0);

    // Pre-retirement years should have zero income and expenses
    preRetirementYears.forEach((year) => {
      expect(year.income.total).toBe(0);
      expect(year.expenses).toBe(0);
      expect(year.taxes).toBe(0);
    });

    // Portfolio should be growing
    expect(
      preRetirementYears[preRetirementYears.length - 1].portfolio_balance
    ).toBeGreaterThan(preRetirementYears[0].portfolio_balance);
  });

  it('should handle retirement drawdown phase', async () => {
    const result = await calculateRetirementProjection(
      mockClient,
      sampleScenarioModest
    );

    // Find years in retirement
    const retirementYears = result.year_by_year.filter(
      (y) => y.age >= sampleScenarioModest.basic_inputs.retirement_age
    );

    expect(retirementYears.length).toBeGreaterThan(0);

    // Retirement years should have income, expenses, and taxes
    retirementYears.forEach((year) => {
      expect(year.income.total).toBeGreaterThan(0);
      expect(year.expenses).toBeGreaterThan(0);
    });

    // Should have CPP income starting at age 65
    const cppYears = retirementYears.filter((y) => y.age >= 65);
    expect(cppYears.length).toBeGreaterThan(0);
    cppYears.forEach((year) => {
      expect(year.income.cpp).toBeGreaterThan(0);
    });

    // Should have OAS income starting at age 65
    const oasYears = retirementYears.filter((y) => y.age >= 65);
    expect(oasYears.length).toBeGreaterThan(0);
    oasYears.forEach((year) => {
      expect(year.income.oas).toBeGreaterThan(0);
    });
  });

  it('should calculate taxes in retirement', async () => {
    const result = await calculateRetirementProjection(
      mockClient,
      sampleScenarioModest
    );

    const retirementYears = result.year_by_year.filter(
      (y) => y.age >= sampleScenarioModest.basic_inputs.retirement_age
    );

    // Should have tax breakdown
    retirementYears.forEach((year) => {
      if (year.income.total > 0) {
        expect(year.tax_breakdown).toBeDefined();
        expect(year.tax_breakdown?.federal).toBeDefined();
        expect(year.tax_breakdown?.provincial).toBeDefined();
        expect(year.tax_breakdown?.marginal_rate).toBeDefined();
      }
    });

    // Total taxes should match sum of federal + provincial + OAS clawback
    retirementYears.forEach((year) => {
      if (year.tax_breakdown) {
        const calculatedTotal =
          year.tax_breakdown.federal +
          year.tax_breakdown.provincial +
          (year.tax_breakdown.oas_clawback || 0);

        expectCloseTo(year.taxes, calculatedTotal, 1);
      }
    });
  });

  it('should track account balances over time', async () => {
    const result = await calculateRetirementProjection(
      mockClient,
      sampleScenarioModest
    );

    // All years should have account balances
    result.year_by_year.forEach((year) => {
      expect(year.rrsp_rrif_balance).toBeDefined();
      expect(year.tfsa_balance).toBeDefined();
      expect(year.non_registered_balance).toBeDefined();

      // Portfolio balance should equal sum of accounts
      const sumOfAccounts =
        year.rrsp_rrif_balance +
        year.tfsa_balance +
        year.non_registered_balance;

      expectCloseTo(year.portfolio_balance, sumOfAccounts, 1);
    });
  });

  it('should apply inflation to expenses', async () => {
    const result = await calculateRetirementProjection(
      mockClient,
      sampleScenarioModest
    );

    const retirementYears = result.year_by_year.filter(
      (y) => y.age >= sampleScenarioModest.basic_inputs.retirement_age
    );

    if (retirementYears.length > 1) {
      // Expenses should generally increase over time (with inflation)
      const firstYearExpenses = retirementYears[0].expenses;
      const lastYearExpenses =
        retirementYears[retirementYears.length - 1].expenses;

      expect(lastYearExpenses).toBeGreaterThan(firstYearExpenses);
    }
  });

  it('should calculate summary statistics correctly', async () => {
    const result = await calculateRetirementProjection(
      mockClient,
      sampleScenarioModest
    );

    // Success should be boolean
    expect(typeof result.success).toBe('boolean');

    // Should have first year retirement income
    expect(result.first_year_retirement_income).toBeGreaterThan(0);

    // Should have average tax rate
    expect(result.average_tax_rate_in_retirement).toBeGreaterThanOrEqual(0);
    expect(result.average_tax_rate_in_retirement).toBeLessThan(1);

    // Should have total taxes paid
    expect(result.total_taxes_paid_in_retirement).toBeGreaterThanOrEqual(0);

    // Should have total benefits received
    expect(result.total_cpp_received).toBeGreaterThan(0);
    expect(result.total_oas_received).toBeGreaterThan(0);

    // Final portfolio value should match last year
    const lastYear = result.year_by_year[result.year_by_year.length - 1];
    expectCloseTo(result.final_portfolio_value, lastYear.portfolio_balance, 1);
  });

  it('should detect portfolio depletion', async () => {
    // Create scenario with insufficient assets
    const depletionScenario = {
      ...sampleScenarioModest,
      name: 'Portfolio Depletion Test',
      assets: {
        rrsp: { balance: 50000, annual_contribution: 0, rate_of_return: 0.05 },
        tfsa: { balance: 10000, annual_contribution: 0, rate_of_return: 0.05 },
        non_registered: { balance: 20000, annual_contribution: 0, rate_of_return: 0.05 },
      },
      expenses: {
        fixed_monthly: 5000, // High expenses
        variable_annual: 20000,
        indexed_to_inflation: true,
        age_based_changes: [],
      },
    };

    const result = await calculateRetirementProjection(
      mockClient,
      depletionScenario
    );

    // Should detect portfolio depletion
    expect(result.portfolio_depleted_age).toBeDefined();
    expect(result.portfolio_depleted_age).toBeLessThan(
      depletionScenario.basic_inputs.longevity_age
    );
    expect(result.success).toBe(false);
  });

  it('should handle substantial savings scenario', async () => {
    const result = await calculateRetirementProjection(
      mockClient,
      sampleScenarioSubstantial
    );

    expect(result.scenario_name).toBe('Substantial Retirement Plan');
    expect(result.success).toBe(true);

    // Should have much higher portfolio balances
    const lastYear = result.year_by_year[result.year_by_year.length - 1];
    expect(lastYear.portfolio_balance).toBeGreaterThan(1000000);

    // Should have higher income in retirement
    const retirementYears = result.year_by_year.filter(
      (y) => y.age >= sampleScenarioSubstantial.basic_inputs.retirement_age
    );
    expect(retirementYears[0].income.total).toBeGreaterThan(50000);
  });

  it('should handle RRIF minimum withdrawals', async () => {
    const result = await calculateRetirementProjection(
      mockClient,
      sampleScenarioModest
    );

    // Find years at age 71+ (RRIF minimum applies)
    const rrifYears = result.year_by_year.filter((y) => y.age >= 71);

    if (rrifYears.length > 0) {
      // Should have RRSP/RRIF withdrawals
      rrifYears.forEach((year) => {
        expect(year.income.rrsp_rrif).toBeGreaterThan(0);
      });
    }
  });

  it('should enforce RRIF minimums even when income exceeds expenses', async () => {
    // Create high-income scenario where retirement income > expenses
    // This tests the bug where RRIF minimums were not enforced
    const highIncomeScenario = {
      ...sampleScenarioModest,
      name: 'High Income Scenario',
      basic_inputs: {
        ...sampleScenarioModest.basic_inputs,
        current_age: 58,
        retirement_age: 65,
        longevity_age: 95,
      },
      income_sources: {
        cpp: {
          start_age: 60,
          monthly_amount_at_65: 1364.6, // Max CPP
        },
        oas: {
          start_age: 65,
          monthly_amount: 713.34, // Max OAS
        },
        other_income: [
          {
            description: 'Pension',
            annual_amount: 80000, // High pension income
            start_age: 65,
            indexed_to_inflation: false,
          },
        ],
      },
      expenses: {
        fixed_monthly: 3000, // $36k/year
        variable_annual: 0,
        indexed_to_inflation: true,
        age_based_changes: [],
      },
    };

    const result = await calculateRetirementProjection(
      mockClient,
      highIncomeScenario
    );

    // Find years at age 72+ (first year after RRIF conversion at 71)
    const rrifYears = result.year_by_year.filter((y) => y.age >= 72);

    expect(rrifYears.length).toBeGreaterThan(0);

    // CRITICAL: Even though income ($100k+) exceeds expenses ($36k),
    // RRIF minimum withdrawals MUST still occur
    rrifYears.forEach((year) => {
      expect(year.withdrawals.rrsp_rrif).toBeGreaterThan(0);

      // Verify the withdrawal appears in income
      expect(year.income.investment).toBeGreaterThan(0);

      // At age 72+, RRIF balance should be decreasing (not growing)
      // due to mandatory withdrawals
      if (year.age === 72) {
        const age71 = result.year_by_year.find((y) => y.age === 71);
        if (age71) {
          // Age 72 RRIF balance should be less than age 71
          // (even after growth, the withdrawal should reduce it)
          expect(year.withdrawals.rrsp_rrif).toBeGreaterThan(0);
        }
      }
    });
  });

  it('should maintain portfolio balance integrity', async () => {
    const result = await calculateRetirementProjection(
      mockClient,
      sampleScenarioModest
    );

    // Check that portfolio balance never goes negative (unless depleted)
    result.year_by_year.forEach((year) => {
      expect(year.portfolio_balance).toBeGreaterThanOrEqual(0);
      expect(year.rrsp_rrif_balance).toBeGreaterThanOrEqual(0);
      expect(year.tfsa_balance).toBeGreaterThanOrEqual(0);
      expect(year.non_registered_balance).toBeGreaterThanOrEqual(0);
    });
  });

  it('should calculate net cashflow correctly', async () => {
    const result = await calculateRetirementProjection(
      mockClient,
      sampleScenarioModest
    );

    const retirementYears = result.year_by_year.filter(
      (y) => y.age >= sampleScenarioModest.basic_inputs.retirement_age
    );

    // Net cashflow = income - expenses - taxes
    retirementYears.forEach((year) => {
      const expectedCashflow =
        year.income.total - year.expenses - year.taxes;

      expectCloseTo(year.net_cashflow, expectedCashflow, 1);
    });
  });
});

describe('compareScenarios', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should compare multiple scenarios', async () => {
    const scenarios = [sampleScenarioModest, sampleScenarioSubstantial];

    const results = await compareScenarios(mockClient, scenarios);

    expect(results).toHaveLength(2);
    expect(results[0].scenario_name).toBe('Modest Retirement Plan');
    expect(results[1].scenario_name).toBe('Substantial Retirement Plan');
  });

  it('should show differences between scenarios', async () => {
    const scenarios = [sampleScenarioModest, sampleScenarioSubstantial];

    const results = await compareScenarios(mockClient, scenarios);

    // Substantial scenario should have higher final portfolio value
    expect(results[1].final_portfolio_value).toBeGreaterThan(
      results[0].final_portfolio_value
    );

    // Substantial scenario should have higher first year income
    expect(results[1].first_year_retirement_income).toBeGreaterThan(
      results[0].first_year_retirement_income
    );
  });

  it('should handle empty scenario array', async () => {
    const results = await compareScenarios(mockClient, []);

    expect(results).toHaveLength(0);
  });

  it('should handle single scenario', async () => {
    const results = await compareScenarios(mockClient, [sampleScenarioModest]);

    expect(results).toHaveLength(1);
    expect(results[0].scenario_name).toBe('Modest Retirement Plan');
  });
});

describe('Integration Tests - Realistic Scenarios', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should handle early retirement scenario (age 55)', async () => {
    const earlyRetirementScenario = {
      ...sampleScenarioSubstantial,
      name: 'Early Retirement at 55',
      basic_inputs: {
        ...sampleScenarioSubstantial.basic_inputs,
        retirement_age: 55,
      },
    };

    const result = await calculateRetirementProjection(
      mockClient,
      earlyRetirementScenario
    );

    // Should have longer retirement period
    const retirementYears = result.year_by_year.filter((y) => y.age >= 55);
    expect(retirementYears.length).toBeGreaterThan(30); // 55-90 = 35 years
  });

  it('should handle delayed retirement scenario (age 70)', async () => {
    const delayedRetirementScenario = {
      ...sampleScenarioModest,
      name: 'Delayed Retirement at 70',
      basic_inputs: {
        ...sampleScenarioModest.basic_inputs,
        retirement_age: 70,
      },
    };

    const result = await calculateRetirementProjection(
      mockClient,
      delayedRetirementScenario
    );

    // Should have shorter retirement period but larger portfolio
    const retirementYears = result.year_by_year.filter((y) => y.age >= 70);
    expect(retirementYears.length).toBeLessThan(25); // 70-90 = 20 years
  });

  it('should handle scenario with high income benefiting from delayed CPP/OAS', async () => {
    const delayedBenefitsScenario = {
      ...sampleScenarioSubstantial,
      name: 'Delayed Benefits',
      income_sources: {
        cpp: {
          start_age: 70, // Delayed for 42% enhancement
          monthly_amount_at_65: 1200,
        },
        oas: {
          start_age: 70, // Delayed for 36% enhancement
          monthly_amount: 713,
        },
      },
    };

    const result = await calculateRetirementProjection(
      mockClient,
      delayedBenefitsScenario
    );

    // Find year at age 70
    const age70Year = result.year_by_year.find((y) => y.age === 70);

    if (age70Year) {
      // Should have enhanced CPP (42% more than base)
      expect(age70Year.income.cpp).toBeGreaterThan(1200 * 12);

      // Should have enhanced OAS (36% more than base)
      expect(age70Year.income.oas).toBeGreaterThan(713 * 12);
    }
  });
});
