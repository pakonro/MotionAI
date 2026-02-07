'use server'

/**
 * Test credits are now added via Convex mutation (TestCreditsButton uses useMutation(api.profiles.addTestCredits)).
 * This server action is kept for backwards compatibility but does nothing; use the button in the UI.
 */
export async function addTestCredits(_amount: number = 10) {
  throw new Error('Use the "Add Test Credits" button in the UI (Convex mutation).')
}
