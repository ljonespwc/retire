/**
 * API Route: Generate Retirement Narrative
 *
 * Server-side endpoint that uses AI to generate a narrative summary
 * of retirement calculation results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRetirementNarrative } from '@/lib/ai/narrative-generator';
import { CalculationResults } from '@/types/calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const results: CalculationResults = body.results;

    if (!results || !results.year_by_year) {
      return NextResponse.json(
        { error: 'Invalid calculation results' },
        { status: 400 }
      );
    }

    const narrative = await generateRetirementNarrative(results);

    return NextResponse.json({ narrative });
  } catch (error) {
    console.error('Failed to generate narrative:', error);
    return NextResponse.json(
      { error: 'Failed to generate narrative' },
      { status: 500 }
    );
  }
}
