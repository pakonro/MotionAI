import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

const statusUnion = v.union(
  v.literal('pending'),
  v.literal('completed'),
  v.literal('failed')
)

export default defineSchema({
  ...authTables,
  profiles: defineTable({
    userId: v.id('users'),
    credits: v.number(),
    stripeCustomerId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId']),

  generations: defineTable({
    userId: v.id('users'),
    prompt: v.optional(v.string()),
    inputImageUrl: v.string(),
    outputVideoUrl: v.optional(v.string()),
    status: statusUnion,
    wavespeedId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_status_createdAt', ['status', 'createdAt'])
    .index('by_wavespeedId', ['wavespeedId']),
})
