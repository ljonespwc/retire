'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalculatorHeader } from '@/components/calculator/CalculatorHeader'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Calculator, TrendingUp, Shield, Zap, Users, FileText, CheckCircle, ArrowRight, DollarSign, Calendar, PiggyBank, BarChart3, Home as HomeIcon, Briefcase } from 'lucide-react'
import posthog from 'posthog-js'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false)
  const [mounted, setMounted] = useState(false)
  const { user, isAnonymous } = useAuth()

  // Avoid hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // PostHog: Track planning started from homepage
  const handleStartPlanning = () => {
    posthog.capture('planning_started', {
      source: 'homepage',
      is_returning_user: !!(user && !isAnonymous)
    })
  }

  // Use false (light mode) until mounted to match server render
  const effectiveDarkMode = mounted ? isDarkMode : false

  const theme = {
    background: effectiveDarkMode
      ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800'
      : 'bg-gradient-to-br from-orange-50 via-rose-50 to-teal-50',

    headerBg: effectiveDarkMode
      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
      : 'bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400',

    card: effectiveDarkMode
      ? 'bg-gray-800 border-gray-700'
      : 'bg-white',

    text: {
      primary: effectiveDarkMode ? 'text-gray-100' : 'text-gray-800',
      secondary: effectiveDarkMode ? 'text-gray-300' : 'text-gray-600',
      muted: effectiveDarkMode ? 'text-gray-400' : 'text-gray-500',
    },

    button: {
      primary: effectiveDarkMode
        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
        : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500',
    },
  }

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className={`min-h-screen ${theme.background}`}>
      {/* Header */}
      <CalculatorHeader
        isDarkMode={effectiveDarkMode}
        theme={theme}
        isAnonymous={true}
        authLoading={true}
        user={null}
        onToggleDarkMode={handleToggleDarkMode}
        onLoginClick={() => {}}
        onLogout={() => {}}
      />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${theme.text.primary} mb-6 leading-tight`}>
            Plan Your Canadian Retirement with Confidence
          </h2>
          <p className={`text-lg sm:text-xl lg:text-2xl ${theme.text.secondary} mb-8 leading-relaxed`}>
            Tax-accurate projections with CPP/OAS optimization, RRSP/TFSA modeling, and provincial tax calculations. No ads. No personal information required.
          </p>
          <Link
            href="/calculator/home"
            onClick={handleStartPlanning}
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl ${theme.button.primary} text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
          >
            Start Planning Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h3 className={`text-3xl sm:text-4xl font-bold ${theme.text.primary} text-center mb-12`}>
          What Makes Us Different
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`${theme.card} rounded-2xl p-6 shadow-lg border ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className={`w-12 h-12 rounded-xl ${theme.button.primary} flex items-center justify-center mb-4`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h4 className={`text-xl font-semibold ${theme.text.primary} mb-3`}>
              100% Canadian
            </h4>
            <p className={`${theme.text.secondary} leading-relaxed`}>
              Built specifically for Canadian tax rules, government benefits, and registered accounts. Federal and provincial calculations for all 13 jurisdictions.
            </p>
          </div>

          <div className={`${theme.card} rounded-2xl p-6 shadow-lg border ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className={`w-12 h-12 rounded-xl ${theme.button.primary} flex items-center justify-center mb-4`}>
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <h4 className={`text-xl font-semibold ${theme.text.primary} mb-3`}>
              Tax-Accurate
            </h4>
            <p className={`${theme.text.secondary} leading-relaxed`}>
              Sophisticated tax engine models federal and provincial taxes, OAS clawback, RRIF minimums, and tax-efficient withdrawal strategies.
            </p>
          </div>

          <div className={`${theme.card} rounded-2xl p-6 shadow-lg border ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className={`w-12 h-12 rounded-xl ${theme.button.primary} flex items-center justify-center mb-4`}>
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h4 className={`text-xl font-semibold ${theme.text.primary} mb-3`}>
              No Ads. No Tracking.
            </h4>
            <p className={`${theme.text.secondary} leading-relaxed`}>
              No personal information required to use the calculator. No ads. No data selling. Just honest retirement planning tools.
            </p>
          </div>

          <div className={`${theme.card} rounded-2xl p-6 shadow-lg border ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className={`w-12 h-12 rounded-xl ${theme.button.primary} flex items-center justify-center mb-4`}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h4 className={`text-xl font-semibold ${theme.text.primary} mb-3`}>
              Powerful What-Ifs
            </h4>
            <p className={`${theme.text.secondary} leading-relaxed`}>
              Compare unlimited scenarios instantly. See exactly how different decisions impact your retirement income and legacy.
            </p>
          </div>
        </div>
      </section>

      {/* What-If Scenarios Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h3 className={`text-3xl sm:text-4xl font-bold ${theme.text.primary} mb-4`}>
            Explore Every Possibility
          </h3>
          <p className={`text-lg ${theme.text.secondary} max-w-3xl mx-auto`}>
            Test different strategies side-by-side. See how each decision affects your retirement income, taxes, and legacy. Make informed choices with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`${theme.card} rounded-2xl p-6 shadow-lg border ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-100'} hover:shadow-xl transition-shadow`}>
            <div className={`w-10 h-10 rounded-lg ${theme.button.primary} flex items-center justify-center mb-4`}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>
              Retire Earlier or Later?
            </h4>
            <p className={`${theme.text.secondary} text-sm`}>
              Compare retiring at 60 vs 65 vs 70. See how each choice affects your lifetime income and portfolio longevity.
            </p>
          </div>

          <div className={`${theme.card} rounded-2xl p-6 shadow-lg border ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-100'} hover:shadow-xl transition-shadow`}>
            <div className={`w-10 h-10 rounded-lg ${theme.button.primary} flex items-center justify-center mb-4`}>
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>
              Delay CPP/OAS Benefits?
            </h4>
            <p className={`${theme.text.secondary} text-sm`}>
              Should you start CPP at 60, 65, or 70? Compare guaranteed lifetime increases against early access needs.
            </p>
          </div>

          <div className={`${theme.card} rounded-2xl p-6 shadow-lg border ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-100'} hover:shadow-xl transition-shadow`}>
            <div className={`w-10 h-10 rounded-lg ${theme.button.primary} flex items-center justify-center mb-4`}>
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>
              Front-Load Withdrawals?
            </h4>
            <p className={`${theme.text.secondary} text-sm`}>
              Spend more in early retirement, less later? See how front-loading affects taxes, OAS clawback, and portfolio survival.
            </p>
          </div>

          <div className={`${theme.card} rounded-2xl p-6 shadow-lg border ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-100'} hover:shadow-xl transition-shadow`}>
            <div className={`w-10 h-10 rounded-lg ${theme.button.primary} flex items-center justify-center mb-4`}>
              <HomeIcon className="w-5 h-5 text-white" />
            </div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>
              Downsize Your Home?
            </h4>
            <p className={`${theme.text.secondary} text-sm`}>
              Model the tax impact of selling your home and investing proceeds. Compare different timing scenarios.
            </p>
          </div>

          <div className={`${theme.card} rounded-2xl p-6 shadow-lg border ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-100'} hover:shadow-xl transition-shadow`}>
            <div className={`w-10 h-10 rounded-lg ${theme.button.primary} flex items-center justify-center mb-4`}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>
              Preserve a Legacy?
            </h4>
            <p className={`${theme.text.secondary} text-sm`}>
              Optimize withdrawals to leave a specific amount for heirs. See how legacy goals affect your retirement spending power.
            </p>
          </div>

          <div className={`${theme.card} rounded-2xl p-6 shadow-lg border ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-100'} hover:shadow-xl transition-shadow`}>
            <div className={`w-10 h-10 rounded-lg ${theme.button.primary} flex items-center justify-center mb-4`}>
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>
              Part-Time Work in Retirement?
            </h4>
            <p className={`${theme.text.secondary} text-sm`}>
              Model additional income from consulting or part-time work. Understand tax implications and OAS impact.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h3 className={`text-3xl sm:text-4xl font-bold ${theme.text.primary} text-center mb-12`}>
          How It Works
        </h3>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex gap-6">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${theme.button.primary} flex items-center justify-center text-white text-xl font-bold`}>
              1
            </div>
            <div>
              <h4 className={`text-xl font-semibold ${theme.text.primary} mb-2`}>
                Enter Your Information
              </h4>
              <p className={`${theme.text.secondary}`}>
                Provide your age, retirement date, savings (RRSP/TFSA/Non-reg), expected CPP/OAS, and desired retirement income. No personal details required.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${theme.button.primary} flex items-center justify-center text-white text-xl font-bold`}>
              2
            </div>
            <div>
              <h4 className={`text-xl font-semibold ${theme.text.primary} mb-2`}>
                Get Your Baseline Projection
              </h4>
              <p className={`${theme.text.secondary}`}>
                See year-by-year projections of your portfolio balance, income composition, taxes paid, and after-tax income. Interactive charts and detailed breakdowns.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${theme.button.primary} flex items-center justify-center text-white text-xl font-bold`}>
              3
            </div>
            <div>
              <h4 className={`text-xl font-semibold ${theme.text.primary} mb-2`}>
                Explore What-If Scenarios
              </h4>
              <p className={`${theme.text.secondary}`}>
                Click any what-if button to instantly compare scenarios. Retire earlier? Delay CPP? Front-load spending? See side-by-side results.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${theme.button.primary} flex items-center justify-center text-white text-xl font-bold`}>
              4
            </div>
            <div>
              <h4 className={`text-xl font-semibold ${theme.text.primary} mb-2`}>
                Save and Compare
              </h4>
              <p className={`${theme.text.secondary}`}>
                Save unlimited scenarios to compare later. Load saved plans and create new variants. Track your planning progress over time.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${theme.button.primary} flex items-center justify-center text-white text-xl font-bold`}>
              5
            </div>
            <div>
              <h4 className={`text-xl font-semibold ${theme.text.primary} mb-2`}>
                Make Informed Decisions
              </h4>
              <p className={`${theme.text.secondary}`}>
                Use insights from multiple scenarios to make confident retirement decisions. Understand trade-offs and optimize your strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h3 className={`text-3xl sm:text-4xl font-bold ${theme.text.primary} text-center mb-12`}>
          Comprehensive Planning Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center gap-2`}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              Government Benefits
            </h4>
            <ul className={`${theme.text.secondary} space-y-2 text-sm`}>
              <li>• CPP age adjustments (60-70)</li>
              <li>• OAS clawback calculations</li>
              <li>• Optimal start age analysis</li>
              <li>• GIS eligibility modeling</li>
            </ul>
          </div>

          <div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center gap-2`}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              Registered Accounts
            </h4>
            <ul className={`${theme.text.secondary} space-y-2 text-sm`}>
              <li>• RRSP/RRIF withdrawal strategies</li>
              <li>• RRIF minimum calculations</li>
              <li>• TFSA tax-free growth</li>
              <li>• Optimal withdrawal sequencing</li>
            </ul>
          </div>

          <div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center gap-2`}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              Tax Calculations
            </h4>
            <ul className={`${theme.text.secondary} space-y-2 text-sm`}>
              <li>• Federal & provincial taxes</li>
              <li>• Income source treatment</li>
              <li>• Tax credits & deductions</li>
              <li>• Marginal rate analysis</li>
            </ul>
          </div>

          <div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center gap-2`}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              Income Modeling
            </h4>
            <ul className={`${theme.text.secondary} space-y-2 text-sm`}>
              <li>• Employment/self-employment</li>
              <li>• Pension income (with indexing)</li>
              <li>• Bridge benefits</li>
              <li>• Variable spending patterns</li>
            </ul>
          </div>

          <div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center gap-2`}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              Visualization
            </h4>
            <ul className={`${theme.text.secondary} space-y-2 text-sm`}>
              <li>• Portfolio balance charts</li>
              <li>• Income composition graphs</li>
              <li>• Tax impact analysis</li>
              <li>• Year-by-year breakdowns</li>
            </ul>
          </div>

          <div>
            <h4 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center gap-2`}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              Scenario Management
            </h4>
            <ul className={`${theme.text.secondary} space-y-2 text-sm`}>
              <li>• Save unlimited scenarios</li>
              <li>• Side-by-side comparisons</li>
              <li>• One-click what-if scenarios</li>
              <li>• Load and modify saved plans</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className={`${theme.card} rounded-2xl p-8 sm:p-12 shadow-lg border ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className={`text-4xl font-bold ${theme.text.primary} mb-2`}>
                100%
              </div>
              <div className={`${theme.text.secondary}`}>
                Canadian Tax Rules
              </div>
            </div>
            <div>
              <div className={`text-4xl font-bold ${theme.text.primary} mb-2`}>
                13
              </div>
              <div className={`${theme.text.secondary}`}>
                Provinces & Territories
              </div>
            </div>
            <div>
              <div className={`text-4xl font-bold ${theme.text.primary} mb-2`}>
                $0
              </div>
              <div className={`${theme.text.secondary}`}>
                To Start Planning
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h3 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${theme.text.primary} mb-6`}>
            Ready to Plan Your Retirement?
          </h3>
          <p className={`text-lg sm:text-xl ${theme.text.secondary} mb-8`}>
            Start with a free baseline projection. No credit card. No personal information. No obligations.
          </p>
          <Link
            href="/calculator/home"
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl ${theme.button.primary} text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${effectiveDarkMode ? 'bg-gray-900' : 'bg-gray-100'} border-t ${effectiveDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className={`${theme.text.secondary} text-sm`}>
              © 2025 Canada Retire Calc. Built for Canadians, by Canadians.
            </p>
            <p className={`${theme.text.muted} text-xs mt-2`}>
              Tax calculations based on 2025 federal and provincial tax rules. Results are estimates for planning purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
