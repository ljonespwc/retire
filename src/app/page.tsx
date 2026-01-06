'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { CalculatorHeader } from '@/components/calculator/CalculatorHeader'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  CheckCircle, ArrowRight, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import posthog from 'posthog-js'
import { useAuth } from '@/contexts/AuthContext'

// Screenshot gallery data
const SCREENSHOTS = [
  {
    src: '/screenshots/hero-results.png',
    width: 1188,
    height: 471,
    shortCaption: 'Results Dashboard',
    description: 'Your complete retirement picture at a glance. Monthly income projection, portfolio trajectory, and key milestones—all calculated with real Canadian tax rules.',
    bullets: ['After-tax monthly income clearly shown', 'Portfolio depletion age calculated', 'One-click access to detailed breakdowns'],
  },
  {
    src: '/screenshots/what-if-grid.png',
    width: 1184,
    height: 415,
    shortCaption: 'What-If Scenarios',
    description: '12 built-in scenarios let you test any retirement strategy. Spend more, work longer, inherit money—run each scenario in seconds.',
    bullets: ['Front-load withdrawals vs. delay strategies', 'Life events: inheritance, downsizing, part-time work', 'Stress tests: market crash, inflation spike'],
  },
  {
    src: '/screenshots/tax-summary.png',
    width: 1146,
    height: 500,
    shortCaption: 'Tax Breakdown',
    description: 'Full breakdown: federal, provincial, clawbacks, and RRIF minimums. Every income source treated correctly.',
    bullets: ['2025 tax brackets updated annually', 'OAS clawback threshold: $86,912', 'Capital gains inclusion rate applied correctly'],
  },
  {
    src: '/screenshots/portfolio-chart.png',
    width: 1155,
    height: 443,
    shortCaption: 'Portfolio Timeline',
    description: 'Your portfolio\'s full arc—growth, peak, and draw-down. See exactly when your money runs out, or if it doesn\'t.',
    bullets: ['Portfolio balance projection to age 95+', 'RRIF conversion marked at age 71', 'Depletion age calculated automatically'],
  },
  {
    src: '/screenshots/ai-insights.png',
    width: 1151,
    height: 523,
    shortCaption: 'AI Analysis',
    description: 'Our AI analyzes your plan and explains it in words you understand. Know exactly what your numbers mean and what to do about them.',
    bullets: ['Identifies critical transition points', 'Highlights OAS clawback years', 'Explains trade-offs clearly'],
  },
  {
    src: '/screenshots/scenario.png',
    width: 505,
    height: 730,
    shortCaption: 'Custom Scenario Generator',
    description: 'Simulate market crashes, early retirement, or delayed benefits. Configure the parameters and see the impact instantly.',
    bullets: ['Side-by-side comparison tables', 'Colored highlights for key differences', 'AI explains each scenario\'s impact'],
  },
  {
    src: '/screenshots/income-sources-chart.png',
    width: 1111,
    height: 451,
    shortCaption: 'Income Sources',
    description: 'See exactly where your money comes from every year. CPP, OAS, RRSP/RRIF, TFSA, pension, and non-registered—all stacked together with your after-tax income line.',
    bullets: ['Every income source visualized by year', 'After-tax income line overlay', 'Transition points clearly marked'],
  },
]

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false)
  const [mounted, setMounted] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { user, isAnonymous } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null)
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex(lightboxIndex === 0 ? SCREENSHOTS.length - 1 : lightboxIndex - 1)
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex(lightboxIndex === SCREENSHOTS.length - 1 ? 0 : lightboxIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex])

  const handleStartPlanning = () => {
    posthog.capture('planning_started', {
      source: 'homepage',
      is_returning_user: !!(user && !isAnonymous)
    })
  }

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
      : 'bg-white border-gray-100',
    cardAlt: effectiveDarkMode
      ? 'bg-gray-900 border-gray-800'
      : 'bg-gray-50 border-gray-200',
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
    accent: effectiveDarkMode ? 'text-blue-400' : 'text-orange-600',
    accentBg: effectiveDarkMode ? 'bg-blue-500/10' : 'bg-orange-500/10',
  }

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className={`min-h-screen ${theme.background}`}>
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

      {/* ===== SECTION 1: HERO ===== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
        <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${theme.text.primary} mb-6 leading-tight`}>
          Stop guessing if you'll have enough.
        </h1>
        <p className={`text-lg sm:text-xl ${theme.text.secondary} mb-8 leading-relaxed max-w-2xl mx-auto`}>
          See your after-tax income, year by year. Canadian taxes, CPP/OAS timing, and what-if scenarios to test your plan.
        </p>
        <div className="flex justify-center">
          <Link
            href="/calculator/home"
            onClick={handleStartPlanning}
            className={`inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl ${theme.button.primary} text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 animate-pulse-subtle`}
          >
            Start Planning Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <p className={`${theme.text.muted} text-sm mt-4`}>
          Free to use. Anonymous. Accurate.
        </p>
      </section>

      {/* ===== SECTION 2: SOUND FAMILIAR? ===== */}
      <section className={`py-16 sm:py-24 ${effectiveDarkMode ? 'bg-gray-900/30' : 'bg-white/50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[2fr_3fr] gap-12 lg:gap-16 items-center">
            {/* Left side: Image */}
            <div className="order-2 lg:order-1">
              <div className={`
                relative aspect-[2/3] rounded-2xl overflow-hidden max-w-md mx-auto lg:max-w-none
                ${effectiveDarkMode
                  ? 'bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-blue-900/50 ring-1 ring-white/10'
                  : 'bg-gradient-to-br from-orange-100 via-rose-100 to-amber-100 ring-1 ring-orange-200/50'}
                shadow-2xl
              `}>
                <Image
                  src="/images/sound-familiar-hero.png"
                  alt="Person contemplating retirement finances"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Right side: Content */}
            <div className="order-1 lg:order-2">
              <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${theme.text.primary} mb-8 leading-tight`}>
                Sound familiar?
              </h2>

              <div className="space-y-5">
                {[
                  "You've saved for decades but have no idea if it's enough",
                  "You've Googled \"when should I take CPP\" more than once",
                  "You don't know if you should draw from your RRSP or TFSA first",
                  "You've tried other calculators and left more confused than when you started",
                  "You're not sure how much taxes will eat into your retirement income",
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`
                      flex items-start gap-4 p-4 rounded-xl transition-all duration-200
                      ${effectiveDarkMode
                        ? 'bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700/50'
                        : 'bg-white hover:bg-orange-50/80 border border-gray-200/80 shadow-sm hover:shadow-md'}
                    `}
                  >
                    <div className={`
                      flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5
                      ${effectiveDarkMode
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-orange-500/10 text-orange-600'}
                    `}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className={`${theme.text.secondary} text-base sm:text-lg leading-relaxed`}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <p className={`mt-8 text-lg sm:text-xl ${effectiveDarkMode ? 'text-indigo-400' : 'text-orange-600'} font-medium`}>
                If you nodded at any of these, keep scrolling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: SCREENSHOT GALLERY ===== */}
      <section className="py-16 sm:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${theme.text.primary} text-center mb-4`}>
            This is what clarity looks like.
          </h2>
          <p className={`text-sm ${theme.text.secondary} text-center`}>
            (Click any screenshot to view full size)
          </p>
        </div>

        {/* Horizontal scroll carousel */}
        <div className="relative">
          {/* Fade edges */}
          <div className={`absolute left-0 top-0 bottom-0 w-8 sm:w-16 z-10 pointer-events-none ${effectiveDarkMode ? 'bg-gradient-to-r from-slate-900 to-transparent' : 'bg-gradient-to-r from-orange-50 to-transparent'}`} />
          <div className={`absolute right-0 top-0 bottom-0 w-8 sm:w-16 z-10 pointer-events-none ${effectiveDarkMode ? 'bg-gradient-to-l from-slate-900 to-transparent' : 'bg-gradient-to-l from-orange-50 to-transparent'}`} />

          {/* Scrollable container */}
          <div
            className="flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-8 lg:px-16 pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {SCREENSHOTS.map((screenshot, index) => (
              <button
                key={screenshot.src}
                onClick={() => setLightboxIndex(index)}
                className={`flex-shrink-0 snap-start group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${effectiveDarkMode ? 'focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900' : 'focus-visible:ring-orange-500 focus-visible:ring-offset-orange-50'}`}
              >
                {/* Fixed-height card container */}
                <div className={`
                  w-[300px] sm:w-[380px] md:w-[420px] lg:w-[480px]
                  h-[200px] sm:h-[250px] md:h-[280px] lg:h-[320px]
                  rounded-xl border overflow-hidden
                  flex items-center justify-center p-3
                  transition-all duration-200 group-hover:border-orange-500/50
                  ${effectiveDarkMode
                    ? 'bg-gray-900/80 border-white/10'
                    : 'bg-white border-gray-200 shadow-sm'}
                `}>
                  {/* Native img for reliable rounded corners - clipPath needed for portrait images with object-contain */}
                  <img
                    src={screenshot.src}
                    alt={screenshot.shortCaption}
                    className="object-contain max-h-full max-w-full"
                    style={{ borderRadius: '12px', clipPath: 'inset(0 round 12px)' }}
                    loading="lazy"
                  />
                </div>
                <p className={`mt-3 text-sm font-medium ${theme.text.secondary} text-center group-hover:${theme.accent.replace('text-', '')}`}>
                  {screenshot.shortCaption}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: COMPARISON TABLE ===== */}
      <section className={`${effectiveDarkMode ? 'bg-gray-900/50' : 'bg-gray-100/50'} py-16 sm:py-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${theme.text.primary} text-center mb-12 max-w-4xl mx-auto`}>
            A single number won't prepare you for retirement. Real math will.
          </h2>

          <div className={`${theme.card} rounded-2xl shadow-lg overflow-hidden border`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={effectiveDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                    <th className={`px-4 py-4 text-left ${theme.text.primary} font-semibold w-[35%]`}>Feature</th>
                    <th className={`px-4 py-4 text-center ${theme.text.muted} w-[30%]`}>Other Calculators</th>
                    <th className={`px-4 py-4 text-center ${theme.accent} font-semibold w-[35%]`}>Our Calculator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>Tax accuracy</td>
                    <td className={`px-4 py-4 ${theme.text.muted}`}>Generic estimates</td>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>Federal + provincial</td>
                  </tr>
                  <tr className={effectiveDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>Account types</td>
                    <td className={`px-4 py-4 ${theme.text.muted}`}>Lumped together</td>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>RRSP, TFSA, non-registered separately</td>
                  </tr>
                  <tr>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>Assumptions</td>
                    <td className={`px-4 py-4 ${theme.text.muted}`}>Locked rates, one-size-fits-none</td>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>Customizable inflation, returns, spending</td>
                  </tr>
                  <tr className={effectiveDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>Income display</td>
                    <td className={`px-4 py-4 ${theme.text.muted}`}>Gross (before tax)</td>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>After-tax spendable income</td>
                  </tr>
                  <tr>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>CPP/OAS timing</td>
                    <td className={`px-4 py-4 ${theme.text.muted}`}>Fixed at 65</td>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>Adjustable 60-70 with impact shown</td>
                  </tr>
                  <tr className={effectiveDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>Year-by-year detail</td>
                    <td className={`px-4 py-4 ${theme.text.muted}`}>Hidden or none</td>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>Full transparency, every year</td>
                  </tr>
                  <tr>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>What-if scenarios</td>
                    <td className={`px-4 py-4 ${theme.text.muted}`}>None or limited</td>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>12 built-in scenarios</td>
                  </tr>
                  <tr className={effectiveDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>AI explanation</td>
                    <td className={`px-4 py-4 ${theme.text.muted}`}>None</td>
                    <td className={`px-4 py-4 ${theme.text.primary}`}>Plain-language insights</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: COMPREHENSIVE PLANNING FEATURES ===== */}
      <section className={`${effectiveDarkMode ? 'bg-gray-900/50' : 'bg-gray-100/50'} py-16 sm:py-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${theme.text.primary} text-center mb-12`}>
            The details matter. That's why we included all of them.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Government Benefits */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Government Benefits</h3>
              </div>
              <ul className={`space-y-1.5 ${theme.text.secondary} text-sm`}>
                <li>• CPP age adjustments (60-70)</li>
                <li>• OAS clawback calculations</li>
                <li>• CPP/OAS timing comparison</li>
                <li>• Inflation-adjusted projections</li>
              </ul>
            </div>

            {/* Registered Accounts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Registered Accounts</h3>
              </div>
              <ul className={`space-y-1.5 ${theme.text.secondary} text-sm`}>
                <li>• RRSP/RRIF withdrawal strategies</li>
                <li>• RRIF minimum calculations</li>
                <li>• TFSA tax-free growth</li>
                <li>• Optimal withdrawal sequencing</li>
              </ul>
            </div>

            {/* Tax Calculations */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Tax Calculations</h3>
              </div>
              <ul className={`space-y-1.5 ${theme.text.secondary} text-sm`}>
                <li>• Federal & provincial taxes</li>
                <li>• Income source treatment</li>
                <li>• Tax credits & deductions</li>
                <li>• Marginal rate analysis</li>
              </ul>
            </div>

            {/* Income Modeling */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Income Modeling</h3>
              </div>
              <ul className={`space-y-1.5 ${theme.text.secondary} text-sm`}>
                <li>• Employment/self-employment</li>
                <li>• Pension income (with indexing)</li>
                <li>• Bridge benefits</li>
                <li>• Variable spending patterns</li>
              </ul>
            </div>

            {/* Visualization */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Visualization</h3>
              </div>
              <ul className={`space-y-1.5 ${theme.text.secondary} text-sm`}>
                <li>• Portfolio balance charts</li>
                <li>• Income composition graphs</li>
                <li>• Tax impact analysis</li>
                <li>• Year-by-year breakdowns</li>
              </ul>
            </div>

            {/* Scenario Management */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Scenario Management</h3>
              </div>
              <ul className={`space-y-1.5 ${theme.text.secondary} text-sm`}>
                <li>• Save unlimited scenarios</li>
                <li>• Side-by-side comparisons</li>
                <li>• One-click what-if scenarios</li>
                <li>• Load and modify saved plans</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 6: FINAL CTA ===== */}
      <section className={`py-12 sm:py-16 ${effectiveDarkMode ? 'bg-gray-900/50' : 'bg-gray-100/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/calculator/home"
            onClick={handleStartPlanning}
            className={`inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl ${theme.button.primary} text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
          >
            Start Planning Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className={`${theme.text.muted} text-sm mt-4`}>
            Free to use. Anonymous. Accurate.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${effectiveDarkMode ? 'bg-gray-900/50' : 'bg-gray-100/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className={`${theme.text.secondary} text-sm`}>
              © 2025 The Ultimate Canadian Retirement Calculator
            </p>
            <p className={`${theme.text.muted} text-xs mt-2`}>
              Tax calculations based on 2025 federal and provincial tax rules. Results are estimates for planning purposes only.
            </p>
          </div>
        </div>
      </footer>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors text-white"
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image and caption */}
          <div
            className="flex flex-col items-center max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <Image
                src={SCREENSHOTS[lightboxIndex].src}
                alt={SCREENSHOTS[lightboxIndex].shortCaption}
                width={SCREENSHOTS[lightboxIndex].width}
                height={SCREENSHOTS[lightboxIndex].height}
                className="max-h-[70vh] w-auto object-contain rounded-2xl ring-1 ring-white/10"
                style={{ boxShadow: '0 0 30px rgba(99, 102, 241, 0.2), 0 0 60px rgba(139, 92, 246, 0.1)' }}
                priority
              />
            </div>
            <div className="mt-4 text-center max-w-2xl px-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                {SCREENSHOTS[lightboxIndex].shortCaption}
              </h3>
              <p className="text-gray-400 text-sm">
                {SCREENSHOTS[lightboxIndex].description}
              </p>
            </div>
            {/* Navigation row: prev / counter / next */}
            <div className="flex items-center gap-6 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(lightboxIndex === 0 ? SCREENSHOTS.length - 1 : lightboxIndex - 1)
                }}
                className="p-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors text-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-500 text-sm min-w-[3rem] text-center">
                {lightboxIndex + 1} / {SCREENSHOTS.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(lightboxIndex === SCREENSHOTS.length - 1 ? 0 : lightboxIndex + 1)
                }}
                className="p-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors text-white"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2.5s ease-in-out infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }
          50% {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 30px rgba(251, 146, 60, 0.3);
          }
        }
      `}</style>
    </div>
  )
}
