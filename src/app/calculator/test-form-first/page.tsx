'use client'

import dynamic from 'next/dynamic'

const FormFirstContent = dynamic(() => import('./FormFirstContent').then(mod => ({ default: mod.FormFirstContent })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Loading calculator...</div>
    </div>
  )
})

export default function FormFirstPage() {
  return <FormFirstContent />
}
