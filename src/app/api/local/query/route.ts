import { NextRequest, NextResponse } from 'next/server'
import { runLocalQuery, type LocalQueryRequest } from '@/lib/local/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json() as LocalQueryRequest
  return NextResponse.json(runLocalQuery(body))
}
