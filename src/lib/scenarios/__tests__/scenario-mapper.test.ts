/**
 * Tests for scenario-mapper.ts
 *
 * Tests bidirectional transformation between form data and Scenario structure.
 */

import { describe, it, expect } from 'vitest'
import {
  formDataToScenario,
  scenarioToFormData,
  getDefaultScenarioName,
  type FormData,
} from '../scenario-mapper'
import { Province } from '@/types/constants'
import { Scenario } from '@/types/calculator'

describe('scenario-mapper', () => {
  describe('getDefaultScenarioName', () => {
    it('should generate name with current date', () => {
      const name = getDefaultScenarioName()
      expect(name).toMatch(/^Retirement Plan - \w{3} \d{1,2}, \d{4}$/)
      expect(name).toContain('Retirement Plan')
    })
  })

  describe('formDataToScenario', () => {
    it('should convert complete form data to scenario', () => {
      const formData: FormData = {
        currentAge: 55,
        retirementAge: 65,
        longevityAge: 90,
        province: Province.ON,
        currentIncome: 100000,
        rrspAmount: 500000,
        tfsaAmount: 100000,
        nonRegisteredAmount: 200000,
        rrspContribution: 20000,
        tfsaContribution: 7000,
        nonRegisteredContribution: 10000,
        monthlySpending: 5000,
        pensionIncome: 2000,
        otherIncome: 12000,
        cppStartAge: 65,
        investmentReturn: 6,
        postRetirementReturn: 4,
        inflationRate: 2,
      }

      const scenario = formDataToScenario(formData, 'Test Scenario')

      expect(scenario.name).toBe('Test Scenario')
      expect(scenario.basic_inputs.current_age).toBe(55)
      expect(scenario.basic_inputs.retirement_age).toBe(65)
      expect(scenario.basic_inputs.longevity_age).toBe(90)
      expect(scenario.basic_inputs.province).toBe(Province.ON)

      expect(scenario.assets.rrsp?.balance).toBe(500000)
      expect(scenario.assets.rrsp?.annual_contribution).toBe(20000)
      expect(scenario.assets.rrsp?.rate_of_return).toBe(0.06)

      expect(scenario.assets.tfsa?.balance).toBe(100000)
      expect(scenario.assets.tfsa?.annual_contribution).toBe(7000)
      expect(scenario.assets.tfsa?.rate_of_return).toBe(0.06)

      expect(scenario.assets.non_registered?.balance).toBe(200000)
      expect(scenario.assets.non_registered?.cost_base).toBe(140000) // 70%
      expect(scenario.assets.non_registered?.annual_contribution).toBe(10000)
      expect(scenario.assets.non_registered?.rate_of_return).toBe(0.06)

      expect(scenario.income_sources.cpp?.start_age).toBe(65)
      expect(scenario.income_sources.cpp?.monthly_amount_at_65).toBe(1364.60)

      expect(scenario.income_sources.oas?.start_age).toBe(65)
      expect(scenario.income_sources.oas?.monthly_amount).toBe(713.34)

      expect(scenario.income_sources.other_income).toHaveLength(2)
      const pension = scenario.income_sources.other_income?.find(i => i.description === 'Pension')
      expect(pension?.annual_amount).toBe(24000) // 2000 * 12
      const other = scenario.income_sources.other_income?.find(i => i.description === 'Other Income')
      expect(other?.annual_amount).toBe(12000)

      expect(scenario.expenses.fixed_monthly).toBe(5000)
      expect(scenario.expenses.indexed_to_inflation).toBe(true)

      expect(scenario.assumptions.pre_retirement_return).toBe(0.06)
      expect(scenario.assumptions.post_retirement_return).toBe(0.04)
      expect(scenario.assumptions.inflation_rate).toBe(0.02)
    })

    it('should handle minimal form data with defaults', () => {
      const formData: FormData = {
        currentAge: 50,
        retirementAge: null,
        longevityAge: null,
        province: null,
        currentIncome: null,
        rrspAmount: null,
        tfsaAmount: null,
        nonRegisteredAmount: null,
        rrspContribution: null,
        tfsaContribution: null,
        nonRegisteredContribution: null,
        monthlySpending: null,
        pensionIncome: null,
        otherIncome: null,
        cppStartAge: null,
        investmentReturn: null,
        postRetirementReturn: null,
        inflationRate: null,
      }

      const scenario = formDataToScenario(formData, 'Minimal Plan')

      expect(scenario.name).toBe('Minimal Plan')
      expect(scenario.basic_inputs.current_age).toBe(50)
      expect(scenario.basic_inputs.retirement_age).toBe(65) // Default
      expect(scenario.basic_inputs.longevity_age).toBe(95) // Default
      expect(scenario.basic_inputs.province).toBe(Province.ON) // Default

      expect(scenario.assets.rrsp).toBeUndefined()
      expect(scenario.assets.tfsa).toBeUndefined()
      expect(scenario.assets.non_registered).toBeUndefined()

      expect(scenario.income_sources.cpp).toBeUndefined()
      expect(scenario.income_sources.other_income).toHaveLength(0)

      expect(scenario.expenses.fixed_monthly).toBe(5000) // Default
      expect(scenario.assumptions.pre_retirement_return).toBe(0.06) // Default 6%
      expect(scenario.assumptions.post_retirement_return).toBe(0.05) // Default 5%
      expect(scenario.assumptions.inflation_rate).toBe(0.02) // Default 2%
    })

    it('should handle partial asset data', () => {
      const formData: FormData = {
        currentAge: 60,
        retirementAge: 65,
        longevityAge: 90,
        province: Province.BC,
        currentIncome: null,
        rrspAmount: 300000,
        tfsaAmount: null,
        nonRegisteredAmount: null,
        rrspContribution: 15000,
        tfsaContribution: null,
        nonRegisteredContribution: null,
        monthlySpending: 4000,
        pensionIncome: null,
        otherIncome: null,
        cppStartAge: 65,
        investmentReturn: 5,
        postRetirementReturn: 3,
        inflationRate: 2.5,
      }

      const scenario = formDataToScenario(formData, 'RRSP Only Plan')

      expect(scenario.assets.rrsp?.balance).toBe(300000)
      expect(scenario.assets.rrsp?.annual_contribution).toBe(15000)
      expect(scenario.assets.tfsa).toBeUndefined()
      expect(scenario.assets.non_registered).toBeUndefined()
    })
  })

  describe('scenarioToFormData', () => {
    it('should convert complete scenario to form data', () => {
      const scenario: Scenario = {
        name: 'Complete Plan',
        basic_inputs: {
          current_age: 58,
          retirement_age: 67,
          longevity_age: 92,
          province: Province.AB,
        },
        assets: {
          rrsp: {
            balance: 600000,
            annual_contribution: 25000,
            rate_of_return: 0.07,
          },
          tfsa: {
            balance: 150000,
            annual_contribution: 7000,
            rate_of_return: 0.07,
          },
          non_registered: {
            balance: 300000,
            cost_base: 200000,
            annual_contribution: 15000,
            rate_of_return: 0.07,
          },
        },
        income_sources: {
          cpp: {
            monthly_amount_at_65: 1364.60,
            start_age: 67,
          },
          oas: {
            monthly_amount: 713.34,
            start_age: 65,
          },
          other_income: [
            {
              description: 'Pension',
              annual_amount: 30000,
              start_age: 67,
              indexed_to_inflation: false,
            },
            {
              description: 'Other Income',
              annual_amount: 15000,
              start_age: 67,
              indexed_to_inflation: false,
            },
          ],
        },
        expenses: {
          fixed_monthly: 6000,
          variable_annual: 0,
          indexed_to_inflation: true,
          age_based_changes: [],
        },
        assumptions: {
          inflation_rate: 0.025,
          pre_retirement_return: 0.07,
          post_retirement_return: 0.045,
        },
      }

      const formData = scenarioToFormData(scenario)

      expect(formData.currentAge).toBe(58)
      expect(formData.retirementAge).toBe(67)
      expect(formData.longevityAge).toBe(92)
      expect(formData.province).toBe(Province.AB)
      expect(formData.currentIncome).toBeNull()

      expect(formData.rrspAmount).toBe(600000)
      expect(formData.rrspContribution).toBe(25000)
      expect(formData.tfsaAmount).toBe(150000)
      expect(formData.tfsaContribution).toBe(7000)
      expect(formData.nonRegisteredAmount).toBe(300000)
      expect(formData.nonRegisteredContribution).toBe(15000)

      expect(formData.monthlySpending).toBe(6000)
      expect(formData.pensionIncome).toBe(2500) // 30000 / 12
      expect(formData.otherIncome).toBe(15000)
      expect(formData.cppStartAge).toBe(67)

      expect(formData.investmentReturn).toBeCloseTo(7, 5) // 0.07 * 100
      expect(formData.postRetirementReturn).toBeCloseTo(4.5, 5) // 0.045 * 100
      expect(formData.inflationRate).toBeCloseTo(2.5, 5) // 0.025 * 100
    })

    it('should handle scenario with no assets', () => {
      const scenario: Scenario = {
        name: 'No Assets Plan',
        basic_inputs: {
          current_age: 50,
          retirement_age: 65,
          longevity_age: 90,
          province: Province.ON,
        },
        assets: {},
        income_sources: {
          oas: {
            monthly_amount: 713.34,
            start_age: 65,
          },
        },
        expenses: {
          fixed_monthly: 3000,
          variable_annual: 0,
          indexed_to_inflation: true,
          age_based_changes: [],
        },
        assumptions: {
          inflation_rate: 0.02,
          pre_retirement_return: 0.06,
          post_retirement_return: 0.04,
        },
      }

      const formData = scenarioToFormData(scenario)

      expect(formData.rrspAmount).toBeNull()
      expect(formData.tfsaAmount).toBeNull()
      expect(formData.nonRegisteredAmount).toBeNull()
      expect(formData.rrspContribution).toBeNull()
      expect(formData.tfsaContribution).toBeNull()
      expect(formData.nonRegisteredContribution).toBeNull()
    })

    it('should handle scenario with no pension income', () => {
      const scenario: Scenario = {
        name: 'No Pension Plan',
        basic_inputs: {
          current_age: 55,
          retirement_age: 65,
          longevity_age: 90,
          province: Province.BC,
        },
        assets: {
          rrsp: {
            balance: 400000,
            rate_of_return: 0.06,
          },
        },
        income_sources: {
          cpp: {
            monthly_amount_at_65: 1364.60,
            start_age: 65,
          },
          oas: {
            monthly_amount: 713.34,
            start_age: 65,
          },
        },
        expenses: {
          fixed_monthly: 4500,
          variable_annual: 0,
          indexed_to_inflation: true,
          age_based_changes: [],
        },
        assumptions: {
          inflation_rate: 0.02,
          pre_retirement_return: 0.06,
          post_retirement_return: 0.04,
        },
      }

      const formData = scenarioToFormData(scenario)

      expect(formData.pensionIncome).toBeNull()
      expect(formData.otherIncome).toBeNull()
    })
  })

  describe('round-trip conversion', () => {
    it('should preserve data through form -> scenario -> form conversion', () => {
      const originalFormData: FormData = {
        currentAge: 56,
        retirementAge: 64,
        longevityAge: 88,
        province: Province.QC,
        currentIncome: 90000,
        rrspAmount: 450000,
        tfsaAmount: 80000,
        nonRegisteredAmount: 120000,
        rrspContribution: 18000,
        tfsaContribution: 7000,
        nonRegisteredContribution: 5000,
        monthlySpending: 4500,
        pensionIncome: 1500,
        otherIncome: 10000,
        cppStartAge: 64,
        investmentReturn: 5.5,
        postRetirementReturn: 3.5,
        inflationRate: 2.2,
      }

      // Convert to scenario
      const scenario = formDataToScenario(originalFormData, 'Round Trip Test')

      // Convert back to form data
      const resultFormData = scenarioToFormData(scenario)

      // Verify all fields match (except currentIncome which is not stored)
      expect(resultFormData.currentAge).toBe(originalFormData.currentAge)
      expect(resultFormData.retirementAge).toBe(originalFormData.retirementAge)
      expect(resultFormData.longevityAge).toBe(originalFormData.longevityAge)
      expect(resultFormData.province).toBe(originalFormData.province)
      expect(resultFormData.rrspAmount).toBe(originalFormData.rrspAmount)
      expect(resultFormData.tfsaAmount).toBe(originalFormData.tfsaAmount)
      expect(resultFormData.nonRegisteredAmount).toBe(originalFormData.nonRegisteredAmount)
      expect(resultFormData.rrspContribution).toBe(originalFormData.rrspContribution)
      expect(resultFormData.tfsaContribution).toBe(originalFormData.tfsaContribution)
      expect(resultFormData.nonRegisteredContribution).toBe(originalFormData.nonRegisteredContribution)
      expect(resultFormData.monthlySpending).toBe(originalFormData.monthlySpending)
      expect(resultFormData.pensionIncome).toBe(originalFormData.pensionIncome)
      expect(resultFormData.otherIncome).toBe(originalFormData.otherIncome)
      expect(resultFormData.cppStartAge).toBe(originalFormData.cppStartAge)
      expect(resultFormData.investmentReturn).toBeCloseTo(originalFormData.investmentReturn!, 5)
      expect(resultFormData.postRetirementReturn).toBeCloseTo(originalFormData.postRetirementReturn!, 5)
      expect(resultFormData.inflationRate).toBeCloseTo(originalFormData.inflationRate!, 5)
    })
  })
})
