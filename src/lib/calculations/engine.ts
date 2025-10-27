/**
 * Main Retirement Calculation Engine
 *
 * Master orchestration function that combines all calculation modules:
 * - Tax calculations (federal + provincial)
 * - Government benefits (CPP + OAS)
 * - Account management (RRSP/RRIF/TFSA/Non-registered)
 * - Year-by-year simulation from present to longevity
 *
 * This is the primary entry point for retirement projections.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type {
  Scenario,
  YearByYearResult,
  CalculationResults,
} from '@/types/calculator';
import { calculateTotalTax, type IncomeSources } from './tax-calculator';
import { calculateCPP, calculateOAS } from './government-benefits';
import { projectYearForward, type AccountBalances } from './accounts';

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Run complete retirement calculation for a scenario
 *
 * This is the main orchestration function that:
 * 1. Projects accounts from current age to retirement (accumulation phase)
 * 2. Projects accounts from retirement to longevity (drawdown phase)
 * 3. Calculates taxes and net income for each year
 * 4. Calculates CPP and OAS when eligible
 * 5. Returns year-by-year breakdown and summary statistics
 *
 * The simulation runs year by year, carrying balances forward:
 * - Pre-retirement: Contribute + grow accounts
 * - Post-retirement: Withdraw + grow accounts, calculate taxes/benefits
 *
 * @param client - Supabase client for database queries
 * @param scenario - Complete retirement scenario inputs
 * @returns Detailed calculation results with year-by-year breakdown
 */
export async function calculateRetirementProjection(
  client: TypedSupabaseClient,
  scenario: Scenario
): Promise<CalculationResults> {
  const {
    basic_inputs,
    assets,
    income_sources,
    expenses,
    assumptions,
  } = scenario;

  const {
    current_age,
    retirement_age,
    longevity_age,
    province,
  } = basic_inputs;

  // Initialize year-by-year results
  const yearByYear: YearByYearResult[] = [];

  // Initialize account balances
  let currentBalances: AccountBalances = {
    rrsp_rrif: assets.rrsp?.balance || 0,
    tfsa: assets.tfsa?.balance || 0,
    non_registered: assets.non_registered?.balance || 0,
    total: (assets.rrsp?.balance || 0) + (assets.tfsa?.balance || 0) + (assets.non_registered?.balance || 0),
  };

  // Track cost basis for non-registered account (for capital gains calculation)
  let nonRegCostBasis = assets.non_registered?.balance || 0;

  // Calculate starting year
  const currentYear = new Date().getFullYear();

  // ==================================================
  // PHASE 1: PRE-RETIREMENT (Accumulation)
  // ==================================================

  // Calculate base CPP and OAS amounts (at start age, before inflation)
  // We calculate these upfront to apply consistent inflation indexing
  let baseCPPAmount = 0;
  let baseOASAmount = 0;
  let cppStartAge = income_sources.cpp?.start_age || 65;
  let oasStartAge = income_sources.oas?.start_age || 65;

  // Process other income sources (pensions, rental, etc.)
  // Store base amounts and start ages for each income source
  const otherIncomes: Array<{
    description: string;
    baseAmount: number;
    startAge: number;
    indexedToInflation: boolean;
  }> = [];

  if (income_sources.other_income) {
    for (const income of income_sources.other_income) {
      otherIncomes.push({
        description: income.description,
        baseAmount: income.annual_amount,
        startAge: income.start_age ?? retirement_age, // Default to retirement age if not specified
        indexedToInflation: income.indexed_to_inflation ?? true,
      });
    }
  }

  if (income_sources.cpp) {
    const cppCalc = await calculateCPP(
      client,
      income_sources.cpp.monthly_amount_at_65,
      income_sources.cpp.start_age
    );
    baseCPPAmount = cppCalc.annual_amount;
  }

  if (income_sources.oas) {
    const oasCalc = await calculateOAS(
      client,
      income_sources.oas.monthly_amount,
      income_sources.oas.start_age
    );
    baseOASAmount = oasCalc.annual_amount;
  }

  for (let age = current_age; age < retirement_age; age++) {
    const year = currentYear + (age - current_age);

    // Project account forward with contributions and pre-retirement returns
    const projection = await projectYearForward(
      client,
      currentBalances,
      age,
      year,
      false, // Not retired
      0, // No withdrawals
      {
        rrsp_rrif: assets.rrsp?.annual_contribution || 0,
        tfsa: assets.tfsa?.annual_contribution || 0,
        non_registered: assets.non_registered?.annual_contribution || 0,
      },
      {
        rrsp_rrif: assumptions.pre_retirement_return,
        tfsa: assumptions.pre_retirement_return,
        non_registered: assumptions.pre_retirement_return,
      },
      nonRegCostBasis
    );

    // Update cost basis for non-registered account
    nonRegCostBasis += assets.non_registered?.annual_contribution || 0;

    // Calculate government benefits that start before retirement (with inflation indexing)
    let cppIncome = 0;
    let oasIncome = 0;

    if (income_sources.cpp && age >= cppStartAge) {
      // Years since CPP started
      const yearsFromStart = age - cppStartAge;
      // Apply inflation indexing
      cppIncome = baseCPPAmount * Math.pow(1 + assumptions.inflation_rate, yearsFromStart);
    }

    if (income_sources.oas && age >= oasStartAge) {
      // Years since OAS started
      const yearsFromStart = age - oasStartAge;
      // Apply inflation indexing
      oasIncome = baseOASAmount * Math.pow(1 + assumptions.inflation_rate, yearsFromStart);
    }

    // Calculate other income (pensions, rental, etc.)
    let otherIncome = 0;
    for (const income of otherIncomes) {
      if (age >= income.startAge) {
        const yearsFromStart = age - income.startAge;
        if (income.indexedToInflation) {
          otherIncome += income.baseAmount * Math.pow(1 + assumptions.inflation_rate, yearsFromStart);
        } else {
          otherIncome += income.baseAmount;
        }
      }
    }

    // Calculate total income from government benefits + other income
    const totalIncome = cppIncome + oasIncome + otherIncome;

    // Create year result
    const yearResult: YearByYearResult = {
      year,
      age,
      balances: {
        rrsp_rrif: projection.ending_balance.rrsp_rrif,
        tfsa: projection.ending_balance.tfsa,
        non_registered: projection.ending_balance.non_registered,
        total: projection.ending_balance.total,
      },
      withdrawals: {
        rrsp_rrif: 0,
        tfsa: 0,
        non_registered: 0,
        total: 0,
      },
      income: {
        employment: 0,
        cpp: cppIncome,
        oas: oasIncome,
        other: otherIncome,
        investment: 0,
        total: totalIncome,
      },
      tax: {
        federal: 0,
        provincial: 0,
        total: 0,
        effective_rate: 0,
        marginal_rate: 0,
      },
      expenses: 0,
      net_cash_flow: 0,
    };

    yearByYear.push(yearResult);

    // Update current balances for next year
    currentBalances = projection.ending_balance;
  }

  // ==================================================
  // PHASE 2: RETIREMENT (Drawdown)
  // ==================================================

  // Calculate initial annual expenses
  let annualExpenses =
    expenses.fixed_monthly * 12 + (expenses.variable_annual || 0);

  // Note: baseCPPAmount, baseOASAmount, cppStartAge, oasStartAge
  // are already calculated in Phase 1 section above

  for (let age = retirement_age; age <= longevity_age; age++) {
    const year = currentYear + (age - current_age);

    // Apply inflation to expenses if configured
    if (expenses.indexed_to_inflation && age > retirement_age) {
      annualExpenses *= (1 + assumptions.inflation_rate);
    }

    // Check for age-based expense changes
    const ageChange = expenses.age_based_changes?.find(
      (change) => change.age === age
    );
    if (ageChange) {
      annualExpenses = ageChange.monthly_amount * 12;
    }

    // Calculate government benefits with inflation indexing
    let cppIncome = 0;
    let oasIncome = 0;

    if (income_sources.cpp && age >= cppStartAge) {
      // Years since CPP started
      const yearsFromStart = age - cppStartAge;
      // Apply inflation indexing: CPP increases each year with inflation
      cppIncome = baseCPPAmount * Math.pow(1 + assumptions.inflation_rate, yearsFromStart);
    }

    if (income_sources.oas && age >= oasStartAge) {
      // Years since OAS started
      const yearsFromStart = age - oasStartAge;
      // Apply inflation indexing: OAS increases each year with inflation
      oasIncome = baseOASAmount * Math.pow(1 + assumptions.inflation_rate, yearsFromStart);
    }

    // Calculate other income (pensions, rental, etc.)
    let otherIncome = 0;
    for (const income of otherIncomes) {
      if (age >= income.startAge) {
        const yearsFromStart = age - income.startAge;
        if (income.indexedToInflation) {
          otherIncome += income.baseAmount * Math.pow(1 + assumptions.inflation_rate, yearsFromStart);
        } else {
          otherIncome += income.baseAmount;
        }
      }
    }

    // Calculate total income from benefits + other income
    const governmentBenefits = cppIncome + oasIncome + otherIncome;

    // Determine how much to withdraw from portfolio
    const targetWithdrawal = Math.max(0, annualExpenses - governmentBenefits);

    // Project account forward with withdrawals and post-retirement returns
    const projection = await projectYearForward(
      client,
      currentBalances,
      age,
      year,
      true, // Retired
      targetWithdrawal,
      {}, // No contributions
      {
        rrsp_rrif: assumptions.post_retirement_return,
        tfsa: assumptions.post_retirement_return,
        non_registered: assumptions.post_retirement_return,
      },
      nonRegCostBasis
    );

    // Calculate taxable income sources
    const incomeSources: IncomeSources = {
      rrsp_rrif: projection.withdrawals.rrsp_rrif,
      tfsa: projection.withdrawals.tfsa, // Not taxable, but tracked
      capital_gains: projection.withdrawals.capital_gains,
      cpp: cppIncome,
      oas: oasIncome,
      other: otherIncome, // Pension and other income (fully taxable)
    };

    // Calculate taxes
    const taxCalc = await calculateTotalTax(
      client,
      incomeSources,
      province,
      age
    );

    // Calculate total income (including government benefits, other income, and investment income)
    const totalIncome = cppIncome + oasIncome + otherIncome;

    // Investment income from withdrawals (for reporting purposes)
    const investmentIncome =
      projection.withdrawals.rrsp_rrif +
      projection.withdrawals.tfsa +
      projection.withdrawals.non_registered;

    // Net cashflow = income + withdrawals - expenses - taxes
    const netCashflow = totalIncome + investmentIncome - annualExpenses - taxCalc.total_tax;

    // Create year result
    const yearResult: YearByYearResult = {
      year,
      age,
      balances: {
        rrsp_rrif: projection.ending_balance.rrsp_rrif,
        tfsa: projection.ending_balance.tfsa,
        non_registered: projection.ending_balance.non_registered,
        total: projection.ending_balance.total,
      },
      withdrawals: {
        rrsp_rrif: projection.withdrawals.rrsp_rrif,
        tfsa: projection.withdrawals.tfsa,
        non_registered: projection.withdrawals.non_registered,
        total: projection.withdrawals.total,
      },
      income: {
        employment: 0,
        cpp: cppIncome,
        oas: oasIncome,
        other: otherIncome,
        investment: investmentIncome,
        total: totalIncome + investmentIncome,
      },
      tax: {
        federal: taxCalc.federal.total,
        provincial: taxCalc.provincial.total,
        total: taxCalc.total_tax,
        effective_rate: taxCalc.taxable_income.total > 0
          ? taxCalc.total_tax / taxCalc.taxable_income.total
          : 0,
        marginal_rate: taxCalc.combined_marginal_rate,
      },
      expenses: annualExpenses,
      net_cash_flow: netCashflow,
    };

    yearByYear.push(yearResult);

    // Update current balances for next year
    currentBalances = projection.ending_balance;

    // Update cost basis if we sold from non-registered
    if (projection.withdrawals.non_registered > 0) {
      // Reduce cost basis proportionally
      const withdrawalRatio =
        projection.withdrawals.non_registered / currentBalances.non_registered;
      nonRegCostBasis = Math.max(0, nonRegCostBasis * (1 - withdrawalRatio));
    }

    // Check for portfolio depletion
    if (currentBalances.total <= 0) {
      // Portfolio depleted - this is important for success metrics
      break;
    }
  }

  // ==================================================
  // CALCULATE SUMMARY STATISTICS
  // ==================================================

  const retirementYears = yearByYear.filter((y) => y.age >= retirement_age);

  // Calculate success metrics
  const portfolioDepletedAge = yearByYear.find(
    (y) => y.balances.total <= 0
  )?.age;
  const success = !portfolioDepletedAge || portfolioDepletedAge > longevity_age;

  // Average tax rate in retirement
  const avgTaxInRetirement =
    retirementYears.length > 0
      ? retirementYears.reduce((sum, y) => sum + y.tax.total, 0) /
        retirementYears.reduce((sum, y) => sum + y.income.total, 0)
      : 0;

  // Total taxes paid in retirement
  const totalTaxesPaid = retirementYears.reduce(
    (sum, y) => sum + y.tax.total,
    0
  );

  // Total government benefits received
  const totalBenefitsReceived = retirementYears.reduce(
    (sum, y) => sum + y.income.cpp + y.income.oas,
    0
  );

  // Final portfolio value
  const finalPortfolioValue =
    yearByYear[yearByYear.length - 1]?.balances.total || 0;

  // First year retirement income
  const firstYearRetirementIncome =
    retirementYears[0]?.income.total || 0;

  // Return complete results
  return {
    scenario_name: scenario.name,
    success,
    final_portfolio_value: finalPortfolioValue,
    portfolio_depleted_age: portfolioDepletedAge,
    first_year_retirement_income: firstYearRetirementIncome,
    average_tax_rate_in_retirement: avgTaxInRetirement,
    total_taxes_paid_in_retirement: totalTaxesPaid,
    total_cpp_received: retirementYears.reduce(
      (sum, y) => sum + y.income.cpp,
      0
    ),
    total_oas_received: retirementYears.reduce(
      (sum, y) => sum + y.income.oas,
      0
    ),
    year_by_year: yearByYear,
  };
}

/**
 * Compare multiple scenarios side-by-side
 *
 * Runs calculations for multiple scenarios and returns results for comparison.
 * Useful for "what-if" analysis (e.g., retiring at 60 vs 65, different spending levels).
 *
 * @param client - Supabase client for database queries
 * @param scenarios - Array of scenarios to compare
 * @returns Array of calculation results, one per scenario
 */
export async function compareScenarios(
  client: TypedSupabaseClient,
  scenarios: Scenario[]
): Promise<CalculationResults[]> {
  const results: CalculationResults[] = [];

  for (const scenario of scenarios) {
    const result = await calculateRetirementProjection(client, scenario);
    results.push(result);
  }

  return results;
}
