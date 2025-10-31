/**
 * API Route: Generate Variant Insight
 *
 * Server-side endpoint that uses AI to generate a key insight comparing
 * baseline vs variant scenario results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateVariantInsight } from '@/lib/ai/variant-insight-generator';
import { CalculationResults } from '@/types/calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const baselineResults: CalculationResults = body.baselineResults;
    const variantResults: CalculationResults = body.variantResults;
    const variantName: string = body.variantName;
    const baselineScenarioName: string | undefined = body.baselineScenarioName;

    if (!baselineResults || !variantResults || !variantName) {
      return NextResponse.json(
        { error: 'Missing required fields: baselineResults, variantResults, variantName' },
        { status: 400 }
      );
    }

    if (!baselineResults.year_by_year || !variantResults.year_by_year) {
      return NextResponse.json(
        { error: 'Invalid calculation results' },
        { status: 400 }
      );
    }

    const insight = await generateVariantInsight(
      baselineResults,
      variantResults,
      variantName,
      baselineScenarioName
    );

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('Failed to generate insight:', error);
    return NextResponse.json(
      { error: 'Failed to generate insight' },
      { status: 500 }
    );
  }
}
