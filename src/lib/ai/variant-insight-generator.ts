/**
 * Variant Insight Generator
 *
 * Uses LLM to generate a 1-2 sentence key insight comparing baseline vs variant scenarios.
 * Analyzes the financial impact and highlights the most important tradeoff.
 */

import { CalculationResults } from '@/types/calculator';

interface ComparisonMetrics {
  portfolioDiff: number;
  portfolioPercent: number;
  cppDiff: number;
  oasDiff: number;
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
 * Generate variant insight using LLM
 */
export async function generateVariantInsight(
  baselineResults: CalculationResults,
  variantResults: CalculationResults,
  variantName: string
): Promise<string> {
  try {
    const metrics = extractComparison(baselineResults, variantResults);

    // Build context for LLM
    const context = `
Variant: ${variantName}
Portfolio impact: ${formatCurrency(metrics.portfolioDiff)} (${metrics.portfolioPercent.toFixed(1)}%)
CPP difference: ${formatCurrency(metrics.cppDiff)}
OAS difference: ${formatCurrency(metrics.oasDiff)}
Tax difference: ${formatCurrency(metrics.taxDiff)}
First year income: ${formatCurrency(metrics.firstYearIncomeDiff)}
${metrics.depletionDiff !== undefined ? `Depletion impact: ${metrics.depletionDiff > 0 ? 'Lasts ' + Math.abs(metrics.depletionDiff) + ' years longer' : 'Depletes ' + Math.abs(metrics.depletionDiff) + ' years earlier'}` : ''}
    `.trim();

    const systemPrompt = `You are a retirement planning analyst who explains what-if scenario impacts in clear, actionable language. Your job is to summarize the KEY tradeoff in 1-2 sentences.

Guidelines:
- Start with the bottom-line impact (better/worse/similar)
- Explain WHY using specific numbers from the data
- Focus on the MOST IMPORTANT metric (portfolio balance, depletion, or income)
- Use plain English (no jargon)
- Be concise: 30-50 words max
- Write in second person ("This strategy...")`;

    const userPrompt = `Summarize the key insight for this scenario comparison:

${context}

What's the one thing the user needs to know about this variant?`;

    const provider = process.env.AI_PROVIDER || 'openai';
    let insight = '';

    if (provider === 'gemini') {
      // Direct Gemini API call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
              temperature: 0.5,
              maxOutputTokens: 100,
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
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 100,
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
    console.error('Failed to generate variant insight:', error);
    throw error;
  }
}
