/**
 * Number Utilities
 *
 * Clean number handling to prevent floating point precision errors
 */

/**
 * Round a number to specified decimal places
 */
export function roundToDecimal(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(value * multiplier) / multiplier
}

/**
 * Round percentage to 1 decimal place (e.g., 6.5%)
 */
export function roundPercentage(value: number): number {
  return roundToDecimal(value, 1)
}

/**
 * Parse integer from string input (for ages, dollar amounts)
 * Returns null if empty or invalid
 * Strict: Only accepts whole numbers (no decimals)
 */
export function parseInteger(value: string): number | null {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  // Only accept digits (and optional leading minus sign)
  // This prevents decimal input from being silently truncated
  if (!/^-?\d+$/.test(value)) {
    return null
  }

  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? null : parsed
}

/**
 * Parse float from string input (for percentages)
 * Returns null if empty or invalid
 * Rounds to 1 decimal place (e.g., 6.55 → 6.6, 6.54 → 6.5)
 */
export function parsePercentage(value: string): number | null {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = parseFloat(value)
  if (isNaN(parsed)) {
    return null
  }

  // Round to 1 decimal place using explicit Math.round
  // This ensures consistent rounding: 6.55 → 6.6, 6.54 → 6.5
  return Math.round(parsed * 10) / 10
}
