# Development Progress Tracker

**Last Updated**: 2025-12-19
**Current Phase**: Between Phase 1 (Complete) and Phase 2 (70% Complete)

---

## Recent Updates

### 2025-12-19: PostHog Analytics Integration

**Why**: Understand user behavior to improve the product. Track the funnel from landing to calculation to save/share.

**Events**:
| Event | Why We Track It |
|-------|-----------------|
| `planning_started` | Funnel top - are visitors converting to users? |
| `calculation_completed` | Core value delivery - are they using the calculator? |
| `scenario_saved` | Engagement - are they invested enough to save work? |
| `scenario_loaded` | Retention - are they coming back? |
| `what_if_created` | Feature adoption - which variants are popular? |
| `share_link_created` | Viral potential - are they sharing with others? |
| `account_created` | Conversion - free to registered |

**Key Properties**: Province, retirement age, asset range (bucketed for privacy), variant type, scenario age, returning user status, source (homepage vs calculator).

**Privacy**: No PII captured. Asset values are bucketed into ranges. Autocapture disabled - only explicit events tracked.

**Update**: Added `source` property to `planning_started` to distinguish homepage "Start Planning" button from calculator "Create New Plan" button.

---

### 2025-12-16: Gross-Up Fix for Withdrawal Calculations

**Problem**: Net income didn't match expenses due to taxes on withdrawals. The engine withdrew the "gap" amount without accounting for taxes owed on those withdrawals.

**Root Cause**: Tax treatment varies dramatically by withdrawal source:
- Non-registered: Only capital gains portion taxed at 50% inclusion (~7-15% effective rate)
- RRSP/RRIF: 100% taxable as income (~30-53% marginal rate)
- TFSA: 0% tax

**Fix**: Implemented source-aware iterative gross-up in `engine.ts:380-462`:
1. Estimates withdrawal source mix based on account balances and withdrawal order (non-reg → RRSP → TFSA)
2. Calculates capital gains for non-registered portion using unrealized gain ratio
3. Applies correct effective marginal rate based on which account the next dollar comes from
4. Iterates until net income ≈ expenses (within $100 tolerance, max 5 iterations)

**Result**:
- Ages 60-64: Net income now matches expenses (was over-withdrawing by $160K/year)
- Ages 68+: Continues to work correctly for RRIF-heavy years
- Portfolio depletion pushed from age 77 → age 82 (5 extra years!)

**Files**: `src/lib/calculations/engine.ts`, `src/scripts/test-gross-up.ts`

---

## Upcoming: 2026 Tax Year Update (January 2026)

**Priority**: High (data accuracy)
**Timeline**: Early January 2026 (after CRA announces final numbers)

All tax data is stored in Supabase database tables. When 2026 rates are announced, update the following:

### Federal Updates
- [ ] **Federal tax brackets** - Indexed annually to inflation (~2.7% expected)
- [ ] **Basic Personal Amount** - Increases annually ($15,705 → ~$16,129 for 2026)
- [ ] **Age Amount** - For seniors 65+ (indexed)

### Provincial Updates (all 13 jurisdictions)
- [ ] **Provincial tax brackets** - Each province indexes differently
- [ ] **Provincial basic personal amounts**
- [ ] Priority provinces: BC, ON, AB, QC (highest user base)

### Government Benefits
- [ ] **CPP** - Maximum pensionable earnings, contribution rates, max benefits
- [ ] **OAS** - Payment amounts (indexed quarterly), clawback threshold (~$90K)
- [ ] **GIS** - If we add support for low-income scenarios

### Contribution Limits
- [ ] **TFSA limit** - Usually $6,500-$7,000/year
- [ ] **RRSP limit** - 18% of prior year income, up to max (~$32K)

### Database Tables to Update
```
tax_years           - Add 2026 row
federal_tax_brackets - Add 2026 brackets
provincial_tax_brackets - Add 2026 for all 13 provinces
government_benefits - Update CPP and OAS JSONB data
tax_credits         - Update BASIC_PERSONAL_AMOUNT, AGE_AMOUNT
tfsa_limits         - Add 2026 limit
```

### Sources
- CRA: https://www.canada.ca/en/revenue-agency.html
- CPP/OAS: https://www.canada.ca/en/services/benefits/publicpensions.html
- Provincial finance ministry sites for each province

---

## Overview

### Quick Status

```
✅ Phase 1: MVP (Complete) - 100%
🔄 Phase 2: Pro Tier (In Progress) - 40% complete, 20% partial (60% features, 0% monetization)
⏳ Phase 3: Advanced Tier (Not Started) - 0%
⏳ Phase 4: Scale & Enhance (Not Started) - 0%
```

---

## Phase 1: MVP ✅ COMPLETE

## Phase 2: Pro Tier 🔄 IN PROGRESS

**PRD Target**: 4-6 weeks (Sprints 9-14)
**Actual Status**: 8 features built, 4 partial, monetization pending
**Next Priority**: Payment integration (Stripe) and missing Pro features

### Feature Completion Matrix

| Feature Category | PRD Requirement | Status | Notes |
|-----------------|-----------------|--------|-------|
| **Core Functionality** | | | |
| Multi-scenario comparison (up to 3) | Pro tier | ✅ Built | Actually supports 6 variants! |
| All provincial tax tables | Pro tier | ✅ Built | All 13 provinces/territories |
| Detailed tax breakdown | Pro tier | ✅ Built | Federal, provincial, OAS clawback |
| Year-by-year table | Pro tier | ✅ Built | Complete projection display |
| Scenario save/load | Pro tier | ✅ Built | Supabase persistence |
| **Advanced Inputs** | | | |
| Spouse/joint planning | Pro tier | ❌ Not built | Sprint 2 priority |
| Variable expense modeling | Pro tier | ⚠️ Partial | Age-based changes only |
| Pension income splitting | Pro tier | ❌ Not built | Sprint 2 |
| Part-time work bridge | Pro tier | ⚠️ Partial | Employment income exists |
| Rental income streams | Pro tier | ❌ Not built | Sprint 2 |
| Estate/bequest goals | Pro tier | ⚠️ Partial | Legacy variant exists |
| **Export & Reports** | | | |
| PDF report (basic) | Pro tier | ❌ Not built | Sprint 2 priority |
| CSV/Excel export | Pro tier | ❌ Not built | Sprint 2 |
| Share link (read-only) | Pro tier | ✅ Built | Database + UI complete |
| **Monetization** | | | |
| Payment integration (Stripe) | Pro tier | ❌ Not built | Sprint 2 priority |
| Upgrade flows | Pro tier | ❌ Not built | Sprint 2 priority |
| Subscription management | Pro tier | ❌ Not built | Sprint 2 |
| **Limits & Tiers** | | | |
| Free tier limits (10 sims/month) | Pro tier | ❌ Not enforced | Sprint 2 |
| Pro tier unlocks | Pro tier | ❌ Not built | Sprint 2 |

### Summary
- **Built**: 8 of 20 Pro features (40%)
- **Partially Built**: 4 of 20 Pro features (20%)
- **Not Built**: 8 of 20 Pro features (40%)
- **Monetization**: 0% complete (critical path)

---

## Sprint 2: Complete Pro Tier

**Goal**: Add remaining Pro tier features and enable monetization
**Estimated Duration**: 4-6 weeks
**Priority Order**: Monetization → Reports → Advanced Inputs

---

### Sprint 2.1: Monetization & Tiers (2 weeks) 🔥 HIGH PRIORITY

**Objective**: Enable revenue generation from Pro features already built.

#### Task 2.1.1: Stripe Integration
**Duration**: 3-4 days

**Requirements**:
- Install `@stripe/stripe-js` and `stripe` packages
- Create Stripe account and get API keys
- Set up webhook endpoint at `/api/stripe/webhook`
- Create Stripe products:
  - Pro Monthly: $19/month
  - Pro Annual: $190/year (save 17%)

**Implementation**:
```typescript
// /lib/stripe/client.ts - Stripe client setup
// /lib/stripe/products.ts - Product/price definitions
// /app/api/stripe/webhook/route.ts - Webhook handler
// /app/api/stripe/create-checkout/route.ts - Checkout session
// /app/api/stripe/create-portal/route.ts - Customer portal
```

**Database Changes**:
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN subscription_status TEXT;
ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMPTZ;
```

**Acceptance Criteria**:
- ✅ User can click "Upgrade to Pro" button
- ✅ Stripe Checkout opens with pricing
- ✅ Successful payment updates user tier in database
- ✅ Webhook handles subscription events (created, updated, canceled)
- ✅ Stripe Customer Portal link works (manage subscription)

---

#### Task 2.1.2: Tier Enforcement & Upgrade Flows
**Duration**: 2-3 days

**Requirements**:
- Implement tier checking middleware
- Add "Upgrade to Pro" gates for Pro features
- Create upgrade modal/page
- Show tier badge in UI

**Implementation**:
```typescript
// /lib/auth/tier-check.ts - Middleware for tier enforcement
// /components/upgrade/UpgradeModal.tsx - Upgrade CTA
// /components/upgrade/PricingTable.tsx - Pricing display
// /hooks/useUserTier.ts - React hook for tier access
```

**Feature Gates**:
- Free tier: Max 10 simulations/month, 1 saved scenario
- Pro tier: Unlimited simulations, 10 saved scenarios, all what-if variants
- Show upgrade prompt when hitting limits

**Acceptance Criteria**:
- ✅ Free users see upgrade prompts for Pro features
- ✅ Pro users have full access without prompts
- ✅ Tier badge displays correctly in UI
- ✅ Usage limits enforced (simulations, saved scenarios)
- ✅ Upgrade flow is smooth and clear

---

#### Task 2.1.3: Usage Tracking & Limits
**Duration**: 1-2 days

**Requirements**:
- Track simulation count per user per month
- Enforce limits for free tier
- Display usage stats to user

**Database Changes**:
```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'simulation', 'scenario_save', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_tracking_user_month
ON usage_tracking(user_id, DATE_TRUNC('month', created_at));
```

**Implementation**:
```typescript
// /lib/usage/tracker.ts - Usage tracking functions
// /lib/usage/limits.ts - Tier limit definitions
// /components/usage/UsageStats.tsx - Display usage to user
```

**Acceptance Criteria**:
- ✅ Free tier users limited to 10 calculations/month
- ✅ Usage resets on 1st of each month
- ✅ User can see remaining calculations
- ✅ Pro tier users have unlimited calculations
- ✅ Upgrade prompt when hitting limit

---

### Sprint 2.2: Reports & Export (1 week)

**Objective**: Enable PDF and CSV exports for Pro users.
**Status**: 1 of 3 tasks complete (Shareable Links ✅)

#### Task 2.2.1: PDF Report Generation
**Duration**: 3-4 days

**Requirements**:
- Generate professional PDF reports
- Include all charts and tables
- Branded header/footer
- Disclaimers included

**Implementation**:
- Use `react-pdf` or `jspdf` + `html2canvas`
- Server-side generation via API route
- Template-based design

```typescript
// /lib/reports/pdf-generator.ts - PDF generation logic
// /app/api/reports/pdf/route.ts - API endpoint
// /components/results/ExportButton.tsx - Export UI
```

**Report Sections**:
1. Executive summary (income, ending balance)
2. Input assumptions
3. Portfolio balance chart (image)
4. Income composition chart (image)
5. Year-by-year table (first 10 years + every 5th)
6. Tax summary
7. Disclaimers

**Acceptance Criteria**:
- ✅ Pro users can click "Export PDF" button
- ✅ PDF generates with all charts and data
- ✅ PDF is downloadable and prints well
- ✅ Branding and disclaimers included
- ✅ Free users see upgrade prompt

---

#### Task 2.2.2: CSV Export
**Duration**: 1 day

**Requirements**:
- Export year-by-year data to CSV
- Include all columns (age, balance, withdrawals, income, tax, etc.)

**Implementation**:
```typescript
// /lib/reports/csv-exporter.ts - CSV generation
// /components/results/ExportButton.tsx - Add CSV option
```

**Acceptance Criteria**:
- ✅ Pro users can export full data to CSV
- ✅ CSV opens correctly in Excel/Google Sheets
- ✅ All columns included with proper headers

---

### Sprint 2.3: Advanced Inputs (2 weeks)

**Objective**: Enable more sophisticated retirement planning scenarios.

#### Task 2.3.1: Spouse/Joint Planning
**Duration**: 4-5 days

**Requirements**:
- Add spouse inputs (age, assets, income, CPP/OAS)
- Model pension income splitting
- Show combined household income
- Tax optimization across spouses

**Database Changes**:
```typescript
// Update Scenario type to include spouse
interface SpouseInputs {
  current_age: number
  retirement_age: number
  longevity_age: number
  assets: {
    rrsp?: AccountBalance
    tfsa?: AccountBalance
    non_registered?: AccountBalance
  }
  income_sources: {
    cpp?: CPPInput
    oas?: OASInput
    pension?: PensionInput
  }
}

// Add to scenarios.inputs JSONB
spouse?: SpouseInputs
```

**Implementation**:
```typescript
// /components/forms/SpouseInputsSection.tsx - Spouse form fields
// /lib/calculations/joint-planning.ts - Joint calculation logic
// /lib/calculations/pension-splitting.ts - Income splitting optimization
```

**Acceptance Criteria**:
- ✅ Can add spouse to scenario
- ✅ Separate asset tracking for each spouse
- ✅ Pension income splitting modeled
- ✅ Combined household tax calculation
- ✅ Results show individual and household income

---

#### Task 2.3.3: Additional Income Streams
**Duration**: 2 days

**Requirements**:
- Rental income with specific start/end dates
- Part-time work during early retirement
- Pension income with bridge benefits (already partially done)

**Implementation**:
```typescript
interface RentalIncomeInput {
  monthly_amount: number
  start_age: number
  end_age?: number
  indexed_to_inflation: boolean
  property_expenses_percentage: number
}

interface PartTimeWorkInput {
  monthly_income: number
  start_age: number
  end_age: number
  tax_deducted_at_source: boolean
}
```

**Acceptance Criteria**:
- ✅ Rental income added to projections
- ✅ Part-time work income included
- ✅ Proper tax treatment for each source

---

## 🎯 NEXT PRIORITY: 6 New What-If Scenarios

**Objective**: Expand the what-if scenario library with high-curiosity variants that drive engagement and create upsell opportunities.

**Current What-Ifs** (already built):
1. Front-Load the Fun
2. Delay CPP/OAS to 70
3. Exhaust Your Portfolio
4. Retire Earlier
5. Leave a Legacy
6. Lump Sum Withdrawal

**New What-Ifs** (to build):

---

### Scenario 1: 📉 "What If Markets Crash at 65?"

**Hook**: *"A 40% drop in your first year of retirement. Can your plan survive?"*

**Appeal**: Broad - #1 retirement fear, 2008/2022 still fresh in memory

#### User Input
- Crash magnitude: -30% / -40% / -50% (default: -40%)
- Recovery period: 3 / 5 / 7 years (default: 5 years)
- Crash timing: First year of retirement (fixed)

#### Calculation Logic
```typescript
interface MarketCrashVariant {
  variant_type: 'market_crash'
  crash_magnitude: number       // e.g., -0.40 for 40% drop
  recovery_years: number        // Years to return to baseline
  crash_year: number            // Year 1 of retirement
}

// Implementation:
// 1. Apply crash_magnitude to portfolio in retirement year 1
// 2. Calculate recovery rate: (1 / (1 + crash_magnitude))^(1/recovery_years) - 1
// 3. Apply recovery rate for recovery_years, then normal returns after
// Example: -40% crash, 5yr recovery = 10.7% annual return for 5 years to recover
```

#### UI Flow
1. User clicks "Markets Crash at 65" button
2. Modal appears with sliders:
   - "How severe?" → -30%, -40%, -50%
   - "Recovery time?" → 3, 5, 7 years
3. User clicks "Run Scenario"
4. Results show comparison: baseline vs crash scenario

#### Output Display
- "Your portfolio would drop from $1.2M to $720K in year 1"
- "Recovery takes until age 70"
- "Portfolio depletes X years earlier / survives with $Y less"
- Chart overlay showing crash trajectory vs baseline

#### Natural Upsell
> *"Want to see the probability your plan survives a crash? [Unlock Monte Carlo Stress Test →]"*

---

### Scenario 2: 💝 "What If I Receive an Inheritance?"

**Hook**: *"Expecting an inheritance? See how it changes your retirement picture."*

**Appeal**: Broad + emotionally charged - taboo topic everyone secretly thinks about

#### User Input
- Expected amount: $25K / $50K / $100K / $250K / $500K / Custom
- Expected age when received: slider (current age to 85)
- Type: Cash / RRSP-RRIF / Investments / Property

#### Calculation Logic
```typescript
interface InheritanceVariant {
  variant_type: 'inheritance'
  amount: number
  received_at_age: number
  source_type: 'cash' | 'rrsp_rrif' | 'investments' | 'property'
}

// Tax treatment by source_type:
// - 'cash': No tax (estate paid taxes)
// - 'rrsp_rrif': Fully taxable as income in year received (unless spouse rollover)
// - 'investments': No tax on receipt, inherited ACB = FMV at death
// - 'property': No tax on principal residence, capital gains on other property paid by estate

// Implementation:
// 1. At received_at_age, add amount to appropriate account
// 2. If RRSP/RRIF: add to taxable income that year (big tax hit)
// 3. If cash/investments: add to non-registered account
// 4. If property: user specifies if selling (add cash) or keeping (no immediate impact)
```

#### UI Flow
1. User clicks "Receive an Inheritance" button
2. Modal with inputs:
   - Amount selector (preset buttons + custom input)
   - Age slider
   - Type dropdown (with tax implications explained)
3. User clicks "Run Scenario"
4. Results show impact

#### Output Display
- "Receiving $200K at age 68 extends your portfolio by X years"
- "If from an RRSP: $60K goes to taxes that year, net benefit $140K"
- Chart showing step-up in portfolio at inheritance age

#### Sensitivity
- Acknowledge the delicacy: "Planning for the unexpected" framing
- Option to model uncertainty: "What if it's 50% less than expected?"

---

### Scenario 3: 🏠 "What If I Downsize My Home?"

**Hook**: *"Unlock $300K in home equity. How does that change everything?"*

**Appeal**: Broad - common retirement decision, big numbers, emotionally charged

#### User Input
- Current home value: $ (default from user's area median or manual)
- Downsized home cost: $ (or "Rent instead" option)
- Age when downsizing: slider
- Selling costs: % (default 5% for realtor, legal, moving)

#### Calculation Logic
```typescript
interface DownsizeVariant {
  variant_type: 'downsize'
  current_home_value: number
  new_home_cost: number         // 0 if renting
  downsize_age: number
  selling_costs_pct: number     // e.g., 0.05
  monthly_rent?: number         // If renting instead of buying
}

// Implementation:
// 1. At downsize_age:
//    net_proceeds = current_home_value * (1 - selling_costs_pct) - new_home_cost
// 2. Add net_proceeds to non-registered account
// 3. If renting: add monthly_rent to expenses going forward
// 4. If buying smaller: no change to expenses (assume similar costs)
// 5. Principal residence = no capital gains tax
```

#### UI Flow
1. User clicks "Downsize My Home" button
2. Modal with inputs:
   - Current home value
   - "Buy smaller" or "Rent" toggle
   - If buying: new home cost
   - If renting: monthly rent
   - Age when doing this
3. User clicks "Run Scenario"

#### Output Display
- "Downsizing at 70 adds $350K to your portfolio"
- "This extends your runway by X years"
- "Trade-off: Monthly expenses increase by $1,500 if renting"
- Chart showing portfolio boost at downsize age

#### Edge Cases
- Handle "already renting" users (grey out this option)
- Handle users who want to model buying MORE expensive (different scenario)

---

### Scenario 4: 💀 "What If I Live to 100?"

**Hook**: *"Your plan works to 90. But what if you're one of the lucky ones?"*

**Appeal**: Broad - universal fear, simple to understand, creates urgency

#### User Input
- Minimal: Just extends longevity to 100 (one-click)
- Optional: Custom longevity age (95, 100, 105)

#### Calculation Logic
```typescript
interface LongevityVariant {
  variant_type: 'longevity'
  new_longevity_age: number    // Default: 100
}

// Implementation:
// 1. Simply change longevity_age in basic_inputs
// 2. Extend all calculations to new age
// 3. Check if portfolio survives
// 4. If not: calculate gap years and funding shortfall
```

#### UI Flow
1. User clicks "Live to 100" button
2. Quick confirmation modal (or just run immediately)
3. Results show comparison

#### Output Display
- "If you live to 100, you need an extra $X"
- "Your portfolio depletes at age 87 - that's 13 unfunded years"
- "Required extra savings: $X per year until retirement"
- Chart extended to age 100 showing gap

#### Natural Upsell
> *"What are the actual odds? [Run Longevity Probability Analysis →]"* (future feature)

---

### Scenario 5: 🍁 "What If I Move Provinces?"

**Hook**: *"Moving from Ontario to Alberta could save you $47K in taxes over retirement."*

**Appeal**: Niche but high-impact - uniquely Canadian, surprising results

#### User Input
- New province: dropdown of all 13 provinces/territories
- Move timing: At retirement / Immediately / Custom age

#### Calculation Logic
```typescript
interface MoveProvincesVariant {
  variant_type: 'move_provinces'
  new_province: Province
  move_at_age: number
}

// Implementation:
// 1. Change province in basic_inputs starting at move_at_age
// 2. Recalculate all provincial taxes from move_at_age onward
// 3. Compare lifetime taxes: before vs after
// 4. Note: CPP/OAS amounts don't change (federal)
// 5. Note: Some provinces have health premiums (BC, ON formerly)
```

#### Provincial Tax Context
```
Highest tax provinces: QC, NS, NB, PE, NL, MB
Lowest tax provinces: AB, ON, BC, SK
Territories: Generally lower but remote

Sample impact (on $80K income):
- Ontario → Alberta: Save ~$3,000/year
- BC → Nova Scotia: Pay ~$2,500/year MORE
- Quebec → Ontario: Save ~$4,000/year
```

#### UI Flow
1. User clicks "Move Provinces" button
2. Modal shows:
   - Current province (from their inputs)
   - "Move to:" dropdown
   - "When?" age slider
3. User clicks "Run Scenario"

#### Output Display
- "Moving from ON to AB at retirement saves $52K in lifetime taxes"
- "Your effective tax rate drops from 24% to 19%"
- "Caveat: Cost of living may differ - we're only showing tax impact"
- Side-by-side tax comparison table

#### Educational Angle
- Link to "Provincial Tax Comparison" article
- Explain this is ONLY tax impact, not cost of living

---

### Scenario 6: 💼 "What If I Work Part-Time?"

**Hook**: *"What if you earned $20K/year for 5 years after 'retiring'? Game changer."*

**Appeal**: Broad - phased retirement is the new normal, empowering message

#### User Input
- Part-time income: $/year (presets: $10K, $20K, $30K, $40K)
- Duration: years (presets: 3, 5, 7, 10 years)
- Start age: defaults to retirement age
- Tax withheld: Yes/No (for UI simplicity)

#### Calculation Logic
```typescript
interface PartTimeWorkVariant {
  variant_type: 'part_time_work'
  annual_income: number
  start_age: number
  end_age: number
  tax_withheld: boolean
}

// Implementation:
// 1. Add annual_income to employment income from start_age to end_age
// 2. This income is taxable (T4 income)
// 3. Recalculate withdrawal needs (less needed from portfolio)
// 4. Show impact on portfolio longevity
// 5. Note: May affect OAS clawback if income is high
```

#### UI Flow
1. User clicks "Work Part-Time" button
2. Modal with:
   - Income amount (slider or preset buttons)
   - "For how long?" years selector
   - Start age (defaults to retirement age)
3. User clicks "Run Scenario"

#### Output Display
- "Working part-time ($20K/year) for 5 years adds $X to your final portfolio"
- "This extends your runway by X years"
- "You'd pay $X in additional taxes but save $X in withdrawals"
- "Net benefit: $X"
- Chart overlay showing reduced withdrawal needs during work years

#### Messaging
- Frame positively: "Stay engaged AND boost your finances"
- Not about "having to work" but "choosing to stay active"

---

### Implementation Priority Order

| # | Scenario | Complexity | Impact | Priority |
|---|----------|------------|--------|----------|
| 1 | Live to 100 | ⭐ Low | High | 🔥 First |
| 2 | Work Part-Time | ⭐⭐ Medium | High | Second |
| 3 | Markets Crash | ⭐⭐ Medium | High | Third |
| 4 | Move Provinces | ⭐⭐ Medium | High | Fourth |
| 5 | Receive Inheritance | ⭐⭐ Medium | High | Fifth |
| 6 | Downsize Home | ⭐⭐⭐ Higher | High | Sixth |

**Rationale**:
- "Live to 100" is trivial (change one number) - quick win
- "Work Part-Time" reuses existing employment income logic
- "Markets Crash" needs custom return modeling but is straightforward
- "Move Provinces" leverages existing provincial tax engine
- "Inheritance" needs tax treatment logic by source type
- "Downsize" has most edge cases (rent vs buy, selling costs, timing)

---

### Existing Architecture Analysis

**The structure is already there.** Adding 6 more variants is purely additive — no structural changes needed.

#### What Exists (Pattern Already Established)

| Layer            | File                             | Current State                                    |
|------------------|----------------------------------|--------------------------------------------------|
| Type Definition  | variant-metadata.ts:23-29        | Union type: 'front-load' \| 'delay-cpp-oas' \| ... |
| Variant Creators | scenario-variants.ts             | 6 exported functions, one per variant            |
| Regeneration     | variant-metadata.ts:114-156      | Switch statement routes to correct creator       |
| Display Names    | variant-metadata.ts:161-172      | Simple map VariantType → string                  |
| Variant Details  | variant-metadata.ts:226-526      | Switch for UI display of parameters              |
| UI Buttons       | WhatIfScenarioButtons.tsx:79-128 | Data-driven array of button configs              |
| Click Handler    | VoiceFirstContentV2.tsx:847-922  | Switch statement creates variant                 |

#### To Add 6 New Variants, You Just:

1. **Extend types** — add 6 values to VariantType union
2. **Add creator functions** — 6 new exports in scenario-variants.ts
3. **Add switch cases** — in regenerateVariant(), getVariantDetails(), handleRunScenario()
4. **Add button configs** — 6 entries to the variants array
5. **Add display names** — 6 entries to the name map

#### One UI Consideration

Currently renders a 3×2 grid (6 buttons). With 12 buttons, you'd need:
- 4×3 grid (might be cramped on mobile), or
- Two rows of 6 (horizontal scroll on mobile), or
- Collapsible sections ("Core" vs "Advanced" what-ifs)

But that's a styling tweak, not an architectural change.

#### No Changes Needed To:

- Database schema (metadata is JSONB — flexible by design)
- Calculation engine (variants just modify scenario inputs)
- API routes
- Component structure

---

### Technical Implementation Notes

#### Variant Metadata Extension
```typescript
// Extend existing VariantMetadata type
type VariantTypeKey =
  // Existing
  | 'front_load' | 'delay_benefits' | 'exhaust' | 'retire_early' | 'legacy' | 'lump_sum'
  // New
  | 'market_crash' | 'inheritance' | 'downsize' | 'longevity' | 'move_provinces' | 'part_time_work'

interface VariantMetadata {
  variant_type: VariantTypeKey
  // ... existing fields
  // New variant-specific fields
  crash_magnitude?: number
  inheritance_amount?: number
  new_province?: Province
  part_time_income?: number
  // etc.
}
```

#### Shared Modal Component
Consider building a reusable `WhatIfModal` component:
```typescript
interface WhatIfModalProps {
  title: string
  description: string
  inputs: WhatIfInput[]
  onRun: (values: Record<string, any>) => void
}

interface WhatIfInput {
  type: 'slider' | 'select' | 'number' | 'toggle'
  name: string
  label: string
  options?: { value: any, label: string }[]
  min?: number
  max?: number
  default?: any
}
```

---

## Next Steps

