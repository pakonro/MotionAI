import path from 'path'
import { NextRequest } from 'next/server'

// proxyAuthActionToConvex is not exported from @convex-dev/auth/nextjs/server;
// resolve via the exported nextjs/server entry (resolves to .../dist/nextjs/server/index.js), then load proxy.js from same dir.
let proxyFn: ((req: NextRequest, opts: object) => Promise<Response>) | null = null
async function getProxy() {
  if (proxyFn) return proxyFn
  const serverEntry = require.resolve('@convex-dev/auth/nextjs/server')
  const proxyPath = path.join(path.dirname(serverEntry), 'proxy.js')
  const mod = await import(proxyPath)
  proxyFn = mod.proxyAuthActionToConvex
  return proxyFn
}

/**
 * Auth proxy: runs in Node (request context) so cookies() works.
 * Client signIn/signOut POST to /api/auth and are proxied to Convex here.
 * Always return JSON so the Convex Auth client can parse the response.
 */
export async function POST(request: NextRequest) {
  try {
    const proxyAuthActionToConvex = await getProxy()
    if (!proxyAuthActionToConvex) {
      return new Response(JSON.stringify({ error: 'Auth proxy failed to load' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const response = await proxyAuthActionToConvex(request, {})
    // Ensure we never return an empty body (client always calls response.json())
    const cloned = response.clone()
    const text = await cloned.text()
    if (text == null || text.trim() === '') {
      return new Response(JSON.stringify({}), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auth request failed'
    console.error('[api/auth]', error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
