'use client'

import dynamic from 'next/dynamic'

const VoiceFirstContentV3 = dynamic(() => import('./VoiceFirstContentV3').then(mod => ({ default: mod.VoiceFirstContentV3 })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-400 animate-pulse">Loading calculator...</div>
    </div>
  )
})

export default function VoiceFirstPageV3() {
  return <VoiceFirstContentV3 />
}
