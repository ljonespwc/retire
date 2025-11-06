/**
 * Admin authorization utilities
 *
 * Checks if a user is authorized as admin (lance.jones@precisionnutrition.com)
 */

import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'lance.jones@precisionnutrition.com'

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

  return user.email === ADMIN_EMAIL
}

/**
 * Get the current admin user or null if not admin
 */
export async function getAdminUser() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || user.email !== ADMIN_EMAIL) {
    return null
  }

  return user
}
