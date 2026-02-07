// Demo mode utilities - uses localStorage when Convex is not configured

const DEMO_STORAGE_KEY = 'motionai_demo_data'

export interface DemoData {
  credits: number
  generations: Array<{
    id: string
    prompt: string | null
    input_image_url: string
    output_video_url: string | null
    status: 'pending' | 'completed' | 'failed'
    created_at: string
  }>
}

export function getDemoData(): DemoData {
  if (typeof window === 'undefined') {
    return { credits: 10, generations: [] }
  }

  const stored = localStorage.getItem(DEMO_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { credits: 10, generations: [] }
    }
  }
  return { credits: 10, generations: [] }
}

export function setDemoData(data: DemoData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data))
}

export function addDemoCredits(amount: number) {
  const data = getDemoData()
  data.credits += amount
  setDemoData(data)
  return data.credits
}

export function deductDemoCredits(amount: number = 1): boolean {
  const data = getDemoData()
  if (data.credits >= amount) {
    data.credits -= amount
    setDemoData(data)
    return true
  }
  return false
}

export function addDemoGeneration(generation: DemoData['generations'][0]) {
  const data = getDemoData()
  data.generations.unshift(generation)
  setDemoData(data)
}

export function updateDemoGeneration(
  id: string,
  updates: Partial<DemoData['generations'][0]>
) {
  const data = getDemoData()
  const index = data.generations.findIndex((g) => g.id === id)
  if (index !== -1) {
    data.generations[index] = { ...data.generations[index], ...updates }
    setDemoData(data)
  }
}
