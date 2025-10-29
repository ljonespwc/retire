/**
 * Calculate API Route
 *
 * Triggered when user clicks "Calculate" button after voice conversation.
 * Runs the retirement projection calculation and returns results.
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateRetirementProjection } from '@/lib/calculations/engine'
import { createClient } from '@/lib/supabase/server'
import { Scenario } from '@/types/calculator'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scenario } = body as { scenario: Scenario }

    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario data is required' },
        { status: 400 }
      )
    }

    console.log(`🔢 Running calculation for scenario: ${scenario.name}`)

    // Get Supabase server client (has proper access to database)
    const supabase = await createClient()

    // Run calculation
    const results = await calculateRetirementProjection(supabase, scenario)

    console.log(`✅ Calculation complete for ${scenario.name}`)

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('❌ Calculation error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}
