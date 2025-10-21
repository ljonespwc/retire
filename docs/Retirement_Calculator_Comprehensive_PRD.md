# Product Requirements Document (PRD)
## Voice-Driven Canadian Retirement Income Calculator

**Version:** 1.0  
**Date:** October 20, 2025  
**Status:** Draft for Development  
**Document Owner:** Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [User Personas](#3-user-personas)
4. [Product Tiers & Feature Matrix](#4-product-tiers--feature-matrix)
5. [Core Features & Specifications](#5-core-features--specifications)
6. [Input Parameters & Data Model](#6-input-parameters--data-model)
7. [Calculation Engine Specifications](#7-calculation-engine-specifications)
8. [Voice Integration Requirements](#8-voice-integration-requirements)
9. [User Interface & Experience](#9-user-interface--experience)
10. [Technical Architecture](#10-technical-architecture)
11. [API Specifications](#11-api-specifications)
12. [Canadian Tax & Regulatory Compliance](#12-canadian-tax--regulatory-compliance)
13. [Security & Privacy](#13-security--privacy)
14. [Performance Requirements](#14-performance-requirements)
15. [Analytics & Success Metrics](#15-analytics--success-metrics)
16. [Testing Requirements](#16-testing-requirements)
17. [Development Roadmap](#17-development-roadmap)
18. [Dependencies & Risks](#18-dependencies--risks)
19. [Appendices](#19-appendices)

---

## 1. Executive Summary

### 1.1 Product Overview
A conversational, voice-first retirement income calculator specifically designed for Canadian users. The platform combines natural language interaction (powered by Layercode voice AI) with sophisticated financial modeling to help Canadians understand their retirement income potential without complex spreadsheets or financial jargon.

### 1.2 Problem Statement
Current retirement calculators are:
- Primarily designed for US markets (incompatible with Canadian tax structures)
- Form-based and intimidating for non-financial users
- Lack personalization for RRSP/RRIF, TFSA, CPP/OAS rules
- Provide generic outputs without actionable insights
- Don't support natural conversation or iteration

### 1.3 Solution
An intelligent, voice-driven platform that:
- Accepts natural language input via voice or text
- Provides accurate projections based on Canadian tax rules
- Offers tiered complexity (Basic → Pro → Advanced)
- Delivers visual, interactive results
- Enables scenario comparison and sensitivity analysis
- Scales from individual use to advisor/enterprise deployment

### 1.4 Target Users
- **Primary:** Pre-retirees aged 45-70 with $100K-$10M+ in assets
- **Secondary:** Financial advisors, planners, and wealth managers
- **Tertiary:** Financial institutions and fintech companies (API integration)

### 1.5 Business Model
- **Basic Tier:** Free (ad-supported or lead generation)
- **Pro Tier:** $9-19/month (individual premium features)
- **Advanced Tier:** $99-499/month (advisor/enterprise white-label)
- **API Licensing:** $1K-10K/month (fintech integration)

---

## 2. Product Vision & Goals

### 2.1 Vision Statement
"To democratize retirement planning for all Canadians by making sophisticated financial projections as simple as having a conversation."

### 2.2 Strategic Goals
1. **Accessibility:** Enable any Canadian to understand their retirement potential in under 5 minutes
2. **Accuracy:** Provide tax-precise calculations aligned with CRA regulations
3. **Engagement:** Create an enjoyable, non-intimidating planning experience
4. **Scalability:** Support individual, advisor, and institutional use cases
5. **Innovation:** Establish voice-first financial planning as the new standard

### 2.3 Success Criteria (Year 1)
- 50,000+ registered users
- 10,000+ completed simulations per month
- 5% free-to-paid conversion rate
- 500+ advisor accounts
- 4.5+ star rating / 70+ NPS score
- $500K+ ARR

---

## 3. User Personas

### 3.1 Persona 1: "Planning Paul"
**Demographics:**
- Age: 58
- Occupation: Senior Manager
- Income: $150K/year
- Assets: $2M (RRSP $1.2M, TFSA $200K, Non-reg $600K)

**Goals:**
- Wants to retire at 62-65
- Needs to know if he has "enough"
- Concerned about tax efficiency
- Wants to leave inheritance for children

**Pain Points:**
- Intimidated by financial jargon
- Doesn't trust generic online calculators
- Too expensive to hire full financial planner for basic question
- Wants to explore scenarios himself before committing to advisor

**Use Case:** Uses Basic Tier to get initial sense of feasibility, upgrades to Pro for tax optimization insights

---

### 3.2 Persona 2: "Advisor Angela"
**Demographics:**
- Age: 42
- Occupation: Independent Financial Advisor
- Clients: 50-100 active
- AUM: $50-100M

**Goals:**
- Needs modern tools to engage younger clients
- Wants to demonstrate value through interactive planning
- Requires accurate, defensible calculations
- Seeks efficiency in client onboarding

**Pain Points:**
- Current software is clunky and expensive
- Clients want to "play" with scenarios between meetings
- Generic tools don't reflect Canadian tax reality
- Needs white-label branding capability

**Use Case:** Uses Advanced Tier with multi-client dashboard, white-label branding, and detailed export reports

---

### 3.3 Persona 3: "Tech-Forward Tom"
**Demographics:**
- Age: 52
- Occupation: Software Engineer
- Income: $200K/year
- Assets: $5M+ (heavy tech stock concentration)

**Goals:**
- Wants to DIY his retirement planning
- Interested in early retirement (FIRE movement)
- Wants to optimize every dollar
- Enjoys data visualization and scenario analysis

**Pain Points:**
- Existing tools too simplistic for his needs
- Wants granular control over assumptions
- Needs to model complex equity compensation scenarios
- Wants API access or data export for custom analysis

**Use Case:** Power user of Pro Tier, potentially uses API for custom integrations

---

### 3.4 Persona 4: "Fintech Fran"
**Demographics:**
- Role: Product Manager at Canadian digital bank
- Company: Mid-size fintech startup
- Goal: Enhance customer engagement and retention

**Goals:**
- Needs retirement planning widget for customer portal
- Wants branded, seamless integration
- Requires API with reliable uptime
- Needs to maintain customer data sovereignty

**Pain Points:**
- Building in-house is too expensive/slow
- US-based solutions don't work for Canadian customers
- Needs SOC 2 / regulatory compliance
- Wants flexible white-label options

**Use Case:** API licensing with custom branding and data integration

---

## 4. Product Tiers & Feature Matrix

### 4.1 Tier Overview

| Feature Category | Basic (Free) | Pro ($9-19/mo) | Advanced ($99-499/mo) |
|-----------------|--------------|----------------|----------------------|
| **Core Functionality** | | | |
| Voice input/output | ✓ | ✓ | ✓ |
| Text fallback | ✓ | ✓ | ✓ |
| Basic simulation | ✓ | ✓ | ✓ |
| Single scenario | ✓ | ✓ | ✓ |
| Multi-scenario comparison | — | ✓ (up to 3) | ✓ (unlimited) |
| **Input Sophistication** | | | |
| Basic inputs (age, savings, target) | ✓ | ✓ | ✓ |
| Account type breakdown (RRSP/TFSA/Non-reg) | ✓ | ✓ | ✓ |
| CPP/OAS timing | ✓ | ✓ | ✓ |
| Provincial tax calculation | Generic | ✓ | ✓ |
| Spouse/joint planning | — | ✓ | ✓ |
| Income-splitting strategies | — | ✓ | ✓ |
| Variable expense modeling | — | ✓ | ✓ |
| Estate/bequest goals | — | ✓ | ✓ |
| Corporate assets (CCPC) | — | — | ✓ |
| Stock options/RSUs | — | — | ✓ |
| Rental income streams | — | ✓ | ✓ |
| Part-time work bridge | — | ✓ | ✓ |
| **Output & Visualization** | | | |
| Monthly/annual income projection | ✓ | ✓ | ✓ |
| Portfolio balance chart | ✓ | ✓ | ✓ |
| Basic tax estimate | ✓ | ✓ | ✓ |
| Detailed tax breakdown by source | — | ✓ | ✓ |
| Withdrawal sequence optimization | — | ✓ | ✓ |
| Monte Carlo probability analysis | — | — | ✓ |
| Longevity risk assessment | — | ✓ | ✓ |
| Year-by-year detailed table | — | ✓ | ✓ |
| Inflation-adjusted vs nominal toggle | — | ✓ | ✓ |
| **Sensitivity Analysis** | | | |
| Single variable slider (return rate) | ✓ | ✓ | ✓ |
| Multi-variable sensitivity | — | ✓ | ✓ |
| Best/worst case scenarios | — | ✓ | ✓ |
| Stress testing (market crashes) | — | — | ✓ |
| **Export & Sharing** | | | |
| Screenshot/image export | ✓ | ✓ | ✓ |
| PDF report (basic) | — | ✓ | ✓ |
| PDF report (comprehensive) | — | — | ✓ |
| CSV/Excel export | — | ✓ | ✓ |
| Share link (read-only) | — | ✓ | ✓ |
| **Advisor Features** | | | |
| Multi-client dashboard | — | — | ✓ |
| White-label branding | — | — | ✓ |
| Client collaboration mode | — | — | ✓ |
| Notes and annotations | — | — | ✓ |
| Compliance reporting | — | — | ✓ |
| **Technical** | | | |
| Save scenarios | 1 | 10 | Unlimited |
| Version history | — | ✓ | ✓ |
| API access | — | — | ✓ (add-on) |
| Priority support | — | — | ✓ |
| **Limits** | | | |
| Simulations per month | 10 | Unlimited | Unlimited |
| Data retention | 30 days | 2 years | Unlimited |

---

## 5. Core Features & Specifications

### 5.1 Voice Conversation System

#### 5.1.1 Voice Input Processing
**Requirements:**
- Accept continuous natural speech via microphone
- Parse intent from casual conversation (not just commands)
- Handle Canadian accents and French-English code-switching
- Support dictation of numbers in both word and digit form
- Recognize financial terminology (RRSP, TFSA, etc.)

**Example Interactions:**
```
User: "Hey, I'm 58 and have about 8 million in RRSPs. When can I retire?"
System: "With $8 million in RRSPs at 58, you have significant flexibility. When would you ideally like to retire?"

User: "Maybe 62, 63... not sure."
System: "Let's explore both. If you retire at 62, how many years would you like your money to last?"

User: "Until I'm 90."
System: "Perfect. And what are your current monthly expenses you'd like to maintain in retirement?"
```

**Technical Specifications:**
- Voice activity detection (VAD) threshold: 500ms silence = end of utterance
- Confidence threshold for intent: >0.75 to accept, <0.75 triggers clarification
- Latency target: <2s from speech end to system response
- Fallback: If 3 consecutive low-confidence inputs, offer text input mode

---

#### 5.1.2 Voice Output Synthesis
**Requirements:**
- Natural Canadian English voice (neutral accent)
- Optional French voice for Quebec users
- Conversational tone, not robotic
- Ability to emphasize key numbers and insights
- Adjustable speech rate (default: 150-175 WPM)

**Voice Personas:**
- **Default (Neutral):** Professional but warm, like a patient advisor
- **Encouraging:** Upbeat, celebration-oriented (for positive outcomes)
- **Cautious:** Gentle, supportive (for challenging scenarios)

**Example Outputs:**
```
Scenario: User has sufficient funds
Voice tone: Encouraging
"Great news! With your current savings and a 6% return, you could comfortably withdraw $7,200 per month after tax from age 62 to 90. That's well above your $2,500 in fixed expenses."

Scenario: User may need adjustments
Voice tone: Cautious
"Based on your current plan, you'd have about $4,800 per month after tax. That covers your needs, but leaves limited buffer. Would you like to explore ways to increase that - maybe delaying retirement by a year or two?"
```

---

### 5.2 Financial Input Questionnaire

#### 5.2.1 Guided Conversation Flow (Basic Tier)
The system should ask questions in this sequence, adapting based on user responses:

**Stage 1: Foundation (Required)**
1. "How old are you today?" → Stores current_age
2. "When would you like to retire?" → Stores target_retirement_age
3. "How long would you like your money to last?" → Stores longevity_age (default 90 if not specified)
4. "What are your current monthly expenses?" → Stores monthly_expenses

**Stage 2: Assets (Required)**
5. "How much do you have saved in RRSPs?" → Stores rrsp_balance
6. "Do you have any money in a TFSA?" → Stores tfsa_balance
7. "Any other investments or savings accounts?" → Stores non_registered_balance
8. "Are you still contributing to your savings?" → Stores annual_contribution

**Stage 3: Assumptions (Optional - System offers defaults)**
9. "What rate of return do you expect on your investments after retirement?" → Stores post_retirement_return (default 6%)
10. "What rate of return before retirement?" → Stores pre_retirement_return (default 6%)
11. "What inflation rate should we assume?" → Stores inflation_rate (default 2.5%)

**Stage 4: Government Benefits (Optional)**
12. "When do you plan to start CPP?" → Stores cpp_start_age (default 65)
13. "When will you start OAS?" → Stores oas_start_age (default 65)
14. "Do you know your estimated CPP amount?" → Stores cpp_amount (default: calculate based on average)

**Stage 5: Goals (Optional)**
15. "Would you like to leave any money for heirs?" → Stores bequest_goal
16. "What province do you live in?" → Stores province (for tax calculation)

---

#### 5.2.2 Advanced Inputs (Pro & Advanced Tiers)

**Detailed Asset Breakdown:**
- RRSP account types (personal, spousal)
- Locked-in accounts (LIRA, LIF)
- TFSA contribution room remaining
- Non-registered account cost base (for capital gains calculation)
- Employer pension plans (DB vs DC)
- Real estate equity
- Business ownership (CCPC shares)

**Income Sources:**
- Rental income (gross and net)
- Part-time work during retirement
- Deferred compensation
- Stock options and RSU vesting schedules
- Annuities or guaranteed income

**Expense Modeling:**
- Fixed expenses (housing, insurance, food)
- Variable expenses (travel, hobbies, healthcare)
- One-time expenses (home renovation, car purchase)
- Age-based expense changes (common: higher spending 60-75, lower 75+)

**Spouse/Partner Planning:**
- Spouse age and life expectancy
- Spouse accounts and pensions
- Joint vs individual expenses
- Survivor benefits and income-splitting

**Advanced Tax Planning:**
- Pension income splitting
- OAS clawback management
- RRIF meltdown strategies
- Corporate dividend planning
- Capital gains exemption usage

---

### 5.3 Calculation Engine

#### 5.3.1 Core Calculation Methodology

**Pre-Retirement Growth Phase:**
```
For each year from current_age to retirement_age:
  Beginning_balance = Previous_year_ending_balance + Annual_contribution
  Ending_balance = Beginning_balance × (1 + pre_retirement_return)
```

**Retirement Withdrawal Phase:**
```
For each year from retirement_age to longevity_age:
  1. Calculate required withdrawal (adjusted for inflation)
  2. Determine withdrawal source order
  3. Apply account-specific tax treatment
  4. Add government benefits (CPP, OAS)
  5. Calculate total gross income
  6. Apply marginal tax rates
  7. Output after-tax income
  8. Update portfolio balance
```

**Withdrawal Sequencing Logic (Tax-Optimized):**
1. **Ages 60-64:** Withdraw from non-registered (utilize capital gains, minimize RRSP growth)
2. **Ages 65-70:** Blend of non-registered + TFSA, start government benefits
3. **Age 71+:** RRIF mandatory minimums + strategic TFSA + remaining non-registered

---

#### 5.3.2 RRIF Minimum Withdrawal Table

Must implement exact CRA percentages:

| Age | Minimum % | Age | Minimum % | Age | Minimum % |
|-----|-----------|-----|-----------|-----|-----------|
| 71 | 5.28% | 80 | 6.82% | 89 | 11.92% |
| 72 | 5.40% | 81 | 7.08% | 90 | 13.62% |
| 73 | 5.53% | 82 | 7.38% | 91 | 15.19% |
| 74 | 5.67% | 83 | 7.71% | 92 | 16.34% |
| 75 | 5.82% | 84 | 8.08% | 93 | 17.71% |
| 76 | 5.98% | 85 | 8.51% | 94 | 19.35% |
| 77 | 6.17% | 86 | 8.99% | 95+ | 20.00% |
| 78 | 6.36% | 87 | 9.55% | | |
| 79 | 6.58% | 88 | 10.21% | | |

**Implementation:**
- At age 71, convert RRSP → RRIF
- Calculate: Minimum = RRIF_balance × percentage_for_age
- Actual withdrawal = MAX(desired_withdrawal, minimum_required)
- If minimum > desired, note excess taxation in output

---

#### 5.3.3 CPP & OAS Calculation

**CPP Calculation:**
- Maximum CPP (2025): $1,364.60/month = $16,375/year
- Average CPP: $758.32/month = $9,100/year
- User can input estimated amount OR system estimates based on:
  - Age (years of contribution)
  - Income level (if provided)
  - Default to 70% of maximum if no data

**CPP Adjustment Factors:**
- Starting at 60: -36% (0.6% per month early)
- Starting at 65: 100% (baseline)
- Starting at 70: +42% (0.7% per month late)

**OAS Calculation:**
- Maximum OAS (2025): $713.34/month = $8,560/year
- Full eligibility: 40 years Canadian residence after age 18
- Partial: Prorated by years of residence
- User can specify % eligibility (default 100%)

**OAS Adjustment Factors:**
- Starting at 65: 100% (baseline)
- Starting at 70: +36% (0.6% per month late)
- Cannot start before 65

**OAS Clawback (Recovery Tax):**
- Starts at income > $86,912 (2025)
- Claws back at 15% rate
- Fully eliminated at ~$142,609 income
- Must model in high-income scenarios

**Implementation:**
```
CPP_annual = base_CPP_amount × adjustment_factor_for_start_age
OAS_annual = base_OAS_amount × adjustment_factor_for_start_age × eligibility_percentage

If gross_income > $86,912:
  OAS_clawback = MIN(OAS_annual, (gross_income - 86912) × 0.15)
  Net_OAS = OAS_annual - OAS_clawback
```

---

#### 5.3.4 Tax Calculation Engine

**Federal Tax Brackets (2025 - index annually):**
| Income Range | Rate |
|--------------|------|
| $0 - $55,867 | 15% |
| $55,867 - $111,733 | 20.5% |
| $111,733 - $173,205 | 26% |
| $173,205 - $246,752 | 29% |
| $246,752+ | 33% |

**Provincial Tax Rates (must implement all):**

Ontario (example):
| Income Range | Rate |
|--------------|------|
| $0 - $51,446 | 5.05% |
| $51,446 - $102,894 | 9.15% |
| $102,894 - $150,000 | 11.16% |
| $150,000 - $220,000 | 12.16% |
| $220,000+ | 13.16% |

*(Full implementation requires all 13 provinces/territories - see Appendix A)*

**Account-Specific Tax Treatment:**

1. **RRSP/RRIF Withdrawals:**
   - 100% taxable as ordinary income
   - Add to gross income, apply marginal rates

2. **Non-Registered Investment Income:**
   - **Capital Gains:** 50% inclusion rate
   - **Canadian Dividends:** Eligible dividend tax credit (federal ~15%, varies by province)
   - **Interest:** 100% taxable
   - User can specify portfolio composition or default: 70% cap gains, 20% dividends, 10% interest

3. **TFSA Withdrawals:**
   - 0% tax
   - Does not impact income for OAS clawback

**Calculation Logic:**
```
Gross_income = RRIF_withdrawal + Non_reg_income + CPP + OAS
Taxable_income = Gross_income - (adjustments + deductions)

Federal_tax = apply_brackets(Taxable_income, federal_brackets)
Provincial_tax = apply_brackets(Taxable_income, provincial_brackets[user_province])

Total_tax = Federal_tax + Provincial_tax - (credits)

After_tax_income = Gross_income - Total_tax
```

**Simplification for Basic Tier:**
- Use blended effective rate (30-35% for typical retiree)
- Show "approximate after-tax" with disclosure

**Detailed Calculation for Pro/Advanced:**
- Exact marginal rate calculation
- Show tax breakdown by source (RRIF, CPP, etc.)
- Model strategies like pension splitting

---

#### 5.3.5 Inflation Adjustment

**Two Display Modes:**
1. **Nominal Dollars:** Actual future dollar amounts
2. **Real Dollars (Today's Purchasing Power):** Inflation-adjusted to current year

**Calculation:**
```
Real_value = Nominal_value / ((1 + inflation_rate) ^ years_from_now)
```

**User Selection:**
- Default: Real dollars (easier for planning)
- Toggle available to see nominal
- All charts should clearly label which mode is active

**Inflation Sources:**
- User input (default 2.5%)
- Bank of Canada 2% target
- Historical average (2.3% over 30 years)
- Conservative (3%)

---

#### 5.3.6 Monte Carlo Simulation (Advanced Tier Only)

**Purpose:** Model probability of success under variable market returns

**Implementation:**
- Run 10,000 simulations
- Each simulation uses random annual returns drawn from:
  - Normal distribution
  - Mean = user-specified return
  - Standard deviation = 15% (typical equity portfolio)
- Track % of simulations where portfolio lasts to target age

**Output:**
- Success probability: "Your plan has a 89% chance of success"
- Percentile outcomes: 10th, 25th, 50th, 75th, 90th percentile ending balances
- Visualization: Fan chart showing range of outcomes

**Recommendation Logic:**
- <70% success: "Consider reducing spending or delaying retirement"
- 70-85%: "Solid plan with moderate risk"
- 85-95%: "High confidence in plan success"
- >95%: "Very conservative - you may be able to spend more"

---

### 5.4 Scenario Comparison

**Basic Tier:** Single scenario only
**Pro Tier:** Up to 3 scenarios side-by-side
**Advanced Tier:** Unlimited scenarios

**Scenario Variations:**
Users should be able to compare:
- Different retirement ages (60 vs 62 vs 65)
- Different spending levels ($60K vs $80K vs $100K)
- Different CPP/OAS start ages
- Different return assumptions (4% vs 6% vs 8%)
- With/without bequest goals
- Single vs joint planning

**Comparison View:**
```
                    Scenario A    Scenario B    Scenario C
Retirement Age      62            65            62
Annual Spending     $80K          $80K          $60K
Monthly Income      $6,200        $7,100        $5,400
End Balance (90)    $0            $450K         $1.2M
Success Probability 82%           94%           98%
```

---

### 5.5 Output Visualizations

#### 5.5.1 Primary Chart: Portfolio Balance Over Time
**X-axis:** Age (retirement_age to longevity_age)
**Y-axis:** Portfolio value ($)
**Visual Elements:**
- Area chart showing balance declining over time
- Color gradient (green → yellow → orange as balance decreases)
- Markers for key milestones:
  - Age 65 (CPP/OAS eligibility)
  - Age 71 (RRIF conversion)
  - Target end age
- Shaded regions for different withdrawal phases
- Optional: Show all scenarios overlaid

#### 5.5.2 Secondary Chart: Income Composition
**Type:** Stacked area chart
**Components:**
- RRSP/RRIF withdrawals (blue)
- TFSA withdrawals (green)
- Non-registered (orange)
- CPP (purple)
- OAS (pink)
**Shows:** How income sources change over time

#### 5.5.3 Tax Impact Visualization
**Type:** Bar chart (annual) or donut chart (lifetime)
**Shows:**
- Gross income
- Tax paid
- After-tax income
**Pro/Advanced:** Breakdown by tax type (federal, provincial, CPP, EI)

#### 5.5.4 Withdrawal Sequence Diagram (Pro/Advanced)
**Type:** Sankey or waterfall chart
**Shows:** Order and amount withdrawn from each account type over retirement

#### 5.5.5 Monte Carlo Fan Chart (Advanced)
**Type:** Probability fan chart
**Shows:** Range of possible outcomes with confidence intervals

#### 5.5.6 Year-by-Year Table (Pro/Advanced)
| Age | Start Balance | Withdrawal | CPP | OAS | Gross Income | Tax | After-Tax | End Balance |
|-----|---------------|------------|-----|-----|--------------|-----|-----------|-------------|
| 62 | $12,625,000 | $180,000 | $0 | $0 | $180,000 | $54,000 | $126,000 | $12,570,000 |
| 63 | $12,570,000 | $185,000 | $0 | $0 | $185,000 | $55,500 | $129,500 | $12,490,000 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

---

## 6. Input Parameters & Data Model

### 6.1 User Profile Schema

```json
{
  "user_id": "uuid-string",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "tier": "basic|pro|advanced",
  "preferences": {
    "voice_enabled": true,
    "voice_speed": 1.0,
    "units": "CAD",
    "default_province": "ON",
    "display_mode": "real|nominal"
  }
}
```

### 6.2 Scenario Data Model

```json
{
  "scenario_id": "uuid-string",
  "scenario_name": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "user_id": "uuid-string",
  
  "basic_inputs": {
    "current_age": 58,
    "retirement_age": 62,
    "longevity_age": 90,
    "province": "ON"
  },
  
  "assets": {
    "rrsp": {
      "balance": 8000000,
      "annual_contribution": 0,
      "details": {
        "personal": 6000000,
        "spousal": 2000000
      }
    },
    "tfsa": {
      "balance": 200000,
      "contribution_room": 95000,
      "annual_contribution": 0
    },
    "non_registered": {
      "balance": 2000000,
      "cost_base": 1500000,
      "composition": {
        "equities": 70,
        "fixed_income": 20,
        "cash": 10
      }
    },
    "other": {
      "defined_benefit_pension": 0,
      "defined_contribution_pension": 0,
      "corporate_assets": 0,
      "real_estate_equity": 0
    }
  },
  
  "income_sources": {
    "employment": {
      "current_income": 150000,
      "income_until_age": 62,
      "retirement_income": 0
    },
    "cpp": {
      "start_age": 65,
      "estimated_annual": 16375,
      "basis": "maximum|average|estimated"
    },
    "oas": {
      "start_age": 65,
      "estimated_annual": 8560,
      "eligibility_percentage": 100
    },
    "other_income": [
      {
        "type": "rental",
        "annual_amount": 24000,
        "start_age": 62,
        "end_age": 90,
        "indexed_to_inflation": false
      }
    ]
  },
  
  "expenses": {
    "fixed_monthly": 2500,
    "variable_annual": 30000,
    "indexed_to_inflation": true,
    "age_based_changes": [
      {
        "age": 75,
        "multiplier": 0.85
      },
      {
        "age": 85,
        "multiplier": 0.70
      }
    ],
    "one_time_expenses": [
      {
        "age": 65,
        "amount": 50000,
        "description": "New car"
      }
    ]
  },
  
  "assumptions": {
    "pre_retirement_return": 6.0,
    "post_retirement_return": 6.0,
    "inflation_rate": 2.5,
    "return_std_dev": 15.0,
    "bequest_goal": 0,
    "monte_carlo_enabled": false
  },
  
  "advanced_inputs": {
    "spouse": null,
    "withdrawal_strategy": "tax_optimized|equal_blend|custom",
    "pension_splitting_enabled": false,
    "rrif_conversion_age": 71
  },
  
  "results": {
    "calculated_at": "timestamp",
    "sustainable_monthly_income_pretax": 61000,
    "sustainable_monthly_income_aftertax": 42000,
    "success_probability": 89,
    "total_tax_paid_lifetime": 2500000,
    "ending_balance": 0,
    "charts": {
      "balance_over_time": "base64-encoded-image-or-data-array",
      "income_composition": "base64-encoded-image-or-data-array"
    },
    "year_by_year": [
      {
        "age": 62,
        "start_balance": 12625000,
        "withdrawal": 180000,
        "cpp": 0,
        "oas": 0,
        "gross_income": 180000,
        "tax": 54000,
        "after_tax_income": 126000,
        "end_balance": 12570000
      }
    ]
  }
}
```

---

## 7. Calculation Engine Specifications

### 7.1 Engine Architecture

**Language:** TypeScript (for type safety) or Python (for numerical libraries)

**Core Modules:**
1. **InputValidator:** Validates and normalizes user inputs
2. **AssetProjector:** Projects account balances pre-retirement
3. **WithdrawalEngine:** Determines annual withdrawals
4. **TaxCalculator:** Computes federal and provincial tax
5. **BenefitCalculator:** Models CPP, OAS, employer pensions
6. **InflationAdjuster:** Converts nominal ↔ real values
7. **MonteCarloSimulator:** Runs probabilistic scenarios
8. **OutputGenerator:** Creates charts and tables

**Data Flow:**
```
User Input → InputValidator → AssetProjector → WithdrawalEngine
                                                      ↓
                                                TaxCalculator ← BenefitCalculator
                                                      ↓
                                                OutputGenerator → Results
```

---

### 7.2 Pseudocode for Core Algorithm

```python
def calculate_retirement_plan(inputs):
    # Step 1: Validate inputs
    validated = validate_inputs(inputs)
    
    # Step 2: Project to retirement
    starting_balance = project_assets_to_retirement(
        current_assets=validated.assets,
        current_age=validated.current_age,
        retirement_age=validated.retirement_age,
        return_rate=validated.pre_retirement_return,
        contributions=validated.annual_contribution
    )
    
    # Step 3: Calculate sustainable withdrawal
    years_in_retirement = validated.longevity_age - validated.retirement_age
    
    results = []
    portfolio_balance = starting_balance
    
    for age in range(validated.retirement_age, validated.longevity_age + 1):
        year_result = {}
        year_result['age'] = age
        year_result['start_balance'] = portfolio_balance
        
        # Determine withdrawal amount
        if age >= 71 and portfolio_balance.rrsp > 0:
            # RRIF minimum required
            rrif_min = portfolio_balance.rrsp * get_rrif_percentage(age)
            withdrawal_needed = calculate_income_need(validated.expenses, age)
            withdrawal = max(withdrawal_needed, rrif_min)
        else:
            withdrawal = calculate_income_need(validated.expenses, age)
        
        # Withdrawal sequencing
        withdrawal_sources = optimize_withdrawal_sequence(
            amount_needed=withdrawal,
            accounts=portfolio_balance,
            age=age,
            tax_strategy=validated.withdrawal_strategy
        )
        
        year_result['withdrawal'] = withdrawal_sources
        
        # Government benefits
        cpp = calculate_cpp(age, validated.cpp_start_age, validated.cpp_amount)
        oas = calculate_oas(age, validated.oas_start_age, validated.oas_amount)
        
        # Calculate gross income
        gross_income = sum(withdrawal_sources.values()) + cpp + oas
        
        # Calculate tax
        tax = calculate_tax(
            gross_income=gross_income,
            income_sources=withdrawal_sources,
            province=validated.province,
            age=age
        )
        
        # OAS clawback
        if gross_income > OAS_CLAWBACK_THRESHOLD:
            oas_clawback = calculate_oas_clawback(gross_income, oas)
            tax += oas_clawback
        
        year_result['cpp'] = cpp
        year_result['oas'] = oas
        year_result['gross_income'] = gross_income
        year_result['tax'] = tax
        year_result['after_tax_income'] = gross_income - tax
        
        # Update portfolio balance
        portfolio_balance = update_portfolio_balance(
            balance=portfolio_balance,
            withdrawals=withdrawal_sources,
            return_rate=validated.post_retirement_return
        )
        
        year_result['end_balance'] = portfolio_balance
        results.append(year_result)
        
        # Check if depleted
        if portfolio_balance.total() <= validated.bequest_goal:
            break
    
    # Generate summary
    summary = generate_summary(results)
    charts = generate_charts(results)
    
    return {
        'summary': summary,
        'year_by_year': results,
        'charts': charts
    }
```

---

### 7.3 Key Functions Detail

#### 7.3.1 `optimize_withdrawal_sequence()`

**Goal:** Minimize lifetime tax by withdrawing from accounts in optimal order

**Strategy:**
1. **Ages 60-64 (pre-CPP/OAS):**
   - Exhaust non-registered first (capital gains advantage)
   - Use TFSA sparingly (save tax-free growth)
   - Minimize RRSP (let it grow tax-deferred)

2. **Ages 65-70 (CPP/OAS started):**
   - Balance to avoid OAS clawback
   - Start strategic RRSP withdrawals
   - Use TFSA to "fill gaps" without increasing taxable income

3. **Age 71+ (RRIF mandatory):**
   - RRIF minimums must be taken
   - Supplement with TFSA if RRIF minimum < needed income
   - Non-reg only if both RRIF and TFSA insufficient

**Implementation:**
```python
def optimize_withdrawal_sequence(amount_needed, accounts, age, tax_strategy):
    withdrawals = {'rrsp': 0, 'tfsa': 0, 'non_reg': 0}
    remaining = amount_needed
    
    if age >= 71 and accounts.rrsp > 0:
        rrif_min = accounts.rrsp * get_rrif_percentage(age)
        withdrawals['rrsp'] = min(rrif_min, accounts.rrsp)
        remaining -= rrif_min
    
    if tax_strategy == 'tax_optimized':
        if age < 71:
            # Pre-RRIF: drain non-reg first
            non_reg_available = min(accounts.non_reg, remaining)
            withdrawals['non_reg'] = non_reg_available
            remaining -= non_reg_available
            
            if remaining > 0:
                tfsa_available = min(accounts.tfsa, remaining * 0.3)  # Conservative use
                withdrawals['tfsa'] = tfsa_available
                remaining -= tfsa_available
            
            if remaining > 0:
                withdrawals['rrsp'] += min(accounts.rrsp, remaining)
        else:
            # Post-RRIF: supplement with TFSA, then non-reg
            if remaining > 0:
                tfsa_available = min(accounts.tfsa, remaining)
                withdrawals['tfsa'] = tfsa_available
                remaining -= tfsa_available
            
            if remaining > 0:
                withdrawals['non_reg'] = min(accounts.non_reg, remaining)
    
    return withdrawals
```

---

#### 7.3.2 `calculate_tax()`

**Provincial Tax Tables:**
Must maintain up-to-date tables for all provinces. Update annually.

**Example Implementation:**
```python
FEDERAL_BRACKETS_2025 = [
    (55867, 0.15),
    (111733, 0.205),
    (173205, 0.26),
    (246752, 0.29),
    (float('inf'), 0.33)
]

PROVINCIAL_BRACKETS = {
    'ON': [
        (51446, 0.0505),
        (102894, 0.0915),
        (150000, 0.1116),
        (220000, 0.1216),
        (float('inf'), 0.1316)
    ],
    'BC': [...],
    'AB': [...],
    # ... all provinces
}

def calculate_tax(gross_income, income_sources, province, age):
    # Calculate taxable income
    taxable_rrsp = income_sources.get('rrsp', 0)
    taxable_cpp = income_sources.get('cpp', 0)
    taxable_oas = income_sources.get('oas', 0)
    
    # Non-reg: only 50% of capital gains taxable
    non_reg = income_sources.get('non_reg', 0)
    taxable_non_reg = non_reg * 0.5  # Simplified: assumes all gains
    
    taxable_income = taxable_rrsp + taxable_cpp + taxable_oas + taxable_non_reg
    
    # Calculate federal tax
    federal_tax = calculate_progressive_tax(taxable_income, FEDERAL_BRACKETS_2025)
    
    # Calculate provincial tax
    provincial_tax = calculate_progressive_tax(taxable_income, PROVINCIAL_BRACKETS[province])
    
    # Basic personal amount (federal + provincial)
    federal_bpa = 15705
    provincial_bpa = get_provincial_bpa(province)
    
    federal_credit = federal_bpa * 0.15
    provincial_credit = provincial_bpa * PROVINCIAL_BRACKETS[province][0][1]
    
    # Age amount (if 65+)
    if age >= 65:
        federal_age_credit = 8790 * 0.15
        federal_credit += federal_age_credit
    
    total_tax = federal_tax + provincial_tax - federal_credit - provincial_credit
    
    return max(0, total_tax)

def calculate_progressive_tax(income, brackets):
    tax = 0
    prev_bracket = 0
    for bracket_limit, rate in brackets:
        taxable_in_bracket = min(income, bracket_limit) - prev_bracket
        if taxable_in_bracket <= 0:
            break
        tax += taxable_in_bracket * rate
        prev_bracket = bracket_limit
    return tax
```

---

#### 7.3.3 `calculate_cpp()` and `calculate_oas()`

```python
def calculate_cpp(current_age, start_age, base_amount):
    if current_age < start_age:
        return 0
    
    # Adjustment factors
    if start_age == 60:
        factor = 0.64  # -36%
    elif start_age == 65:
        factor = 1.0
    elif start_age == 70:
        factor = 1.42  # +42%
    else:
        # Calculate based on months
        months_from_65 = (start_age - 65) * 12
        if months_from_65 < 0:
            factor = 1.0 + (months_from_65 * -0.006)
        else:
            factor = 1.0 + (months_from_65 * 0.007)
    
    return base_amount * factor

def calculate_oas(current_age, start_age, base_amount):
    if current_age < start_age:
        return 0
    
    if start_age < 65:
        return 0  # OAS cannot start before 65
    
    # Adjustment factors
    if start_age == 65:
        factor = 1.0
    elif start_age <= 70:
        months_delay = (start_age - 65) * 12
        factor = 1.0 + (months_delay * 0.006)  # 0.6% per month
    else:
        factor = 1.36  # Max at 70
    
    return base_amount * factor

def calculate_oas_clawback(gross_income, oas_amount):
    CLAWBACK_THRESHOLD = 86912  # 2025
    CLAWBACK_RATE = 0.15
    
    if gross_income <= CLAWBACK_THRESHOLD:
        return 0
    
    clawback = (gross_income - CLAWBACK_THRESHOLD) * CLAWBACK_RATE
    return min(clawback, oas_amount)  # Cannot claw back more than OAS itself
```

---

## 8. Voice Integration Requirements

### 8.1 Layercode Integration

**API Connection:**
- Use Layercode's Voice SDK
- Authenticate with API key (stored securely server-side)
- Support for both streaming and request-response modes

**Voice Input Flow:**
1. User clicks microphone button
2. Browser requests mic permission (WebRTC)
3. Audio stream sent to Layercode API
4. Layercode returns transcription + intent parsing
5. App extracts structured data from intent
6. App sends response text to Layercode for synthesis
7. Audio returned and played to user

**Intent Parsing:**
Layercode should be trained to recognize financial intents:
- `set_age`: "I'm 58" → {age: 58}
- `set_retirement_age`: "I want to retire at 62" → {retirement_age: 62}
- `set_rrsp`: "I have 8 million in RRSPs" → {rrsp: 8000000}
- `set_tfsa`: "TFSA has 200K" → {tfsa: 200000}
- `ask_question`: "How much can I spend per month?"
- `compare_scenarios`: "What if I delay retirement by 3 years?"

**Voice Synthesis Requirements:**
- Canadian English voice (neutral accent)
- Emphasis on key numbers: "You could withdraw **$7,200** per month"
- Pauses at logical breaks (commas, periods)
- Speed: 150 WPM default (adjustable)

---

### 8.2 Fallback & Accessibility

**Text Input Alternative:**
- Always provide text input field as fallback
- Voice-to-text transcript visible and editable
- User can correct transcription errors before submission

**Voice Output Control:**
- Mute/unmute button
- Playback speed control (0.75x, 1x, 1.25x, 1.5x)
- Option to download audio response
- Live captions/transcript display

**Accessibility Standards:**
- WCAG 2.1 Level AA compliance
- Screen reader compatible
- Keyboard navigation (no voice required)
- High contrast mode
- Font size adjustments

---

### 8.3 Conversation State Management

**Session Persistence:**
- Store conversation context in browser localStorage
- Resume interrupted conversations
- Allow users to "go back" and change answers

**Multi-Turn Clarification:**
```
User: "I have a bunch in savings"
System: "Could you be more specific? Do you mean RRSPs, TFSAs, or other accounts?"
User: "RRSPs"
System: "Great. How much do you have in RRSPs?"
User: "Around 2 million"
System: "Got it, $2 million in RRSPs. Do you also have money in a TFSA?"
```

**Conversation Shortcuts:**
- "Skip" - use default values
- "I don't know" - system provides typical estimates
- "Show me an example" - system uses sample data
- "Start over" - clear session and restart

---

## 9. User Interface & Experience

### 9.1 Application Layout

**Page Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo | Scenarios | Settings | Help | Account      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────┐  ┌─────────────────────────────┐ │
│  │   Conversation Panel  │  │    Results Panel            │ │
│  │                       │  │                             │ │
│  │  🎤 Voice Active      │  │  📊 Monthly Income: $7,200  │ │
│  │                       │  │                             │ │
│  │  "I'm 58 years old    │  │  [Balance Over Time Chart] │ │
│  │   and have $2M..."    │  │                             │ │
│  │                       │  │  [Income Composition]      │ │
│  │  System: "Great!      │  │                             │ │
│  │   When would you      │  │  [See Details →]           │ │
│  │   like to retire?"    │  │                             │ │
│  │                       │  │                             │ │
│  │  ┌─────────────────┐ │  │                             │ │
│  │  │ Type or speak...│ │  │                             │ │
│  │  └─────────────────┘ │  │                             │ │
│  │  🎤 Speak    ⌨ Type   │  │                             │ │
│  └───────────────────────┘  └─────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### 9.2 Design System

**Color Palette:**
- Primary: Deep blue (#1E3A8A) - trust, stability
- Secondary: Warm teal (#14B8A6) - growth, optimism
- Accent: Amber (#F59E0B) - attention, highlights
- Success: Green (#10B981)
- Warning: Orange (#F97316)
- Error: Red (#EF4444)
- Backgrounds: Dark navy (#0F172A) for dark mode, Light gray (#F8FAFC) for light mode

**Typography:**
- Headings: Inter (Google Font)
- Body: System fonts (San Francisco, Segoe UI, Roboto)
- Numbers: Tabular figures for alignment

**Spacing:**
- Base unit: 4px
- Padding/margins in multiples of 4px
- Component spacing: 16px, 24px, 32px

---

### 9.3 Interactive Components

#### 9.3.1 Voice Activation Button
**States:**
- Idle: Gray microphone icon
- Listening: Animated pulsing red circle
- Processing: Spinner with "Thinking..."
- Error: Red X with error message

#### 9.3.2 Input Sliders (Pro/Advanced)
**For Variables:**
- Retirement age (55-75)
- Return rate (0-15%)
- Inflation rate (0-5%)
- Monthly spending ($1K-$50K)

**Visual Feedback:**
- Live chart updates as slider moves
- Show impact: "+$200/month" or "-3 years of savings"

#### 9.3.3 Results Card
**Collapsed State:**
- Key metrics only:
  - Monthly income (large font)
  - Success probability badge
  - "See details" button

**Expanded State:**
- Full charts and tables
- Export options
- Scenario comparison toggle

---

### 9.4 Mobile Responsiveness

**Breakpoints:**
- Mobile: < 640px (single column, conversation above results)
- Tablet: 640px - 1024px (flexible grid)
- Desktop: > 1024px (side-by-side panels)

**Mobile-Specific:**
- Larger touch targets (min 44x44px)
- Simplified charts (fewer data points)
- Sticky voice button at bottom
- Swipe between conversation and results

---

### 9.5 Onboarding Flow

**First-Time User:**
1. **Welcome Screen:**
   - "Let's plan your retirement together"
   - 30-second video demo
   - "Start with voice" or "I'll type" buttons

2. **Permission Request:**
   - Explain why microphone access needed
   - "You can always switch to text later"

3. **Sample Conversation:**
   - Show example Q&A
   - "Try it yourself" prompt

4. **Quick Result:**
   - Generate projection with sample data
   - "This is what your personalized plan will look like"
   - "Start your own plan" CTA

**Returning User:**
- Auto-load last scenario
- "Continue where you left off" or "Start new scenario"

---

### 9.6 Error Handling

**Voice Recognition Errors:**
- "I didn't catch that. Could you repeat?"
- Show transcript: "I heard: [transcript]. Is this correct?"
- Offer text input as fallback

**Calculation Errors:**
- "Hmm, those numbers don't quite work. Let's adjust:"
- Suggest fixes: "Try increasing retirement age or reducing spending"
- Never crash - always provide graceful fallback

**Data Validation Errors:**
- Real-time validation with helpful messages:
  - Age: "Retirement age must be greater than current age"
  - Balances: "RRSP balance should be a positive number"
  - Returns: "Expected returns typically range from 4-10%"

---

## 10. Technical Architecture

### 10.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Voice Module │  │   UI Layer   │  │ Chart Engine │     │
│  │  (Layercode) │  │   (Tailwind) │  │  (Recharts)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                   │                   │           │
│         └───────────────────┴───────────────────┘           │
│                             │                               │
│                             ▼                               │
│                    ┌─────────────────┐                     │
│                    │  State Manager  │                     │
│                    │    (React Context│                     │
│                    │     or Redux)   │                     │
│                    └─────────────────┘                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS/REST or WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js or Python)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │Calc Engine   │  │ Data Storage │     │
│  │   (JWT)      │  │ (TypeScript) │  │  (Supabase)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                   │                   │           │
│         └───────────────────┴───────────────────┘           │
│                             │                               │
│                  ┌──────────┴──────────┐                   │
│                  ▼                     ▼                    │
│         ┌─────────────────┐   ┌─────────────────┐         │
│         │  Layercode API  │   │ Tax Data (JSON) │         │
│         │  (Voice I/O)    │   │  Provincial,    │         │
│         └─────────────────┘   │  Federal Rules  │         │
│                               └─────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

### 10.2 Frontend Stack

**Framework:** React 18+ with Vite (or Next.js for SSR)

**Key Libraries:**
- **UI Components:** shadcn/ui (Radix UI primitives + Tailwind)
- **Styling:** Tailwind CSS
- **Charts:** Recharts or D3.js
- **Forms:** React Hook Form
- **State:** React Context API or Zustand (lightweight)
- **Voice:** Custom integration with Layercode SDK
- **Routing:** React Router (if single-page) or Next.js routing
- **Animation:** Framer Motion

**File Structure:**
```
/src
  /components
    /voice
      VoiceInput.tsx
      VoiceOutput.tsx
    /charts
      BalanceChart.tsx
      IncomeCompositionChart.tsx
    /forms
      BasicInputForm.tsx
      AdvancedInputForm.tsx
    /ui
      Button.tsx
      Card.tsx
      Slider.tsx
  /hooks
    useVoice.ts
    useCalculation.ts
  /services
    apiClient.ts
    layercodeClient.ts
  /utils
    formatters.ts
    validators.ts
  /store
    scenarioStore.ts
  /pages
    Home.tsx
    Calculator.tsx
    Results.tsx
```

---

### 10.3 Backend Stack

**Option A: Node.js + TypeScript**
- Framework: Express.js or Fastify
- Benefits: Type safety, shared types with frontend, good npm ecosystem

**Option B: Python + FastAPI**
- Benefits: Superior numerical libraries (NumPy, Pandas), easier for complex calculations
- Drawback: Separate type system from frontend

**Recommendation:** Node.js + TypeScript for consistency, use Python microservice for Monte Carlo if needed

**Backend Structure:**
```
/api
  /routes
    auth.ts
    scenarios.ts
    calculations.ts
  /services
    calculationEngine.ts
    taxCalculator.ts
    monteCarloSimulator.ts
  /models
    Scenario.ts
    User.ts
  /utils
    taxTables.ts
    rrif.ts
  /middleware
    auth.ts
    validation.ts
```

---

### 10.4 Database Schema (Supabase/PostgreSQL)

**Tables:**

1. **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255),
  tier VARCHAR(20) DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT NOW(),
  preferences JSONB
);
```

2. **scenarios**
```sql
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  inputs JSONB NOT NULL,
  results JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

3. **calculations_log** (for analytics)
```sql
CREATE TABLE calculations_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID REFERENCES scenarios(id),
  calculation_time_ms INT,
  inputs_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `user_id` on scenarios (for fast user queries)
- `created_at` DESC on scenarios (for recent scenarios)

---

### 10.5 API Endpoints

**Authentication:**
```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

**Scenarios:**
```
POST   /api/scenarios               # Create new scenario
GET    /api/scenarios               # List user's scenarios
GET    /api/scenarios/:id           # Get specific scenario
PUT    /api/scenarios/:id           # Update scenario
DELETE /api/scenarios/:id           # Delete scenario
POST   /api/scenarios/:id/duplicate # Clone scenario
```

**Calculations:**
```
POST /api/calculate                 # Run calculation (basic)
POST /api/calculate/advanced        # Run with Monte Carlo
POST /api/calculate/compare         # Compare scenarios
```

**Voice (proxied to Layercode):**
```
POST /api/voice/transcribe          # Audio → text
POST /api/voice/synthesize          # Text → audio
POST /api/voice/parse               # Extract intent from transcript
```

**Exports:**
```
GET /api/scenarios/:id/export/pdf
GET /api/scenarios/:id/export/csv
```

**Utility:**
```
GET /api/tax-tables/:province       # Get current tax brackets
GET /api/rrif-factors               # Get RRIF percentage table
```

---

### 10.6 API Request/Response Examples

**POST /api/calculate**

Request:
```json
{
  "current_age": 58,
  "retirement_age": 62,
  "longevity_age": 90,
  "province": "ON",
  "assets": {
    "rrsp": 8000000,
    "tfsa": 200000,
    "non_registered": 2000000
  },
  "assumptions": {
    "post_retirement_return": 0.06,
    "inflation_rate": 0.025
  },
  "expenses": {
    "fixed_monthly": 2500
  }
}
```

Response:
```json
{
  "status": "success",
  "calculation_time_ms": 145,
  "results": {
    "sustainable_monthly_income": {
      "pretax": 61000,
      "after_tax": 42000
    },
    "summary": {
      "total_assets_at_retirement": 12625000,
      "years_in_retirement": 28,
      "total_tax_paid_lifetime": 2500000,
      "ending_balance": 0
    },
    "year_by_year": [
      {
        "age": 62,
        "start_balance": 12625000,
        "withdrawal": 180000,
        "cpp": 0,
        "oas": 0,
        "gross_income": 180000,
        "tax": 54000,
        "after_tax_income": 126000,
        "end_balance": 12570000
      }
      // ... more years
    ],
    "charts": {
      "balance_over_time": {
        "labels": [62, 63, 64, ...],
        "values": [12625000, 12570000, ...]
      }
    }
  }
}
```

---

## 11. API Specifications

### 11.1 White-Label API (Advanced Tier)

**Authentication:**
- API key + JWT tokens
- Rate limiting: 100 requests/minute per key

**Custom Endpoints:**
```
POST /api/v1/embed/calculate        # Embeddable calculation
GET  /api/v1/embed/scenarios/:id    # Get scenario for iframe
```

**CORS Configuration:**
- Allow specified domains only (customer-configurable)

**Branding:**
- Accept logo URL and brand colors in request
- Return branded PDF reports

---

### 11.2 Third-Party Integrations

**Potential Integrations:**
1. **Wealthsimple API:** Import account balances
2. **Questrade API:** Real-time portfolio sync
3. **CRA MyAccount:** Pull contribution room data (future)
4. **Google Drive:** Export reports automatically
5. **Zapier:** Trigger calculations from other apps

**Webhook Support:**
- Notify when calculation completes (for async scenarios)
- POST results to customer-specified endpoint

---

## 12. Canadian Tax & Regulatory Compliance

### 12.1 Tax Data Updates

**Annual Updates Required:**
- Federal tax brackets (indexed to inflation)
- Provincial tax brackets
- CPP/OAS maximum amounts
- RRIF minimum percentages (rare changes)
- TFSA contribution limits
- Basic personal amounts

**Update Schedule:**
- Federal budget (February/March)
- Provincial budgets (March/April)
- CRA guidance (January for prior year)

**Data Source:**
- CRA official publications
- Provincial finance ministries
- Automated scraping + manual verification

---

### 12.2 Disclaimers

**Required Disclosures:**

*"This calculator provides estimates for educational and planning purposes only. It does not constitute financial advice. Actual results may vary based on market performance, tax law changes, and individual circumstances. Consult with a qualified financial advisor before making retirement decisions."*

*"Tax calculations are based on current tax laws and assumptions. Future tax rates and rules may differ. Government benefit amounts are estimates and may not reflect your actual entitlements."*

*"Past performance does not guarantee future results. Investment returns can be volatile and may be negative in any given year."*

**Placement:**
- Footer of every results page
- Export PDFs
- "Learn More" modal explaining assumptions

---

### 12.3 Privacy Compliance

**PIPEDA (Personal Information Protection and Electronic Documents Act):**
- No PII required for basic calculations
- Email only for account creation (optional)
- No SIN, bank account, or identification numbers collected
- Clear opt-in for marketing communications

**Data Residency:**
- All data stored in Canadian data centers (Supabase Canada region)
- No transfer to US or international servers

**User Rights:**
- Right to access personal data
- Right to deletion (GDPR-style)
- Data export in JSON format

---

## 13. Security & Privacy

### 13.1 Data Security

**Encryption:**
- TLS 1.3 for all data in transit
- AES-256 encryption for data at rest (Supabase default)
- Sensitive fields (account balances) encrypted with separate key

**Authentication:**
- JWT tokens with 24-hour expiry
- Refresh tokens (7-day expiry)
- Optional 2FA (TOTP) for Advanced tier

**Session Management:**
- Anonymous sessions for non-authenticated users
- Data stored in browser localStorage (encrypted)
- Session timeout after 60 minutes of inactivity

---

### 13.2 No PII Collection Strategy

**What We Don't Collect:**
- Names (optional for account, but not used in calculations)
- Addresses
- Phone numbers
- Social Insurance Numbers
- Bank account information
- Credit card details (except through payment processor)

**What We Do Collect:**
- Email (only for account login)
- Financial data (assets, income) - anonymized and encrypted
- Usage analytics (aggregated, no individual tracking)

**Anonymous Usage:**
- Users can calculate without creating account
- Results shown but not saved
- Voice sessions ephemeral (not recorded)

---

### 13.3 API Security

**Rate Limiting:**
- Public endpoints: 10 requests/minute
- Authenticated: 100 requests/minute
- API tier: 1,000 requests/minute

**Input Validation:**
- Strict schema validation on all inputs
- Sanitize text inputs (prevent XSS)
- Numeric bounds checking

**OWASP Top 10 Compliance:**
- SQL injection prevention (parameterized queries)
- XSS protection (Content Security Policy headers)
- CSRF tokens for state-changing operations
- Security headers (HSTS, X-Frame-Options, etc.)

---

## 14. Performance Requirements

### 14.1 Speed Targets

**Calculation Time:**
- Basic simulation: <500ms
- Advanced simulation: <2s
- Monte Carlo (10K simulations): <10s

**Page Load:**
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Lighthouse score: >90

**Voice Response:**
- Speech-to-text latency: <1s
- Calculation + response: <3s total
- Text-to-speech playback starts: <1s

---

### 14.2 Scalability

**Horizontal Scaling:**
- Stateless API servers (can add more instances)
- Calculation engine distributed via queue (Redis + workers)
- CDN for static assets (Cloudflare)

**Load Handling:**
- Support 1,000 concurrent users per instance
- Auto-scale based on CPU usage (>70% trigger)

**Database:**
- Connection pooling (max 100 connections)
- Read replicas for analytics queries
- Caching frequently accessed data (Redis)

---

### 14.3 Optimization Strategies

**Frontend:**
- Code splitting (lazy load Pro/Advanced features)
- Image optimization (WebP format, lazy loading)
- Minimize bundle size (<500KB gzipped)

**Backend:**
- Cache tax tables in memory (updated annually)
- Memoize calculation results (same inputs = cached output)
- Async processing for heavy computations (Monte Carlo)

**Voice:**
- Stream audio chunks (don't wait for full synthesis)
- Prefetch common responses ("Great!", "Let's continue")

---

## 15. Analytics & Success Metrics

### 15.1 Product Metrics

**Engagement:**
- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- Average session duration
- Scenarios created per user
- Return rate (% users returning within 7/30 days)

**Conversion:**
- Free → Pro conversion rate
- Pro → Advanced conversion rate
- Trial → paid conversion
- Churn rate by tier

**Usage:**
- Voice vs text input ratio
- Average time to first result
- Questions asked per session
- Export frequency

**Financial:**
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Customer Lifetime Value (LTV)
- Customer Acquisition Cost (CAC)

---

### 15.2 Technical Metrics

**Performance:**
- API response time (p50, p95, p99)
- Error rate (target: <0.1%)
- Voice transcription accuracy
- Calculation success rate

**Reliability:**
- Uptime (target: 99.9%)
- Mean Time Between Failures (MTBF)
- Mean Time To Recovery (MTTR)

---

### 15.3 Analytics Implementation

**Tools:**
- PostHog or Mixpanel for product analytics
- Sentry for error tracking
- Vercel Analytics for frontend performance
- Custom dashboard for business metrics

**Events to Track:**
```javascript
// Calculation started
track('calculation_started', {
  tier: 'basic',
  input_method: 'voice',
  age: 58
});

// Calculation completed
track('calculation_completed', {
  tier: 'basic',
  calculation_time_ms: 234,
  success: true
});

// Scenario exported
track('scenario_exported', {
  format: 'pdf',
  tier: 'pro'
});

// Conversion
track('tier_upgraded', {
  from: 'basic',
  to: 'pro',
  trigger: 'paywall_monte_carlo'
});
```

---

## 16. Testing Requirements

### 16.1 Unit Testing

**Coverage Target:** >80% for critical paths

**Backend Tests:**
- Tax calculation accuracy (test all provinces)
- RRIF minimum calculation
- CPP/OAS adjustments
- Withdrawal sequencing logic
- Edge cases (age >95, negative balances, etc.)

**Frontend Tests:**
- Component rendering
- Form validation
- State management
- Voice input parsing

**Test Framework:** Jest (JavaScript) or pytest (Python)

---

### 16.2 Integration Testing

**API Tests:**
- End-to-end calculation flow
- Authentication & authorization
- Error handling
- Rate limiting

**Voice Tests:**
- Layercode API integration
- Intent parsing accuracy
- Speech synthesis quality

**Framework:** Supertest (API) + Playwright (E2E)

---

### 16.3 User Acceptance Testing

**Test Scenarios:**
1. New user completes first calculation via voice
2. Existing user compares 3 scenarios
3. Advisor creates white-label report for client
4. API integration partner runs 1000 calculations

**Beta Testing:**
- Recruit 50-100 users across tiers
- Collect feedback via surveys
- Monitor usage with analytics
- Iterate based on feedback

---

### 16.4 Accuracy Validation

**Financial Model Validation:**
- Compare outputs to established calculators (Retirement Analyzer, RightCapital)
- Verify against manual Excel calculations
- Have CPA review tax logic
- Test with real user data (anonymized)

**Accuracy Targets:**
- Tax calculations: <1% error vs actual CRA tables
- Projection amounts: <2% variance from manual calculation
- RRIF minimums: Exact match to CRA table

---

## 17. Development Roadmap

### 17.1 Phase 1: MVP (8-10 weeks)

**Sprint 1-2: Foundation (2 weeks)**
- Set up development environment
- Create React app with Tailwind
- Set up Supabase database
- Basic authentication

**Sprint 3-4: Core Calculation (2 weeks)**
- Implement calculation engine (TS/Python)
- Basic input form
- Single-scenario results
- Simple balance chart

**Sprint 5-6: Voice Integration (2 weeks)**
- Integrate Layercode SDK
- Voice input flow
- Intent parsing for basic inputs
- Voice output synthesis

**Sprint 7-8: Polish & Testing (2 weeks)**
- UI/UX refinement
- Error handling
- Basic tests
- Beta deployment

**MVP Features:**
- Voice + text input
- Basic tier functionality
- Single scenario
- Simple charts
- Tax calculation (one province to start)

---

### 17.2 Phase 2: Pro Tier (4-6 weeks)

**Sprint 9-10: Advanced Inputs**
- Multi-account breakdown
- Spouse/joint planning
- Variable expenses
- Bequest goals

**Sprint 11-12: Enhanced Outputs**
- Scenario comparison (up to 3)
- Detailed tax breakdown
- Year-by-year table
- PDF export

**Sprint 13: Tax Expansion**
- All provincial tax tables
- Pension income splitting
- OAS clawback modeling

**Sprint 14: Pro Launch**
- Payment integration (Stripe)
- Upgrade flows
- Marketing pages

---

### 17.3 Phase 3: Advanced Tier (6-8 weeks)

**Sprint 15-16: Advisor Features**
- Multi-client dashboard
- White-label branding
- Client collaboration mode
- Enhanced exports

**Sprint 17-18: Advanced Analytics**
- Monte Carlo simulation
- Stress testing
- Longevity risk assessment

**Sprint 19-20: API & Integrations**
- REST API for partners
- Webhook support
- Documentation (Swagger)

**Sprint 21: Enterprise Launch**
- Sales collateral
- Pilot customers
- Success tracking

---

### 17.4 Phase 4: Scale & Enhance (Ongoing)

**Q4 Features:**
- Mobile app (React Native)
- Wealthsimple/Questrade integration
- Advanced voice personas
- Gamification elements

**Year 2 Vision:**
- AI financial coaching (beyond calculations)
- Scenario "what-if" builder
- Social sharing (anonymized results)
- Estate planning integration
- Budget tracking integration

---

## 18. Dependencies & Risks

### 18.1 Technical Dependencies

**Critical:**
1. **Layercode Voice API**
   - Risk: Service downtime or quality issues
   - Mitigation: Implement text-only fallback mode; SLA agreement

2. **Supabase Database**
   - Risk: Data loss or service interruption
   - Mitigation: Daily backups; multi-region setup (paid tier)

3. **Payment Processing (Stripe)**
   - Risk: Failed transactions
   - Mitigation: Error handling; support system for billing issues

**Important:**
4. **React/Frontend Framework**
   - Risk: Breaking changes in updates
   - Mitigation: Pin versions; test before upgrading

5. **Recharts Library**
   - Risk: Performance issues with large datasets
   - Mitigation: Data sampling for charts; consider D3 as alternative

---

### 18.2 Business Risks

**Market Risks:**
1. **Competition:** Established financial planning software
   - Mitigation: Differentiate on voice UX and Canadian focus

2. **Pricing Sensitivity:** Users unwilling to pay
   - Mitigation: Freemium model; demonstrate clear value

3. **Trust:** Financial data is sensitive
   - Mitigation: No PII collection; strong security; third-party audit

**Operational Risks:**
4. **Tax Law Changes:** Annual updates required
   - Mitigation: Automated scraping + manual review; budget for maintenance

5. **Regulatory Changes:** PIPEDA, financial advice regulations
   - Mitigation: Legal review; clear disclaimers

6. **Scaling Costs:** Voice API can be expensive at scale
   - Mitigation: Optimize usage; consider self-hosted voice alternative

---

### 18.3 Risk Mitigation Strategies

**Technical:**
- Comprehensive test coverage
- Staging environment for all changes
- Gradual rollouts (feature flags)
- Monitoring & alerting (Sentry, Datadog)

**Business:**
- Pilot program with small user group
- Feedback loops with beta users
- Advisor partnerships for credibility
- Insurance for professional liability (if giving advice)

**Legal:**
- Terms of Service review by lawyer
- Privacy policy (PIPEDA compliant)
- Financial disclaimer on all pages
- No "advice" language (use "projections" and "estimates")

---

## 19. Appendices

### Appendix A: Complete Provincial Tax Tables

*(Full tables for all 13 provinces/territories to be included - sample shown)*

**Ontario (2025):**
| Bracket | Rate |
|---------|------|
| $0 - $51,446 | 5.05% |
| $51,446 - $102,894 | 9.15% |
| $102,894 - $150,000 | 11.16% |
| $150,000 - $220,000 | 12.16% |
| $220,000+ | 13.16% |

**British Columbia (2025):**
| Bracket | Rate |
|---------|------|
| $0 - $47,937 | 5.06% |
| $47,937 - $95,875 | 7.70% |
| $95,875 - $110,076 | 10.50% |
| $110,076 - $133,664 | 12.29% |
| $133,664 - $181,232 | 14.70% |
| $181,232+ | 16.80% |

*[Continue for all provinces...]*

---

### Appendix B: CPP/OAS Historical Data

**CPP Maximum Pensionable Earnings:**
- 2025: $68,500
- 2024: $66,600
- 2023: $66,600

**CPP Maximum Monthly Benefit:**
- 2025: $1,364.60
- 2024: $1,306.57
- 2023: $1,306.57

**OAS Maximum Monthly Benefit:**
- 2025: $713.34
- 2024: $698.60
- 2023: $698.60

---

### Appendix C: Common Financial Formulas

**Future Value (Compound Interest):**
```
FV = PV × (1 + r)^t
```

**Present Value of Annuity:**
```
PV = PMT × [(1 - (1 + r)^-n) / r]
```

**Sustainable Withdrawal (Annuity Formula):**
```
PMT = PV × [r(1 + r)^n] / [(1 + r)^n - 1]
```

**Real Rate of Return:**
```
Real Return = [(1 + Nominal Return) / (1 + Inflation)] - 1
```

---

### Appendix D: Sample Voice Conversation Scripts

**Script 1: Happy Path (Sufficient Funds)**
```
System: "Hi! I'm here to help you plan your retirement. To get started, how old are you today?"

User: "I'm 58."

System: "Perfect. And when would you like to retire?"

User: "Probably around 62 or 63."

System: "Great! Let's plan for 62. How long would you like your money to last?"

User: "Until I'm 90, I guess."

System: "That gives us 28 years to plan for. What are your current monthly expenses?"

User: "About $2,500."

System: "Got it. Now let's talk about your savings. How much do you have in RRSPs?"

User: "Around 8 million."

System: "Wonderful! Do you have any money in a TFSA?"

User: "Yeah, about $200,000."

System: "And any other investments outside of registered accounts?"

User: "Another 2 million or so."

System: "Excellent. Let me calculate what this means for you... 
[Pause - calculation runs]
Great news! With $10 million total at age 58, if you retire at 62 and your investments grow at 6% per year, you could comfortably withdraw about $42,000 per month after tax until age 90. That's significantly more than your $2,500 in fixed expenses, giving you plenty of flexibility for travel, hobbies, and unexpected costs.

Would you like to see how this changes if you retire earlier or later?"
```

**Script 2: Needs Adjustment**
```
System: "How much do you have saved in RRSPs?"

User: "About $500,000."

System: "And in TFSAs?"

User: "Maybe $50,000."

System: "Any other savings?"

User: "Not really."

System: "Okay, so about $550,000 total. Let me run the numbers...
[Calculation]
Based on your current savings and retiring at 60, you could withdraw about $2,800 per month after tax to age 85. I notice that's pretty close to your $2,500 monthly expenses - not much buffer.

Would you like to explore some options to improve this? For example:
- Delaying retirement by 3-5 years could significantly increase your monthly income
- Reducing expenses by 15-20% could add years to your plan
- Or we could look at part-time work during early retirement

What sounds most interesting to you?"
```

---

### Appendix E: Export Template Specifications

**PDF Report Structure:**

Page 1: Summary
- User inputs (anonymized)
- Key results (monthly income, success probability)
- High-level charts

Page 2-3: Detailed Analysis
- Year-by-year table
- Tax breakdown
- Withdrawal sequence

Page 4: Assumptions & Disclaimers
- All assumptions listed
- Legal disclaimers
- Contact information

**CSV Export Columns:**
```
Age, Start_Balance_RRSP, Start_Balance_TFSA, Start_Balance_NonReg, 
Withdrawal_RRSP, Withdrawal_TFSA, Withdrawal_NonReg, 
CPP_Income, OAS_Income, Gross_Income, 
Federal_Tax, Provincial_Tax, Total_Tax, After_Tax_Income,
End_Balance_RRSP, End_Balance_TFSA, End_Balance_NonReg, Total_Balance
```

---

### Appendix F: API Documentation Preview

**Authentication:**
```bash
# Get API token
curl -X POST https://api.retirementcalc.ca/auth/token \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your_api_key", "secret": "your_secret"}'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

**Run Calculation:**
```bash
curl -X POST https://api.retirementcalc.ca/v1/calculate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "current_age": 58,
    "retirement_age": 62,
    "longevity_age": 90,
    "assets": {
      "rrsp": 8000000,
      "tfsa": 200000,
      "non_registered": 2000000
    },
    "assumptions": {
      "post_retirement_return": 0.06,
      "inflation_rate": 0.025
    }
  }'
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 20, 2025 | Product Team | Initial comprehensive PRD |

---

## Approval & Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Engineering Lead | | | |
| Design Lead | | | |
| Legal/Compliance | | | |

---

**END OF DOCUMENT**

Total Pages: [This would be ~75-80 pages when formatted]
