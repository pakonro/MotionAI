'use client'

import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuthActions()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      formData.set('flow', 'signUp')
      await signIn('password', formData)
      window.location.href = '/dashboard'
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      if (message.includes('already exists') || (message.includes('Account') && message.includes('exists'))) {
        setError('An account with this email already exists. Try signing in.')
      } else if (message.includes('Invalid password') || message.includes('password')) {
        setError('Please use a stronger password (at least 6 characters).')
      } else if (message.includes('Missing environment') || message.includes('CONVEX_SITE_URL')) {
        setError('Server is misconfigured. Please set CONVEX_SITE_URL in your Convex dashboard environment variables.')
      } else if (message.includes('Missing') && message.includes('password')) {
        setError('Please enter a password (at least 6 characters).')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 border border-border rounded-lg bg-card">
        <h1 className="text-3xl font-bold mb-2 text-center">MotionAI</h1>
        <p className="text-muted-foreground text-center mb-6">
          Create an account to get started
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <p>{error}</p>
            {error.includes('signing in') && (
              <Link href="/login" className="mt-2 inline-block font-medium underline hover:no-underline">
                Go to Sign in
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-input rounded-lg bg-background"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-input rounded-lg bg-background"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
