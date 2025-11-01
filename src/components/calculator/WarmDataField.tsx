/**
 * WarmDataField Component
 *
 * Theme-aware form field component with edit/display modes.
 * Supports multiple input types (number, currency, percentage, text, select).
 */

import { parseInteger, parsePercentage } from '@/lib/utils/number-utils'

interface WarmDataFieldProps {
  label: string
  value: any
  editMode: boolean
  onEdit?: (val: any) => void
  type: 'number' | 'currency' | 'percentage' | 'text' | 'select'
  options?: { value: string; label: string }[]
  editValue?: any
  isDarkMode: boolean
  theme: any
  onFocus?: () => void
  isRequired?: boolean
}

export function WarmDataField({
  label,
  value,
  editMode,
  onEdit,
  type,
  options,
  editValue,
  isDarkMode,
  theme,
  onFocus,
  isRequired = false
}: WarmDataFieldProps) {
  // Auto-scroll on mobile to keep focused field visible above banner
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (onFocus) onFocus()

    // Only on mobile (when help banner is visible)
    if (window.innerWidth >= 1024) return

    // Immediate scroll (no delay) so field is visible before banner animates in
    setTimeout(() => {
      const element = e.target
      const offset = 120 // Padding from top of viewport

      // Get element position
      const rect = element.getBoundingClientRect()
      const elementTop = rect.top + window.scrollY

      // Scroll so element is visible in upper half of viewport
      const scrollTo = elementTop - offset

      window.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      })
    }, 50) // Minimal delay, just enough for focus to register
  }

  const formatValue = () => {
    if (value === null || value === undefined) return <span className={`${theme.text.muted} text-sm`}>—</span>
    if (type === 'currency') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>${value.toLocaleString()}</span>
    if (type === 'percentage') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>{value}%</span>
    if (type === 'number') return <span className={`${theme.text.primary} font-bold text-lg sm:text-xl`}>{value}</span>
    return <span className={`${theme.text.primary} font-semibold text-base sm:text-lg`}>{value}</span>
  }

  const isEmpty = value === null || value === undefined || value === '';
  const showRequiredBorder = isRequired && isEmpty && editMode;

  return (
    <div className="space-y-2">
      <label className={`block text-xs sm:text-xs font-bold ${theme.text.muted} uppercase tracking-wider`}>
        {label}
      </label>
      {editMode && onEdit ? (
        type === 'select' ? (
          <select
            value={editValue !== undefined ? editValue : value || ''}
            onChange={(e) => onEdit(e.target.value || null)}
            onFocus={handleFocus}
            autoComplete="off"
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-2xl text-base sm:text-lg focus:ring-2 transition-all ${theme.input} ${
              showRequiredBorder ? 'border-red-500 ring-2 ring-red-500/50' : ''
            } ${isDarkMode ? 'focus:ring-blue-400 focus:border-blue-400' : 'focus:ring-rose-400 focus:border-rose-400'}`}
          >
            <option value="">Select...</option>
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type === 'text' ? 'text' : 'number'}
            value={value ?? ''}
            onChange={(e) => {
              if (type === 'text') {
                onEdit(e.target.value || null)
              } else if (type === 'percentage') {
                // Percentages: allow 1 decimal place
                onEdit(parsePercentage(e.target.value))
              } else {
                // Ages and currency: integers only
                onEdit(parseInteger(e.target.value))
              }
            }}
            onFocus={handleFocus}
            autoComplete="off"
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-2xl text-base sm:text-lg focus:ring-2 transition-all ${theme.input} ${
              showRequiredBorder ? 'border-red-500 ring-2 ring-red-500/50' : ''
            } ${isDarkMode ? 'focus:ring-blue-400 focus:border-blue-400' : 'focus:ring-rose-400 focus:border-rose-400'}`}
            step={type === 'percentage' ? '0.1' : '1'}
          />
        )
      ) : (
        <div className={`px-4 sm:px-5 py-3 sm:py-4 rounded-2xl border-2 transition-all duration-300 ${
          isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800/20 border-gray-600' : 'bg-gradient-to-br from-gray-50 to-orange-50/20 border-gray-200'
        }`}>
          {formatValue()}
        </div>
      )}
    </div>
  )
}
