import Link from 'next/link'

export default function Home() {
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
          <h2 className="text-2xl font-semibold mb-6">Voice-First Calculator</h2>
          <p className="text-gray-600 mb-6">
            Have a natural conversation with our AI to plan your retirement.
            Answer questions about your age, savings, and goals, and get instant projections.
          </p>

          <Link
            href="/calculator/home"
            className="block p-6 border-2 border-blue-500 bg-blue-50 rounded-lg hover:border-blue-600 hover:bg-blue-100 transition-colors group"
          >
            <h3 className="text-lg font-semibold text-blue-900 group-hover:text-blue-700 mb-2">
              Start Planning Your Retirement
            </h3>
            <p className="text-sm text-blue-700">
              Voice-driven data collection with real-time form preview
            </p>
          </Link>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Voice-driven retirement planning with AI-powered conversation</p>
        </div>
      </div>
    </main>
  );
}
