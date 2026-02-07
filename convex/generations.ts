import { v } from 'convex/values'
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
} from './_generated/server'
import { internal } from './_generated/api'
import { getAuthUserId } from '@convex-dev/auth/server'

const statusValidator = v.union(
  v.literal('pending'),
  v.literal('completed'),
  v.literal('failed')
)

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []
    return await ctx.db
      .query('generations')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: {
    inputImageUrl: v.string(),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    const now = Date.now()
    return await ctx.db.insert('generations', {
      userId,
      inputImageUrl: args.inputImageUrl,
      ...(args.prompt != null ? { prompt: args.prompt } : {}),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateWavespeedId = mutation({
  args: { id: v.id('generations'), wavespeedId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    const gen = await ctx.db.get(args.id)
    if (!gen || gen.userId !== userId)
      throw new Error('Generation not found')
    await ctx.db.patch(args.id, {
      wavespeedId: args.wavespeedId,
      updatedAt: Date.now(),
    })
  },
})

export const markFailed = mutation({
  args: { id: v.id('generations'), errorMessage: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    const gen = await ctx.db.get(args.id)
    if (!gen || gen.userId !== userId)
      throw new Error('Generation not found')
    await ctx.db.patch(args.id, {
      status: 'failed',
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    })
  },
})

export const getByWavespeedId = internalQuery({
  args: { wavespeedId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('generations')
      .withIndex('by_wavespeedId', (q) => q.eq('wavespeedId', args.wavespeedId))
      .unique()
  },
})

export const updateFromWebhook = internalMutation({
  args: {
    wavespeedId: v.string(),
    status: statusValidator,
    outputVideoUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const gen = await ctx.db
      .query('generations')
      .withIndex('by_wavespeedId', (q) => q.eq('wavespeedId', args.wavespeedId))
      .unique()
    if (!gen) return
    await ctx.db.patch(gen._id as any, {
      status: args.status,
      ...(args.outputVideoUrl != null ? { outputVideoUrl: args.outputVideoUrl } : {}),
      ...(args.errorMessage != null ? { errorMessage: args.errorMessage } : {}),
      updatedAt: Date.now(),
    })
  },
})

export const listPending = internalQuery({
  args: { minCreated: v.number() },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query('generations')
      .withIndex('by_status_createdAt', (q) => q.eq('status', 'pending'))
      .take(100)
    return pending
      .filter(
        (g) =>
          g.wavespeedId != null &&
          typeof g.createdAt === 'number' &&
          g.createdAt < args.minCreated
      )
      .slice(0, 20)
  },
})

export const updateFromPoll = internalMutation({
  args: {
    id: v.id('generations'),
    status: statusValidator,
    outputVideoUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      ...(args.outputVideoUrl != null ? { outputVideoUrl: args.outputVideoUrl } : {}),
      ...(args.errorMessage != null ? { errorMessage: args.errorMessage } : {}),
      updatedAt: Date.now(),
    })
  },
})

const WAVESPEED_API_URL = process.env.WAVESPEED_API_URL ?? 'https://api.wavespeed.ai'

export const pollPending = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.WAVESPEED_API_KEY
    if (!apiKey) return
    const minCreated = Date.now() - 60 * 1000 // 60s ago
    const pending = await ctx.runQuery((internal as any).generations.listPending, { minCreated })
    for (const row of pending) {
      const wavespeedId = row.wavespeedId
      if (!wavespeedId) continue
      try {
        const url = `${WAVESPEED_API_URL.replace(/\/$/, '')}/api/v3/predictions/${wavespeedId}/result`
        const res = await fetch(url, {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (!res.ok) {
          console.log('Cron poll WaveSpeed !res.ok:', {
            wavespeedId,
            status: res.status,
          })
          continue
        }
        const data = (await res.json()) as {
          data?: {
            status?: string
            outputs?: Array<{ url?: string }>
            error?: string
          }
        }
        console.log('Cron Polling Result:', JSON.stringify(data).slice(0, 500))
        const d = data.data
        if (!d) continue
        const status = (d.status ?? '').toLowerCase()
        const isComplete = status === 'completed' || status === 'succeeded' || status === 'success'
        const isFailed = status === 'failed' || status === 'error'
        if (!isComplete && !isFailed) continue
        let outputVideoUrl: string | undefined
        if (isComplete && d.outputs?.length) {
          outputVideoUrl = d.outputs[0]?.url ?? undefined
        }
        await ctx.runMutation((internal as any).generations.updateFromPoll, {
          id: row._id,
          status: isComplete ? 'completed' : 'failed',
          ...(outputVideoUrl != null ? { outputVideoUrl } : {}),
          ...(isFailed ? { errorMessage: d.error ?? 'Generation failed' } : {}),
        })
      } catch {
        // skip on error
      }
    }
  },
})
