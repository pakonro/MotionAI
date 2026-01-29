'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client'
import { addDemoCredits } from '@/lib/demo-mode'

export function TestCreditsButton() {
  const [loading, setLoading] = useState(false)

  const handleAddCredits = async () => {
    setLoading(true)
    try {
      const isDemo = !isSupabaseConfigured()
      
      if (isDemo) {
        // Demo mode - use localStorage
        const newCredits = addDemoCredits(10)
        alert(`Added 10 test credits! You now have ${newCredits} credits.`)
        window.location.reload()
      } else {
        // Supabase mode - use client-side operations to bypass server action cookie issues
        const supabase = createClient()
        if (!supabase) {
          alert('Supabase client not available')
          return
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          alert('Please sign in first. Redirecting to login...')
          window.location.href = '/login'
          return
        }

        // Get current credits using client-side query
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('credits')
          .eq('user_id', user.id)
          .single()

        if (fetchError || !profile) {
          alert('Profile not found. Please refresh the page.')
          window.location.reload()
          return
        }

        // Update credits using client-side mutation
        const newCredits = profile.credits + 10
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ credits: newCredits })
          .eq('user_id', user.id)

        if (updateError) {
          alert(`Failed to add credits: ${updateError.message}`)
          return
        }

        alert(`Added 10 test credits! You now have ${newCredits} credits.`)
        window.location.reload()
      }
    } catch (error) {
      console.error('Error adding test credits:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('Not authenticated') || errorMessage.includes('Authentication error')) {
        alert('Session expired. Please refresh the page and try again.')
        window.location.reload()
      } else {
        alert(`Failed to add test credits: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAddCredits}
      disabled={loading}
      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 text-sm"
      title="Add 10 test credits for development (Stripe disabled)"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Add Test Credits (10)
        </>
      )}
    </button>
  )
}
