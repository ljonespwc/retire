/**
 * Variant Insight Validator
 *
 * Validates AI-generated Key Insights (baseline vs variant comparisons)
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
  category: 'arithmetic' | 'logic' | 'context';
  message: string;
  expected?: string;
  actual?: string;
  suggestion?: string;
}

export interface InsightValidationResult {
  issues: ValidationIssue[];
  passCount: number;
  warningCount: number;
  failCount: number;
}

interface ComparisonMetrics {
  portfolioDiff: number;
  cppDiff: number;
  oasDiff: number;
  pensionDiff: number;
  otherIncomeDiff: number;
  taxDiff: number;
  baselineDepletionAge?: number;
  variantDepletionAge?: number;
  depletionDiff?: number;
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

/**
 * Validate variant Key Insight against actual results
 */
export function validateVariantInsight(
  baselineScenario: Scenario,
  baselineResults: CalculationResults,
  variantScenario: Scenario,
  variantResults: CalculationResults,
  insightText: string
): InsightValidationResult {
  const issues: ValidationIssue[] = [];
  const parsed = parseAIClaims(insightText);
  const metrics = calculateMetrics(baselineResults, variantResults);

  // Category 1: Arithmetic Accuracy Checks
  validatePortfolioDifference(issues, parsed, metrics);
  validateCPPDifference(issues, parsed, metrics);
  validateOASDifference(issues, parsed, metrics);
  validatePensionDifference(issues, parsed, metrics);
  validateTaxDifference(issues, parsed, metrics);

  // Category 2: Logic Consistency Checks
  validateDepletionLogic(issues, parsed, metrics, baselineResults, variantResults);
  validateIncomeAfterDepletion(issues, parsed, metrics, baselineResults, variantResults);

  // Category 3: Contextual Completeness Checks
  validateProjectionLength(issues, baselineResults, variantResults);
  validateContextualMentions(issues, parsed, metrics, baselineResults, variantResults);

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
// METRIC CALCULATIONS
// ============================================================================

function calculateMetrics(
  baseline: CalculationResults,
  variant: CalculationResults
): ComparisonMetrics {
  return {
    portfolioDiff: variant.final_portfolio_value - baseline.final_portfolio_value,
    cppDiff: variant.total_cpp_received - baseline.total_cpp_received,
    oasDiff: variant.total_oas_received - baseline.total_oas_received,
    pensionDiff: variant.total_pension_received - baseline.total_pension_received,
    otherIncomeDiff: variant.total_other_income_received - baseline.total_other_income_received,
    taxDiff: variant.total_taxes_paid_in_retirement - baseline.total_taxes_paid_in_retirement,
    baselineDepletionAge: baseline.portfolio_depleted_age,
    variantDepletionAge: variant.portfolio_depleted_age,
    depletionDiff:
      variant.portfolio_depleted_age && baseline.portfolio_depleted_age
        ? variant.portfolio_depleted_age - baseline.portfolio_depleted_age
        : undefined,
  };
}

// ============================================================================
// ARITHMETIC VALIDATION
// ============================================================================

function validatePortfolioDifference(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  metrics: ComparisonMetrics
): void {
  const portfolioClaims = [
    hasClaim(parsed.claims, 'eliminate', ['portfolio', 'balance', 'ending']),
    hasClaim(parsed.claims, 'reduce', ['portfolio', 'balance', 'ending']),
    hasClaim(parsed.claims, 'increase', ['portfolio', 'balance', 'ending']),
  ].filter(Boolean);

  if (portfolioClaims.length === 0) return;

  const absDiff = Math.abs(metrics.portfolioDiff);
  const matchingAmount = findDollarAmountNear(parsed.dollarAmounts, absDiff, 10);

  if (matchingAmount) {
    issues.push({
      status: 'pass',
      category: 'arithmetic',
      message: `Portfolio difference claim is accurate`,
      expected: `±$${Math.round(absDiff).toLocaleString()}`,
      actual: matchingAmount.raw,
    });
  } else if (parsed.dollarAmounts.length > 0) {
    issues.push({
      status: 'fail',
      category: 'arithmetic',
      message: `Portfolio difference claim is inaccurate`,
      expected: `$${Math.round(absDiff).toLocaleString()}`,
      actual: `No matching amount found in text`,
      suggestion: `Check if AI is citing the correct portfolio difference`,
    });
  }
}

function validateCPPDifference(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  metrics: ComparisonMetrics
): void {
  const cppClaims = hasClaim(parsed.claims, 'reduce', ['cpp']) ||
    hasClaim(parsed.claims, 'increase', ['cpp']) ||
    hasClaim(parsed.claims, 'cut', ['cpp']);

  if (!cppClaims) return;

  const absDiff = Math.abs(metrics.cppDiff);
  const matchingAmount = findDollarAmountNear(parsed.dollarAmounts, absDiff, 10);

  if (matchingAmount) {
    issues.push({
      status: 'pass',
      category: 'arithmetic',
      message: `CPP difference claim is accurate`,
      expected: `±$${Math.round(absDiff).toLocaleString()}`,
      actual: matchingAmount.raw,
    });
  } else if (absDiff > 10000) {
    // Only flag if difference is significant
    issues.push({
      status: 'warning',
      category: 'arithmetic',
      message: `CPP claim exists but no matching dollar amount found`,
      expected: `$${Math.round(absDiff).toLocaleString()}`,
      suggestion: `AI should cite specific CPP difference`,
    });
  }
}

function validateOASDifference(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  metrics: ComparisonMetrics
): void {
  const oasClaims = hasClaim(parsed.claims, 'reduce', ['oas']) ||
    hasClaim(parsed.claims, 'increase', ['oas']) ||
    hasClaim(parsed.claims, 'cut', ['oas']);

  if (!oasClaims) return;

  const absDiff = Math.abs(metrics.oasDiff);
  const matchingAmount = findDollarAmountNear(parsed.dollarAmounts, absDiff, 10);

  if (matchingAmount) {
    issues.push({
      status: 'pass',
      category: 'arithmetic',
      message: `OAS difference claim is accurate`,
      expected: `±$${Math.round(absDiff).toLocaleString()}`,
      actual: matchingAmount.raw,
    });
  } else if (absDiff > 10000) {
    issues.push({
      status: 'warning',
      category: 'arithmetic',
      message: `OAS claim exists but no matching dollar amount found`,
      expected: `$${Math.round(absDiff).toLocaleString()}`,
      suggestion: `AI should cite specific OAS difference`,
    });
  }
}

function validatePensionDifference(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  metrics: ComparisonMetrics
): void {
  const pensionClaims = hasClaim(parsed.claims, 'reduce', ['pension']) ||
    hasClaim(parsed.claims, 'increase', ['pension']) ||
    hasClaim(parsed.claims, 'cut', ['pension']);

  if (!pensionClaims) return;

  const absDiff = Math.abs(metrics.pensionDiff);
  const matchingAmount = findDollarAmountNear(parsed.dollarAmounts, absDiff, 10);

  if (matchingAmount) {
    issues.push({
      status: 'pass',
      category: 'arithmetic',
      message: `Pension difference claim is accurate`,
      expected: `±$${Math.round(absDiff).toLocaleString()}`,
      actual: matchingAmount.raw,
    });
  } else if (absDiff > 10000) {
    issues.push({
      status: 'warning',
      category: 'arithmetic',
      message: `Pension claim exists but no matching dollar amount found`,
      expected: `$${Math.round(absDiff).toLocaleString()}`,
      suggestion: `AI should cite specific pension difference`,
    });
  }
}

function validateTaxDifference(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  metrics: ComparisonMetrics
): void {
  const taxClaims = hasClaim(parsed.claims, 'reduce', ['tax', 'taxes']) ||
    hasClaim(parsed.claims, 'increase', ['tax', 'taxes']);

  if (!taxClaims) return;

  const absDiff = Math.abs(metrics.taxDiff);
  const matchingAmount = findDollarAmountNear(parsed.dollarAmounts, absDiff, 10);

  if (matchingAmount) {
    issues.push({
      status: 'pass',
      category: 'arithmetic',
      message: `Tax difference claim is accurate`,
      expected: `±$${Math.round(absDiff).toLocaleString()}`,
      actual: matchingAmount.raw,
    });
  }
}

// ============================================================================
// LOGIC VALIDATION
// ============================================================================

function validateDepletionLogic(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  metrics: ComparisonMetrics,
  baseline: CalculationResults,
  variant: CalculationResults
): void {
  const depletionClaim = hasClaim(parsed.claims, 'deplete', []);

  if (!depletionClaim) return;

  const { baselineDepletionAge, variantDepletionAge } = metrics;

  // Case 1: Both deplete - comparison is valid
  if (baselineDepletionAge && variantDepletionAge) {
    const diff = variantDepletionAge - baselineDepletionAge;
    const mentionsEarlier = parsed.rawText.toLowerCase().includes('earlier');
    const mentionsLater = parsed.rawText.toLowerCase().includes('later');

    if ((diff > 0 && mentionsLater) || (diff < 0 && mentionsEarlier)) {
      issues.push({
        status: 'pass',
        category: 'logic',
        message: `Depletion timing comparison is correct`,
        expected: `${Math.abs(diff)} years ${diff > 0 ? 'later' : 'earlier'}`,
      });
    } else {
      issues.push({
        status: 'fail',
        category: 'logic',
        message: `Depletion timing claim is backwards`,
        expected: `Variant depletes ${Math.abs(diff)} years ${diff > 0 ? 'later' : 'earlier'}`,
        actual: `AI says ${mentionsEarlier ? 'earlier' : mentionsLater ? 'later' : 'unclear'}`,
      });
    }
  }
  // Case 2: Only variant depletes - baseline sustains
  else if (!baselineDepletionAge && variantDepletionAge) {
    issues.push({
      status: 'warning',
      category: 'logic',
      message: `Depletion comparison is misleading`,
      expected: `Baseline sustains forever, variant depletes at ${variantDepletionAge}`,
      actual: `AI compares depletion timing when baseline never depletes`,
      suggestion: `Say "causes portfolio to deplete at age X" instead of comparing timing`,
    });
  }
  // Case 3: Only baseline depletes - variant sustains (improvement)
  else if (baselineDepletionAge && !variantDepletionAge) {
    issues.push({
      status: 'pass',
      category: 'logic',
      message: `Variant eliminates portfolio depletion (good outcome)`,
      expected: `Baseline depletes at ${baselineDepletionAge}, variant sustains`,
    });
  }
}

function validateIncomeAfterDepletion(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  metrics: ComparisonMetrics,
  baseline: CalculationResults,
  variant: CalculationResults
): void {
  const { variantDepletionAge } = metrics;

  if (!variantDepletionAge) return;

  // Check if variant projection stopped early (the bug!)
  const variantLastAge = variant.year_by_year[variant.year_by_year.length - 1].age;
  const longevityAge = variant.year_by_year[0].age + variant.year_by_year.length - 1;

  if (variantLastAge < longevityAge) {
    issues.push({
      status: 'fail',
      category: 'logic',
      message: `CALCULATION ENGINE BUG DETECTED: Projection stopped at depletion`,
      expected: `Projection should continue to age ${longevityAge}`,
      actual: `Projection stopped at age ${variantLastAge}`,
      suggestion: `This is the portfolio depletion bug - income totals are INVALID`,
    });
  }

  // Check if AI mentions income continues after depletion
  const mentionsIncomeContinues =
    parsed.rawText.toLowerCase().includes('income continues') ||
    parsed.rawText.toLowerCase().includes('cpp') && parsed.rawText.toLowerCase().includes('continues') ||
    parsed.rawText.toLowerCase().includes('pension') && parsed.rawText.toLowerCase().includes('continues');

  if (!mentionsIncomeContinues && variantDepletionAge) {
    issues.push({
      status: 'warning',
      category: 'context',
      message: `AI should mention income continues after portfolio depletion`,
      suggestion: `Add context: "CPP, OAS, and pension income continue after portfolio depletes"`,
    });
  }
}

// ============================================================================
// CONTEXTUAL VALIDATION
// ============================================================================

function validateProjectionLength(
  issues: ValidationIssue[],
  baseline: CalculationResults,
  variant: CalculationResults
): void {
  const baselineYears = baseline.year_by_year.length;
  const variantYears = variant.year_by_year.length;
  const baselineLastAge = baseline.year_by_year[baselineYears - 1].age;
  const variantLastAge = variant.year_by_year[variantYears - 1].age;

  if (baselineLastAge !== variantLastAge) {
    issues.push({
      status: 'fail',
      category: 'logic',
      message: `Projection length mismatch detected`,
      expected: `Both should end at same longevity age`,
      actual: `Baseline ends at ${baselineLastAge}, variant at ${variantLastAge}`,
      suggestion: `This indicates the calculation engine bug where projection stops early`,
    });
  }
}

function validateContextualMentions(
  issues: ValidationIssue[],
  parsed: ParsedClaims,
  metrics: ComparisonMetrics,
  baseline: CalculationResults,
  variant: CalculationResults
): void {
  // Check for large income differences (should be explained)
  const totalIncomeDiff = Math.abs(
    metrics.cppDiff + metrics.oasDiff + metrics.pensionDiff + metrics.otherIncomeDiff
  );

  if (totalIncomeDiff > 100000) {
    const mentionsIncome =
      parsed.rawText.toLowerCase().includes('cpp') ||
      parsed.rawText.toLowerCase().includes('oas') ||
      parsed.rawText.toLowerCase().includes('pension') ||
      parsed.rawText.toLowerCase().includes('income');

    if (!mentionsIncome) {
      issues.push({
        status: 'warning',
        category: 'context',
        message: `Large income difference not mentioned`,
        expected: `Total income differs by $${Math.round(totalIncomeDiff).toLocaleString()}`,
        suggestion: `AI should explain why income totals differ significantly`,
      });
    }
  }
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

export function formatValidationReport(result: InsightValidationResult): string {
  let report = '\n';

  // Group by category
  const byCategory = {
    arithmetic: result.issues.filter(i => i.category === 'arithmetic'),
    logic: result.issues.filter(i => i.category === 'logic'),
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
