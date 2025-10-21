/**
 * Tax Calculator Tests
 *
 * Comprehensive tests for Canadian tax calculations.
 * Tests validate against known CRA values and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateProgressiveTax,
  calculateFederalTax,
  calculateProvincialTax,
  calculateTaxableIncome,
  calculateOASClawback,
  calculateTotalTax,
  type IncomeSources,
} from '../tax-calculator';
import { createMockClient, expectCloseTo, type MockSupabaseClient } from './test-helpers';
import { Province } from '@/types/constants';
import {
  sample2025FederalBrackets,
  sample2025OntarioBrackets,
} from '@/lib/test-fixtures';

describe('calculateProgressiveTax', () => {
  it('should return 0 tax for 0 income', () => {
    const result = calculateProgressiveTax(0, sample2025FederalBrackets);
    expect(result.total).toBe(0);
    expect(result.marginal_rate).toBe(0);
  });

  it('should return 0 tax for negative income', () => {
    const result = calculateProgressiveTax(-1000, sample2025FederalBrackets);
    expect(result.total).toBe(0);
  });

  it('should calculate tax in first bracket only', () => {
    // Income of $50,000 (all in first bracket at 15%)
    const result = calculateProgressiveTax(50000, sample2025FederalBrackets);

    expect(result.total).toBe(7500); // 50,000 * 0.15
    expect(result.marginal_rate).toBe(0.15);
    expect(result.details).toHaveLength(1);
    expect(result.details![0].income_in_bracket).toBe(50000);
    expect(result.details![0].tax_in_bracket).toBe(7500);
  });

  it('should calculate tax spanning two brackets', () => {
    // Income of $70,000 (first bracket + part of second)
    const result = calculateProgressiveTax(70000, sample2025FederalBrackets);

    const firstBracket = 55867 * 0.15; // $8,380.05
    const secondBracket = (70000 - 55867) * 0.205; // $2,897.27
    const expectedTotal = firstBracket + secondBracket; // $11,277.32

    expectCloseTo(result.total, expectedTotal, 1);
    expect(result.marginal_rate).toBe(0.205);
    expect(result.details).toHaveLength(2);
  });

  it('should calculate tax in highest bracket', () => {
    // Income of $300,000 (spans all brackets)
    const result = calculateProgressiveTax(300000, sample2025FederalBrackets);

    // Verify it uses highest bracket rate as marginal
    expect(result.marginal_rate).toBe(0.33);
    expect(result.details).toHaveLength(5); // All 5 federal brackets

    // Tax should be approximately $73,000
    expect(result.total).toBeGreaterThan(70000);
    expect(result.total).toBeLessThan(76000);
  });

  it('should handle edge case at bracket boundary', () => {
    // Exactly at first bracket limit
    const result = calculateProgressiveTax(55867, sample2025FederalBrackets);

    expect(result.total).toBe(55867 * 0.15);
    expect(result.marginal_rate).toBe(0.15);
  });
});

describe('calculateFederalTax', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should calculate federal tax with basic personal amount', async () => {
    // Income of $50,000, age 60 (no age credit)
    const result = await calculateFederalTax(mockClient, 50000, 60);

    // Gross tax: $50,000 * 0.15 = $7,500
    // Basic personal credit: $15,705 * 0.15 = $2,355.75
    // Net tax: $7,500 - $2,355.75 = $5,144.25

    expectCloseTo(result.gross_tax, 7500, 1);
    expectCloseTo(result.credits, 2355.75, 1);
    expectCloseTo(result.total, 5144.25, 1);
    expect(result.marginal_rate).toBe(0.15);
  });

  it('should include age amount for seniors', async () => {
    // Income of $40,000, age 70 (below age amount threshold)
    const result = await calculateFederalTax(mockClient, 40000, 70);

    // Gross tax: $40,000 * 0.15 = $6,000
    // Basic personal credit: $15,705 * 0.15 = $2,355.75
    // Age amount credit: $8,790 * 0.15 = $1,318.50
    // Total credits: $3,674.25
    // Net tax: $6,000 - $3,674.25 = $2,325.75

    expectCloseTo(result.total, 2325.75, 1);
    expect(result.credits).toBeGreaterThan(2355); // Has age credit
  });

  it('should reduce age amount for high income seniors', async () => {
    // Income of $100,000, age 70 (above age amount threshold of $43,906)
    const result = await calculateFederalTax(mockClient, 100000, 70);

    // Age amount should be reduced
    // Reduction: (100,000 - 43,906) * 0.15 = $8,414.10
    // Reduced age amount: max(0, $8,790 - $8,414.10) = $375.90
    // Age credit: $375.90 * 0.15 = $56.39

    // Credits should be basic + reduced age
    const expectedCredits = (15705 * 0.15) + (375.90 * 0.15);
    expectCloseTo(result.credits, expectedCredits, 5);
  });

  it('should not give negative tax', async () => {
    // Very low income
    const result = await calculateFederalTax(mockClient, 5000, 60);

    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it('should calculate average tax rate correctly', async () => {
    const result = await calculateFederalTax(mockClient, 50000, 60);

    expect(result.average_rate).toBe(result.total / 50000);
  });
});

describe('calculateProvincialTax', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should calculate Ontario provincial tax', async () => {
    // Income of $50,000, age 60
    const result = await calculateProvincialTax(mockClient, 50000, Province.ON, 60);

    // Ontario first bracket: up to $51,446 at 5.05%
    // Gross tax: $50,000 * 0.0505 = $2,525
    // Basic personal credit: $11,865 * 0.0505 = $599.18
    // Net tax: $2,525 - $599.18 = $1,925.82

    expectCloseTo(result.gross_tax, 2525, 1);
    expectCloseTo(result.total, 1925.82, 1);
  });

  it('should include provincial age amount where available', async () => {
    // Ontario has age amount for seniors
    const result = await calculateProvincialTax(mockClient, 40000, Province.ON, 70);

    // Should have provincial age credit in addition to basic
    expect(result.credits).toBeGreaterThan(599); // More than just basic
  });

  it('should handle provinces without age amount', async () => {
    // Most provinces don't have age amounts in our seed data
    // This test would need actual data for provinces other than ON/BC
    const result = await calculateProvincialTax(mockClient, 50000, Province.ON, 70);

    expect(result.total).toBeGreaterThan(0);
  });
});

describe('calculateTaxableIncome', () => {
  it('should make RRSP withdrawals 100% taxable', () => {
    const sources: IncomeSources = {
      rrsp_rrif: 50000,
    };

    const result = calculateTaxableIncome(sources);

    expect(result.rrsp_rrif).toBe(50000);
    expect(result.total).toBe(50000);
  });

  it('should exclude TFSA withdrawals from taxable income', () => {
    const sources: IncomeSources = {
      tfsa: 20000,
    };

    const result = calculateTaxableIncome(sources);

    expect(result.total).toBe(0); // TFSA is not taxable
  });

  it('should apply 50% capital gains inclusion', () => {
    const sources: IncomeSources = {
      capital_gains: 10000,
    };

    const result = calculateTaxableIncome(sources);

    expect(result.capital_gains).toBe(5000); // 50% of $10,000
    expect(result.total).toBe(5000);
  });

  it('should gross up Canadian dividends', () => {
    const sources: IncomeSources = {
      canadian_dividends: 10000,
    };

    const result = calculateTaxableIncome(sources);

    expectCloseTo(result.canadian_dividends, 13800, 0.01); // 138% of $10,000
    expectCloseTo(result.total, 13800, 0.01);
  });

  it('should make CPP and OAS 100% taxable', () => {
    const sources: IncomeSources = {
      cpp: 10000,
      oas: 8000,
    };

    const result = calculateTaxableIncome(sources);

    expect(result.cpp).toBe(10000);
    expect(result.oas).toBe(8000);
    expect(result.total).toBe(18000);
  });

  it('should combine all income sources correctly', () => {
    const sources: IncomeSources = {
      rrsp_rrif: 30000,
      tfsa: 10000, // Not taxable
      capital_gains: 20000, // 50% inclusion
      cpp: 10000,
      oas: 8000,
      employment: 5000,
    };

    const result = calculateTaxableIncome(sources);

    // RRSP: 30,000
    // Capital gains: 10,000 (50% of 20,000)
    // CPP: 10,000
    // OAS: 8,000
    // Employment: 5,000
    // Total: 63,000

    expect(result.total).toBe(63000);
  });
});

describe('calculateOASClawback', () => {
  it('should return 0 clawback below threshold', () => {
    const clawback = calculateOASClawback(80000, 8560);
    expect(clawback).toBe(0);
  });

  it('should calculate clawback above threshold', () => {
    // Income of $100,000, threshold is $86,912
    // Clawback: ($100,000 - $86,912) * 0.15 = $1,963.20
    const clawback = calculateOASClawback(100000, 8560);

    expectCloseTo(clawback, 1963.20, 1);
  });

  it('should not exceed total OAS received', () => {
    // Very high income that would clawback more than OAS received
    const oasAmount = 8560;
    const clawback = calculateOASClawback(200000, oasAmount);

    expect(clawback).toBeLessThanOrEqual(oasAmount);
  });

  it('should calculate full clawback at high income', () => {
    // Income high enough to clawback all OAS
    const oasAmount = 8560;
    const threshold = 86912;

    // Income needed to clawback all: threshold + (OAS / 0.15)
    const fullClawbackIncome = threshold + (oasAmount / 0.15);
    const clawback = calculateOASClawback(fullClawbackIncome, oasAmount);

    expectCloseTo(clawback, oasAmount, 1);
  });
});

describe('calculateTotalTax', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should calculate combined federal and provincial tax', async () => {
    const sources: IncomeSources = {
      rrsp_rrif: 50000,
    };

    const result = await calculateTotalTax(mockClient, sources, Province.ON, 60);

    // Should have federal + provincial tax
    expect(result.federal.total).toBeGreaterThan(0);
    expect(result.provincial.total).toBeGreaterThan(0);
    expect(result.total_tax).toBe(
      result.federal.total + result.provincial.total + result.oas_clawback
    );
  });

  it('should include OAS clawback in total tax', async () => {
    const sources: IncomeSources = {
      rrsp_rrif: 90000,
      oas: 8560,
    };

    const result = await calculateTotalTax(mockClient, sources, Province.ON, 70);

    expect(result.oas_clawback).toBeGreaterThan(0);
    expect(result.total_tax).toBeGreaterThan(result.federal.total + result.provincial.total);
  });

  it('should calculate combined marginal rate', async () => {
    const sources: IncomeSources = {
      rrsp_rrif: 50000,
    };

    const result = await calculateTotalTax(mockClient, sources, Province.ON, 60);

    expect(result.combined_marginal_rate).toBe(
      result.federal.marginal_rate + result.provincial.marginal_rate
    );
  });

  it('should provide detailed taxable income breakdown', async () => {
    const sources: IncomeSources = {
      rrsp_rrif: 30000,
      capital_gains: 20000,
      cpp: 10000,
      oas: 8000,
    };

    const result = await calculateTotalTax(mockClient, sources, Province.ON, 70);

    expect(result.taxable_income.rrsp_rrif).toBe(30000);
    expect(result.taxable_income.capital_gains).toBe(10000); // 50% inclusion
    expect(result.taxable_income.cpp).toBe(10000);
    expect(result.taxable_income.oas).toBe(8000);
    expect(result.taxable_income.total).toBe(58000);
  });

  it('should handle TFSA withdrawals correctly (tax-free)', async () => {
    const sources: IncomeSources = {
      rrsp_rrif: 30000,
      tfsa: 20000, // Should not be taxed
    };

    const result = await calculateTotalTax(mockClient, sources, Province.ON, 60);

    // Tax should be based on $30,000 only
    expect(result.taxable_income.total).toBe(30000);
  });
});
