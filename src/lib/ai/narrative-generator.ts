/**
 * Retirement Narrative Generator
 *
 * Uses LLM to generate detailed 2-3 paragraph narratives (150-250 words) of retirement projections.
 * Sends comprehensive data including year-by-year breakdowns, tax analysis, and income strategies.
 */

import { CalculationResults, Scenario } from '@/types/calculator';

interface UserContext {
  currentAge: number;
  retirementAge: number;
  longevityAge: number;
  province: string;
  preRetirementReturn: number;
  postRetirementReturn: number;
  inflationRate: number;
}

interface YearSnapshot {
  age: number;
  totalIncome: number;
  cpp: number;
  oas: number;
  rrspRrif: number;
  tfsa: number;
  nonRegistered: number;
  taxes: number;
  effectiveTaxRate: number;
  afterTaxIncome: number;
  spending: number;
  portfolioTotal: number;
  rrspBalance: number;
  tfsaBalance: number;
  nonRegBalance: number;
}

interface TaxAnalysis {
  lifetimeTaxPaid: number;
  avgEffectiveRate: number;
  oasClawbackYears: number;
  taxEfficiencyScore: number;
}

interface IncomeStrategy {
  cppStartAge: number;
  cppAmount: number;
  oasStartAge: number;
  oasAmount: number;
  rrifConversionAge: number;
  govBenefitPercent: number;
  registeredWithdrawalPercent: number;
}

interface RichContext {
  userContext: UserContext;
  yearSnapshots: YearSnapshot[];
  taxAnalysis: TaxAnalysis;
  incomeStrategy: IncomeStrategy;
  summary: {
    portfolioDepleted: boolean;
    depletionAge?: number;
    finalBalance: number;
    peakBalance: number;
    peakAge: number;
  };
}

/**
 * Helper: Extract user context and assumptions
 */
function extractUserContext(results: CalculationResults): UserContext {
  const firstYear = results.year_by_year[0];
  const retirementYear = results.year_by_year.find(y => y.expenses > 0);
  const lastYear = results.year_by_year[results.year_by_year.length - 1];

  return {
    currentAge: firstYear?.age || 30,
    retirementAge: retirementYear?.age || 65,
    longevityAge: lastYear?.age || 95,
    province: 'ON', // TODO: Pass from scenario if available
    preRetirementReturn: 0.06, // TODO: Pass from scenario
    postRetirementReturn: 0.05, // TODO: Pass from scenario
    inflationRate: 0.02, // TODO: Pass from scenario
  };
}

/**
 * Helper: Sample year-by-year data at key points
 */
function extractYearByYearSample(results: CalculationResults): YearSnapshot[] {
  const firstRetirementAge = results.year_by_year.find(y => y.expenses > 0)?.age || 65;
  const retirementYears = results.year_by_year.filter(y => y.age >= firstRetirementAge);

  const snapshots: YearSnapshot[] = [];

  // First 5 years of retirement
  retirementYears.slice(0, 5).forEach(year => {
    snapshots.push(createYearSnapshot(year));
  });

  // Every 5th year after that (71, 76, 81, 86, 91)
  for (let i = 5; i < retirementYears.length; i += 5) {
    snapshots.push(createYearSnapshot(retirementYears[i]));
  }

  // Last 5 years
  const lastFive = retirementYears.slice(-5);
  lastFive.forEach(year => {
    // Avoid duplicates from the every-5-year sampling
    if (!snapshots.find(s => s.age === year.age)) {
      snapshots.push(createYearSnapshot(year));
    }
  });

  return snapshots.sort((a, b) => a.age - b.age);
}

function createYearSnapshot(year: any): YearSnapshot {
  const totalIncome = year.income?.total || 0;
  const taxes = year.tax?.total || 0;
  const effectiveTaxRate = totalIncome > 0 ? taxes / totalIncome : 0;

  return {
    age: year.age,
    totalIncome,
    cpp: year.income?.cpp || 0,
    oas: year.income?.oas || 0,
    rrspRrif: year.withdrawals?.rrsp_rrif || 0,
    tfsa: year.withdrawals?.tfsa || 0,
    nonRegistered: year.withdrawals?.non_registered || 0,
    taxes,
    effectiveTaxRate,
    afterTaxIncome: totalIncome - taxes,
    spending: year.expenses || 0,
    portfolioTotal: year.balances?.total || 0,
    rrspBalance: year.balances?.rrsp || 0,
    tfsaBalance: year.balances?.tfsa || 0,
    nonRegBalance: year.balances?.non_registered || 0,
  };
}

/**
 * Helper: Calculate tax analysis metrics
 */
function extractTaxAnalysis(results: CalculationResults): TaxAnalysis {
  const firstRetirementAge = results.year_by_year.find(y => y.expenses > 0)?.age || 65;
  const retirementYears = results.year_by_year.filter(y => y.age >= firstRetirementAge);

  const lifetimeTaxPaid = retirementYears.reduce((sum, y) => sum + (y.tax?.total || 0), 0);
  const totalIncome = retirementYears.reduce((sum, y) => sum + (y.income?.total || 0), 0);
  const avgEffectiveRate = totalIncome > 0 ? lifetimeTaxPaid / totalIncome : 0;

  // Count years with OAS clawback (approximate: high income years)
  const oasClawbackYears = retirementYears.filter(y => {
    const income = y.income?.total || 0;
    return income > 86912; // 2025 OAS clawback threshold
  }).length;

  // Tax efficiency score (lower effective rate = higher score)
  // Score: 100 - (effective rate * 100), capped at 0-100
  const taxEfficiencyScore = Math.max(0, Math.min(100, 100 - (avgEffectiveRate * 100)));

  return {
    lifetimeTaxPaid,
    avgEffectiveRate,
    oasClawbackYears,
    taxEfficiencyScore,
  };
}

/**
 * Helper: Extract income strategy details
 */
function extractIncomeStrategy(results: CalculationResults): IncomeStrategy {
  const firstRetirementAge = results.year_by_year.find(y => y.expenses > 0)?.age || 65;
  const retirementYears = results.year_by_year.filter(y => y.age >= firstRetirementAge);

  // Find when CPP starts
  const firstCPP = retirementYears.find(y => (y.income?.cpp || 0) > 0);
  const cppStartAge = firstCPP?.age || 65;
  const cppAmount = firstCPP?.income?.cpp || 0;

  // Find when OAS starts
  const firstOAS = retirementYears.find(y => (y.income?.oas || 0) > 0);
  const oasStartAge = firstOAS?.age || 65;
  const oasAmount = firstOAS?.income?.oas || 0;

  // Find RRIF conversion age (first year with RRSP/RRIF withdrawals)
  const firstRRIF = retirementYears.find(y => (y.withdrawals?.rrsp_rrif || 0) > 0);
  const rrifConversionAge = firstRRIF?.age || 65;

  // Calculate average percentages
  const totalIncome = retirementYears.reduce((sum, y) => sum + (y.income?.total || 0), 0);
  const totalGovBenefits = retirementYears.reduce(
    (sum, y) => sum + (y.income?.cpp || 0) + (y.income?.oas || 0),
    0
  );
  const totalRRSP = retirementYears.reduce(
    (sum, y) => sum + (y.withdrawals?.rrsp_rrif || 0),
    0
  );

  const govBenefitPercent = totalIncome > 0 ? totalGovBenefits / totalIncome : 0;
  const registeredWithdrawalPercent = totalIncome > 0 ? totalRRSP / totalIncome : 0;

  return {
    cppStartAge,
    cppAmount,
    oasStartAge,
    oasAmount,
    rrifConversionAge,
    govBenefitPercent,
    registeredWithdrawalPercent,
  };
}

/**
 * Main extraction function: Gather all rich context
 */
function extractRichContext(results: CalculationResults): RichContext {
  // Find peak balance
  let peakBalance = 0;
  let peakAge = 0;
  results.year_by_year.forEach(year => {
    if ((year.balances?.total || 0) > peakBalance) {
      peakBalance = year.balances?.total || 0;
      peakAge = year.age;
    }
  });

  const lastYear = results.year_by_year[results.year_by_year.length - 1];

  return {
    userContext: extractUserContext(results),
    yearSnapshots: extractYearByYearSample(results),
    taxAnalysis: extractTaxAnalysis(results),
    incomeStrategy: extractIncomeStrategy(results),
    summary: {
      portfolioDepleted: results.portfolio_depleted_age !== undefined,
      depletionAge: results.portfolio_depleted_age,
      finalBalance: lastYear?.balances?.total || 0,
      peakBalance,
      peakAge,
    },
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
 * Format percentage for prompt
 */
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Build rich context string for LLM prompt
 */
function buildRichContextPrompt(context: RichContext): string {
  const { userContext, yearSnapshots, taxAnalysis, incomeStrategy, summary } = context;

  let prompt = `## User Profile\n`;
  prompt += `- Current Age: ${userContext.currentAge}\n`;
  prompt += `- Retirement Age: ${userContext.retirementAge}\n`;
  prompt += `- Longevity Planning: Age ${userContext.longevityAge}\n`;
  prompt += `- Province: ${userContext.province}\n`;
  prompt += `- Investment Returns: ${formatPercent(userContext.preRetirementReturn)} pre-retirement, ${formatPercent(userContext.postRetirementReturn)} post-retirement\n`;
  prompt += `- Inflation Assumption: ${formatPercent(userContext.inflationRate)}\n\n`;

  prompt += `## Portfolio Outcome\n`;
  prompt += `- Peak Balance: ${formatCurrency(summary.peakBalance)} at age ${summary.peakAge}\n`;
  prompt += `- Final Balance: ${formatCurrency(summary.finalBalance)} at age ${userContext.longevityAge}\n`;
  if (summary.portfolioDepleted) {
    prompt += `- ⚠️ Portfolio Depleted: Age ${summary.depletionAge}\n`;
  } else {
    prompt += `- Portfolio Status: Sustains through longevity\n`;
  }
  prompt += `\n`;

  prompt += `## Income Strategy\n`;
  prompt += `- CPP: Starts age ${incomeStrategy.cppStartAge} at ${formatCurrency(incomeStrategy.cppAmount)}/year\n`;
  prompt += `- OAS: Starts age ${incomeStrategy.oasStartAge} at ${formatCurrency(incomeStrategy.oasAmount)}/year\n`;
  prompt += `- RRIF Conversion: Age ${incomeStrategy.rrifConversionAge}\n`;
  prompt += `- Government Benefits: ${formatPercent(incomeStrategy.govBenefitPercent)} of total retirement income\n`;
  prompt += `- Registered Withdrawals: ${formatPercent(incomeStrategy.registeredWithdrawalPercent)} of total retirement income\n\n`;

  prompt += `## Tax Analysis\n`;
  prompt += `- Lifetime Tax Paid: ${formatCurrency(taxAnalysis.lifetimeTaxPaid)}\n`;
  prompt += `- Average Effective Rate: ${formatPercent(taxAnalysis.avgEffectiveRate)}\n`;
  if (taxAnalysis.oasClawbackYears > 0) {
    prompt += `- OAS Clawback Years: ${taxAnalysis.oasClawbackYears} (high income years)\n`;
  }
  prompt += `- Tax Efficiency Score: ${Math.round(taxAnalysis.taxEfficiencyScore)}/100\n\n`;

  prompt += `## Year-by-Year Snapshot (Key Years)\n`;
  yearSnapshots.forEach(year => {
    prompt += `\nAge ${year.age}:\n`;
    prompt += `  Income: ${formatCurrency(year.totalIncome)} (CPP: ${formatCurrency(year.cpp)}, OAS: ${formatCurrency(year.oas)}, RRSP/RRIF: ${formatCurrency(year.rrspRrif)})\n`;
    prompt += `  Taxes: ${formatCurrency(year.taxes)} (${formatPercent(year.effectiveTaxRate)} effective rate)\n`;
    prompt += `  After-Tax: ${formatCurrency(year.afterTaxIncome)} | Spending: ${formatCurrency(year.spending)}\n`;
    prompt += `  Portfolio: ${formatCurrency(year.portfolioTotal)} (RRSP: ${formatCurrency(year.rrspBalance)}, TFSA: ${formatCurrency(year.tfsaBalance)}, Non-Reg: ${formatCurrency(year.nonRegBalance)})\n`;
  });

  return prompt;
}

/**
 * Generate retirement narrative using LLM
 */
export async function generateRetirementNarrative(
  results: CalculationResults
): Promise<string> {
  try {
    // Extract rich context
    const context = extractRichContext(results);
    const contextPrompt = buildRichContextPrompt(context);

    // Enhanced system prompt for 150-250 word narratives
    const systemPrompt = `You are a Canadian retirement planning analyst. Create a compelling 2-3 paragraph narrative (150-250 words) that tells the user's financial story with specific insights.

Structure:
• Paragraph 1: Opening with current situation and key outcome (portfolio fate)
• Paragraph 2: Income strategy and major transitions (government benefits, RRIF, tax impacts)
• Paragraph 3: Risks, opportunities, or notable patterns

Style Guidelines:
• Use **bold** for key ages and dollar amounts (e.g., **$1.2M at age 72**)
• Embed short bullet lists for clarity where helpful (max 3 bullets)
• Write conversationally in second person ("Your retirement savings...")
• Cite specific numbers from the data
• Be analytical but accessible (explain WHY things happen)
• Avoid jargon (say "retirement savings" not "portfolio")
• Be reassuring if healthy, honest if concerning
• Target 150-250 words total`;

    const userPrompt = `Analyze this Canadian retirement projection and create a detailed narrative:

${contextPrompt}

Write a 2-3 paragraph analysis highlighting the financial story, key transitions, and notable insights.`;

    const provider = process.env.AI_PROVIDER || 'openai';
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
              temperature: 0.75,  // Slightly higher for richer narratives
              maxOutputTokens: 400,  // Allow up to ~300 words with buffer
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
          temperature: 0.75,  // Slightly higher for richer narratives
          max_tokens: 400,  // Allow up to ~300 words with buffer
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      narrative = data.choices[0]?.message?.content || '';
    }

    return narrative.trim();
  } catch (error) {
    console.error('Failed to generate retirement narrative:', error);
    throw error;
  }
}
