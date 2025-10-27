/**
 * Quick test to verify pension calculation
 * Run with: npx tsx test-pension-calculation.ts
 */

import { calculateRetirementProjection } from './src/lib/calculations/engine'
import { createClient } from '@supabase/supabase-js'
import { Scenario } from './src/types/calculator'
import { Province } from './src/types/constants'

async function testPensionCalculation() {
  console.log('🧪 Testing pension calculation...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const scenario: Scenario = {
    name: 'Test Pension Scenario',
    basic_inputs: {
      current_age: 58,
      retirement_age: 65,
      longevity_age: 95,
      province: Province.BC,
    },
    assets: {
      rrsp: {
        balance: 200000,
        annual_contribution: 5000,
        rate_of_return: 0.06,
      },
      tfsa: {
        balance: 100000,
        annual_contribution: 2000,
        rate_of_return: 0.06,
      },
      non_registered: {
        balance: 50000,
        annual_contribution: 2000,
        rate_of_return: 0.06,
        cost_base: 35000,
      },
    },
    income_sources: {
      cpp: {
        monthly_amount_at_65: 1364.60,
        start_age: 60,
      },
      oas: {
        monthly_amount: 713.34,
        start_age: 65,
      },
      other_income: [
        {
          description: 'Pension',
          annual_amount: 80000,
          start_age: 65,
          indexed_to_inflation: false,
        },
      ],
    },
    expenses: {
      fixed_monthly: 12000,
      variable_annual: 0,
      indexed_to_inflation: true,
      age_based_changes: [],
    },
    assumptions: {
      pre_retirement_return: 0.06,
      post_retirement_return: 0.04,
      inflation_rate: 0.02,
    },
  }

  const results = await calculateRetirementProjection(supabase, scenario)

  console.log('📊 Results Summary:')
  console.log(`   Success: ${results.success}`)
  console.log(`   Final Portfolio Value: $${results.final_portfolio_value.toLocaleString()}`)
  console.log(`   Portfolio Depleted Age: ${results.portfolio_depleted_age || 'Never'}`)
  console.log(`   First Year Retirement Income: $${results.first_year_retirement_income.toLocaleString()}`)
  console.log('')

  // Check age 65, 68, 70
  const ages = [65, 68, 70, 75, 80]
  console.log('📈 Year-by-Year Breakdown:')
  for (const age of ages) {
    const year = results.year_by_year.find(y => y.age === age)
    if (year) {
      console.log(`\nAge ${age}:`)
      console.log(`   Portfolio Balance: $${year.balances.total.toLocaleString()}`)
      console.log(`   Income - CPP: $${year.income.cpp.toLocaleString()}`)
      console.log(`   Income - OAS: $${year.income.oas.toLocaleString()}`)
      console.log(`   Income - Other (Pension): $${year.income.other.toLocaleString()}`)
      console.log(`   Total Income: $${year.income.total.toLocaleString()}`)
      console.log(`   Expenses: $${year.expenses.toLocaleString()}`)
      console.log(`   Withdrawals: $${year.withdrawals.total.toLocaleString()}`)
      console.log(`   Taxes: $${year.tax.total.toLocaleString()}`)
    }
  }
}

testPensionCalculation().catch(console.error)
