/**
 * Test script: Validate gross-up fix for withdrawal calculations
 *
 * Runs the calculation engine on the "Retirement Plan - Pension" scenario
 * and compares net income vs expenses to verify the fix works.
 *
 * Usage: npx tsx src/scripts/test-gross-up.ts
 */

import { createClient } from '@supabase/supabase-js';
import { calculateRetirementProjection } from '../lib/calculations/engine';
import type { Database } from '../types/database';
import type { Scenario } from '../types/calculator';
import { Province } from '../types/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  const client = createClient<Database>(supabaseUrl, supabaseKey);

  // Hardcode the scenario inputs from the database query we already ran
  // This avoids RLS issues when running locally
  const scenario: Scenario = {
    id: '19af08e1-065b-49a6-b3b3-25c96155b384',
    name: 'BASELINE: Retirement Plan - Pension',
    basic_inputs: {
      province: Province.BC,
      current_age: 58,
      longevity_age: 90,
      retirement_age: 60,
    },
    assets: {
      rrsp: { balance: 2939577, rate_of_return: 0.15, annual_contribution: 0 },
      tfsa: { balance: 35901, rate_of_return: 0.15, annual_contribution: 0 },
      non_registered: { balance: 1215363, cost_base: 850754.1, rate_of_return: 0.15, annual_contribution: 0 },
    },
    income_sources: {
      cpp: { start_age: 60, monthly_amount_at_65: 1364.6 },
      oas: { start_age: 65, monthly_amount: 713.34 },
      other_income: [{ start_age: 60, description: 'Other Income', annual_amount: 10000, indexed_to_inflation: false }],
    },
    expenses: {
      fixed_monthly: 19998,
      variable_annual: 0,
      age_based_changes: [],
      indexed_to_inflation: true,
    },
    assumptions: {
      inflation_rate: 0.025,
      pre_retirement_return: 0.15,
      post_retirement_return: 0.06,
    },
  };

  console.log('\n========================================');
  console.log('GROSS-UP FIX VALIDATION TEST');
  console.log('Scenario:', scenario.name);
  console.log('========================================\n');

  // Run the calculation
  const results = await calculateRetirementProjection(client, scenario);

  // Analyze key years around the transition
  console.log('Year-by-Year Analysis (Ages 65-75):\n');
  console.log('Age | Gross Income | Tax | Net Income | Expenses | Gap | Monthly Net');
  console.log('----|-------------|-----|------------|----------|-----|------------');

  for (const year of results.year_by_year) {
    if (year.age >= 65 && year.age <= 75) {
      const netIncome = year.income.total - year.tax.total;
      const gap = netIncome - year.expenses;
      const monthlyNet = netIncome / 12;

      console.log(
        `${year.age}  | $${year.income.total.toLocaleString().padStart(10)} | ` +
        `$${year.tax.total.toLocaleString().padStart(8)} | ` +
        `$${netIncome.toLocaleString().padStart(10)} | ` +
        `$${year.expenses.toLocaleString().padStart(9)} | ` +
        `$${gap.toLocaleString().padStart(8)} | ` +
        `$${monthlyNet.toFixed(0).padStart(6)}/mo`
      );
    }
  }

  // Summary stats
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');

  const retirementYears = results.year_by_year.filter(y => y.age >= 60);

  // Find years where net income < expenses
  const shortfallYears = retirementYears.filter(y => {
    const netIncome = y.income.total - y.tax.total;
    return netIncome < y.expenses * 0.95; // Allow 5% tolerance
  });

  console.log(`\nTotal retirement years: ${retirementYears.length}`);
  console.log(`Years with shortfall (net < 95% of expenses): ${shortfallYears.length}`);

  if (shortfallYears.length > 0) {
    console.log('\nShortfall years:');
    for (const y of shortfallYears.slice(0, 5)) {
      const netIncome = y.income.total - y.tax.total;
      const shortfall = y.expenses - netIncome;
      console.log(`  Age ${y.age}: Net $${netIncome.toLocaleString()} vs Expenses $${y.expenses.toLocaleString()} (short by $${shortfall.toLocaleString()})`);
    }
  }

  // Check the critical age 68 transition
  const age68 = results.year_by_year.find(y => y.age === 68);
  if (age68) {
    console.log('\n========================================');
    console.log('AGE 68 DETAILED ANALYSIS (Critical Transition)');
    console.log('========================================');
    console.log(`\nWithdrawals:`);
    console.log(`  RRSP/RRIF: $${age68.withdrawals.rrsp_rrif.toLocaleString()}`);
    console.log(`  Non-Reg:   $${age68.withdrawals.non_registered.toLocaleString()}`);
    console.log(`  TFSA:      $${age68.withdrawals.tfsa.toLocaleString()}`);
    console.log(`  Total:     $${age68.withdrawals.total.toLocaleString()}`);

    console.log(`\nIncome:`);
    console.log(`  CPP:       $${age68.income.cpp.toLocaleString()}`);
    console.log(`  OAS:       $${age68.income.oas.toLocaleString()}`);
    console.log(`  Other:     $${age68.income.other.toLocaleString()}`);
    console.log(`  Investment: $${age68.income.investment.toLocaleString()}`);
    console.log(`  Total:     $${age68.income.total.toLocaleString()}`);

    console.log(`\nTax:`);
    console.log(`  Federal:   $${age68.tax.federal.toLocaleString()}`);
    console.log(`  Provincial: $${age68.tax.provincial.toLocaleString()}`);
    console.log(`  Total:     $${age68.tax.total.toLocaleString()}`);
    console.log(`  Effective: ${(age68.tax.effective_rate * 100).toFixed(1)}%`);
    console.log(`  Marginal:  ${(age68.tax.marginal_rate * 100).toFixed(1)}%`);

    const netIncome68 = age68.income.total - age68.tax.total;
    console.log(`\nNet Income:  $${netIncome68.toLocaleString()}`);
    console.log(`Expenses:    $${age68.expenses.toLocaleString()}`);
    console.log(`Gap:         $${(netIncome68 - age68.expenses).toLocaleString()}`);
    console.log(`Monthly Net: $${(netIncome68 / 12).toFixed(0)}/mo`);
  }

  // Final portfolio
  console.log('\n========================================');
  console.log('FINAL RESULTS');
  console.log('========================================');
  console.log(`Final Portfolio Value: $${results.final_portfolio_value.toLocaleString()}`);
  console.log(`Portfolio Depleted: ${results.portfolio_depleted_age ? `Age ${results.portfolio_depleted_age}` : 'Never'}`);
  console.log(`Success: ${results.success ? '✅ YES' : '❌ NO'}`);
}

main().catch(console.error);
