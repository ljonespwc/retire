/**
 * CalculatorHeader Component
 *
 * Main header for the retirement calculator with branding,
 * authentication controls, and theme toggle.
 */

import Image from 'next/image'
import Link from 'next/link'
import { Sun, Moon, LogIn, LogOut, User, BookOpen } from 'lucide-react'

interface CalculatorHeaderProps {
  isDarkMode: boolean
  theme: any
  isAnonymous: boolean
  authLoading: boolean
  user: { email?: string | null; id: string } | null
  onToggleDarkMode: () => void
  onLoginClick: () => void
  onLogout: () => void
}

export function CalculatorHeader({
  isDarkMode,
  theme,
  isAnonymous,
  authLoading,
  user,
  onToggleDarkMode,
  onLoginClick,
  onLogout
}: CalculatorHeaderProps) {
  return (
    <div className={theme.headerBg}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <Link href="/calculator/home" className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 hover:opacity-90 transition-opacity">
            <Image
              src="/logo.png"
              alt="Retire logo"
              width={56}
              height={56}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-bold text-white tracking-tight leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <span className="hidden sm:inline text-xl md:text-2xl lg:text-3xl">The Ultimate Canadian Retirement Calculator</span>
                <span className="sm:hidden text-base">Canadian Retirement Calculator</span>
              </h1>
              <p className="text-white/90 text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1">100% Canadian. Tax-accurate. Future Teller.</p>
            </div>
          </Link>

          {/* Navigation & Auth Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/articles"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur transition-all duration-200 text-white text-sm sm:text-base font-medium"
              aria-label="Must-Reads"
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Must-Reads</span>
            </Link>
            {/* About Link */}
            <Link
              href="/about"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur transition-all duration-200 text-white text-sm sm:text-base font-medium"
              aria-label="About"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">About</span>
            </Link>
            {!authLoading && (
              <>
                {isAnonymous ? (
                  <button
                    onClick={onLoginClick}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur transition-all duration-200 text-white text-sm sm:text-base font-medium"
                    aria-label="Login"
                  >
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Login</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 backdrop-blur text-white text-sm">
                      <User className="w-4 h-4" />
                      <span className="max-w-[120px] truncate">{user?.email}</span>
                    </div>
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur transition-all duration-200 text-white text-sm sm:text-base font-medium"
                      aria-label="Logout"
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Theme Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-all duration-200"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
