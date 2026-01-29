'use client'

import { useState, useEffect } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log('Initializing Supabase client...')
    if (isSupabaseConfigured()) {
      try {
        const client = createClient()
        console.log('Supabase client created:', !!client)
        setSupabase(client)
      } catch (err) {
        console.error('Failed to create Supabase client:', err)
        setError('Failed to initialize Supabase. Please check your configuration.')
      }
    } else {
      console.error('Supabase is not configured')
      setError('Supabase is not configured. Please set up your environment variables.')
    }
  }, [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) {
      setError('Supabase client is not initialized. Please refresh the page.')
      console.error('Supabase client is null')
      return
    }

    setLoading(true)
    setError(null)

    console.log('Attempting to sign in with email:', email)

    try {
      // Add a timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login request timed out after 30 seconds')), 30000)
      )

      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })

      const { data, error: signInError } = await Promise.race([
        signInPromise,
        timeoutPromise,
      ]) as any

      console.log('Sign in response:', { data, error: signInError })

      if (signInError) {
        console.error('Sign in error:', signInError)
        setError(signInError.message)
        setLoading(false)
      } else if (data?.user) {
        console.log('Sign in successful, waiting for session to be established...')
        // Wait for session to be properly established
        // The browser client should set cookies automatically
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify session is set before redirecting
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('Session established, redirecting...')
          // Use window.location for a hard redirect
          window.location.href = '/dashboard'
        } else {
          console.warn('Session not yet available, redirecting anyway (will refresh on dashboard)')
          window.location.href = '/dashboard'
        }
      } else {
        console.error('No user data returned')
        setError('Login failed: No user data returned')
        setLoading(false)
      }
    } catch (err) {
      console.error('Login exception:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError('Supabase client is not initialized. Please refresh the page.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setLoading(false)
      }
      // OAuth will redirect, so we don't need to handle success here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 border border-border rounded-lg bg-card">
        <h1 className="text-3xl font-bold mb-2 text-center">MotionAI</h1>
        <p className="text-muted-foreground text-center mb-6">
          Sign in to generate videos from images
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-input rounded-lg bg-background"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-input rounded-lg bg-background"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !supabase}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading || !supabase}
          className="w-full px-4 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
