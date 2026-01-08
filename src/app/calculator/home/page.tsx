import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

const VoiceFirstContentV2 = dynamic(
  () => import('./VoiceFirstContentV2').then(mod => ({ default: mod.VoiceFirstContentV2 })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-teal-50 flex items-center justify-center">
        <div className="text-gray-600 animate-pulse">Loading calculator...</div>
      </div>
    )
  }
)

export const metadata: Metadata = {
  title: 'Canadian Retirement Calculator | Free CPP, OAS & Tax Planning Tool',
  description: 'Free retirement income calculator for Canadians. Model CPP/OAS timing, RRSP/RRIF withdrawals, provincial taxes, and compare what-if scenarios.',
  openGraph: {
    title: 'Canadian Retirement Calculator',
    description: 'Free retirement income calculator for Canadians. Model CPP/OAS timing, RRSP/RRIF withdrawals, and provincial taxes.',
    url: 'https://www.canadaretirecalc.com/calculator/home',
    type: 'website',
  },
}

export default function CalculatorPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Canadian Retirement Calculator',
    description: 'Free retirement income calculator for Canadians. Model CPP, OAS, RRSP/RRIF withdrawals, and tax impact across all provinces.',
    url: 'https://www.canadaretirecalc.com/calculator/home',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CAD',
    },
    featureList: [
      'CPP/OAS benefit optimization',
      'All 13 provinces and territories',
      'RRSP/RRIF withdrawal modeling',
      'Tax-efficient withdrawal sequencing',
      'What-if scenario comparison',
      'Year-by-year projections',
    ],
    provider: {
      '@type': 'Organization',
      name: 'Canada Retire Calc',
      url: 'https://www.canadaretirecalc.com',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <VoiceFirstContentV2 />
    </>
  )
}
