/**
 * WaveSpeedAI API response and webhook payload types
 * Based on actual API response structure: { code, message, data: { id, status, urls, ... } }
 */

/** Response from WaveSpeedAI create/framepack API */
export interface WaveSpeedCreateResponse {
  code: number
  message: string
  data: {
    id: string
    status: string
    model?: string
    outputs?: unknown[]
    urls?: {
      get: string
    }
    has_nsfw_contents?: unknown[]
    created_at?: string
    error?: string
    executionTime?: number
    timings?: { inference: number }
  }
}

/** Response from WaveSpeedAI status/result API */
export interface WaveSpeedStatusResponse {
  code?: number
  message?: string
  data?: {
    id: string
    status: string
    outputs?: Array<{ url?: string; type?: string }>
    urls?: { get: string }
    error?: string
  }
}

/** Raw webhook payload - may be nested or flat */
export interface WaveSpeedWebhookPayload {
  id?: string
  request_id?: string
  task_id?: string
  generation_id?: string
  status?: string
  state?: string
  video_url?: string
  output_url?: string
  video?: string
  url?: string
  error_message?: string
  error?: string
  message?: string
  data?: {
    id: string
    status?: string
    state?: string
    outputs?: Array<{ url?: string }>
    video_url?: string
    output_url?: string
    error?: string
  }
}

/** Normalized result from parsing webhook payload */
export interface ParsedWebhookPayload {
  wavespeedId: string
  status: string
  videoUrl: string | null
  errorMessage: string | null
}
