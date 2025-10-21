'use client'

import dynamic from 'next/dynamic'

const WizardContent = dynamic(() => import('./WizardContent').then(mod => ({ default: mod.WizardContent })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Loading calculator...</div>
    </div>
  )
})

export default function WizardPage() {
  return <WizardContent />
}
