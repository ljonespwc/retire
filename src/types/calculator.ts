/**
 * Core calculation types for the retirement income calculator
 * These types define the structure of inputs, outputs, and intermediate calculations
 */

import { Province } from './constants';

/**
 * Basic user inputs for retirement planning
 */
export interface BasicInputs {
  /** Current age of the user */
  current_age: number;
  /** Age at which user plans to retire */
  retirement_age: number;
  /** Age until which to plan (life expectancy) */
  longevity_age: number;
  /** Canadian province for tax calculations */
  province: Province;
}

/**
 * Details for a registered account (RRSP/RRIF)
 */
export interface RegisteredAccountDetails {
  /** Current balance in the account */
  balance: number;
  /** Annual contribution amount (pre-retirement only) */
  annual_contribution?: number;
  /** Annual rate of return (as decimal, e.g., 0.06 for 6%) */
  rate_of_return: number;
}

/**
 * Details for a TFSA account
 */
export interface TFSADetails {
  /** Current balance in the account */
  balance: number;
  /** Annual contribution amount */
  annual_contribution?: number;
  /** Annual rate of return (as decimal, e.g., 0.06 for 6%) */
  rate_of_return: number;
}

/**
 * Details for non-registered investment accounts
 */
export interface NonRegisteredDetails {
  /** Current balance in the account */
  balance: number;
  /** Annual contribution amount */
  annual_contribution?: number;
  /** Annual rate of return (as decimal, e.g., 0.06 for 6%) */
  rate_of_return: number;
  /** Average cost base (for capital gains calculations) */
  cost_base?: number;
}

/**
 * All user assets across account types
 */
export interface Assets {
  /** Registered Retirement Savings Plan */
  rrsp?: RegisteredAccountDetails;
  /** Tax-Free Savings Account */
  tfsa?: TFSADetails;
  /** Non-registered investment accounts */
  non_registered?: NonRegisteredDetails;
}

/**
 * CPP (Canada Pension Plan) details
 */
export interface CPPDetails {
  /** Age at which to start receiving CPP (60-70) */
  start_age: number;
  /** Expected monthly CPP amount at age 65 */
  monthly_amount_at_65: number;
}

/**
 * OAS (Old Age Security) details
 */
export interface OASDetails {
  /** Age at which to start receiving OAS (65-70) */
  start_age: number;
  /** Expected monthly OAS amount */
  monthly_amount: number;
}

/**
 * Employment income details
 */
export interface EmploymentIncome {
  /** Annual employment income */
  annual_amount: number;
  /** Age at which employment income stops (retirement age) */
  until_age: number;
}

/**
 * Other income sources (pensions, rental income, etc.)
 */
export interface OtherIncome {
  /** Description of income source */
  description: string;
  /** Annual amount */
  annual_amount: number;
  /** Age at which income starts */
  start_age?: number;
  /** Age at which income ends */
  end_age?: number;
  /** Whether income is indexed to inflation */
  indexed_to_inflation?: boolean;
}

/**
 * All income sources
 */
export interface IncomeSources {
  /** Employment income */
  employment?: EmploymentIncome;
  /** Canada Pension Plan */
  cpp?: CPPDetails;
  /** Old Age Security */
  oas?: OASDetails;
  /** Other income sources (pensions, rental, etc.) */
  other_income?: OtherIncome[];
}

/**
 * Age-based expense changes (e.g., travel spending in early retirement)
 */
export interface AgeBasedExpenseChange {
  /** Age at which change takes effect */
  age: number;
  /** New monthly amount */
  monthly_amount: number;
}

/**
 * Annual expenses and spending
 */
export interface Expenses {
  /** Fixed monthly expenses */
  fixed_monthly: number;
  /** Variable annual expenses (travel, gifts, etc.) */
  variable_annual?: number;
  /** Whether expenses are indexed to inflation */
  indexed_to_inflation: boolean;
  /** Age-based changes to spending patterns */
  age_based_changes?: AgeBasedExpenseChange[];
}

/**
 * Financial planning assumptions
 */
export interface Assumptions {
  /** Expected rate of return before retirement (as decimal) */
  pre_retirement_return: number;
  /** Expected rate of return after retirement (as decimal) */
  post_retirement_return: number;
  /** Expected inflation rate (as decimal) */
  inflation_rate: number;
  /** Marginal tax rate override (optional, otherwise calculated) */
  marginal_tax_rate?: number;
}

/**
 * Account balances for a specific year
 */
export interface YearlyBalances {
  /** RRSP/RRIF balance at end of year */
  rrsp_rrif: number;
  /** TFSA balance at end of year */
  tfsa: number;
  /** Non-registered balance at end of year */
  non_registered: number;
  /** Total portfolio value */
  total: number;
}

/**
 * Withdrawals from accounts for a specific year
 */
export interface YearlyWithdrawals {
  /** RRIF minimum withdrawal (if applicable) */
  rrif_minimum?: number;
  /** Actual RRSP/RRIF withdrawal */
  rrsp_rrif: number;
  /** TFSA withdrawal */
  tfsa: number;
  /** Non-registered withdrawal */
  non_registered: number;
  /** Total withdrawals */
  total: number;
}

/**
 * Income breakdown for a specific year
 */
export interface YearlyIncome {
  /** Employment income */
  employment: number;
  /** CPP income */
  cpp: number;
  /** OAS income */
  oas: number;
  /** Other pension/income */
  other: number;
  /** Investment income (interest, dividends, capital gains) */
  investment: number;
  /** Total income */
  total: number;
}

/**
 * Tax breakdown for a specific year
 */
export interface YearlyTax {
  /** Federal tax */
  federal: number;
  /** Provincial tax */
  provincial: number;
  /** Total tax */
  total: number;
  /** Effective tax rate */
  effective_rate: number;
}

/**
 * Year-by-year calculation results
 */
export interface YearByYearResult {
  /** Age of user during this year */
  age: number;
  /** Calendar year */
  year: number;
  /** Account balances */
  balances: YearlyBalances;
  /** Withdrawals from accounts */
  withdrawals: YearlyWithdrawals;
  /** Income breakdown */
  income: YearlyIncome;
  /** Tax breakdown */
  tax: YearlyTax;
  /** Total expenses for the year */
  expenses: number;
  /** Net cash flow (income - tax - expenses) */
  net_cash_flow: number;
}

/**
 * Summary statistics for the entire retirement plan
 */
export interface CalculationSummary {
  /** Total portfolio value at retirement */
  portfolio_at_retirement: number;
  /** Total portfolio value at end of plan */
  portfolio_at_end: number;
  /** Years until portfolio depletion (if applicable) */
  years_until_depletion?: number;
  /** Total tax paid over retirement */
  total_tax_paid: number;
  /** Average annual income in retirement */
  average_annual_income: number;
  /** Average effective tax rate in retirement */
  average_tax_rate: number;
  /** Whether plan is sustainable (portfolio doesn't deplete) */
  is_sustainable: boolean;
}

/**
 * Chart data point for visualizations
 */
export interface ChartDataPoint {
  /** Age or year label */
  label: string;
  /** Data value */
  value: number;
  /** Optional category for stacked charts */
  category?: string;
}

/**
 * Chart data for visualizations
 */
export interface ChartData {
  /** Portfolio balance over time */
  portfolio_balance: ChartDataPoint[];
  /** Income composition over time */
  income_composition: ChartDataPoint[];
  /** Tax impact over time */
  tax_impact: ChartDataPoint[];
  /** Withdrawal strategy over time */
  withdrawal_strategy: ChartDataPoint[];
}

/**
 * Complete calculation results
 */
export interface CalculationResults {
  /** Scenario name */
  scenario_name: string;
  /** Whether the retirement plan is successful (portfolio lasts until longevity age) */
  success: boolean;
  /** Final portfolio value at end of simulation */
  final_portfolio_value: number;
  /** Age at which portfolio is depleted (if applicable) */
  portfolio_depleted_age?: number;
  /** First year retirement income */
  first_year_retirement_income: number;
  /** Average tax rate in retirement */
  average_tax_rate_in_retirement: number;
  /** Total taxes paid in retirement */
  total_taxes_paid_in_retirement: number;
  /** Total CPP received over retirement */
  total_cpp_received: number;
  /** Total OAS received over retirement */
  total_oas_received: number;
  /** Year-by-year detailed results */
  year_by_year: YearByYearResult[];
}

/**
 * Complete scenario combining inputs and results
 */
export interface Scenario {
  /** Scenario ID (from database) */
  id?: string;
  /** Scenario name */
  name: string;
  /** Basic inputs */
  basic_inputs: BasicInputs;
  /** Asset details */
  assets: Assets;
  /** Income sources */
  income_sources: IncomeSources;
  /** Expenses */
  expenses: Expenses;
  /** Assumptions */
  assumptions: Assumptions;
  /** Calculation results (populated after calculation) */
  results?: CalculationResults;
  /** Created timestamp */
  created_at?: string;
  /** Updated timestamp */
  updated_at?: string;
}
