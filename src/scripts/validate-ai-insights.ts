#!/usr/bin/env tsx
/**
 * AI Insights Validation Tool
 *
 * Interactive CLI tool to validate AI-generated insights against actual calculations.
 * Catches logic errors, exaggerations, and missing context.
 *
 * Usage: npx tsx src/scripts/validate-ai-insights.ts
 *
 * Modes:
 * 1. Baseline Narrative Only - Validates standalone baseline AI narrative
 * 2. Variant Key Insight Only - Validates comparison between baseline and variant
 * 3. Both - Validates both baseline narrative and variant insight
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Scenario } from '@/types/calculator';
import { calculateRetirementProjection } from '@/lib/calculations/engine';
import type { CalculationResults } from '@/types/calculator';
import { validateVariantInsight as performInsightValidation, formatValidationReport as formatInsightReport } from '@/lib/validation/insight-validator';
import { validateBaselineNarrative as performNarrativeValidation, formatValidationReport as formatNarrativeReport } from '@/lib/validation/narrative-validator';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Supabase client with SERVICE ROLE key to bypass RLS
// This allows the validation tool to access all scenarios regardless of user
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Make sure .env.local exists with:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error(`\n   Looked for .env.local at: ${resolve(process.cwd(), '.env.local')}`);
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// TYPES
// ============================================================================

type ValidationMode = 'baseline' | 'variant-insight' | 'variant-narrative' | 'variant-full';

interface ValidationInput {
  mode: ValidationMode;
  baselineScenario: Scenario;
  baselineResults: CalculationResults;
  baselineNarrative?: string;
  variantScenario?: Scenario | null;
  variantResults?: CalculationResults;
  variantInsight?: string;
  variantNarrative?: string;
}

// ============================================================================
// CLI HELPERS
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Multiline input handler using a terminator string
 * to avoid closing stdin with Ctrl+D
 */
async function promptMultiline(question: string): Promise<string> {
  // Small delay to ensure previous prompt is fully cleared
  await new Promise(resolve => setTimeout(resolve, 100));

  return new Promise((resolve) => {
    console.log('\n' + '='.repeat(80));
    console.log(question);
    console.log('='.repeat(80));
    console.log('Instructions:');
    console.log('  1. Paste your text (can be multiple lines)');
    console.log('  2. Press Enter to go to a new line');
    console.log('  3. Type: END');
    console.log('  4. Press Enter');
    console.log('---');

    let lines: string[] = [];

    // Remove any existing line listeners to avoid conflicts
    rl.removeAllListeners('line');

    const lineHandler = (line: string) => {
      if (line.trim() === 'END') {
        // Clean up handler and resolve
        rl.removeListener('line', lineHandler);
        const result = lines.join('\n').trim();
        resolve(result);
      } else {
        lines.push(line);
      }
    };

    rl.on('line', lineHandler);
  });
}

// ============================================================================
// SCENARIO FETCHING
// ============================================================================

/**
 * Fetch scenario from database by ID or fuzzy-match name
 */
async function fetchScenario(idOrName: string): Promise<Scenario | null> {
  // Try exact ID match first (only if input looks like a UUID)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(idOrName)) {
    const { data: byId, error: idError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', idOrName)
      .single();

    if (byId && !idError && byId.inputs) {
      const scenario = {
        id: byId.id,
        name: byId.name,
        ...(byId.inputs as any),
      } as Scenario;
      return scenario;
    }
  }

  // Try fuzzy name match
  const { data: byName, error: nameError } = await supabase
    .from('scenarios')
    .select('*')
    .ilike('name', `%${idOrName}%`)
    .limit(5);

  if (nameError) {
    console.error(`❌ Database error: ${nameError.message}`);
    return null;
  }

  if (byName && byName.length > 0) {
    if (byName.length === 1 && byName[0].inputs) {
      const scenario = {
        id: byName[0].id,
        name: byName[0].name,
        ...(byName[0].inputs as any),
      } as Scenario;
      return scenario;
    }

    // Multiple matches - show options
    console.log(`\nFound ${byName.length} scenarios matching "${idOrName}":`);
    byName.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name}`);
    });

    const choice = await prompt('\n? Select scenario (1-' + byName.length + '): ');
    const index = parseInt(choice) - 1;

    if (index >= 0 && index < byName.length) {
      const selected = byName[index];
      if (!selected.inputs) {
        console.error(`❌ Selected scenario has no inputs data`);
        return null;
      }
      const scenario = {
        id: selected.id,
        name: selected.name,
        ...(selected.inputs as any),
      } as Scenario;
      return scenario;
    }
  }

  console.error(`❌ No scenario found matching: "${idOrName}"`);
  return null;
}

// ============================================================================
// VALIDATION ORCHESTRATION
// ============================================================================

/**
 * Main validation logic - routes to appropriate validator based on mode
 */
async function validateInsights(input: ValidationInput): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(80));

  // Mode 1: Baseline AI Narrative
  if (input.mode === 'baseline') {
    if (input.baselineNarrative) {
      console.log('\n📝 BASELINE NARRATIVE VALIDATION');
      console.log('-'.repeat(80));
      await validateBaselineNarrative(
        input.baselineScenario,
        input.baselineResults,
        input.baselineNarrative
      );
    }
  }

  // Mode 2 & 4: Variant Key Insight (Comparison)
  if (input.mode === 'variant-insight' || input.mode === 'variant-full') {
    if (input.variantInsight && input.variantScenario && input.variantResults) {
      console.log('\n🔍 VARIANT KEY INSIGHT VALIDATION (Comparison)');
      console.log('-'.repeat(80));
      await validateVariantInsight(
        input.baselineScenario,
        input.baselineResults,
        input.variantScenario,
        input.variantResults,
        input.variantInsight
      );
    }
  }

  // Mode 3 & 4: Variant AI Analysis (Standalone Narrative)
  if (input.mode === 'variant-narrative' || input.mode === 'variant-full') {
    if (input.variantNarrative && input.variantScenario && input.variantResults) {
      console.log('\n📝 VARIANT AI ANALYSIS VALIDATION (Standalone Narrative)');
      console.log('-'.repeat(80));
      await validateBaselineNarrative(
        input.variantScenario,
        input.variantResults,
        input.variantNarrative
      );
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ VALIDATION COMPLETE');
  console.log('='.repeat(80) + '\n');
}

/**
 * Validate baseline AI narrative
 */
async function validateBaselineNarrative(
  scenario: Scenario,
  results: CalculationResults,
  narrative: string
): Promise<void> {
  console.log(`\nScenario: "${scenario.name}"`);
  console.log(`\nAI Narrative:`);
  console.log(`"${narrative}"\n`);

  // Display actual results
  console.log('📊 ACTUAL CALCULATION RESULTS:\n');
  console.log(`  - Final Portfolio: $${Math.round(results.final_portfolio_value).toLocaleString()}`);
  console.log(`  - Depletion Age: ${results.portfolio_depleted_age || 'Never (sustains through longevity)'}`);
  console.log(`  - Total CPP: $${Math.round(results.total_cpp_received).toLocaleString()}`);
  console.log(`  - Total OAS: $${Math.round(results.total_oas_received).toLocaleString()}`);
  console.log(`  - Total Pension: $${Math.round(results.total_pension_received).toLocaleString()}`);
  console.log(`  - Total Taxes: $${Math.round(results.total_taxes_paid_in_retirement).toLocaleString()}`);

  // Run detailed validation
  console.log('\n🔍 DETAILED NARRATIVE VALIDATION:');

  const validationResult = performNarrativeValidation(
    scenario,
    results,
    narrative
  );

  const report = formatNarrativeReport(validationResult);
  console.log(report);
}

/**
 * Validate variant key insight (comparison)
 */
async function validateVariantInsight(
  baselineScenario: Scenario,
  baselineResults: CalculationResults,
  variantScenario: Scenario,
  variantResults: CalculationResults,
  insight: string
): Promise<void> {
  console.log(`\nBaseline: "${baselineScenario.name}"`);
  console.log(`Variant: "${variantScenario.name}"`);
  console.log(`\nKey Insight:`);
  console.log(`"${insight}"\n`);

  // Display actual numbers
  console.log('📊 ACTUAL CALCULATION RESULTS:\n');

  console.log('Baseline:');
  console.log(`  - Final Portfolio: $${Math.round(baselineResults.final_portfolio_value).toLocaleString()}`);
  console.log(`  - Depletion Age: ${baselineResults.portfolio_depleted_age || 'Never (sustains through longevity)'}`);
  console.log(`  - Total CPP: $${Math.round(baselineResults.total_cpp_received).toLocaleString()}`);
  console.log(`  - Total OAS: $${Math.round(baselineResults.total_oas_received).toLocaleString()}`);
  console.log(`  - Total Pension: $${Math.round(baselineResults.total_pension_received).toLocaleString()}`);
  console.log(`  - Total Taxes: $${Math.round(baselineResults.total_taxes_paid_in_retirement).toLocaleString()}`);

  console.log('\nVariant:');
  console.log(`  - Final Portfolio: $${Math.round(variantResults.final_portfolio_value).toLocaleString()}`);
  console.log(`  - Depletion Age: ${variantResults.portfolio_depleted_age || 'Never (sustains through longevity)'}`);
  console.log(`  - Total CPP: $${Math.round(variantResults.total_cpp_received).toLocaleString()}`);
  console.log(`  - Total OAS: $${Math.round(variantResults.total_oas_received).toLocaleString()}`);
  console.log(`  - Total Pension: $${Math.round(variantResults.total_pension_received).toLocaleString()}`);
  console.log(`  - Total Taxes: $${Math.round(variantResults.total_taxes_paid_in_retirement).toLocaleString()}`);

  console.log('\n📐 DIFFERENCES:\n');

  const portfolioDiff = variantResults.final_portfolio_value - baselineResults.final_portfolio_value;
  const cppDiff = variantResults.total_cpp_received - baselineResults.total_cpp_received;
  const oasDiff = variantResults.total_oas_received - baselineResults.total_oas_received;
  const pensionDiff = variantResults.total_pension_received - baselineResults.total_pension_received;
  const taxDiff = variantResults.total_taxes_paid_in_retirement - baselineResults.total_taxes_paid_in_retirement;

  console.log(`  - Portfolio: ${portfolioDiff >= 0 ? '+' : ''}$${Math.round(Math.abs(portfolioDiff)).toLocaleString()} (${portfolioDiff >= 0 ? 'higher' : 'lower'})`);
  console.log(`  - CPP: ${cppDiff >= 0 ? '+' : ''}$${Math.round(Math.abs(cppDiff)).toLocaleString()} (${cppDiff >= 0 ? 'higher' : 'lower'})`);
  console.log(`  - OAS: ${oasDiff >= 0 ? '+' : ''}$${Math.round(Math.abs(oasDiff)).toLocaleString()} (${oasDiff >= 0 ? 'higher' : 'lower'})`);
  console.log(`  - Pension: ${pensionDiff >= 0 ? '+' : ''}$${Math.round(Math.abs(pensionDiff)).toLocaleString()} (${pensionDiff >= 0 ? 'higher' : 'lower'})`);
  console.log(`  - Taxes: ${taxDiff >= 0 ? '+' : ''}$${Math.round(Math.abs(taxDiff)).toLocaleString()} (${taxDiff >= 0 ? 'higher' : 'lower'})`);

  // Run detailed validation
  console.log('\n🔍 DETAILED CLAIM VALIDATION:');

  const validationResult = performInsightValidation(
    baselineScenario,
    baselineResults,
    variantScenario,
    variantResults,
    insight
  );

  const report = formatInsightReport(validationResult);
  console.log(report);
}

// ============================================================================
// MAIN PROGRAM
// ============================================================================

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║         AI Insights Validation Tool - Retirement Calculator       ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Step 1: Select validation mode
  console.log('? What do you want to validate?\n');
  console.log('  1. Baseline AI Narrative');
  console.log('     → Validates standalone baseline scenario narrative');
  console.log('     → Checks: portfolio outcome, amounts, tax totals\n');

  console.log('  2. Variant Key Insight (Comparison between baseline and variant)');
  console.log('     → Validates the comparison blurb shown in the comparison tab');
  console.log('     → Checks: dollar differences, depletion changes, arithmetic accuracy\n');

  console.log('  3. Variant AI Analysis (Standalone variant narrative)');
  console.log('     → Validates the variant\'s full narrative (not the comparison)');
  console.log('     → Checks: portfolio outcome, amounts, tax totals for variant\n');

  console.log('  4. Full Variant Validation (Both Key Insight + AI Analysis)');
  console.log('     → Validates both the comparison AND the variant narrative');
  console.log('     → Most comprehensive validation\n');

  const modeChoice = await prompt('Select mode (1-4): ');
  let mode: ValidationMode;

  switch (modeChoice) {
    case '1':
      mode = 'baseline';
      break;
    case '2':
      mode = 'variant-insight';
      break;
    case '3':
      mode = 'variant-narrative';
      break;
    case '4':
      mode = 'variant-full';
      break;
    default:
      console.error('❌ Invalid choice. Exiting.');
      rl.close();
      process.exit(1);
  }

  const modeNames = {
    'baseline': 'Baseline Narrative',
    'variant-insight': 'Variant Key Insight (Comparison)',
    'variant-narrative': 'Variant AI Analysis (Narrative)',
    'variant-full': 'Full Variant Validation'
  };

  console.log(`\n📋 Mode: ${modeNames[mode]}\n`);

  // Step 2: Fetch baseline scenario
  const baselineInput = await prompt('? Baseline scenario (ID or name): ');
  const baselineScenario = await fetchScenario(baselineInput);

  if (!baselineScenario) {
    console.error('❌ Could not find baseline scenario. Exiting.');
    rl.close();
    process.exit(1);
  }

  // Step 3: Re-run baseline calculation
  console.log('\n⚙️  Running baseline calculation...');
  const baselineResults = await calculateRetirementProjection(supabase, baselineScenario);

  // Step 4: Get baseline narrative (if needed)
  let baselineNarrative: string | undefined;
  if (mode === 'baseline') {
    baselineNarrative = await promptMultiline('BASELINE AI NARRATIVE');

    if (!baselineNarrative || baselineNarrative.length === 0) {
      console.error('❌ No narrative provided. Exiting.');
      rl.close();
      process.exit(1);
    }
  }

  // Step 5: Fetch variant scenario (if needed)
  let variantScenario: Scenario | null = null;
  let variantResults: CalculationResults | undefined;
  let variantInsight: string | undefined;
  let variantNarrative: string | undefined;

  if (mode === 'variant-insight' || mode === 'variant-narrative' || mode === 'variant-full') {
    const variantInput = await prompt('\n? Variant scenario (ID or name): ');
    variantScenario = await fetchScenario(variantInput);

    if (!variantScenario) {
      console.error('❌ Could not find variant scenario. Exiting.');
      rl.close();
      process.exit(1);
    }

    // Run variant calculation
    console.log('\n⚙️  Running variant calculation...');
    variantResults = await calculateRetirementProjection(supabase, variantScenario);

    // Get variant Key Insight (comparison) if needed
    if (mode === 'variant-insight' || mode === 'variant-full') {
      variantInsight = await promptMultiline('VARIANT KEY INSIGHT (Comparison blurb from comparison tab)');

      if (!variantInsight || variantInsight.length === 0) {
        console.error('❌ No Key Insight provided. Exiting.');
        rl.close();
        process.exit(1);
      }
    }

    // Get variant AI Analysis (narrative) if needed
    if (mode === 'variant-narrative' || mode === 'variant-full') {
      variantNarrative = await promptMultiline('VARIANT AI ANALYSIS (Full narrative for variant scenario)');

      if (!variantNarrative || variantNarrative.length === 0) {
        console.error('❌ No AI Analysis provided. Exiting.');
        rl.close();
        process.exit(1);
      }
    }
  }

  // Step 6: Validate
  await validateInsights({
    mode,
    baselineScenario,
    baselineResults,
    baselineNarrative,
    variantScenario,
    variantResults,
    variantInsight,
    variantNarrative,
  });

  // Clean up and exit
  rl.close();
  process.exit(0);
}

// Run the program
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
