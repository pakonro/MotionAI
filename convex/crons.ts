import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()
crons.interval(
  'poll pending generations',
  { minutes: 2 },
  (internal as any).generations.pollPending
)
export default crons
