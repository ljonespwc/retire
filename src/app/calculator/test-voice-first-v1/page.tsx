'use client'

import dynamic from 'next/dynamic'

const VoiceFirstContentV1 = dynamic(() => import('./VoiceFirstContentV1').then(mod => ({ default: mod.VoiceFirstContentV1 })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
      <div className="text-gray-600 animate-pulse">Loading calculator...</div>
    </div>
  )
})

export default function VoiceFirstPageV1() {
  return <VoiceFirstContentV1 />
}
