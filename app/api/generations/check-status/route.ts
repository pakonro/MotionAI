import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      error:
        'Status polling is handled via Convex Realtime. Please refresh your browser.',
    },
    { status: 410 }
  )
}
