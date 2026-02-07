export default function SetupPage() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const isConfigured = !!convexUrl && convexUrl !== 'your-deployment.convex.cloud'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full border border-border rounded-lg bg-card p-8">
        <h1 className="text-3xl font-bold mb-2">MotionAI Setup</h1>
        <p className="text-muted-foreground mb-6">
          Configure Convex to enable full functionality
        </p>

        {isConfigured ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-500 font-medium">✓ Convex is configured</p>
            </div>
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Go to Login
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-500 font-medium mb-2">Convex not configured</p>
              <p className="text-sm text-muted-foreground mb-3">
                Run <code className="bg-muted px-1 rounded">npx convex dev</code> (Node 20+ required) to create a deployment and get your URL. Or continue in demo mode with localStorage.
              </p>
              <a
                href="/dashboard"
                className="inline-block px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 text-sm"
              >
                Continue in Demo Mode
              </a>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Setup Instructions</h2>
              <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                <li>Install Node 20+ (Convex CLI requires it)</li>
                <li>Run <code className="bg-muted px-1 rounded">npx convex dev</code> in the project root</li>
                <li>Sign in with Convex and create/link a project</li>
                <li>Add the deployment URL to <code className="bg-muted px-1 rounded">.env.local</code>:</li>
              </ol>

              <div className="mt-4 bg-muted p-4 rounded-lg">
                <pre className="text-xs overflow-x-auto text-foreground">
                  {`NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud`}
                </pre>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Set WAVESPEED_API_KEY and WAVESPEED_API_URL in the Convex dashboard for video generation and cron.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
