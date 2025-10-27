'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, AlertCircle, TrendingUp, Shield, Calculator } from 'lucide-react';

interface CalculationDisclosureProps {
  isDark?: boolean;
}

export function CalculationDisclosure({ isDark = false }: CalculationDisclosureProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const bgColor = isDark ? 'bg-gray-800/50' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const subtextColor = isDark ? 'text-gray-300' : 'text-gray-600';
  const checkColor = isDark ? 'text-emerald-400' : 'text-emerald-600';
  const warningColor = isDark ? 'text-yellow-400' : 'text-yellow-600';
  const sectionBg = isDark ? 'bg-gray-700/30' : 'bg-gray-50';

  const calculatorDoes = [
    'Year-by-year simulation from current age to longevity',
    'Accumulation phase (pre-retirement) + drawdown phase (retirement)',
    'Tracks RRSP/RRIF, TFSA, and non-registered accounts',
    'Federal and provincial taxes calculated annually',
    'CRA rules for RRIF minimums, OAS clawback, and tax credits',
    'Portfolio depletion detection and success metrics',
  ];

  return (
    <div className={`mt-12 rounded-xl border ${borderColor} ${bgColor} p-6 md:p-8 shadow-sm`}>
      {/* Always Visible Section */}
      <div className="space-y-6">
        <div>
          <h2 className={`text-2xl font-semibold ${textColor} mb-2`}>
            How We Calculate Your Retirement
          </h2>
          <p className={`${subtextColor} text-sm`}>
            Our engine follows CRA rules and Canadian tax law to project your retirement income.
          </p>
        </div>

        {/* What This Calculator Does */}
        <div className={`rounded-lg ${sectionBg} p-6 space-y-4`}>
          <h3 className={`text-lg font-semibold ${textColor} flex items-center gap-2`}>
            <Calculator className="w-5 h-5" />
            What This Calculator Does
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {calculatorDoes.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className={`w-5 h-5 ${checkColor} flex-shrink-0 mt-0.5`} />
                <span className={`text-sm ${subtextColor}`}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
            isDark
              ? 'hover:bg-gray-700/50 text-gray-300'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <span className="text-sm font-medium">
            View Detailed Assumptions & Limitations
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </button>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-6 space-y-8 border-t border-gray-200 dark:border-gray-700 mt-6">
              {/* Government Benefits */}
              <section>
                <h3 className={`text-base font-semibold ${textColor} flex items-center gap-2 mb-3`}>
                  <Shield className="w-5 h-5 text-blue-500" />
                  Government Benefits
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className={`text-sm font-medium ${textColor} mb-2`}>
                      Canada Pension Plan (CPP)
                    </h4>
                    <ul className={`text-sm ${subtextColor} space-y-1 ml-6 list-disc`}>
                      <li>Age adjustments: 7.2% reduction per year if taken before 65 (minimum age 60)</li>
                      <li>8.4% increase per year if delayed past 65 (maximum age 70)</li>
                      <li>Indexed to inflation annually</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${textColor} mb-2`}>
                      Old Age Security (OAS)
                    </h4>
                    <ul className={`text-sm ${subtextColor} space-y-1 ml-6 list-disc`}>
                      <li>Age adjustments: 7.2% increase per year if delayed past 65 (maximum age 70)</li>
                      <li>OAS clawback: 15% reduction on income above $86,912 (2025)</li>
                      <li>Fully clawed back at $143,540</li>
                      <li>Indexed to inflation annually</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Tax Calculations */}
              <section>
                <h3 className={`text-base font-semibold ${textColor} flex items-center gap-2 mb-3`}>
                  <Calculator className="w-5 h-5 text-purple-500" />
                  Tax Calculations
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className={`text-sm font-medium ${textColor} mb-2`}>
                      Progressive Tax System
                    </h4>
                    <ul className={`text-sm ${subtextColor} space-y-1 ml-6 list-disc`}>
                      <li>Federal tax brackets (5 brackets, 2025 CRA rates)</li>
                      <li>Provincial/territorial tax for all 13 jurisdictions</li>
                      <li>Basic personal amount: $15,705 federal (varies by province)</li>
                      <li>Age amount: $8,790 federal credit (65+), income-tested above $43,906</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${textColor} mb-2`}>
                      Income Treatment
                    </h4>
                    <ul className={`text-sm ${subtextColor} space-y-1 ml-6 list-disc`}>
                      <li>RRSP/RRIF withdrawals: 100% taxable as income</li>
                      <li>Capital gains (non-registered): 50% inclusion rate</li>
                      <li>Eligible dividends: 138% gross-up with dividend tax credit</li>
                      <li>TFSA withdrawals: Tax-free (not included in taxable income)</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Registered Account Rules */}
              <section>
                <h3 className={`text-base font-semibold ${textColor} flex items-center gap-2 mb-3`}>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Registered Account Rules
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className={`text-sm font-medium ${textColor} mb-2`}>
                      RRIF Mandatory Minimums
                    </h4>
                    <ul className={`text-sm ${subtextColor} space-y-1 ml-6 list-disc`}>
                      <li>RRSP converts to RRIF at age 71 (end of year you turn 71)</li>
                      <li>Mandatory minimum withdrawals starting at age 72</li>
                      <li>CRA-defined percentages: Age 72: 5.40% | Age 80: 6.82% | Age 90: 11.11% | Age 95: 20.00%</li>
                      <li className="font-medium">These minimums are enforced even when not needed for expenses</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${textColor} mb-2`}>
                      Tax-Efficient Withdrawal Sequencing
                    </h4>
                    <ol className={`text-sm ${subtextColor} space-y-1 ml-6 list-decimal`}>
                      <li>Non-registered accounts first (50% capital gains inclusion)</li>
                      <li>RRSP/RRIF second (after minimums taken)</li>
                      <li>TFSA last (preserve tax-free growth)</li>
                    </ol>
                  </div>
                </div>
              </section>

              {/* Investment Assumptions */}
              <section>
                <h3 className={`text-base font-semibold ${textColor} flex items-center gap-2 mb-3`}>
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  Investment Assumptions
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className={`text-sm font-medium ${textColor} mb-2`}>
                      Account Growth
                    </h4>
                    <ul className={`text-sm ${subtextColor} space-y-1 ml-6 list-disc`}>
                      <li>Pre-retirement return rate (applied to RRSP, TFSA, non-registered)</li>
                      <li>Post-retirement return rate (typically lower, reflects conservative allocation)</li>
                      <li>Returns applied annually after contributions/withdrawals</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${textColor} mb-2`}>
                      Pension Income
                    </h4>
                    <ul className={`text-sm ${subtextColor} space-y-1 ml-6 list-disc`}>
                      <li>Defined benefit pensions: Amount as specified in your plan</li>
                      <li>Indexing: Can be set as indexed to inflation or fixed (based on your pension plan terms)</li>
                      <li>Start age: Typically retirement age, but can vary by plan</li>
                      <li>No investment risk assumed (guaranteed income stream)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${textColor} mb-2`}>
                      Inflation Indexing
                    </h4>
                    <ul className={`text-sm ${subtextColor} space-y-1 ml-6 list-disc`}>
                      <li>Expenses increase annually (if selected)</li>
                      <li>CPP and OAS increase annually (actual government policy)</li>
                      <li>Other income sources: Indexing behavior set per income source</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Important Limitations */}
              <section className={`rounded-lg ${isDark ? 'bg-yellow-900/10' : 'bg-yellow-50'} p-4 border ${isDark ? 'border-yellow-900/30' : 'border-yellow-200'}`}>
                <h3 className={`text-base font-semibold ${textColor} flex items-center gap-2 mb-3`}>
                  <AlertCircle className={`w-5 h-5 ${warningColor}`} />
                  Important Limitations
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className={`text-sm font-medium ${textColor} mb-2`}>
                      What's NOT Included:
                    </h4>
                    <ul className={`text-sm ${subtextColor} space-y-1 ml-6 list-disc`}>
                      <li>Estate planning, inheritance, or beneficiary considerations</li>
                      <li>Spousal income splitting strategies</li>
                      <li>Home equity or reverse mortgages</li>
                      <li>Healthcare costs beyond regular expenses</li>
                      <li>One-time large purchases or windfalls</li>
                      <li>Tax optimization strategies (e.g., pension income splitting, RRIF meltdowns)</li>
                      <li>Investment fees or transaction costs</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${textColor} mb-2`}>
                      Data Source:
                    </h4>
                    <p className={`text-sm ${subtextColor}`}>
                      All tax brackets, RRIF minimums, CPP/OAS amounts based on 2025 CRA and Service Canada data. Provincial tax rates updated annually.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
