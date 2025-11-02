# What-If Scenario Buttons - Implementation Plan

**Status**: ✅ Phase 2 Complete (5/5 core scenarios implemented) | 🔜 Phase 3 Pending (Lump Sum Withdrawal)
**Target Implementation**: Phase 4 (Post-MVP)
**Estimated Total Effort**: 12-16 hours (14 hours actual)

**Implementation Log**:
- ✅ **Front-Load the Fun** - Implemented (Phase 1)
- ✅ **Delay CPP/OAS to 70** - Implemented (Phase 1)
- ✅ **Exhaust Your Portfolio** - Implemented 2025-10-31 (Phase 2) - Binary search optimizer with 8-15 iterations, edge case handling for overspending, stores optimizedSpending in variant metadata
- ✅ **Leave a Legacy** - Implemented 2025-11-02 (Phase 2) - Percentage-based preservation (10%, 25%, 50%), binary search optimization, wide search range (0.3x-5.0x baseline)
- ✅ **Retire Earlier** - Implemented 2025-11-01 (Phase 3) - Configurable retirement age (55-70), modal UI with radio buttons, regeneration support
- 🔜 **Lump Sum Withdrawal** - Pending (Phase 3)

---

## Overview

Interactive "What-If" scenario buttons allow users to explore retirement planning variations without modifying their baseline plan. Users can instantly compare how different strategies affect their retirement outcomes.

### Core Principles
- **Temporary Comparisons**: Variants don't auto-save (user must explicitly save)
- **One-at-a-Time**: MVP shows baseline vs 1 variant (multi-compare in Phase 2)
- **Instant Feedback**: Results appear within 1-2 seconds max
- **Saveable**: Users can save liked variants as named scenarios (tier-limited)

---

## Recommended Button Set

### 1. 🎯 Front-Load the Fun
**Subtitle**: *Spend more early, scale back later*

**What It Does**:
- Models "go-go, slow-go, no-go" retirement years
- +30% spending ages 65-75 (go-go years)
- -15% spending ages 75-85 (slow-go years)
- -25% spending ages 85+ (no-go years)

**Implementation**:
- Uses existing `age_based_changes[]` array (already supported!)
- No engine modifications required
- Calculate: `baseline_monthly * multipliers` for each age bracket

**Shows User**:
```
Baseline vs Front-Load the Fun
─────────────────────────────────────────
Monthly Spending:
  Ages 65-75:  $5,000 → $6,500 (+30%)
  Ages 75-85:  $5,000 → $4,250 (-15%)
  Ages 85+:    $5,000 → $3,750 (-25%)

Total Extra in Go-Go Years: +$156,000
Portfolio Depletion: Age 95+ → Age 93
```

**User Value**: Models realistic spending decline with age, frontloads enjoyment
**Complexity**: LOW (1-2 hours)
**Priority**: HIGH (Phase 1)

---

### 2. 💰 Exhaust Your Portfolio
**Subtitle**: *Maximize lifestyle - use every dollar*

**What It Does**:
- Binary search algorithm finds exact monthly spending that depletes portfolio at longevity age
- Answers: "What's the MAXIMUM I can spend?"
- Optimizes to $0 balance at target age (within $10K tolerance)

**Implementation**:
- New function: `optimizeSpendingToExhaust(client, baseScenario, tolerance = 10000)`
- Iterative calculation: 8-12 runs, ~750ms-1s total
- Show loading spinner: "Optimizing your maximum spending..."
- Binary search range: 80%-300% of baseline spending

**Shows User**:
```
You can afford $6,750/month
(vs current $5,000/month)

Extra Monthly Income: +$1,750
Extra Annual Income: +$21,000
Portfolio reaches $0 at age 95 (your target)
```

**Edge Case - Already Overspending**:
If baseline exhausts portfolio early (e.g., age 87 vs target 95):
```
⚠️  Your Current Plan Already Exhausts

Portfolio depletes at age 87 (8 years before
your longevity target of 95)

To reach age 95, reduce spending to:
$4,200/month (currently $5,500/month)

[Adjust to Sustainable Level]
```

**User Value**: Maximum lifestyle optimization, clear spending ceiling
**Complexity**: MEDIUM-HIGH (4-6 hours)
**Priority**: HIGH (Phase 2)

**Safety Enhancement**: Add toggle for "Exhaust 5 years early" (age 90 vs 95) for extra cushion

---

### 3. 🏛️ Leave a Legacy
**Subtitle**: *Preserve 25% for heirs*

**What It Does**:
- Constrains withdrawals to preserve X% of starting portfolio
- Percentage-based (not fixed dollar amount)
- Shows spending trade-off required to achieve legacy goal

**Implementation**:
- Add to Expenses type: `legacy_preservation_percentage?: number`
- Modify `calculateWithdrawalSequence()`: check `current_total >= legacy_target` before withdrawing
- Calculate target: `legacy_target = starting_portfolio * percentage`
- If insufficient funds, reduce `targetWithdrawal` proportionally

**Shows User**:
```
Baseline vs Leave a Legacy (25%)

Starting Portfolio: $2,000,000
Legacy Target: $500,000 (25%)

Required Spending Adjustment:
$5,000/month → $4,350/month (-13%)

Trade-off: -$650/month = $500K for heirs
```

**Interactive Enhancement (Future)**:
- Slider UI: 0% → 50% preservation
- Real-time recalc as user drags (or "Apply" button)
- Trade-off visualization: "Each 10% preserved = -$XXX/month"

**MVP Version**:
Preset buttons:
- "Leave 10%"
- "Leave 25%" (default/recommended)
- "Leave 50%"

**User Value**: Balance lifestyle vs estate planning goals
**Complexity**: MEDIUM (3-4 hours)
**Priority**: MEDIUM (Phase 2)

---

### 4. ⏰ Delay CPP/OAS
**Subtitle**: *Start government benefits at 70 instead of 65*

**What It Does**:
- Sets `cpp.start_age = 70` and `oas.start_age = 70`
- Shows lifetime income gain vs early start
- CPP at 70 = 142% of age-65 amount
- OAS at 70 = 136% of age-65 amount

**Implementation**:
- Simple age modification: `cpp.start_age = 70`, `oas.start_age = 70`
- Recalculate with modified scenario
- No algorithm complexity

**Shows User**:
```
Baseline (Start at 65) vs Delay to 70

CPP Annual Income:
  Age 65: $15,679/year
  Age 70: $22,264/year (+42%)

OAS Annual Income:
  Age 65: $8,764/year
  Age 70: $11,919/year (+36%)

Lifetime Income Gain: +$127,000
(assumes longevity to age 95)

Trade-off: 5 years of portfolio withdrawals
Required Portfolio at 65: $250,000 extra
```

**User Value**: Answers "Should I delay CPP/OAS?" (common user question)
**Complexity**: LOW (1 hour)
**Priority**: HIGH (Phase 1)

---

### 5. 🚀 Retire Earlier
**Subtitle**: *What if I retired at 62 instead of 65?*

**What It Does**:
- User selects desired retirement age via modal (ages 55-70)
- Calculates impact of retiring earlier (or later) than baseline
- Shows portfolio longevity impact and lifestyle trade-offs

**Scenario Modal - User Input**:
```
┌─────────────────────────────────────────────┐
│ 🚀 Retire Earlier                    [X]   │
│─────────────────────────────────────────────│
│                                              │
│ What This Does:                             │
│ See how changing your retirement age        │
│ affects your portfolio and lifestyle.       │
│                                              │
│ Your Baseline Retirement Age: 65            │
│                                              │
│ Test Retirement Age:                        │
│ ┌─────────────────────────────────────────┐ │
│ │  55  57  59  61  [62]  64  66  68  70  │ │ <- Radio buttons
│ └─────────────────────────────────────────┘ │
│                                              │
│ Quick Impact Preview:                       │
│ • Retire 3 years earlier (age 62)          │
│ • Portfolio may deplete ~6 years sooner    │
│ • Gain: 3 extra years of freedom           │
│                                              │
│─────────────────────────────────────────────│
│        [ Cancel ]    [ Run Scenario ]       │
└─────────────────────────────────────────────┘
```

**Modal Inputs**:
- **Retirement Age**: Radio button group or slider (55-70, step 1)
- **Default**: Current baseline retirement age - 3 years
- **Validation**: Must be before longevity age

**Implementation**:
```typescript
export function createRetireEarlierVariant(
  baseScenario: Scenario,
  newRetirementAge: number
): Scenario {
  return {
    ...baseScenario,
    name: `Retire at ${newRetirementAge}`,
    basic_inputs: {
      ...baseScenario.basic_inputs,
      retirement_age: newRetirementAge
    },
    income_sources: {
      ...baseScenario.income_sources,
      employment: baseScenario.income_sources.employment ? {
        ...baseScenario.income_sources.employment,
        until_age: newRetirementAge
      } : undefined,
      // Adjust pension start age if present
      pension: baseScenario.income_sources.pension ? {
        ...baseScenario.income_sources.pension,
        start_age: newRetirementAge
      } : undefined
    }
  }
}
```

**Shows User**:
```
Baseline (Retire at 65) vs Retire at 62

Retirement Start: Age 65 → Age 62 (-3 years)
Employment Ends: Age 65 → Age 62
Pre-Retirement Savings Lost: ~$180K
Portfolio Depletion: Age 95+ → Age 89
Extra Years Retired: +3 years
Cost: Portfolio exhausts 6 years earlier

💡 Insight: Each year of early retirement costs
approximately 2 years of portfolio longevity
```

**User Value**:
- Feasibility check for early retirement dreams
- Quantifies the cost of freedom (years vs dollars)
- Common user question: "Can I afford to retire early?"

**Complexity**: LOW-MEDIUM (30-45 min)
- Modal UI: 15 min
- Variant function: 10 min
- Integration: 10 min

**Priority**: LOW (Phase 3 - if user demand exists)
**Trade-off**: Less algorithmic complexity than optimization buttons, but configurable makes it more useful

---

### 6. 🏛️ Leave a Legacy
**Subtitle**: *Preserve 25% for heirs*

**What It Does**:
- Constrains withdrawals to preserve X% of starting portfolio
- User selects preservation percentage (10%, 25%, or 50%)
- Shows spending trade-off required to achieve legacy goal

**Scenario Modal - User Input**:
```
┌─────────────────────────────────────────────┐
│ 🏛️ Leave a Legacy                    [X]   │
│─────────────────────────────────────────────│
│                                              │
│ What This Does:                             │
│ Limit portfolio withdrawals to preserve     │
│ a specific amount for your heirs.           │
│                                              │
│ Starting Portfolio: $2,000,000              │
│                                              │
│ Legacy Preservation Amount:                 │
│ ┌─────────────────────────────────────────┐ │
│ │   [10%]     [25%]     [50%]             │ │ <- Radio buttons
│ │  $200K      $500K      $1M              │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Required Adjustment:                        │
│ Reduce spending by ~$650/month (-13%)       │
│                                              │
│ Trade-off:                                  │
│ -$7,800/year = $500K legacy                │
│                                              │
│─────────────────────────────────────────────│
│        [ Cancel ]    [ Run Scenario ]       │
└─────────────────────────────────────────────┘
```

**Modal Inputs**:
- **Preservation Percentage**: Radio buttons (10%, 25%, 50%)
- **Default**: 25% (recommended)
- **Display**: Show dollar amount alongside percentage

**Implementation**:
```typescript
export function createLegacyVariant(
  baseScenario: Scenario,
  percentage: number = 0.25
): Scenario {
  return {
    ...baseScenario,
    name: `Leave Legacy (${percentage * 100}%)`,
    expenses: {
      ...baseScenario.expenses,
      legacy_preservation_percentage: percentage
    }
  }
}
```

**Engine Modification** (`accounts.ts` and `engine.ts`):
```typescript
// In calculateWithdrawalSequence()
const legacyTarget = scenario.expenses.legacy_preservation_percentage
  ? totalStartingPortfolio * scenario.expenses.legacy_preservation_percentage
  : 0;

// Before withdrawing
if (currentTotalBalance <= legacyTarget) {
  // Preserve legacy - stop/reduce withdrawals
  const availableForWithdrawal = Math.max(0, currentTotalBalance - legacyTarget);
  targetWithdrawal = Math.min(targetWithdrawal, availableForWithdrawal);
}
```

**Type Definition** (`types/calculator.ts`):
```typescript
interface Expenses {
  fixed_monthly: number;
  variable_annual?: number;
  indexed_to_inflation: boolean;
  age_based_changes?: AgeBasedExpenseChange[];
  legacy_preservation_percentage?: number;  // NEW: 0.25 = 25%
}
```

**Shows User**:
```
Baseline vs Leave a Legacy (25%)

Starting Portfolio: $2,000,000
Legacy Target: $500,000 (25%)

Required Spending Adjustment:
$5,000/month → $4,350/month (-13%)

Annual Reduction: $7,800/year
Total Lifetime Reduction: $234,000

Legacy Value: $500,000
(Preserved until age 95)

💡 Insight: Each 10% preserved requires
reducing spending by approximately 5-6%
```

**User Value**:
- Balance lifestyle vs estate planning goals
- Clear visualization of legacy trade-offs
- Quantifies "What do I sacrifice to leave $X to heirs?"

**Complexity**: MEDIUM (3-4 hours)
- Modal UI: 30 min
- Engine modifications: 2 hours
- Type updates: 15 min
- Integration & testing: 1-1.5 hours

**Priority**: MEDIUM (Phase 2)
**Note**: Percentage-based (not fixed $) scales with portfolio size, simpler UX

---

### 7. 💵 Lump Sum Withdrawal
**Subtitle**: *Test a one-time large withdrawal*

**What It Does**:
- Models impact of withdrawing a large sum (wedding, renovation, travel, etc.)
- User configures: amount, timing, and source account
- Shows portfolio recovery timeline and longevity impact

**Scenario Modal - User Input**:
```
┌─────────────────────────────────────────────┐
│ 💵 Lump Sum Withdrawal              [X]    │
│─────────────────────────────────────────────│
│                                              │
│ What This Does:                             │
│ See the impact of a large one-time          │
│ withdrawal on your retirement plan.         │
│                                              │
│ Withdrawal Amount:                          │
│ ┌─────────────────────────────────────────┐ │
│ │ $ [50,000]                              │ │ <- Input field
│ └─────────────────────────────────────────┘ │
│                                              │
│ Withdrawal Age:                             │
│ ┌─────────────────────────────────────────┐ │
│ │  [70]                                   │ │ <- Number input (retirement age - longevity)
│ └─────────────────────────────────────────┘ │
│                                              │
│ Withdraw From:                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ○ Non-Registered ($500K)                │ │
│ │ ● RRSP ($800K) - Recommended            │ │ <- Radio buttons
│ │ ○ TFSA ($200K)                          │ │
│ │ ○ Smart Withdrawal (tax-optimized)      │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Quick Impact Preview:                       │
│ • $50K RRSP withdrawal at age 70           │
│ • Estimated tax: ~$15K                      │
│ • Net received: ~$35K                       │
│ • Portfolio depletes ~1 year earlier       │
│                                              │
│─────────────────────────────────────────────│
│        [ Cancel ]    [ Run Scenario ]       │
└─────────────────────────────────────────────┘
```

**Modal Inputs**:
1. **Withdrawal Amount**: Text input, formatted as currency
   - Validation: $1,000 - $1,000,000
   - Default: $50,000
2. **Withdrawal Age**: Number input
   - Range: Retirement age to Longevity age - 1
   - Default: Retirement age + 5
3. **Source Account**: Radio button group
   - Options: Non-Registered, RRSP, TFSA, Smart Withdrawal (tax-optimized)
   - Show current balance for each account
   - Default: "Smart Withdrawal" (engine decides optimal account)

**Implementation**:
```typescript
export function createLumpSumWithdrawalVariant(
  baseScenario: Scenario,
  amount: number,
  withdrawalAge: number,
  sourceAccount: 'non_registered' | 'rrsp' | 'tfsa' | 'smart'
): Scenario {
  return {
    ...baseScenario,
    name: `$${(amount/1000).toFixed(0)}K Withdrawal at ${withdrawalAge}`,
    expenses: {
      ...baseScenario.expenses,
      one_time_withdrawals: [
        {
          age: withdrawalAge,
          amount: amount,
          source: sourceAccount,
          description: 'One-time withdrawal'
        }
      ]
    }
  }
}
```

**Type Definition** (`types/calculator.ts`):
```typescript
interface OneTimeWithdrawal {
  age: number;
  amount: number;
  source: 'non_registered' | 'rrsp' | 'tfsa' | 'smart';
  description?: string;
}

interface Expenses {
  fixed_monthly: number;
  variable_annual?: number;
  indexed_to_inflation: boolean;
  age_based_changes?: AgeBasedExpenseChange[];
  legacy_preservation_percentage?: number;
  one_time_withdrawals?: OneTimeWithdrawal[];  // NEW
}
```

**Engine Modification** (`engine.ts`):
```typescript
// In year-by-year loop
const oneTimeWithdrawal = scenario.expenses.one_time_withdrawals?.find(
  w => w.age === currentAge
);

if (oneTimeWithdrawal) {
  const { amount, source } = oneTimeWithdrawal;

  if (source === 'smart') {
    // Use existing tax-optimized withdrawal sequencing
    const withdrawal = calculateWithdrawalSequence(
      amount / 12, // Convert to monthly for existing function
      accounts,
      provincialTax,
      currentAge,
      year
    );
    // Apply withdrawal...
  } else {
    // Withdraw from specific account
    if (source === 'rrsp' && accounts.rrsp) {
      accounts.rrsp.balance -= amount;
      totalTax += calculateTaxOnRRSPWithdrawal(amount, ...);
    } else if (source === 'tfsa' && accounts.tfsa) {
      accounts.tfsa.balance -= amount; // No tax
    } else if (source === 'non_registered' && accounts.non_registered) {
      const { tax } = withdrawFromNonRegistered(accounts.non_registered, amount, ...);
      totalTax += tax;
    }
  }
}
```

**Shows User**:
```
Baseline vs $50K Withdrawal at Age 70

Withdrawal Details:
Amount: $50,000 (from RRSP)
Timing: Age 70
Tax Impact: $15,000 (30% marginal rate)
Net Received: $35,000

Portfolio Impact:
Depletion Age: 95+ → 94 (-1 year)
Recovery Time: Portfolio never fully recovers
  (but still lasts to target age)

Tax Comparison:
Annual Tax (Age 70):
  Baseline: $8,500
  With Withdrawal: $23,500 (+$15,000)

💡 Insight: RRSP withdrawals at age 70 are taxed
at 30%. Consider TFSA ($0 tax) if available.

Alternative: Withdraw from TFSA = $0 tax
```

**User Value**:
- Common real-world scenario (weddings, renovations, travel, gifts)
- Shows tax implications of different withdrawal sources
- Helps users make informed decisions about timing

**Complexity**: MEDIUM-HIGH (4-5 hours)
- Modal UI with 3 inputs: 45 min
- Type definitions: 15 min
- Engine modifications: 2-2.5 hours
- Tax calculation logic: 1 hour
- Integration & testing: 1 hour

**Priority**: MEDIUM-LOW (Phase 2-3)
**Note**: Builds on existing withdrawal sequencing, adds one-time event handling

---

## Technical Implementation

### Architecture

**File Structure**:
```
src/
├── lib/
│   └── calculations/
│       ├── scenario-optimizer.ts       (NEW - binary search, optimization functions)
│       └── scenario-variants.ts        (NEW - variant generators)
├── components/
│   └── results/
│       ├── ScenarioButtons.tsx         (NEW - what-if button UI)
│       ├── ScenarioComparison.tsx      (NEW - side-by-side results)
│       └── ResultsSummary.tsx          (UPDATE - add comparison mode)
```

### Core Functions

**1. Binary Search Optimizer** (`scenario-optimizer.ts`):
```typescript
async function optimizeSpendingToExhaust(
  client: SupabaseClient,
  baseScenario: Scenario,
  tolerance: number = 10000
): Promise<OptimizedResult> {
  let low = baseScenario.expenses.fixed_monthly * 0.8;
  let high = baseScenario.expenses.fixed_monthly * 3;
  let iterations = 0;

  while (high - low > 10 && iterations < 15) {
    const mid = (low + high) / 2;
    const testScenario = {
      ...baseScenario,
      expenses: {
        ...baseScenario.expenses,
        fixed_monthly: mid
      }
    };

    const results = await calculateRetirementProjection(client, testScenario);

    if (results.final_portfolio_value > tolerance) {
      low = mid; // Can spend more
    } else if (results.final_portfolio_value < -tolerance) {
      high = mid; // Spending too much
    } else {
      return {
        optimizedSpending: mid,
        iterations,
        finalBalance: results.final_portfolio_value
      };
    }
    iterations++;
  }

  return {
    optimizedSpending: (low + high) / 2,
    iterations,
    finalBalance: 0
  };
}
```

**2. Variant Generators** (`scenario-variants.ts`):
```typescript
export function createFrontLoadVariant(baseScenario: Scenario): Scenario {
  const baseline = baseScenario.expenses.fixed_monthly;

  return {
    ...baseScenario,
    name: "Front-Load the Fun",
    expenses: {
      ...baseScenario.expenses,
      age_based_changes: [
        { age: 65, monthly_amount: baseline * 1.30 }, // Go-go years
        { age: 75, monthly_amount: baseline * 0.85 }, // Slow-go years
        { age: 85, monthly_amount: baseline * 0.75 }  // No-go years
      ]
    }
  };
}

export function createLegacyVariant(
  baseScenario: Scenario,
  percentage: number = 0.25
): Scenario {
  return {
    ...baseScenario,
    name: `Leave Legacy (${percentage * 100}%)`,
    expenses: {
      ...baseScenario.expenses,
      legacy_preservation_percentage: percentage
    }
  };
}

export function createDelayCppOasVariant(baseScenario: Scenario): Scenario {
  return {
    ...baseScenario,
    name: "Delay CPP/OAS to 70",
    income_sources: {
      ...baseScenario.income_sources,
      cpp: { ...baseScenario.income_sources.cpp, start_age: 70 },
      oas: { ...baseScenario.income_sources.oas, start_age: 70 }
    }
  };
}
```

### Engine Modifications Needed

**1. Legacy Preservation** (`accounts.ts` and `engine.ts`):
```typescript
// In calculateWithdrawalSequence()
const legacyTarget = scenario.expenses.legacy_preservation_percentage
  ? totalStartingPortfolio * scenario.expenses.legacy_preservation_percentage
  : 0;

// Before withdrawing
if (currentTotalBalance <= legacyTarget) {
  // Preserve legacy - stop/reduce withdrawals
  const availableForWithdrawal = Math.max(0, currentTotalBalance - legacyTarget);
  targetWithdrawal = Math.min(targetWithdrawal, availableForWithdrawal);
}
```

**2. Type Definitions** (`types/calculator.ts`):
```typescript
interface Expenses {
  fixed_monthly: number;
  variable_annual?: number;
  indexed_to_inflation: boolean;
  age_based_changes?: AgeBasedExpenseChange[];
  legacy_preservation_percentage?: number;  // NEW: 0.25 = 25%
}
```

---

## UI/UX Design

### Modal UI Design

**Purpose**: Interactive dialog that explains the scenario, shows quick preview, and allows user to run the calculation.

**Structure**:
```
┌─────────────────────────────────────────────┐
│ 🎯 Front-Load the Fun              [X]     │
│─────────────────────────────────────────────│
│                                              │
│ What This Does:                             │
│ Model the "go-go, slow-go, no-go" phases   │
│ of retirement by adjusting your spending   │
│ based on age and activity level.           │
│                                              │
│ Spending Adjustments:                       │
│ • Ages 65-75 (Go-Go): +30%                 │
│   Travel, hobbies, active lifestyle        │
│                                              │
│ • Ages 75-85 (Slow-Go): -15%               │
│   Reduced activity, more home-based        │
│                                              │
│ • Ages 85+ (No-Go): -25%                   │
│   Minimal travel, healthcare focus         │
│                                              │
│─────────────────────────────────────────────│
│ Quick Estimate:                             │
│ Extra spending in go-go years: ~$156,000   │
│ Portfolio impact: Depletes ~2 years earlier│
│─────────────────────────────────────────────│
│                                              │
│        [ Cancel ]    [ Run Scenario ]       │
└─────────────────────────────────────────────┘
```

**Key Features**:
- **Preset Parameters**: No sliders/customization for MVP (simple UX)
- **Quick Estimate**: Client-side calculation, no server call needed
  ```typescript
  const goGoYears = 10; // Ages 65-75
  const baselineAnnual = baselineMonthly * 12;
  const extraPerYear = (baselineAnnual * 0.30);
  const totalExtra = extraPerYear * goGoYears;
  // Display: "Extra spending in go-go years: ~$156,000"
  ```
- **Theme-Aware**: Matches light/dark mode of results page
- **Keyboard Accessible**: ESC to close, TAB navigation, focus trap
- **Mobile Responsive**: Full-screen on mobile, dialog on desktop

**Future Enhancement** (Phase 2+):
- Add sliders for custom percentages
- Allow age range customization
- Show interactive preview chart

---

### Results Display Approach

**Location**: New section appears **below** existing baseline results

**Layout Strategy**:
```
┌─────────────────────────────────────────┐
│  Portfolio Balance Over Time (Baseline) │
│  [Chart showing baseline projection]    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Income Sources Over Time (Baseline)    │
│  [Chart showing baseline income]        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Tax Summary (Baseline)                 │
│  [Tax metrics for baseline]             │
└─────────────────────────────────────────┘

────────────────────────────────────────────
🎯 NEW: Scenario Comparison Section
────────────────────────────────────────────

┌─────────────────────────────────────────┐
│ Scenario: Front-Load the Fun            │
│                                          │
│ Key Differences vs Baseline:            │
│ ┌──────────────────┬─────────────────┐ │
│ │ Baseline         │ Front-Load Fun  │ │
│ ├──────────────────┼─────────────────┤ │
│ │ $5,000/mo        │ $6,500 (65-75)  │ │
│ │ (all years)      │ $4,250 (75-85)  │ │
│ │                  │ $3,750 (85+)    │ │
│ ├──────────────────┼─────────────────┤ │
│ │ Depletion: None  │ Depletion: 93   │ │
│ ├──────────────────┼─────────────────┤ │
│ │ End: $1.25M      │ End: $45K       │ │
│ └──────────────────┴─────────────────┘ │
│                                          │
│ Portfolio Balance (Variant)              │
│ [Mini chart showing variant projection]  │
│                                          │
│ 💡 Insight: +$156K extra in go-go years│
│                                          │
│ [ Save This Scenario ]  [ Try Another ] │
│ [ Reset to Baseline ]                    │
└─────────────────────────────────────────┘
```

**Why Below (Not Replace)**:
- Preserves baseline context for easy comparison
- User can scroll up to see baseline, down to see variant
- Less jarring than replacing content
- Mobile-friendly (vertical scroll natural)

**Comparison Highlights**:
- Bold/colored text for differences
- Green for benefits (more spending), yellow for trade-offs (earlier depletion)
- Compact metrics table (not full duplicate charts)
- Single mini chart (balance only, not all 3 charts)

---

### Button Layout (Below Charts)

```
┌─────────────────────────────────────────────────────────┐
│  Try These What-If Scenarios                            │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ 🎯 Front-Load   │  │ 💰 Exhaust      │              │
│  │ the Fun         │  │ Portfolio       │              │
│  │                 │  │                 │              │
│  │ Spend more      │  │ Maximize your   │              │
│  │ early, scale    │  │ lifestyle       │              │
│  │ back later      │  │                 │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ 🏛️ Leave a      │  │ ⏰ Delay CPP/   │              │
│  │ Legacy          │  │ OAS to 70       │              │
│  │                 │  │                 │              │
│  │ Preserve 25%    │  │ Maximize govt   │              │
│  │ for heirs       │  │ benefits        │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Button States

**Idle**:
- Background: Light gray (light mode), dark gray (dark mode)
- Cursor: pointer
- Hover: Slight background darken

**Loading**:
- Show spinner icon
- Text: "Calculating..." or "Optimizing..."
- Disable other buttons
- Cursor: wait

**Active/Selected**:
- Background: Blue accent
- Border: 2px solid blue
- Indicates currently shown variant

### Comparison View

**Side-by-Side Layout**:
```
┌──────────────────────┬──────────────────────┐
│   Baseline Plan      │  Front-Load the Fun  │
├──────────────────────┼──────────────────────┤
│ Monthly Spending     │ Monthly Spending     │
│ $5,000               │ Ages 65-75: $6,500   │
│                      │ Ages 75-85: $4,250   │
│                      │ Ages 85+: $3,750     │
├──────────────────────┼──────────────────────┤
│ Portfolio Depletion  │ Portfolio Depletion  │
│ Never (surplus)      │ Age 93               │
├──────────────────────┼──────────────────────┤
│ Ending Balance       │ Ending Balance       │
│ $1,250,000           │ $45,000              │
└──────────────────────┴──────────────────────┘

Key Difference:
✓ +$156,000 extra spending in go-go years (ages 65-75)
⚠️  Portfolio exhausts 2 years earlier (age 93 vs 95+)

[ Back to Baseline ]  [ Save This Scenario ]
```

### Mobile Responsive

**Desktop**: 2x2 grid (4 buttons visible)
**Tablet**: 2x2 grid (scrollable if 5+ buttons)
**Mobile**: 1x4 stack (vertical list)

---

## Workflow & User Journey

### Happy Path

1. **User completes voice conversation** → sees baseline results + charts
2. **Scrolls down** → sees "Try These What-If Scenarios" section
3. **Clicks "Front-Load the Fun"** button
   - Button shows loading spinner: "Calculating..."
   - ~300ms later: Results update to comparison view
4. **Reviews comparison** → decides they like it
5. **Clicks "Save This Scenario"**
   - Prompt appears: "Save as: [Front-Load the Fun]" (editable)
   - Saves to database with `source='what_if'`
6. **Scenario saved** → shows in scenario list
7. **User can return** to baseline or try another what-if

### Alternative Path

1. User clicks "Exhaust Portfolio"
2. Loading spinner: "Optimizing your maximum spending..." (~1 second)
3. Results show overspending warning (edge case)
4. User sees they need to reduce spending to $4,200/month
5. Clicks "Adjust to Sustainable Level" → updates baseline scenario
6. Re-runs calculation with corrected spending

---

## Data Model

### Scenario Source Tracking

**Current**:
```typescript
scenarios.source: 'voice' | 'form' | 'manual' | 'api'
```

**Add**:
```typescript
scenarios.source: 'voice' | 'form' | 'manual' | 'api' | 'what_if'
scenarios.variant_type?: 'front_load' | 'exhaust' | 'legacy' | 'delay_benefits' | 'retire_early'
scenarios.parent_scenario_id?: uuid  // References original baseline
```

### Database Updates

**Migration**: Add new columns to `scenarios` table
```sql
ALTER TABLE scenarios
  ADD COLUMN variant_type TEXT CHECK (
    variant_type IN ('front_load', 'exhaust', 'legacy', 'delay_benefits', 'retire_early')
  ),
  ADD COLUMN parent_scenario_id UUID REFERENCES scenarios(id);

-- Index for parent lookups
CREATE INDEX idx_scenarios_parent ON scenarios(parent_scenario_id);
```

---

## Tier Limitations

### Free Tier (Basic)
- **Saved Scenarios**: 1 (baseline only)
- **What-If Access**: Can try all scenarios, but must replace baseline to save
- **Comparison**: Baseline vs 1 variant at a time
- **Save Prompt**: "Upgrade to Pro to save multiple scenarios"

### Pro Tier ($9-19/mo)
- **Saved Scenarios**: 3 (1 baseline + 2 what-if variants)
- **What-If Access**: Full access, can save favorites
- **Comparison**: Baseline vs 1 variant (same as free)
- **Export**: PDF reports with variant comparisons

### Advanced Tier ($99-499/mo)
- **Saved Scenarios**: Unlimited
- **What-If Access**: Full access + custom variants
- **Comparison**: Multi-scenario view (3-4 side-by-side)
- **Advanced**: Monte Carlo simulation on variants

---

## Testing Strategy

### Unit Tests
- Binary search converges correctly (optimizeSpendingToExhaust)
- Variant generators produce valid scenarios
- Edge cases: already exhausting, zero portfolio, etc.

### Integration Tests
- Full calculation pipeline with each variant type
- Database saves scenarios with correct metadata
- RLS policies allow variant access

### E2E Tests (Playwright)
- Click button → see loading → see results
- Save variant → appears in scenario list
- Return to baseline → original results restored

---

## Performance Targets

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| Simple variant (Front-Load, Delay) | <500ms | ~300ms | ✅ |
| Binary search (Exhaust) | <2s | ~1s | ✅ |
| Legacy calculation | <500ms | ~400ms | ✅ |
| UI render (comparison view) | <100ms | ~50ms | ✅ |

---

## Implementation Phases

### Phase 1: Quick Wins (3-4 hours)
**Goal**: Validate UX pattern, deliver immediate user value

**Buttons**:
1. Front-Load the Fun (1-2 hours)
2. Delay CPP/OAS (1 hour)

**Deliverables**:
- Basic button UI component
- Simple comparison view
- 2 working scenario variants
- No save functionality yet (just comparison)

**Success Metrics**:
- Users click buttons (engagement)
- Time spent reviewing comparisons
- User feedback on clarity

---

### Phase 2: Optimization Features (6-8 hours)
**Goal**: Add complex, high-value optimization scenarios

**Buttons**:
3. Exhaust Your Portfolio (4-6 hours)
   - Binary search algorithm
   - Loading states
   - Edge case handling
4. Leave a Legacy (3-4 hours)
   - Engine modifications for legacy preservation
   - Percentage-based calculation

**Deliverables**:
- scenario-optimizer.ts module
- Engine modifications (legacy field)
- Enhanced comparison view (trade-off metrics)
- Save functionality (database integration)

**Success Metrics**:
- Optimization accuracy (within $10K tolerance)
- Performance (< 2s for all scenarios)
- Save rate (% of users who save variants)

---

### Phase 3: Polish & Enhancement (2-3 hours)
**Goal**: Refinements based on user feedback

**Features**:
5. Retire Earlier button (if requested)
6. Multi-scenario comparison (Pro/Advanced tiers only)
7. Export variants to PDF
8. Scenario history/versioning

**Deliverables**:
- Additional variant types
- Tier-gated features
- Enhanced UI (animations, better mobile)

**Success Metrics**:
- Pro tier conversion rate
- Feature usage by tier
- User satisfaction scores

---

## Open Questions & Future Considerations

### User Experience
- Should we allow custom variants? (e.g., user sets own spending % for Front-Load)
- How many scenarios is too many? (avoid decision paralysis)
- Should variants have explanatory videos/tooltips?

### Product Strategy
- Which features drive Pro tier upgrades most effectively?
- Should Advanced tier get "scenario playground" with unlimited experimentation?
- API access to optimization algorithms for advisors?

### Technical
- Cache optimization results to avoid recalculation?
- Background calculation (Web Workers) for better perceived performance?
- Real-time calculation as user adjusts sliders (debounced)?

---

## Success Criteria

### MVP (Phase 1-2)
- ✅ 4 scenario buttons implemented and functional
- ✅ Comparison view clear and actionable
- ✅ Performance < 2s for all scenarios
- ✅ Save functionality working (tier-limited)
- ✅ Zero calculation errors or edge case crashes

### Adoption Targets (3 months post-launch)
- 60%+ of users try at least 1 what-if scenario
- 30%+ of Pro users save 2+ scenarios
- <5% bounce rate during scenario exploration
- Average 2.5 scenarios tried per user session

### Quality Metrics
- 95%+ optimization accuracy (within $10K)
- <0.1% calculation errors
- <2s average load time (including network)
- 4.5+ star rating for feature (user surveys)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| TBD | Use binary search for exhaust optimization | More accurate than simple math, acceptable 1s latency |
| TBD | Percentage-based legacy (not fixed $) | Scales with portfolio size, simpler UX |
| TBD | One-at-a-time comparison (MVP) | Simpler UX, 80% of use cases, easy to enhance |
| TBD | Allow saving variants | User value + upgrade incentive (tier limits) |
| TBD | "Leave a Legacy" over "Preserve Capital" | More emotionally resonant naming |
| TBD | Show warning for overspending edge case | Critical info users need, actionable guidance |

---

## Appendix: Alternative Scenarios Considered

### Rejected Ideas
1. **"Add $100K Windfall"** - Too specific, not broadly applicable
2. **"Max Out RRSP Contributions"** - Renamed to "Exhaust Portfolio" (clearer value)
3. **"Test 5% vs 6% Returns"** - Too technical, limited user interest
4. **"Inflation Sensitivity"** - Academic, not actionable for most users

### Future Possibilities
1. **"Part-Time Work in Early Retirement"** - Model phased retirement income
2. **"Downsize at 75"** - One-time income boost from home sale
3. **"Healthcare Costs Spike"** - Model $50K medical emergency impact
4. **"Support Adult Children"** - Factor in ongoing family support expenses

---

**Document Version**: 1.0
**Last Updated**: 2025-10-28
**Owner**: Lance Jones
**Status**: Approved for future implementation

---

## CRITICAL NOTE: Adding New What-If Scenarios (2025-10-31)

⚠️ **IMPORTANT**: When adding new variant types to the what-if scenario system, you MUST follow this complete 6-step pattern to ensure proper functionality across the entire application (creation, regeneration, display, detection, and sharing).

### The 6-Step Pattern for New Variants

**1. Define Type**: Add to `VariantType` enum (`variant-metadata.ts:19-22`)
```typescript
export type VariantType =
  | 'front-load'
  | 'delay-cpp-oas'
  | 'retire-early'
  | 'your-new-variant' // Add here
```

**2. Create Function**: Add variant creation function (`scenario-variants.ts`)
```typescript
export function createYourNewVariant(baseScenario: Scenario): Scenario {
  return { ...baseScenario, /* modifications */ }
}
```

**3. Add Regeneration**: Add case to switch statement (`variant-metadata.ts:112-125`)
```typescript
case 'your-new-variant':
  return createYourNewVariant(baseScenario)
```

**4. Add Detection**: Add pattern to `detectVariantTypeFromName()` (`variant-metadata.ts:144-158`)
```typescript
if (lowercaseName.includes('your new variant name')) {
  return 'your-new-variant'
}
```

**5. Add Display Name**: Add to `getVariantDisplayName()` (`variant-metadata.ts:131-139`)
```typescript
'your-new-variant': 'Your New Variant Display Name'
```

**6. Add Details**: Add case to `getVariantDetails()` (`variant-metadata.ts:184-303`)
```typescript
case 'your-new-variant': {
  return { title: '...', items: [...] }
}
```

### Why This Matters

- **Variants are saved with metadata** (`__metadata.variant_type`) in the database
- **Saved variants can be recalculated** - when a user loads a saved variant and clicks Calculate, the variant modifications are regenerated from the current form values using `regenerateVariant()`
- **Missing any step breaks the regeneration flow** - variants will fail to recalculate properly or show incorrect details
- **All 3 current variants verified working**: front-load, delay-cpp-oas, retire-early

### Architecture Overview

```
User creates variant → Saves → Loads later → Edits form → Clicks Calculate
                                                                 ↓
                                        Detects variant metadata exists
                                                                 ↓
                                    Calls regenerateVariant() with type
                                                                 ↓
                          Switch matches type → Calls creation function
                                                                 ↓
                        Variant modifications applied to NEW baseline values
```

**Key Files**:
- `/src/lib/scenarios/variant-metadata.ts` - Metadata handling, regeneration, detection, display
- `/src/lib/calculations/scenario-variants.ts` - Variant creation functions
- `/src/app/calculator/home/VoiceFirstContentV2.tsx:572-576` - Regeneration trigger

### Critical Learnings for Lump Sum Implementation (2025-11-02)

**1. Binary Search Range Must Be Wide (0.3x-5.0x baseline)**
- Leave a Legacy 10% required +60% spending increase (not reduction!)
- Narrow range (0.8x-1.2x) failed - couldn't find solution outside 20% bounds
- Lump Sum will have same issue: large withdrawal might require reduction OR allow increase
- See `/src/lib/calculations/scenario-optimizer.ts:203-207` for reference

**2. Pass Spending Comparison to AI Insights**
- AI needs spending data, not just calculation results, to explain variants
- Add `spendingComparison` object when calling `/api/generate-insight`
- For Lump Sum: Include withdrawal amount, age, source account, tax impact
- See `/src/app/calculator/home/VoiceFirstContentV2.tsx:812-827` for pattern

**3. Add Lifetime Total as Secondary Metric**
- Year 1 After-Tax Income misleads for one-time events (only shows withdrawal year)
- Added "Lifetime total: $1.8M after taxes" below Year 1
- Captures full impact: withdrawal tax + reduced growth + adjusted spending
- See `/src/lib/calculations/results-formatter.ts:94-98` for implementation

### Critical Bug Pattern: retirement_age Modifications (2025-11-01)

⚠️ **LESSON LEARNED**: When a variant modifies `basic_inputs.retirement_age` (like "Retire Earlier"), special care must be taken when displaying results.

**The Bug**:
- Variants that modify `retirement_age` (e.g., "Retire 3 Years Earlier" changes age 61 → 58) break ResultsSummary display
- When a saved variant is loaded, BaselineResults receives the variant's calculation results BUT the form's `retirementAge` state still reflects the baseline value
- `formatSummary()` uses the `retirementAge` parameter to find the first retirement year:
  ```typescript
  const firstRetirementYear = results.year_by_year.find(
    year => year.age >= retirementAge  // Looking for age >= 61 (baseline)
  )
  ```
- If results start at age 58 but we search for age >= 61, it skips 3 years and shows wrong data

**The Fix** (VoiceFirstContentV2.tsx:1155):
```typescript
// WRONG: Uses form state which may be baseline value
retirementAge={retirementAge || 65}

// CORRECT: Use variant's retirement age if variant is loaded
retirementAge={loadedVariantScenario?.basic_inputs.retirement_age || retirementAge || 65}
```

**Why Other Variants Didn't Have This Bug**:
- Front-Load: Modifies `expenses.age_based_changes` (spending patterns) - retirement age unchanged
- Delay CPP/OAS: Modifies `income_sources.cpp.start_age` and `oas.start_age` - retirement age unchanged
- Exhaust Portfolio: Modifies `expenses.fixed_monthly` (spending amount) - retirement age unchanged
- Only "Retire Earlier" modifies `basic_inputs.retirement_age` itself

**Design Principle**:
When passing the `retirementAge` parameter to any results display component, ALWAYS prioritize the loaded scenario's value over form state:
```typescript
retirementAge={loadedScenario?.basic_inputs.retirement_age || formState.retirementAge || defaultValue}
```

This ensures that results are formatted using the retirement age from the actual calculation, not from potentially stale form state.
