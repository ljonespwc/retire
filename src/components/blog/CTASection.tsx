'use client'

import Link from 'next/link'
import { Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CTASectionProps {
  ctaText?: string | null
  isDarkMode: boolean
}

const DEFAULT_CTA_TEXT = 'Try the Calculator'
const DEFAULT_CTA_SUBTITLE = 'Run the numbers. See what\'s possible.'

export function CTASection({ ctaText, isDarkMode }: CTASectionProps) {
  const buttonText = ctaText || DEFAULT_CTA_TEXT

  return (
    <div
      className={`
        my-12 p-8 rounded-3xl border-2
        ${isDarkMode
          ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700'
          : 'bg-gradient-to-r from-rose-50 to-orange-50 border-rose-200'
        }
      `}
    >
      <div className="max-w-2xl mx-auto text-center">
        <h3 className={`text-2xl sm:text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Can You Retire When You Want?
        </h3>
        <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {DEFAULT_CTA_SUBTITLE}
        </p>

        <Link href="/calculator/home">
          <Button
            className={`
              ${isDarkMode
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
                : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600'
              }
              text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200
            `}
          >
            <Calculator className="w-6 h-6 mr-2" />
            {buttonText}
          </Button>
        </Link>

        <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Free to use. Anonymous. Accurate.
        </p>
      </div>
    </div>
  )
}
