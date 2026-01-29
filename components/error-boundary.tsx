'use client'

import { useEffect } from 'react'

export function ErrorBoundary({ error }: { error: Error }) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  const isConfigError =
    error.message.includes('NEXT_PUBLIC_SUPABASE_URL') ||
    error.message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    error.message.includes('Invalid supabaseUrl')

  if (isConfigError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-2xl w-full border border-border rounded-lg bg-card p-8">
          <h1 className="text-2xl font-bold mb-4 text-destructive">
            Configuration Error
          </h1>
          <p className="text-muted-foreground mb-4">
            Your Supabase environment variables are not configured correctly.
          </p>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm font-mono mb-2">
              Please update your <code className="bg-background px-2 py-1 rounded">.env.local</code> file with:
            </p>
            <pre className="text-xs overflow-x-auto">
              {`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Create a Supabase project at https://supabase.com</li>
            <li>Go to Project Settings → API</li>
            <li>Copy the Project URL and anon/public key</li>
            <li>Add them to your <code className="bg-muted px-1 rounded">.env.local</code> file</li>
            <li>Restart your development server</li>
          </ol>
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
