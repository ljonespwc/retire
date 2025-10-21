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
