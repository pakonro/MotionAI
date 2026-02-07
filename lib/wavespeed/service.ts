import type {
  WaveSpeedCreateResponse,
  WaveSpeedStatusResponse,
  WaveSpeedWebhookPayload,
  ParsedWebhookPayload,
} from './types'

const DEFAULT_API_URL = 'https://api.wavespeed.ai'
const FRAMEPACK_ENDPOINT = '/api/v3/wavespeed-ai/framepack'

export interface CreateGenerationOptions {
  imageUrl: string
  prompt: string
  webhookUrl: string
  apiKey: string
  apiUrl?: string
}

export interface CreateGenerationResult {
  wavespeedId: string | null
  statusUrl: string | null
}

export class WaveSpeedService {
  private apiUrl: string
  private apiKey: string

  constructor(apiKey: string, apiUrl: string = DEFAULT_API_URL) {
    this.apiKey = apiKey
    this.apiUrl = apiUrl.replace(/\/$/, '')
  }

  /**
   * Extract task ID from create API response.
   * WaveSpeedAI returns nested structure: { code, message, data: { id, ... } }
   */
  extractId(response: WaveSpeedCreateResponse): string | null {
    return response.data?.id ?? null
  }

  /**
   * Create a video generation job via WaveSpeedAI Framepack API.
   */
  async createGeneration(options: CreateGenerationOptions): Promise<CreateGenerationResult> {
    const { imageUrl, prompt, webhookUrl } = options
    const endpoint = `${this.apiUrl}${FRAMEPACK_ENDPOINT}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        image: imageUrl,
        prompt,
        webhook_url: webhookUrl,
      }),
    })

    const raw = await response.json()

    if (!response.ok) {
      const message =
        (raw as { message?: string }).message ??
        (raw as { error?: string }).error ??
        response.statusText
      throw new Error(`WaveSpeedAI API error: ${message}`)
    }

    const typed = raw as WaveSpeedCreateResponse
    const wavespeedId = this.extractId(typed)
    const statusUrl = typed.data?.urls?.get ?? null

    return { wavespeedId, statusUrl }
  }

  /**
   * Get status of a generation from WaveSpeedAI result endpoint.
   */
  async getStatus(wavespeedId: string): Promise<WaveSpeedStatusResponse> {
    const url = `${this.apiUrl}/api/v3/predictions/${wavespeedId}/result`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`WaveSpeedAI status error: ${response.statusText}`)
    }

    return (await response.json()) as WaveSpeedStatusResponse
  }

  /**
   * Parse webhook payload from WaveSpeedAI.
   * Handles both nested (body.data.id) and flat (body.id) structures.
   */
  parseWebhookPayload(body: unknown): ParsedWebhookPayload | null {
    if (body === null || typeof body !== 'object') {
      return null
    }

    const payload = body as WaveSpeedWebhookPayload

    // Nested: body.data.id
    const wavespeedId =
      payload.data?.id ??
      payload.id ??
      payload.request_id ??
      payload.task_id ??
      payload.generation_id

    if (!wavespeedId || typeof wavespeedId !== 'string') {
      return null
    }

    const status =
      payload.data?.status ??
      payload.data?.state ??
      payload.status ??
      payload.state ??
      ''

    const videoUrl =
      payload.data?.outputs?.[0]?.url ??
      payload.data?.video_url ??
      payload.data?.output_url ??
      payload.video_url ??
      payload.output_url ??
      payload.video ??
      payload.url ??
      null

    const errorMessage =
      payload.data?.error ??
      payload.error_message ??
      payload.error ??
      payload.message ??
      null

    return {
      wavespeedId,
      status: String(status),
      videoUrl: videoUrl ? String(videoUrl) : null,
      errorMessage: errorMessage ? String(errorMessage) : null,
    }
  }
}

/** Create a service instance from env (for server use). */
export function createWaveSpeedService(): WaveSpeedService | null {
  const apiKey = process.env.WAVESPEED_API_KEY
  const apiUrl = process.env.WAVESPEED_API_URL ?? DEFAULT_API_URL
  if (!apiKey) return null
  return new WaveSpeedService(apiKey, apiUrl)
}
