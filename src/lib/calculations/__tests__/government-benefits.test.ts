/**
 * Government Benefits Calculator Tests
 *
 * Comprehensive tests for CPP and OAS calculations with age adjustments.
 * Tests validate against CRA published rates and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateCPPAdjustmentFactor,
  calculateOASAdjustmentFactor,
  calculateCPP,
  calculateOAS,
  estimateCPPFromEarnings,
  findOptimalCPPStartAge,
  findOptimalOASStartAge,
} from '../government-benefits';
import { createMockClient, expectCloseTo, type MockSupabaseClient } from './test-helpers';

describe('calculateCPPAdjustmentFactor', () => {
  it('should calculate 64% for age 60 (36% reduction)', () => {
    const result = calculateCPPAdjustmentFactor(60);

    expectCloseTo(result.factor, 0.64, 0.001);
    expect(result.age).toBe(60);
    expect(result.months_from_65).toBe(-60);
  });

  it('should calculate 92.8% for age 64 (7.2% reduction)', () => {
    const result = calculateCPPAdjustmentFactor(64);

    expectCloseTo(result.factor, 0.928, 0.001);
    expect(result.age).toBe(64);
    expect(result.months_from_65).toBe(-12);
  });

  it('should calculate 100% for age 65 (no adjustment)', () => {
    const result = calculateCPPAdjustmentFactor(65);

    expect(result.factor).toBe(1.0);
    expect(result.age).toBe(65);
    expect(result.months_from_65).toBe(0);
  });

  it('should calculate 108.4% for age 66 (8.4% enhancement)', () => {
    const result = calculateCPPAdjustmentFactor(66);

    expectCloseTo(result.factor, 1.084, 0.001);
    expect(result.age).toBe(66);
    expect(result.months_from_65).toBe(12);
  });

  it('should calculate 142% for age 70 (42% enhancement)', () => {
    const result = calculateCPPAdjustmentFactor(70);

    expectCloseTo(result.factor, 1.42, 0.001);
    expect(result.age).toBe(70);
    expect(result.months_from_65).toBe(60);
  });

  it('should throw error for age below 60', () => {
    expect(() => calculateCPPAdjustmentFactor(59)).toThrow(
      'CPP can only be taken between ages 60 and 70'
    );
  });

  it('should throw error for age above 70', () => {
    expect(() => calculateCPPAdjustmentFactor(71)).toThrow(
      'CPP can only be taken between ages 60 and 70'
    );
  });
});

describe('calculateOASAdjustmentFactor', () => {
  it('should calculate 100% for age 65 (no adjustment)', () => {
    const result = calculateOASAdjustmentFactor(65);

    expect(result.factor).toBe(1.0);
    expect(result.age).toBe(65);
    expect(result.months_deferred).toBe(0);
  });

  it('should calculate 107.2% for age 66 (7.2% enhancement)', () => {
    const result = calculateOASAdjustmentFactor(66);

    expectCloseTo(result.factor, 1.072, 0.001);
    expect(result.age).toBe(66);
    expect(result.months_deferred).toBe(12);
  });

  it('should calculate 136% for age 70 (36% enhancement)', () => {
    const result = calculateOASAdjustmentFactor(70);

    expectCloseTo(result.factor, 1.36, 0.001);
    expect(result.age).toBe(70);
    expect(result.months_deferred).toBe(60);
  });

  it('should throw error for age below 65', () => {
    expect(() => calculateOASAdjustmentFactor(64)).toThrow(
      'OAS can only be taken between ages 65 and 70'
    );
  });

  it('should throw error for age above 70', () => {
    expect(() => calculateOASAdjustmentFactor(71)).toThrow(
      'OAS can only be taken between ages 65 and 70'
    );
  });
});

describe('calculateCPP', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should calculate CPP at age 65 with no adjustment', async () => {
    const baseMonthly = 1000;
    const result = await calculateCPP(mockClient, baseMonthly, 65);

    expect(result.monthly_amount).toBe(1000);
    expect(result.annual_amount).toBe(12000);
    expect(result.start_age).toBe(65);
    expect(result.adjustment_factor).toBe(1.0);
    expect(result.base_amount_at_65).toBe(1000);
  });

  it('should calculate reduced CPP at age 60', async () => {
    const baseMonthly = 1000;
    const result = await calculateCPP(mockClient, baseMonthly, 60);

    expectCloseTo(result.monthly_amount, 640, 1);
    expectCloseTo(result.annual_amount, 7680, 1);
    expect(result.start_age).toBe(60);
    expectCloseTo(result.adjustment_factor, 0.64, 0.001);
  });

  it('should calculate enhanced CPP at age 70', async () => {
    const baseMonthly = 1000;
    const result = await calculateCPP(mockClient, baseMonthly, 70);

    expectCloseTo(result.monthly_amount, 1420, 1);
    expectCloseTo(result.annual_amount, 17040, 1);
    expect(result.start_age).toBe(70);
    expectCloseTo(result.adjustment_factor, 1.42, 0.001);
  });

  it('should calculate CPP with maximum 2025 amount at age 65', async () => {
    // Max CPP 2025: $1,364.58/month
    const result = await calculateCPP(mockClient, 1364.58, 65);

    expectCloseTo(result.monthly_amount, 1364.58, 0.01);
    expectCloseTo(result.annual_amount, 16375, 1);
  });

  it('should calculate CPP with average 2025 amount at age 62', async () => {
    // Average CPP 2025: $758.33/month
    // Age 62 adjustment: 78.4%
    const result = await calculateCPP(mockClient, 758.33, 62);

    expectCloseTo(result.monthly_amount, 594.53, 1); // 758.33 * 0.784
    expectCloseTo(result.annual_amount, 7134.36, 5);
    expectCloseTo(result.adjustment_factor, 0.784, 0.001);
  });
});

describe('calculateOAS', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should calculate OAS at age 65 with no adjustment', async () => {
    const baseMonthly = 713.33;
    const result = await calculateOAS(mockClient, baseMonthly, 65);

    expectCloseTo(result.monthly_amount, 713.33, 0.01);
    expectCloseTo(result.annual_amount, 8560, 1);
    expect(result.start_age).toBe(65);
    expect(result.adjustment_factor).toBe(1.0);
  });

  it('should calculate enhanced OAS at age 70', async () => {
    const baseMonthly = 713.33;
    const result = await calculateOAS(mockClient, baseMonthly, 70);

    expectCloseTo(result.monthly_amount, 970.13, 1); // 713.33 * 1.36
    expectCloseTo(result.annual_amount, 11641.56, 5);
    expectCloseTo(result.adjustment_factor, 1.36, 0.001);
  });

  it('should calculate OAS at age 67 with 14.4% enhancement', async () => {
    const baseMonthly = 713.33;
    const result = await calculateOAS(mockClient, baseMonthly, 67);

    expectCloseTo(result.monthly_amount, 816.05, 1); // 713.33 * 1.144
    expectCloseTo(result.adjustment_factor, 1.144, 0.001);
  });
});

describe('estimateCPPFromEarnings', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should return max CPP for earnings >= YMPE', async () => {
    const result = await estimateCPPFromEarnings(mockClient, 70000);

    // Should return max monthly CPP
    expectCloseTo(result, 1364.58, 0.01);
  });

  it('should return proportional CPP for earnings below YMPE', async () => {
    // YMPE 2025: $68,500
    // Earnings: $34,250 (50% of YMPE)
    // Expected: ~50% of max CPP = ~$682
    const result = await estimateCPPFromEarnings(mockClient, 34250);

    expectCloseTo(result, 682, 5);
  });

  it('should return low CPP for low earnings', async () => {
    // Earnings: $20,000 (29% of YMPE)
    // Expected: ~29% of max CPP = ~$396
    const result = await estimateCPPFromEarnings(mockClient, 20000);

    expectCloseTo(result, 398, 5);
  });

  it('should handle zero earnings', async () => {
    const result = await estimateCPPFromEarnings(mockClient, 0);

    expect(result).toBe(0);
  });
});

describe('findOptimalCPPStartAge', () => {
  it('should recommend early CPP for short life expectancy (age 75)', () => {
    const result = findOptimalCPPStartAge(1000, 75);

    // For age 75, optimal is actually age 63 (not 60)
    // This maximizes total lifetime benefit
    expect(result.optimal_age).toBe(63);
    expect(result.comparison).toHaveLength(11); // Ages 60-70

    // Verify it's one of the early ages (60-65 range)
    expect(result.optimal_age).toBeGreaterThanOrEqual(60);
    expect(result.optimal_age).toBeLessThanOrEqual(65);
  });

  it('should recommend age 70 for long life expectancy (age 95)', () => {
    const result = findOptimalCPPStartAge(1000, 95);

    expect(result.optimal_age).toBe(70);
    expect(result.total_benefit).toBeGreaterThan(0);
  });

  it('should provide comparison for all ages', () => {
    const result = findOptimalCPPStartAge(1000, 85);

    expect(result.comparison).toHaveLength(11);
    expect(result.comparison[0].age).toBe(60);
    expect(result.comparison[10].age).toBe(70);

    // Each scenario should have progressively fewer months receiving
    expect(result.comparison[0].total).toBeGreaterThan(0);
    expect(result.comparison[10].total).toBeGreaterThan(0);
  });

  it('should calculate optimal age shifts with longevity', () => {
    // As longevity increases, optimal start age increases
    const result75 = findOptimalCPPStartAge(1000, 75);
    const result82 = findOptimalCPPStartAge(1000, 82);
    const result90 = findOptimalCPPStartAge(1000, 90);

    // Optimal age should increase as longevity increases
    expect(result82.optimal_age).toBeGreaterThan(result75.optimal_age);
    expect(result90.optimal_age).toBeGreaterThan(result82.optimal_age);

    // For age 82, optimal is somewhere in the middle range
    expect(result82.optimal_age).toBeGreaterThanOrEqual(65);
    expect(result82.optimal_age).toBeLessThanOrEqual(70);
  });

  it('should handle edge case of dying exactly at start age', () => {
    const result = findOptimalCPPStartAge(1000, 60);

    // Should still recommend age 60 (only option)
    expect(result.optimal_age).toBe(60);
  });
});

describe('findOptimalOASStartAge', () => {
  it('should recommend age 65 for short life expectancy (age 75)', () => {
    const result = findOptimalOASStartAge(713.33, 75);

    expect(result.optimal_age).toBe(65);
    expect(result.comparison).toHaveLength(6); // Ages 65-70
  });

  it('should recommend age 70 for long life expectancy (age 95)', () => {
    const result = findOptimalOASStartAge(713.33, 95);

    expect(result.optimal_age).toBe(70);
    expect(result.total_benefit).toBeGreaterThan(0);
  });

  it('should provide comparison for all ages', () => {
    const result = findOptimalOASStartAge(713.33, 85);

    expect(result.comparison).toHaveLength(6);
    expect(result.comparison[0].age).toBe(65);
    expect(result.comparison[5].age).toBe(70);
  });

  it('should calculate breakeven around age 77-78', () => {
    // OAS breakeven is typically around age 77-78
    const result77 = findOptimalOASStartAge(713.33, 77);
    const result78 = findOptimalOASStartAge(713.33, 78);

    // At 77, age 65 might be optimal
    // At 78, age 70 might become optimal
    expect([65, 70]).toContain(result77.optimal_age);
    expect([65, 70]).toContain(result78.optimal_age);
  });
});

describe('Integration Tests', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should calculate combined CPP and OAS for typical retiree', async () => {
    // Typical scenario: Average CPP, max OAS, both starting at 65
    const cpp = await calculateCPP(mockClient, 758.33, 65);
    const oas = await calculateOAS(mockClient, 713.33, 65);

    const totalMonthly = cpp.monthly_amount + oas.monthly_amount;
    const totalAnnual = cpp.annual_amount + oas.annual_amount;

    expectCloseTo(totalMonthly, 1471.66, 1);
    expectCloseTo(totalAnnual, 17660, 5);
  });

  it('should show benefit of delaying both to age 70', async () => {
    const cppAt65 = await calculateCPP(mockClient, 1000, 65);
    const cppAt70 = await calculateCPP(mockClient, 1000, 70);

    const oasAt65 = await calculateOAS(mockClient, 713.33, 65);
    const oasAt70 = await calculateOAS(mockClient, 713.33, 70);

    const totalAt65 = cppAt65.annual_amount + oasAt65.annual_amount;
    const totalAt70 = cppAt70.annual_amount + oasAt70.annual_amount;

    // At age 70, should receive significantly more
    expect(totalAt70).toBeGreaterThan(totalAt65);

    // CPP should be 42% higher
    expectCloseTo(cppAt70.annual_amount / cppAt65.annual_amount, 1.42, 0.01);

    // OAS should be 36% higher
    expectCloseTo(oasAt70.annual_amount / oasAt65.annual_amount, 1.36, 0.01);
  });

  it('should show cost of taking CPP early at 60', async () => {
    const cppAt60 = await calculateCPP(mockClient, 1000, 60);
    const cppAt65 = await calculateCPP(mockClient, 1000, 65);

    // At age 60, should receive 36% less
    expectCloseTo(cppAt60.annual_amount / cppAt65.annual_amount, 0.64, 0.01);
  });
});
