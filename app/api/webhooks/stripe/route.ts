import { NextRequest, NextResponse } from 'next/server'

/**
 * Stripe webhook is disabled. When re-enabled, use Convex HTTP action POST /stripe
 * (convex/http.ts) to verify signature and call internal.profiles.addCredits.
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({
    message: 'Stripe webhook disabled. Use Convex HTTP /stripe when ready.',
    received: true,
  })
}
