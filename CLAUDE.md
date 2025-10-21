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
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
├── docs/                 # Documentation
└── .env.local.example    # Environment variable template
```

## Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Fill in your API keys and credentials:
   - **Layercode**: Pipeline ID and API keys from https://layercode.com
   - **OpenAI**: API key from https://platform.openai.com/api-keys
   - **Gemini**: API key from https://ai.google.dev/
   - **Supabase**: URL and keys from your Supabase project
3. Run `npm run dev` to start development

## Path Aliases

This project uses TypeScript path aliases:
- `@/*` maps to `./src/*`

Example: `import { MyComponent } from '@/components/MyComponent'`

## Development Sprints

### Sprint 1: Foundation & Infrastructure Setup

**Goal**: Establish project foundation with proper configuration, database setup, and comprehensive type definitions.

#### Task 1.1: Project Initialization & Configuration

**Objective**: Set up Next.js 14 project with TypeScript, Tailwind, and essential configurations.

**Key Requirements**:
- TypeScript strict mode enabled
- Tailwind CSS configured with custom theme (PRD design system):
  - Primary: #1E3A8A (deep blue)
  - Secondary: #14B8A6 (warm teal)
  - Accent: #F59E0B (amber)
  - Success: #10B981, Warning: #F97316, Error: #EF4444
- ESLint and Prettier configured
- Folder structure:
  - `/app` - Next.js 14 app directory
  - `/components` - UI components
  - `/lib` - Utilities, types, helpers
  - `/services` - API integrations
  - `/hooks` - Custom React hooks
  - `/types` - TypeScript definitions
- shadcn/ui CLI configured
- Install dependencies: zod (validation), clsx (classnames), date-fns
- Create `.env.local.example` with placeholder environment variables

**Acceptance Criteria**:
- ✅ Project builds successfully with `npm run build`
- ✅ Development server runs on `npm run dev`
- ✅ Tailwind classes work with custom colors
- ✅ TypeScript strict mode enabled, no errors
- ✅ Folder structure matches specification

---

#### Task 1.2: Supabase Configuration & Database Schema

**Objective**: Set up Supabase project and create database schema for users and scenarios.

**Key Requirements**:
- Install `@supabase/supabase-js` and `@supabase/auth-helpers-nextjs`
- Create `/lib/supabase/` folder with:
  - `client.ts` (browser client)
  - `server.ts` (server-side client)
  - `middleware.ts` (auth middleware)
- Database migration file (`supabase/migrations/001_initial_schema.sql`):
  - `users` table (id, email, tier, created_at, preferences JSONB)
  - `scenarios` table (id, user_id, name, inputs JSONB, results JSONB, created_at, updated_at)
  - RLS policies for user-owned data
  - Indexes on user_id and created_at
- Create TypeScript types in `/types/database.ts` matching schema
- Environment variables in `.env.local.example`:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
- Utility functions in `/lib/supabase/queries.ts`:
  - saveScenario()
  - getScenarios()
  - updateScenario()
  - deleteScenario()

**Acceptance Criteria**:
- ✅ Supabase client initializes without errors
- ✅ Database schema created with proper types
- ✅ RLS policies protect user data
- ✅ Query functions have proper TypeScript types
- ✅ Can create and retrieve test data

---

#### Task 1.3: Type Definitions & Data Models

**Objective**: Create comprehensive TypeScript types for all calculator inputs, outputs, and intermediate data structures.

**Key Requirements**:

**1. `/types/calculator.ts` - Core calculation types**:
- BasicInputs (current_age, retirement_age, longevity_age, province)
- Assets (rrsp, tfsa, non_registered with nested details)
- IncomeSources (employment, cpp, oas, other_income)
- Expenses (fixed_monthly, variable_annual, indexed_to_inflation, age_based_changes)
- Assumptions (pre_retirement_return, post_retirement_return, inflation_rate, etc.)
- YearByYearResult (age, balances, withdrawals, income, tax, etc.)
- CalculationResults (summary, year_by_year, charts)
- Scenario (complete scenario type combining all above)

**2. `/types/voice.ts` - Voice interaction types**:
- VoiceIntent (type, confidence, extracted_data)
- ConversationState (current_step, collected_data, pending_clarifications)
- VoiceResponse (text, audio_url, should_wait_for_response)

**3. `/types/constants.ts` - Canadian financial constants**:
- PROVINCES (enum with all 13)
- FEDERAL_TAX_BRACKETS_2025
- PROVINCIAL_TAX_BRACKETS (by province)
- CPP_AMOUNTS (max, average, 2025 values)
- OAS_AMOUNTS (max, 2025 values)
- RRIF_MINIMUM_PERCENTAGES (by age)

**4. Additional Requirements**:
- Add comprehensive JSDoc comments for all types
- Export all types from `/types/index.ts` barrel file

**Acceptance Criteria**:
- ✅ All types compile without errors
- ✅ Types match PRD specifications exactly
- ✅ Canadian tax constants accurate for 2025
- ✅ JSDoc comments provide clear documentation
- ✅ Barrel export works for easy imports
