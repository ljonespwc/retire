/**
 * Validate Income Chart Script
 *
 * Analyzes scenario results and outputs year-by-year income breakdown with strangeness flags.
 *
 * Usage (with scenario name - requires DB access):
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npx tsx src/scripts/validate-income-chart.ts "SCENARIO NAME"
 *
 * Usage (with JSON file):
 *   npx tsx src/scripts/validate-income-chart.ts --file scenario.json
 *
 * Usage (with stdin):
 *   echo '{"name":"...", "inputs":{...}, "results":{...}}' | npx tsx src/scripts/validate-income-chart.ts --stdin
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as readline from 'readline';
import type { Database } from '../types/database';
import type { YearByYearResult } from '../types/calculator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Target user for testing
const TEST_USER_EMAIL = 'lance.jones@precisionnutrition.com';

async function readStdin(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  let data = '';
  for await (const line of rl) {
    data += line;
  }
  return data;
}

interface StrangenessFlag {
  severity: 'warning' | 'error';
  age?: number;
  category: string;
  message: string;
  details?: string;
}

function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${Math.round(amount)}`;
}

function formatCurrencyFull(amount: number): string {
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function analyzeStrangeness(
  yearByYear: YearByYearResult[],
  scenarioName: string
): StrangenessFlag[] {
  const flags: StrangenessFlag[] = [];

  // Find retirement year (first year with expenses > 0)
  const retirementYearIndex = yearByYear.findIndex(y => y.expenses > 0);
  const retirementAge = retirementYearIndex >= 0 ? yearByYear[retirementYearIndex].age : null;
  const retirementYears = yearByYear.filter(y => y.expenses > 0);

  if (retirementYears.length === 0) {
    flags.push({
      severity: 'error',
      category: 'No Retirement',
      message: 'No retirement years found (no expenses recorded)',
    });
    return flags;
  }

  // 1. Check for income jumps > 50% year-over-year
  for (let i = 1; i < retirementYears.length; i++) {
    const prev = retirementYears[i - 1];
    const curr = retirementYears[i];

    if (prev.income.total > 0) {
      const pctChange = (curr.income.total - prev.income.total) / prev.income.total;
      if (pctChange > 0.50) {
        flags.push({
          severity: 'warning',
          age: curr.age,
          category: 'Income Jump',
          message: `Income jumped ${Math.round(pctChange * 100)}% from age ${prev.age} to ${curr.age}`,
          details: `${formatCurrency(prev.income.total)} → ${formatCurrency(curr.income.total)}. ` +
            `RRIF: ${formatCurrency(prev.withdrawals.rrsp_rrif)} → ${formatCurrency(curr.withdrawals.rrsp_rrif)}`,
        });
      }
    }
  }

  // 2. Check for RRSP/RRIF income growing significantly over time (after 71)
  const post71Years = retirementYears.filter(y => y.age >= 71);
  if (post71Years.length >= 5) {
    const firstRRIF = post71Years[0].withdrawals.rrsp_rrif;
    const lastRRIF = post71Years[post71Years.length - 1].withdrawals.rrsp_rrif;

    if (firstRRIF > 0 && lastRRIF > firstRRIF * 1.3) {
      const growthPct = Math.round(((lastRRIF / firstRRIF) - 1) * 100);
      flags.push({
        severity: 'warning',
        category: 'RRIF Growing',
        message: `RRIF withdrawals grew ${growthPct}% from age 71 to ${post71Years[post71Years.length - 1].age}`,
        details: `${formatCurrency(firstRRIF)} → ${formatCurrency(lastRRIF)}. Portfolio may be growing faster than withdrawals.`,
      });
    }
  }

  // 3. Check for high tax rates (> 40% effective)
  const highTaxYears = retirementYears.filter(y => y.tax.effective_rate > 0.40);
  if (highTaxYears.length > 0) {
    const avgHighTaxRate = highTaxYears.reduce((sum, y) => sum + y.tax.effective_rate, 0) / highTaxYears.length;
    flags.push({
      severity: 'warning',
      category: 'High Tax Rate',
      message: `${highTaxYears.length} years with >40% effective tax rate (avg ${Math.round(avgHighTaxRate * 100)}%)`,
      details: `Ages ${highTaxYears[0].age}-${highTaxYears[highTaxYears.length - 1].age}. Consider tax optimization strategies.`,
    });
  }

  // 4. Check for income source disappearing abruptly
  const sourcesOverTime = retirementYears.map(y => ({
    age: y.age,
    hasNonReg: y.withdrawals.non_registered > 1000,
    hasRRIF: y.withdrawals.rrsp_rrif > 1000,
    hasTFSA: y.withdrawals.tfsa > 1000,
  }));

  for (let i = 1; i < sourcesOverTime.length; i++) {
    const prev = sourcesOverTime[i - 1];
    const curr = sourcesOverTime[i];

    if (prev.hasNonReg && !curr.hasNonReg) {
      flags.push({
        severity: 'warning',
        age: curr.age,
        category: 'Source Exhausted',
        message: `Non-registered withdrawals stopped at age ${curr.age}`,
        details: `Account likely exhausted. All income now from other sources.`,
      });
    }
    if (prev.hasRRIF && !curr.hasRRIF && curr.age < 90) {
      flags.push({
        severity: 'warning',
        age: curr.age,
        category: 'Source Exhausted',
        message: `RRSP/RRIF withdrawals stopped at age ${curr.age}`,
        details: `Account likely exhausted before longevity.`,
      });
    }
  }

  // 5. Check for net income vs expenses mismatch (> 5% gap)
  const mismatchYears = retirementYears.filter(y => {
    const netIncome = y.income.total - y.tax.total;
    const gap = Math.abs(netIncome - y.expenses);
    return gap > y.expenses * 0.05 && gap > 5000;
  });

  if (mismatchYears.length > 3) {
    flags.push({
      severity: 'warning',
      category: 'Income/Expense Gap',
      message: `${mismatchYears.length} years where net income differs from expenses by >5%`,
      details: `First occurrence at age ${mismatchYears[0].age}. May indicate gross-up calculation issues.`,
    });
  }

  // 6. Check scenario name vs actual income sources
  const hasPensionInName = scenarioName.toLowerCase().includes('pension');
  const totalPension = retirementYears.reduce((sum, y) => sum + y.income.pension, 0);

  if (hasPensionInName && totalPension === 0) {
    flags.push({
      severity: 'warning',
      category: 'Name Mismatch',
      message: `Scenario named "${scenarioName}" but has $0 pension income`,
      details: `User may be confused by the name not matching the scenario contents.`,
    });
  }

  // 7. Check for portfolio growth during retirement
  const firstRetYear = retirementYears[0];
  const lastRetYear = retirementYears[retirementYears.length - 1];

  if (lastRetYear.balances.total > firstRetYear.balances.total * 1.2) {
    const growthPct = Math.round(((lastRetYear.balances.total / firstRetYear.balances.total) - 1) * 100);
    flags.push({
      severity: 'warning',
      category: 'Portfolio Growing',
      message: `Portfolio grew ${growthPct}% during retirement (age ${firstRetYear.age} to ${lastRetYear.age})`,
      details: `${formatCurrency(firstRetYear.balances.total)} → ${formatCurrency(lastRetYear.balances.total)}. Returns exceed withdrawal needs.`,
    });
  }

  // 8. Check for years where RRIF minimum exceeds expense needs
  const excessRRIFYears = post71Years.filter(y => {
    const netIncome = y.income.total - y.tax.total;
    return y.withdrawals.rrsp_rrif > y.expenses * 1.5 && netIncome > y.expenses * 1.1;
  });

  if (excessRRIFYears.length > 5) {
    flags.push({
      severity: 'warning',
      category: 'Excess RRIF',
      message: `${excessRRIFYears.length} years where RRIF minimums greatly exceed expense needs`,
      details: `RRIF mandatory minimums force withdrawals larger than needed, increasing tax burden.`,
    });
  }

  // 9. Check for OAS clawback (income > ~$90K typically triggers it)
  const potentialClawbackYears = retirementYears.filter(y =>
    y.income.oas > 0 && y.income.total > 90000
  );

  if (potentialClawbackYears.length > 0) {
    flags.push({
      severity: 'warning',
      category: 'OAS Clawback',
      message: `${potentialClawbackYears.length} years likely affected by OAS clawback`,
      details: `High income (>${formatCurrency(90000)}) while receiving OAS reduces benefits.`,
    });
  }

  return flags;
}

async function main() {
  const args = process.argv.slice(2);
  let scenarioData: any = null;

  // Parse arguments
  if (args.includes('--stdin')) {
    // Read from stdin
    const jsonData = await readStdin();
    try {
      scenarioData = JSON.parse(jsonData);
    } catch (e) {
      console.error('\nError: Invalid JSON from stdin\n');
      process.exit(1);
    }
  } else if (args.includes('--file')) {
    // Read from file
    const fileIndex = args.indexOf('--file');
    const filePath = args[fileIndex + 1];
    if (!filePath) {
      console.error('\nUsage: npx tsx src/scripts/validate-income-chart.ts --file <path>\n');
      process.exit(1);
    }
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      scenarioData = JSON.parse(fileContent);
    } catch (e) {
      console.error(`\nError: Could not read file "${filePath}"\n`);
      process.exit(1);
    }
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    // Try to fetch from database by name
    const scenarioName = args[0];

    if (!supabaseUrl || !supabaseKey) {
      console.error('\nError: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required for DB access');
      console.error('Use --file or --stdin instead.\n');
      process.exit(1);
    }

    const client = createClient<Database>(supabaseUrl, supabaseKey);

    const { data: allScenarios, error: fetchError } = await client
      .from('scenarios')
      .select('*')
      .eq('name', scenarioName);

    if (fetchError || !allScenarios || allScenarios.length === 0) {
      console.error(`\nError: Could not find scenario "${scenarioName}"`);
      console.error('Note: RLS may be blocking access. Use --file or --stdin instead.\n');
      process.exit(1);
    }

    scenarioData = allScenarios[0];
  } else {
    console.error('\nUsage:');
    console.error('  npx tsx src/scripts/validate-income-chart.ts "SCENARIO NAME"');
    console.error('  npx tsx src/scripts/validate-income-chart.ts --file scenario.json');
    console.error('  echo \'{"name":"...", "inputs":{...}, "results":{...}}\' | npx tsx src/scripts/validate-income-chart.ts --stdin\n');
    process.exit(1);
  }

  const results = scenarioData.results;

  const scenarioName = scenarioData.name || 'Unknown Scenario';

  if (!results || !results.year_by_year) {
    console.error(`\nError: Scenario "${scenarioName}" has no calculation results.`);
    console.error('Run the calculation first, then try again.\n');
    process.exit(1);
  }

  const yearByYear: YearByYearResult[] = results.year_by_year;
  const inputs = scenarioData.inputs;

  // Print header
  console.log('\n' + '='.repeat(100));
  console.log('INCOME CHART VALIDATION');
  console.log('='.repeat(100));
  console.log(`Scenario: ${scenarioName}`);
  console.log(`Ages: ${inputs.basic_inputs.current_age} → ${inputs.basic_inputs.retirement_age} (retire) → ${inputs.basic_inputs.longevity_age} (end)`);
  console.log(`Province: ${inputs.basic_inputs.province}`);
  console.log('='.repeat(100));

  // Print year-by-year breakdown
  console.log('\nYEAR-BY-YEAR INCOME BREAKDOWN\n');
  console.log('Age | RRSP/RRIF | Non-Reg | CPP    | OAS    | Pension | Other  | GROSS    | Tax      | NET      | Expenses | Gap');
  console.log('-'.repeat(120));

  // Show key years: retirement start, every 5 years, and last year
  const retirementYears = yearByYear.filter(y => y.expenses > 0);
  const keyAges = new Set<number>();

  if (retirementYears.length > 0) {
    keyAges.add(retirementYears[0].age); // First retirement year
    keyAges.add(65); // OAS eligibility
    keyAges.add(71); // RRIF conversion

    // Every 5 years
    for (let age = retirementYears[0].age; age <= retirementYears[retirementYears.length - 1].age; age += 5) {
      keyAges.add(age);
    }

    keyAges.add(retirementYears[retirementYears.length - 1].age); // Last year
  }

  for (const year of yearByYear) {
    if (!keyAges.has(year.age) && year.expenses === 0) continue;
    if (!keyAges.has(year.age)) continue;

    const netIncome = year.income.total - year.tax.total;
    const gap = netIncome - year.expenses;

    const row = [
      String(year.age).padStart(3),
      formatCurrency(year.withdrawals.rrsp_rrif).padStart(9),
      formatCurrency(year.withdrawals.non_registered).padStart(8),
      formatCurrency(year.income.cpp).padStart(7),
      formatCurrency(year.income.oas).padStart(7),
      formatCurrency(year.income.pension).padStart(8),
      formatCurrency(year.income.other).padStart(7),
      formatCurrency(year.income.total).padStart(9),
      formatCurrency(year.tax.total).padStart(9),
      formatCurrency(netIncome).padStart(9),
      formatCurrency(year.expenses).padStart(9),
      (gap >= 0 ? '+' : '') + formatCurrency(gap).padStart(7),
    ];

    console.log(row.join(' | '));
  }

  // Print full detailed table for all retirement years
  console.log('\n' + '-'.repeat(120));
  console.log('FULL RETIREMENT YEAR DETAILS\n');

  for (const year of retirementYears) {
    const netIncome = year.income.total - year.tax.total;
    const gap = netIncome - year.expenses;

    const row = [
      String(year.age).padStart(3),
      formatCurrency(year.withdrawals.rrsp_rrif).padStart(9),
      formatCurrency(year.withdrawals.non_registered).padStart(8),
      formatCurrency(year.income.cpp).padStart(7),
      formatCurrency(year.income.oas).padStart(7),
      formatCurrency(year.income.pension).padStart(8),
      formatCurrency(year.income.other).padStart(7),
      formatCurrency(year.income.total).padStart(9),
      formatCurrency(year.tax.total).padStart(9),
      formatCurrency(netIncome).padStart(9),
      formatCurrency(year.expenses).padStart(9),
      (gap >= 0 ? '+' : '') + formatCurrency(gap).padStart(7),
    ];

    console.log(row.join(' | '));
  }

  // Analyze and print strangeness flags
  const flags = analyzeStrangeness(yearByYear, scenarioName);

  console.log('\n' + '='.repeat(100));
  console.log('STRANGENESS FLAGS');
  console.log('='.repeat(100));

  if (flags.length === 0) {
    console.log('\n✅ No strangeness detected. Chart should look reasonable to users.\n');
  } else {
    console.log(`\n🚨 Found ${flags.length} potential issues:\n`);

    for (let i = 0; i < flags.length; i++) {
      const flag = flags[i];
      const icon = flag.severity === 'error' ? '❌' : '⚠️';
      const ageStr = flag.age ? ` (Age ${flag.age})` : '';

      console.log(`${i + 1}. ${icon} [${flag.category}]${ageStr}`);
      console.log(`   ${flag.message}`);
      if (flag.details) {
        console.log(`   → ${flag.details}`);
      }
      console.log('');
    }
  }

  // Print summary stats
  console.log('='.repeat(100));
  console.log('SUMMARY STATISTICS');
  console.log('='.repeat(100));
  console.log(`\nFinal Portfolio: ${formatCurrencyFull(results.final_portfolio_value)}`);
  console.log(`Portfolio Depleted: ${results.portfolio_depleted_age ? `Age ${results.portfolio_depleted_age}` : 'Never'}`);
  console.log(`Success: ${results.success ? '✅ YES' : '❌ NO'}`);
  console.log(`\nTotal CPP Received: ${formatCurrencyFull(results.total_cpp_received)}`);
  console.log(`Total OAS Received: ${formatCurrencyFull(results.total_oas_received)}`);
  console.log(`Total Pension Received: ${formatCurrencyFull(results.total_pension_received)}`);
  console.log(`Total Other Income: ${formatCurrencyFull(results.total_other_income_received)}`);
  console.log(`\nTotal Taxes Paid: ${formatCurrencyFull(results.total_taxes_paid_in_retirement)}`);
  console.log(`Average Tax Rate: ${(results.average_tax_rate_in_retirement * 100).toFixed(1)}%`);
  console.log('');
}

main().catch(console.error);
