/**
 * Cleanup Job for Expired Conversation States
 *
 * conversation_states table is ephemeral (crash recovery only).
 * This job deletes records older than their expires_at timestamp.
 *
 * Run this periodically via:
 * - Vercel Cron Job
 * - Edge Function with scheduled trigger
 * - Manual API endpoint
 */

import { cleanupOldConversations } from './batch-flow-manager'

/**
 * Main cleanup function
 *
 * Deletes conversation_states records where expires_at < NOW()
 * Safe to run frequently (every hour or daily)
 *
 * @returns Number of conversations deleted
 */
export async function runConversationCleanup(): Promise<{
  success: boolean
  deletedCount: number
  error?: string
}> {
  try {
    console.log(`🧹 Starting conversation cleanup job...`)
    const deletedCount = await cleanupOldConversations()
    console.log(`✅ Cleanup complete: ${deletedCount} conversations deleted`)

    return {
      success: true,
      deletedCount
    }
  } catch (error) {
    console.error(`❌ Cleanup job failed:`, error)
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
