/**
 * Debug script to trace gross-up calculation for "Retire 1 Year Earlier" scenario
 *
 * This script loads the Retire Early variant inputs and runs the calculation engine
 * with debug logging enabled to trace why the gross-up is producing ~$280K withdrawal
 * instead of the expected ~$181K.
 *
 * Run with: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npx tsx src/scripts/debug-retire-early.ts
 */

import { createClient } from '@supabase/supabase-js';
import { calculateRetirementProjection } from '../lib/calculations/engine';
import type { Scenario } from '@/types/calculator';
import { Province } from '@/types/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('='.repeat(80));
  console.log('DEBUG: Retire 1 Year Earlier Scenario');
  console.log('='.repeat(80));

  // These are the EXACT inputs from the stored "WHAT-IF: Retire 1 Year Earlier" scenario
  // Copied from the database query results
  const retireEarlyInputs: Scenario = {
    name: 'WHAT-IF: Retire 1 Year Earlier',
    basic_inputs: {
      current_age: 58,
      retirement_age: 59,  // KEY DIFFERENCE: retiring at 59 instead of 60
      longevity_age: 95,
      province: Province.ON,
    },
    assets: {
      rrsp: {
        balance: 2939577,
        annual_contribution: 0,
        rate_of_return: 0.06,
      },
      tfsa: {
        balance: 35901,
        annual_contribution: 0,
        rate_of_return: 0.06,
      },
      non_registered: {
        balance: 1215363,
        annual_contribution: 0,
        rate_of_return: 0.06,
      },
    },
    income_sources: {
      cpp: {
        start_age: 60,  // CPP still starts at 60 (not changed)
        monthly_amount_at_65: 1364.60,
      },
      oas: {
        start_age: 65,  // OAS still starts at 65 (not changed)
        monthly_amount: 713.34,
      },
      employment: {
        until_age: 59,  // Employment ends at 59 (changed from 60)
        annual_amount: 200000,
      },
      other_income: [
        {
          start_age: 60,  // Other income still starts at 60 (not changed)
          description: 'Other Income',
          annual_amount: 10000,
          indexed_to_inflation: false,
        },
      ],
    },
    expenses: {
      fixed_monthly: 15000,  // $180,000/year
      age_based_changes: [],
      indexed_to_inflation: true,
    },
    assumptions: {
      inflation_rate: 0.025,
      pre_retirement_return: 0.06,
      post_retirement_return: 0.05,
    },
  };

  console.log('\n📋 SCENARIO INPUTS:');
  console.log(`   Current age: ${retireEarlyInputs.basic_inputs.current_age}`);
  console.log(`   Retirement age: ${retireEarlyInputs.basic_inputs.retirement_age}`);
  console.log(`   Employment until: ${retireEarlyInputs.income_sources.employment?.until_age}`);
  console.log(`   CPP starts: ${retireEarlyInputs.income_sources.cpp?.start_age}`);
  console.log(`   OAS starts: ${retireEarlyInputs.income_sources.oas?.start_age}`);
  console.log(`   Other income starts: ${retireEarlyInputs.income_sources.other_income?.[0]?.start_age}`);
  console.log(`   Fixed monthly expenses: $${retireEarlyInputs.expenses.fixed_monthly.toLocaleString()}`);
  console.log(`   Annual expenses: $${(retireEarlyInputs.expenses.fixed_monthly * 12).toLocaleString()}`);

  console.log('\n🏦 STARTING BALANCES:');
  console.log(`   RRSP: $${retireEarlyInputs.assets.rrsp?.balance?.toLocaleString()}`);
  console.log(`   TFSA: $${retireEarlyInputs.assets.tfsa?.balance?.toLocaleString()}`);
  console.log(`   Non-registered: $${retireEarlyInputs.assets.non_registered?.balance?.toLocaleString()}`);

  console.log('\n🔄 RUNNING CALCULATION ENGINE...');
  console.log('   (Debug logging enabled for first 5 retirement years)\n');

  try {
    const results = await calculateRetirementProjection(supabase, retireEarlyInputs);

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTS SUMMARY (First 5 Retirement Years):');
    console.log('='.repeat(80));

    // Show first 5 retirement years
    const retirementYears = results.year_by_year.filter(y => y.age >= 59).slice(0, 5);

    console.log('\nAge | Gross Income | Expenses | Tax | Net Income | Net Cash Flow | Withdrawal');
    console.log('-'.repeat(85));

    for (const year of retirementYears) {
      const grossIncome = year.income.total;
      const netIncome = grossIncome - year.tax.total;
      console.log(
        `${year.age}  | $${Math.round(grossIncome).toLocaleString().padStart(11)} | $${Math.round(year.expenses).toLocaleString().padStart(7)} | $${Math.round(year.tax.total).toLocaleString().padStart(6)} | $${Math.round(netIncome).toLocaleString().padStart(10)} | $${Math.round(year.net_cash_flow).toLocaleString().padStart(12)} | $${Math.round(year.withdrawals.total).toLocaleString().padStart(10)}`
      );
    }

    console.log('\n🎯 KEY FINDING:');
    const age59 = results.year_by_year.find(y => y.age === 59);
    if (age59) {
      const surplus = age59.net_cash_flow;
      if (surplus > 1000) {
        console.log(`   ❌ Age 59 has net_cash_flow of +$${Math.round(surplus).toLocaleString()}`);
        console.log(`   This means withdrawing $${Math.round(surplus).toLocaleString()} MORE than needed!`);
        console.log(`   Expected: net_cash_flow ≈ $0 (gross-up should match expenses)`);
      } else if (surplus < -1000) {
        console.log(`   ❌ Age 59 has net_cash_flow of -$${Math.round(Math.abs(surplus)).toLocaleString()}`);
        console.log(`   This means withdrawing $${Math.round(Math.abs(surplus)).toLocaleString()} LESS than needed!`);
      } else {
        console.log(`   ✅ Age 59 has net_cash_flow of $${Math.round(surplus).toLocaleString()} (correct!)`);
      }
    }

  } catch (error) {
    console.error('Error running calculation:', error);
    process.exit(1);
  }
}

main();
