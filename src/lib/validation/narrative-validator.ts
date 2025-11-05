/**
 * Baseline Narrative Validator
 *
 * Validates AI-generated Narratives for baseline scenarios
 * against actual calculation results.
 */

import type { Scenario, CalculationResults } from '@/types/calculator';
import {
  parseAIClaims,
  findDollarAmountNear,
  findAgeNear,
  hasClaim,
  type ParsedClaims,
} from './ai-claim-parser';

// ============================================================================
// TYPES
// ============================================================================

export type ValidationStatus = 'pass' | 'warning' | 'fail';

export interface ValidationIssue {
  status: ValidationStatus;
  category: 'portfolio' | 'income' | 'tax' | 'context';
  message: string;
  expected?: string;
  actual?: string;
  suggestion?: string;
}

export interface NarrativeValidationResult {
  issues: ValidationIssue[];
  passCount: number;
  warningCount: number;
  failCount: number;
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

/**
 * Validate baseline AI Narrative against actual results
 */
export function validateBaselineNarrative(
  scenario: Scenario,
  results: CalculationResults,
  narrativeText: string
): NarrativeValidationResult {
  const issues: ValidationIssue[] = [];
  const parsed = parseAIClaims(narrativeText);

  // Portfolio outcome validation
  validatePortfolioOutcome(issues, parsed, results);
  validateDepletionAge(issues, parsed, results);
  validateFinalBalance(issues, parsed, results);

  // Income strategy validation
  validateCPPStartAge(issues, parsed, results, scenario);
  validateOASStartAge(issues, parsed, results, scenario);
  validateIncomeAmounts(issues, parsed, results);

  // Tax analysis validation
  validateTaxAmounts(issues, parsed, results);

  // Contextual validation
  validateIncomeAfterDepletion(issues, parsed, results);

  // Tally results
  const passCount = issues.filter(i => i.status === 'pass').length;
  const warningCount = issues.filter(i => i.status === 'warning').length;
  const failCount = issues.filter(i => i.status === 'fail').length;

  return {
    issues,
    passCount,
    warningCount,
    failCount,
  };
}

// ============================================================================
// PORTFOLIO VALIDATION
// ============================================================================

function validatePortfolioOutcome(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  results: CalculationResults
): void {
  const depleteClaim = hasClaim(parsed.claims, 'deplete', []);
  const sustainClaim = hasClaim(parsed.claims, 'sustain', []);
  const actuallyDepletes = results.portfolio_depleted_age !== undefined;

  if (depleteClaim && !actuallyDepletes) {
    issues.push({
      status: 'fail',
      category: 'portfolio',
      message: `AI claims portfolio depletes, but it actually sustains`,
      expected: `Portfolio sustains through longevity`,
      actual: `AI says portfolio depletes`,
    });
  } else if (sustainClaim && actuallyDepletes) {
    issues.push({
      status: 'fail',
      category: 'portfolio',
      message: `AI claims portfolio sustains, but it actually depletes`,
      expected: `Portfolio depletes at age ${results.portfolio_depleted_age}`,
      actual: `AI says portfolio sustains`,
    });
  } else if ((depleteClaim && actuallyDepletes) || (sustainClaim && !actuallyDepletes)) {
    issues.push({
      status: 'pass',
      category: 'portfolio',
      message: `Portfolio outcome claim is correct`,
      expected: actuallyDepletes
        ? `Depletes at age ${results.portfolio_depleted_age}`
        : `Sustains through longevity`,
    });
  }
}

function validateDepletionAge(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  results: CalculationResults
): void {
  const { portfolio_depleted_age } = results;

  if (!portfolio_depleted_age) return;

  const mentionedAge = findAgeNear(parsed.ages, portfolio_depleted_age, 1);

  if (mentionedAge) {
    issues.push({
      status: 'pass',
      category: 'portfolio',
      message: `Depletion age is accurate`,
      expected: `Age ${portfolio_depleted_age}`,
      actual: mentionedAge.raw,
    });
  } else if (parsed.ages.length > 0) {
    issues.push({
      status: 'warning',
      category: 'portfolio',
      message: `Depletion age not found in narrative`,
      expected: `Should mention age ${portfolio_depleted_age}`,
      suggestion: `AI should state the specific age when portfolio depletes`,
    });
  }
}

function validateFinalBalance(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  results: CalculationResults
): void {
  const { final_portfolio_value } = results;

  if (final_portfolio_value === 0) return; // Already validated by depletion check

  const matchingAmount = findDollarAmountNear(parsed.dollarAmounts, final_portfolio_value, 10);

  if (matchingAmount) {
    issues.push({
      status: 'pass',
      category: 'portfolio',
      message: `Final portfolio balance is accurate`,
      expected: `$${Math.round(final_portfolio_value).toLocaleString()}`,
      actual: matchingAmount.raw,
    });
  } else if (final_portfolio_value > 50000) {
    // Only flag if balance is significant
    issues.push({
      status: 'warning',
      category: 'portfolio',
      message: `Final balance not mentioned`,
      expected: `$${Math.round(final_portfolio_value).toLocaleString()} remaining`,
      suggestion: `AI should mention the remaining balance as cushion/legacy`,
    });
  }
}

// ============================================================================
// INCOME VALIDATION
// ============================================================================

function validateCPPStartAge(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  results: CalculationResults,
  scenario: Scenario
): void {
  const cppStartAge = scenario.income_sources?.cpp?.start_age || 65;
  const cppMentioned = parsed.rawText.toLowerCase().includes('cpp');

  if (!cppMentioned) return;

  const mentionedAge = findAgeNear(parsed.ages, cppStartAge, 0);

  if (mentionedAge) {
    issues.push({
      status: 'pass',
      category: 'income',
      message: `CPP start age is accurate`,
      expected: `Age ${cppStartAge}`,
      actual: mentionedAge.raw,
    });
  }
}

function validateOASStartAge(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  results: CalculationResults,
  scenario: Scenario
): void {
  const oasStartAge = scenario.income_sources?.oas?.start_age || 65;
  const oasMentioned = parsed.rawText.toLowerCase().includes('oas');

  if (!oasMentioned) return;

  const mentionedAge = findAgeNear(parsed.ages, oasStartAge, 0);

  if (mentionedAge) {
    issues.push({
      status: 'pass',
      category: 'income',
      message: `OAS start age is accurate`,
      expected: `Age ${oasStartAge}`,
      actual: mentionedAge.raw,
    });
  }
}

function validateIncomeAmounts(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  results: CalculationResults
): void {
  const { total_cpp_received, total_oas_received, total_pension_received } = results;

  // Check CPP total
  if (parsed.rawText.toLowerCase().includes('cpp') && total_cpp_received > 0) {
    const matchingAmount = findDollarAmountNear(parsed.dollarAmounts, total_cpp_received, 15);
    if (matchingAmount) {
      issues.push({
        status: 'pass',
        category: 'income',
        message: `Total CPP amount is accurate`,
        expected: `$${Math.round(total_cpp_received).toLocaleString()}`,
        actual: matchingAmount.raw,
      });
    }
  }

  // Check pension total
  if (parsed.rawText.toLowerCase().includes('pension') && total_pension_received > 0) {
    const matchingAmount = findDollarAmountNear(parsed.dollarAmounts, total_pension_received, 15);
    if (matchingAmount) {
      issues.push({
        status: 'pass',
        category: 'income',
        message: `Total pension amount is accurate`,
        expected: `$${Math.round(total_pension_received).toLocaleString()}`,
        actual: matchingAmount.raw,
      });
    }
  }
}

// ============================================================================
// TAX VALIDATION
// ============================================================================

function validateTaxAmounts(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  results: CalculationResults
): void {
  const { total_taxes_paid_in_retirement } = results;

  if (!parsed.rawText.toLowerCase().includes('tax')) return;

  const matchingAmount = findDollarAmountNear(parsed.dollarAmounts, total_taxes_paid_in_retirement, 15);

  if (matchingAmount) {
    issues.push({
      status: 'pass',
      category: 'tax',
      message: `Total tax amount is accurate`,
      expected: `$${Math.round(total_taxes_paid_in_retirement).toLocaleString()}`,
      actual: matchingAmount.raw,
    });
  }
}

// ============================================================================
// CONTEXTUAL VALIDATION
// ============================================================================

function validateIncomeAfterDepletion(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  results: CalculationResults
): void {
  const { portfolio_depleted_age } = results;

  if (!portfolio_depleted_age) return;

  // Check if projection stopped early (the bug!)
  const lastAge = results.year_by_year[results.year_by_year.length - 1].age;
  const expectedLastAge = results.year_by_year[0].age + results.year_by_year.length - 1;

  if (lastAge < expectedLastAge) {
    issues.push({
      status: 'fail',
      category: 'context',
      message: `CALCULATION ENGINE BUG: Projection stopped at depletion`,
      expected: `Projection should continue to age ${expectedLastAge}`,
      actual: `Projection stopped at age ${lastAge}`,
      suggestion: `Income totals are INVALID - missing years ${lastAge + 1}-${expectedLastAge}`,
    });
  }

  // Check if AI mentions income continues
  const mentionsIncomeContinues =
    parsed.rawText.toLowerCase().includes('income continues') ||
    (parsed.rawText.toLowerCase().includes('cpp') && parsed.rawText.toLowerCase().includes('continues')) ||
    (parsed.rawText.toLowerCase().includes('pension') && parsed.rawText.toLowerCase().includes('continues'));

  if (!mentionsIncomeContinues) {
    issues.push({
      status: 'warning',
      category: 'context',
      message: `AI should mention income continues after depletion`,
      suggestion: `Add: "CPP, OAS, and pension income continue after portfolio depletes"`,
    });
  }
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

export function formatValidationReport(result: NarrativeValidationResult): string {
  let report = '\n';

  // Group by category
  const byCategory = {
    portfolio: result.issues.filter(i => i.category === 'portfolio'),
    income: result.issues.filter(i => i.category === 'income'),
    tax: result.issues.filter(i => i.category === 'tax'),
    context: result.issues.filter(i => i.category === 'context'),
  };

  for (const [category, issues] of Object.entries(byCategory)) {
    if (issues.length === 0) continue;

    report += `\n📋 ${category.toUpperCase()} CHECKS:\n`;
    report += '-'.repeat(80) + '\n';

    for (const issue of issues) {
      const icon = issue.status === 'pass' ? '✅' : issue.status === 'warning' ? '⚠️ ' : '❌';
      report += `\n${icon} ${issue.message}\n`;

      if (issue.expected) {
        report += `   Expected: ${issue.expected}\n`;
      }
      if (issue.actual) {
        report += `   Actual: ${issue.actual}\n`;
      }
      if (issue.suggestion) {
        report += `   💡 ${issue.suggestion}\n`;
      }
    }
  }

  report += `\n${'='.repeat(80)}\n`;
  report += `📊 SUMMARY: ${result.passCount} passed, ${result.warningCount} warnings, ${result.failCount} failed\n`;
  report += `${'='.repeat(80)}\n`;

  return report;
}
