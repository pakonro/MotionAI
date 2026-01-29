'use server'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// Helper function to add test credits during development
// This will be removed when Stripe integration is added
export async function addTestCredits(amount: number = 10) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Failed to initialize Supabase client')
  }

  // Try getSession first (reads from cookies directly)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('Session error in addTestCredits:', sessionError)
  }

  // If no session, try getUser (might refresh token)
  let user = session?.user
  if (!user) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error in addTestCredits:', authError)
      throw new Error(`Authentication error: ${authError.message}. Please refresh the page and try again.`)
    }

    user = fetchedUser
  }

  if (!user) {
    throw new Error('Not authenticated. Please sign in again or refresh the page.')
  }

  // Get current credits
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('user_id', user.id)
    .single()

  if (fetchError || !profile) {
    throw new Error('Profile not found')
  }

  // Add credits
  const { error } = await supabase
    .from('profiles')
    .update({ credits: profile.credits + amount })
    .eq('user_id', user.id)

  if (error) {
    throw new Error('Failed to add credits')
  }

  return { success: true, newCredits: profile.credits + amount }
}
