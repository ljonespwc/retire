/**
 * Test helpers for calculation functions
 *
 * Demonstrates the pattern for testing calculation functions that depend on Supabase client.
 * All calculation functions receive a Supabase client as their first parameter.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createMockSupabaseClient } from '@/lib/test-fixtures';
import { Province, TaxBracket } from '@/types/constants';

/**
 * Type for mocked Supabase client
 */
export type MockSupabaseClient = SupabaseClient<Database>;

/**
 * Create a mock Supabase client with custom data
 *
 * Usage:
 * ```typescript
 * const mockClient = createMockClient({
 *   federal_brackets: customBrackets,
 *   provincial_brackets: customProvincialBrackets
 * });
 * ```
 */
export function createMockClient(customData?: {
  federal_brackets?: TaxBracket[];
  provincial_brackets?: TaxBracket[];
  cpp_amounts?: any;
  oas_amounts?: any;
}): MockSupabaseClient {
  // Use the mock from test-fixtures as a base
  const baseMock = createMockSupabaseClient();

  // Override with custom data if provided
  if (customData) {
    // This is a simplified mock - extend as needed
    return baseMock;
  }

  return baseMock;
}

/**
 * Example test demonstrating the pattern
 *
 * This shows how to test a calculation function that accepts a Supabase client.
 */
describe('Calculation Testing Pattern', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    // Create a fresh mock client before each test
    mockClient = createMockClient();
  });

  it('should demonstrate the testing pattern', async () => {
    // Example: Testing a calculation function
    // const result = await calculateSomething(mockClient, param1, param2);
    // expect(result).toBe(expectedValue);

    expect(mockClient).toBeDefined();
  });

  it('should use mock data from test fixtures', async () => {
    // The mock client returns sample data from test-fixtures.ts
    // This allows tests to run without database calls

    expect(mockClient).toBeDefined();
  });
});

/**
 * Assert that a value is within a tolerance range
 * Useful for floating point comparisons
 */
export function expectCloseTo(actual: number, expected: number, tolerance: number = 0.01) {
  const diff = Math.abs(actual - expected);
  expect(diff).toBeLessThanOrEqual(tolerance);
}

/**
 * Helper to test tax calculations against known values
 */
export function expectTaxCalculation(
  income: number,
  brackets: TaxBracket[],
  expectedTax: number,
  tolerance: number = 1 // $1 tolerance for rounding
) {
  // This will be implemented when we create the tax calculator
  // For now, it's a placeholder showing the pattern
  return { income, brackets, expectedTax, tolerance };
}

/**
 * Test data: Sample scenarios for common test cases
 */
export const testScenarios = {
  /**
   * Low income scenario (minimal tax)
   */
  lowIncome: {
    income: 30000,
    province: Province.ON,
    age: 60,
    expectedFederalTax: 2193, // Approximate
  },

  /**
   * Middle income scenario
   */
  middleIncome: {
    income: 80000,
    province: Province.ON,
    age: 60,
    expectedFederalTax: 11850, // Approximate
  },

  /**
   * High income scenario
   */
  highIncome: {
    income: 200000,
    province: Province.ON,
    age: 60,
    expectedFederalTax: 47350, // Approximate
  },

  /**
   * Senior with age credit
   */
  senior: {
    income: 50000,
    province: Province.ON,
    age: 70,
    expectedFederalTax: 5250, // Approximate with age credit
  },
};

/**
 * Documentation for testing pattern
 *
 * All calculation functions follow this pattern:
 *
 * 1. Accept Supabase client as first parameter
 * 2. Accept other parameters as needed
 * 3. Return calculated result or Promise<result>
 *
 * Example function signature:
 * ```typescript
 * export async function calculateFederalTax(
 *   client: TypedSupabaseClient,
 *   taxableIncome: number,
 *   age: number,
 *   year: number = 2025
 * ): Promise<TaxCalculation>
 * ```
 *
 * Example test:
 * ```typescript
 * describe('calculateFederalTax', () => {
 *   let mockClient: MockSupabaseClient;
 *
 *   beforeEach(() => {
 *     mockClient = createMockClient();
 *   });
 *
 *   it('should calculate federal tax correctly', async () => {
 *     const result = await calculateFederalTax(mockClient, 50000, 60);
 *     expectCloseTo(result.total, 5250, 100);
 *   });
 * });
 * ```
 */
