import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/supabase/server'

export default async function Home() {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    // Demo mode - go directly to dashboard
    redirect('/dashboard')
  }

  // Supabase is configured - check auth
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    if (!supabase) {
      redirect('/dashboard') // Fallback to demo mode
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect('/dashboard')
    } else {
      redirect('/login')
    }
  } catch (error) {
    // If there's an error, fallback to demo mode
    redirect('/dashboard')
  }
}
