/**
 * Scenario Optimizer
 *
 * Binary search optimization algorithms for finding optimal retirement parameters.
 * Used for what-if scenarios like "Exhaust Your Portfolio".
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Scenario } from '@/types/calculator'
import { calculateRetirementProjection } from './engine'

/**
 * Result from optimization algorithm
 */
export interface OptimizationResult {
  optimizedSpending: number
  iterations: number
  finalBalance: number
  success: boolean
  message?: string
}

/**
 * Optimize spending to exhaust portfolio at target age
 *
 * Uses binary search to find the maximum monthly spending that depletes
 * the portfolio to approximately $0 at the user's longevity age.
 *
 * @param client - Supabase client for tax data queries
 * @param baseScenario - User's baseline retirement scenario
 * @param tolerance - Acceptable margin for final balance (default $10,000)
 * @param maxIterations - Maximum search iterations (default 15)
 * @returns Optimization result with optimal spending amount
 */
export async function optimizeSpendingToExhaust(
  client: SupabaseClient,
  baseScenario: Scenario,
  tolerance: number = 10000,
  maxIterations: number = 15
): Promise<OptimizationResult> {
  const baselineMonthly = baseScenario.expenses.fixed_monthly

  // Binary search bounds: 80% to 300% of baseline spending
  let low = baselineMonthly * 0.8
  let high = baselineMonthly * 3.0
  let iterations = 0

  console.log(`🔍 Starting optimization: baseline=${baselineMonthly}, range=[${low}, ${high}]`)

  // Edge case: Check if baseline already exhausts portfolio
  const baselineResults = await calculateRetirementProjection(client, baseScenario)

  if (baselineResults.portfolio_depleted_age) {
    const depletionAge = baselineResults.portfolio_depleted_age
    const longevityAge = baseScenario.basic_inputs.longevity_age

    if (depletionAge < longevityAge) {
      // Portfolio already exhausts before target - need to REDUCE spending
      console.log(`⚠️  Portfolio already exhausts at age ${depletionAge} (target: ${longevityAge})`)

      // Binary search for LOWER spending to reach longevity
      low = baselineMonthly * 0.5 // Could need to cut spending in half
      high = baselineMonthly

      while (high - low > 10 && iterations < maxIterations) {
        const mid = (low + high) / 2
        const testScenario: Scenario = {
          ...baseScenario,
          expenses: {
            ...baseScenario.expenses,
            fixed_monthly: mid
          }
        }

        const results = await calculateRetirementProjection(client, testScenario)
        iterations++

        console.log(`  Iteration ${iterations}: testing $${Math.round(mid)}/mo → depletion age ${results.portfolio_depleted_age || 'never'}`)

        if (!results.portfolio_depleted_age || results.portfolio_depleted_age >= longevityAge) {
          // This spending level works (reaches longevity) - can we spend more?
          low = mid
        } else {
          // Still exhausts too early - need to spend less
          high = mid
        }
      }

      const sustainableSpending = (low + high) / 2
      const finalResults = await calculateRetirementProjection(client, {
        ...baseScenario,
        expenses: { ...baseScenario.expenses, fixed_monthly: sustainableSpending }
      })

      return {
        optimizedSpending: sustainableSpending,
        iterations,
        finalBalance: finalResults.final_portfolio_value,
        success: true,
        message: `Your current spending exhausts your portfolio at age ${depletionAge}. To reach age ${longevityAge}, reduce spending to $${Math.round(sustainableSpending)}/month.`
      }
    }
  }

  // Normal case: Find maximum spending that exhausts at longevity age
  const longevityAge = baseScenario.basic_inputs.longevity_age

  while (high - low > 10 && iterations < maxIterations) {
    const mid = (low + high) / 2
    const testScenario: Scenario = {
      ...baseScenario,
      expenses: {
        ...baseScenario.expenses,
        fixed_monthly: mid
      }
    }

    const results = await calculateRetirementProjection(client, testScenario)
    iterations++

    const depletionAge = results.portfolio_depleted_age
    const finalBalance = results.final_portfolio_value

    console.log(`  Iteration ${iterations}: testing $${Math.round(mid)}/mo → depletion ${depletionAge || 'never'}, balance ${Math.round(finalBalance)}`)

    // Check depletion age, not just final balance
    if (depletionAge) {
      // Portfolio depletes at some age
      if (depletionAge < longevityAge) {
        // Depletes too early - need to spend LESS
        high = mid
      } else {
        // Depletes at or after longevity - this is good, but check if we can spend more
        // If depletion is exactly at longevity (within 1 year), we're done
        if (Math.abs(depletionAge - longevityAge) <= 1) {
          console.log(`✅ Converged at $${Math.round(mid)}/mo (depletes at age ${depletionAge}) after ${iterations} iterations`)
          return {
            optimizedSpending: mid,
            iterations,
            finalBalance,
            success: true
          }
        }
        // Depletes after longevity - can spend slightly more
        low = mid
      }
    } else {
      // Portfolio never depletes - has surplus
      if (finalBalance <= tolerance) {
        // Surplus is small enough - close to optimal
        console.log(`✅ Converged at $${Math.round(mid)}/mo (small surplus $${Math.round(finalBalance)}) after ${iterations} iterations`)
        return {
          optimizedSpending: mid,
          iterations,
          finalBalance,
          success: true
        }
      }
      // Large surplus - can spend more
      low = mid
    }
  }

  // Return best estimate after max iterations
  const finalSpending = (low + high) / 2
  const finalResults = await calculateRetirementProjection(client, {
    ...baseScenario,
    expenses: { ...baseScenario.expenses, fixed_monthly: finalSpending }
  })

  console.log(`✅ Optimization complete: $${Math.round(finalSpending)}/mo after ${iterations} iterations`)

  return {
    optimizedSpending: finalSpending,
    iterations,
    finalBalance: finalResults.final_portfolio_value,
    success: true
  }
}
