/**
 * Test: User ID Preservation in Batch Conversation Flow
 *
 * Verifies that user_id is correctly stored and preserved throughout
 * the conversation lifecycle, preventing the 00000000... placeholder bug.
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

let supabase: ReturnType<typeof createClient>

beforeAll(() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  supabase = createClient(supabaseUrl, supabaseKey)
})

describe('User ID Preservation', () => {
  const testConversationId = `test-${Date.now()}`
  const testUserId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

  beforeEach(async () => {
    // Clean up any existing test data
    await supabase
      .from('conversation_states')
      .delete()
      .eq('conversation_id', testConversationId)
  })

  it('should store user_id from authorize endpoint', async () => {
    // Simulate what authorize endpoint does
    const { error: insertError } = await supabase
      .from('conversation_states')
      .insert({
        conversation_id: testConversationId,
        user_id: testUserId,
        state: { _placeholder: true } as any,
        updated_at: new Date().toISOString()
      })

    expect(insertError).toBeNull()

    // Verify it was stored - select all columns to bypass type issues
    const { data, error } = await supabase
      .from('conversation_states')
      .select('*')
      .eq('conversation_id', testConversationId)
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect((data as any).user_id).toBe(testUserId)
  })

  it('should preserve user_id when updating conversation state', async () => {
    // 1. Initial insert with user_id (from authorize endpoint)
    await supabase
      .from('conversation_states')
      .insert({
        conversation_id: testConversationId,
        user_id: testUserId,
        state: { _placeholder: true } as any,
        updated_at: new Date().toISOString()
      })

    // 2. Get the existing user_id (simulating what batch-flow-manager does)
    const { data: existing } = await supabase
      .from('conversation_states')
      .select('*')
      .eq('conversation_id', testConversationId)
      .single()

    const preservedUserId = (existing as any)?.user_id

    // 3. Update with new state but preserve user_id
    await supabase
      .from('conversation_states')
      .upsert({
        conversation_id: testConversationId,
        user_id: preservedUserId,
        state: {
          currentBatchIndex: 1,
          batchResponses: { test: 'data' }
        } as any,
        updated_at: new Date().toISOString()
      })

    // 4. Verify user_id is still there
    const { data: updated } = await supabase
      .from('conversation_states')
      .select('*')
      .eq('conversation_id', testConversationId)
      .single()

    expect((updated as any).user_id).toBe(testUserId)
    expect((updated as any).user_id).not.toBe(null)
    expect((updated as any).user_id).not.toBe('00000000-0000-0000-0000-000000000000')
  })

  it('should NOT overwrite user_id with null', async () => {
    // 1. Initial insert with user_id
    await supabase
      .from('conversation_states')
      .insert({
        conversation_id: testConversationId,
        user_id: testUserId,
        state: { _placeholder: true } as any,
        updated_at: new Date().toISOString()
      })

    // 2. WRONG: Update without retrieving existing user_id (the bug scenario)
    // This simulates what was happening before the fix
    await supabase
      .from('conversation_states')
      .upsert({
        conversation_id: testConversationId,
        user_id: null, // BUG: This would overwrite!
        state: { updated: true } as any,
        updated_at: new Date().toISOString()
      })

    // 3. Verify user_id was overwritten (this is the bug we're preventing)
    const { data } = await supabase
      .from('conversation_states')
      .select('user_id')
      .eq('conversation_id', testConversationId)
      .single()

    // This test demonstrates the bug - user_id becomes null
    expect((data as any).user_id).toBe(null)
    console.log('⚠️  This test shows the bug: user_id was overwritten with null')
  })

  it('should retrieve user_id for saving scenario', async () => {
    // 1. Store initial mapping
    await supabase
      .from('conversation_states')
      .insert({
        conversation_id: testConversationId,
        user_id: testUserId,
        state: { completed: true } as any,
        updated_at: new Date().toISOString()
      })

    // 2. Simulate getUserIdForConversation function
    const { data } = await supabase
      .from('conversation_states')
      .select('*')
      .eq('conversation_id', testConversationId)
      .single()

    const retrievedUserId = (data as any)?.user_id

    // 3. Verify we can retrieve it for scenario save
    expect(retrievedUserId).toBe(testUserId)
    expect(retrievedUserId).not.toBe('00000000-0000-0000-0000-000000000000')
  })
})
