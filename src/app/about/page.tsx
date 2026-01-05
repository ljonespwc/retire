'use client'

import { useState, useEffect } from 'react'
import { CalculatorHeader } from '@/components/calculator/CalculatorHeader'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Send, CheckCircle, AlertCircle, BarChart3, ShieldCheck, Calculator, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ContactPage() {
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false)
  const [mounted, setMounted] = useState(false)
  const { user, isAnonymous, loading: authLoading, logout } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

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
      : 'bg-white border-gray-200',

    text: {
      primary: effectiveDarkMode ? 'text-gray-100' : 'text-gray-800',
      secondary: effectiveDarkMode ? 'text-gray-300' : 'text-gray-600',
      muted: effectiveDarkMode ? 'text-gray-400' : 'text-gray-500',
    },

    button: {
      primary: effectiveDarkMode
        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
        : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600',
    },

    input: {
      bg: effectiveDarkMode ? 'bg-gray-700' : 'bg-gray-50',
      border: effectiveDarkMode ? 'border-gray-600' : 'border-gray-300',
      text: effectiveDarkMode ? 'text-gray-100' : 'text-gray-900',
      placeholder: effectiveDarkMode ? 'placeholder-gray-400' : 'placeholder-gray-500',
    },

    callout: effectiveDarkMode
      ? 'bg-violet-900/20 border-l-4 border-violet-500'
      : 'bg-violet-50 border-l-4 border-violet-400',

    quote: effectiveDarkMode
      ? 'bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border border-indigo-700/30'
      : 'bg-gradient-to-br from-orange-50 to-rose-50 border border-orange-100',

    iconColor: effectiveDarkMode ? 'text-indigo-400' : 'text-orange-500',
  }

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const client = createClient()
      const { error } = await client
        .from('contact_submissions')
        .insert({ name, email, message })

      if (error) throw error

      setSubmitSuccess(true)
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setSubmitError('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen ${theme.background} ${effectiveDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <CalculatorHeader
        isDarkMode={effectiveDarkMode}
        theme={theme}
        isAnonymous={isAnonymous}
        authLoading={authLoading}
        user={user}
        onToggleDarkMode={handleToggleDarkMode}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={logout}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Hero Section */}
        <section className="text-center mb-12 sm:mb-16">
          {/* Photo */}
          <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6 rounded-full overflow-hidden">
            <Image
              src="/lance.jpg"
              alt="Lance"
              width={160}
              height={160}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${theme.text.primary} mb-4`}>
            Hi, I'm Lance. <span className={theme.text.muted}>(On the left 😎)</span>
          </h1>
          <p className={`text-xl sm:text-2xl ${theme.text.secondary}`}>
            I built this calculator because the existing ones aren't good enough.
          </p>
        </section>

        {/* Story Section */}
        <section className={`${theme.card} rounded-2xl p-6 sm:p-8 mb-8 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
          <div className={`prose prose-lg max-w-none ${effectiveDarkMode ? 'prose-invert' : ''}`}>
            <p className={`${theme.text.secondary} text-lg leading-relaxed mb-4`}>
              I like building things that solve real problems. Recently, I started
              digging into retirement planning for myself and hit the same wall everyone
              hits: the calculators from banks and insurance companies are... not great.
            </p>
            <p className={`${theme.text.secondary} text-lg leading-relaxed mb-6`}>
              They're either too simplistic (plug in three numbers, get a vague answer) or
              they're designed to funnel you toward buying their products. None of them
              let you actually explore the questions that keep you up at night:
            </p>

            {/* Purple Callout */}
            <div className={`${theme.callout} rounded-xl p-6 mb-6`}>
              <p className={`${theme.text.primary} text-lg leading-relaxed font-medium`}>
                What if I retire at 60 instead of 65?<br />
                What if I take CPP early?<br />
                What happens if the market drops right before I retire?<br />
                What if I live to 95?
              </p>
            </div>

            <p className={`${theme.text.secondary} text-lg leading-relaxed`}>
              So I built something better.
            </p>
          </div>
        </section>

        {/* Differentiator Section */}
        <section className={`${theme.card} rounded-2xl p-6 sm:p-8 mb-8 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
          <h2 className={`text-2xl sm:text-3xl font-bold ${theme.text.primary} mb-6`}>
            What's different about this calculator
          </h2>
          <div className="flex flex-col gap-5">
            <div className="flex gap-4 items-start">
              <BarChart3 className={`w-6 h-6 flex-shrink-0 ${theme.iconColor}`} />
              <p className={`${theme.text.secondary} text-lg leading-relaxed`}>
                <strong>Side-by-side scenarios.</strong> Most calculators give you one number and call it a day. This one lets you run up to 12 scenarios—so you can actually see what happens when you change the variables.
              </p>
            </div>
            <div className="flex gap-4 items-start">
              <ShieldCheck className={`w-6 h-6 flex-shrink-0 ${theme.iconColor}`} />
              <p className={`${theme.text.secondary} text-lg leading-relaxed`}>
                <strong>No product pitches.</strong> No mutual funds. No annuity upsells. No "talk to an advisor" prompts. Just math, visualized, so you can make your own informed decisions.
              </p>
            </div>
            <div className="flex gap-4 items-start">
              <Calculator className={`w-6 h-6 flex-shrink-0 ${theme.iconColor}`} />
              <p className={`${theme.text.secondary} text-lg leading-relaxed`}>
                <strong>Real Canadian tax math.</strong> Federal and provincial brackets for all 13 provinces and territories. CPP/OAS rules. RRSP/RRIF/TFSA—all built in and kept up to date.
              </p>
            </div>
          </div>
        </section>

        {/* Philosophy Quote */}
        <section className={`${theme.quote} rounded-2xl p-8 mb-8`}>
          <p className={`text-xl italic leading-relaxed ${theme.text.secondary}`}>
            The banks want to sell you mutual funds. The insurance companies want to sell you annuities. I just want to help you see your numbers clearly.
          </p>
        </section>

        {/* Contact Form Section */}
        <section className={`${theme.card} rounded-2xl p-6 sm:p-8 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
          <h2 className={`text-2xl sm:text-3xl font-bold ${theme.text.primary} mb-2`}>
            Get in touch
          </h2>
          <p className={`${theme.text.secondary} mb-6`}>
            Have feedback? Found a bug? Want to suggest a feature? I'd love to hear from you.
          </p>

          {submitSuccess ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <p className="text-green-700 font-medium">
                Thanks for reaching out! I'll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <p className="text-red-700">{submitError}</p>
                </div>
              )}

              <div>
                <label htmlFor="name" className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 ${theme.input.bg} border ${theme.input.border} ${theme.input.text} ${theme.input.placeholder} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50`}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 ${theme.input.bg} border ${theme.input.border} ${theme.input.text} ${theme.input.placeholder} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50`}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={isSubmitting}
                  rows={5}
                  className={`w-full px-4 py-3 ${theme.input.bg} border ${theme.input.border} ${theme.input.text} ${theme.input.placeholder} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none disabled:opacity-50`}
                  placeholder="What's on your mind?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto px-8 py-3 ${theme.button.primary} text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <p className={`${theme.text.secondary} mb-4`}>
            Ready to see your numbers?
          </p>
          <Link
            href="/calculator/home"
            className={`inline-flex items-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 ${theme.button.primary}`}
          >
            Try the Calculator
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
