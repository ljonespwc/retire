'use client'

import dynamic from 'next/dynamic'

const VoiceFirstContentV2Dark = dynamic(() => import('../test-voice-first/VoiceFirstContentV2Dark').then(mod => ({ default: mod.VoiceFirstContentV2Dark })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
      <div className="text-gray-400 animate-pulse">Loading calculator...</div>
    </div>
  )
})

export default function VoiceFirstPageV2Dark() {
  return <VoiceFirstContentV2Dark />
}
