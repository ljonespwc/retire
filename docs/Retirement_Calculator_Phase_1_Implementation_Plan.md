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

# SPRINT 3: Voice Integration & Conversation Flow

## Task 3.1: Layercode SDK Integration

**Objective**: Integrate Layercode Voice API for speech-to-text and text-to-speech.

**Claude Code Prompt**:
```
Integrate Layercode Voice API in /lib/voice/layercode-client.ts:

1. Install Layercode SDK (check their docs for package name)

2. Create LayercodeClient class:
   - constructor(apiKey: string)
   - Methods:
     * transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult>
     * synthesizeSpeech(text: string, options?: VoiceOptions): Promise<AudioBlob>
     * parseIntent(transcript: string): Promise<IntentResult>
   
3. Voice Configuration:
   - Default voice: Canadian English (neutral accent)
   - Speech rate: 150 WPM
   - Support for emphasis on numbers
   
4. Intent Parsing Configuration:
   Train/configure Layercode to recognize financial intents:
   - set_age: "I'm 58" → {age: 58}
   - set_retirement_age: "I want to retire at 62" → {retirement_age: 62}
   - set_rrsp: "I have 8 million in RRSPs" → {rrsp: 8000000}
   - set_tfsa: "TFSA has 200K" → {tfsa: 200000}
   - set_expenses: "I spend $2500 per month" → {monthly_expenses: 2500}
   - ask_question: "How much can I spend per month?"
   - compare_scenarios: "What if I delay by 3 years?"
   - confirm: "yes", "that's right", "correct"
   - clarify: "I don't know", "skip this"
   
5. Error Handling:
   - Handle low confidence scores (<0.75)
   - Retry logic for network failures
   - Fallback to text input if voice fails
   
6. Create React hook /hooks/useLayercode.ts:
   - Manages Layercode client instance
   - Provides: transcribe(), speak(), parseIntent()
   - Handles loading and error states

Add environment variables to .env.local.example:
- NEXT_PUBLIC_LAYERCODE_API_KEY

Include mock Layercode responses for testing without API calls.
```

**Acceptance Criteria**:
- ✅ Layercode SDK integrated and authenticated
- ✅ Audio transcription works
- ✅ Speech synthesis produces clear audio
- ✅ Intent parsing extracts financial data
- ✅ React hook provides clean interface
- ✅ Error handling robust

---

## Task 3.2: Conversation State Machine

**Objective**: Implement conversation flow logic for gathering retirement planning inputs.

**Claude Code Prompt**:
```
Create conversation state machine in /lib/voice/conversation-manager.ts:

1. Define Conversation Steps (from PRD Section 5.2.1):
   Stage 1 - Foundation (Required):
   - CURRENT_AGE
   - RETIREMENT_AGE
   - LONGEVITY_AGE
   - MONTHLY_EXPENSES
   
   Stage 2 - Assets (Required):
   - RRSP_BALANCE
   - TFSA_BALANCE
   - NON_REGISTERED_BALANCE
   - ANNUAL_CONTRIBUTION
   
   Stage 3 - Assumptions (Optional - offer defaults):
   - POST_RETIREMENT_RETURN (default: 6%)
   - PRE_RETIREMENT_RETURN (default: 6%)
   - INFLATION_RATE (default: 2.5%)
   
   Stage 4 - Government Benefits (Optional):
   - CPP_START_AGE (default: 65)
   - OAS_START_AGE (default: 65)
   - CPP_AMOUNT (estimate if not known)
   
   Stage 5 - Goals (Optional):
   - BEQUEST_GOAL (default: 0)
   - PROVINCE (required for tax)

2. Create ConversationManager class:
   - Properties:
     * currentStep: ConversationStep
     * collectedData: Partial<Scenario>
     * conversationHistory: Message[]
   
   - Methods:
     * getNextQuestion(): string (returns next question text)
     * processUserInput(input: string, intent?: VoiceIntent): void
     * isComplete(): boolean (all required data collected)
     * getScenario(): Scenario (assembles final scenario)
     * goBack(): void (undo last input)
     * skip(): void (use default for optional field)
   
3. Question Templates:
   Create natural, conversational questions for each step:
   - "How old are you today?"
   - "When would you like to retire?"
   - "How long would you like your money to last?"
   - Use variations to avoid repetition
   
4. Response Generation:
   - confirmationMessage(field, value): string
   - clarificationRequest(field): string
   - encouragementMessage(): string
   - completionMessage(summary): string
   
5. Number Parsing:
   - parseAge(input: string): number | null
   - parseAmount(input: string): number | null
   - Handle words: "eight million", "2.5 million", "200K"
   - Handle numbers: "8000000", "2,500,000"
   
6. Create React hook /hooks/useConversation.ts:
   - Manages ConversationManager instance
   - Provides: currentQuestion, submitAnswer(), goBack(), skip()
   - Syncs with voice API

Include comprehensive tests for state transitions.
```

**Acceptance Criteria**:
- ✅ State machine follows logical flow
- ✅ All required data collected before completion
- ✅ Optional fields have sensible defaults
- ✅ Number parsing handles various formats
- ✅ Questions are natural and clear
- ✅ Can go back and correct answers
- ✅ State persists in browser localStorage

---

## Task 3.3: Voice UI Components

**Objective**: Create React components for voice interaction interface.

**Claude Code Prompt**:
```
Create voice UI components in /components/voice/:

1. VoiceButton.tsx - Microphone activation button:
   - States: idle, listening, processing, error
   - Animated pulsing effect when listening
   - Visual feedback for each state
   - Click to toggle recording
   - Props: onStart, onStop, isListening, isProcessing
   
2. VoiceVisualizer.tsx - Audio waveform animation:
   - Display live audio levels during recording
   - Smooth animation using Framer Motion
   - Canvas-based waveform visualization
   
3. TranscriptDisplay.tsx - Show what user said:
   - Display transcript as it arrives
   - Editable text (user can correct)
   - Confidence indicator (if <0.75, highlight for review)
   - Props: transcript, confidence, onEdit
   
4. ConversationPanel.tsx - Main conversation container:
   - Chat-like interface
   - System messages (questions) vs User messages (answers)
   - Auto-scroll to latest message
   - Voice button at bottom
   - "Type instead" fallback button
   - Props: messages, onVoiceInput, onTextInput
   
5. VoiceSettings.tsx - User preferences:
   - Toggle voice on/off
   - Speech speed control (0.75x - 1.5x)
   - Voice selection (if multiple available)
   - Accessible via settings icon
   
6. ProgressIndicator.tsx - Show conversation progress:
   - Visual indicator of conversation stages
   - "3 of 9 questions answered"
   - Stepper component showing current stage
   
7. Create compound component: VoiceInterface.tsx
   - Combines all above components
   - Manages voice input/output flow
   - Integrates with conversation state
   - Props: onComplete (when all data collected)

Use Tailwind for styling, match PRD design system colors.
Use shadcn/ui components where applicable (Button, Card, etc.).
Add accessibility: keyboard navigation, ARIA labels, screen reader support.
```

**Acceptance Criteria**:
- ✅ Voice button has clear visual states
- ✅ Waveform animation is smooth
- ✅ Transcript is editable
- ✅ Conversation UI is intuitive
- ✅ Accessible via keyboard
- ✅ Mobile-responsive
- ✅ Matches design system

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
