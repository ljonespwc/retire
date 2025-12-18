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
  pension: number;
  cpp: number;
  oas: number;
  other: number;
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

interface RichContext {
  userContext: UserContext;
  yearSnapshots: YearSnapshot[];
  taxAnalysis: TaxAnalysis;
  incomeStrategy: IncomeStrategy;
  oneTimeWithdrawals: OneTimeWithdrawal[];
  ageBasedExpenseChanges: AgeBasedExpenseChange[];
  pensionContext?: PensionContext;
  summary: {
    portfolioDepleted: boolean;
    depletionAge?: number;
    finalBalance: number;
    peakBalance: number;
    peakAge: number;
  };
}

/**
 * Helper: Extract user context and assumptions from scenario
 */
function extractUserContext(results: CalculationResults, scenario: Scenario): UserContext {
  const firstYear = results.year_by_year[0];
  const retirementYear = results.year_by_year.find(y => y.expenses > 0);
  const lastYear = results.year_by_year[results.year_by_year.length - 1];

  return {
    currentAge: firstYear?.age || scenario.basic_inputs.current_age,
    retirementAge: retirementYear?.age || scenario.basic_inputs.retirement_age,
    longevityAge: lastYear?.age || scenario.basic_inputs.longevity_age,
    province: scenario.basic_inputs.province,
    preRetirementReturn: scenario.assumptions.pre_retirement_return,
    postRetirementReturn: scenario.assumptions.post_retirement_return,
    inflationRate: scenario.assumptions.inflation_rate,
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
    pension: year.income?.pension || 0,
    cpp: year.income?.cpp || 0,
    oas: year.income?.oas || 0,
    other: year.income?.other || 0,
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

  // Count years with OAS clawback (only years when OAS is being received)
  const oasClawbackYears = retirementYears.filter(y => {
    const oas = y.income?.oas || 0;
    const income = y.income?.total || 0;
    return oas > 0 && income > 86912; // Only count when receiving OAS AND above threshold
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
function extractRichContext(results: CalculationResults, scenario: Scenario): RichContext {
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

  // Extract one-time withdrawals
  const oneTimeWithdrawals: OneTimeWithdrawal[] = (scenario.expenses.one_time_withdrawals || []).map(w => ({
    age: w.age,
    amount: w.amount,
    description: w.description,
  }));

  // Extract age-based expense changes
  const ageBasedExpenseChanges: AgeBasedExpenseChange[] = (scenario.expenses.age_based_changes || []).map(c => ({
    age: c.age,
    monthly_amount: c.monthly_amount,
  }));

  // Extract pension context
  let pensionContext: PensionContext | undefined;
  if (scenario.income_sources.pension) {
    const p = scenario.income_sources.pension;
    pensionContext = {
      annual_amount: p.annual_amount,
      indexed_to_inflation: p.indexed_to_inflation,
      has_bridge_benefit: p.has_bridge_benefit || false,
      bridge_reduction_amount: p.bridge_reduction_amount,
      bridge_reduction_age: p.bridge_reduction_age,
      start_age: p.start_age,
    };
  }

  return {
    userContext: extractUserContext(results, scenario),
    yearSnapshots: extractYearByYearSample(results),
    taxAnalysis: extractTaxAnalysis(results),
    incomeStrategy: extractIncomeStrategy(results),
    oneTimeWithdrawals,
    ageBasedExpenseChanges,
    pensionContext,
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
 * Build CITABLE FACTS block - key facts the AI MUST use exactly as written
 * This prevents the AI from miscalculating or misreading values from detailed data
 */
function buildCitableFacts(context: RichContext): string {
  const { userContext, incomeStrategy, taxAnalysis, summary, pensionContext, oneTimeWithdrawals, ageBasedExpenseChanges } = context;

  const facts: string[] = [];

  // Timeline facts
  facts.push(`- Retirement starts: Age ${userContext.retirementAge}`);
  facts.push(`- Planning horizon: Age ${userContext.longevityAge} (${userContext.longevityAge - userContext.retirementAge} years in retirement)`);

  // Portfolio outcome facts
  facts.push(`- Portfolio peak: ${formatCurrency(summary.peakBalance)} at age ${summary.peakAge}`);
  if (summary.portfolioDepleted && summary.depletionAge) {
    const gapYears = userContext.longevityAge - summary.depletionAge;
    facts.push(`- Portfolio depletes: Age ${summary.depletionAge}`);
    if (gapYears > 0) {
      facts.push(`- SHORTFALL: ${gapYears} years unfunded (ages ${summary.depletionAge}-${userContext.longevityAge})`);
    }
  } else {
    facts.push(`- Portfolio survives: Ends with ${formatCurrency(summary.finalBalance)} at age ${userContext.longevityAge}`);
  }

  // Income strategy facts - use specific ages
  facts.push(`- CPP starts: Age ${incomeStrategy.cppStartAge} at ${formatCurrency(incomeStrategy.cppAmount)}/year`);
  facts.push(`- OAS starts: Age ${incomeStrategy.oasStartAge} at ${formatCurrency(incomeStrategy.oasAmount)}/year`);
  facts.push(`- RRIF withdrawals begin: Age ${incomeStrategy.rrifConversionAge}`);

  // Pension facts if exists
  if (pensionContext) {
    let pensionFact = `- Pension: ${formatCurrency(pensionContext.annual_amount)}/year`;
    if (pensionContext.start_age) {
      pensionFact += ` starting age ${pensionContext.start_age}`;
    }
    if (pensionContext.indexed_to_inflation) {
      pensionFact += ' (inflation-indexed)';
    }
    facts.push(pensionFact);

    if (pensionContext.has_bridge_benefit && pensionContext.bridge_reduction_amount && pensionContext.bridge_reduction_age) {
      facts.push(`- Bridge benefit ends: Age ${pensionContext.bridge_reduction_age} (pension drops by ${formatCurrency(pensionContext.bridge_reduction_amount)})`);
    }
  }

  // Tax facts
  facts.push(`- Lifetime taxes in retirement: ${formatCurrency(taxAnalysis.lifetimeTaxPaid)}`);
  facts.push(`- Average effective tax rate: ${formatPercent(taxAnalysis.avgEffectiveRate)}`);
  if (taxAnalysis.oasClawbackYears > 0) {
    facts.push(`- OAS clawback years: ${taxAnalysis.oasClawbackYears}`);
  }

  // One-time withdrawal facts
  if (oneTimeWithdrawals.length > 0) {
    oneTimeWithdrawals.forEach(w => {
      const desc = w.description ? ` for ${w.description}` : '';
      facts.push(`- One-time withdrawal: ${formatCurrency(w.amount)} at age ${w.age}${desc}`);
    });
  }

  // Age-based spending changes
  if (ageBasedExpenseChanges.length > 0) {
    facts.push(`- Spending phases: ${ageBasedExpenseChanges.length} changes (ages: ${ageBasedExpenseChanges.map(c => c.age).join(', ')})`);
  }

  return `## CITABLE FACTS - Use these EXACT values when mentioning ages, amounts, or percentages:
${facts.join('\n')}

IMPORTANT: When citing specific numbers in your narrative, copy them EXACTLY from this list.
Do NOT calculate your own values or round differently than shown above.`;
}

/**
 * Build rich context string for LLM prompt
 */
function buildRichContextPrompt(context: RichContext): string {
  const { userContext, yearSnapshots, taxAnalysis, incomeStrategy, oneTimeWithdrawals, ageBasedExpenseChanges, pensionContext, summary } = context;

  // Start with CITABLE FACTS prominently at the top
  let prompt = buildCitableFacts(context);
  prompt += '\n\n';

  prompt += `## DETAILED CONTEXT (for background - but cite CITABLE FACTS above for specific numbers):\n\n`;

  prompt += `### User Profile\n`;
  prompt += `- Current Age: ${userContext.currentAge}\n`;
  prompt += `- Retirement Age: ${userContext.retirementAge}\n`;
  prompt += `- Longevity Planning: Age ${userContext.longevityAge}\n`;
  prompt += `- Province: ${userContext.province}\n`;
  prompt += `- Investment Returns: ${formatPercent(userContext.preRetirementReturn)} pre-retirement, ${formatPercent(userContext.postRetirementReturn)} post-retirement\n`;
  prompt += `- Inflation Assumption: ${formatPercent(userContext.inflationRate)}\n\n`;

  prompt += `### Portfolio Outcome\n`;
  prompt += `- Peak Balance: ${formatCurrency(summary.peakBalance)} at age ${summary.peakAge}\n`;
  prompt += `- Longevity Target: Age ${userContext.longevityAge}\n`;

  if (summary.portfolioDepleted && summary.depletionAge) {
    const gapYears = userContext.longevityAge - summary.depletionAge;
    prompt += `- Portfolio Depletes: Age ${summary.depletionAge}\n`;

    if (gapYears > 1) {
      prompt += `- ⚠️ CRITICAL SHORTFALL: Portfolio runs out ${gapYears} YEARS BEFORE longevity target (ages ${summary.depletionAge}-${userContext.longevityAge} unfunded)\n`;
    } else if (gapYears === 1) {
      prompt += `- ⚠️ CAUTION: Portfolio runs out 1 year before longevity target\n`;
    } else if (gapYears === 0) {
      prompt += `- Portfolio Status: Depletes exactly at longevity target (tight timing, no cushion)\n`;
    } else {
      // gapYears is negative (depletes after longevity target)
      prompt += `- Portfolio Status: Sustains through longevity target\n`;
    }
  } else {
    prompt += `- Portfolio Status: Sustains through longevity with ${formatCurrency(summary.finalBalance)} remaining\n`;
  }
  prompt += `\n`;

  prompt += `### Income Strategy\n`;
  prompt += `- CPP: Starts age ${incomeStrategy.cppStartAge} at ${formatCurrency(incomeStrategy.cppAmount)}/year\n`;
  prompt += `- OAS: Starts age ${incomeStrategy.oasStartAge} at ${formatCurrency(incomeStrategy.oasAmount)}/year\n`;
  prompt += `- RRIF Conversion: Age ${incomeStrategy.rrifConversionAge}\n`;
  prompt += `- Government Benefits: ${formatPercent(incomeStrategy.govBenefitPercent)} of total retirement income\n`;
  prompt += `- Registered Withdrawals: ${formatPercent(incomeStrategy.registeredWithdrawalPercent)} of total retirement income\n\n`;

  // Add one-time withdrawals section if any exist
  if (oneTimeWithdrawals.length > 0) {
    prompt += `### One-Time Withdrawals\n`;
    oneTimeWithdrawals.forEach(w => {
      const desc = w.description ? ` for ${w.description}` : '';
      prompt += `- Age ${w.age}: ${formatCurrency(w.amount)}${desc}\n`;
    });
    prompt += `\n`;
  }

  // Add age-based expense changes section if any exist
  if (ageBasedExpenseChanges.length > 0) {
    prompt += `### Age-Based Spending Strategy\n`;
    ageBasedExpenseChanges.forEach(c => {
      prompt += `- Age ${c.age}: ${formatCurrency(c.monthly_amount)}/month\n`;
    });
    prompt += `\n`;
  }

  // Add pension context section if exists
  if (pensionContext) {
    prompt += `### Pension Details\n`;
    prompt += `- Annual Amount: ${formatCurrency(pensionContext.annual_amount)}\n`;
    if (pensionContext.start_age) {
      prompt += `- Starts: Age ${pensionContext.start_age}\n`;
    }
    prompt += `- Indexed to Inflation: ${pensionContext.indexed_to_inflation ? 'Yes' : 'No'}\n`;
    if (pensionContext.has_bridge_benefit) {
      prompt += `- Bridge Benefit: Reduces by ${formatCurrency(pensionContext.bridge_reduction_amount || 0)} at age ${pensionContext.bridge_reduction_age || 65}\n`;
    }
    prompt += `\n`;
  }

  prompt += `### Tax Analysis\n`;
  prompt += `- Lifetime Tax Paid: ${formatCurrency(taxAnalysis.lifetimeTaxPaid)}\n`;
  prompt += `- Average Effective Rate: ${formatPercent(taxAnalysis.avgEffectiveRate)}\n`;
  if (taxAnalysis.oasClawbackYears > 0) {
    prompt += `- OAS Clawback Years: ${taxAnalysis.oasClawbackYears} (high income years)\n`;
  }
  prompt += `- Tax Efficiency Score: ${Math.round(taxAnalysis.taxEfficiencyScore)}/100\n\n`;

  prompt += `### Year-by-Year Snapshot (Key Years)\n`;
  yearSnapshots.forEach(year => {
    prompt += `\nAge ${year.age}:\n`;
    // Build income breakdown - only show non-zero sources
    const incomeBreakdown = [];
    if (year.pension > 0) incomeBreakdown.push(`Pension: ${formatCurrency(year.pension)}`);
    if (year.cpp > 0) incomeBreakdown.push(`CPP: ${formatCurrency(year.cpp)}`);
    if (year.oas > 0) incomeBreakdown.push(`OAS: ${formatCurrency(year.oas)}`);
    if (year.other > 0) incomeBreakdown.push(`Other: ${formatCurrency(year.other)}`);
    if (year.rrspRrif > 0) incomeBreakdown.push(`RRSP/RRIF: ${formatCurrency(year.rrspRrif)}`);

    prompt += `  Income: ${formatCurrency(year.totalIncome)} (${incomeBreakdown.join(', ')})\n`;
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
  results: CalculationResults,
  scenario: Scenario
): Promise<string> {
  try {
    // Extract rich context
    const context = extractRichContext(results, scenario);
    const contextPrompt = buildRichContextPrompt(context);

    // Enhanced system prompt for 150-250 word narratives
    const systemPrompt = `You are a Canadian retirement planning analyst. Create a compelling 2-3 paragraph narrative (150-250 words) that tells the user's financial story with specific insights.

CRITICAL INSTRUCTION - CITING FACTS:
• The data contains a "CITABLE FACTS" section at the top - you MUST use those EXACT values
• When mentioning ages (CPP/OAS start, RRIF conversion, depletion age): Copy the EXACT age from CITABLE FACTS
• When mentioning dollar amounts: Copy the EXACT formatted amount from CITABLE FACTS
• Do NOT calculate your own values or round differently than shown
• If you want to mention a specific number, find it in CITABLE FACTS first

Structure:
• Paragraph 1: Opening with current situation and key outcome (portfolio fate)
• Paragraph 2: Income strategy and major transitions (government benefits, RRIF, tax impacts)
• Paragraph 3: Risks, opportunities, or notable patterns

Style Guidelines:
• Use **bold** for key ages and dollar amounts (e.g., **$1.2M at age 72**)
• Embed short bullet lists for clarity where helpful (max 3 bullets)
• Write conversationally in second person ("Your retirement savings...")
• Be analytical but accessible (explain WHY things happen)
• Avoid jargon (say "retirement savings" not "portfolio")
• Be reassuring if healthy, honest if concerning

CRITICAL: Portfolio Depletion Rules
• When you see "SHORTFALL" in CITABLE FACTS: Lead paragraph 1 with the warning, emphasize the unfunded gap
• When portfolio depletes exactly at longevity: Neutral tone, note the risk of living longer than planned
• When portfolio survives: Positive tone, mention the remaining balance as a cushion or legacy

CRITICAL WORD LIMIT:
• Target 150-250 words total
• Do not exceed 250 words under any circumstances
• Stop writing after completing paragraph 3
• End with a complete sentence - no cut-offs`;

    const userPrompt = `Analyze this Canadian retirement projection and create a detailed narrative:

${contextPrompt}

Write a 2-3 paragraph analysis highlighting the financial story, key transitions, and notable insights.`;

    const provider = process.env.AI_PROVIDER || 'openai';
    let narrative = '';

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
              temperature: 0.75,  // Slightly higher for richer narratives
              maxOutputTokens: 500,  // Safety buffer for 250 words (~375 tokens)
              thinkingConfig: {
                thinkingBudget: 0,  // Disable thinking - not needed for simple narrative generation
              },
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
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.75,  // Slightly higher for richer narratives
          max_tokens: 500,  // Safety buffer for 250 words (~375 tokens)
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
