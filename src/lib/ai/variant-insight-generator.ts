/**
 * Variant Insight Generator
 *
 * Uses LLM to generate a 1-2 sentence key insight comparing baseline vs what-if scenarios.
 * Analyzes the financial impact and highlights the most important tradeoff.
 */

import { CalculationResults } from '@/types/calculator';

interface ComparisonMetrics {
  portfolioDiff: number;
  portfolioPercent: number;
  cppDiff: number;
  oasDiff: number;
  pensionDiff: number;
  otherIncomeDiff: number;
  taxDiff: number;
  depletionDiff?: number;
  firstYearIncomeDiff: number;
}

/**
 * Extract comparison metrics between baseline and variant
 */
function extractComparison(
  baselineResults: CalculationResults,
  variantResults: CalculationResults
): ComparisonMetrics {
  const portfolioDiff = variantResults.final_portfolio_value - baselineResults.final_portfolio_value;
  const portfolioPercent = baselineResults.final_portfolio_value > 0
    ? (portfolioDiff / baselineResults.final_portfolio_value) * 100
    : 0;

  const cppDiff = variantResults.total_cpp_received - baselineResults.total_cpp_received;
  const oasDiff = variantResults.total_oas_received - baselineResults.total_oas_received;
  const pensionDiff = variantResults.total_pension_received - baselineResults.total_pension_received;
  const otherIncomeDiff = variantResults.total_other_income_received - baselineResults.total_other_income_received;
  const taxDiff = variantResults.total_taxes_paid_in_retirement - baselineResults.total_taxes_paid_in_retirement;

  const firstYearIncomeDiff = variantResults.first_year_retirement_income - baselineResults.first_year_retirement_income;

  let depletionDiff: number | undefined;
  if (variantResults.portfolio_depleted_age && baselineResults.portfolio_depleted_age) {
    depletionDiff = variantResults.portfolio_depleted_age - baselineResults.portfolio_depleted_age;
  } else if (variantResults.portfolio_depleted_age && !baselineResults.portfolio_depleted_age) {
    // Variant depletes but baseline doesn't - that's bad
    const longevity = variantResults.year_by_year[variantResults.year_by_year.length - 1].age;
    depletionDiff = variantResults.portfolio_depleted_age - longevity; // Negative number
  } else if (!variantResults.portfolio_depleted_age && baselineResults.portfolio_depleted_age) {
    // Baseline depletes but variant doesn't - that's good
    const longevity = baselineResults.year_by_year[baselineResults.year_by_year.length - 1].age;
    depletionDiff = longevity - baselineResults.portfolio_depleted_age; // Positive number
  }

  return {
    portfolioDiff,
    portfolioPercent,
    cppDiff,
    oasDiff,
    pensionDiff,
    otherIncomeDiff,
    taxDiff,
    depletionDiff,
    firstYearIncomeDiff,
  };
}

/**
 * Format currency for prompt (compact, readable)
 */
function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount >= 0 ? '+' : '-';

  if (absAmount >= 1000000) {
    return `${sign}$${(absAmount / 1000000).toFixed(1)}M`;
  }
  if (absAmount >= 1000) {
    return `${sign}$${Math.round(absAmount / 1000)}K`;
  }
  return `${sign}$${Math.round(absAmount)}`;
}

/**
 * Format currency without sign for absolute values
 */
function formatCurrencyAbs(amount: number): string {
  const absAmount = Math.abs(amount);

  if (absAmount >= 1000000) {
    return `$${(absAmount / 1000000).toFixed(1)}M`;
  }
  if (absAmount >= 1000) {
    return `$${Math.round(absAmount / 1000)}K`;
  }
  return `$${Math.round(absAmount)}`;
}

/**
 * Build REQUIRED FACTS block with explicit direction indicators
 * This section tells the LLM exactly what values to cite
 */
function buildRequiredFacts(
  metrics: ComparisonMetrics,
  baselineResults: CalculationResults,
  variantResults: CalculationResults,
  baselineScenarioName?: string
): string {
  const facts: string[] = [];

  // Portfolio difference with explicit direction
  const portfolioDirection = metrics.portfolioDiff >= 0 ? 'MORE' : 'LESS';
  const portfolioVerb = metrics.portfolioDiff >= 0 ? 'increases' : 'decreases';
  facts.push(`- Portfolio ending balance: What-if scenario has ${formatCurrencyAbs(metrics.portfolioDiff)} ${portfolioDirection} than baseline (${portfolioVerb} from ${formatCurrencyAbs(baselineResults.final_portfolio_value)} to ${formatCurrencyAbs(variantResults.final_portfolio_value)})`);

  // Tax difference with explicit direction
  const taxDirection = metrics.taxDiff >= 0 ? 'MORE' : 'LESS';
  const taxVerb = metrics.taxDiff >= 0 ? 'pays' : 'saves';
  facts.push(`- Lifetime taxes: What-if scenario ${taxVerb} ${formatCurrencyAbs(metrics.taxDiff)} ${taxDirection === 'MORE' ? 'in taxes' : 'on taxes'} (${formatCurrencyAbs(baselineResults.total_taxes_paid_in_retirement)} → ${formatCurrencyAbs(variantResults.total_taxes_paid_in_retirement)})`);

  // Depletion comparison with explicit direction
  if (baselineResults.portfolio_depleted_age && variantResults.portfolio_depleted_age) {
    const diff = variantResults.portfolio_depleted_age - baselineResults.portfolio_depleted_age;
    if (diff > 0) {
      facts.push(`- Portfolio depletion: What-if scenario lasts ${Math.abs(diff)} years LONGER (depletes at age ${variantResults.portfolio_depleted_age} vs baseline age ${baselineResults.portfolio_depleted_age})`);
    } else if (diff < 0) {
      facts.push(`- Portfolio depletion: What-if scenario depletes ${Math.abs(diff)} years EARLIER (depletes at age ${variantResults.portfolio_depleted_age} vs baseline age ${baselineResults.portfolio_depleted_age})`);
    } else {
      facts.push(`- Portfolio depletion: Both deplete at age ${baselineResults.portfolio_depleted_age}`);
    }
  } else if (baselineResults.portfolio_depleted_age && !variantResults.portfolio_depleted_age) {
    facts.push(`- Portfolio depletion: What-if scenario SURVIVES to end (baseline depletes at age ${baselineResults.portfolio_depleted_age}, what-if scenario ends with ${formatCurrencyAbs(variantResults.final_portfolio_value)})`);
  } else if (!baselineResults.portfolio_depleted_age && variantResults.portfolio_depleted_age) {
    facts.push(`- Portfolio depletion: What-if scenario DEPLETES at age ${variantResults.portfolio_depleted_age} (baseline survives with ${formatCurrencyAbs(baselineResults.final_portfolio_value)})`);
  } else {
    facts.push(`- Portfolio depletion: Both survive to end`);
  }

  // CPP/OAS differences if significant
  if (Math.abs(metrics.cppDiff) > 10000) {
    const cppDir = metrics.cppDiff >= 0 ? 'MORE' : 'LESS';
    facts.push(`- Lifetime CPP: What-if scenario receives ${formatCurrencyAbs(metrics.cppDiff)} ${cppDir}`);
  }
  if (Math.abs(metrics.oasDiff) > 10000) {
    const oasDir = metrics.oasDiff >= 0 ? 'MORE' : 'LESS';
    facts.push(`- Lifetime OAS: What-if scenario receives ${formatCurrencyAbs(metrics.oasDiff)} ${oasDir}`);
  }

  const baselineName = baselineScenarioName || 'Baseline Scenario';

  return `## REQUIRED FACTS - You MUST cite these exact values:

SCENARIOS BEING COMPARED:
- BASELINE (reference scenario): "${baselineName}"
- WHAT-IF SCENARIO (what you're describing): The scenario you're analyzing

KEY DIFFERENCES (what-if scenario vs baseline):
${facts.join('\n')}

IMPORTANT:
- Use the EXACT dollar amounts and directions from KEY DIFFERENCES above
- Do NOT calculate your own values or round differently
- The BASELINE is "${baselineName}" - reference it by this name in your response
- You are describing how the WHAT-IF SCENARIO differs from the BASELINE`;
}

interface SpendingComparison {
  baselineMonthly: number;
  variantMonthly: number;
  legacyPercentage?: number;  // For Leave a Legacy variants
  legacyTarget?: number;      // Target legacy amount
}

interface OneTimeWithdrawal {
  age: number;
  amount: number;
  description?: string;
}

interface AgeBasedExpenseChange {
  age: number;
  monthly_amount: number;
}

interface PensionContext {
  annual_amount: number;
  indexed_to_inflation: boolean;
  has_bridge_benefit: boolean;
  bridge_reduction_amount?: number;
  bridge_reduction_age?: number;
  start_age?: number;
}

interface RetirementAgeComparison {
  baselineRetirementAge: number;
  variantRetirementAge: number;
}

interface BenefitStartAgeComparison {
  baselineCPPStartAge: number;
  variantCPPStartAge: number;
  baselineOASStartAge: number;
  variantOASStartAge: number;
}

interface MoveProvincesContext {
  fromProvince: string;
  toProvince: string;
  moveAge: number;
}

interface ReceiveInheritanceContext {
  amount: number;
  receiveAge: number;
  sourceType: 'cash' | 'rrsp_inherited' | 'investments' | 'property';
  isTaxable: boolean;
}

interface DownsizeHomeContext {
  currentHomeValue: number;
  netProceeds: number;
  downsizeAge: number;
  strategy: 'buy' | 'rent';
  newCostOrRent?: number;
}

/**
 * Generate variant insight using LLM
 */
export async function generateVariantInsight(
  baselineResults: CalculationResults,
  variantResults: CalculationResults,
  variantName: string,
  baselineScenarioName?: string,
  spendingComparison?: SpendingComparison,
  baselineOneTimeWithdrawals?: OneTimeWithdrawal[],
  variantOneTimeWithdrawals?: OneTimeWithdrawal[],
  baselineAgeBasedChanges?: AgeBasedExpenseChange[],
  variantAgeBasedChanges?: AgeBasedExpenseChange[],
  baselinePensionContext?: PensionContext,
  variantPensionContext?: PensionContext,
  retirementAgeComparison?: RetirementAgeComparison,
  benefitStartAgeComparison?: BenefitStartAgeComparison,
  moveProvincesContext?: MoveProvincesContext,
  receiveInheritanceContext?: ReceiveInheritanceContext,
  downsizeHomeContext?: DownsizeHomeContext
): Promise<string> {
  try {
    const metrics = extractComparison(baselineResults, variantResults);

    // Build context for LLM with baseline reference
    const baselineName = baselineScenarioName
      ? `your ${baselineScenarioName} baseline plan`
      : 'your baseline plan';

    // Build spending comparison context if provided
    let spendingContext = '';
    if (spendingComparison) {
      const spendingDiff = spendingComparison.variantMonthly - spendingComparison.baselineMonthly;
      const spendingPercent = spendingComparison.baselineMonthly > 0
        ? ((spendingDiff / spendingComparison.baselineMonthly) * 100).toFixed(1)
        : '0';

      spendingContext = `
  - Baseline spending: ${formatCurrency(spendingComparison.baselineMonthly)}/month
  - What-if scenario spending: ${formatCurrency(spendingComparison.variantMonthly)}/month (${formatCurrency(spendingDiff)} / ${spendingPercent}%)`;

      if (spendingComparison.legacyPercentage !== undefined && spendingComparison.legacyTarget !== undefined) {
        spendingContext += `
  - Legacy target: ${formatCurrency(spendingComparison.legacyTarget)} (${(spendingComparison.legacyPercentage * 100).toFixed(0)}% of starting portfolio)`;
      }
    }

    // Build one-time withdrawals context if provided
    let withdrawalsContext = '';
    if (baselineOneTimeWithdrawals && baselineOneTimeWithdrawals.length > 0) {
      const baselineTotal = baselineOneTimeWithdrawals.reduce((sum, w) => sum + w.amount, 0);
      withdrawalsContext += `
  - Baseline withdrawals: ${formatCurrency(baselineTotal)} total (${baselineOneTimeWithdrawals.length} withdrawal${baselineOneTimeWithdrawals.length > 1 ? 's' : ''})`;
      baselineOneTimeWithdrawals.forEach(w => {
        const desc = w.description ? ` for ${w.description}` : '';
        withdrawalsContext += `
    • Age ${w.age}: ${formatCurrency(w.amount)}${desc}`;
      });
    }
    if (variantOneTimeWithdrawals && variantOneTimeWithdrawals.length > 0) {
      const variantTotal = variantOneTimeWithdrawals.reduce((sum, w) => sum + w.amount, 0);
      withdrawalsContext += `
  - What-if scenario withdrawals: ${formatCurrency(variantTotal)} total (${variantOneTimeWithdrawals.length} withdrawal${variantOneTimeWithdrawals.length > 1 ? 's' : ''})`;
      variantOneTimeWithdrawals.forEach(w => {
        const desc = w.description ? ` for ${w.description}` : '';
        withdrawalsContext += `
    • Age ${w.age}: ${formatCurrency(w.amount)}${desc}`;
      });
    }

    // Build age-based spending strategy context
    let ageBasedContext = '';
    if (baselineAgeBasedChanges && baselineAgeBasedChanges.length > 0) {
      ageBasedContext += `
  Baseline spending strategy: ${baselineAgeBasedChanges.length} age-based change${baselineAgeBasedChanges.length > 1 ? 's' : ''}`;
      baselineAgeBasedChanges.forEach(c => {
        ageBasedContext += `
    • Age ${c.age}: ${formatCurrency(c.monthly_amount)}/month`;
      });
    }
    if (variantAgeBasedChanges && variantAgeBasedChanges.length > 0) {
      ageBasedContext += `
  What-if scenario spending strategy: ${variantAgeBasedChanges.length} age-based change${variantAgeBasedChanges.length > 1 ? 's' : ''}`;
      variantAgeBasedChanges.forEach(c => {
        ageBasedContext += `
    • Age ${c.age}: ${formatCurrency(c.monthly_amount)}/month`;
      });
    }

    // Build retirement age comparison context
    let retirementAgeContext = '';
    if (retirementAgeComparison) {
      const diff = retirementAgeComparison.variantRetirementAge - retirementAgeComparison.baselineRetirementAge;
      retirementAgeContext = `
  Baseline retirement age: ${retirementAgeComparison.baselineRetirementAge}
  What-if scenario retirement age: ${retirementAgeComparison.variantRetirementAge} (${diff > 0 ? '+' : ''}${diff} years)`;
    }

    // Build benefit start age comparison context
    let benefitContext = '';
    if (benefitStartAgeComparison) {
      benefitContext = `
  Baseline CPP/OAS start ages: ${benefitStartAgeComparison.baselineCPPStartAge}/${benefitStartAgeComparison.baselineOASStartAge}
  What-if scenario CPP/OAS start ages: ${benefitStartAgeComparison.variantCPPStartAge}/${benefitStartAgeComparison.variantOASStartAge}`;
    }

    // Build pension context
    let pensionContext = '';
    if (baselinePensionContext) {
      if (baselinePensionContext.has_bridge_benefit) {
        pensionContext += `
  Pension has bridge benefit: Reduces by ${formatCurrency(baselinePensionContext.bridge_reduction_amount || 0)} at age ${baselinePensionContext.bridge_reduction_age || 65}`;
      }
      if (baselinePensionContext.indexed_to_inflation) {
        pensionContext += `
  Pension indexed to inflation: Yes`;
      }
      if (!baselinePensionContext.indexed_to_inflation) {
        pensionContext += `
  Pension indexed to inflation: No (flat amount)`;
      }
    }

    // Build move provinces context
    let moveProvincesCtx = '';
    if (moveProvincesContext) {
      moveProvincesCtx = `
  Province Change: Moving from ${moveProvincesContext.fromProvince} to ${moveProvincesContext.toProvince} at age ${moveProvincesContext.moveAge}
  Impact: Provincial tax rates will change after the move`;
    }

    // Build receive inheritance context
    let inheritanceCtx = '';
    if (receiveInheritanceContext) {
      const taxNote = receiveInheritanceContext.isTaxable
        ? 'Taxable as income'
        : 'Tax-free (estate already paid taxes)';
      inheritanceCtx = `
  Inheritance: ${formatCurrencyAbs(receiveInheritanceContext.amount)} received at age ${receiveInheritanceContext.receiveAge}
  Source: ${receiveInheritanceContext.sourceType.replace('_', ' ')}
  Tax Treatment: ${taxNote}`;
    }

    // Build downsize home context
    let downsizeCtx = '';
    if (downsizeHomeContext) {
      const strategyNote = downsizeHomeContext.strategy === 'rent'
        ? `Sell home and rent (${formatCurrencyAbs(downsizeHomeContext.newCostOrRent || 0)}/month)`
        : `Buy smaller home (${formatCurrencyAbs(downsizeHomeContext.newCostOrRent || 0)})`;
      downsizeCtx = `
  Home Downsizing: At age ${downsizeHomeContext.downsizeAge}
  Current Home Value: ${formatCurrencyAbs(downsizeHomeContext.currentHomeValue)}
  Net Proceeds Unlocked: ${formatCurrencyAbs(downsizeHomeContext.netProceeds)}
  Strategy: ${strategyNote}
  Tax Treatment: Tax-free (principal residence exemption)`;
    }

    // Build the required facts block with explicit direction indicators
    const requiredFacts = buildRequiredFacts(metrics, baselineResults, variantResults, baselineScenarioName);

    const context = `
${requiredFacts}

## ADDITIONAL CONTEXT (for background, but cite REQUIRED FACTS above):

Baseline: ${baselineScenarioName || 'Your baseline plan'}
  - Ending balance: ${formatCurrencyAbs(baselineResults.final_portfolio_value)}
  - First year income: ${formatCurrencyAbs(baselineResults.first_year_retirement_income)}
  - Total Pension: ${formatCurrencyAbs(baselineResults.total_pension_received)}
  - Total CPP: ${formatCurrencyAbs(baselineResults.total_cpp_received)}
  - Total OAS: ${formatCurrencyAbs(baselineResults.total_oas_received)}
  - Total Other Income: ${formatCurrencyAbs(baselineResults.total_other_income_received)}${spendingContext}${withdrawalsContext}${ageBasedContext}${retirementAgeContext}${benefitContext}${pensionContext}${moveProvincesCtx}${inheritanceCtx}${downsizeCtx}

What-If Scenario: ${variantName}
  - Ending balance: ${formatCurrencyAbs(variantResults.final_portfolio_value)}
  - First year income: ${formatCurrencyAbs(variantResults.first_year_retirement_income)}
  - Total Pension: ${formatCurrencyAbs(variantResults.total_pension_received)}
  - Total CPP: ${formatCurrencyAbs(variantResults.total_cpp_received)}
  - Total OAS: ${formatCurrencyAbs(variantResults.total_oas_received)}
    `.trim();

    const systemPrompt = `You are a retirement planning analyst summarizing a scenario comparison.

CRITICAL INSTRUCTION: You MUST use the EXACT values from the "REQUIRED FACTS" section in the data below.
- Do NOT calculate your own values
- Do NOT round differently than shown
- Do NOT reverse the direction (MORE/LESS, LONGER/EARLIER)
- Copy the dollar amounts and directions EXACTLY as provided

Structure:
- Sentence 1: Bottom-line comparison referencing baseline by name (e.g., "Compared to **${baselineName}**, this what-if scenario...")
- Sentence 2-3: Cite the key facts with **bold** dollar amounts - use the EXACT values from REQUIRED FACTS
- Sentence 4: Practical implication

Guidelines:
- Use **bold** for dollar amounts (e.g., "**$507K more**" or "**$243K less**")
- Reference the baseline scenario by name
- For legacy/reduced spending scenarios: mention the spending reduction needed
- Use plain English, 60-100 words total`;

    const userPrompt = `Summarize the key insight for this scenario comparison:

${context}

What's the one thing the user needs to know about this what-if scenario compared to the baseline?`;

    const provider = process.env.AI_PROVIDER || 'openai';
    let insight = '';

    if (provider === 'gemini') {
      // Direct Gemini API call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\n${userPrompt}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,  // Lower temperature for more deterministic fact-citing
              maxOutputTokens: 200,
              thinkingConfig: {
                thinkingBudget: 0,  // Disable thinking - not needed for simple insight generation
              },
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      insight = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // Direct OpenAI API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,  // Lower temperature for more deterministic fact-citing
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      insight = data.choices[0]?.message?.content || '';
    }

    return insight.trim();
  } catch (error) {
    console.error('Failed to generate what-if scenario insight:', error);
    throw error;
  }
}
