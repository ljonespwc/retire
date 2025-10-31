/**
 * Canadian Tax Calculation Engine
 *
 * Accurate federal and provincial tax calculations based on CRA rules.
 * All functions accept Supabase client as first parameter for database-backed tax data.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { TaxBracket, Province } from '@/types/constants';
import {
  getFederalTaxBrackets,
  getProvincialTaxBrackets,
  getBasicPersonalAmount,
  getProvincialBasicPersonalAmount,
  getAgeAmount,
  getProvincialAgeAmount,
} from '@/lib/supabase/tax-data';

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Tax calculation result with detailed breakdown
 */
export interface TaxCalculation {
  /** Total tax amount */
  total: number;
  /** Tax before credits */
  gross_tax: number;
  /** Total non-refundable credits */
  credits: number;
  /** Marginal tax rate (as decimal) */
  marginal_rate: number;
  /** Average tax rate (as decimal) */
  average_rate: number;
  /** Details by bracket */
  bracket_details?: {
    bracket_index: number;
    income_in_bracket: number;
    rate: number;
    tax_in_bracket: number;
  }[];
}

/**
 * Detailed tax breakdown for a complete scenario
 */
export interface DetailedTaxBreakdown {
  /** Total combined tax (federal + provincial) */
  total_tax: number;
  /** Federal tax calculation */
  federal: TaxCalculation;
  /** Provincial tax calculation */
  provincial: TaxCalculation;
  /** OAS clawback amount (if applicable) */
  oas_clawback: number;
  /** Combined marginal rate */
  combined_marginal_rate: number;
  /** Taxable income breakdown */
  taxable_income: TaxableIncomeBreakdown;
}

/**
 * Breakdown of taxable income by source
 */
export interface TaxableIncomeBreakdown {
  /** Total taxable income */
  total: number;
  /** From RRSP/RRIF withdrawals (100% taxable) */
  rrsp_rrif: number;
  /** From non-registered accounts (capital gains at 50% inclusion) */
  capital_gains: number;
  /** From Canadian dividends (with gross-up) */
  canadian_dividends: number;
  /** From CPP */
  cpp: number;
  /** From OAS */
  oas: number;
  /** From employment */
  employment: number;
  /** From pension (100% taxable) */
  pension: number;
  /** Other taxable income (rental, etc.) */
  other: number;
}

/**
 * Income source amounts for tax calculation
 */
export interface IncomeSources {
  rrsp_rrif?: number;
  tfsa?: number; // Not taxable, but tracked
  non_registered?: number;
  capital_gains?: number;
  canadian_dividends?: number;
  cpp?: number;
  oas?: number;
  employment?: number;
  pension?: number;
  other?: number;
}

/**
 * Calculate progressive tax using bracket structure
 *
 * This is a pure function that implements progressive taxation.
 * Each dollar is taxed at the rate of its bracket.
 *
 * @param income - Total taxable income
 * @param brackets - Tax brackets (must be sorted by limit ascending)
 * @returns Object with total tax and bracket-by-bracket details
 */
export function calculateProgressiveTax(
  income: number,
  brackets: TaxBracket[]
): { total: number; details: TaxCalculation['bracket_details']; marginal_rate: number } {
  if (income <= 0) {
    return { total: 0, details: [], marginal_rate: 0 };
  }

  let remainingIncome = income;
  let totalTax = 0;
  let marginalRate = 0;
  const details: NonNullable<TaxCalculation['bracket_details']> = [];

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const previousLimit = i > 0 ? (brackets[i - 1].limit || 0) : 0;
    const currentLimit = bracket.limit;

    // Determine how much income falls in this bracket
    let incomeInBracket: number;

    if (currentLimit === null) {
      // Highest bracket (no upper limit)
      incomeInBracket = remainingIncome;
    } else {
      const bracketSize = currentLimit - previousLimit;
      incomeInBracket = Math.min(remainingIncome, bracketSize);
    }

    if (incomeInBracket <= 0) {
      break;
    }

    const taxInBracket = incomeInBracket * bracket.rate;
    totalTax += taxInBracket;
    marginalRate = bracket.rate;

    details.push({
      bracket_index: i,
      income_in_bracket: incomeInBracket,
      rate: bracket.rate,
      tax_in_bracket: taxInBracket,
    });

    remainingIncome -= incomeInBracket;

    if (remainingIncome <= 0) {
      break;
    }
  }

  return { total: totalTax, details, marginal_rate: marginalRate };
}

/**
 * Calculate federal tax for a given taxable income
 *
 * Applies 2025 federal tax brackets and non-refundable credits:
 * - Basic Personal Amount ($15,705)
 * - Age Amount (age 65+, income-tested)
 *
 * @param client - Supabase client for database queries
 * @param taxableIncome - Total taxable income
 * @param age - Person's age (for age credit eligibility)
 * @param year - Tax year (defaults to 2025)
 * @returns Detailed federal tax calculation
 */
export async function calculateFederalTax(
  client: TypedSupabaseClient,
  taxableIncome: number,
  age: number,
  year: number = 2025
): Promise<TaxCalculation> {
  // Get federal tax brackets from database
  const { data: brackets, error } = await getFederalTaxBrackets(client, year);

  if (error || !brackets) {
    throw new Error(`Failed to fetch federal tax brackets: ${error?.message}`);
  }

  // Calculate gross tax using progressive brackets
  const { total: grossTax, details, marginal_rate } = calculateProgressiveTax(
    taxableIncome,
    brackets
  );

  // Calculate non-refundable tax credits
  let totalCredits = 0;

  // Basic Personal Amount (everyone gets this)
  const basicPersonalAmount = await getBasicPersonalAmount(client, year);
  const basicPersonalCredit = basicPersonalAmount * 0.15; // Lowest federal rate
  totalCredits += basicPersonalCredit;

  // Age Amount (age 65+, income-tested)
  if (age >= 65) {
    const ageAmountData = await getAgeAmount(client, year);

    if (taxableIncome <= ageAmountData.income_threshold) {
      // Full age amount
      const ageCredit = ageAmountData.max_credit * 0.15;
      totalCredits += ageCredit;
    } else {
      // Reduced age amount
      const incomeOver = taxableIncome - ageAmountData.income_threshold;
      const reduction = incomeOver * ageAmountData.reduction_rate;
      const reducedAgeAmount = Math.max(0, ageAmountData.max_credit - reduction);
      const ageCredit = reducedAgeAmount * 0.15;
      totalCredits += ageCredit;
    }
  }

  // Net federal tax (cannot be negative)
  const netTax = Math.max(0, grossTax - totalCredits);

  return {
    total: netTax,
    gross_tax: grossTax,
    credits: totalCredits,
    marginal_rate,
    average_rate: taxableIncome > 0 ? netTax / taxableIncome : 0,
    bracket_details: details,
  };
}

/**
 * Calculate provincial tax for a given taxable income
 *
 * Applies provincial tax brackets and non-refundable credits:
 * - Provincial Basic Personal Amount (varies by province)
 * - Provincial Age Amount (if available, varies by province)
 *
 * @param client - Supabase client for database queries
 * @param taxableIncome - Total taxable income
 * @param province - Province/territory code
 * @param age - Person's age (for age credit eligibility)
 * @param year - Tax year (defaults to 2025)
 * @returns Detailed provincial tax calculation
 */
export async function calculateProvincialTax(
  client: TypedSupabaseClient,
  taxableIncome: number,
  province: Province,
  age: number,
  year: number = 2025
): Promise<TaxCalculation> {
  // Get provincial tax brackets from database
  const { data: brackets, error } = await getProvincialTaxBrackets(client, province, year);

  if (error || !brackets) {
    throw new Error(`Failed to fetch ${province} tax brackets: ${error?.message}`);
  }

  // Calculate gross tax using progressive brackets
  const { total: grossTax, details, marginal_rate } = calculateProgressiveTax(
    taxableIncome,
    brackets
  );

  // Calculate non-refundable tax credits
  let totalCredits = 0;

  // Provincial Basic Personal Amount
  const provincialBasicAmount = await getProvincialBasicPersonalAmount(client, province, year);
  if (provincialBasicAmount > 0) {
    // Use lowest provincial rate for credit calculation
    const lowestRate = brackets[0]?.rate || 0;
    const basicCredit = provincialBasicAmount * lowestRate;
    totalCredits += basicCredit;
  }

  // Provincial Age Amount (if available)
  if (age >= 65) {
    const provincialAgeData = await getProvincialAgeAmount(client, province, year);

    if (provincialAgeData) {
      const lowestRate = brackets[0]?.rate || 0;

      if (taxableIncome <= provincialAgeData.income_threshold) {
        // Full provincial age amount
        const ageCredit = provincialAgeData.max_credit * lowestRate;
        totalCredits += ageCredit;
      } else {
        // Reduced provincial age amount
        const incomeOver = taxableIncome - provincialAgeData.income_threshold;
        const reduction = incomeOver * provincialAgeData.reduction_rate;
        const reducedAgeAmount = Math.max(0, provincialAgeData.max_credit - reduction);
        const ageCredit = reducedAgeAmount * lowestRate;
        totalCredits += ageCredit;
      }
    }
  }

  // Net provincial tax (cannot be negative)
  const netTax = Math.max(0, grossTax - totalCredits);

  return {
    total: netTax,
    gross_tax: grossTax,
    credits: totalCredits,
    marginal_rate,
    average_rate: taxableIncome > 0 ? netTax / taxableIncome : 0,
    bracket_details: details,
  };
}

/**
 * Calculate taxable income from various income sources
 *
 * Different income sources have different tax treatments:
 * - RRSP/RRIF: 100% taxable
 * - TFSA: 0% taxable (tax-free)
 * - Capital gains: 50% inclusion rate
 * - Canadian dividends: Gross-up and dividend tax credit (simplified)
 * - CPP, OAS, Employment: 100% taxable
 *
 * @param sources - Income amounts from various sources
 * @returns Breakdown of taxable income
 */
export function calculateTaxableIncome(sources: IncomeSources): TaxableIncomeBreakdown {
  const breakdown: TaxableIncomeBreakdown = {
    total: 0,
    rrsp_rrif: sources.rrsp_rrif || 0,
    capital_gains: (sources.capital_gains || 0) * 0.5, // 50% inclusion
    canadian_dividends: (sources.canadian_dividends || 0) * 1.38, // Gross-up
    cpp: sources.cpp || 0,
    oas: sources.oas || 0,
    employment: sources.employment || 0,
    pension: sources.pension || 0,
    other: sources.other || 0,
  };

  breakdown.total =
    breakdown.rrsp_rrif +
    breakdown.capital_gains +
    breakdown.canadian_dividends +
    breakdown.cpp +
    breakdown.oas +
    breakdown.employment +
    breakdown.pension +
    breakdown.other;

  return breakdown;
}

/**
 * Calculate OAS clawback (recovery tax)
 *
 * OAS is clawed back at 15% for income above the threshold.
 * The threshold for 2025 is $86,912.
 * OAS is fully clawed back when income reaches approximately $143,540.
 *
 * @param grossIncome - Total income before OAS clawback
 * @param oasAmount - Annual OAS amount received
 * @returns Amount of OAS to be clawed back
 */
export function calculateOASClawback(grossIncome: number, oasAmount: number): number {
  const threshold = 86912; // 2025 threshold
  const clawbackRate = 0.15;

  if (grossIncome <= threshold) {
    return 0;
  }

  const incomeOverThreshold = grossIncome - threshold;
  const clawback = incomeOverThreshold * clawbackRate;

  // Clawback cannot exceed total OAS received
  return Math.min(clawback, oasAmount);
}

/**
 * Calculate total tax for a complete income scenario
 *
 * This is the main tax calculation function that combines:
 * - Federal tax with credits
 * - Provincial tax with credits
 * - OAS clawback
 *
 * @param client - Supabase client for database queries
 * @param incomeSources - All income sources
 * @param province - Province/territory
 * @param age - Person's age
 * @param year - Tax year (defaults to 2025)
 * @returns Complete tax breakdown
 */
export async function calculateTotalTax(
  client: TypedSupabaseClient,
  incomeSources: IncomeSources,
  province: Province,
  age: number,
  year: number = 2025
): Promise<DetailedTaxBreakdown> {
  // Calculate taxable income
  const taxableIncome = calculateTaxableIncome(incomeSources);

  // Calculate federal tax
  const federalTax = await calculateFederalTax(client, taxableIncome.total, age, year);

  // Calculate provincial tax
  const provincialTax = await calculateProvincialTax(
    client,
    taxableIncome.total,
    province,
    age,
    year
  );

  // Calculate OAS clawback if OAS is received
  const oasClawback = incomeSources.oas
    ? calculateOASClawback(taxableIncome.total, incomeSources.oas)
    : 0;

  // Total tax including clawback
  const totalTax = federalTax.total + provincialTax.total + oasClawback;

  return {
    total_tax: totalTax,
    federal: federalTax,
    provincial: provincialTax,
    oas_clawback: oasClawback,
    combined_marginal_rate: federalTax.marginal_rate + provincialTax.marginal_rate,
    taxable_income: taxableIncome,
  };
}
