'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { CreditCard } from 'lucide-react'
import { getDemoData } from '@/lib/demo-mode'
import { isConvexConfigured } from '@/lib/convex'
import { useEffect, useState } from 'react'

export function Header() {
  const creditsFromConvex = useQuery(api.profiles.getCredits)
  const [demoCredits, setDemoCredits] = useState<number | null>(null)
  const isDemoMode = !isConvexConfigured()

  useEffect(() => {
    if (isDemoMode) {
      setDemoCredits(getDemoData().credits)
      const handleStorageChange = () => setDemoCredits(getDemoData().credits)
      window.addEventListener('storage', handleStorageChange)
      const interval = setInterval(() => setDemoCredits(getDemoData().credits), 1000)
      return () => {
        window.removeEventListener('storage', handleStorageChange)
        clearInterval(interval)
      }
    }
  }, [isDemoMode])

  const credits = isDemoMode ? demoCredits : creditsFromConvex
  const displayCredits = credits !== null && credits !== undefined ? credits : '...'

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">MotionAI</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg">
          <CreditCard className="w-4 h-4" />
          <span className="font-medium">{displayCredits} Credits</span>
        </div>
      </div>
    </header>
  )
}
