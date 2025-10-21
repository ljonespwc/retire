/**
 * Account Management Tests
 *
 * Comprehensive tests for RRSP/RRIF/TFSA/Non-registered account functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRRIFMinimumPercentage,
  calculateRRIFMinimumWithdrawal,
  projectAccountGrowth,
  calculateWithdrawalSequence,
  projectYearForward,
  shouldConvertToRRIF,
  calculateTotalBalance,
  type AccountBalances,
} from '../accounts';
import { createMockClient, expectCloseTo, type MockSupabaseClient } from './test-helpers';

describe('getRRIFMinimumPercentage', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should return 0 for age below 55', async () => {
    const result = await getRRIFMinimumPercentage(mockClient, 50);
    expect(result).toBe(0);
  });

  it('should return correct percentage for age 71', async () => {
    const result = await getRRIFMinimumPercentage(mockClient, 71);
    expectCloseTo(result, 0.0528, 0.0001);
  });

  it('should return correct percentage for age 75', async () => {
    const result = await getRRIFMinimumPercentage(mockClient, 75);
    expectCloseTo(result, 0.0582, 0.0001);
  });

  it('should return correct percentage for age 90', async () => {
    const result = await getRRIFMinimumPercentage(mockClient, 90);
    expectCloseTo(result, 0.1111, 0.0001);
  });

  it('should use 95+ rate for ages above 95', async () => {
    const result95 = await getRRIFMinimumPercentage(mockClient, 95);
    const result100 = await getRRIFMinimumPercentage(mockClient, 100);

    expect(result100).toBe(result95); // Same rate for 95+
    expectCloseTo(result95, 0.2, 0.0001);
  });
});

describe('calculateRRIFMinimumWithdrawal', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should return 0 for age below 55', async () => {
    const result = await calculateRRIFMinimumWithdrawal(mockClient, 500000, 50);
    expect(result).toBe(0);
  });

  it('should calculate correct minimum for age 71', async () => {
    // Age 71: 5.28% minimum
    // Balance: $500,000
    // Minimum: $26,400
    const result = await calculateRRIFMinimumWithdrawal(mockClient, 500000, 71);
    expectCloseTo(result, 26400, 10);
  });

  it('should calculate correct minimum for age 80', async () => {
    // Age 80: 6.82% minimum
    // Balance: $300,000
    // Minimum: $20,460
    const result = await calculateRRIFMinimumWithdrawal(mockClient, 300000, 80);
    expectCloseTo(result, 20460, 10);
  });

  it('should handle zero balance', async () => {
    const result = await calculateRRIFMinimumWithdrawal(mockClient, 0, 75);
    expect(result).toBe(0);
  });

  it('should calculate for very large RRIF', async () => {
    // Age 75: 5.82% minimum
    // Balance: $5,000,000
    // Minimum: $291,000
    const result = await calculateRRIFMinimumWithdrawal(mockClient, 5000000, 75);
    expectCloseTo(result, 291000, 100);
  });
});

describe('projectAccountGrowth', () => {
  it('should project growth with no contributions or withdrawals', () => {
    const result = projectAccountGrowth(100000, 0, 0, 0.06);

    expectCloseTo(result.investmentReturn, 6000, 1);
    expectCloseTo(result.endingBalance, 106000, 1);
  });

  it('should project growth with contributions', () => {
    const result = projectAccountGrowth(100000, 10000, 0, 0.06);

    // Net balance: 110,000
    // Return: 6,600
    // Ending: 116,600
    expectCloseTo(result.investmentReturn, 6600, 1);
    expectCloseTo(result.endingBalance, 116600, 1);
  });

  it('should project growth with withdrawals', () => {
    const result = projectAccountGrowth(100000, 0, 20000, 0.06);

    // Net balance: 80,000
    // Return: 4,800
    // Ending: 84,800
    expectCloseTo(result.investmentReturn, 4800, 1);
    expectCloseTo(result.endingBalance, 84800, 1);
  });

  it('should project growth with both contributions and withdrawals', () => {
    const result = projectAccountGrowth(100000, 15000, 10000, 0.05);

    // Net balance: 105,000
    // Return: 5,250
    // Ending: 110,250
    expectCloseTo(result.investmentReturn, 5250, 1);
    expectCloseTo(result.endingBalance, 110250, 1);
  });

  it('should not go negative', () => {
    // Withdraw more than balance
    const result = projectAccountGrowth(10000, 0, 50000, 0.05);

    expect(result.endingBalance).toBe(0);
  });

  it('should handle negative returns', () => {
    const result = projectAccountGrowth(100000, 0, 0, -0.10);

    // 10% loss
    expectCloseTo(result.investmentReturn, -10000, 1);
    expectCloseTo(result.endingBalance, 90000, 1);
  });

  it('should handle zero return', () => {
    const result = projectAccountGrowth(100000, 5000, 3000, 0);

    expect(result.investmentReturn).toBe(0);
    expect(result.endingBalance).toBe(102000);
  });
});

describe('calculateWithdrawalSequence', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should withdraw from non-registered first', async () => {
    const balances: AccountBalances = {
      rrsp_rrif: 500000,
      tfsa: 100000,
      non_registered: 200000,
      total: 800000,
    };

    const result = await calculateWithdrawalSequence(
      mockClient,
      30000,
      balances,
      65,
      100000 // cost basis
    );

    // Should take all from non-registered
    expect(result.non_registered).toBe(30000);
    expect(result.rrsp_rrif).toBe(0);
    expect(result.tfsa).toBe(0);
    expect(result.total).toBe(30000);

    // Capital gains should be calculated
    // Gain: (200,000 - 100,000) / 200,000 = 50%
    // CG on withdrawal: 30,000 * 0.5 = 15,000
    expectCloseTo(result.capital_gains, 15000, 1);
  });

  it('should withdraw from RRSP after exhausting non-registered', async () => {
    const balances: AccountBalances = {
      rrsp_rrif: 500000,
      tfsa: 100000,
      non_registered: 20000,
      total: 620000,
    };

    const result = await calculateWithdrawalSequence(
      mockClient,
      50000,
      balances,
      65
    );

    // Non-reg: $20,000
    // RRSP: $30,000
    expect(result.non_registered).toBe(20000);
    expect(result.rrsp_rrif).toBe(30000);
    expect(result.tfsa).toBe(0);
    expect(result.total).toBe(50000);
  });

  it('should withdraw from TFSA as last resort', async () => {
    const balances: AccountBalances = {
      rrsp_rrif: 10000,
      tfsa: 100000,
      non_registered: 15000,
      total: 125000,
    };

    const result = await calculateWithdrawalSequence(
      mockClient,
      50000,
      balances,
      65
    );

    // Non-reg: $15,000
    // RRSP: $10,000
    // TFSA: $25,000 (remainder)
    expect(result.non_registered).toBe(15000);
    expect(result.rrsp_rrif).toBe(10000);
    expect(result.tfsa).toBe(25000);
    expect(result.total).toBe(50000);
  });

  it('should respect RRIF minimum requirement', async () => {
    const balances: AccountBalances = {
      rrsp_rrif: 500000,
      tfsa: 100000,
      non_registered: 200000,
      total: 800000,
    };

    // Age 71: 5.28% minimum = $26,400
    // Request only $20,000
    const result = await calculateWithdrawalSequence(
      mockClient,
      20000,
      balances,
      71
    );

    // Should take RRIF minimum instead of requested amount
    expectCloseTo(result.rrsp_rrif, 26400, 10);
    expect(result.non_registered).toBe(0);
    expect(result.tfsa).toBe(0);
    expectCloseTo(result.total, 26400, 10);
  });

  it('should add to RRIF minimum if more needed', async () => {
    const balances: AccountBalances = {
      rrsp_rrif: 500000,
      tfsa: 100000,
      non_registered: 200000,
      total: 800000,
    };

    // Age 71: 5.28% minimum = $26,400
    // Request $60,000
    const result = await calculateWithdrawalSequence(
      mockClient,
      60000,
      balances,
      71,
      100000
    );

    // RRIF minimum: $26,400
    // Remaining: $33,600 from non-registered
    expectCloseTo(result.rrsp_rrif, 26400, 10);
    expectCloseTo(result.non_registered, 33600, 10);
    expect(result.tfsa).toBe(0);
    expectCloseTo(result.total, 60000, 10);
  });

  it('should handle insufficient funds', async () => {
    const balances: AccountBalances = {
      rrsp_rrif: 10000,
      tfsa: 5000,
      non_registered: 8000,
      total: 23000,
    };

    const result = await calculateWithdrawalSequence(
      mockClient,
      50000,
      balances,
      65
    );

    // Can only withdraw what's available: $23,000
    expect(result.non_registered).toBe(8000);
    expect(result.rrsp_rrif).toBe(10000);
    expect(result.tfsa).toBe(5000);
    expect(result.total).toBe(23000);
  });

  it('should estimate 50% capital gains if no cost basis provided', async () => {
    const balances: AccountBalances = {
      rrsp_rrif: 500000,
      tfsa: 100000,
      non_registered: 100000,
      total: 700000,
    };

    const result = await calculateWithdrawalSequence(
      mockClient,
      20000,
      balances,
      65
      // No cost basis provided
    );

    // Should assume 50% is capital gains
    expectCloseTo(result.capital_gains, 10000, 1);
  });
});

describe('projectYearForward', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should project pre-retirement year with contributions', async () => {
    const balances: AccountBalances = {
      rrsp_rrif: 300000,
      tfsa: 80000,
      non_registered: 150000,
      total: 530000,
    };

    const contributions = {
      rrsp_rrif: 20000,
      tfsa: 7000,
      non_registered: 10000,
    };

    const result = await projectYearForward(
      mockClient,
      balances,
      55,
      2025,
      false, // Not retired
      0,
      contributions,
      { rrsp_rrif: 0.06, tfsa: 0.05, non_registered: 0.06 }
    );

    expect(result.age).toBe(55);
    expect(result.year).toBe(2025);

    // Should have contributions
    expect(result.contributions.rrsp_rrif).toBe(20000);
    expect(result.contributions.tfsa).toBe(7000);
    expect(result.contributions.non_registered).toBe(10000);

    // Should have no withdrawals
    expect(result.withdrawals.total).toBe(0);

    // Ending balances should be higher than starting
    expect(result.ending_balance.total).toBeGreaterThan(balances.total);

    // RRSP: (300,000 + 20,000) * 1.06 = 339,200
    expectCloseTo(result.ending_balance.rrsp_rrif, 339200, 10);

    // TFSA: (80,000 + 7,000) * 1.05 = 91,350
    expectCloseTo(result.ending_balance.tfsa, 91350, 10);

    // Non-reg: (150,000 + 10,000) * 1.06 = 169,600
    expectCloseTo(result.ending_balance.non_registered, 169600, 10);
  });

  it('should project retirement year with withdrawals', async () => {
    const balances: AccountBalances = {
      rrsp_rrif: 500000,
      tfsa: 100000,
      non_registered: 200000,
      total: 800000,
    };

    const result = await projectYearForward(
      mockClient,
      balances,
      65,
      2025,
      true, // Retired
      40000, // Target withdrawal
      {},
      { rrsp_rrif: 0.05, tfsa: 0.05, non_registered: 0.05 }
    );

    expect(result.age).toBe(65);
    expect(result.year).toBe(2025);

    // Should have no contributions
    expect(result.contributions.total).toBe(0);

    // Should have withdrawals
    expect(result.withdrawals.total).toBe(40000);

    // Should withdraw from non-registered first
    expect(result.withdrawals.non_registered).toBeGreaterThan(0);

    // Ending balance should be lower than starting
    expect(result.ending_balance.total).toBeLessThan(balances.total);
  });

  it('should handle RRIF minimum requirement', async () => {
    const balances: AccountBalances = {
      rrsp_rrif: 500000,
      tfsa: 100000,
      non_registered: 200000,
      total: 800000,
    };

    const result = await projectYearForward(
      mockClient,
      balances,
      71,
      2025,
      true,
      20000, // Less than RRIF minimum
      {},
      { rrsp_rrif: 0.05, tfsa: 0.05, non_registered: 0.05 }
    );

    // Should have RRIF minimum percentage
    expect(result.rrif_minimum_percentage).toBeDefined();
    expectCloseTo(result.rrif_minimum_percentage!, 0.0528, 0.0001);

    // Should withdraw RRIF minimum even though target is less
    expectCloseTo(result.withdrawals.rrsp_rrif, 26400, 10);
  });

  it('should handle year with zero balances', async () => {
    const balances: AccountBalances = {
      rrsp_rrif: 0,
      tfsa: 0,
      non_registered: 0,
      total: 0,
    };

    const result = await projectYearForward(
      mockClient,
      balances,
      70,
      2025,
      true,
      30000,
      {},
      { rrsp_rrif: 0.05, tfsa: 0.05, non_registered: 0.05 }
    );

    // All values should be zero
    expect(result.starting_balance.total).toBe(0);
    expect(result.ending_balance.total).toBe(0);
    expect(result.withdrawals.total).toBe(0);
  });
});

describe('shouldConvertToRRIF', () => {
  it('should return false for age below 71', () => {
    expect(shouldConvertToRRIF(70)).toBe(false);
    expect(shouldConvertToRRIF(60)).toBe(false);
    expect(shouldConvertToRRIF(50)).toBe(false);
  });

  it('should return true for age 71', () => {
    expect(shouldConvertToRRIF(71)).toBe(true);
  });

  it('should return true for age above 71', () => {
    expect(shouldConvertToRRIF(72)).toBe(true);
    expect(shouldConvertToRRIF(80)).toBe(true);
    expect(shouldConvertToRRIF(90)).toBe(true);
  });
});

describe('calculateTotalBalance', () => {
  it('should calculate total balance correctly', () => {
    const result = calculateTotalBalance(500000, 100000, 200000);

    expect(result.rrsp_rrif).toBe(500000);
    expect(result.tfsa).toBe(100000);
    expect(result.non_registered).toBe(200000);
    expect(result.total).toBe(800000);
  });

  it('should handle zero balances', () => {
    const result = calculateTotalBalance(0, 0, 0);

    expect(result.total).toBe(0);
  });

  it('should handle partial balances', () => {
    const result = calculateTotalBalance(250000, 0, 75000);

    expect(result.total).toBe(325000);
  });
});
