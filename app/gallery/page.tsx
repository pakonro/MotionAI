'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getDemoData } from '@/lib/demo-mode'
import { isConvexConfigured } from '@/lib/convex'
import { useEffect, useState } from 'react'

export default function GalleryPage() {
  const generationsFromConvex = useQuery(api.generations.list)
  const [demoGenerations, setDemoGenerations] = useState<ReturnType<typeof getDemoData>['generations']>([])
  const [isDemoMode, setIsDemoMode] = useState(!isConvexConfigured())

  useEffect(() => {
    setIsDemoMode(!isConvexConfigured())
  }, [])

  useEffect(() => {
    if (isDemoMode) {
      setDemoGenerations(getDemoData().generations)
      const handleStorageChange = () => setDemoGenerations(getDemoData().generations)
      window.addEventListener('storage', handleStorageChange)
      const interval = setInterval(() => setDemoGenerations(getDemoData().generations), 1000)
      return () => {
        window.removeEventListener('storage', handleStorageChange)
        clearInterval(interval)
      }
    }
  }, [isDemoMode])

  const generations = isDemoMode
    ? demoGenerations.map((g) => ({
        _id: g.id as any,
        status: g.status,
        outputVideoUrl: g.output_video_url,
        inputImageUrl: g.input_image_url,
        prompt: g.prompt,
        createdAt: new Date(g.created_at).getTime(),
        errorMessage: null,
      }))
    : generationsFromConvex ?? []

  const loading = !isDemoMode && generationsFromConvex === undefined

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
        All your generated videos. Status updates automatically (Convex realtime); no refresh needed.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {generations.map((generation: { _id: string; status: string; outputVideoUrl?: string | null; prompt?: string | null; createdAt: number; errorMessage?: string | null }) => (
          <div
            key={generation._id}
            className="border border-border rounded-lg overflow-hidden bg-card"
          >
            <div className="aspect-video bg-muted relative">
              {generation.status === 'completed' && generation.outputVideoUrl ? (
                <video
                  src={generation.outputVideoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : generation.status === 'completed' && !generation.outputVideoUrl ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-blue-500">
                    <Loader2 className="w-8 h-8 animate-spin inline mb-2 text-muted-foreground" />
                    <p className="text-sm">Finalizing...</p>
                  </div>
                </div>
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
                  {new Date(generation.createdAt).toLocaleDateString()}
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
