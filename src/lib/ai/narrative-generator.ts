/**
 * Retirement Narrative Generator
 *
 * Uses LLM to generate a 3-4 sentence narrative summary of retirement projections.
 * Analyzes key insights from calculation results and creates a plain-English story.
 */

import { CalculationResults } from '@/types/calculator';

interface NarrativeInsights {
  startingBalance: number;
  peakBalance: number;
  peakAge: number;
  endingBalance: number;
  endingAge: number;
  portfolioDepleted: boolean;
  depletionAge?: number;
  govBenefitsStartAge: number;
  govBenefitsPercent: number;
  rrspWithdrawalPercent: number;
  stabilizationAge?: number;
  stabilizationBalance?: number;
}

/**
 * Extract key insights from calculation results
 */
function extractInsights(results: CalculationResults): NarrativeInsights {
  const firstRetirementAge = results.year_by_year.find(y => y.expenses > 0)?.age || 65;
  const retirementYears = results.year_by_year.filter(
    y => y.age >= firstRetirementAge
  );

  // Find peak balance
  let peakBalance = 0;
  let peakAge = 0;
  results.year_by_year.forEach(year => {
    if (year.balances.total > peakBalance) {
      peakBalance = year.balances.total;
      peakAge = year.age;
    }
  });

  // Find starting balance (first retirement year)
  const startingBalance = retirementYears[0]?.balances.total || 0;

  // Find ending balance and age
  const lastYear = results.year_by_year[results.year_by_year.length - 1];
  const endingBalance = lastYear?.balances.total || 0;
  const endingAge = lastYear?.age || 95;

  // Check for depletion
  const portfolioDepleted = results.portfolio_depleted_age !== undefined;
  const depletionAge = results.portfolio_depleted_age;

  // Find when government benefits start (first year with CPP or OAS)
  const govBenefitsStartAge = retirementYears.find(
    y => y.income.cpp > 0 || y.income.oas > 0
  )?.age || 65;

  // Calculate average government benefits percentage in retirement
  const totalIncome = retirementYears.reduce((sum, y) => sum + y.income.total, 0);
  const totalGovBenefits = retirementYears.reduce(
    (sum, y) => sum + y.income.cpp + y.income.oas,
    0
  );
  const govBenefitsPercent = totalIncome > 0
    ? Math.round((totalGovBenefits / totalIncome) * 100)
    : 0;

  // Calculate RRSP/RRIF withdrawal percentage
  const totalRRSPWithdrawals = retirementYears.reduce(
    (sum, y) => sum + y.withdrawals.rrsp_rrif,
    0
  );
  const rrspWithdrawalPercent = totalIncome > 0
    ? Math.round((totalRRSPWithdrawals / totalIncome) * 100)
    : 0;

  // Find stabilization point (where balance changes < 5% year-over-year for 3+ years)
  let stabilizationAge: number | undefined;
  let stabilizationBalance: number | undefined;

  for (let i = 3; i < retirementYears.length; i++) {
    const curr = retirementYears[i];
    const prev = retirementYears[i - 1];
    const prev2 = retirementYears[i - 2];

    const change1 = Math.abs(curr.balances.total - prev.balances.total) / prev.balances.total;
    const change2 = Math.abs(prev.balances.total - prev2.balances.total) / prev2.balances.total;

    if (change1 < 0.05 && change2 < 0.05) {
      stabilizationAge = curr.age;
      stabilizationBalance = curr.balances.total;
      break;
    }
  }

  return {
    startingBalance,
    peakBalance,
    peakAge,
    endingBalance,
    endingAge,
    portfolioDepleted,
    depletionAge,
    govBenefitsStartAge,
    govBenefitsPercent,
    rrspWithdrawalPercent,
    stabilizationAge,
    stabilizationBalance,
  };
}

/**
 * Format currency for prompt (compact, readable)
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${Math.round(amount)}`;
}

/**
 * Generate retirement narrative using LLM
 */
export async function generateRetirementNarrative(
  results: CalculationResults
): Promise<string> {
  try {
    console.log('📊 Narrative Generator: Extracting insights from results...');
    const insights = extractInsights(results);
    console.log('📊 Narrative Generator: Insights extracted:', insights);

    // Build context for LLM
    const context = `
Starting portfolio: ${formatCurrency(insights.startingBalance)}
Peak portfolio: ${formatCurrency(insights.peakBalance)} at age ${insights.peakAge}
Ending portfolio: ${formatCurrency(insights.endingBalance)} at age ${insights.endingAge}
Portfolio depleted: ${insights.portfolioDepleted ? `Yes, at age ${insights.depletionAge}` : 'No'}
Government benefits start: Age ${insights.govBenefitsStartAge}, providing ${insights.govBenefitsPercent}% of total income
RRSP/RRIF withdrawals: ${insights.rrspWithdrawalPercent}% of total income
${insights.stabilizationAge ? `Portfolio stabilizes: Age ${insights.stabilizationAge} at ${formatCurrency(insights.stabilizationBalance || 0)}` : ''}
    `.trim();

    const systemPrompt = `You are a retirement planning analyst who explains calculation results in simple, conversational language. Your job is to tell the user's financial story in 3-4 sentences.

Guidelines:
- Use specific ages and amounts from the data
- Focus on the narrative arc: grow → peak → draw → stabilize/deplete
- Mention government benefits as "kick in" or "start"
- Avoid jargon (say "retirement savings" not "portfolio")
- Be reassuring if healthy, honest if concerning
- 60-80 words total
- Write in second person ("Your retirement savings...")`;

    const userPrompt = `Write a 3-4 sentence narrative for this retirement scenario:

${context}

Create a story that highlights the key financial transitions and outcomes.`;

    const provider = process.env.AI_PROVIDER || 'openai';
    console.log(`🤖 Narrative Generator: Calling ${provider} API...`);

    let narrative = '';

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
              temperature: 0.7,
              maxOutputTokens: 150,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      narrative = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      narrative = data.choices[0]?.message?.content || '';
    }

    console.log('✅ Narrative Generator: AI response received:', narrative);

    return narrative.trim();
  } catch (error) {
    console.error('Failed to generate retirement narrative:', error);
    throw error;
  }
}
