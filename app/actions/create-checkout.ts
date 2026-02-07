'use server'

/**
 * Stripe checkout is disabled. When re-enabled, use Convex mutation/action
 * and Convex HTTP /stripe webhook for adding credits.
 */
export async function createCheckoutSession() {
  throw new Error('Stripe integration is disabled. Enable in create-checkout.ts and convex/http.ts when ready.')
}
