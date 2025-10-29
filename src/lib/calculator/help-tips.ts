/**
 * Help tips for retirement calculator form fields
 * Used by both desktop sidebar and mobile drawer
 */

export interface HelpTip {
  title: string
  icon: string
  content: string
}

export const HELP_TIPS: Record<string, HelpTip> = {
  currentAge: {
    title: "Current Age",
    icon: "🎂",
    content: "Your age today. We calculate how many working years remain until retirement.\n\nMost Canadians start serious retirement planning in their 40s-50s, but starting earlier gives your investments more time to compound."
  },
  retirementAge: {
    title: "Retirement Age",
    icon: "🏖️",
    content: "When you plan to stop working full-time. The average Canadian retires at 64.\n\nEarlier retirement (55-60) requires more savings. Later retirement (67-70) means more time to save and higher CPP/OAS benefits."
  },
  longevityAge: {
    title: "Life Expectancy",
    icon: "📅",
    content: "How long you expect to live. Canadian life expectancy: men 81, women 85.\n\nMost planners use 90-95 to be safe. Planning longer ensures your money lasts—better to have leftovers than run out!"
  },
  province: {
    title: "Province",
    icon: "📍",
    content: "Your province determines your tax rates. Each province has different brackets and credits.\n\nLowest taxes: Alberta, SK. Highest: QC, NS, NL. Moving provinces in retirement can affect your after-tax income."
  },
  currentIncome: {
    title: "Current Income",
    icon: "💵",
    content: "Your annual employment income before taxes. Median Canadian income: ~$62,000.\n\nUsed to estimate your CPP contributions and future benefit. Higher income = higher CPP (up to max $17,200 at age 65)."
  },
  rrsp: {
    title: "RRSP Balance",
    icon: "🏦",
    content: "Registered Retirement Savings Plan. Tax-deferred growth—you pay income tax when you withdraw.\n\n2025 contribution limit: 18% of income (max $31,560). Converts to RRIF at age 71. Typical balance at 65: $200K-500K."
  },
  rrspContribution: {
    title: "RRSP Contributions",
    icon: "📈",
    content: "Annual RRSP contributions. Tax-deductible and grow tax-free until withdrawal.\n\nTypical: 5-10% of income. With employer matching, aim for 10-15%. Max $31,560/year (2025). Unused room carries forward."
  },
  tfsa: {
    title: "TFSA Balance",
    icon: "🌟",
    content: "Tax-Free Savings Account. Grows tax-free forever. Withdrawals are 100% tax-free—the best account for retirement income!\n\nCumulative limit since 2009: ~$95,000 if you never contributed. No age restrictions."
  },
  tfsaContribution: {
    title: "TFSA Contributions",
    icon: "💎",
    content: "Annual TFSA contributions. 2025 limit: $7,000. No tax deduction, but all growth and withdrawals are tax-free.\n\nIdeal for retirement: withdraw TFSA first to minimize taxable income and preserve OAS."
  },
  nonRegistered: {
    title: "Non-Registered",
    icon: "💼",
    content: "Taxable investment accounts. You pay capital gains tax (50% inclusion rate) on profits when you sell.\n\nUse these after maxing RRSP/TFSA. More tax-efficient for investments held long-term."
  },
  nonRegisteredContribution: {
    title: "Non-Registered Contributions",
    icon: "➕",
    content: "Annual contributions to taxable accounts. No limits, but no tax advantages either.\n\nMax out RRSP ($31,560) and TFSA ($7,000) first for better tax efficiency—that's $38,560/year in tax-sheltered savings."
  },
  monthlySpending: {
    title: "Monthly Spending",
    icon: "🛒",
    content: "Your desired monthly spending in retirement (pre-tax). Rule of thumb: 70-80% of pre-retirement income.\n\nMedian Canadian retiree: ~$4,000-5,000/month. We'll calculate taxes and adjust for inflation automatically."
  },
  pensionIncome: {
    title: "Pension Income",
    icon: "🏢",
    content: "Annual employer pension. Common for government, education, and union workers.\n\nTypical defined benefit pension: $30K-60K/year. Federal public service avg: ~$45K. Check if yours is indexed to inflation."
  },
  otherIncome: {
    title: "Other Income",
    icon: "💰",
    content: "Any other income in retirement: rental properties, part-time work, consulting, dividends from a business.\n\nReduces portfolio withdrawals and can delay CPP/OAS for higher benefits. Include annual amount."
  },
  cppStartAge: {
    title: "CPP Start Age",
    icon: "🇨🇦",
    content: "When you'll start Canada Pension Plan. 2025 max at 65: $17,200/year.\n\nStart at 60: 36% reduction ($11,000). Start at 70: 42% increase ($24,400). Break-even around age 74. Most Canadians start at 65."
  },
  investmentReturn: {
    title: "Pre-Retirement Return",
    icon: "📊",
    content: "Expected annual return while working (ages 30-65). Historical Canadian stock market: ~6-7%.\n\nConservative (bonds/GICs): 3-4%. Balanced (60/40): 5-6%. Aggressive (stocks): 7-8%. Default: 6%."
  },
  postRetirementReturn: {
    title: "Post-Retirement Return",
    icon: "🎯",
    content: "Expected return in retirement. Usually lower (4-5%) as you shift to bonds/GICs for stability and income.\n\nConservative: 3%. Balanced: 4-5%. Still some growth: 5-6%. Default: 4%."
  },
  inflationRate: {
    title: "Inflation Rate",
    icon: "📉",
    content: "Expected annual inflation. Canadian long-term average: 2-2.5%. Bank of Canada target: 2%.\n\nYour spending, CPP, and OAS will adjust for inflation. Using 2% is standard for retirement planning. Default: 2%."
  }
}

export const DEFAULT_TIP: HelpTip = {
  icon: "💡",
  title: "Pro Tip",
  content: "Click on any field in the form to see helpful information about what it means and how it affects your retirement plan."
}
