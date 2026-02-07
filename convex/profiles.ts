import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique()
  },
})

export const getCredits = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()
    return profile?.credits ?? 0
  },
})

/** Call once after sign-in to ensure profile exists (e.g. from dashboard/header). */
export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()
    if (existing) return existing._id
    const now = Date.now()
    return await ctx.db.insert('profiles', {
      userId,
      credits: 0,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const create = mutation({
  args: {
    userId: v.id('users'),
    credits: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique()
    if (existing) return existing._id
    const now = Date.now()
    return await ctx.db.insert('profiles', {
      userId: args.userId,
      credits: args.credits ?? 0,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const deductCredit = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()
    if (!profile) throw new Error('Profile not found')
    const credits = typeof profile.credits === 'number' ? profile.credits : 0
    if (credits < 1) throw new Error('Insufficient credits')
    await ctx.db.patch(profile._id as any, {
      credits: credits - 1,
      updatedAt: Date.now(),
    })
    return credits - 1
  },
})

/** Add test credits (e.g. 10) to the current user. Returns new credits count. */
export const addTestCredits = mutation({
  args: { amount: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()
    const amount = args.amount ?? 10
    const now = Date.now()
    if (!profile) {
      await ctx.db.insert('profiles', {
        userId,
        credits: amount,
        createdAt: now,
        updatedAt: now,
      })
      return amount
    }
    const current = typeof profile.credits === 'number' ? profile.credits : 0
    const newCredits = current + amount
    await ctx.db.patch(profile._id as any, {
      credits: newCredits,
      updatedAt: now,
    })
    return newCredits
  },
})

/** Refund 1 credit to the current user (e.g. when generation fails). */
export const refundCredit = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()
    if (!profile) return
    const credits = typeof profile.credits === 'number' ? profile.credits : 0
    await ctx.db.patch(profile._id as any, {
      credits: credits + 1,
      updatedAt: Date.now(),
    })
  },
})

export const addCredits = mutation({
  args: { userId: v.id('users'), amount: v.number() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique()
    const now = Date.now()
    if (!profile) {
      return await ctx.db.insert('profiles', {
        userId: args.userId,
        credits: args.amount,
        createdAt: now,
        updatedAt: now,
      })
    }
    const current = typeof profile.credits === 'number' ? profile.credits : 0
    await ctx.db.patch(profile._id as any, {
      credits: current + args.amount,
      updatedAt: now,
    })
    return profile._id
  },
})
