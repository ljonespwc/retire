/**
 * Test fixtures and sample data for testing
 */

import type {
  Scenario,
  BasicInputs,
  Assets,
  IncomeSources,
  Expenses,
  Assumptions,
  TaxBracket,
} from '@/types';
import { Province } from '@/types/constants';

/**
 * Sample basic inputs
 */
export const sampleBasicInputs: BasicInputs = {
  current_age: 58,
  retirement_age: 62,
  longevity_age: 90,
  province: Province.ON,
};

/**
 * Sample assets - modest retirement savings
 */
export const sampleModestAssets: Assets = {
  rrsp: {
    balance: 500000,
    annual_contribution: 20000,
    rate_of_return: 0.06,
  },
  tfsa: {
    balance: 100000,
    annual_contribution: 7000,
    rate_of_return: 0.05,
  },
  non_registered: {
    balance: 200000,
    annual_contribution: 0,
    rate_of_return: 0.06,
  },
};

/**
 * Sample assets - substantial retirement savings
 */
export const sampleSubstantialAssets: Assets = {
  rrsp: {
    balance: 8000000,
    annual_contribution: 31560, // 2025 RRSP limit
    rate_of_return: 0.06,
  },
  tfsa: {
    balance: 200000,
    annual_contribution: 7000, // 2025 TFSA limit
    rate_of_return: 0.05,
  },
  non_registered: {
    balance: 2000000,
    annual_contribution: 50000,
    rate_of_return: 0.07,
  },
};

/**
 * Sample income sources
 */
export const sampleIncomeSources: IncomeSources = {
  cpp: {
    start_age: 65,
    monthly_amount_at_65: 758, // Average CPP 2025: $9,100/year
  },
  oas: {
    start_age: 65,
    monthly_amount: 713, // Max OAS 2025: $8,560/year
  },
};

/**
 * Sample expenses
 */
export const sampleExpenses: Expenses = {
  fixed_monthly: 2500,
  variable_annual: 10000,
  indexed_to_inflation: true,
  age_based_changes: [],
};

/**
 * Sample assumptions
 */
export const sampleAssumptions: Assumptions = {
  pre_retirement_return: 0.06,
  post_retirement_return: 0.05,
  inflation_rate: 0.025,
};

/**
 * Complete sample scenario - Modest savings
 */
export const sampleScenarioModest: Scenario = {
  name: 'Modest Retirement Plan',
  basic_inputs: sampleBasicInputs,
  assets: sampleModestAssets,
  income_sources: sampleIncomeSources,
  expenses: sampleExpenses,
  assumptions: sampleAssumptions,
};

/**
 * Complete sample scenario - Substantial savings
 */
export const sampleScenarioSubstantial: Scenario = {
  name: 'Substantial Retirement Plan',
  basic_inputs: {
    ...sampleBasicInputs,
    current_age: 55,
    retirement_age: 60,
  },
  assets: sampleSubstantialAssets,
  income_sources: sampleIncomeSources,
  expenses: {
    ...sampleExpenses,
    fixed_monthly: 10000,
    variable_annual: 50000,
  },
  assumptions: sampleAssumptions,
};

/**
 * Sample 2025 federal tax brackets
 */
export const sample2025FederalBrackets: TaxBracket[] = [
  { limit: 55867, rate: 0.15 },
  { limit: 111733, rate: 0.205 },
  { limit: 173205, rate: 0.26 },
  { limit: 246752, rate: 0.29 },
  { limit: null, rate: 0.33 },
];

/**
 * Sample 2025 Ontario provincial tax brackets
 */
export const sample2025OntarioBrackets: TaxBracket[] = [
  { limit: 51446, rate: 0.0505 },
  { limit: 102894, rate: 0.0915 },
  { limit: 150000, rate: 0.1116 },
  { limit: 220000, rate: 0.1216 },
  { limit: null, rate: 0.1316 },
];

/**
 * Sample CPP amounts for 2025
 */
export const sample2025CPPAmounts = {
  max_annual: 16375,
  average_annual: 9100,
  max_monthly: 1364.58,
  average_monthly: 758.33,
  ympe: 68500, // Year's Maximum Pensionable Earnings
  basic_exemption: 3500,
  contribution_rate: 0.0595,
};

/**
 * Sample OAS amounts for 2025
 */
export const sample2025OASAmounts = {
  max_annual: 8560,
  max_monthly: 713.33,
  clawback_threshold: 86912,
  clawback_rate: 0.15,
  full_clawback_income: 143540,
};

/**
 * Sample RRIF minimum percentages (subset)
 */
export const sampleRRIFMinimums: Record<number, number> = {
  71: 0.0528,
  72: 0.054,
  73: 0.0553,
  74: 0.0567,
  75: 0.0582,
  80: 0.0682,
  85: 0.0854,
  90: 0.1111,
  95: 0.2,
};

/**
 * Mock Supabase client for testing
 * Returns sample data without making real database calls
 */
export const createMockSupabaseClient = () => {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          order: (orderColumn: string, options?: any) => ({
            data:
              table === 'federal_tax_brackets'
                ? sample2025FederalBrackets.map((b, i) => ({
                    income_limit: b.limit,
                    rate: b.rate,
                    bracket_index: i,
                  }))
                : table === 'provincial_tax_brackets'
                  ? sample2025OntarioBrackets.map((b, i) => ({
                      income_limit: b.limit,
                      rate: b.rate,
                      bracket_index: i,
                      province_code: 'ON',
                    }))
                  : [],
            error: null,
          }),
          single: () => ({
            data:
              table === 'government_benefits' && value === 'CPP'
                ? { data: sample2025CPPAmounts }
                : table === 'government_benefits' && value === 'OAS'
                  ? { data: sample2025OASAmounts }
                  : null,
            error: null,
          }),
        }),
      }),
    }),
  } as any;
};
