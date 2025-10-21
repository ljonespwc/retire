# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A voice-driven Canadian retirement income calculator that combines conversational AI with sophisticated financial modeling. The platform helps Canadians understand their retirement income potential through natural language interaction, eliminating complex spreadsheets and financial jargon.

### Core Functionality
- **Voice-First Interface**: Real-time speech-to-text and text-to-speech powered by Layercode WebRTC SDK
- **Canadian Tax Engine**: Accurate projections based on federal/provincial tax rules, CPP/OAS benefits, and registered account regulations (RRSP/RRIF/TFSA)
- **Scenario Modeling**: Compare different retirement ages, spending levels, and investment strategies
- **Visual Projections**: Interactive charts showing portfolio balance, income composition, and tax impact over retirement timeline

### Product Tiers
1. **Basic (Free)**: Voice/text input, single scenario, basic simulation with simple visualizations
2. **Pro ($9-19/mo)**: Multi-scenario comparison (up to 3), detailed tax breakdown, joint/spouse planning, PDF reports
3. **Advanced ($99-499/mo)**: Unlimited scenarios, Monte Carlo simulation, advisor dashboard, white-label branding, API access

### Target Users
- Primary: Pre-retirees aged 45-70 with $100K-$10M+ in assets
- Secondary: Financial advisors and wealth managers
- Tertiary: Financial institutions (API integration)

## Supabase Configuration

**Project ID**: `xrtlrsovgqgivpbumany`
Always use this project_id when interacting with Supabase MCP tools.

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

### Voice & AI
- **Layercode WebRTC SDK** (@layercode/react-sdk, @layercode/node-server-sdk) - Real-time voice streaming
- **OpenAI** (GPT-4 via @ai-sdk/openai)
- **Google Gemini** (@ai-sdk/google, @google/generative-ai)
- **Vercel AI SDK** (ai package) - AI provider abstraction

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
- **Layercode**: Pipeline ID and API keys from https://layercode.com
- **OpenAI**: API key from https://platform.openai.com/api-keys
- **Gemini**: API key from https://ai.google.dev/
- **Supabase**: URL and keys from your Supabase project

Run `npm run dev` to start development.

## Path Aliases

This project uses TypeScript path aliases:
- `@/*` maps to `./src/*`

Example: `import { MyComponent } from '@/components/MyComponent'`

## Development Progress

### Sprint 1: Foundation & Infrastructure Setup ✅ COMPLETED

**Accomplished**:

**1. Project Configuration**
- Next.js 14 with TypeScript (strict mode) and App Router
- Tailwind CSS with custom PRD design system (primary, secondary, accent colors)
- shadcn/ui CLI configured with components infrastructure
- Dependencies: zod, date-fns, @supabase/ssr, clsx, tailwind-merge
- Folder structure: app/, components/, lib/, services/, hooks/, types/

**2. Supabase Database Schema**
- **Core Tables**: users, scenarios with RLS policies and indexes
- **Tax Data Tables** (7 tables): tax_years, federal_tax_brackets, provincial_tax_brackets, government_benefits, rrif_minimums, tfsa_limits, tax_credits
- **2025 Canadian Tax Data**: Seeded 5 federal brackets, 57 provincial brackets (13 jurisdictions), CPP/OAS benefits, RRIF rules, TFSA limits
- **Query Layer**: `src/lib/supabase/tax-data.ts` with 15+ functions and 24-hour in-memory caching
- **Supabase Clients**: Browser (`client.ts`), server (`server.ts`), middleware (`middleware.ts`) using @supabase/ssr

**3. TypeScript Type System**
- **Calculator Types** (`src/types/calculator.ts`): 400+ lines covering BasicInputs, Assets, IncomeSources, Expenses, Assumptions, YearByYearResult, CalculationResults, Scenario
- **Voice Types** (`src/types/voice.ts`): VoiceIntent, ConversationState, VoiceResponse, VoiceSession
- **Constants** (`src/types/constants.ts`): Province enum, TaxBracket interface (data moved to database)
- **Database Types** (`src/types/database.ts`): Complete schema types for all 9 tables
- **Barrel Export**: `src/types/index.ts` for clean imports

**4. Database Optimizations**
- Fixed RLS policies for optimal performance (using `SELECT` subqueries)
- Secured functions with fixed `search_path`
- Public read-only access to tax data tables

**5. Deployment**
- Vercel deployment configured and working
- Build succeeds with zero TypeScript errors
- `.npmrc` configured with `legacy-peer-deps` for dependency resolution

**Key Achievement**: Migrated Canadian tax data from hardcoded constants to database-backed system, enabling multi-year support and dynamic updates without code deployment.

### Sprint 2: Calculation Engine (Core Business Logic) ✅ COMPLETED

**Accomplished**:

**0. Pre-Sprint 2 Setup**
- Installed Vitest with Next.js/React compatibility (`vitest.config.ts`)
- Created testing infrastructure (test-setup.ts, test-utils.ts, test-fixtures.ts)
- Added provincial tax credits to database (migrations 004 and 005)
- Seeded 2025 provincial basic personal amounts for all 13 provinces/territories
- Updated tax-data.ts with provincial credit query functions
- Created test helpers with comprehensive patterns and documentation

**1. Tax Calculation Engine** (`src/lib/calculations/tax-calculator.ts` - 433 lines)
- **31 tests passing** - 100% coverage of tax scenarios
- Progressive tax calculation (pure function)
- Federal tax with basic personal amount ($15,705) and age amount (income-tested)
- Provincial tax for all 13 provinces/territories with province-specific credits
- Income treatment by source (RRSP 100%, capital gains 50%, dividends 138% gross-up, TFSA 0%)
- OAS clawback calculation (15% above $86,912 threshold)
- Master tax function with detailed breakdown (federal + provincial + OAS clawback)
- All functions accept Supabase client as first parameter (dependency injection pattern)

**2. Government Benefits Calculator** (`src/lib/calculations/government-benefits.ts` - 344 lines)
- **38 tests passing** - Full coverage of CPP/OAS scenarios
- CPP adjustment factors by age (60-70): 64% at 60, 100% at 65, 142% at 70
- OAS deferral bonuses (65-70): 100% at 65, 136% at 70
- CPP and OAS calculations with database-backed amounts
- Earnings-based CPP estimation
- Optimal start age calculators (lifetime benefit maximization)
- Integrated with government_benefits table for accurate 2025 amounts

**3. Account Management Functions** (`src/lib/calculations/accounts.ts` - 438 lines)
- **36 tests passing** - Comprehensive account projection coverage
- RRIF minimum withdrawal calculations (age-based percentages from database)
- Tax-efficient withdrawal sequencing:
  1. Non-registered first (capital gains advantage)
  2. RRSP/RRIF second (preserve TFSA)
  3. TFSA last (preserve tax-free growth)
- Account growth projections (single-year and multi-year)
- RRSP to RRIF conversion at age 71
- Integration with rrif_minimums table

**4. Main Calculation Engine** (`src/lib/calculations/engine.ts` - 401 lines)
- **21 tests passing** - End-to-end simulation coverage
- Master orchestration function: `calculateRetirementProjection()`
  - Phase 1: Pre-retirement accumulation (contributions + growth)
  - Phase 2: Retirement drawdown (withdrawals + taxes + benefits + growth)
  - Year-by-year simulation from current age to longevity
  - Integrates all calculation modules (tax, benefits, accounts)
  - Returns complete CalculationResults with year-by-year breakdown
- Scenario comparison function for what-if analysis
- Portfolio depletion detection and success metrics
- Summary statistics (final portfolio value, total taxes paid, total benefits received)

**Test Results**: **126 tests passing** (31 tax + 38 benefits + 36 accounts + 21 engine)

**Key Architectural Decisions**:
1. **Dependency Injection**: All functions accept Supabase client - enables testing with mocks
2. **Database-Backed Data**: Tax data in Supabase, not hardcoded - enables multi-year support
3. **Pure Functions**: Calculation logic separated from data retrieval - easier to test
4. **Type Safety**: Strict TypeScript with auto-generated database types

**Files Created**: 17 files (4 calculation engines, 4 test files, 4 test infrastructure files, 2 migrations, 3 config files)

**Files Updated**: 4 files (tax-data.ts, database.ts, package.json, .npmrc)

**Post-Sprint Type Fixes** (Production Build):
- Fixed optional asset field handling in engine.ts (rrsp, tfsa, non_registered)
- Aligned CalculationResults interface with implementation (flat structure vs nested)
- Fixed AgeBasedExpenseChange property names (age vs start_age, monthly_amount vs new_monthly_amount)
- Production build and Vercel deployment successful

**Achievement**: Complete, tested calculation engine ready for UI integration. All Canadian retirement income calculations (federal/provincial taxes, CPP/OAS, RRSP/RRIF/TFSA) implemented with 100% test coverage and successfully deployed to production.
