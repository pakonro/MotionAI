export default function SetupPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isConfigured =
    supabaseUrl &&
    supabaseUrl !== 'your_supabase_project_url' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your_supabase_anon_key'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full border border-border rounded-lg bg-card p-8">
        <h1 className="text-3xl font-bold mb-2">MotionAI Setup</h1>
        <p className="text-muted-foreground mb-6">
          Configure your environment variables to get started
        </p>

        {isConfigured ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-500 font-medium">
                ✓ Supabase is configured
              </p>
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
              <p className="text-yellow-500 font-medium mb-2">
                ⚠️ Supabase not configured
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                You can run the app in demo mode (using localStorage) or configure Supabase for full functionality.
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
                <li>
                  Create a Supabase project at{' '}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    https://supabase.com
                  </a>
                </li>
                <li>Go to your project dashboard</li>
                <li>Navigate to Project Settings → API</li>
                <li>Copy the following values:</li>
              </ol>

              <div className="mt-4 bg-muted p-4 rounded-lg">
                <p className="text-xs font-mono mb-2 text-foreground">
                  Create or update <code className="bg-background px-2 py-1 rounded">.env.local</code> file:
                </p>
                <pre className="text-xs overflow-x-auto text-foreground">
                  {`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`}
                </pre>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Required Environment Variables:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>✓ NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl ? '✓ Set' : '✗ Missing'}</li>
                  <li>✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseAnonKey ? '✓ Set' : '✗ Missing'}</li>
                </ul>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                After updating <code className="bg-muted px-1 rounded">.env.local</code>, restart your
                development server.
              </p>
              <p className="mt-2 text-xs text-muted-foreground italic">
                Note: Supabase integration can be added later. The app works in demo mode without it.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
