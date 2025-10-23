'use client'

import dynamic from 'next/dynamic'

const VoiceFirstContentV2 = dynamic(() => import('./VoiceFirstContentV2').then(mod => ({ default: mod.VoiceFirstContentV2 })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-teal-50 flex items-center justify-center">
      <div className="text-gray-600 animate-pulse">Loading calculator...</div>
    </div>
  )
})

export default function VoiceFirstPageV2() {
  return <VoiceFirstContentV2 />
}
