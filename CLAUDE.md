# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ IMPORTANT: Development Workflow

**Build verification strategy (to save time):**
- **UI/Component changes only**: Run `npm run build 2>&1 | head -n 50` (partial build check - catches most issues quickly)
- **Backend/API/calculation changes**: Run full `npm run build` (complete verification required)
- **Type changes or library updates**: Run full `npm run build` (complete verification required)

**DO NOT push to git or deploy to Vercel.** The user will handle all git commits, pushes, and deployments manually.

Your job is to:
1. Make the requested changes
2. Run appropriate build verification (partial or full based on change type)
3. Report the results to the user
4. Let the user handle git/deployment

## Project Overview

A Canadian retirement income calculator with sophisticated financial modeling. The platform helps Canadians understand their retirement income potential, eliminating complex spreadsheets and financial jargon.

### Core Functionality
- **Canadian Tax Engine**: Accurate projections based on federal/provincial tax rules, CPP/OAS benefits, and registered account regulations (RRSP/RRIF/TFSA)
- **Scenario Modeling**: Compare different retirement ages, spending levels, and investment strategies
- **Visual Projections**: Interactive charts showing portfolio balance, income composition, and tax impact over retirement timeline

### Product Tiers
1. **Basic (Free)**: Single scenario, basic simulation with simple visualizations
2. **Pro ($9-19/mo)**: Multi-scenario comparison (up to 3), detailed tax breakdown, joint/spouse planning, PDF reports
3. **Advanced ($99-499/mo)**: Unlimited scenarios, Monte Carlo simulation, advisor dashboard, white-label branding, API access

### Target Users
- Primary: Pre-retirees aged 45-70 with $100K-$10M+ in assets
- Secondary: Financial advisors and wealth managers
- Tertiary: Financial institutions (API integration)

## MCP Tool Configuration

### Supabase MCP

**Project ID**: `xrtlrsovgqgivpbumany`
Always use this project_id when interacting with Supabase MCP tools.

### Playwright MCP

**Browser Testing**: For all browser-related testing tasks (UI testing, visual regression, E2E testing, screenshot capture, etc.), use the Playwright MCP tools instead of manually running browser commands.

Available Playwright MCP tools:
- `browser_navigate` - Navigate to URLs
- `browser_snapshot` - Capture accessibility snapshots (better than screenshots for actions)
- `browser_take_screenshot` - Take visual screenshots
- `browser_click` - Perform clicks
- `browser_fill_form` - Fill multiple form fields
- `browser_type` - Type text into elements
- `browser_evaluate` - Execute JavaScript
- `browser_wait_for` - Wait for conditions
- `browser_console_messages` - Get console output
- `browser_network_requests` - Inspect network activity

**Example use cases**:
- Testing the calculator UI at `/calculator/home`
- Verifying form field updates and calculations
- Capturing screenshots of calculation results
- Testing responsive design across viewports
- Debugging browser console errors

**Workflow**: Always use `browser_snapshot` first to understand page structure, then use action tools (click, type, etc.) as needed.

### Tax Data Storage (Database-Backed)

**Important**: As of Sprint 1, all Canadian tax data is stored in Supabase database, NOT in hardcoded constants.

#### Database Tables

1. **tax_years**: Master table for available tax years
   - Columns: year, is_active, effective_date
   - Current: 2025

2. **federal_tax_brackets**: Federal tax brackets by year
   - Columns: year, bracket_index, income_limit, rate
   - 5 brackets for 2025

3. **provincial_tax_brackets**: Provincial/territorial brackets
   - Columns: year, province_code, bracket_index, income_limit, rate
   - All 13 provinces/territories (AB, BC, MB, NB, NL, NT, NS, NU, ON, PE, QC, SK, YT)

4. **government_benefits**: CPP and OAS data
   - Columns: year, benefit_type, data (JSONB)
   - Types: CPP, OAS

5. **rrif_minimums**: RRIF withdrawal percentages
   - Columns: age (55-95), percentage
   - Age-based, doesn't change by year

6. **tfsa_limits**: Historical TFSA contribution limits
   - Columns: year (2009-2025), annual_limit

7. **tax_credits**: Federal tax credits
   - Columns: year, credit_type, data (JSONB)
   - Types: BASIC_PERSONAL_AMOUNT, AGE_AMOUNT

#### Query Functions

Location: `src/lib/supabase/tax-data.ts`

Key functions:
- `getTaxYears(client)` - Get all available tax years
- `getFederalTaxBrackets(client, year)` - Get federal brackets
- `getProvincialTaxBrackets(client, province, year)` - Get provincial brackets
- `getCPPAmounts(client, year)` - Get CPP data
- `getOASAmounts(client, year)` - Get OAS data
- `getRRIFMinimums(client)` - Get RRIF percentages
- `getTFSALimits(client)` - Get TFSA limits
- `getTaxCredits(client, year)` - Get tax credits

**Caching**: All queries use in-memory caching (24-hour TTL) to reduce database load.

#### Adding New Tax Years

When 2026 tax data becomes available:

1. Insert new tax year: `INSERT INTO tax_years (year, is_active, effective_date) VALUES (2026, true, '2026-01-01')`
2. Add federal brackets for 2026
3. Add provincial brackets for all provinces
4. Add CPP/OAS amounts for 2026
5. Add TFSA limit for 2026
6. Add tax credits for 2026

This can be done via Supabase SQL editor or a migration script without code deployment.

#### Type Definitions

Location: `src/types/constants.ts`

Contains only TypeScript types and interfaces:
- `Province` enum (AB, BC, MB, NB, NL, NT, NS, NU, ON, PE, QC, SK, YT)
- `TaxBracket` interface

**Note**: All hardcoded constant values have been removed from this file. Use query functions instead.

## Tech Stack

### Core Framework
- **Next.js 14** (App Router) with TypeScript
- **React 18** with React DOM
- **Tailwind CSS** with PostCSS and Autoprefixer

### Database
- **Supabase** (@supabase/supabase-js) - PostgreSQL backend

### UI & Styling
- **Framer Motion** - Animations
- **Lucide React** - Icon system
- **clsx** + **tailwind-merge** - Utility for conditional CSS classes

### State Management
- **Zustand** - Lightweight state management

### Development Tools
- **TypeScript** (strict mode)
- **tsx** - TypeScript execution for scripts
- **dotenv** - Environment variable management

## Commands

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Repository Structure

```
retire/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Homepage
│   │   └── globals.css   # Global styles with Tailwind
│   ├── components/       # React components
│   ├── lib/              # Business logic utilities
│   │   └── supabase/     # Supabase client and queries
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API integrations
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
├── docs/                 # Product documentation
└── .env.local            # Environment variables (not committed)
```

## Environment Setup

Environment variables are configured in `.env.local` (already exists):
- **Supabase**: URL and keys from your Supabase project

Run `npm run dev` to start development.

## Path Aliases

This project uses TypeScript path aliases:
- `@/*` maps to `./src/*`

Example: `import { MyComponent } from '@/components/MyComponent'`

## Development Progress

### Sprint 1: Foundation & Infrastructure Setup ✅ COMPLETED

**1. Project Configuration**
- Next.js 14 with TypeScript (strict mode) and App Router
- Tailwind CSS with custom PRD design system
- shadcn/ui CLI configured
- Dependencies: zod, date-fns, @supabase/ssr, clsx, tailwind-merge
- Folder structure: app/, components/, lib/, services/, hooks/, types/

**2. Supabase Database Schema**
- **Core Tables**: users, scenarios (with RLS policies and indexes)
- **Tax Data Tables** (7 tables): tax_years, federal_tax_brackets, provincial_tax_brackets, government_benefits, rrif_minimums, tfsa_limits, tax_credits
- **2025 Data**: 5 federal brackets, 57 provincial brackets (13 jurisdictions), CPP/OAS benefits, RRIF rules, TFSA limits
- **Query Layer**: `src/lib/supabase/tax-data.ts` (15+ functions, 24-hour in-memory caching)
- **Clients**: Browser, server, middleware using @supabase/ssr

**3. TypeScript Type System**
- `src/types/calculator.ts` (400+ lines): BasicInputs, Assets, IncomeSources, Expenses, Assumptions, YearByYearResult, CalculationResults, Scenario
- `src/types/constants.ts`: Province enum, TaxBracket interface
- `src/types/database.ts`: Schema types for all tables
- `src/types/index.ts`: Barrel export

**4. Database Optimizations**
- RLS policies (using `SELECT` subqueries)
- Secured functions with fixed `search_path`
- Public read-only access to tax data tables

**5. Deployment**
- Vercel deployment working
- `.npmrc` configured with `legacy-peer-deps`

**Achievement**: Migrated tax data from hardcoded constants to database, enabling multi-year support without code deployment.

### Sprint 2: Calculation Engine (Core Business Logic) ✅ COMPLETED

**Setup**
- Vitest with Next.js/React compatibility (`vitest.config.ts`)
- Testing infrastructure (test-setup.ts, test-utils.ts, test-fixtures.ts)
- Provincial tax credits in database (migrations 004, 005)
- 2025 provincial basic personal amounts for all 13 provinces
- Updated tax-data.ts with provincial credit query functions

**1. Tax Calculation Engine** (`src/lib/calculations/tax-calculator.ts` - 433 lines)
- **31 tests passing**
- Progressive federal tax (basic personal amount $15,705, income-tested age amount)
- Provincial tax for all 13 provinces with province-specific credits
- Income treatment by source (RRSP 100%, capital gains 50%, dividends 138%, TFSA 0%)
- OAS clawback (15% above $86,912)
- Master tax function with detailed breakdown
- All functions accept Supabase client (dependency injection)

**2. Government Benefits** (`src/lib/calculations/government-benefits.ts` - 344 lines)
- **38 tests passing**
- CPP adjustment by age (60-70): 64% at 60, 100% at 65, 142% at 70
- OAS deferral bonuses (65-70): 100% at 65, 136% at 70
- Earnings-based CPP estimation
- Optimal start age calculators
- Database-backed 2025 amounts

**3. Account Management** (`src/lib/calculations/accounts.ts` - 438 lines)
- **36 tests passing**
- RRIF minimum withdrawals (age-based percentages from database)
- Tax-efficient sequencing: Non-registered → RRSP/RRIF → TFSA
- Account growth projections (single + multi-year)
- RRSP to RRIF conversion at 71

**4. Main Engine** (`src/lib/calculations/engine.ts` - 401 lines)
- **21 tests passing**
- `calculateRetirementProjection()`: Phase 1 (pre-retirement accumulation) + Phase 2 (retirement drawdown)
- Year-by-year simulation (current age to longevity)
- Scenario comparison, depletion detection, success metrics
- Summary statistics

**Test Results**: **126 tests passing** (31 tax + 38 benefits + 36 accounts + 21 engine)

**Architecture**:
1. Dependency Injection (all functions accept Supabase client)
2. Database-backed tax data (enables multi-year support)
3. Pure functions (calculation logic separated from data retrieval)
4. Type safety (strict TypeScript)

**Files Created**: 17 (4 engines, 4 tests, 4 infrastructure, 2 migrations, 3 configs)

**Production Build Fixes**:
- Optional asset field handling (rrsp, tfsa, non_registered)
- CalculationResults interface alignment
- AgeBasedExpenseChange property names

**Achievement**: Complete calculation engine with 100% test coverage, deployed to production.

### Sprint 3: UI & Results Visualization ✅ COMPLETED

**Goal**: Production-ready calculator UI with comprehensive results visualization and scenario comparison.

**UI Implementation**:
- Form-first calculator at `/calculator/home` with contextual help sidebar
- "Start Planning" button flow with empty form initial state
- Field-level focus tracking with 17 contextual help tips
- Dark mode support via useLocalStorage hook
- Responsive two-column layout (40% sidebar, 60% form)
- Confetti celebration on calculation completion

**Results Components**:
- `ResultsSummary.tsx` - Key metrics overview
- `BalanceOverTimeChart.tsx` - Portfolio balance projection
- `IncomeCompositionChart.tsx` - Income source breakdown
- `TaxSummaryCard.tsx` - Tax impact analysis
- `RetirementNarrative.tsx` - AI-generated summary

**Scenario Features**:
- Save/load scenarios with LoadScenarioDropdown
- What-if scenario variants (Front-Load the Fun, Delay CPP/OAS, etc.)
- Tabbed comparison UI for baseline vs variant analysis
- Anonymous auth with seamless upgrade flow

**Files Created**:
- `/src/components/results/*.tsx` - 5 visualization components
- `/src/components/scenarios/*.tsx` - Scenario management
- `/src/lib/calculations/results-formatter.ts` - Data formatting utilities
- `/src/lib/calculations/scenario-variants.ts` - Variant creation logic

**Achievement**: Full end-to-end flow from form entry → calculation → results display → scenario comparison.

## Recent Updates

**2025-10-29**: Variant Regeneration Bug Fix - CRITICAL
- **Problem**: Saved variants (e.g., "Front-Load the Fun") showed different results when reloaded and recalculated
  - Original variant: $18.1M ending balance, TWO distinct spending dips at ages 71 and 81
  - Regenerated variant: $22.5M ending balance, ONE large dip at 71, hump UP at 81
- **Root Cause**: `handleCalculate()` in VoiceFirstContentV2.tsx was missing `indexed_to_inflation: true` in expenses object
  - Original variant (via `createScenarioFromFormData`): Had `indexed_to_inflation: true` ✓
  - Regenerated variant (via `handleCalculate`): Missing this field, defaulted to false ✗
  - Impact: Without inflation indexing, spending stayed flat in nominal terms instead of growing with 2% inflation
  - This caused artificially lower real spending over time → higher ending balance + incorrect chart shape
- **Fix**: Added `indexed_to_inflation: true` to expenses in `handleCalculate()` (line 509)
- **Files Modified**:
  - `/src/app/calculator/home/VoiceFirstContentV2.tsx` - Added missing inflation flag
- **Testing**: Created debug test suite (`variant-debug.test.ts`) to verify identical baselines produce identical results
- **Key Insight**: When creating scenarios programmatically (like in `handleCalculate`), must match ALL fields from `createScenarioFromFormData`, not just the obvious ones. Small differences in baseline scenario lead to massive differences in 30-year projections.
- **Variant Metadata System**:
  - Variants saved with `__metadata.variant_type` field in Supabase JSONB
  - On load, metadata detected and variant regenerated from current baseline
  - This makes variants "live" - they update if you change baseline values
  - Located in `/src/lib/scenarios/variant-metadata.ts`
- **What-If Button Logic for Saved Variants**:
  - When variant metadata exists (purple badge displayed), ALL what-if buttons are disabled
  - Rationale: Prevents variant stacking (applying what-ifs to former what-ifs) which creates complex conflicts
  - Examples of conflicts: Front-Load has age-based changes at 61/71/81, but Retire Earlier changes retirement to 58
  - UI feedback: Badge shows "What-if scenarios not available for saved variants"
  - Implementation: `disabled={!!loadedVariantMetadata || variantScenario?.name === 'Front-Load the Fun'}`
  - When tabbed interface is active, buttons are disabled only if matching variant tab already exists
  - This allows multiple different variants open simultaneously (e.g., Front-Load + Delay CPP tabs)
- **Status**: ✅ Fixed and verified
- **Build Status**: ✅ Production build passes

**2025-10-28**: Voice Infrastructure Removal
- **Removed**: All voice/LLM/Layercode infrastructure (15+ files, 7 npm packages)
- **Refactored**: VoiceFirstContentV2.tsx to form-first UI with contextual help sidebar
- **Database**: Dropped conversation_states table and conversation_id column
- **UI Changes**: "Start Planning" button, field focus tracking, 17 help tips
- **Preserved**: All calculation, results, scenario comparison, auth functionality

**2025-10-27**: What-If Scenario Planning
- **Proposed**: 8 scenario variant buttons (retire early, spend more, front-load, max RRSP, windfall, increase contributions, optimize CPP/OAS, target reserve)
- **Status**: 🟡 Planning approved, implementation deferred
- **Rationale**: Addresses key user questions about retirement flexibility

**2025-10-28**: What-If Scenario Variants - Tabbed Comparison UI
- **Goal**: Allow users to explore scenario variants (e.g., "Front-Load the Fun") with comprehensive side-by-side comparison
- **Architecture Decisions**:
  - **NO parent-child relationships**: Variants are temporary explorations, not permanently linked to baseline
  - **NO age_based_changes in FormData**: These fields remain calculation-only, not user-editable
  - **Variants are ephemeral**: Created on-demand from baseline, not saved unless user explicitly chooses to save
  - **Save = new baseline**: When user saves a variant, it becomes a new independent scenario (not linked to original)
- **UI Implementation**:
  - **Tabbed Interface**: "Your Plan" (baseline) | "Front-Load the Fun" (variant)
  - **Single-column layout**: All 5 result components stacked vertically for better readability
  - **What-If buttons**: Moved to heading area (below "Your Retirement Projection"), always visible when results exist
  - **Button state management**: Active variants show "Active" badge and are disabled to prevent duplicate tabs
  - **Conditional display**: Baseline results hidden when variant active (shown in tab instead)
  - **Gradient save buttons**: Consistent styling across baseline and variant tabs (rose/orange/amber light, blue/indigo/purple dark)
  - **Centered buttons**: Save buttons centered in all views (baseline-only, baseline tab, variant tabs)
- **User Flow**:
  1. User completes calculation → sees baseline results + what-if buttons
  2. Clicks "Front-Load the Fun" → baseline replaced by tabbed interface
  3. Can switch between "Your Plan" and variant tabs to compare
  4. Each tab has "Save This Scenario" button (saves that specific scenario as new baseline)
  5. Close variant tab (X icon) → returns to baseline-only view
- **Components Modified**:
  - `ScenarioComparison.tsx`: Complete refactor to tabbed interface (420 lines)
  - `VoiceFirstContentV2.tsx`: What-if buttons moved to heading, conditional baseline display
- **Files**:
  - `/src/components/results/ScenarioComparison.tsx` - Tabbed comparison UI
  - `/src/components/scenarios/ScenarioModal.tsx` - Variant selection modal
  - `/src/lib/calculations/scenario-variants.ts` - Pure functions for creating variants
  - `/src/app/calculator/home/VoiceFirstContentV2.tsx` - Main UI integration
- **Known Limitation**: Age-based spending data (for variants like Front-Load) is lost during save/load cycle because it's not in FormData interface. Future fix: Add metadata or regenerate variants on load.
- **Status**: ✅ Implemented and deployed
- **Build Status**: ✅ Production build passes