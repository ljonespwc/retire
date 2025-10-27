/**
 * Account Management Functions
 *
 * Handles RRSP/RRIF/TFSA/Non-registered account calculations including:
 * - RRIF minimum withdrawals
 * - Account growth projections
 * - Withdrawal sequencing optimization
 * - Pre-retirement accumulation
 *
 * All functions accept Supabase client as first parameter for database-backed data.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getRRIFMinimums } from '@/lib/supabase/tax-data';

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Account balances at a point in time
 */
export interface AccountBalances {
  /** RRSP balance (pre-retirement) or RRIF balance (post-retirement) */
  rrsp_rrif: number;
  /** TFSA balance */
  tfsa: number;
  /** Non-registered investment account balance */
  non_registered: number;
  /** Total across all accounts */
  total: number;
}

/**
 * Withdrawal amounts by account
 */
export interface WithdrawalAmounts {
  /** Amount withdrawn from RRSP/RRIF */
  rrsp_rrif: number;
  /** Amount withdrawn from TFSA */
  tfsa: number;
  /** Amount withdrawn from non-registered (principal + gains) */
  non_registered: number;
  /** Capital gains portion of non-registered withdrawal */
  capital_gains: number;
  /** Total withdrawal across all accounts */
  total: number;
}

/**
 * Account projection for a single year
 */
export interface AccountProjection {
  /** Year being projected */
  year: number;
  /** Age at start of year */
  age: number;
  /** Account balances at start of year (before withdrawals and growth) */
  starting_balance: AccountBalances;
  /** Contributions made during the year */
  contributions: AccountBalances;
  /** Investment returns earned during the year */
  investment_returns: AccountBalances;
  /** Withdrawals taken during the year */
  withdrawals: WithdrawalAmounts;
  /** Account balances at end of year */
  ending_balance: AccountBalances;
  /** RRIF minimum withdrawal percentage (if applicable) */
  rrif_minimum_percentage?: number;
}

/**
 * Get RRIF minimum withdrawal percentage for a given age
 *
 * RRIF minimums are age-based and defined by CRA regulations.
 * For ages below the minimum (55), returns 0.
 * For ages above the maximum (95), uses the 95+ rate.
 *
 * @param client - Supabase client for database queries
 * @param age - Age for RRIF withdrawal calculation
 * @returns RRIF minimum percentage as decimal (e.g., 0.0528 for 5.28%)
 */
export async function getRRIFMinimumPercentage(
  client: TypedSupabaseClient,
  age: number
): Promise<number> {
  const { data: minimums } = await getRRIFMinimums(client);

  if (!minimums) {
    throw new Error('Failed to fetch RRIF minimums');
  }

  // Use age as key, with bounds checking
  if (age < 55) return 0; // No RRIF before age 55
  if (age >= 95) return minimums[95]; // Use 95+ rate for very old ages

  return minimums[age] || 0;
}

/**
 * Calculate RRIF minimum withdrawal for a given year
 *
 * The minimum is calculated based on the RRIF balance at the start of the year
 * and the age-based percentage.
 *
 * @param client - Supabase client for database queries
 * @param rrifBalance - RRIF balance at start of year
 * @param age - Age at start of year
 * @returns Minimum required withdrawal amount
 */
export async function calculateRRIFMinimumWithdrawal(
  client: TypedSupabaseClient,
  rrifBalance: number,
  age: number
): Promise<number> {
  if (age < 55) {
    // Can't have RRIF before age 55 (must convert by end of year turning 71)
    return 0;
  }

  const percentage = await getRRIFMinimumPercentage(client, age);
  return rrifBalance * percentage;
}

/**
 * Project account balance growth for one year
 *
 * Calculates ending balance given:
 * - Starting balance
 * - Contributions during the year
 * - Rate of return
 * - Withdrawals during the year
 *
 * Assumes:
 * - Contributions made at start of year
 * - Withdrawals taken at start of year (before growth)
 * - Returns applied to net balance after contributions/withdrawals
 *
 * @param startingBalance - Balance at start of year
 * @param contribution - Amount contributed during year
 * @param withdrawal - Amount withdrawn during year
 * @param rateOfReturn - Annual rate of return as decimal (e.g., 0.06 for 6%)
 * @returns Ending balance after growth
 */
export function projectAccountGrowth(
  startingBalance: number,
  contribution: number,
  withdrawal: number,
  rateOfReturn: number
): {
  investmentReturn: number;
  endingBalance: number;
} {
  // Net balance after contributions and withdrawals
  const netBalance = startingBalance + contribution - withdrawal;

  // Apply rate of return
  const investmentReturn = netBalance * rateOfReturn;
  const endingBalance = netBalance + investmentReturn;

  return {
    investmentReturn,
    endingBalance: Math.max(0, endingBalance), // Can't go negative
  };
}

/**
 * Calculate tax-efficient withdrawal sequence
 *
 * Standard tax-efficient withdrawal order:
 * 1. Non-registered accounts first (50% capital gains inclusion)
 * 2. RRSP/RRIF second (100% taxable, but preserves TFSA)
 * 3. TFSA last (tax-free growth, preserve as long as possible)
 *
 * Special considerations:
 * - RRIF minimum must be taken if applicable
 * - Can't overdraw any account
 * - Non-registered withdrawals split between principal and capital gains
 *
 * @param targetWithdrawal - Total amount needed
 * @param balances - Current account balances
 * @param age - Current age (for RRIF minimum calculation)
 * @param client - Supabase client for RRIF minimum lookup
 * @param nonRegCostBasis - Cost basis of non-registered account (for capital gains)
 * @returns Withdrawal amounts by account
 */
export async function calculateWithdrawalSequence(
  client: TypedSupabaseClient,
  targetWithdrawal: number,
  balances: AccountBalances,
  age: number,
  nonRegCostBasis: number = 0
): Promise<WithdrawalAmounts> {
  const withdrawals: WithdrawalAmounts = {
    rrsp_rrif: 0,
    tfsa: 0,
    non_registered: 0,
    capital_gains: 0,
    total: 0,
  };

  let remaining = targetWithdrawal;

  // Step 1: Check for RRIF minimum requirement
  const rrifMinimum = await calculateRRIFMinimumWithdrawal(
    client,
    balances.rrsp_rrif,
    age
  );

  if (rrifMinimum > 0) {
    // Must take RRIF minimum
    withdrawals.rrsp_rrif = Math.min(rrifMinimum, balances.rrsp_rrif);
    remaining -= withdrawals.rrsp_rrif;
  }

  // If RRIF minimum satisfies the need, we're done
  if (remaining <= 0) {
    withdrawals.total = withdrawals.rrsp_rrif;
    return withdrawals;
  }

  // Step 2: Withdraw from non-registered account (tax-advantaged due to capital gains)
  if (balances.non_registered > 0 && remaining > 0) {
    const nonRegWithdrawal = Math.min(remaining, balances.non_registered);
    withdrawals.non_registered = nonRegWithdrawal;

    // Calculate capital gains portion
    if (nonRegCostBasis > 0 && balances.non_registered > 0) {
      const gainRatio = Math.max(
        0,
        (balances.non_registered - nonRegCostBasis) / balances.non_registered
      );
      withdrawals.capital_gains = nonRegWithdrawal * gainRatio;
    } else {
      // If no cost basis provided, assume 50% is gains (conservative estimate)
      withdrawals.capital_gains = nonRegWithdrawal * 0.5;
    }

    remaining -= nonRegWithdrawal;
  }

  // Step 3: Withdraw from RRSP/RRIF (after minimum already taken)
  if (balances.rrsp_rrif > withdrawals.rrsp_rrif && remaining > 0) {
    const availableRRSP = balances.rrsp_rrif - withdrawals.rrsp_rrif;
    const additionalRRSP = Math.min(remaining, availableRRSP);
    withdrawals.rrsp_rrif += additionalRRSP;
    remaining -= additionalRRSP;
  }

  // Step 4: Withdraw from TFSA (last resort - preserve tax-free growth)
  if (balances.tfsa > 0 && remaining > 0) {
    const tfsaWithdrawal = Math.min(remaining, balances.tfsa);
    withdrawals.tfsa = tfsaWithdrawal;
    remaining -= tfsaWithdrawal;
  }

  withdrawals.total =
    withdrawals.rrsp_rrif + withdrawals.tfsa + withdrawals.non_registered;

  return withdrawals;
}

/**
 * Project account balances forward one year
 *
 * This is a comprehensive year projection that handles:
 * - Contributions (pre-retirement only)
 * - Tax-efficient withdrawals (retirement only)
 * - RRIF minimum requirements
 * - Investment growth
 * - Account-specific rates of return
 *
 * @param client - Supabase client for RRIF data
 * @param currentBalances - Account balances at start of year
 * @param age - Age at start of year
 * @param year - Calendar year
 * @param isRetired - Whether person has retired
 * @param targetWithdrawal - Target withdrawal amount (if retired)
 * @param contributions - Contribution amounts (if not retired)
 * @param ratesOfReturn - Account-specific rates of return
 * @param nonRegCostBasis - Cost basis for non-registered account
 * @returns Complete year projection
 */
export async function projectYearForward(
  client: TypedSupabaseClient,
  currentBalances: AccountBalances,
  age: number,
  year: number,
  isRetired: boolean,
  targetWithdrawal: number = 0,
  contributions: Partial<AccountBalances> = {},
  ratesOfReturn: {
    rrsp_rrif: number;
    tfsa: number;
    non_registered: number;
  } = { rrsp_rrif: 0.05, tfsa: 0.05, non_registered: 0.05 },
  nonRegCostBasis: number = 0
): Promise<AccountProjection> {
  const projection: AccountProjection = {
    year,
    age,
    starting_balance: { ...currentBalances },
    contributions: {
      rrsp_rrif: 0,
      tfsa: 0,
      non_registered: 0,
      total: 0,
    },
    investment_returns: {
      rrsp_rrif: 0,
      tfsa: 0,
      non_registered: 0,
      total: 0,
    },
    withdrawals: {
      rrsp_rrif: 0,
      tfsa: 0,
      non_registered: 0,
      capital_gains: 0,
      total: 0,
    },
    ending_balance: {
      rrsp_rrif: 0,
      tfsa: 0,
      non_registered: 0,
      total: 0,
    },
  };

  // Handle contributions (pre-retirement only)
  if (!isRetired) {
    projection.contributions = {
      rrsp_rrif: contributions.rrsp_rrif || 0,
      tfsa: contributions.tfsa || 0,
      non_registered: contributions.non_registered || 0,
      total: 0,
    };
    projection.contributions.total =
      projection.contributions.rrsp_rrif +
      projection.contributions.tfsa +
      projection.contributions.non_registered;
  }

  // Handle withdrawals (retirement only)
  if (isRetired) {
    projection.withdrawals = await calculateWithdrawalSequence(
      client,
      targetWithdrawal,
      currentBalances,
      age,
      nonRegCostBasis
    );

    // Get RRIF minimum percentage for display
    if (age >= 55) {
      projection.rrif_minimum_percentage = await getRRIFMinimumPercentage(
        client,
        age
      );
    }
  }

  // Project each account forward
  const rrspGrowth = projectAccountGrowth(
    currentBalances.rrsp_rrif,
    projection.contributions.rrsp_rrif,
    projection.withdrawals.rrsp_rrif,
    ratesOfReturn.rrsp_rrif
  );

  const tfsaGrowth = projectAccountGrowth(
    currentBalances.tfsa,
    projection.contributions.tfsa,
    projection.withdrawals.tfsa,
    ratesOfReturn.tfsa
  );

  const nonRegGrowth = projectAccountGrowth(
    currentBalances.non_registered,
    projection.contributions.non_registered,
    projection.withdrawals.non_registered,
    ratesOfReturn.non_registered
  );

  // Set investment returns
  projection.investment_returns = {
    rrsp_rrif: rrspGrowth.investmentReturn,
    tfsa: tfsaGrowth.investmentReturn,
    non_registered: nonRegGrowth.investmentReturn,
    total:
      rrspGrowth.investmentReturn +
      tfsaGrowth.investmentReturn +
      nonRegGrowth.investmentReturn,
  };

  // Set ending balances
  projection.ending_balance = {
    rrsp_rrif: rrspGrowth.endingBalance,
    tfsa: tfsaGrowth.endingBalance,
    non_registered: nonRegGrowth.endingBalance,
    total:
      rrspGrowth.endingBalance +
      tfsaGrowth.endingBalance +
      nonRegGrowth.endingBalance,
  };

  return projection;
}

/**
 * Convert RRSP to RRIF at age 71
 *
 * At the end of the year you turn 71, you must convert your RRSP to a RRIF.
 * This is a simple transfer - no tax implications at conversion time.
 *
 * Note: In our system, we use a single rrsp_rrif balance that represents
 * RRSP pre-retirement and RRIF post-retirement. This function is mainly
 * for documentation and to set the flag for RRIF minimum calculations.
 *
 * @param age - Current age
 * @returns Whether RRSP should be converted to RRIF
 */
export function shouldConvertToRRIF(age: number): boolean {
  return age >= 71;
}

/**
 * Calculate total account balances
 *
 * Simple helper to sum all account types.
 *
 * @param rrsp_rrif - RRSP or RRIF balance
 * @param tfsa - TFSA balance
 * @param non_registered - Non-registered balance
 * @returns AccountBalances object with total
 */
export function calculateTotalBalance(
  rrsp_rrif: number,
  tfsa: number,
  non_registered: number
): AccountBalances {
  return {
    rrsp_rrif,
    tfsa,
    non_registered,
    total: rrsp_rrif + tfsa + non_registered,
  };
}
