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

## ⚠️ CRITICAL: Hands-Off Components

**DO NOT modify the following critical components without explicit permission:**

- **Calculation Engine** (`/src/lib/calculations/*`) - Core financial projection logic, tax calculations, government benefits
- **Tax Data Queries** (`/src/lib/supabase/tax-data.ts`) - Database queries for Canadian tax rules
- **Database Schema** (`/supabase/migrations/*`) - Production database structure
- **API Routes** (`/src/app/api/*`) - Server-side calculation endpoints

These components are heavily tested, financially critical, and changes could introduce calculation errors affecting real retirement planning decisions.

**Always ask for permission before modifying:**
- Calculation formulas or logic
- Tax bracket handling
- CPP/OAS benefit calculations
- RRIF withdrawal sequencing
- Database migrations

**UI/UX changes are generally safe** - components, styling, forms, labels, tooltips, dark mode, etc.

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

# Test Scripts (in src/scripts/)
npx tsx src/scripts/validate-ai-insights.ts  # AI validation CLI (4 modes)
npx tsx src/scripts/test-gross-up.ts         # Validate withdrawal gross-up calculations
```

## Scenario Testing & Validation

Use these scripts to test baseline scenarios and their what-if variants.

### Quick Workflow

**Step 1: Generate data report** (see all numbers, AI content, comparisons)
```bash
npx tsx src/scripts/generate-what-if-report.ts <baseline-id>
```

**Step 2: Validate AI outputs** (PASS/FAIL checks)
```bash
npx tsx src/scripts/validate-ai-outputs.ts <baseline-id>
```

**To list available baselines**, run either script without arguments:
```bash
npx tsx src/scripts/generate-what-if-report.ts
```

**To have Claude analyze the results:**
> "Analyze the report in `<filename>-report.txt` - check if the numbers, comparisons, and AI content all line up logically."

### Output Files
- `generate-what-if-report.ts` → `<baseline-name>-report.txt` (comprehensive data)
- `validate-ai-outputs.ts` → `ai-validation-report.txt` (PASS/FAIL results)

### Important Data Structure Notes

These gotchas apply when working with year_by_year calculation results:

1. **RRSP/RRIF Withdrawals**
   - Field is `withdrawals.rrsp_rrif` (NOT `withdrawals.rrsp`)
   - This is when withdrawals BEGIN, which differs from RRIF conversion age (71)
   - The portfolio chart shows conversion at 71, but withdrawals can start earlier

2. **OAS Clawback**
   - `tax.oas_clawback` field does NOT exist in stored year_by_year data
   - Clawback IS included in `tax.total` but not broken out separately
   - To count clawback years, calculate on-the-fly: `oas > 0 && income > 86912`
   - This matches logic in `src/lib/ai/narrative-generator.ts`

3. **Baseline vs Variant Detection**
   - Use `inputs.__metadata.created_from_baseline_id` foreign key
   - Baselines: scenarios WITHOUT `created_from_baseline_id`
   - Variants: scenarios WITH `created_from_baseline_id`
   - DO NOT use name matching - it's unreliable!

4. **Income vs Withdrawals**
   - `income.total` = all taxable income (CPP, OAS, pension, employment, investment)
   - `withdrawals.total` = money pulled from investment accounts
   - Investment withdrawals appear as `income.investment`

## Repository Structure

```
retire/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Homepage
│   │   ├── calculator/   # Calculator UI
│   │   ├── api/          # API routes
│   │   └── globals.css   # Global styles with Tailwind
│   ├── components/       # React components
│   ├── lib/              # Business logic utilities
│   │   ├── calculations/ # Core calculation engine
│   │   ├── supabase/     # Supabase client and queries
│   │   └── ai/           # AI narrative generation
│   ├── scripts/          # CLI tools and test scripts
│   │   ├── validate-ai-insights.ts  # AI validation CLI
│   │   └── test-gross-up.ts         # Withdrawal calculation tests
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
├── docs/                 # All documentation
│   ├── PROGRESS.md       # Development progress tracker
│   ├── WITHDRAWAL_STRATEGY.md
│   ├── PENSION_TEST_REPORT.md
│   ├── MINDSET.md
│   └── *_PRD.md          # Product requirement docs
├── public/               # Static assets
├── CLAUDE.md             # Claude Code instructions (this file)
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

See `docs/PROGRESS.md` for detailed development history and upcoming work.

