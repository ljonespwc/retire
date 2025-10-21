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
