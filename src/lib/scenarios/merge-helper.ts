/**
 * Scenario Merge Helper
 *
 * Utilities for merging anonymous scenarios with account scenarios
 * when user logs in from a new device.
 */

import { createClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get count of anonymous scenarios for current session
 * (scenarios with source='voice' that belong to current anonymous user)
 */
export async function getAnonymousScenarioCount(): Promise<number> {
  try {
    const client = createClient()
    const { data: { user } } = await client.auth.getUser()

    if (!user?.is_anonymous) {
      return 0
    }

    const { count, error } = await client
      .from('scenarios')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error counting anonymous scenarios:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getAnonymousScenarioCount:', error)
    return 0
  }
}

/**
 * Merge anonymous scenarios into authenticated account
 * (transfers ownership from anonymous user_id to authenticated user_id)
 */
export async function mergeAnonymousScenarios(
  anonymousUserId: string,
  authenticatedUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createClient()

    // Update all scenarios from anonymous user to authenticated user
    const { error } = await client
      .from('scenarios')
      .update({ user_id: authenticatedUserId })
      .eq('user_id', anonymousUserId)

    if (error) {
      console.error('Error merging scenarios:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Merged scenarios from ${anonymousUserId} to ${authenticatedUserId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in mergeAnonymousScenarios:', message)
    return { success: false, error: message }
  }
}

/**
 * Delete all anonymous scenarios
 * (used when user chooses "Replace with account scenarios")
 */
export async function deleteAnonymousScenarios(
  anonymousUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createClient()

    const { error } = await client
      .from('scenarios')
      .delete()
      .eq('user_id', anonymousUserId)

    if (error) {
      console.error('Error deleting anonymous scenarios:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Deleted anonymous scenarios for ${anonymousUserId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in deleteAnonymousScenarios:', message)
    return { success: false, error: message }
  }
}
