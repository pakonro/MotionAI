'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Sparkles, Loader2 } from 'lucide-react'
import { isConvexConfigured } from '@/lib/convex'
import { addDemoCredits } from '@/lib/demo-mode'

export function TestCreditsButton() {
  const [loading, setLoading] = useState(false)
  const addTestCredits = useMutation(api.profiles.addTestCredits)

  const handleAddCredits = async () => {
    setLoading(true)
    try {
      if (!isConvexConfigured()) {
        const newCredits = addDemoCredits(10)
        alert(`Added 10 test credits! You now have ${newCredits} credits.`)
        window.location.reload()
        return
      }
      const newCredits = await addTestCredits({ amount: 10 })
      alert(`Added 10 test credits! You now have ${newCredits} credits.`)
      window.location.reload()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('Not authenticated')) {
        alert('Please sign in first.')
        window.location.href = '/login'
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
