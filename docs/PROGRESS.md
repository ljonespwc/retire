# Development Progress Tracker

**Last Updated**: 2025-12-16
**Current Phase**: Between Phase 1 (Complete) and Phase 2 (70% Complete)

---

## Recent Updates

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

## Overview

This document maps actual development progress against the [Comprehensive PRD](./Retirement_Calculator_Comprehensive_PRD.md) roadmap.

### Quick Status

```
✅ Phase 1: MVP (Complete) - 100%
🔄 Phase 2: Pro Tier (In Progress) - 40% complete, 20% partial (60% features, 0% monetization)
⏳ Phase 3: Advanced Tier (Not Started) - 0%
⏳ Phase 4: Scale & Enhance (Not Started) - 0%
```

---

## Phase 1: MVP ✅ COMPLETE

**PRD Target**: 8-10 weeks
**Actual**: Completed 2025-11-03
**Status**: ✅ **EXCEEDED EXPECTATIONS**

### What the PRD Asked For

- Voice + text input
- Basic tier functionality
- Single scenario
- Simple charts
- Tax calculation (one province)

### What We Actually Built

| Feature | PRD Status | Actual Status | Notes |
|---------|-----------|---------------|-------|
| Voice + text input | Required | ✅ Built | Form-first with contextual help |
| Basic tier functionality | Required | ✅ Built | All core features working |
| Single scenario | Required | ✅ Built | Plus multi-scenario comparison! |
| Simple charts | Required | ✅ Built | Interactive Recharts visualizations |
| Tax (1 province) | Required | ✅ **Exceeded** | All 13 provinces/territories |
| Anonymous auth | Not specified | ✅ Built | Supabase auth |
| Save/load scenarios | Pro tier | ✅ Built | Supabase persistence |
| Multi-scenario comparison | Pro tier | ✅ Built | 6 what-if variants |
| Detailed tax breakdown | Pro tier | ✅ Built | Federal + provincial + OAS clawback |
| Year-by-year results | Pro tier | ✅ Built | Complete projection table |

### Test Coverage

- ✅ 126 tests passing (100% pass rate)
- ✅ Calculation engine fully tested
- ✅ Component tests for critical UI
- ✅ Integration tests for user flows
- ✅ AI validation CLI tool (validates AI narratives against actual calculations)

### Deployment

- ✅ Vercel production deployment
- ✅ Supabase production database
- ✅ Environment variables configured
- ✅ Analytics and monitoring active

---

## Phase 2: Pro Tier 🔄 IN PROGRESS (60%)

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

### Sprint 2.2: Reports & Export (1 week) - 33% Complete

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

#### Task 2.2.3: Shareable Links ✅ COMPLETE
**Duration**: 1-2 days
**Status**: ✅ Built
**Date Completed**: 2025-11-03

**Requirements**:
- Generate read-only shareable links
- Public page shows results without editing
- Link can be revoked/disabled

**Database**:
- ✅ `share_token` and `is_shared` fields exist in scenarios table
- ✅ `shared_at` timestamp field exists

**Implementation**: ✅ Complete
```typescript
// Database fields already exist
// UI and public route built
```

**Acceptance Criteria**:
- ✅ Users can generate shareable links
- ✅ Link opens read-only version of scenario
- ✅ No auth required to view shared scenario
- ✅ User can disable/revoke sharing

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

#### Task 2.3.2: Variable Expenses & Inflation Adjustments
**Duration**: 2-3 days

**Requirements**:
- Multiple expense categories with different inflation rates
- One-time expenses at specific ages
- Non-recurring large purchases

**Implementation**:
```typescript
interface ExpenseCategory {
  name: string
  monthly_amount: number
  inflation_rate: number // Can differ from general inflation
  start_age?: number
  end_age?: number
}

interface OneTimeExpense {
  description: string
  amount: number
  age: number
}
```

**Acceptance Criteria**:
- ✅ Can add multiple expense categories
- ✅ Each category has custom inflation rate
- ✅ One-time expenses modeled correctly
- ✅ Results show expense breakdown

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

### Sprint 2.4: Polish & Testing (1 week)

**Objective**: Ensure Pro tier is production-ready.

#### Task 2.4.1: Pro Tier Testing
**Duration**: 3 days

**Requirements**:
- Test all payment flows
- Test all Pro features with real data
- Cross-browser testing
- Mobile testing

**Test Scenarios**:
1. Free user hits limit → upgrades → gains access
2. Pro user cancels → reverts to free tier
3. Payment fails → handles gracefully
4. PDF export with complex scenario
5. Shareable link works for non-users
6. Spouse planning with income splitting

---

#### Task 2.4.2: Documentation & Help
**Duration**: 2 days

**Requirements**:
- Help documentation for new features
- Video tutorials (optional)
- FAQ updates
- Support documentation

---

#### Task 2.4.3: Launch Preparation
**Duration**: 2 days

**Requirements**:
- Pricing page updates
- Marketing material
- Launch announcement
- Monitor first users

---

## Sprint 2 Timeline Summary

```
Week 1-2: Monetization (Stripe, tiers, limits)
Week 3: Reports & Export (PDF, CSV) - Sharing ✅ done
Week 4-5: Advanced Inputs (spouse, expenses, income)
Week 6: Polish & Testing
```

**Total Estimated Duration**: 6 weeks (potentially 5.5 weeks with sharing complete)
**Critical Path**: Monetization must come first

---

## Phase 3: Advanced Tier ⏳ NOT STARTED

**PRD Target**: 6-8 weeks (Sprints 15-21)
**Status**: Not started (waiting for Phase 2 completion)

### Key Features (Future)
- Multi-client advisor dashboard
- White-label branding
- Monte Carlo simulation
- Stress testing
- REST API for partners
- Compliance reporting

---

## Phase 4: Scale & Enhance ⏳ NOT STARTED

**PRD Target**: Ongoing
**Status**: Future roadmap

### Potential Features
- Mobile app (React Native)
- Wealthsimple/Questrade integration
- AI financial coaching
- Estate planning integration
- Budget tracking integration

---

## Success Metrics

### Phase 1 Success Criteria ✅
- ✅ Calculator deployed to production
- ✅ Accurate tax calculations (all 13 provinces)
- ✅ User can complete calculation in <5 minutes
- ✅ Results are accurate (verified against manual calculations)
- ✅ Works on mobile and desktop

### Phase 2 Success Criteria 🎯 (Target)
- 🎯 Payment integration live
- 🎯 First paying customer acquired
- 🎯 5% free-to-paid conversion rate
- 🎯 10 paying customers in first month
- 🎯 $190+ MRR within 30 days of Pro launch

---

## Next Steps

**Immediate Priority (Sprint 2.1 - Weeks 1-2)**:
1. Set up Stripe account and products
2. Implement payment integration
3. Add tier enforcement and upgrade flows
4. Test payment flows end-to-end

**Secondary Priority (Sprint 2.2 - Week 3)**:
1. Build PDF report generator
2. Add CSV export
3. Implement shareable links

**Tertiary Priority (Sprint 2.3 - Weeks 4-5)**:
1. Add spouse/joint planning
2. Enhanced expense modeling
3. Additional income streams

---

**Last Updated**: 2025-11-03
**Next Review**: After Sprint 2.1 completion
