// Stripe integration - commented out for now
// Will be integrated after core functionality is working

'use client'

import { useState } from 'react'
// import { createCheckoutSession } from '@/app/actions/create-checkout'
import { CreditCard, Loader2 } from 'lucide-react'

export function BuyCreditsButton() {
  const [loading, setLoading] = useState(false)

  const handleBuyCredits = async () => {
    // Stripe integration disabled - uncomment when ready
    alert('Stripe integration is disabled. Use the "Add Test Credits" button on the dashboard for testing.')
    return
    
    /* Original code - uncomment when Stripe is integrated
    setLoading(true)
    try {
      const { url } = await createCheckoutSession()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to create checkout session. Please try again.')
      setLoading(false)
    }
    */
  }

  return (
    <button
      onClick={handleBuyCredits}
      disabled={loading}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          Buy Credits ($9.99)
        </>
      )}
    </button>
  )
}
