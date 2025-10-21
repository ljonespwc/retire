/**
 * Voice Integration Test Page
 *
 * Simple test page to verify Layercode voice integration works.
 * Tests:
 * - WebRTC connection
 * - Speech-to-text (automatic via Layercode)
 * - AI response generation
 * - Text-to-speech (automatic via Layercode)
 */

'use client'

import dynamic from 'next/dynamic'

// Disable SSR for this component - Layercode SDK requires browser APIs
const TestVoiceContent = dynamic(
  () => import('./TestVoiceContent').then(mod => ({ default: mod.TestVoiceContent })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading voice test...</div>
      </div>
    )
  }
)

export default function TestVoicePage() {
  return <TestVoiceContent />
}
