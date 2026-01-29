'use server'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

const WAVESPEED_API_URL = process.env.WAVESPEED_API_URL || 'https://api.wavespeed.ai'
const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY

export async function generateVideo(imageUrl: string, prompt?: string) {
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
    console.error('Session error in generateVideo:', sessionError)
  }

  // If no session, try getUser (might refresh token)
  let user = session?.user
  if (!user) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error in generateVideo:', authError)
      throw new Error(`Authentication error: ${authError.message}. Please refresh the page and try again.`)
    }

    user = fetchedUser
  }

  if (!user) {
    throw new Error('Not authenticated. Please sign in again or refresh the page.')
  }

  // Check user credits
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  if (profile.credits < 1) {
    throw new Error('Insufficient credits. Please purchase more credits.')
  }

  // Deduct 1 credit
  const { error: creditError } = await supabase
    .from('profiles')
    .update({ credits: profile.credits - 1 })
    .eq('user_id', user.id)

  if (creditError) {
    throw new Error('Failed to deduct credits')
  }

  // Create generation record
  const { data: generation, error: generationError } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      prompt: prompt || null,
      input_image_url: imageUrl,
      status: 'pending',
    })
    .select()
    .single()

  if (generationError || !generation) {
    // Refund credit if generation creation fails
    await supabase
      .from('profiles')
      .update({ credits: profile.credits })
      .eq('user_id', user.id)
    throw new Error('Failed to create generation record')
  }

  // Call WaveSpeedAI API
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/wavespeed`

    const response = await fetch(`${WAVESPEED_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WAVESPEED_API_KEY}`,
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: prompt,
        webhook_url: webhookUrl,
        generation_id: generation.id, // Pass our generation ID
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || `WaveSpeedAI API error: ${response.statusText}`
      )
    }

    const data = await response.json()

    // Update generation with wavespeed_id
    await supabase
      .from('generations')
      .update({ wavespeed_id: data.id || data.generation_id })
      .eq('id', generation.id)

    return { success: true, generationId: generation.id }
  } catch (error) {
    // Update generation status to failed
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', generation.id)

    // Refund credit
    await supabase
      .from('profiles')
      .update({ credits: profile.credits })
      .eq('user_id', user.id)

    throw error
  }
}
