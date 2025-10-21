'use client'

import dynamic from 'next/dynamic'

const VoiceFirstContent = dynamic(() => import('./VoiceFirstContent').then(mod => ({ default: mod.VoiceFirstContent })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Loading calculator...</div>
    </div>
  )
})

export default function VoiceFirstPage() {
  return <VoiceFirstContent />
}
