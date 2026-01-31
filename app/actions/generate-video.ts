'use server'

import { createWaveSpeedService } from '@/lib/wavespeed/service'

// Server action: calls WaveSpeedAI API only. Supabase operations are client-side.
export async function generateVideo(imageUrl: string, generationId: string, prompt?: string) {
  const service = createWaveSpeedService()
  if (!service) {
    throw new Error('WaveSpeedAI API key is not configured')
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/wavespeed`
  const videoPrompt = prompt ?? 'Create a smooth, animated video from this image'

  const result = await service.createGeneration({
    imageUrl,
    prompt: videoPrompt,
    webhookUrl,
    apiKey: process.env.WAVESPEED_API_KEY!,
    apiUrl: process.env.WAVESPEED_API_URL,
  })

  return {
    success: true,
    generationId,
    wavespeedId: result.wavespeedId,
    statusUrl: result.statusUrl,
  }
}
