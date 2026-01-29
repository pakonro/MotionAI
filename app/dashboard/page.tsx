'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Upload, Loader2, AlertCircle } from 'lucide-react'
import { generateVideo } from '@/app/actions/generate-video'
import { TestCreditsButton } from '@/components/test-credits-button'
import { deductDemoCredits, getDemoData, addDemoGeneration } from '@/lib/demo-mode'

export default function DashboardPage() {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      setIsDemoMode(!isSupabaseConfigured())
      
      // If Supabase is configured, verify session is ready
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            setSessionReady(true)
          } else {
            // Wait a bit and check again (cookies might still be setting)
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession()
              if (retrySession) {
                setSessionReady(true)
              } else {
                // If still no session after retry, refresh the page
                console.warn('Session not available, refreshing page...')
                window.location.reload()
              }
            }, 1000)
          }
        } catch (error) {
          console.error('Error checking session:', error)
        }
      } else {
        // Demo mode - no session needed
        setSessionReady(true)
      }
    }
    
    checkSession()
  }, [supabase])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
  })

  const handleGenerate = async () => {
    if (!file) return

    setUploading(true)
    try {
      if (isDemoMode || !supabase) {
        // Demo mode - check credits and create mock generation
        const data = getDemoData()
        if (data.credits < 1) {
          alert('Insufficient credits. Use "Add Test Credits" button.')
          setUploading(false)
          return
        }

        // Deduct credit
        deductDemoCredits(1)

        // Create object URL for the image
        const imageUrl = URL.createObjectURL(file)

        // Create mock generation
        const generationId = `demo-${Date.now()}`
        addDemoGeneration({
          id: generationId,
          prompt: null,
          input_image_url: imageUrl,
          output_video_url: null,
          status: 'pending',
          created_at: new Date().toISOString(),
        })

        // In demo mode, we can't actually call WaveSpeedAI, so show a message
        alert(
          'Demo mode: Video generation would be triggered here. In production, this would call WaveSpeedAI API. Check the gallery to see your generation.'
        )

        // Reset form
        setFile(null)
        setPreview(null)
        // Refresh page to update credits
        window.location.reload()
        return
      }

      // Supabase mode
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('input-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('input-images').getPublicUrl(fileName)

      // Trigger generation
      await generateVideo(publicUrl)

      // Reset form
      setFile(null)
      setPreview(null)
    } catch (error) {
      console.error('Error generating video:', error)
      alert('Failed to generate video. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isDemoMode && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-yellow-500 mb-1">Demo Mode</p>
            <p className="text-sm text-muted-foreground">
              Supabase is not configured. Running in demo mode with localStorage.
              Configure Supabase to enable full functionality.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Generate Video</h1>
          <p className="text-muted-foreground">
            Upload an image to transform it into a video using AI
          </p>
        </div>
        <TestCreditsButton />
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-96 mx-auto rounded-lg"
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  setPreview(null)
                }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
              >
                Remove
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleGenerate()
                }}
                disabled={uploading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Video'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">
                {isDragActive
                  ? 'Drop the image here'
                  : 'Drag & drop an image here'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                or click to select a file
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
