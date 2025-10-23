/**
 * API Route for Conversation Cleanup
 *
 * DELETE /api/cleanup-conversations
 *
 * Manually trigger cleanup of expired conversation_states.
 * In production, this should be:
 * 1. Protected by auth/API key
 * 2. Called by Vercel Cron or scheduled Edge Function
 */

import { NextResponse } from 'next/server'
import { runConversationCleanup } from '@/lib/conversation/cleanup-conversations'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/cleanup-conversations
 *
 * Triggers cleanup of expired conversation states
 */
export async function DELETE() {
  try {
    // TODO: Add authentication check here
    // For now, allow any DELETE request (development only)

    const result = await runConversationCleanup()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} expired conversations`,
        deletedCount: result.deletedCount
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Cleanup failed',
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Cleanup API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/cleanup-conversations
 *
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    service: 'Conversation Cleanup',
    status: 'ready',
    usage: 'Send DELETE request to trigger cleanup'
  })
}
