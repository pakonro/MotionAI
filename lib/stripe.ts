// Stripe integration - commented out for now
// Will be integrated after core functionality is working

// import Stripe from 'stripe'

// if (!process.env.STRIPE_SECRET_KEY) {
//   throw new Error('STRIPE_SECRET_KEY is not set')
// }

// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2024-11-20.acacia',
// })

// Placeholder to prevent import errors
export const stripe = null as any
