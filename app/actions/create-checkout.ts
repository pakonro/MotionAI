// Stripe integration - commented out for now
// Will be integrated after core functionality is working

// 'use server'

// import { createClient } from '@/lib/supabase/server'
// import { stripe } from '@/lib/stripe'

// const CREDITS_PER_PURCHASE = 10
// const PRICE_PER_PURCHASE = 999 // $9.99 in cents

// export async function createCheckoutSession() {
//   const supabase = await createClient()

//   // Get current user
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   if (!user) {
//     throw new Error('Not authenticated')
//   }

//   // Get or create Stripe customer
//   const { data: profile } = await supabase
//     .from('profiles')
//     .select('stripe_customer_id')
//     .eq('user_id', user.id)
//     .single()

//   let customerId = profile?.stripe_customer_id

//   if (!customerId) {
//     // Create Stripe customer
//     const customer = await stripe.customers.create({
//       email: user.email,
//       metadata: {
//         user_id: user.id,
//       },
//     })

//     customerId = customer.id

//     // Update profile with customer ID
//     await supabase
//       .from('profiles')
//       .update({ stripe_customer_id: customerId })
//       .eq('user_id', user.id)
//   }

//   // Create checkout session
//   const session = await stripe.checkout.sessions.create({
//     customer: customerId,
//     payment_method_types: ['card'],
//     line_items: [
//       {
//         price_data: {
//           currency: 'usd',
//           product_data: {
//             name: `${CREDITS_PER_PURCHASE} Credits`,
//             description: 'Credits for video generation',
//           },
//           unit_amount: PRICE_PER_PURCHASE,
//         },
//         quantity: 1,
//       },
//     ],
//     mode: 'payment',
//     success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
//     cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
//     metadata: {
//       user_id: user.id,
//     },
//   })

//   return { url: session.url }
// }

// Placeholder to prevent import errors
export async function createCheckoutSession() {
  throw new Error('Stripe integration is disabled. Please enable it in create-checkout.ts')
}
