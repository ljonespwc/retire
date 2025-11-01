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

- Next.js 14 with TypeScript (strict mode), Tailwind CSS, shadcn/ui
- Supabase database with RLS policies: users, scenarios, 7 tax data tables
- Tax data migrated to database (federal/provincial brackets, CPP/OAS, RRIF, TFSA)
- Query layer with 24-hour in-memory caching
- TypeScript type system for calculator, scenarios, database schema
- Vercel deployment configured

### Sprint 2: Calculation Engine (Core Business Logic) ✅ COMPLETED

- Vitest testing framework with comprehensive test coverage
- **Tax Calculator**: Federal/provincial tax for all 13 jurisdictions, income treatment by source, OAS clawback
- **Government Benefits**: CPP/OAS age adjustments (60-70), optimal start age calculators
- **Account Management**: RRIF minimums, tax-efficient withdrawal sequencing (Non-reg → RRSP → TFSA)
- **Main Engine**: Year-by-year projection with pre-retirement + retirement phases
- Architecture: Dependency injection, database-backed data, pure functions, type safety
- Production build verified and deployed

### Sprint 3: UI & Results Visualization ✅ COMPLETED

- Form-first calculator at `/calculator/home` with contextual help sidebar and dark mode
- Results visualization: Portfolio balance chart, income composition, tax summary, AI narrative
- Scenario management: Save/load scenarios, what-if variants (Front-Load, Delay CPP/OAS, etc.)
- Tabbed comparison UI for baseline vs variant analysis
- Anonymous auth with seamless upgrade flow
- Full end-to-end flow: form entry → calculation → results → comparison

## Recent Updates

**2025-10-30**: Enhanced AI Narratives with Token Optimization
- **Enhancement**: AI narratives expanded from 60-80 words to 150-250 words (2-3 paragraphs) with comprehensive data
  - Now includes: year-by-year snapshots (first 5 + every 5th + last 5 years), tax analysis (lifetime tax, efficiency score, OAS clawback), income strategy breakdowns (CPP/OAS/RRIF timing), user context
  - Markdown support with **bold** formatting for key numbers, embedded bullet lists
  - Prompt engineering for structured narrative flow (outcome → transitions → insights)
- **Optimization**: Narratives generated only for new baselines and saved variants (not temporary what-if variants)
  - Saves ~$432/year at scale (10K users × 3 variants/month)
  - Temporary variants still show comparison insights (cheap, useful)
- **Files Modified**:
  - `/src/lib/ai/narrative-generator.ts` - Complete data extraction refactor (422 lines)
  - `/src/components/results/RetirementNarrative.tsx` - Added markdown rendering
  - `/src/app/calculator/home/VoiceFirstContentV2.tsx` - Removed narrative generation for temp variants
- **Status**: ✅ Implemented and tested
- **Build Status**: ✅ Production build passes

**2025-10-30**: Save Once, Update Forever Pattern
- **Problem**: Scenarios could only be saved as new records, no way to update existing scenarios after making changes
- **Solution**: "Save once, update forever" pattern - after first save, button switches to UPDATE mode automatically
- **Implementation**:
  - `SaveScenarioModal`: Added `onSaveSuccess(scenarioId, scenarioName)` callback that fires after CREATE (not UPDATE)
  - `VoiceFirstContentV2`: Added `handleSaveSuccess` to capture and store scenario ID/name after first save
  - `VoiceFirstContentV2`: Added `variantScenarioIds[]` array to track IDs for each variant tab
  - `ScenarioComparison`: Pass `baselineScenarioId`, `baselineScenarioName`, `variantScenarioIds` to tabs
  - Both `BaselineTab` and `VariantTab`: Show "UPDATE THIS SCENARIO: [Name]" when ID exists, else "SAVE THIS SCENARIO: [Name]"
  - "Start Planning" button: Clears `scenarioId`, `loadedScenarioName`, `loadedVariantMetadata` for fresh scenarios
- **User Flow**:
  1. First save → Creates new scenario → Captures ID → Button becomes UPDATE
  2. Subsequent saves → Updates same scenario (no new records)
  3. "Start Planning" → Clears tracking → Next save creates new scenario
  4. Load different scenario → Replaces tracking
  5. Variant tabs → Same pattern (save once, update forever)
- **Benefits**:
  - Prevents scenario proliferation (100s of similar scenarios)
  - Clearer mental model: "Save once, then refine via updates"
  - Forces intentional new scenario creation via "Start Planning"
- **Files Modified**:
  - `/src/components/scenarios/SaveScenarioModal.tsx` - Added callback prop
  - `/src/app/calculator/home/VoiceFirstContentV2.tsx` - Added save success handlers, variant ID tracking, Start Planning clear
  - `/src/components/results/ScenarioComparison.tsx` - Added ID props, updated button text logic
- **Status**: ✅ Implemented and tested
- **Build Status**: ✅ Production build passes

**2025-10-29**: AI Architecture Simplification
- Moved AI generation to server-side (API routes) instead of complex client-side caching
- Simplified components by accepting narratives/insights as props
- Removed ~160 lines of cache management code

**2025-10-29**: Variant Metadata System
- Variants save metadata (`__metadata.variant_type`) to enable regeneration from baseline
- On load, variants are regenerated from current form values (makes them "live")
- age_based_changes handled via metadata regeneration, not direct persistence
- What-if buttons disabled when variant metadata exists to prevent variant stacking

**2025-11-01**: Enhanced Pension Income Treatment
- **Feature**: Added dedicated pension field with inflation indexing and bridge benefit support
- **Indexing**: Optional checkbox to grow pension with inflation (COL-A adjustments) throughout retirement
- **Bridge Benefits**: Temporary pension supplements that reduce by fixed amount (typically $16,374) at age 65
- **Implementation**: Separate from other income, with checkboxes for `indexed_to_inflation` and `has_bridge_benefit`
- **Database**: Stored in `scenarios.inputs.income_sources.pension` as structured object
- **Calculation**: Engine applies inflation compounding when indexed, reduces by bridge amount at specified age
- **Status**: ✅ Implemented and verified

