import { NextResponse } from 'next/server'

/**
 * Convex Auth handles auth via its own HTTP routes. This callback is kept for OAuth redirects if needed.
 * For password auth, no callback is required.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  return NextResponse.redirect(`${origin}/dashboard`)
}
