import Link from 'next/link'

export default function Home() {
  const prototypes = [
    {
      href: '/calculator/test-form-first',
      title: 'Prototype A: Form-First',
      description: 'Traditional form layout with floating voice assistant button'
    },
    {
      href: '/calculator/test-voice-first',
      title: 'Prototype B: Voice-First',
      description: 'Two-panel layout with conversation + live form preview'
    },
    {
      href: '/calculator/test-wizard',
      title: 'Prototype C: Wizard',
      description: 'Step-by-step wizard with voice or manual input choice'
    },
    {
      href: '/test-voice',
      title: 'Voice Integration Test',
      description: 'Basic voice conversation test (11-question flow)'
    }
  ]

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gray-50">
      <div className="z-10 max-w-4xl w-full flex flex-col gap-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Retire
          </h1>
          <p className="text-xl text-gray-600">
            Canadian Retirement Income Calculator
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">UX Prototypes</h2>
          <div className="grid gap-4">
            {prototypes.map((prototype) => (
              <Link
                key={prototype.href}
                href={prototype.href}
                className="block p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                  {prototype.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {prototype.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Voice-driven retirement planning with AI-powered conversation</p>
        </div>
      </div>
    </main>
  );
}
