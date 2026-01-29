// Stripe webhook - commented out for now
// Will be integrated after core functionality is working

import { NextRequest, NextResponse } from 'next/server'
// import { stripe } from '@/lib/stripe'
// import { createClient } from '@/lib/supabase/server'
// import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  // Stripe webhook disabled - return success to prevent errors
  return NextResponse.json({ 
    message: 'Stripe webhook is disabled. Enable it in /api/webhooks/stripe/route.ts',
    received: true 
  })
}

/* Original Stripe webhook code - uncomment when ready to integrate payments

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Get the user_id from the session metadata
    const userId = session.metadata?.user_id

    if (!userId) {
      console.error('No user_id in session metadata')
      return NextResponse.json(
        { error: 'No user_id in session metadata' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Add 10 credits to the user's profile
    const { error } = await supabase.rpc('increment_credits', {
      user_id: userId,
      credit_amount: 10,
    })

    // If RPC doesn't exist, use a direct update
    if (error) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', userId)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits + 10 })
          .eq('user_id', userId)
      }
    }
  }

  return NextResponse.json({ received: true })
}

*/
