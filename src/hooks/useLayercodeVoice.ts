/**
 * Layercode Voice Integration Hook
 *
 * Provides a React interface for voice conversation using Layercode's WebRTC agent.
 * Handles:
 * - WebRTC connection management
 * - Automatic voice activity detection (VAD)
 * - Audio level monitoring
 * - Conversation state
 */

'use client'

import { useLayercodeAgent } from '@layercode/react-sdk'
import { useState, useRef, useEffect } from 'react'

interface UseLayercodeVoiceOptions {
  metadata?: Record<string, any>
  onDataMessage?: (data: any) => void
  autoConnect?: boolean
}

export function useLayercodeVoice(options: UseLayercodeVoiceOptions = {}) {
  const conversationIdRef = useRef<string | null>(null)
  const [conversationStarted, setConversationStarted] = useState(false)

  // Use Layercode agent hook with automatic VAD
  const {
    status,
    userAudioAmplitude,
    agentAudioAmplitude,
    connect,
    disconnect,
  } = useLayercodeAgent({
    agentId: process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID!,
    authorizeSessionEndpoint: '/api/layercode/authorize',
    conversationId: conversationIdRef.current || undefined,
    metadata: options.metadata,
    onConnect: ({ conversationId }) => {
      console.log('✅ Connected to Layercode agent:', conversationId)
      if (conversationId) {
        conversationIdRef.current = conversationId
        setConversationStarted(true)
      }
    },
    onDisconnect: () => {
      console.log('⚠️ Disconnected from Layercode agent')
      setConversationStarted(false)
    },
    onError: (error) => {
      console.error('❌ Layercode error:', error)
      console.error('Agent ID:', process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID)
      console.error('Authorize endpoint: /api/layercode/authorize')
    },
    onDataMessage: (data) => {
      console.log('📊 Data message received:', data)
      // Pass through to parent component if handler provided
      if (options.onDataMessage) {
        options.onDataMessage(data)
      }
    }
  })

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (options.autoConnect !== false) {
      connect()
      return () => {
        disconnect()
      }
    }
  }, [])

  return {
    // Connection state
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    connectionStatus: status,

    // Audio levels for visual feedback (0-1 range)
    userAudioLevel: userAudioAmplitude,
    agentAudioLevel: agentAudioAmplitude,

    // Conversation state
    conversationStarted,
    conversationId: conversationIdRef.current,

    // Actions
    connect,
    disconnect,
    startNewConversation: () => {
      conversationIdRef.current = null
      setConversationStarted(false)
      disconnect()
      // Will create new conversation on next connection
    }
  }
}
