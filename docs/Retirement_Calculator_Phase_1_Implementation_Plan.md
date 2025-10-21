# Phase 1: MVP Implementation Plan
## Voice-Driven Canadian Retirement Calculator - Basic Tier

**Stack**: Next.js 14, React, TypeScript, Tailwind CSS, Supabase, Vercel, Layercode Voice API

**Goal**: Launch a functional Basic tier product with voice-first interaction, accurate Canadian retirement calculations, and beautiful visualizations.

---

## Overview of Phase 1 Sprints

```
Sprint 1: Foundation & Infrastructure Setup
Sprint 2: Calculation Engine (Core Business Logic)
Sprint 3: Voice Integration & Conversation Flow
Sprint 4: UI Components & Data Visualization
Sprint 5: Integration, Testing & Deployment
```

---

# SPRINT 1: Foundation & Infrastructure Setup

## Task 1.1: Project Initialization & Configuration

**Objective**: Set up Next.js 14 project with TypeScript, Tailwind, and essential configurations.

**Claude Code Prompt**:
```
Create a new Next.js 14 project called "retirement-calculator" with the following specifications:
- Use TypeScript (strict mode)
- Configure Tailwind CSS with custom theme matching the PRD design system:
  - Primary: #1E3A8A (deep blue)
  - Secondary: #14B8A6 (warm teal)
  - Accent: #F59E0B (amber)
  - Success: #10B981, Warning: #F97316, Error: #EF4444
- Set up ESLint and Prettier
- Configure next.config.js for optimal performance
- Create basic folder structure:
  - /app (Next.js 14 app directory)
  - /components (UI components)
  - /lib (utilities, types, helpers)
  - /services (API integrations)
  - /hooks (custom React hooks)
  - /types (TypeScript definitions)
- Add shadcn/ui CLI and configure
- Install and configure: zod (validation), clsx (classnames), date-fns
- Create .env.local.example with placeholder environment variables
```

**Acceptance Criteria**:
- ✅ Project builds successfully with `npm run build`
- ✅ Development server runs on `npm run dev`
- ✅ Tailwind classes work with custom colors
- ✅ TypeScript strict mode enabled, no errors
- ✅ Folder structure matches specification

---

## Task 1.2: Supabase Configuration & Database Schema

**Objective**: Set up Supabase project and create database schema for users and scenarios.

**Claude Code Prompt**:
```
Set up Supabase integration for the retirement calculator:

1. Install @supabase/supabase-js and @supabase/auth-helpers-nextjs
2. Create /lib/supabase/ folder with:
   - client.ts (browser client)
   - server.ts (server-side client)
   - middleware.ts (auth middleware)

3. Create database migration file (supabase/migrations/001_initial_schema.sql):
   - users table (id, email, tier, created_at, preferences JSONB)
   - scenarios table (id, user_id, name, inputs JSONB, results JSONB, created_at, updated_at)
   - Add RLS policies for user-owned data
   - Create indexes on user_id and created_at

4. Create TypeScript types in /types/database.ts matching the schema
5. Add environment variable setup in .env.local.example:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

6. Create a utility function /lib/supabase/queries.ts with:
   - saveScenario()
   - getScenarios()
   - updateScenario()
   - deleteScenario()
```

**Acceptance Criteria**:
- ✅ Supabase client initializes without errors
- ✅ Database schema created with proper types
- ✅ RLS policies protect user data
- ✅ Query functions have proper TypeScript types
- ✅ Can create and retrieve test data

---

## Task 1.3: Type Definitions & Data Models

**Objective**: Create comprehensive TypeScript types for all calculator inputs, outputs, and intermediate data structures.

**Claude Code Prompt**:
```
Create comprehensive TypeScript type definitions in /types/ matching the PRD specifications:

1. /types/calculator.ts - Core calculation types:
   - BasicInputs (current_age, retirement_age, longevity_age, province)
   - Assets (rrsp, tfsa, non_registered with nested details)
   - IncomeSources (employment, cpp, oas, other_income)
   - Expenses (fixed_monthly, variable_annual, indexed_to_inflation, age_based_changes)
   - Assumptions (pre_retirement_return, post_retirement_return, inflation_rate, etc.)
   - YearByYearResult (age, balances, withdrawals, income, tax, etc.)
   - CalculationResults (summary, year_by_year, charts)
   - Scenario (complete scenario type combining all above)

2. /types/voice.ts - Voice interaction types:
   - VoiceIntent (type, confidence, extracted_data)
   - ConversationState (current_step, collected_data, pending_clarifications)
   - VoiceResponse (text, audio_url, should_wait_for_response)

3. /types/constants.ts - Canadian financial constants:
   - PROVINCES (enum with all 13)
   - FEDERAL_TAX_BRACKETS_2025
   - PROVINCIAL_TAX_BRACKETS (by province)
   - CPP_AMOUNTS (max, average, 2025 values)
   - OAS_AMOUNTS (max, 2025 values)
   - RRIF_MINIMUM_PERCENTAGES (by age)

4. Add comprehensive JSDoc comments for all types
5. Export all types from /types/index.ts barrel file
```

**Acceptance Criteria**:
- ✅ All types compile without errors
- ✅ Types match PRD specifications exactly
- ✅ Canadian tax constants accurate for 2025
- ✅ JSDoc comments provide clear documentation
- ✅ Barrel export works for easy imports

---

# SPRINT 2: Calculation Engine (Core Business Logic)

## Task 2.1: Tax Calculation Engine

**Objective**: Implement accurate Canadian federal and provincial tax calculations.

**Claude Code Prompt**:
```
Create a comprehensive tax calculation engine in /lib/calculations/tax-calculator.ts:

1. Implement progressive tax calculation function:
   - calculateProgressiveTax(income, brackets) - handles any bracket structure
   
2. Implement federal tax calculation:
   - calculateFederalTax(taxableIncome, age) 
   - Apply 2025 federal brackets from types/constants
   - Include basic personal amount ($15,705)
   - Include age amount credit (age 65+: $8,790)
   
3. Implement provincial tax calculation:
   - calculateProvincialTax(taxableIncome, province, age)
   - Support all 13 provinces/territories with accurate 2025 brackets
   - Include provincial basic personal amounts by province
   
4. Implement account-specific tax treatment:
   - calculateTaxableIncome(incomeSources)
   - RRSP/RRIF: 100% taxable
   - Non-registered: 50% inclusion for capital gains
   - TFSA: 0% taxable
   - Canadian dividends: dividend tax credit calculation
   
5. Implement OAS clawback:
   - calculateOASClawback(grossIncome, oasAmount)
   - Threshold: $86,912
   - Clawback rate: 15%
   
6. Main function:
   - calculateTotalTax(scenario) - returns detailed tax breakdown

Include comprehensive unit tests using Vitest for all tax scenarios.
Export all functions with full TypeScript types.
```

**Acceptance Criteria**:
- ✅ Tax calculations match CRA tables exactly
- ✅ All 13 provinces calculate correctly
- ✅ OAS clawback accurate
- ✅ Unit tests pass with 100% coverage
- ✅ Edge cases handled (negative income, age boundaries)

---

## Task 2.2: CPP & OAS Calculation Functions

**Objective**: Implement CPP and OAS benefit calculations with adjustment factors.

**Claude Code Prompt**:
```
Create CPP and OAS calculation functions in /lib/calculations/government-benefits.ts:

1. CPP Calculation:
   - calculateCPP(currentAge, startAge, baseAmount)
   - Adjustment factors:
     * Age 60: 0.64 (-36%)
     * Age 65: 1.00 (baseline)
     * Age 70: 1.42 (+42%)
     * Interpolate for ages in between (0.6% per month)
   - Handle edge cases (start age < 60 returns 0)
   - Maximum CPP 2025: $16,375/year
   - Average CPP 2025: $9,100/year
   
2. OAS Calculation:
   - calculateOAS(currentAge, startAge, baseAmount, eligibilityPercentage)
   - Cannot start before age 65
   - Adjustment factors:
     * Age 65: 1.00 (baseline)
     * Age 70: 1.36 (+36%)
     * 0.6% per month for ages 65-70
   - Maximum OAS 2025: $8,560/year
   - Prorate for partial residence eligibility
   
3. Helper functions:
   - estimateCPPFromIncome(income, yearsOfContribution) - estimates CPP if user doesn't know
   - calculateOptimalCPPStart(scenario) - suggests best start age
   - calculateOptimalOASStart(scenario) - suggests best start age
   
4. Include unit tests for:
   - All adjustment factor calculations
   - Edge cases (age boundaries)
   - Optimization suggestions

Export all functions with TypeScript types and JSDoc comments.
```

**Acceptance Criteria**:
- ✅ CPP calculations match official CRA tables
- ✅ OAS calculations accurate including deferral bonuses
- ✅ Optimization suggestions are reasonable
- ✅ Unit tests pass for all scenarios
- ✅ Types are properly defined

---

## Task 2.3: RRIF Withdrawal & Account Management

**Objective**: Implement RRIF minimum withdrawal calculations and account balance tracking.

**Claude Code Prompt**:
```
Create RRIF and account management functions in /lib/calculations/accounts.ts:

1. RRIF Minimum Calculation:
   - getRRIFMinimumPercentage(age) - returns exact CRA percentage by age
   - Store RRIF table from PRD as constant (ages 71-95+)
   - calculateRRIFMinimum(balance, age) - calculates minimum required withdrawal
   
2. Withdrawal Sequencing (Tax-Optimized):
   - optimizeWithdrawalSequence(amountNeeded, accounts, age, taxStrategy)
   - Strategy for ages 60-64: Drain non-registered first, minimal RRSP
   - Strategy for ages 65-70: Balanced approach, start strategic RRSP
   - Strategy for ages 71+: RRIF minimums mandatory, supplement with TFSA
   - Return object: { rrsp: amount, tfsa: amount, non_registered: amount }
   
3. Account Balance Projection:
   - projectAccountGrowth(startingBalance, returnRate, years)
   - updateAccountBalances(currentBalances, withdrawals, returnRate)
   - Apply growth after withdrawals
   
4. Pre-Retirement Growth:
   - projectToRetirement(currentAssets, currentAge, retirementAge, returnRate, contributions)
   - Calculate compound growth with annual contributions
   
5. Helper functions:
   - convertRRSPtoRRIF(rrspBalance, age) - automatic at age 71
   - calculateTotalAssets(accounts) - sum all account types
   
Include unit tests for all withdrawal sequences and RRIF calculations.
```

**Acceptance Criteria**:
- ✅ RRIF percentages exactly match CRA table
- ✅ Withdrawal sequencing is tax-optimal
- ✅ Account growth calculations are accurate
- ✅ RRSP converts to RRIF at age 71 automatically
- ✅ Unit tests validate all scenarios

---

## Task 2.4: Main Calculation Engine Integration

**Objective**: Create the master calculation engine that orchestrates all components.

**Claude Code Prompt**:
```
Create the main calculation engine in /lib/calculations/engine.ts:

This is the core function that ties everything together.

Function: calculateRetirementPlan(scenario: Scenario): CalculationResults

Algorithm:
1. Input Validation:
   - Validate all inputs using Zod schema
   - Check logical constraints (retirement age > current age, etc.)
   - Return validation errors if any
   
2. Pre-Retirement Phase:
   - Project assets from current age to retirement age
   - Apply pre-retirement return rate
   - Include annual contributions
   - Calculate starting retirement balance
   
3. Retirement Phase (Year-by-Year Loop):
   For each year from retirement_age to longevity_age:
   
   a) Calculate withdrawal needed (expenses adjusted for inflation)
   
   b) Determine if RRIF minimums apply (age 71+)
      - If yes, calculate minimum
      - Actual withdrawal = max(needed, minimum)
   
   c) Execute withdrawal sequence (optimizeWithdrawalSequence)
      - Returns amounts from each account type
   
   d) Calculate government benefits:
      - CPP (if started)
      - OAS (if started)
   
   e) Calculate gross income:
      - Sum of withdrawals + CPP + OAS
   
   f) Calculate tax:
      - Federal and provincial tax
      - OAS clawback if applicable
   
   g) Calculate after-tax income:
      - Gross income - total tax
   
   h) Update account balances:
      - Subtract withdrawals
      - Apply post-retirement return rate
   
   i) Store year result in array
   
   j) Check if depleted:
      - If balance < bequest_goal, mark year and break
   
4. Generate Summary:
   - Sustainable monthly income (pre-tax and after-tax)
   - Total assets at retirement
   - Years until depletion (if any)
   - Total tax paid over lifetime
   - Ending balance
   
5. Generate Chart Data:
   - Balance over time array
   - Income composition by source
   
6. Return CalculationResults object

Include extensive error handling and logging.
Add unit tests with multiple realistic scenarios from the PRD.
```

**Acceptance Criteria**:
- ✅ Calculator produces accurate results for PRD example scenarios
- ✅ Year-by-year results are detailed and accurate
- ✅ All edge cases handled (early depletion, excess funds)
- ✅ Tax calculations integrate correctly
- ✅ Government benefits calculated properly
- ✅ Unit tests cover happy path and edge cases

---

## SPRINT 2: COMPLETION SUMMARY ✅

**Status**: COMPLETED
**Date Completed**: 2025-10-21
**Total Tests**: 126 passing (100% pass rate)

### What Was Accomplished

**Architecture Change**: Database-Backed Tax Data
- Instead of hardcoded constants, all Canadian tax data is stored in Supabase database
- Enables multi-year support and dynamic updates without code deployment
- Added 7 database tables (tax_years, federal_tax_brackets, provincial_tax_brackets, government_benefits, rrif_minimums, tfsa_limits, tax_credits)
- Created query layer with in-memory caching (24-hour TTL)

**Task 2.1: Tax Calculation Engine** ✅
- **File**: `/src/lib/calculations/tax-calculator.ts` (433 lines)
- **Tests**: 31 passing
- **Functions Implemented**:
  - `calculateProgressiveTax()` - Pure progressive tax calculation
  - `calculateFederalTax()` - Federal tax with credits (basic personal amount + age amount)
  - `calculateProvincialTax()` - Provincial tax with province-specific credits
  - `calculateTaxableIncome()` - Income treatment by source (RRSP 100%, capital gains 50%, dividends 138% gross-up)
  - `calculateOASClawback()` - OAS recovery tax (15% above $86,912)
  - `calculateTotalTax()` - Master orchestration with detailed breakdown
- **Database Integration**: All functions accept Supabase client as first parameter
- **Coverage**: Federal + all 13 provinces/territories with accurate 2025 data

**Task 2.2: Government Benefits Calculator** ✅
- **File**: `/src/lib/calculations/government-benefits.ts` (344 lines)
- **Tests**: 38 passing
- **Functions Implemented**:
  - `calculateCPPAdjustmentFactor()` - CPP adjustment by age (60-70)
    - Age 60: 64% (36% reduction)
    - Age 65: 100% (baseline)
    - Age 70: 142% (42% enhancement)
  - `calculateOASAdjustmentFactor()` - OAS deferral bonus (65-70)
    - Age 65: 100% (baseline)
    - Age 70: 136% (36% enhancement)
  - `calculateCPP()` - CPP with age adjustment and database validation
  - `calculateOAS()` - OAS with age adjustment and database validation
  - `estimateCPPFromEarnings()` - Estimate CPP from career earnings
  - `findOptimalCPPStartAge()` - Lifetime benefit optimization
  - `findOptimalOASStartAge()` - Lifetime benefit optimization
- **Database Integration**: Uses government_benefits table for CPP/OAS amounts

**Task 2.3: Account Management Functions** ✅
- **File**: `/src/lib/calculations/accounts.ts` (438 lines)
- **Tests**: 36 passing
- **Functions Implemented**:
  - `getRRIFMinimumPercentage()` - Age-based RRIF minimums from database
  - `calculateRRIFMinimumWithdrawal()` - Mandatory withdrawal calculation
  - `projectAccountGrowth()` - Single-year account projection
  - `calculateWithdrawalSequence()` - Tax-efficient withdrawal order:
    1. Non-registered first (50% capital gains inclusion)
    2. RRSP/RRIF second (100% taxable)
    3. TFSA last (preserve tax-free growth)
  - `projectYearForward()` - Complete year projection with contributions, withdrawals, and growth
  - `shouldConvertToRRIF()` - RRSP to RRIF conversion at age 71
  - `calculateTotalBalance()` - Helper for account summation
- **Database Integration**: Uses rrif_minimums table for withdrawal percentages

**Task 2.4: Main Calculation Engine** ✅
- **File**: `/src/lib/calculations/engine.ts` (401 lines)
- **Tests**: 21 passing
- **Functions Implemented**:
  - `calculateRetirementProjection()` - Master orchestration function:
    - **Phase 1**: Pre-retirement accumulation (contributions + growth)
    - **Phase 2**: Retirement drawdown (withdrawals + taxes + benefits + growth)
    - Year-by-year simulation from current age to longevity
    - Integrates tax calculator, benefits calculator, and account management
    - Returns detailed breakdown and summary statistics
  - `compareScenarios()` - Multi-scenario comparison for what-if analysis
- **Integration**: Ties together all calculation modules
- **Output**: Complete CalculationResults with year-by-year breakdown

### Database Updates

**New Migration**: `004_add_provincial_tax_credits.sql`
- Added `province_code` column to `tax_credits` table
- Supports both federal and provincial tax credits in same table
- Updated constraints and indexes

**New Migration**: `005_seed_provincial_tax_credits.sql`
- Seeded 2025 provincial basic personal amounts for all 13 provinces:
  - AB: $21,885, BC: $12,580, MB: $15,780, NB: $13,044, NL: $10,382
  - NT: $16,593, NS: $8,744, NU: $17,925, ON: $11,865, PE: $13,500
  - QC: $18,056, SK: $18,491, YT: $15,705
- Seeded provincial age amounts for ON and BC

### Testing Infrastructure

**Vitest Setup** ✅
- **Config**: `vitest.config.ts` with Next.js/React compatibility
- **Test Setup**: `src/lib/test-setup.ts` with globals
- **Test Utils**: `src/lib/test-utils.ts` for React component testing
- **Test Fixtures**: `src/lib/test-fixtures.ts` with:
  - Sample scenarios (modest and substantial)
  - Sample tax data (2025 federal and Ontario)
  - Sample CPP/OAS amounts
  - Mock Supabase client for database-free testing

**Test Coverage** ✅
- **Tax Calculator**: 31 tests covering progressive tax, federal/provincial tax, income treatment, OAS clawback
- **Government Benefits**: 38 tests covering CPP/OAS adjustments, estimations, optimization
- **Accounts**: 36 tests covering RRIF minimums, withdrawal sequencing, projections
- **Engine**: 21 tests covering full simulations, integration, realistic scenarios

**Test Results**: 126/126 passing (100%)

### Key Architectural Decisions

**1. Dependency Injection Pattern**
- All calculation functions accept Supabase client as first parameter
- Enables easy testing with mock clients
- Supports multiple database instances (production, staging, testing)

**2. Database-Backed Tax Data**
- Tax data stored in Supabase instead of hardcoded
- Enables multi-year support (2025, 2026, etc.)
- Allows updates without code deployment
- Supports historical comparisons

**3. Pure Functions Where Possible**
- `calculateProgressiveTax()`, `calculateTaxableIncome()`, `calculateOASClawback()` are pure
- No database queries for calculation logic, only for data retrieval
- Easier to test and reason about

**4. Comprehensive Type Safety**
- All functions use strict TypeScript types
- Database types auto-generated from Supabase schema
- Calculator types in `src/types/calculator.ts`

### Files Created (13 files)

**Configuration**:
- `vitest.config.ts`
- `.npmrc` (updated with test scripts)

**Testing Infrastructure**:
- `src/lib/test-setup.ts`
- `src/lib/test-utils.ts`
- `src/lib/test-fixtures.ts`
- `src/lib/calculations/__tests__/test-helpers.ts`

**Calculation Engines**:
- `src/lib/calculations/tax-calculator.ts`
- `src/lib/calculations/government-benefits.ts`
- `src/lib/calculations/accounts.ts`
- `src/lib/calculations/engine.ts`

**Tests**:
- `src/lib/calculations/__tests__/tax-calculator.test.ts`
- `src/lib/calculations/__tests__/government-benefits.test.ts`
- `src/lib/calculations/__tests__/accounts.test.ts`
- `src/lib/calculations/__tests__/engine.test.ts`

**Migrations**:
- `supabase/migrations/004_add_provincial_tax_credits.sql`
- `supabase/migrations/005_seed_provincial_tax_credits.sql`

### Files Updated (3 files)

- `src/lib/supabase/tax-data.ts` - Added provincial credit queries
- `src/types/database.ts` - Added province_code column to tax_credits
- `package.json` - Added test scripts

### Ready for Next Sprint

Sprint 2 provides the complete calculation foundation needed for Sprint 3 (Voice Integration) and Sprint 4 (UI Components). All core business logic is implemented, tested, and ready for integration with the user interface.

**Next Steps**:
- Sprint 3: Voice integration with Layercode SDK
- Sprint 4: UI components to display calculation results
- Sprint 5: Integration, testing, and deployment

---

# SPRINT 3: Voice Integration & Hybrid UI

**Timeline**: 9.5 days (significantly reduced from original 2-3 week estimate)

**Key Architectural Insight**: After analyzing the working Survey Buster implementation, we now have complete clarity on the Layercode architecture and can copy 80% of the code directly.

## Architecture Overview (Corrected Understanding)

**What Layercode Handles** (Complete Voice Pipeline):
- ✅ WebRTC audio streaming (browser ↔ cloud)
- ✅ Speech-to-Text (STT) - automatic transcription
- ✅ Text-to-Speech (TTS) - natural voice output
- ✅ Voice Activity Detection (VAD) - automatic turn-taking
- ✅ All voice processing infrastructure

**What OpenAI/Gemini Handle** (Conversation Intelligence Only):
- ✅ Response generation
- ✅ Intent extraction from transcribed text
- ✅ Number parsing and validation
- ✅ Conversation flow logic

**Critical Insight**: Layercode's webhook receives **already-transcribed text** from their STT service. We don't need to configure STT/TTS or VAD - it's all handled automatically.

**Data Flow**:
```
User speaks → Layercode WebRTC (browser) → Layercode Cloud STT →
Webhook POST with transcribed text → Backend AI (OpenAI/Gemini) →
stream.tts("response text") → Layercode Cloud TTS →
Layercode WebRTC (browser) → User hears AI response
```

**Reference Implementation**: `/Users/lancejones/projects/surveybuster/` has working code to copy.

---

## Task 3.1: Copy Layercode Integration from Survey Buster

**Duration**: 1 day

**Objective**: Copy and adapt the complete Layercode integration from Survey Buster, which handles WebRTC voice streaming and SSE webhook responses.

**Claude Code Prompt**:
```
Copy Layercode integration from Survey Buster project:

1. Install Layercode SDKs:
   npm install @layercode/react-sdk @layercode/node-server-sdk

2. Copy and adapt files from Survey Buster:

   A) Backend Webhook (SSE streaming):
      - Source: /Users/lancejones/projects/surveybuster/src/app/api/layercode/webhook/route.ts
      - Destination: /app/api/layercode/webhook/route.ts
      - Key pattern to copy:
        ```typescript
        import { streamResponse } from '@layercode/node-server-sdk'

        export async function POST(request: Request) {
          const requestBody = await request.json()
          const { type, text } = requestBody

          return streamResponse(requestBody, async ({ stream }) => {
            if (type === 'session.start') {
              // Send greeting via TTS
              stream.tts("Hello! Let's plan your retirement.")
              stream.end()
            }

            if (type === 'message' && text) {
              // text is already transcribed by Layercode!
              // Process with AI, then send response
              const response = await generateAIResponse(text)
              stream.tts(response.trim())
              stream.end()
            }
          })
        }
        ```

   B) Authorization Endpoint:
      - Source: Survey Buster authorize endpoint
      - Destination: /app/api/layercode/authorize/route.ts
      - Generates session tokens for Layercode

   C) Frontend Hook:
      - Source: /Users/lancejones/projects/surveybuster/src/hooks/useSimpleLayercodeVoice.ts
      - Destination: /hooks/useLayercodeVoice.ts
      - Key pattern:
        ```typescript
        import { useLayercodeAgent } from '@layercode/react-sdk'

        export function useLayercodeVoice() {
          const { status, connect, disconnect, userAudioAmplitude, agentAudioAmplitude } =
            useLayercodeAgent({
              agentId: process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID!,
              authorizeSessionEndpoint: '/api/layercode/authorize',
              onConnect: ({ conversationId }) => { /* ... */ },
              onDataMessage: (data) => { /* handle custom data */ }
            })

          return {
            isConnected: status === 'connected',
            startConversation: connect,
            endConversation: disconnect,
            userAudioLevel: userAudioAmplitude,
            agentAudioLevel: agentAudioAmplitude
          }
        }
        ```

3. Environment Variables:
   Add to .env.local:
   - NEXT_PUBLIC_LAYERCODE_PIPELINE_ID=<your_pipeline_id>
   - LAYERCODE_API_SECRET=<your_api_secret>

4. AI Provider (already exists):
   - Use existing /lib/ai-provider.ts from Sprint 2
   - Already supports switchable OpenAI/Gemini
   - Just adapt the prompts for retirement context

5. Test the integration:
   - Start voice session → should connect
   - Speak → should transcribe and respond
   - Disconnect → should end cleanly
```

**Acceptance Criteria**:
- ✅ Layercode webhook receives POST requests with transcribed text
- ✅ Backend streams TTS responses via SSE
- ✅ Frontend connects to Layercode WebRTC successfully
- ✅ Can speak and hear AI responses
- ✅ AI provider (OpenAI/Gemini) generates responses
- ✅ No errors in browser console or server logs

**Files to Create**:
- `/app/api/layercode/webhook/route.ts` - Main SSE webhook handler (~150 lines)
- `/app/api/layercode/authorize/route.ts` - Session authorization (~30 lines)
- `/hooks/useLayercodeVoice.ts` - Frontend voice hook (~80 lines)

---

## Task 3.2: Adapt AI Provider for Retirement Conversation

**Duration**: 0.5 days

**Objective**: Update the AI provider prompts and conversation logic for retirement planning instead of surveys.

**Claude Code Prompt**:
```
Adapt AI provider for retirement conversation in /lib/ai-provider.ts:

1. Update System Prompts:
   - Change context from survey to retirement planning
   - Add Canadian tax and retirement knowledge
   - Define conversation flow and question sequence
   - Specify number extraction patterns

   Example system prompt:
   ```
   You are a friendly Canadian retirement planning assistant. Your job is to help users
   plan their retirement by gathering their financial information through natural conversation.

   Ask one question at a time. Extract numbers from responses (handle "2 million", "200K", etc.).
   Be encouraging and patient. If unclear, ask for clarification.

   Required information to collect:
   1. Current age, retirement age, longevity age
   2. Assets: RRSP, TFSA, non-registered balances
   3. Monthly expenses
   4. Province (for tax calculations)
   5. CPP/OAS start ages and amounts

   Once all data collected, confirm and trigger calculation.
   ```

2. Add Intent Recognition:
   - Parse ages from text: "I'm 58" → {current_age: 58}
   - Parse amounts: "2.5 million in RRSPs" → {rrsp: 2500000}
   - Parse confirmations: "yes", "that's right", "correct"
   - Parse provinces: "I live in Ontario" → {province: "ON"}

3. Number Parsing Utilities (create /lib/conversation/number-parser.ts):
   ```typescript
   export function parseAmount(text: string): number | null {
     // "2 million" → 2000000
     // "250K" → 250000
     // "8,500,000" → 8500000
   }

   export function parseAge(text: string): number | null {
     // "I'm 58" → 58
     // "sixty-five" → 65
   }

   export function parseProvince(text: string): Province | null {
     // "Ontario" → "ON"
     // "BC" → "BC"
   }
   ```

4. Keep AI_PROVIDER Environment Variable:
   - Supports both 'openai' and 'gemini'
   - Gemini is faster for this use case
   - OpenAI potentially more accurate

5. Test with sample conversations:
   - "I'm 58 and want to retire at 62"
   - "I have 2 million in RRSPs and 500K in TFSA"
   - Edge cases: unclear responses, very large/small numbers
```

**Acceptance Criteria**:
- ✅ AI generates retirement-appropriate questions
- ✅ Number parsing handles common formats
- ✅ Intent extraction works reliably
- ✅ Both OpenAI and Gemini work
- ✅ Conversation feels natural

**Files to Create/Update**:
- `/lib/conversation/number-parser.ts` - Number extraction utilities (~100 lines)
- `/lib/ai-provider.ts` - Update system prompts (modify existing)

---

## Task 3.3: Build Retirement Question Flow Manager

**Duration**: 2 days

**Objective**: Create conversation state machine that guides users through retirement data collection.

**Claude Code Prompt**:
```
Create question flow manager in /lib/conversation/question-flow-manager.ts:

1. Define Question Stages:
   ```typescript
   type QuestionStage =
     | 'BASIC_INFO'      // Age, retirement age, province
     | 'ASSETS'          // RRSP, TFSA, non-registered
     | 'INCOME'          // CPP, OAS, employment, pensions
     | 'EXPENSES'        // Fixed monthly, variable annual
     | 'ASSUMPTIONS'     // Returns, inflation
     | 'CONFIRMATION'    // Review and confirm
     | 'COMPLETE'        // Ready to calculate

   interface ConversationState {
     stage: QuestionStage
     collectedData: Partial<Scenario>
     questionHistory: string[]
     currentQuestion: string
   }
   ```

2. Create QuestionFlowManager class:
   ```typescript
   export class QuestionFlowManager {
     private state: ConversationState

     constructor() {
       this.state = {
         stage: 'BASIC_INFO',
         collectedData: {},
         questionHistory: [],
         currentQuestion: this.getNextQuestion()
       }
     }

     getNextQuestion(): string {
       // Returns next question based on stage and collected data
     }

     processUserResponse(text: string, aiExtractedData: any): void {
       // Updates collectedData, advances stage if complete
     }

     isStageComplete(stage: QuestionStage): boolean {
       // Checks if all required fields for stage are filled
     }

     getScenario(): Scenario {
       // Assembles complete Scenario object with defaults
     }

     getSummary(): string {
       // Returns human-readable summary of collected data
     }
   }
   ```

3. Question Templates:
   - Use variations to avoid repetition
   - Keep questions short and clear
   - Provide examples when helpful

   ```typescript
   const QUESTIONS = {
     BASIC_INFO: {
       current_age: [
         "How old are you today?",
         "What's your current age?",
         "Let's start with your age. How old are you?"
       ],
       retirement_age: [
         "At what age would you like to retire?",
         "When do you plan to retire?",
         "What age are you targeting for retirement?"
       ],
       // ... more questions
     }
   }
   ```

4. Validation and Defaults:
   - Validate ages: retirement > current, longevity > retirement
   - Validate amounts: must be positive
   - Apply defaults for optional fields:
     * Pre-retirement return: 6%
     * Post-retirement return: 6%
     * Inflation: 2.5%
     * CPP start: 65
     * OAS start: 65

5. Integration with AI Provider:
   - Send conversation context to AI
   - AI extracts data from user response
   - Flow manager validates and stores
   - AI generates next question using flow manager's prompt

6. Create React Hook:
   ```typescript
   // /hooks/useQuestionFlow.ts
   export function useQuestionFlow() {
     const [manager] = useState(() => new QuestionFlowManager())
     const [currentQuestion, setCurrentQuestion] = useState(manager.getCurrentQuestion())
     const [isComplete, setIsComplete] = useState(false)

     const processResponse = (text: string, extractedData: any) => {
       manager.processUserResponse(text, extractedData)
       setCurrentQuestion(manager.getNextQuestion())
       setIsComplete(manager.isComplete())
     }

     return {
       currentQuestion,
       processResponse,
       isComplete,
       scenario: isComplete ? manager.getScenario() : null
     }
   }
   ```

7. Add localStorage persistence:
   - Save state after each question
   - Restore on page load
   - Clear on "Start Over"
```

**Acceptance Criteria**:
- ✅ Question flow follows logical progression
- ✅ All required data collected before completion
- ✅ Validation prevents invalid data
- ✅ Defaults applied sensibly
- ✅ Can resume if page refreshes
- ✅ Summary is accurate and readable
- ✅ Integrates with Layercode webhook

**Files to Create**:
- `/lib/conversation/question-flow-manager.ts` - Core state machine (~300 lines)
- `/hooks/useQuestionFlow.ts` - React integration (~100 lines)

---

## Task 3.4: Create 3 UX Prototype Pages

**Duration**: 3 days (1 day per prototype)

**Objective**: Build 3 different UX approaches for voice + form hybrid interface to help decide which works best.

**Important**: These are TEST pages to evaluate different UX patterns. User will choose the best approach before building production version.

### Prototype A: Form-First with Voice Assistant

**Location**: `/app/calculator/test-form-first/page.tsx`

**Layout**:
```
┌─────────────────────────────────────┐
│  🎤 Voice Assistant (floating btn)  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Retirement Planning Form     │ │
│  │                               │ │
│  │  Current Age: [____]          │ │
│  │  Retirement Age: [____]       │ │
│  │  Province: [dropdown]         │ │
│  │                               │ │
│  │  RRSP Balance: [$________]    │ │
│  │  TFSA Balance: [$________]    │ │
│  │  ...                          │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Previous]      [Next / Calculate] │
└─────────────────────────────────────┘
```

**Behavior**:
- Traditional multi-step form is primary interface
- Floating voice button at top-right
- When voice active:
  - AI asks questions one by one
  - Form fields update as user speaks
  - User sees both conversation AND form updating
- User can type OR speak, fields update either way
- No switching modes - both always available

**Pros**:
- Familiar form interface
- Visual feedback of all collected data
- Easy to edit/correct individual fields
- Clear what's been filled vs empty

**Cons**:
- Less "magical" conversational feel
- Might feel cluttered with both voice and form
- Voice feels like an add-on, not primary

---

### Prototype B: Voice-First with Live Form Preview

**Location**: `/app/calculator/test-voice-first/page.tsx`

**Layout** (Desktop):
```
┌──────────────────┬─────────────────┐
│  Conversation    │  Form Preview   │
│                  │                 │
│  🎤 Listening... │  Current Age: 58│
│                  │  Retirement: 62 │
│  AI: How old...? │  Province: —    │
│  You: I'm 58     │                 │
│                  │  RRSP: —        │
│  AI: When will...│  TFSA: —        │
│  You: At 62      │  ...            │
│                  │                 │
│  [Speak]  [Type] │  [Edit Fields]  │
└──────────────────┴─────────────────┘
```

**Behavior**:
- Left panel: Chat-style conversation (primary)
- Right panel: Live preview of form being filled
- Voice is default input method
- "Type" button switches to text input for current question
- "Edit Fields" button switches to full form editing
- Data updates in real-time as conversation progresses

**Pros**:
- Engaging conversational experience
- Shows progress visually
- Hybrid approach feels intentional
- Can switch to form if voice fails

**Cons**:
- More complex layout
- Might be confusing which panel to focus on
- Mobile requires stacking (conversation on top?)

---

### Prototype C: Step-by-Step Wizard with Voice Toggle

**Location**: `/app/calculator/test-wizard/page.tsx`

**Layout**:
```
┌─────────────────────────────────────┐
│  Progress: ●━━●━━●━━○━━○           │
│         Basic  Assets  Income       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Step 1: Basic Information  │   │
│  │                             │   │
│  │  [🎤 Use Voice] [⌨️ Type]   │   │
│  │                             │   │
│  │  (If voice selected)        │   │
│  │  AI: "How old are you?"     │   │
│  │  🎤 Listening...            │   │
│  │                             │   │
│  │  (If type selected)         │   │
│  │  Current Age: [____]        │   │
│  │  Retirement Age: [____]     │   │
│  │  Province: [dropdown]       │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Back]                    [Next]   │
└─────────────────────────────────────┘
```

**Behavior**:
- Multi-step wizard (one category per step)
- Each step: user chooses voice OR type
- Voice mode: AI asks sub-questions for this category
- Type mode: Show all fields for this category
- Can switch input method between steps
- Clear progress indicator shows current step

**Pros**:
- Clear, structured flow
- User has choice at each step
- Not overwhelming (one category at a time)
- Easy to go back and change

**Cons**:
- More clicks to complete
- Less conversational (broken into chunks)
- Can't easily switch mid-step

---

**Claude Code Prompt for Task 3.4**:
```
Create 3 UX prototype pages for testing:

1. Create /app/calculator/test-form-first/page.tsx:
   - Full-page form with all calculator fields
   - Floating voice button overlay
   - When voice active, form fields update from AI responses
   - Multi-step form with validation
   - Both input methods always available

2. Create /app/calculator/test-voice-first/page.tsx:
   - Two-panel layout (60/40 split on desktop)
   - Left: Conversation panel with voice interface
   - Right: Live form preview (read-only, updates as conversation progresses)
   - "Edit Fields" button to switch to form editing mode
   - Mobile: Stack conversation above preview

3. Create /app/calculator/test-wizard/page.tsx:
   - Multi-step wizard with progress indicator
   - Each step: choose voice or type input method
   - Voice mode: AI conversation for that category
   - Type mode: Traditional form fields for that category
   - Clear navigation (Back/Next buttons)
   - 5 steps: Basic, Assets, Income, Expenses, Assumptions

4. Shared Components (create in /components/calculator-test/):
   - VoiceConversation.tsx - Chat-style conversation UI
   - FormFields.tsx - Reusable calculator input fields
   - InputMethodToggle.tsx - Switch between voice/type
   - ProgressIndicator.tsx - Wizard progress bar

5. Wire up all prototypes to:
   - useLayercodeVoice() hook (from Task 3.1)
   - useQuestionFlow() hook (from Task 3.3)
   - Calculation engine (from Sprint 2)

6. Create comparison page /app/calculator/choose-ux/page.tsx:
   - Shows screenshots/demos of all 3 approaches
   - Links to each prototype
   - Helps user decide which to build as production version

Make all prototypes fully functional with real voice and calculation.
Add basic styling using Tailwind (doesn't need to be pixel-perfect).
Focus on UX patterns, not visual polish.
```

**Acceptance Criteria**:
- ✅ All 3 prototypes are functional
- ✅ Voice integration works in all 3
- ✅ Form input works in all 3
- ✅ Calculation triggers correctly in all 3
- ✅ Results display properly in all 3
- ✅ Mobile-responsive layouts
- ✅ Can navigate between prototypes easily
- ✅ User can test and compare all 3 approaches

**Files to Create**:
- 3 prototype pages (3 × ~200 lines = 600 lines)
- 4 shared components (4 × ~100 lines = 400 lines)
- 1 comparison page (~100 lines)
- **Total**: ~1100 lines of code

---

## Task 3.5: Build Reusable Components

**Duration**: 2 days (can work in parallel with Task 3.4)

**Objective**: Create polished, reusable components that will work across different UX approaches.

**Claude Code Prompt**:
```
Create production-ready reusable components in /components/:

1. Voice Components (/components/voice/):

   A) VoiceButton.tsx - Microphone control:
      - States: idle, connecting, listening, processing, error
      - Animated pulsing effect when listening
      - Audio level indicator
      - Click to toggle recording
      - Keyboard accessible (Space to toggle)
      - Props: onStart, onStop, isListening, isProcessing, disabled

   B) VoiceVisualizer.tsx - Audio waveform:
      - Canvas-based waveform visualization
      - Responds to userAudioAmplitude and agentAudioAmplitude
      - Smooth animations using requestAnimationFrame
      - Different colors for user vs agent
      - Props: userLevel, agentLevel, variant

   C) ConversationDisplay.tsx - Chat interface:
      - Message list with auto-scroll
      - Distinguish user vs assistant messages
      - Typing indicator while AI processes
      - Timestamp on messages
      - Editable transcript for corrections
      - Props: messages, isTyping, onEditMessage

   D) VoiceStatus.tsx - Connection status:
      - Shows connection state (connected, disconnected, error)
      - Visual indicator (dot with color)
      - Tooltip with details
      - Props: status, conversationId

2. Form Components (/components/forms/):

   A) CurrencyInput.tsx - Money input:
      - Formats as user types: "8000000" → "$8,000,000"
      - Supports shortcuts: "2M", "250K"
      - Clear button
      - Validation: must be >= 0
      - Props: value, onChange, label, required, error

   B) AgeInput.tsx - Age input with validation:
      - Number input with +/- buttons
      - Range validation (0-120)
      - Comparison validation (retirement > current, etc.)
      - Props: value, onChange, label, min, max, compareWith, error

   C) PercentageInput.tsx - Rate input:
      - Dual interface: slider + text input
      - Displays as percentage: "6" → "6%"
      - Range: 0-15% for returns, 0-10% for inflation
      - Props: value, onChange, label, min, max, step, error

   D) ProvinceSelect.tsx - Province dropdown:
      - All 13 provinces/territories
      - Searchable with keyboard
      - Shows full name and code
      - Props: value, onChange, required, error

   E) ScenarioSummary.tsx - Review collected data:
      - Displays all inputs in organized sections
      - "Edit" button for each section
      - Validation status indicators
      - Props: scenario, onEdit, errors

3. Hybrid Components (/components/hybrid/):

   A) VoiceOrFormField.tsx - Smart wrapper:
      - Renders form field OR shows voice collection status
      - Switches based on input mode
      - Updates from either source
      - Props: field, value, onChange, isVoiceMode

   B) InputMethodToggle.tsx - Mode switcher:
      - Toggle between voice and form
      - Shows current mode clearly
      - Keyboard shortcut (Ctrl+V)
      - Props: mode, onModeChange, disabled

   C) FieldValidation.tsx - Visual validation:
      - Success checkmark when valid
      - Error message when invalid
      - Warning for uncertain voice transcription
      - Props: status, message, confidence

4. Styling Requirements:
   - Use PRD design system colors
   - Consistent spacing (multiples of 4px)
   - Smooth transitions (200-300ms)
   - Focus states for accessibility
   - Loading skeletons
   - Error states
   - Empty states

5. Use shadcn/ui as base where applicable:
   - Button, Input, Label, Card, Select, Slider
   - Customize with Tailwind
   - Ensure consistency

6. Accessibility:
   - ARIA labels on all interactive elements
   - Keyboard navigation support
   - Screen reader announcements for status changes
   - Sufficient color contrast (WCAG AA)
   - Focus indicators

7. Create Storybook (optional but recommended):
   - Document all components
   - Show all states and variants
   - Interactive props controls
   - Accessibility checks
```

**Acceptance Criteria**:
- ✅ All components render correctly
- ✅ Voice components integrate with useLayercodeVoice hook
- ✅ Form components validate properly
- ✅ Currency/percentage formatting works
- ✅ Components are accessible (keyboard + screen reader)
- ✅ Mobile-responsive
- ✅ Match design system
- ✅ TypeScript types are complete
- ✅ Can be used in any of the 3 UX prototypes

**Files to Create**:
- 4 voice components (~400 lines)
- 5 form components (~600 lines)
- 3 hybrid components (~300 lines)
- **Total**: ~1300 lines of reusable components

---

## Task 3.6: Choose Best UX & Polish

**Duration**: 1 day

**Objective**: User tests all 3 prototypes, selects winning approach, and polishes it for production.

**Process**:

1. **User Testing** (2-3 hours):
   - User tries all 3 prototypes with real scenarios
   - Tests on desktop and mobile
   - Notes pros/cons of each
   - Considers target audience preferences
   - Makes decision on which approach to productionize

2. **Architecture Decision** (30 minutes):
   - Document chosen approach in ARCHITECTURE.md
   - Explain rationale
   - Note what to keep from other prototypes

3. **Production Implementation** (4-5 hours):
   - Copy chosen prototype to /app/calculator/page.tsx
   - Replace test components with production components from Task 3.5
   - Apply final styling and polish
   - Add transitions and animations
   - Fix any remaining bugs

4. **Polish Checklist**:
   - ✅ Smooth transitions between states
   - ✅ Loading states feel natural
   - ✅ Error messages are helpful
   - ✅ Voice button is prominent and inviting
   - ✅ Form validation is clear
   - ✅ Progress indicators work
   - ✅ Results display beautifully
   - ✅ Mobile experience is excellent
   - ✅ Accessibility is solid

5. **Cleanup**:
   - Remove unused prototype code (or move to /examples/)
   - Clean up test files
   - Update documentation
   - Run final tests

**Acceptance Criteria**:
- ✅ User has tested all 3 prototypes
- ✅ Clear decision made with documented rationale
- ✅ Production calculator page uses chosen approach
- ✅ All components polished and working
- ✅ Voice + form hybrid works seamlessly
- ✅ Ready for Sprint 4 (visualization and results display)

---

## Sprint 3 Summary

**Total Duration**: 9.5 days

**What Gets Built**:
1. ✅ Complete Layercode voice integration (copied from Survey Buster)
2. ✅ Retirement conversation AI (adapted from existing AI provider)
3. ✅ Question flow state machine
4. ✅ 3 fully functional UX prototypes for testing
5. ✅ Library of reusable voice + form components
6. ✅ Production calculator page with chosen UX approach

**Key Deliverables**:
- Working voice conversation that collects retirement data
- Hybrid voice + form interface (user chooses best approach)
- Reusable components for Sprint 4
- Complete Scenario object ready for calculation engine

**Why Much Faster Than Original Estimate**:
- 80% of Layercode code copied from Survey Buster (proven working)
- No need to "configure" or "train" Layercode (it's automatic)
- AI provider already built, just need new prompts
- Clear architecture eliminates guesswork
- Reference implementation reduces trial-and-error

**Next Steps**:
- Sprint 4: Build visualization components and results display
- Sprint 5: Integration, testing, deployment

---

# SPRINT 4: UI Components & Data Visualization

## Task 4.1: Results Dashboard Layout

**Objective**: Create the main results display with summary cards and key metrics.

**Claude Code Prompt**:
```
Create results dashboard components in /components/results/:

1. ResultsSummary.tsx - Top-level summary card:
   - Monthly income (large, prominent): "$7,200/month after tax"
   - Success indicator (green checkmark or yellow warning)
   - Key metrics in grid:
     * Retirement age
     * Years of retirement (28 years)
     * Total assets at retirement
     * Ending balance
   - Use shadcn/ui Card component
   - Conditional styling based on outcome (sufficient vs. concerning)
   
2. IncomeBreakdown.tsx - Income source breakdown:
   - Donut or pie chart showing income sources
   - Legend with amounts:
     * RRSP/RRIF withdrawals
     * TFSA withdrawals
     * Non-registered
     * CPP
     * OAS
   - Use Recharts library
   
3. TaxSummary.tsx - Tax impact display:
   - Total tax paid lifetime
   - Effective tax rate
   - Annual tax estimate
   - Bar chart: gross vs net income
   
4. MetricsGrid.tsx - Grid of key numbers:
   - Reusable metric card component
   - Large number + label + trend indicator
   - Responsive grid (2 cols mobile, 4 cols desktop)
   
5. ResultsContainer.tsx - Main layout:
   - Collapsible sections
   - Summary visible, detailed expandable
   - Export button (PDF download)
   - Share button (future: share link)
   - "Start new scenario" button
   
Apply PRD design system:
- Use defined color palette
- Proper spacing (multiples of 4px)
- Typography: Inter for headings, system fonts for body
- Success/warning/error colors for indicators

Make components responsive: stack on mobile, side-by-side on desktop.
```

**Acceptance Criteria**:
- ✅ Summary displays all key metrics
- ✅ Visual hierarchy is clear
- ✅ Charts render correctly
- ✅ Responsive on all screen sizes
- ✅ Matches PRD design system
- ✅ Loading states handled
- ✅ Empty/error states handled

---

## Task 4.2: Interactive Charts with Recharts

**Objective**: Create beautiful, interactive charts for portfolio balance and income over time.

**Claude Code Prompt**:
```
Create chart components in /components/charts/ using Recharts:

1. BalanceOverTimeChart.tsx - Main portfolio projection:
   - Area chart showing portfolio balance from retirement age to end age
   - X-axis: Age (62, 63, 64... 90)
   - Y-axis: Balance ($)
   - Color gradient (green → yellow → orange as balance decreases)
   - Milestone markers:
     * Age 65 marker: "CPP/OAS Start"
     * Age 71 marker: "RRIF Conversion"
     * End age marker
   - Hover tooltip showing exact balance at age
   - Responsive width
   - Props: yearByYearData, retirementAge, longevityAge
   
2. IncomeCompositionChart.tsx - Stacked area chart:
   - Shows income sources over time
   - X-axis: Age
   - Y-axis: Annual income ($)
   - Stacked areas:
     * RRSP/RRIF (blue)
     * TFSA (green)
     * Non-registered (orange)
     * CPP (purple)
     * OAS (pink)
   - Legend with color coding
   - Hover shows breakdown for that year
   - Props: yearByYearData
   
3. TaxImpactChart.tsx - Tax over time:
   - Bar chart or area chart
   - Shows annual tax paid by year
   - Highlight years with high tax (RRIF minimums > needs)
   - Props: yearByYearData
   
4. ChartContainer.tsx - Wrapper component:
   - Handles responsive sizing
   - Loading skeleton
   - Error state
   - Empty state ("No data available")
   - Download chart as image button
   
5. Chart Utilities (/lib/charts/utils.ts):
   - formatCurrency(value): string - "$1,234,567"
   - formatAge(value): string - "Age 65"
   - getColorForBalance(balance): string - color based on amount
   - prepareChartData(yearByYearData): ChartData[] - transform for Recharts
   
Configuration:
- Use PRD color palette for consistency
- Animations smooth (duration: 500ms)
- Responsive breakpoints
- Accessibility: tooltips, labels, keyboard navigation

Export chart data as CSV functionality.
```

**Acceptance Criteria**:
- ✅ Charts render with real data
- ✅ Animations are smooth
- ✅ Tooltips show detailed info
- ✅ Responsive and mobile-friendly
- ✅ Colors match PRD design system
- ✅ Accessible (ARIA labels, keyboard nav)
- ✅ Loading and error states work

---

## Task 4.3: Input Forms (Text Fallback)

**Objective**: Create traditional form inputs as fallback when voice is not used.

**Claude Code Prompt**:
```
Create form components in /components/forms/ for text-based input:

1. BasicInputForm.tsx - Step-by-step form matching conversation:
   - Multi-step form with progress indicator
   - Steps match conversation stages
   - Form fields:
     * Age inputs (current, retirement, longevity)
     * Currency inputs (RRSP, TFSA, non-reg, expenses)
     * Percentage inputs (return rates, inflation)
     * Dropdown (province)
   - Validation using Zod schema
   - Error messages inline
   - "Next" and "Back" buttons
   - "Use voice instead" toggle
   
2. CurrencyInput.tsx - Specialized input for money:
   - Formats as user types: "8000000" → "$8,000,000"
   - Accepts "K", "M", "million" shortcuts
   - Clear button (X icon)
   - Validation: must be positive
   
3. PercentageInput.tsx - For rates:
   - Displays as percentage: "6" → "6%"
   - Slider + text input combo
   - Range validation (0-15% for returns)
   
4. AgeInput.tsx - For age fields:
   - Number input with +/- buttons
   - Validation: retirement > current, longevity > retirement
   
5. ProvinceSelect.tsx - Province dropdown:
   - All 13 provinces/territories
   - Searchable/filterable
   - Shows tax rate info on hover (optional)
   
6. FormNavigation.tsx - Step controls:
   - Progress bar
   - Back/Next buttons
   - Skip button for optional fields
   - Submit button (final step)
   
7. FormContainer.tsx - Main form wrapper:
   - Handles form state (React Hook Form)
   - Validation orchestration
   - Submission to calculation engine
   - Error handling
   
Use shadcn/ui form components as base.
Add helpful tooltips and examples.
Mobile-optimized (large touch targets).
```

**Acceptance Criteria**:
- ✅ All form fields validate correctly
- ✅ Currency formatting works
- ✅ Multi-step navigation smooth
- ✅ Can switch between voice and forms
- ✅ Form submission creates valid Scenario object
- ✅ Accessible (labels, error messages)
- ✅ Mobile-friendly

---

## Task 4.4: Main Application Flow & Routing

**Objective**: Create the overall app structure with Next.js App Router.

**Claude Code Prompt**:
```
Create main application structure using Next.js 14 App Router:

1. /app/layout.tsx - Root layout:
   - HTML structure
   - Tailwind CSS imports
   - Font configuration (Inter)
   - Metadata (SEO)
   - Supabase SessionProvider
   - Global error boundary
   
2. /app/page.tsx - Landing page:
   - Hero section: "Talk to Your Retirement"
   - Value proposition
   - Feature highlights (voice, Canadian-specific, accurate)
   - "Get Started" CTA → /calculator
   - "How it works" section
   - Testimonials placeholder
   - Footer with disclaimers
   
3. /app/calculator/page.tsx - Main calculator page:
   - Two-panel layout (conversation | results)
   - Desktop: Side-by-side
   - Mobile: Stacked, swipeable
   - State management:
     * Conversation state
     * Calculation results
     * Loading states
   - Flow:
     a) User chooses voice or text input
     b) Conversation/form collects data
     c) On completion, trigger calculation
     d) Display results panel
     e) Allow "Start over" or "Adjust"
   
4. /app/calculator/layout.tsx - Calculator layout:
   - Full-height viewport
   - Persistent header with logo and help
   - No distracting navigation
   
5. /app/results/[id]/page.tsx - Shareable results (future):
   - Static results view
   - No editing
   - SEO-optimized
   
6. /components/Header.tsx - Top navigation:
   - Logo
   - Help button (opens modal with instructions)
   - Settings (voice preferences)
   - Account (future: sign in/up)
   
7. /components/Footer.tsx - Disclaimers:
   - Required legal disclaimers from PRD Section 12.2
   - Links to privacy policy, terms
   
8. State Management:
   - Create Context: /lib/context/calculator-context.tsx
   - Provides: scenario, results, updateScenario, calculate
   - Wrap calculator pages
   
9. /lib/hooks/useCalculator.ts - Main calculator hook:
   - Orchestrates: conversation → calculation → results
   - Handles errors
   - Manages loading states

Implement loading states and error boundaries throughout.
Add meta tags for SEO.
```

**Acceptance Criteria**:
- ✅ Landing page loads correctly
- ✅ Can navigate to calculator
- ✅ Calculator layout works on desktop and mobile
- ✅ State persists during session
- ✅ Loading states display correctly
- ✅ Error boundaries catch issues gracefully
- ✅ SEO meta tags present
- ✅ Disclaimers visible

---

# SPRINT 5: Integration, Testing & Deployment

## Task 5.1: End-to-End Flow Integration

**Objective**: Connect all pieces into a working end-to-end user flow.

**Claude Code Prompt**:
```
Integrate all components into complete user flow:

1. Complete Calculator Flow Integration:
   - User lands on /calculator
   - Chooses "Use Voice" or "Type Instead"
   - Voice path:
     * Clicks mic button
     * Speaks answers to questions
     * Sees transcript, can edit
     * Progress indicator shows completion
   - Form path:
     * Fills multi-step form
     * Validates each step
     * Navigates forward/back
   - On completion:
     * Trigger calculation engine
     * Show loading state (2-3 seconds)
     * Display results panel
     * Charts animate in
   
2. Data Flow Verification:
   - Conversation state → Scenario object
   - Scenario object → Calculation engine
   - Calculation results → UI components
   - Ensure type safety throughout
   
3. Error Handling Integration:
   - Voice API failure → fallback to text
   - Calculation error → show error message, allow retry
   - Invalid input → clear validation message
   - Network error → retry logic
   
4. Browser Storage:
   - Save in-progress scenario to localStorage
   - Resume if user refreshes page
   - Clear on "Start Over"
   
5. Performance Optimization:
   - Lazy load chart libraries
   - Memoize calculation results
   - Debounce form inputs
   - Optimize Recharts rendering
   
6. Create Demo Mode:
   - /app/calculator/demo/page.tsx
   - Pre-filled with sample data from PRD
   - "See sample result" button
   - Useful for testing and demos

Test the complete flow with multiple scenarios:
- Young user with modest savings
- Near-retirement with substantial assets
- Complex scenario with all optional inputs
```

**Acceptance Criteria**:
- ✅ Complete voice flow works end-to-end
- ✅ Complete form flow works end-to-end
- ✅ Can switch between voice and form mid-flow
- ✅ Results display correctly for all scenarios
- ✅ localStorage persistence works
- ✅ Error handling graceful throughout
- ✅ Performance is smooth (no lag)
- ✅ Demo mode works

---

## Task 5.2: Testing Suite Setup

**Objective**: Create comprehensive test coverage for critical functionality.

**Claude Code Prompt**:
```
Set up comprehensive testing using Vitest and React Testing Library:

1. Configure Testing:
   - Install vitest, @testing-library/react, @testing-library/jest-dom
   - Create vitest.config.ts
   - Set up test utilities in /lib/test-utils.ts
   
2. Unit Tests - Calculation Engine (/lib/calculations/__tests__/):
   - tax-calculator.test.ts:
     * Test all tax brackets
     * Test all provinces
     * Test OAS clawback
     * Edge cases (zero income, very high income)
   
   - government-benefits.test.ts:
     * CPP adjustment factors
     * OAS adjustment factors
     * Edge cases (start ages)
   
   - accounts.test.ts:
     * RRIF minimum calculations
     * Withdrawal sequencing logic
     * Account growth projections
   
   - engine.test.ts:
     * Full calculation with sample scenarios
     * Verify year-by-year results
     * Test edge cases (early depletion, excess funds)
   
3. Component Tests (/components/__tests__/):
   - Voice components:
     * VoiceButton state changes
     * TranscriptDisplay editing
     * ConversationPanel message display
   
   - Chart components:
     * Charts render with data
     * Tooltips work
     * Responsive behavior
   
   - Form components:
     * Input validation
     * Currency formatting
     * Multi-step navigation
   
4. Integration Tests (/app/__tests__/):
   - Complete user flows
   - Voice to results
   - Form to results
   - Error scenarios
   
5. Test Data Fixtures:
   - Create /lib/test-fixtures.ts
   - Sample scenarios from PRD
   - Mock API responses
   - Expected calculation results
   
6. Coverage Requirements:
   - Calculation engine: 100%
   - Components: 80%+
   - Overall: 80%+
   
Set up GitHub Actions for CI/CD (run tests on PR).
```

**Acceptance Criteria**:
- ✅ Test suite runs successfully
- ✅ All calculation tests pass
- ✅ Component tests pass
- ✅ Coverage meets targets
- ✅ CI/CD pipeline configured
- ✅ Tests run fast (<30 seconds)

---

## Task 5.3: Environment Configuration & Deployment

**Objective**: Set up production environment and deploy to Vercel.

**Claude Code Prompt**:
```
Configure production environment and deployment:

1. Environment Variables:
   - Create .env.example with all required vars:
     * NEXT_PUBLIC_SUPABASE_URL
     * NEXT_PUBLIC_SUPABASE_ANON_KEY
     * SUPABASE_SERVICE_ROLE_KEY
     * NEXT_PUBLIC_LAYERCODE_API_KEY
     * NEXT_PUBLIC_APP_URL
   
   - Document each variable in README.md
   - Add validation in /lib/env.ts (t3-env pattern)
   
2. Vercel Configuration:
   - Create vercel.json:
     * Build settings
     * Environment variable mappings
     * Redirect rules
   
   - Set up Vercel project:
     * Connect GitHub repo
     * Configure environment variables
     * Set up production and preview deployments
   
3. Supabase Production Setup:
   - Create production Supabase project
   - Run migrations
   - Set up RLS policies
   - Configure auth settings (for future)
   - Add connection string to Vercel
   
4. Performance Optimization:
   - Enable Next.js image optimization
   - Configure caching headers
   - Set up Vercel Analytics
   - Enable ISR for static pages
   
5. Security Headers:
   - CSP (Content Security Policy)
   - HSTS (HTTP Strict Transport Security)
   - X-Frame-Options
   - X-Content-Type-Options
   
6. Monitoring & Logging:
   - Set up Vercel Speed Insights
   - Configure error tracking (Sentry optional)
   - Add basic analytics (Vercel Analytics)
   
7. Domain Configuration:
   - Set up custom domain (if available)
   - Configure SSL/TLS
   - Set up redirects (www → non-www)
   
8. Create Deployment Checklist (DEPLOY.md):
   - Pre-deployment verification steps
   - Environment variable checklist
   - Post-deployment smoke tests
   - Rollback procedure
```

**Acceptance Criteria**:
- ✅ App deploys successfully to Vercel
- ✅ All environment variables configured
- ✅ Supabase production database connected
- ✅ Layercode API works in production
- ✅ Performance is good (Lighthouse >90)
- ✅ Security headers present
- ✅ Analytics tracking works
- ✅ No console errors in production

---

## Task 5.4: Documentation & Handoff

**Objective**: Create comprehensive documentation for the MVP.

**Claude Code Prompt**:
```
Create complete documentation for the MVP:

1. README.md - Project overview:
   - Project description and goals
   - Tech stack
   - Prerequisites
   - Installation instructions
   - Environment setup
   - Running locally
   - Running tests
   - Deployment guide
   - Contributing guidelines (future)
   
2. ARCHITECTURE.md - Technical architecture:
   - System architecture diagram
   - Data flow
   - Key components and their responsibilities
   - State management approach
   - API integration points
   - Database schema
   
3. API.md - Internal API documentation:
   - Calculation engine functions
   - Supabase queries
   - Layercode integration
   - Type definitions
   - Usage examples
   
4. CALCULATIONS.md - Financial logic documentation:
   - Tax calculation methodology
   - CPP/OAS calculations
   - RRIF rules
   - Withdrawal sequencing strategy
   - Assumptions and limitations
   - References to CRA rules
   
5. TESTING.md - Testing guide:
   - Test structure
   - Running tests
   - Writing new tests
   - Test scenarios
   - Coverage reports
   
6. VOICE.md - Voice integration guide:
   - Layercode setup
   - Intent configuration
   - Conversation flow
   - Troubleshooting
   - Fallback behavior
   
7. DEPLOYMENT.md - Deployment guide:
   - Vercel setup
   - Environment configuration
   - Database migrations
   - Pre-deployment checklist
   - Post-deployment verification
   - Monitoring and alerts
   
8. USER_GUIDE.md - End user documentation:
   - How to use the calculator
   - Voice tips
   - Interpreting results
   - FAQ
   - Troubleshooting
   
9. Code Comments:
   - Add JSDoc comments to all public functions
   - Explain complex calculations
   - Document assumptions
   - Add TODO comments for future features
   
10. Create CHANGELOG.md:
    - Version 1.0.0 (MVP)
    - All features implemented
    - Known limitations
    - Future roadmap (Phase 2 features)

All documentation should be clear, concise, and include examples.
```

**Acceptance Criteria**:
- ✅ README is comprehensive and accurate
- ✅ Architecture is well-documented
- ✅ API documentation complete
- ✅ Calculations are explained
- ✅ Testing guide is useful
- ✅ Deployment guide works
- ✅ User guide is clear
- ✅ Code comments are helpful
- ✅ Changelog is up-to-date

---

## Task 5.5: Final Polish & Launch Prep

**Objective**: Final refinements, bug fixes, and launch preparation.

**Claude Code Prompt**:
```
Final polish and launch preparation:

1. UI/UX Polish:
   - Review all pages for visual consistency
   - Check spacing and alignment
   - Verify color usage matches design system
   - Test all interactive elements (hover, focus states)
   - Add micro-interactions (button presses, transitions)
   - Ensure loading states are smooth
   - Verify error messages are helpful
   
2. Content Review:
   - Check all copy for clarity and tone
   - Verify disclaimers are present and accurate
   - Proofread all UI text
   - Ensure Canadian English spelling
   - Add helpful tooltips and hints
   
3. Accessibility Audit:
   - Run Lighthouse accessibility check
   - Test with screen reader
   - Verify keyboard navigation
   - Check color contrast ratios (WCAG AA)
   - Add ARIA labels where needed
   - Test with browser zoom (200%, 400%)
   
4. Performance Optimization:
   - Run Lighthouse performance check (target >90)
   - Optimize images and assets
   - Minimize bundle size
   - Check Core Web Vitals
   - Test on slow 3G network
   
5. Cross-Browser Testing:
   - Chrome
   - Firefox
   - Safari
   - Edge
   - Mobile browsers (iOS Safari, Chrome Android)
   
6. Device Testing:
   - Desktop (various screen sizes)
   - Tablet
   - Mobile (iPhone, Android)
   - Test voice on different devices
   
7. Bug Fixes:
   - Fix any issues found in testing
   - Address edge cases
   - Handle error scenarios gracefully
   
8. Launch Checklist:
   - [ ] All tests passing
   - [ ] No console errors
   - [ ] Environment variables set
   - [ ] Database production ready
   - [ ] Analytics configured
   - [ ] Error tracking set up
   - [ ] Backup plan in place
   - [ ] Team notified
   - [ ] Documentation complete
   - [ ] Legal disclaimers present
   
9. Soft Launch:
   - Deploy to staging
   - Internal testing with team
   - Invite 10-20 beta testers
   - Collect feedback
   - Make final adjustments
   
10. Launch:
    - Deploy to production
    - Monitor errors and performance
    - Be ready for quick fixes
    - Collect user feedback
    - Celebrate! 🎉

Create launch announcement materials:
- Social media posts
- Landing page updates
- Email to waitlist (if any)
```

**Acceptance Criteria**:
- ✅ All major bugs fixed
- ✅ UI is polished and consistent
- ✅ Accessibility checks pass
- ✅ Performance is excellent
- ✅ Cross-browser compatible
- ✅ Mobile experience is smooth
- ✅ Documentation complete
- ✅ Launch checklist complete
- ✅ Beta testing successful
- ✅ Ready for production launch

---

# ADDITIONAL NOTES FOR CLAUDE CODE

## Working with Claude Code CLI

### Task Execution Strategy

For each task above:

1. **Read the full task description** including objectives and acceptance criteria
2. **Ask clarifying questions** if anything is unclear
3. **Plan your approach** before writing code
4. **Implement incrementally** - don't try to do everything at once
5. **Test as you go** - verify each piece works before moving on
6. **Document your work** - add comments and update docs
7. **Report completion** with summary of what was done

### Best Practices

- **One task at a time**: Don't jump ahead. Complete each task fully.
- **Type safety**: Use TypeScript strictly. Define types before implementation.
- **Test early**: Write tests alongside code, not after.
- **Commit often**: Make small, logical commits with clear messages.
- **Ask for review**: Before marking a task complete, offer to review the code.

### When You Get Stuck

If you encounter issues:
1. **Document the problem** clearly
2. **Research solutions** (check docs, Stack Overflow)
3. **Try alternatives** if the first approach doesn't work
4. **Ask for guidance** - explain what you've tried
5. **Suggest workarounds** if you can't solve it immediately

### Dependencies Between Tasks

Some tasks have dependencies:
- **Task 1.3** (types) should be done before calculation tasks
- **Task 2.4** (main engine) requires Tasks 2.1-2.3 complete
- **Task 3.2** (conversation) requires Task 3.1 (Layercode) complete
- **Sprint 4** requires Sprint 2 complete (need calculation results to display)
- **Sprint 5** requires all previous sprints complete

### Testing Guidelines

For every task:
- Write unit tests for utilities and calculations
- Write component tests for UI components
- Test edge cases and error conditions
- Aim for >80% coverage
- Make tests readable and maintainable

### Code Quality Standards

- **Consistent formatting**: Use Prettier
- **Linting**: Fix all ESLint errors
- **No console logs**: Use proper logging in production
- **Error handling**: Always handle errors gracefully
- **Performance**: Avoid unnecessary re-renders, optimize expensive operations
- **Accessibility**: Follow WCAG guidelines

---

# NEXT STEPS AFTER PHASE 1

Once Phase 1 MVP is complete and launched, here's what comes next:

## Phase 2: Pro Tier Features (Future)
- Multi-scenario comparison
- Detailed tax optimization
- PDF report generation
- Spouse/joint planning
- Advanced input options

## Phase 3: Advisor Features (Future)
- Multi-client dashboard
- White-label branding
- Client collaboration
- Advisor-specific tools

## Phase 4: Scale & Monetization (Future)
- Payment integration (Stripe)
- User authentication
- API for enterprise clients
- Marketing website
- Analytics and tracking

---

# SUCCESS METRICS FOR PHASE 1

**Technical Success**:
- ✅ All acceptance criteria met
- ✅ >80% test coverage
- ✅ Lighthouse score >90
- ✅ Zero critical bugs
- ✅ Production deployment stable

**User Success**:
- ✅ User can complete calculation in <5 minutes
- ✅ Results are accurate (verified against manual calculation)
- ✅ Voice interaction feels natural
- ✅ UI is intuitive (no training needed)
- ✅ Works on mobile and desktop

**Business Success**:
- ✅ Product is live and accessible
- ✅ Can gather user feedback
- ✅ Foundation for monetization (Phase 2)
- ✅ Demo-able to advisors and partners
- ✅ Press-worthy ("First voice retirement calculator")

---

**END OF PHASE 1 IMPLEMENTATION PLAN**

Ready to start building! Begin with Sprint 1, Task 1.1. Good luck! 🚀
