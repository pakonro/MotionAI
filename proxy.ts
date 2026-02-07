import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server'

/**
 * Next.js 16: proxy runs in Node.js (not Edge), so cookies() works.
 * Convex Auth handles /api/auth and protected-route redirects.
 */
const isSignInPage = createRouteMatcher(['/login', '/signup'])
const isProtectedRoute = createRouteMatcher(['/dashboard', '/gallery'])

export const proxy = convexAuthNextjsMiddleware(async (req, { convexAuth }) => {
  if (isSignInPage(req) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(req, '/dashboard')
  }
  if (isProtectedRoute(req) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(req, '/login')
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}
