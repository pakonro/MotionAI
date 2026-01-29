'use client'

import { useEffect, useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { Loader2, Play, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getDemoData } from '@/lib/demo-mode'

type Generation =
  Database['public']['Tables']['generations']['Row']

export default function GalleryPage() {
  const [generations, setGenerations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const configured = isSupabaseConfigured()
    setIsDemoMode(!configured)

    if (!configured) {
      // Demo mode - use localStorage
      const data = getDemoData()
      setGenerations(data.generations)
      setLoading(false)

      // Listen for storage changes
      const handleStorageChange = () => {
        const updatedData = getDemoData()
        setGenerations(updatedData.generations)
      }
      window.addEventListener('storage', handleStorageChange)
      const interval = setInterval(() => {
        const updatedData = getDemoData()
        setGenerations(updatedData.generations)
      }, 1000)

      return () => {
        window.removeEventListener('storage', handleStorageChange)
        clearInterval(interval)
      }
    }

    // Supabase mode
    if (!supabase) {
      setLoading(false)
      return
    }

    const fetchGenerations = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('generations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching generations:', error)
        } else {
          setGenerations(data || [])
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGenerations()

    // Subscribe to generation changes
    const channel = supabase
      .channel('generations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generations',
        },
        () => {
          fetchGenerations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (generations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Generation Gallery</h1>
        <p className="text-muted-foreground mb-6">
          Your generated videos will appear here
        </p>
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No generations yet</p>
          <Link
            href="/dashboard"
            className="text-primary hover:underline mt-2 inline-block"
          >
            Create your first video
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Generation Gallery</h1>
      <p className="text-muted-foreground mb-6">
        All your generated videos
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {generations.map((generation) => (
          <div
            key={generation.id}
            className="border border-border rounded-lg overflow-hidden bg-card"
          >
            <div className="aspect-video bg-muted relative">
              {generation.status === 'completed' &&
              generation.output_video_url ? (
                <video
                  src={generation.output_video_url}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : generation.status === 'pending' ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Processing...</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                    <p className="text-sm text-destructive">Failed</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    generation.status === 'completed'
                      ? 'bg-green-500/20 text-green-500'
                      : generation.status === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {generation.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(generation.created_at).toLocaleDateString()}
                </span>
              </div>
              {generation.prompt && (
                <p className="text-sm text-muted-foreground truncate">
                  {generation.prompt}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
