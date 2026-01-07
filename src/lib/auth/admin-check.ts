/**
 * Admin authorization utilities
 *
 * Checks if a user is authorized as admin (lance.jones@precisionnutrition.com)
 */

import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = [
  'lance.jones@precisionnutrition.com',
  'lancecj@gmail.com',
]

/**
 * Check if an email is an admin email
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email)
}

/**
 * Check if the current user is an admin
 * Returns true if user is authenticated and has admin email
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return false
  }

  return isAdminEmail(user.email)
}

/**
 * Get the current admin user or null if not admin
 */
export async function getAdminUser() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || !isAdminEmail(user.email)) {
    return null
  }

  return user
}
