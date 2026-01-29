'use client'

import { useEffect, useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { CreditCard } from 'lucide-react'
import { getDemoData } from '@/lib/demo-mode'
// import { BuyCreditsButton } from '@/components/buy-credits-button' // Stripe integration - commented out for now

export function Header() {
  const [credits, setCredits] = useState<number | null>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    const configured = isSupabaseConfigured()
    setIsDemoMode(!configured)

    if (!configured) {
      // Demo mode - use localStorage
      const data = getDemoData()
      setCredits(data.credits)
      
      // Listen for storage changes (for demo mode)
      const handleStorageChange = () => {
        const updatedData = getDemoData()
        setCredits(updatedData.credits)
      }
      window.addEventListener('storage', handleStorageChange)
      // Also check periodically for same-tab updates
      const interval = setInterval(() => {
        const updatedData = getDemoData()
        setCredits(updatedData.credits)
      }, 1000)

      return () => {
        window.removeEventListener('storage', handleStorageChange)
        clearInterval(interval)
      }
    }

    // Supabase mode
    try {
      const client = createClient()
      if (client) {
        setSupabase(client)
      }
    } catch (error) {
      console.error('Failed to initialize Supabase:', error)
    }
  }, [])

  useEffect(() => {
    if (!supabase || isDemoMode) return

    const fetchCredits = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('credits')
            .eq('user_id', user.id)
            .single()
          if (data) {
            setCredits(data.credits)
          }
        }
      } catch (error) {
        console.error('Error fetching credits:', error)
      }
    }

    fetchCredits()

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          if (payload.new.credits !== undefined) {
            setCredits(payload.new.credits as number)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, isDemoMode])

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">MotionAI</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg">
          <CreditCard className="w-4 h-4" />
          <span className="font-medium">
            {credits !== null ? credits : '...'} Credits
          </span>
        </div>
        {/* Stripe integration - commented out for now */}
        {/* <BuyCreditsButton /> */}
      </div>
    </header>
  )
}
