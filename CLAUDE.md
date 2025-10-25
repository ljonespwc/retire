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

## ⚠️ CRITICAL: Voice & LLM Architecture

**DO NOT modify any of the following without explicit user permission:**

### Layercode Voice Infrastructure
- Layercode WebRTC streaming setup
- Text-to-speech streaming (`stream.ttsTextStream()`)
- LLM response streaming (`generateStream()`)
- Webhook SSE (Server-Sent Events) flow
- Voice conversation state management
- AI provider configuration (OpenAI/Gemini)

### Batch Conversation System
- Batch prompt structure and question grouping (5 batches: personal_info, savings, savings_contributions, retirement_income, investment_assumptions)
- LLM parsing logic in `batch-parser.ts` (optimized prompts, confidence thresholds, field extraction)
- Retry logic and missing field re-prompting
- State management in `batch-flow-manager.ts`
- Natural language transitions between batches

**The current architecture is optimized and tested.** Any changes to streaming, latency optimization, conversation flow, batch parsing, or LLM prompts **must be approved by the user first**.

If you identify potential improvements, **propose them and wait for approval** before implementing.

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
- `src/types/voice.ts`: VoiceIntent, ConversationState, VoiceResponse, VoiceSession
- `src/types/constants.ts`: Province enum, TaxBracket interface
- `src/types/database.ts`: Schema types for all 9 tables
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

### Sprint 3: Voice Interface & Data Collection ⏳ IN PROGRESS

**Goal**: Voice-first data collection with LLM-based parsing, 3 UX prototypes, production voice/form hybrid UI.

#### ✅ Section 1: Layercode Voice Foundation

**Files Created**:
- `/src/lib/ai-provider.ts` (159 lines) - Switchable OpenAI/Gemini
- `/src/app/api/layercode/authorize/route.ts` (70 lines) - Session authorization
- `/src/app/api/layercode/webhook/route.ts` (270 lines) - SSE webhook handler
- `/src/hooks/useLayercodeVoice.ts` (95 lines) - React voice hook
- `/src/app/test-voice/page.tsx` (32 lines) - Test wrapper (SSR disabled)
- `/src/app/test-voice/TestVoiceContent.tsx` (280+ lines) - Test UI
- `.env.example` (31 lines)

**Features**:
- WebRTC voice via Layercode SDK
- Automatic STT/TTS (Layercode cloud)
- Voice activity detection (VAD) - hands-free
- Connection state management, audio visualization
- Test page at `/test-voice`

**AI Configuration**:
- OpenAI: GPT-4.1-mini (`gpt-4-1106-preview`)
- Gemini: Flash Lite (`gemini-2.5-flash-lite`) - faster
- Switchable via `AI_PROVIDER` env var, temp 0.7

**Architecture**: User speaks → WebRTC → Cloud STT → Webhook → AI → STREAMING `stream.ttsTextStream()` → Cloud TTS → User hears (~300ms)

**Latency Optimization**:
- Before: `generateCompletion()` → 1-2s wait → speak (2-3s total)
- After: Vercel AI `streamText()` → stream tokens → speak as generated (~300ms, 5-10x faster)
- Implementation: Added `generateStream()` to ai-provider.ts, all webhooks use `stream.ttsTextStream()`

**Deployment**: https://retire-9iek00jw3-lances-projects-6d1c03d4.vercel.app/test-voice

---

#### ✅ Section 2: Conversation Intelligence

**Architecture**: LLM-based data extraction (replaced regex) for natural language understanding.

**Files Created**:
- `/src/lib/conversation/llm-parser.ts` (200+ lines) - LLM extraction
- `/src/lib/conversation/question-flow-manager.ts` (380+ lines) - State machine
- ~~`/src/lib/conversation/number-parser.ts`~~ (deprecated)

**LLM Parser Functions** (async):
1. `extractAge(text)` - "I'm 58", "mid-fifties" → number (18-120) or null
2. `extractAmount(text)` - "$500k", "half a million" → number or null
3. `extractProvince(text)` - "Ontario", "BC" → Province code or null
4. `extractPercentage(text)` - "5%", "five percent" → number (0-100) or null
5. `extractYesNo(text)` - "yeah", "nope" → true/false/null
6. `detectSkipIntent(text)` - "skip", "I don't know" → boolean

**Question Flow**:
- 17 questions total across 5 batches
- Conditional branching (only asks for account amounts if user has account)
- In-memory state (Map-based)
- Progress tracking, validation (age ranges, amount limits)

**5 Batches**:
1. Personal Info (5Q): current_age, retirement_age, longevity_age, province, current_income
2. Current Savings (3Q): rrsp_amount, tfsa_amount, non_registered_amount
3. Savings Contributions (3Q): rrsp_contribution, tfsa_contribution, non_registered_contribution
4. Retirement Income (4Q): monthly_spending, pension_income, other_income, cpp_start_age
5. Rate Assumptions (3Q): investment_return, post_retirement_return, inflation_rate

**Webhook Integration**:
- `session.start`: Initialize → ask first batch
- `message`: Parse → validate → next batch or clarify
- `session.end`: Clean up state
- Progress via `stream.data()`, completion sends `collectedData`

**Performance Optimizations**:
- Opt 1: Eliminated wasted LLM calls → 44% faster (41s → 23s), 33% fewer calls (24 → 16)
- Opt 2: Combined parse + response (`parseAndGenerateResponse()`) → 66% faster (41s → 13.8s), 50% fewer calls (16 → 8), ~1.7s avg latency
- Batch mode: User answers all questions in batch → AI parses all at once → 3 turns vs 8 (62% reduction)

**Database Persistence** (Oct 23):
- `conversation_states` table (ephemeral, 24h TTL) - crash recovery
- `scenarios` table (permanent) - saved plans with `source='voice'`
- Auto-save on completion
- Migrations: 006 (user_id), 007 (expiry), 008 (source tracking)
- `voice-to-scenario-mapper.ts` - Transforms 17 flat fields to nested calculator format
- `cleanup-conversations.ts` + `/api/cleanup-conversations` - Scheduled cleanup
- Smart defaults (CPP/OAS from 2025 max, cost_base 70%)

**Bug Fixes**:
1. Data message unwrapping (Layercode wrapper structure)
2. Conditional logic placement (`followUp` on yes/no questions)
3. Already-collected fields re-asked (prompt fix)
4. Final batch completion with retry limit
5. "Use defaults" intent recognition

---

#### ⏳ REMAINING: Sprint 3 Sections

**Sections 3-5: UX Prototypes (3 days)**
- Form-First (`/app/calculator/test-form-first`) - Traditional form + floating voice button
- Voice-First (`/app/calculator/test-voice-first`) - Two-panel: Conversation | Live form preview
- Wizard (`/app/calculator/test-wizard`) - Multi-step with voice OR form per step

**Section 6: Production Components (2 days)**
- Voice: `VoiceButton`, `VoiceVisualizer`, `ConversationDisplay`, `VoiceStatus`
- Form: `CurrencyInput`, `AgeInput`, `PercentageInput`, `ProvinceSelect`, `ScenarioSummary`
- Hybrid: `VoiceOrFormField`, `InputMethodToggle`, `FieldValidation`

**Section 7: Production Implementation (1 day)**
- User testing → choose best UX
- `/app/calculator/page.tsx` with chosen approach
- Connect to Sprint 2 calculation engine
- Results visualization with charts

**Test URL**: https://retire-9iek00jw3-lances-projects-6d1c03d4.vercel.app/test-voice

**Key Files**:
- `/src/lib/ai-provider.ts` - AI abstraction (OpenAI/Gemini)
- `/src/lib/conversation/llm-parser.ts` - LLM extraction
- `/src/lib/conversation/question-flow-manager.ts` - State machine (sequential)
- `/src/lib/conversation/batch-flow-manager.ts` - State machine (batch)
- `/src/lib/conversation/batch-parser.ts` - Batch parsing
- `/src/lib/conversation/voice-to-scenario-mapper.ts` - Voice → calculator format
- `/src/hooks/useLayercodeVoice.ts` - React voice hook
- `/src/app/api/layercode/authorize/route.ts` - Session auth
- `/src/app/api/layercode/webhook/route.ts` - Sequential webhook
- `/src/app/api/layercode/batch-webhook/route.ts` - Batch webhook
- `/src/app/test-voice/TestVoiceContent.tsx` - Sequential UI
- `/src/app/calculator/test-voice-first/VoiceFirstContent.tsx` - Batch UI

---

## Recent Updates

**2025-10-24**: Voice-First UI Polish
- V2 (Warm & Approachable) is production UI at `/calculator/test-voice-first`
- Responsive design (mobile/tablet/desktop), 1-second glow animation on field updates
- Form labels: "Expected Monthly Spending", "Life Expectancy Age", "(Annual)" suffixes

**2025-10-25**: Batch Conversation Optimization
- 30-40% latency reduction (avg 1.35s per turn), 50% token reduction (800-1,000 tokens)
- Fixed: transition message mentions, retry counter off-by-one, province parsing
- 12 comprehensive tests for batch parsing (all passing)

**2025-10-25**: Anonymous-First Authentication
- Supabase anonymous auth with seamless upgrade flow
- Auto-creates anonymous sessions on page load (`getOrCreateAnonUser()`)
- SavePromptModal appears after calculation completion (anonymous users only)
- User ID flows through Layercode metadata → webhook → database
- RLS policies: `scenarios` and `users` tables use `auth.uid()`, `conversation_states` permissive (server-side access)
- Files: `src/lib/supabase/auth.ts`, `src/contexts/AuthContext.tsx`, `src/components/auth/SavePromptModal.tsx`
- **User action required**: Enable anonymous auth in Supabase dashboard before testing
