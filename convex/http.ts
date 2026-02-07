import type { GenericActionCtx } from 'convex/server'
import { httpRouter } from 'convex/server'
import type { DataModel } from './_generated/dataModel'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { auth } from './auth'

function parseWaveSpeedWebhook(body: unknown): {
  wavespeedId: string
  status: string
  videoUrl: string | null
  errorMessage: string | null
} | null {
  if (body === null || typeof body !== 'object') return null
  const p = body as Record<string, unknown>
  const data = p.data as Record<string, unknown> | undefined
  const wavespeedId =
    (data?.id as string) ??
    (p.id as string) ??
    (p.request_id as string) ??
    (p.task_id as string) ??
    (p.generation_id as string)
  if (!wavespeedId || typeof wavespeedId !== 'string') return null
  const status =
    (data?.status as string) ??
    (data?.state as string) ??
    (p.status as string) ??
    (p.state as string) ??
    ''
  const outputs0 = data?.outputs as Array<{ url?: string }> | undefined
  const videoUrl =
    (outputs0?.[0]?.url as string) ??
    (data?.video_url as string) ??
    (data?.output_url as string) ??
    (p.video_url as string) ??
    (p.output_url as string) ??
    (p.video as string) ??
    (p.url as string) ??
    null
  const errorMessage =
    (data?.error as string) ??
    (p.error_message as string) ??
    (p.error as string) ??
    (p.message as string) ??
    null
  return {
    wavespeedId,
    status: String(status),
    videoUrl: videoUrl ? String(videoUrl) : null,
    errorMessage: errorMessage ? String(errorMessage) : null,
  }
}

function toDbStatus(status: string): 'pending' | 'completed' | 'failed' {
  const s = status.toLowerCase()
  if (s === 'completed' || s === 'succeeded' || s === 'success') return 'completed'
  if (s === 'failed' || s === 'error') return 'failed'
  return 'pending'
}

const http = httpRouter()
auth.addHttpRoutes(http)

// Stripe webhook: when re-enabled, verify signature and call internal.profiles.addCredits
http.route({
  path: '/stripe',
  method: 'POST',
  handler: httpAction(async (_ctx: GenericActionCtx<DataModel>, _request: Request) => {
    return new Response(
      JSON.stringify({ received: true, message: 'Stripe webhook disabled. Enable in convex/http.ts when ready.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }),
})

http.route({
  path: '/wavespeed',
  method: 'POST',
  handler: httpAction(async (ctx: GenericActionCtx<DataModel>, request: Request) => {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const parsed = parseWaveSpeedWebhook(body)
    if (!parsed) {
      const safeSnapshot =
        typeof body === 'object' && body !== null
          ? JSON.stringify(body).slice(0, 2000)
          : String(body).slice(0, 500)
      console.log('WaveSpeed webhook unparseable payload:', safeSnapshot)
      return new Response(
        JSON.stringify({ error: 'Unparseable webhook payload' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    const { wavespeedId, status, videoUrl, errorMessage } = parsed
    const dbStatus = toDbStatus(status)
    console.log('WaveSpeed webhook ok:', { wavespeedId, dbStatus })
    await ctx.runMutation((internal as any).generations.updateFromWebhook, {
      wavespeedId,
      status: dbStatus,
      ...(videoUrl != null ? { outputVideoUrl: videoUrl } : {}),
      ...(errorMessage != null ? { errorMessage } : {}),
    })
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})

export default http
