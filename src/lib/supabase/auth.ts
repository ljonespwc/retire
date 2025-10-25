/**
 * Supabase Authentication Helpers
 *
 * Implements anonymous-first auth pattern:
 * 1. Anonymous users can use calculator without signup
 * 2. After calculation, prompt to upgrade to full account
 * 3. All data (scenarios) preserved during upgrade
 */

import { createClient } from './client'
import type { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string | null
  isAnonymous: boolean
  tier: 'basic' | 'pro' | 'advanced'
}

/**
 * Get or create an anonymous user session
 *
 * This is called on page load to ensure every user has a session,
 * even if they haven't signed up. Anonymous sessions allow users to:
 * - Complete voice conversations
 * - Save scenarios (tied to anonymous user_id)
 * - Upgrade to full account later (preserving all data)
 *
 * @returns User object or null if creation failed
 */
export async function getOrCreateAnonUser(): Promise<User | null> {
  const supabase = createClient()

  try {
    // Check if user already has a session (anonymous or authenticated)
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      console.log('✅ Existing session found:', session.user.is_anonymous ? 'anonymous' : 'authenticated')
      return session.user
    }

    // No session - create anonymous user
    console.log('📝 Creating anonymous user session...')
    const { data, error } = await supabase.auth.signInAnonymously()

    if (error || !data.user) {
      console.error('❌ Failed to create anonymous user:', error)
      return null
    }

    console.log('✅ Anonymous user created:', data.user.id)

    // Create corresponding record in public.users table
    await createPublicUserRecord(data.user.id, true)

    return data.user
  } catch (error) {
    console.error('❌ Error in getOrCreateAnonUser:', error)
    return null
  }
}

/**
 * Create a record in public.users table
 * Called after auth.users is created (either anonymous or full signup)
 */
async function createPublicUserRecord(userId: string, isAnonymous: boolean, email?: string): Promise<void> {
  const supabase = createClient()

  try {
    // For anonymous users, use a placeholder email (Supabase users table may require unique email)
    const userEmail = isAnonymous
      ? `anon-${userId}@retire.app`
      : (email || `user-${userId}@retire.app`)

    const { error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userEmail,
        tier: 'basic',
        preferences: {}
      }, {
        onConflict: 'id',
        ignoreDuplicates: true
      })

    if (error) {
      console.error('❌ Failed to create public.users record:', error)
    } else {
      console.log('✅ Created public.users record for:', userId)
    }
  } catch (error) {
    console.error('❌ Error creating public user record:', error)
  }
}

/**
 * Upgrade anonymous user to full account
 *
 * This preserves all scenarios and data by keeping the same user_id.
 * Supabase automatically updates auth.users.is_anonymous = false.
 *
 * @param email - User's email
 * @param password - User's password
 * @returns Success boolean and error message if failed
 */
export async function upgradeAnonUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Get current anonymous session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No active session' }
    }

    if (!user.is_anonymous) {
      return { success: false, error: 'User is already authenticated' }
    }

    console.log('🔄 Upgrading anonymous user to full account:', user.id)

    // Update the anonymous user with email and password
    // This automatically sets is_anonymous = false
    const { error } = await supabase.auth.updateUser({
      email,
      password
    })

    if (error) {
      console.error('❌ Failed to upgrade user:', error)
      return { success: false, error: error.message }
    }

    // Update public.users table with email
    await supabase
      .from('users')
      .update({ email })
      .eq('id', user.id)

    console.log('✅ User upgraded successfully')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error upgrading user:', message)
    return { success: false, error: message }
  }
}

/**
 * Sign up a new user (not upgrading from anonymous)
 *
 * @param email - User's email
 * @param password - User's password
 * @returns Success boolean and error message if failed
 */
export async function signUpUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      console.error('❌ Signup failed:', error)
      return { success: false, error: error.message }
    }

    if (data.user) {
      // Create public.users record
      await createPublicUserRecord(data.user.id, false, email)
      console.log('✅ User signed up:', data.user.id)
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error signing up:', message)
    return { success: false, error: message }
  }
}

/**
 * Log in existing user
 *
 * @param email - User's email
 * @param password - User's password
 * @returns Success boolean and error message if failed
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('❌ Login failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ User logged in')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error logging in:', message)
    return { success: false, error: message }
  }
}

/**
 * Log out current user
 */
export async function logoutUser(): Promise<void> {
  const supabase = createClient()

  try {
    await supabase.auth.signOut()
    console.log('✅ User logged out')
  } catch (error) {
    console.error('❌ Error logging out:', error)
  }
}

/**
 * Get current user (anonymous or authenticated)
 *
 * @returns AuthUser object or null if no session
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get tier from public.users table
    const { data: publicUser } = await supabase
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email || null,
      isAnonymous: user.is_anonymous || false,
      tier: publicUser?.tier || 'basic'
    }
  } catch (error) {
    console.error('❌ Error getting current user:', error)
    return null
  }
}
