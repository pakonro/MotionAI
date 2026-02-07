/** True when NEXT_PUBLIC_CONVEX_URL is set (Convex backend available). */
export function isConvexConfigured(): boolean {
  if (typeof window === 'undefined') {
    return !!process.env.NEXT_PUBLIC_CONVEX_URL
  }
  return !!process.env.NEXT_PUBLIC_CONVEX_URL
}
