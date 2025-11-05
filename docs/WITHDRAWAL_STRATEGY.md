# Withdrawal Strategy Implementation Plan

**Status**: Planning Phase
**Created**: 2025-01-15
**Target Timeline**: 4-5 weeks (19-26 days)

---

## Executive Summary

### The Problem
Beta tester identified that the current "needs-based only" withdrawal approach creates a **tax inefficiency cliff at age 71**:

- Ages 65-70: RRSP untouched if pension + CPP/OAS covers spending
- Age 71: Forced RRIF minimums suddenly double income
- Result: Unnecessary tax spikes and potential OAS clawback

### The Solution
Add a **two-tier system** that separates withdrawal philosophy (Tier 1: Strategy) from scenario exploration (Tier 2: Variants).

**Tier 1: Withdrawal Strategies** (NEW)
- How the engine decides withdrawals each year
- Examples: Tax-Efficient, Fill Tax Bracket, Exhaust Portfolio, Preserve Legacy

**Tier 2: What-If Variants** (EXISTING)
- Scenario explorations within a strategy
- Examples: Front-Load Fun, Delay CPP/OAS, Retire Earlier

---

## Architectural Overview

### Current Architecture
```
User Inputs → [Needs-Based Engine] → Results
                     ↓
              [Variants tweak inputs] → New Results
```

**Problem**: Only one withdrawal philosophy (needs-based), no tax optimization.

### New Architecture
```
User Inputs + Strategy Choice → [Strategy-Aware Engine] → Results
                                          ↓
                                [Variants tweak inputs] → New Results
```

**Benefit**: Strategy determines HOW withdrawals happen, variants explore WHAT IF scenarios within that strategy.

---

## The Four Strategies

### 1. Tax-Efficient (Default - Current Behavior)
**Philosophy**: Withdraw only what's needed for spending
**Sequencing**: Non-registered → RRSP → TFSA
**When to Use**: Default choice, portfolio preservation focus
**Tax Impact**: May create age-71 RRIF minimum cliff

### 2. Fill Tax Bracket (NEW - Solves Beta Tester Concern)
**Philosophy**: Proactively withdraw to fill optimal tax brackets
**Logic**: Take extra RRSP withdrawals in low-income years (pre-71)
**When to Use**: Minimize lifetime taxes, smooth income
**Tax Impact**: Reduces age-71 cliff, lowers lifetime taxes by $150K-300K

**Example**:
- Age 67: Pension $70K + CPP/OAS $25K = $95K income
- Expenses only need $80K (fully covered by income)
- **Fill Bracket**: Withdraw extra $30K from RRSP to fill 20% bracket
- Result: Smooth $125K income pre-71 vs. $180K spike at 71

### 3. Exhaust Portfolio (Moves from Variant to Strategy)
**Philosophy**: Optimize spending to deplete portfolio at longevity
**Logic**: Binary search to find maximum sustainable lifestyle
**When to Use**: Maximize spending, "die with zero" approach
**Tax Impact**: Indirect smoothing via higher early withdrawals

### 4. Preserve Legacy (Optional)
**Philosophy**: Enforce legacy preservation percentage
**Logic**: Reduce withdrawals to maintain target portfolio balance
**When to Use**: Leave inheritance, maintain flexibility
**Tax Impact**: May accept higher future taxes for capital preservation

---

## Implementation Plan: 8 Sprints

### Sprint 1: Foundation (2-3 days)
**Goal**: Add strategy type system

**Tasks**:
1. Add `WithdrawalStrategy` enum to `src/types/calculator.ts`:
   ```typescript
   export enum WithdrawalStrategy {
     TAX_EFFICIENT = 'tax_efficient',
     FILL_TAX_BRACKET = 'fill_tax_bracket',
     EXHAUST_PORTFOLIO = 'exhaust_portfolio',
     PRESERVE_LEGACY = 'preserve_legacy'
   }
   ```

2. Update `Scenario` interface (line 376):
   ```typescript
   export interface Scenario {
     id?: string;
     name: string;
     withdrawal_strategy: WithdrawalStrategy; // NEW FIELD
     basic_inputs: BasicInputs;
     // ... rest of fields
   }
   ```

3. Update `calculateRetirementProjection` in `engine.ts` (line 44):
   ```typescript
   export async function calculateRetirementProjection(
     client: TypedSupabaseClient,
     scenario: Scenario,
     withdrawalStrategy?: WithdrawalStrategy // Optional override
   ): Promise<CalculationResults>
   ```

4. Write unit tests for type changes

**Deliverable**: Type system ready, existing scenarios still work

---

### Sprint 2: Tax-Efficient Strategy (1 day)
**Goal**: Ensure current behavior works with new field

**Tasks**:
1. Add backwards compatibility handling:
   ```typescript
   const strategy = withdrawalStrategy ||
                    scenario.withdrawal_strategy ||
                    WithdrawalStrategy.TAX_EFFICIENT;
   ```

2. Test all scenario loading code defaults missing strategy
3. Verify existing calculations produce identical results
4. Test 8 existing scenarios in database

**Deliverable**: No functional changes, but strategy system is active

---

### Sprint 3: Fill Tax Bracket Strategy (3-4 days)
**Goal**: Implement proactive bracket filling (solves beta tester's concern)

**Tasks**:

1. **Create new function in `tax-calculator.ts`** (after line 437):
   ```typescript
   /**
    * Calculate optimal withdrawal to fill tax bracket threshold
    */
   export async function calculateOptimalBracketWithdrawal(
     client: TypedSupabaseClient,
     currentTaxableIncome: number,
     targetBracketRate: number, // e.g., 0.20 for 20% bracket
     province: Province,
     age: number,
     year: number = 2025
   ): Promise<number> {
     // Get federal and provincial brackets
     const { data: federalBrackets } = await getFederalTaxBrackets(client, year);
     const { data: provincialBrackets } = await getProvincialTaxBrackets(client, province, year);

     // Find target bracket thresholds
     const federalThreshold = findBracketThreshold(federalBrackets, targetBracketRate);
     const provincialThreshold = findBracketThreshold(provincialBrackets, targetBracketRate);

     // Use the more conservative threshold (lower of the two)
     const targetThreshold = Math.min(federalThreshold, provincialThreshold);

     // Calculate room to fill bracket
     const roomInBracket = Math.max(0, targetThreshold - currentTaxableIncome);

     return roomInBracket;
   }

   function findBracketThreshold(brackets: TaxBracket[], targetRate: number): number {
     for (let i = 0; i < brackets.length; i++) {
       if (brackets[i].rate >= targetRate) {
         return brackets[i].limit || Infinity;
       }
     }
     return Infinity;
   }
   ```

2. **Create strategy switch in `engine.ts`** (new function before line 44):
   ```typescript
   async function calculateTargetWithdrawal(
     client: TypedSupabaseClient,
     strategy: WithdrawalStrategy,
     context: {
       annualExpenses: number;
       afterTaxExternalIncome: number;
       oneTimeWithdrawalAmount: number;
       currentBalances: AccountBalances;
       age: number;
       province: Province;
       taxableIncome: number;
     }
   ): Promise<number> {
     switch (strategy) {
       case WithdrawalStrategy.TAX_EFFICIENT:
         // Current behavior: withdraw only what's needed
         return Math.max(0, context.annualExpenses - context.afterTaxExternalIncome)
                + context.oneTimeWithdrawalAmount;

       case WithdrawalStrategy.FILL_TAX_BRACKET:
         // Calculate base withdrawal for expenses
         const baseWithdrawal = Math.max(0, context.annualExpenses - context.afterTaxExternalIncome);

         // Calculate additional withdrawal to fill bracket
         const additionalForBracket = await calculateOptimalBracketWithdrawal(
           client,
           context.taxableIncome,
           0.20, // Target 20% combined rate (configurable)
           context.province,
           context.age
         );

         // Only withdraw extra if portfolio can support it
         const extraWithdrawal = Math.min(
           additionalForBracket,
           context.currentBalances.total * 0.05 // Cap at 5% of portfolio
         );

         return baseWithdrawal + extraWithdrawal + context.oneTimeWithdrawalAmount;

       default:
         return Math.max(0, context.annualExpenses - context.afterTaxExternalIncome)
                + context.oneTimeWithdrawalAmount;
     }
   }
   ```

3. **Replace calculation in engine.ts** (line 378):
   ```typescript
   // OLD:
   // const targetWithdrawal = Math.max(0, annualExpenses - afterTaxExternalIncome) + oneTimeWithdrawalAmount;

   // NEW:
   const targetWithdrawal = await calculateTargetWithdrawal(
     client,
     strategy,
     {
       annualExpenses,
       afterTaxExternalIncome,
       oneTimeWithdrawalAmount,
       currentBalances,
       age,
       province,
       taxableIncome: governmentBenefits
     }
   );
   ```

4. **Write comprehensive tests**:
   - Test bracket threshold calculation with different provinces
   - Integration test showing pre-71 RRSP withdrawals
   - Compare Tax-Efficient vs Fill Bracket lifetime taxes
   - Edge case: Income already at bracket threshold

**Deliverable**: Fill Tax Bracket strategy working, prevents age-71 cliff

---

### Sprint 4: Exhaust Portfolio Strategy (4-5 days)
**Goal**: Move exhaust logic from variant to strategy

**Tasks**:

1. **Refactor `scenario-variants.ts`** (lines 132-145):
   ```typescript
   /**
    * Create "Exhaust Portfolio" variant
    * Changes withdrawal strategy to optimize spending
    */
   export function createExhaustPortfolioVariant(
     baseScenario: Scenario,
     optimizedSpending?: number // Optional: Pre-calculated
   ): Scenario {
     return {
       ...baseScenario,
       name: 'Exhaust Your Portfolio',
       withdrawal_strategy: WithdrawalStrategy.EXHAUST_PORTFOLIO, // NEW
       expenses: {
         ...baseScenario.expenses,
         // Only override spending if provided (for backwards compatibility)
         ...(optimizedSpending ? { fixed_monthly: optimizedSpending } : {})
       }
     }
   }
   ```

2. **Add EXHAUST_PORTFOLIO case to strategy switch**:
   ```typescript
   case WithdrawalStrategy.EXHAUST_PORTFOLIO:
     // Binary search optimization happens in scenario-optimizer.ts
     // For now, use needs-based withdrawal
     // Optimization wrapper will adjust spending to achieve exhaustion
     return Math.max(0, context.annualExpenses - context.afterTaxExternalIncome)
            + context.oneTimeWithdrawalAmount;
   ```

3. **Update binary search in `scenario-optimizer.ts`**:
   - The existing binary search (lines 35-168) already works
   - Ensure it respects the strategy field when creating test scenarios
   - No major changes needed (just set strategy field)

4. **Write tests**:
   - Portfolio exhausts at longevity age (within $10K tolerance)
   - Spending optimized to maximum sustainable level
   - Test with different starting portfolios

**Deliverable**: Exhaust Portfolio works as both strategy and variant

---

### Sprint 5: UI Integration (3-4 days)
**Goal**: Add strategy selector to calculator form

**Tasks**:

1. **Create new component** `src/components/calculator/WithdrawalStrategySelector.tsx`:
   ```typescript
   interface WithdrawalStrategySelectorProps {
     value: WithdrawalStrategy;
     onChange: (strategy: WithdrawalStrategy) => void;
     longevityAge: number; // For contextual help
   }

   export function WithdrawalStrategySelector({ value, onChange, longevityAge }: Props) {
     return (
       <Card>
         <CardHeader>
           <CardTitle>Withdrawal Strategy</CardTitle>
         </CardHeader>
         <CardContent>
           <select value={value} onChange={(e) => onChange(e.target.value as WithdrawalStrategy)}>
             <option value={WithdrawalStrategy.TAX_EFFICIENT}>
               Tax-Efficient (Standard)
             </option>
             <option value={WithdrawalStrategy.FILL_TAX_BRACKET}>
               Fill Tax Bracket (Minimize Lifetime Taxes)
             </option>
             <option value={WithdrawalStrategy.EXHAUST_PORTFOLIO}>
               Exhaust Portfolio (Maximize Spending)
             </option>
             <option value={WithdrawalStrategy.PRESERVE_LEGACY}>
               Preserve Legacy (Leave Inheritance)
             </option>
           </select>

           {/* Contextual help text */}
           {value === WithdrawalStrategy.TAX_EFFICIENT && (
             <p className="text-sm text-muted-foreground">
               Standard approach: Withdraw from taxable accounts first, then RRSP, finally TFSA.
               Only withdraws what's needed for expenses each year.
             </p>
           )}
           {value === WithdrawalStrategy.FILL_TAX_BRACKET && (
             <p className="text-sm text-muted-foreground">
               Takes extra RRSP withdrawals in low-income years to fill optimal tax brackets.
               Prevents age-71 RRIF minimum spike and reduces lifetime taxes.
             </p>
           )}
           {/* ... other help text */}
         </CardContent>
       </Card>
     );
   }
   ```

2. **Update `VoiceFirstContentV2.tsx`**:

   **Add state** (after line 68):
   ```typescript
   const [withdrawalStrategy, setWithdrawalStrategy] = useState<WithdrawalStrategy>(
     WithdrawalStrategy.TAX_EFFICIENT
   );
   ```

   **Reset in handleStartPlanning** (around line 199):
   ```typescript
   setWithdrawalStrategy(WithdrawalStrategy.TAX_EFFICIENT);
   ```

   **Add to form** (after expenses section, before calculate button):
   ```typescript
   <WithdrawalStrategySelector
     value={withdrawalStrategy}
     onChange={setWithdrawalStrategy}
     longevityAge={longevityAge}
   />
   ```

   **Update scenario building** (where scenario is constructed):
   ```typescript
   const scenario: Scenario = {
     name: loadedScenarioName || 'My Retirement Plan',
     withdrawal_strategy: withdrawalStrategy, // NEW FIELD
     basic_inputs: { /* ... */ },
     // ... rest of scenario
   };
   ```

3. **Add form validation**:
   - Ensure strategy is always set (not undefined)
   - Validate strategy + expense combinations (e.g., PRESERVE_LEGACY needs legacy_preservation_percentage)

**Deliverable**: Users can select strategy in UI, it persists through calculations

---

### Sprint 6: Results Display (2-3 days)
**Goal**: Show strategy in results and comparisons

**Tasks**:

1. **Update `ResultsSummary` component**:
   ```typescript
   <div className="flex items-center gap-2">
     <span className="text-muted-foreground">Withdrawal Strategy:</span>
     <span className="font-medium">
       {getStrategyDisplayName(scenario.withdrawal_strategy)}
     </span>
   </div>
   ```

2. **Add strategy badges to `ScenarioComparison.tsx`** (around line 146):
   ```typescript
   <button className={tabClasses}>
     <span>{scenario.name}</span>
     {scenario.withdrawal_strategy !== WithdrawalStrategy.TAX_EFFICIENT && (
       <span className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900">
         {getStrategyDisplayName(scenario.withdrawal_strategy)}
       </span>
     )}
   </button>
   ```

3. **Update AI narrative generation**:
   - Pass strategy to narrative prompt
   - Add explanation of withdrawal approach
   - Example: "This plan uses the Fill Tax Bracket strategy, which takes extra RRSP withdrawals in low-income years to minimize lifetime taxes."

4. **Create helper function** `src/lib/utils/strategy-helpers.ts`:
   ```typescript
   export function getStrategyDisplayName(strategy: WithdrawalStrategy): string {
     switch (strategy) {
       case WithdrawalStrategy.TAX_EFFICIENT:
         return 'Tax-Efficient';
       case WithdrawalStrategy.FILL_TAX_BRACKET:
         return 'Fill Tax Bracket';
       case WithdrawalStrategy.EXHAUST_PORTFOLIO:
         return 'Exhaust Portfolio';
       case WithdrawalStrategy.PRESERVE_LEGACY:
         return 'Preserve Legacy';
       default:
         return 'Unknown Strategy';
     }
   }
   ```

**Deliverable**: Strategy choice is visible and explained in results

---

### Sprint 7: Testing & Polish (3-4 days)
**Goal**: Complete test coverage and edge cases

**Tasks**:

1. **Create comprehensive test suite** `/src/lib/calculations/__tests__/withdrawal-strategies.spec.ts`:
   ```typescript
   describe('Withdrawal Strategies', () => {
     it('should use tax-efficient sequencing by default', async () => {
       // Test current behavior with TAX_EFFICIENT strategy
     });

     it('should fill tax bracket with FILL_TAX_BRACKET strategy', async () => {
       // Verify withdrawals exceed minimum needs
       // Check that income is smoothed pre-71
     });

     it('should deplete portfolio at longevity with EXHAUST_PORTFOLIO strategy', async () => {
       // Test binary search optimization
     });

     it('should preserve legacy with PRESERVE_LEGACY strategy', async () => {
       // Verify portfolio maintains target percentage
     });

     it('should allow different strategies for baseline vs variants', async () => {
       // Test strategy + variant combinations
     });
   });
   ```

2. **Additional test files**:
   - `/src/lib/calculations/__tests__/optimal-bracket.spec.ts` - Bracket filling logic
   - `/src/lib/calculations/__tests__/strategy-sequencing.spec.ts` - Withdrawal sequencing
   - `/src/components/calculator/__tests__/strategy-selector.spec.ts` - UI component

3. **Manual testing checklist**:
   - [ ] Select each strategy in UI
   - [ ] Calculate and verify results make sense
   - [ ] Save scenario with strategy
   - [ ] Load scenario and verify strategy persisted
   - [ ] Generate variants with different strategies
   - [ ] Test dark mode for strategy selector
   - [ ] Test mobile responsive layout
   - [ ] Performance test (calculation time <2s)

4. **Edge case testing**:
   - [ ] Empty RRSP account with FILL_TAX_BRACKET
   - [ ] RRIF minimums exceed needs
   - [ ] Multiple strategies on same scenario
   - [ ] Strategy + one-time withdrawal interaction
   - [ ] Strategy + age-based expense changes

5. **UI polish**:
   - Clear help text for each strategy
   - Consistent dark mode styling
   - Mobile responsive (test on phone)
   - Loading states during calculation

**Deliverable**: Fully tested, production-ready feature

---

### Sprint 8: Migration & Deployment (1-2 days)
**Goal**: Deploy to production safely

**Tasks**:

1. **Optional database migration**:
   ```sql
   -- Backfill existing scenarios with default strategy
   UPDATE scenarios
   SET inputs = jsonb_set(
     inputs,
     '{withdrawal_strategy}',
     '"tax_efficient"'
   )
   WHERE inputs->>'withdrawal_strategy' IS NULL;
   ```
   **Note**: This is optional since code handles missing field gracefully.

2. **Build verification**:
   ```bash
   npm run build 2>&1 | head -n 50
   ```
   Verify no TypeScript errors, production build succeeds.

3. **Staging deployment**:
   - Deploy to staging environment
   - Run smoke tests with all strategies
   - Test with real user scenarios

4. **Production deployment**:
   - Deploy to production
   - Monitor error logs for first 24 hours
   - Check performance metrics (calculation time)
   - Monitor database queries (no N+1 issues)

5. **Post-launch monitoring**:
   - Track which strategies users choose
   - Monitor calculation performance
   - Watch for error reports
   - Collect user feedback

**Deliverable**: Feature live in production, monitoring active

---

## Key Technical Details

### Critical Code Changes

**1. Engine Injection Point** (`engine.ts` line 378)
```typescript
// BEFORE:
const targetWithdrawal = Math.max(0, annualExpenses - afterTaxExternalIncome) + oneTimeWithdrawalAmount;

// AFTER:
const targetWithdrawal = await calculateTargetWithdrawal(
  client,
  strategy,
  { annualExpenses, afterTaxExternalIncome, oneTimeWithdrawalAmount, currentBalances, age, province, taxableIncome: governmentBenefits }
);
```

**2. Withdrawal Sequencing** (`accounts.ts` lines 188-264)
- Current sequencing logic DOES NOT CHANGE
- Strategy determines HOW MUCH to withdraw
- Sequencing determines WHICH ACCOUNTS to withdraw from
- Still follows: Non-reg → RRSP → TFSA

**3. Backwards Compatibility**
```typescript
// All scenario loading must default missing strategy
const strategy = scenario.withdrawal_strategy || WithdrawalStrategy.TAX_EFFICIENT;
```

---

## Files Modified

| File | Lines | Change | Complexity |
|------|-------|--------|-----------|
| `src/types/calculator.ts` | After 6, 376-397 | Add enum, update interface | Low |
| `src/lib/calculations/engine.ts` | 44-550 | Add strategy parameter, inject logic | Medium |
| `src/lib/calculations/tax-calculator.ts` | After 437 | Add bracket filling functions | Medium |
| `src/lib/calculations/scenario-variants.ts` | 132-145 | Refactor exhaust variant | Low |
| `src/app/calculator/home/VoiceFirstContentV2.tsx` | Multiple | Add UI selector, state management | Medium |
| `src/components/results/ScenarioComparison.tsx` | ~146 | Add strategy badges | Low |

---

## New Files Created

1. **`src/components/calculator/WithdrawalStrategySelector.tsx`**
   - Reusable strategy selector component
   - Contextual help for each strategy
   - Dark mode support

2. **`src/lib/utils/strategy-helpers.ts`**
   - Helper functions like `getStrategyDisplayName()`
   - Strategy validation
   - Default strategy resolution

3. **`src/lib/calculations/__tests__/withdrawal-strategies.spec.ts`**
   - Comprehensive test suite for all strategies
   - Edge case coverage
   - Integration tests

4. **`src/lib/calculations/__tests__/optimal-bracket.spec.ts`**
   - Tests for bracket filling calculation
   - Province-specific tests
   - Threshold calculation tests

---

## Timeline & Effort

**Total Estimated Duration**: 19-26 days (4-5 weeks)

**Breakdown**:
- Sprint 1 (Foundation): 2-3 days
- Sprint 2 (Tax-Efficient): 1 day
- Sprint 3 (Fill Tax Bracket): 3-4 days ⭐ **Main value**
- Sprint 4 (Exhaust Portfolio): 4-5 days
- Sprint 5 (UI Integration): 3-4 days
- Sprint 6 (Results Display): 2-3 days
- Sprint 7 (Testing & Polish): 3-4 days
- Sprint 8 (Deployment): 1-2 days

**Critical Path**: Sprints must be sequential (each builds on previous)

**Minimum Viable Implementation**: Sprints 1-3 + 5-8 (skip Exhaust Portfolio initially) = 3 weeks

---

## Risks & Mitigations

### Risk 1: Breaking Existing Scenarios (HIGH)
**Probability**: Medium
**Impact**: High (8 scenarios in database)
**Mitigation**:
- Default missing strategy to TAX_EFFICIENT
- Comprehensive backwards compatibility tests
- Database migration optional (code handles missing field)
- Test all 8 existing scenarios before deployment

### Risk 2: Complex Binary Search for Exhaust Portfolio (MEDIUM)
**Probability**: Medium
**Impact**: Medium (delays Exhaust Portfolio strategy)
**Mitigation**:
- Binary search already exists in scenario-optimizer.ts
- Refactor existing code, don't rewrite
- Implement simpler strategies (Tax-Efficient, Fill Bracket) first
- Exhaust Portfolio can be Phase 2 if needed

### Risk 3: User Confusion - Strategy vs Variant (MEDIUM)
**Probability**: High
**Impact**: Low (reduces adoption)
**Mitigation**:
- Clear UI labeling: "Withdrawal Strategy" section separate from "What-If Scenarios"
- Contextual help text explaining each option
- Good defaults (Tax-Efficient for new scenarios)
- Educational content in help sidebar

### Risk 4: Performance Impact (LOW)
**Probability**: Low
**Impact**: Medium (slower calculations)
**Mitigation**:
- Profile calculation speed before/after
- Cache bracket calculations across years
- Optimize binary search iterations if needed
- Target: Keep calculation time <2 seconds

### Risk 5: Strategy + Variant Conflicts (LOW)
**Probability**: Low
**Impact**: Low (confusing combinations)
**Mitigation**:
- Clear mental model: Strategy = tier 1, Variant = tier 2
- Document valid combinations
- Disable conflicting variants if needed
- Test all strategy + variant permutations

---

## Open Questions

**Before starting implementation, decide:**

### Q1: Target bracket for Fill Tax Bracket strategy?
**Options**:
- A) Fixed 20% combined federal+provincial rate
- B) Configurable (user picks target)
- C) Intelligent (targets highest bracket below OAS clawback threshold)

**Recommendation**: Start with A (fixed 20%), make configurable in Phase 2.

### Q2: Should Preserve Legacy be separate strategy or stay in expenses?
**Options**:
- A) Keep legacy_preservation_percentage in expenses only
- B) Add PRESERVE_LEGACY strategy that enforces it strictly
- C) Both (strategy is strict mode, expenses is soft goal)

**Recommendation**: Start with A (keep in expenses), add strategy if users request strict enforcement.

### Q3: Allow strategy changes mid-projection?
**Example**: Use TAX_EFFICIENT ages 65-75, then switch to EXHAUST_PORTFOLIO at 75.

**Options**:
- A) Single strategy for entire projection (simpler)
- B) Allow strategy changes at specific ages

**Recommendation**: Start with A (single strategy), add B as Phase 2 feature if requested.

### Q4: What happens to existing "Exhaust Portfolio" variant?
**Options**:
- A) Keep only as variant (spending tweak)
- B) Keep only as strategy (withdrawal philosophy)
- C) Both (variant sets strategy field)

**Recommendation**: C - Variant becomes a way to explore the strategy.

### Q5: Database migration required or optional?
**Options**:
- A) Required (backfill all scenarios before deploying)
- B) Optional (code handles missing field)

**Recommendation**: B (optional) - Code defaults missing field, migration just cleans up data.

### Q6: Should we show "years until RRIF minimum" warning?
**Options**:
- A) Show countdown in UI: "RRIF minimums start in 5 years"
- B) Show warning if using TAX_EFFICIENT: "Consider Fill Tax Bracket to avoid age-71 spike"
- C) No warnings (let users discover via comparison)

**Recommendation**: B - Show educational warning for TAX_EFFICIENT strategy.

---

## Success Criteria

### Must Have (Launch Blockers)
- [ ] Beta tester's concern addressed (Fill Tax Bracket prevents age-71 cliff)
- [ ] Four strategies implemented: Tax-Efficient, Fill Tax Bracket, Exhaust Portfolio, Preserve Legacy
- [ ] UI allows strategy selection with clear explanations
- [ ] Existing 8 scenarios continue to work without modification
- [ ] Strategy + variant combinations work correctly
- [ ] Full test coverage (unit + integration)
- [ ] Production build passes
- [ ] Performance maintains <2s calculation time

### Should Have (Quality Goals)
- [ ] Strategy shown in results summary
- [ ] Strategy badges in comparison tabs
- [ ] AI narratives explain strategy choice
- [ ] Mobile responsive strategy selector
- [ ] Dark mode support throughout
- [ ] Comprehensive error handling
- [ ] Database migration script (optional execution)

### Nice to Have (Future Enhancements)
- [ ] Configurable target bracket for Fill Tax Bracket
- [ ] Mid-projection strategy changes (e.g., at age 75)
- [ ] Strategy recommendations based on user profile
- [ ] Tax savings calculator (compare strategies side-by-side)
- [ ] Income splitting strategies (when spouse present)
- [ ] OAS clawback avoidance as explicit strategy

---

## Post-Launch Plan

### Phase 2 Features (3-6 months post-launch)
1. **Advanced Fill Tax Bracket**
   - Configurable target bracket (user chooses 15%, 20%, 26%, 29%)
   - Provincial-specific optimization
   - OAS clawback threshold awareness

2. **Hybrid Strategies**
   - Combine strategies (e.g., "Fill Bracket until age 75, then Exhaust")
   - User-defined rules (e.g., "Withdraw extra if balance > $500K")
   - Age-based strategy transitions

3. **Strategy Recommendations**
   - AI-powered strategy suggestions based on user profile
   - "Which strategy is best for me?" wizard
   - Compare all strategies side-by-side in one view

4. **Income Splitting** (when spouse present)
   - Optimize income between spouses
   - Pension splitting rules
   - CPP sharing strategies

### Phase 3 Features (6-12 months post-launch)
1. **Monte Carlo with Strategies**
   - Probability of success with each strategy
   - Risk analysis for different strategies
   - Sensitivity analysis

2. **Strategy API**
   - RESTful API for advisors
   - Batch strategy comparison
   - Custom strategy definitions

3. **Educational Content**
   - Video tutorials on each strategy
   - Case studies (when to use which strategy)
   - Blog posts on tax optimization

---

## Appendix A: Example Calculation Comparison

### Scenario: High Pension, Moderate Portfolio
**Profile**:
- Age 65, retiring now
- Pension: $70K/year (indexed)
- CPP/OAS: $25K/year (starting age 65)
- RRSP: $800K
- TFSA: $150K
- Non-registered: $100K
- Expenses: $80K/year (indexed)
- Longevity: 95

### Strategy 1: Tax-Efficient (Current Default)

**Ages 65-70**:
- Income: Pension $70K + CPP/OAS $25K = $95K
- Expenses: $80K
- Surplus covers everything → **RRSP untouched**
- Tax: ~$20K/year (21% effective rate)

**Age 71 (RRIF Conversion)**:
- RRSP now $1.1M (grew 5% for 6 years)
- RRIF minimum: 5.28% × $1.1M = **$58K forced withdrawal**
- Income: Pension $70K + CPP/OAS $25K + RRIF $58K = **$153K**
- Tax: ~$45K/year (**35% effective rate** - jumped 14 points!)
- OAS clawback: Partial (~$3K/year lost)

**Lifetime Taxes (ages 65-95)**: ~$950K

---

### Strategy 2: Fill Tax Bracket (Optimized)

**Ages 65-70**:
- Income: Pension $70K + CPP/OAS $25K = $95K
- Expenses: $80K
- **Fill 20% bracket**: Withdraw extra $30K from RRSP (room in bracket)
- Total Income: $95K + $30K = $125K
- Tax: ~$26K/year (21% effective rate - same rate, more income taxed)
- RRSP drawn down proactively: $800K → $600K by age 71

**Age 71 (RRIF Conversion)**:
- RRSP now $650K (grew but also drawn down)
- RRIF minimum: 5.28% × $650K = **$34K forced withdrawal**
- Income: Pension $70K + CPP/OAS $25K + RRIF $34K = **$129K**
- Tax: ~$32K/year (25% effective rate - **10 points lower than Strategy 1!**)
- OAS clawback: Minimal (~$1K/year)

**Lifetime Taxes (ages 65-95)**: ~$800K

**Savings**: **$150K less in lifetime taxes** vs. Tax-Efficient strategy!

---

### Key Insight
By taking extra withdrawals in ages 65-70 (when income is low), we:
1. Fill unused room in lower tax brackets
2. Reduce RRSP balance before forced RRIF minimums
3. Smooth income across retirement (no 71-year spike)
4. Avoid OAS clawback or reduce it significantly
5. **Save 6 figures in lifetime taxes**

This is what the Fill Tax Bracket strategy accomplishes.

---

## Appendix B: Code Snippets

### Full Strategy Switch Implementation

```typescript
/**
 * Calculate target withdrawal based on strategy
 *
 * This is the core decision point where withdrawal philosophy is applied.
 * Called once per year during retirement phase of projection.
 */
async function calculateTargetWithdrawal(
  client: TypedSupabaseClient,
  strategy: WithdrawalStrategy,
  context: {
    annualExpenses: number;
    afterTaxExternalIncome: number;
    oneTimeWithdrawalAmount: number;
    currentBalances: AccountBalances;
    age: number;
    province: Province;
    taxableIncome: number;
    legacyPreservation?: number;
    retirementAge: number;
    longevityAge: number;
    yearsIntoRetirement: number;
  }
): Promise<number> {
  switch (strategy) {
    case WithdrawalStrategy.TAX_EFFICIENT:
      // Current behavior: withdraw only what's needed for expenses
      return Math.max(0, context.annualExpenses - context.afterTaxExternalIncome)
             + context.oneTimeWithdrawalAmount;

    case WithdrawalStrategy.FILL_TAX_BRACKET:
      // Calculate base withdrawal for expenses
      const baseWithdrawal = Math.max(0, context.annualExpenses - context.afterTaxExternalIncome);

      // Calculate additional withdrawal to fill optimal tax bracket
      const additionalForBracket = await calculateOptimalBracketWithdrawal(
        client,
        context.taxableIncome,
        0.20, // Target 20% combined rate (configurable in future)
        context.province,
        context.age
      );

      // Only withdraw extra if:
      // 1. We have room in lower brackets (additionalForBracket > 0)
      // 2. Portfolio can support it (cap at 5% of total)
      // 3. We're not too close to longevity (stop 5 years before)
      const yearsRemaining = context.longevityAge - context.age;
      const shouldFillBracket = yearsRemaining > 5;

      const extraWithdrawal = shouldFillBracket
        ? Math.min(additionalForBracket, context.currentBalances.total * 0.05)
        : 0;

      return baseWithdrawal + extraWithdrawal + context.oneTimeWithdrawalAmount;

    case WithdrawalStrategy.EXHAUST_PORTFOLIO:
      // Binary search optimization happens in scenario-optimizer.ts
      // Engine uses needs-based withdrawal, optimizer adjusts spending to achieve exhaustion
      return Math.max(0, context.annualExpenses - context.afterTaxExternalIncome)
             + context.oneTimeWithdrawalAmount;

    case WithdrawalStrategy.PRESERVE_LEGACY:
      // Calculate minimum withdrawal needed
      const minWithdrawal = Math.max(0, context.annualExpenses - context.afterTaxExternalIncome);

      // Calculate target legacy amount
      const targetLegacy = context.legacyPreservation
        ? context.currentBalances.total * context.legacyPreservation
        : 0;

      // If we're below target, reduce withdrawal by 20% (gradual reduction)
      if (targetLegacy > 0 && context.currentBalances.total < targetLegacy * 1.1) {
        return minWithdrawal * 0.8 + context.oneTimeWithdrawalAmount;
      }

      return minWithdrawal + context.oneTimeWithdrawalAmount;

    default:
      // Fallback to needs-based
      return Math.max(0, context.annualExpenses - context.afterTaxExternalIncome)
             + context.oneTimeWithdrawalAmount;
  }
}
```

---

## Appendix C: Database Schema Reference

### Current `scenarios` Table Structure
```typescript
{
  id: UUID,
  user_id: UUID,
  name: TEXT,
  inputs: JSONB,  // ← Strategy will be stored here
  results: JSONB,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  source: TEXT,
  share_token: TEXT,
  is_shared: BOOLEAN,
  shared_at: TIMESTAMP
}
```

### `inputs` JSONB Structure (After Changes)
```typescript
{
  withdrawal_strategy: 'tax_efficient' | 'fill_tax_bracket' | 'exhaust_portfolio' | 'preserve_legacy',
  basic_inputs: { ... },
  assets: { ... },
  income_sources: { ... },
  expenses: { ... },
  assumptions: { ... },
  __baseline_narrative: string,  // Existing AI content
  __metadata: { ... }             // Existing variant metadata
}
```

**Note**: No database migration required. New field added to existing JSONB column.

---

## Next Steps

### To Proceed:
1. **Review this plan** and provide feedback
2. **Answer open questions** (see "Open Questions" section)
3. **Approve implementation** or request modifications
4. **Start Sprint 1** (Foundation, 2-3 days)

### Questions for You:
1. Does the 4-5 week timeline work for your roadmap?
2. Should we implement all 4 strategies, or start with Tax-Efficient + Fill Tax Bracket?
3. Any concerns about the two-tier architecture (Strategy vs Variant)?
4. Do you want to see a prototype of the Fill Tax Bracket calculation before full implementation?

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Status**: Awaiting approval
