'use server'

import { createWaveSpeedService } from '@/lib/wavespeed/service'

// Server action: calls WaveSpeedAI API only.
export async function generateVideo(imageUrl: string, generationId: string, prompt?: string) {
  const service = createWaveSpeedService()
  if (!service) {
    throw new Error(
      'WaveSpeedAI API key is not configured. Add WAVESPEED_API_KEY to .env or .env.local and restart the dev server.'
    )
  }

  // Convex HTTP action URL for WaveSpeed webhook (e.g. https://<deployment>.convex.site/wavespeed)
  const webhookUrl =
    process.env.WAVESPEED_WEBHOOK_URL ||
    (process.env.CONVEX_SITE_URL ? `${process.env.CONVEX_SITE_URL}/wavespeed` : '') ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/wavespeed`
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
