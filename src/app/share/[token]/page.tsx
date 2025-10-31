/**
 * Shared Scenario Page
 *
 * Public page for viewing shared retirement scenarios.
 * No authentication required. Server-side data fetching.
 */

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSharedScenario } from '@/lib/supabase/queries'
import { isValidShareToken } from '@/lib/utils/share-token'
import { SharedReport } from '@/components/shared/SharedReport'
import { Scenario } from '@/types/calculator'
import { CalculationResults } from '@/types/calculator'
import { Metadata } from 'next'

interface PageProps {
  params: Promise<{
    token: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params

  // Validate token format
  if (!isValidShareToken(token)) {
    return {
      title: 'Invalid Link',
      description: 'This retirement scenario link is invalid.'
    }
  }

  const supabase = await createClient()
  const { data: scenario } = await getSharedScenario(supabase, token)

  if (!scenario) {
    return {
      title: 'Scenario Not Found',
      description: 'This retirement scenario is no longer available.'
    }
  }

  return {
    title: `${scenario.name} - Shared Retirement Scenario`,
    description: `View this shared retirement scenario: ${scenario.name}. Create your own personalized retirement plan.`,
    openGraph: {
      title: `${scenario.name} - Retirement Scenario`,
      description: 'View this shared Canadian retirement scenario with detailed projections and analysis.',
    }
  }
}

export default async function SharedScenarioPage({ params }: PageProps) {
  const { token } = await params

  // Validate token format
  if (!isValidShareToken(token)) {
    notFound()
  }

  // Fetch shared scenario (public access, no auth required)
  const supabase = await createClient()
  const { data: scenarioRow, error } = await getSharedScenario(supabase, token)

  if (error || !scenarioRow || !scenarioRow.inputs) {
    notFound()
  }

  // Parse scenario and results from database row
  const inputs = scenarioRow.inputs as any // JSONB field from database
  const scenario: Scenario = {
    id: scenarioRow.id,
    name: scenarioRow.name,
    basic_inputs: inputs.basic_inputs,
    assets: inputs.assets,
    income_sources: inputs.income_sources,
    expenses: inputs.expenses,
    assumptions: inputs.assumptions
  }

  const results: CalculationResults = scenarioRow.results as unknown as CalculationResults

  // Extract narrative from results if available
  const narrative = (scenarioRow.results as any)?.narrative || null

  return (
    <SharedReport
      scenario={scenario}
      results={results}
      narrative={narrative}
      rawInputs={inputs}
      isDarkMode={false} // TODO: Detect user preference or default to light
    />
  )
}
