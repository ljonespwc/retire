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
 */
export function parseInteger(value: string): number | null {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? null : parsed
}

/**
 * Parse float from string input (for percentages)
 * Returns null if empty or invalid
 * Rounds to 1 decimal place
 */
export function parsePercentage(value: string): number | null {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : roundPercentage(parsed)
}
