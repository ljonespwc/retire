/**
 * Share Token Generation Utility
 *
 * Generates cryptographically secure random tokens for sharing scenarios.
 */

import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure random token for sharing
 *
 * @returns 32-character hexadecimal string (2^128 possible combinations)
 */
export function generateShareToken(): string {
  // Generate 16 random bytes (128 bits)
  // Convert to hex string (32 characters)
  return randomBytes(16).toString('hex')
}

/**
 * Validate a share token format
 *
 * @param token - Token to validate
 * @returns true if token is valid format (32 hex characters)
 */
export function isValidShareToken(token: string): boolean {
  return /^[a-f0-9]{32}$/.test(token)
}
