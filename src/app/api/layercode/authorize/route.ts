/**
 * Layercode Session Authorization Endpoint
 *
 * This endpoint is called by the Layercode React SDK to obtain a session key
 * for establishing a WebRTC connection to the Layercode voice agent.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Get environment variables
    const apiKey = process.env.LAYERCODE_API_KEY
    const agentId = process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID

    if (!apiKey) {
      throw new Error('LAYERCODE_API_KEY is not configured')
    }

    if (!agentId) {
      throw new Error('NEXT_PUBLIC_LAYERCODE_PIPELINE_ID is not configured')
    }

    // Parse request body
    const requestBody = await request.json()

    console.log('🔐 Authorization request body:', JSON.stringify(requestBody, null, 2))

    // Get user_id from Supabase session (authorize endpoint has cookies)
    let userId: string | undefined
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        console.log('🔐 Got user_id from session:', userId)
      }
    } catch (error) {
      console.error('❌ Error getting user from session:', error)
    }

    // Prepare the authorization request
    const authRequest = {
      agent_id: agentId,
      // Include conversation_id if resuming a conversation
      ...(requestBody.conversation_id && { conversation_id: requestBody.conversation_id }),
      // Include any metadata from the frontend
      ...(requestBody.metadata && { metadata: requestBody.metadata })
    }

    console.log('🔐 Sending authorization request with metadata:', JSON.stringify(authRequest.metadata, null, 2))

    // Call Layercode authorization endpoint
    const response = await fetch('https://api.layercode.com/v1/agents/web/authorize_session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(authRequest)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Layercode authorization failed:', errorText)
      throw new Error(errorText || response.statusText)
    }

    const data = await response.json()

    const conversationId = data.conversation_id || data.session_id

    // Store user_id mapping for this conversation so webhook can retrieve it
    // Use service role key to bypass RLS (webhook won't have user session)
    if (userId && conversationId) {
      try {
        const supabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Just insert user_id mapping - don't create full state yet
        await supabase
          .from('conversation_states')
          .insert({
            conversation_id: conversationId,
            user_id: userId,
            state: { _placeholder: true } as any, // Minimal placeholder
            updated_at: new Date().toISOString()
          })
        console.log(`💾 Stored user_id mapping for conversation ${conversationId}`)
      } catch (error) {
        console.error('❌ Error storing user_id mapping:', error)
      }
    }

    // Return the session key and conversation ID to the frontend
    return NextResponse.json({
      client_session_key: data.client_session_key,
      conversation_id: conversationId,
      config: data.config
    })
  } catch (error: any) {
    console.error('Layercode authorization error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to authorize Layercode session' },
      { status: 500 }
    )
  }
}
