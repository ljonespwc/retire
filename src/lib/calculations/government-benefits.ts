/**
 * Canadian Government Benefits Calculator
 *
 * Accurate CPP and OAS calculations with age adjustment factors.
 * All functions accept Supabase client as first parameter for database-backed benefit data.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getCPPAmounts, getOASAmounts } from '@/lib/supabase/tax-data';

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * CPP adjustment factors by age
 *
 * CPP can be taken from age 60-70:
 * - Early (60-64): 0.6% reduction per month before 65 (7.2% per year)
 * - Normal (65): 100% of entitlement
 * - Delayed (66-70): 0.7% enhancement per month after 65 (8.4% per year)
 */
export interface CPPAdjustmentFactors {
  /** Age at which CPP starts */
  age: number;
  /** Adjustment factor as decimal (e.g., 0.64 for age 60, 1.42 for age 70) */
  factor: number;
  /** Number of months early/late relative to age 65 */
  months_from_65: number;
}

/**
 * OAS adjustment factors by age
 *
 * OAS can be taken from age 65-70:
 * - Normal (65): 100% of entitlement
 * - Delayed (66-70): 0.6% enhancement per month after 65 (7.2% per year)
 */
export interface OASAdjustmentFactors {
  /** Age at which OAS starts */
  age: number;
  /** Adjustment factor as decimal (e.g., 1.0 for age 65, 1.36 for age 70) */
  factor: number;
  /** Number of months of deferral */
  months_deferred: number;
}

/**
 * CPP calculation result
 */
export interface CPPCalculation {
  /** Annual CPP amount */
  annual_amount: number;
  /** Monthly CPP amount */
  monthly_amount: number;
  /** Age at which CPP starts */
  start_age: number;
  /** Adjustment factor applied */
  adjustment_factor: number;
  /** Base amount at age 65 (before adjustment) */
  base_amount_at_65: number;
}

/**
 * OAS calculation result
 */
export interface OASCalculation {
  /** Annual OAS amount */
  annual_amount: number;
  /** Monthly OAS amount */
  monthly_amount: number;
  /** Age at which OAS starts */
  start_age: number;
  /** Adjustment factor applied */
  adjustment_factor: number;
  /** Base amount at age 65 (before adjustment) */
  base_amount_at_65: number;
}

/**
 * Calculate CPP adjustment factor for a given age
 *
 * CPP reduction/enhancement rules:
 * - Age 60: 64% (36% reduction = 60 months × 0.6% per month)
 * - Age 61: 71.2% (28.8% reduction = 48 months × 0.6%)
 * - Age 62: 78.4% (21.6% reduction = 36 months × 0.6%)
 * - Age 63: 85.6% (14.4% reduction = 24 months × 0.6%)
 * - Age 64: 92.8% (7.2% reduction = 12 months × 0.6%)
 * - Age 65: 100% (no adjustment)
 * - Age 66: 108.4% (8.4% enhancement = 12 months × 0.7%)
 * - Age 67: 116.8% (16.8% enhancement = 24 months × 0.7%)
 * - Age 68: 125.2% (25.2% enhancement = 36 months × 0.7%)
 * - Age 69: 133.6% (33.6% enhancement = 48 months × 0.7%)
 * - Age 70: 142% (42% enhancement = 60 months × 0.7%)
 *
 * @param age - Age at which CPP starts (60-70)
 * @returns Adjustment factor details
 * @throws Error if age is outside valid range
 */
export function calculateCPPAdjustmentFactor(age: number): CPPAdjustmentFactors {
  if (age < 60 || age > 70) {
    throw new Error('CPP can only be taken between ages 60 and 70');
  }

  const monthsFrom65 = (age - 65) * 12;
  let factor: number;

  if (age < 65) {
    // Early CPP: 0.6% reduction per month
    factor = 1 + (monthsFrom65 * 0.006);
  } else if (age === 65) {
    // Normal CPP
    factor = 1.0;
  } else {
    // Delayed CPP: 0.7% enhancement per month
    factor = 1 + (monthsFrom65 * 0.007);
  }

  return {
    age,
    factor,
    months_from_65: monthsFrom65,
  };
}

/**
 * Calculate OAS adjustment factor for a given age
 *
 * OAS deferral enhancement rules:
 * - Age 65: 100% (no adjustment)
 * - Age 66: 107.2% (7.2% enhancement = 12 months × 0.6%)
 * - Age 67: 114.4% (14.4% enhancement = 24 months × 0.6%)
 * - Age 68: 121.6% (21.6% enhancement = 36 months × 0.6%)
 * - Age 69: 128.8% (28.8% enhancement = 48 months × 0.6%)
 * - Age 70: 136% (36% enhancement = 60 months × 0.6%)
 *
 * @param age - Age at which OAS starts (65-70)
 * @returns Adjustment factor details
 * @throws Error if age is outside valid range
 */
export function calculateOASAdjustmentFactor(age: number): OASAdjustmentFactors {
  if (age < 65 || age > 70) {
    throw new Error('OAS can only be taken between ages 65 and 70');
  }

  const monthsDeferred = (age - 65) * 12;
  const factor = 1 + (monthsDeferred * 0.006); // 0.6% per month

  return {
    age,
    factor,
    months_deferred: monthsDeferred,
  };
}

/**
 * Calculate CPP amount with age adjustment
 *
 * Takes a base CPP amount (at age 65) and applies the appropriate
 * adjustment factor based on the age at which CPP starts.
 *
 * @param client - Supabase client for database queries
 * @param baseAmountAt65 - Monthly CPP amount at age 65
 * @param startAge - Age at which to start CPP (60-70)
 * @param year - Tax year (defaults to 2025)
 * @returns CPP calculation with annual and monthly amounts
 */
export async function calculateCPP(
  client: TypedSupabaseClient,
  baseAmountAt65: number,
  startAge: number,
  year: number = 2025
): Promise<CPPCalculation> {
  // Get CPP data from database for validation
  const { data: cppData } = await getCPPAmounts(client, year);

  // Calculate adjustment factor
  const adjustment = calculateCPPAdjustmentFactor(startAge);

  // Apply adjustment to base amount
  const monthlyAmount = baseAmountAt65 * adjustment.factor;
  const annualAmount = monthlyAmount * 12;

  return {
    annual_amount: annualAmount,
    monthly_amount: monthlyAmount,
    start_age: startAge,
    adjustment_factor: adjustment.factor,
    base_amount_at_65: baseAmountAt65,
  };
}

/**
 * Calculate OAS amount with age adjustment
 *
 * Takes a base OAS amount (at age 65) and applies the appropriate
 * adjustment factor based on the age at which OAS starts.
 *
 * @param client - Supabase client for database queries
 * @param baseAmountAt65 - Monthly OAS amount at age 65
 * @param startAge - Age at which to start OAS (65-70)
 * @param year - Tax year (defaults to 2025)
 * @returns OAS calculation with annual and monthly amounts
 */
export async function calculateOAS(
  client: TypedSupabaseClient,
  baseAmountAt65: number,
  startAge: number,
  year: number = 2025
): Promise<OASCalculation> {
  // Get OAS data from database for validation
  const { data: oasData } = await getOASAmounts(client, year);

  // Calculate adjustment factor
  const adjustment = calculateOASAdjustmentFactor(startAge);

  // Apply adjustment to base amount
  const monthlyAmount = baseAmountAt65 * adjustment.factor;
  const annualAmount = monthlyAmount * 12;

  return {
    annual_amount: annualAmount,
    monthly_amount: monthlyAmount,
    start_age: startAge,
    adjustment_factor: adjustment.factor,
    base_amount_at_65: baseAmountAt65,
  };
}

/**
 * Estimate CPP based on average earnings
 *
 * Provides a rough estimate of CPP entitlement based on average career earnings.
 * For more accurate estimates, users should check their My Service Canada Account.
 *
 * The formula is a simplified approximation:
 * - If average earnings >= YMPE: approximately 25% of YMPE (max CPP)
 * - If average earnings < YMPE: proportional calculation
 *
 * Note: This is a rough estimate. Actual CPP depends on:
 * - Contributions from age 18 to retirement
 * - General drop-out provision (lowest 8 years excluded)
 * - Child-rearing drop-out provision
 * - Disability drop-out provision
 *
 * @param client - Supabase client for database queries
 * @param averageAnnualEarnings - Average annual earnings over career
 * @param year - Tax year (defaults to 2025)
 * @returns Estimated monthly CPP at age 65
 */
export async function estimateCPPFromEarnings(
  client: TypedSupabaseClient,
  averageAnnualEarnings: number,
  year: number = 2025
): Promise<number> {
  const { data: cppData } = await getCPPAmounts(client, year);

  if (!cppData) {
    throw new Error('Failed to fetch CPP data');
  }

  // If earnings >= YMPE, return max CPP
  if (averageAnnualEarnings >= cppData.ympe) {
    return cppData.max_monthly;
  }

  // Proportional calculation for earnings below YMPE
  // This is a simplification - actual CPP calculation is more complex
  const earningsRatio = averageAnnualEarnings / cppData.ympe;
  const estimatedMonthly = cppData.max_monthly * earningsRatio;

  return estimatedMonthly;
}

/**
 * Find optimal CPP start age for maximum lifetime benefit
 *
 * This is a simplified calculation that compares total CPP received
 * over different lifespans for different start ages.
 *
 * Note: This doesn't account for:
 * - Time value of money (investment returns)
 * - Tax implications
 * - Individual health/longevity expectations
 * - Need for income at different life stages
 *
 * @param baseAmountAt65 - Monthly CPP amount at age 65
 * @param expectedLongevity - Expected age of death
 * @returns Recommended start age based on lifetime benefit maximization
 */
export function findOptimalCPPStartAge(
  baseAmountAt65: number,
  expectedLongevity: number
): {
  optimal_age: number;
  total_benefit: number;
  comparison: Array<{ age: number; total: number }>;
} {
  const scenarios: Array<{ age: number; total: number }> = [];

  // Calculate total benefit for each possible start age
  for (let startAge = 60; startAge <= 70; startAge++) {
    const adjustment = calculateCPPAdjustmentFactor(startAge);
    const monthlyAmount = baseAmountAt65 * adjustment.factor;
    const monthsReceiving = (expectedLongevity - startAge) * 12;
    const totalBenefit = monthlyAmount * monthsReceiving;

    scenarios.push({
      age: startAge,
      total: totalBenefit,
    });
  }

  // Find age with maximum total benefit
  const optimal = scenarios.reduce((best, current) =>
    current.total > best.total ? current : best
  );

  return {
    optimal_age: optimal.age,
    total_benefit: optimal.total,
    comparison: scenarios,
  };
}

/**
 * Find optimal OAS start age for maximum lifetime benefit
 *
 * Similar to CPP optimization, but for OAS (ages 65-70 only).
 *
 * @param baseAmountAt65 - Monthly OAS amount at age 65
 * @param expectedLongevity - Expected age of death
 * @returns Recommended start age based on lifetime benefit maximization
 */
export function findOptimalOASStartAge(
  baseAmountAt65: number,
  expectedLongevity: number
): {
  optimal_age: number;
  total_benefit: number;
  comparison: Array<{ age: number; total: number }>;
} {
  const scenarios: Array<{ age: number; total: number }> = [];

  // Calculate total benefit for each possible start age
  for (let startAge = 65; startAge <= 70; startAge++) {
    const adjustment = calculateOASAdjustmentFactor(startAge);
    const monthlyAmount = baseAmountAt65 * adjustment.factor;
    const monthsReceiving = (expectedLongevity - startAge) * 12;
    const totalBenefit = monthlyAmount * monthsReceiving;

    scenarios.push({
      age: startAge,
      total: totalBenefit,
    });
  }

  // Find age with maximum total benefit
  const optimal = scenarios.reduce((best, current) =>
    current.total > best.total ? current : best
  );

  return {
    optimal_age: optimal.age,
    total_benefit: optimal.total,
    comparison: scenarios,
  };
}
