'use client'

import { useEffect } from 'react'

export function ErrorBoundary({ error }: { error: Error }) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  const isConfigError =
    error.message.includes('NEXT_PUBLIC_CONVEX_URL') ||
    error.message.includes('Invalid Convex URL')

  if (isConfigError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-2xl w-full border border-border rounded-lg bg-card p-8">
          <h1 className="text-2xl font-bold mb-4 text-destructive">
            Configuration Error
          </h1>
          <p className="text-muted-foreground mb-4">
            Convex is not configured. Set NEXT_PUBLIC_CONVEX_URL in your environment.
          </p>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm font-mono mb-2">
              Run <code className="bg-background px-2 py-1 rounded">npx convex dev</code> (Node 20+) to get your deployment URL, then add to <code className="bg-background px-2 py-1 rounded">.env.local</code>:
            </p>
            <pre className="text-xs overflow-x-auto">
              {`NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud`}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full border border-border rounded-lg bg-card p-8">
        <h1 className="text-2xl font-bold mb-4 text-destructive">
          An Error Occurred
        </h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}
