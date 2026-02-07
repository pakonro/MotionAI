import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    return await ctx.storage.generateUploadUrl()
  },
})

/** Create a generation row with input image from Convex storage. Returns { id, inputImageUrl }. */
export const saveInputImage = mutation({
  args: {
    storageId: v.id('_storage'),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    const inputImageUrl = await ctx.storage.getUrl(args.storageId)
    if (!inputImageUrl) throw new Error('Failed to get image URL')
    const now = Date.now()
    const id = await ctx.db.insert('generations', {
      userId,
      inputImageUrl,
      ...(args.prompt != null ? { prompt: args.prompt } : {}),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })
    return { id, inputImageUrl }
  },
})
