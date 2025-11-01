/**
 * CalculatorHeader Component
 *
 * Main header for the retirement calculator with branding,
 * authentication controls, and theme toggle.
 */

import { Sun, Moon, LogIn, LogOut, User } from 'lucide-react'

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
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-white/30 backdrop-blur flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0">
              🇨🇦
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                The Ultimate Canadian Retirement Calculator
              </h1>
              <p className="text-white/90 text-sm sm:text-base lg:text-lg mt-1">Tax-accurate. Future teller.</p>
            </div>
          </div>

          {/* Auth & Theme Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
