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

      // Supabase mode - verify session is available
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Check session first (reads from cookies)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // No session - try to get user (might trigger refresh)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          alert('Please sign in first. Redirecting to login...')
          window.location.href = '/login'
          return
        }
        // User exists but no session - refresh page to establish session
        alert('Session not available. Refreshing page...')
        window.location.reload()
        return
      }

      const user = session.user

      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('input-images')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('input-images').getPublicUrl(fileName)

      // Check credits client-side (bypasses server action auth issues)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      if (profile.credits < 1) {
        alert('Insufficient credits. Please purchase more credits.')
        return
      }

      // Deduct 1 credit client-side
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - 1 })
        .eq('user_id', user.id)

      if (creditError) {
        throw new Error('Failed to deduct credits')
      }

      // Create generation record client-side
      const { data: generation, error: generationError } = await supabase
        .from('generations')
        .insert({
          user_id: user.id,
          prompt: null,
          input_image_url: publicUrl,
          status: 'pending',
        })
        .select()
        .single()

      if (generationError || !generation) {
        // Refund credit if generation creation fails
        await supabase
          .from('profiles')
          .update({ credits: profile.credits })
          .eq('user_id', user.id)
        throw new Error('Failed to create generation record')
      }

      // Call server action only for WaveSpeedAI API (doesn't need auth)
      try {
        const result = await generateVideo(publicUrl, generation.id)

        // Update generation with wavespeed_id client-side so webhook/polling can match it
        if (result.wavespeedId) {
          const { error: updateErr } = await supabase
            .from('generations')
            .update({ wavespeed_id: result.wavespeedId })
            .eq('id', generation.id)
          if (updateErr) {
            console.error('Failed to save wavespeed_id:', updateErr)
            alert('Generation started but we could not save the task ID. Check the gallery for status.')
          }
        } else {
          alert('Generation started but no task ID was returned. Check the gallery; status may update via polling.')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const isAuthError =
          errorMessage.includes('Authentication') || errorMessage.includes('Not authenticated')
        const isConfigError = errorMessage.includes('not configured')

        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: errorMessage,
          })
          .eq('id', generation.id)

        await supabase
          .from('profiles')
          .update({ credits: profile.credits })
          .eq('user_id', user.id)

        if (isAuthError) {
          alert('Session expired. Refreshing the page may help.')
          window.location.reload()
          return
        }
        if (isConfigError) {
          alert('WaveSpeedAI is not configured. Add WAVESPEED_API_KEY to your environment.')
        } else {
          alert(`Video generation failed: ${errorMessage}`)
        }
        return
      }

      // Success: reset form and give clear feedback
      setFile(null)
      setPreview(null)
      alert('Video generation started. Check the gallery for status; it may take a few minutes.')
    } catch (error) {
      console.error('Error generating video:', error)
      const msg = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to generate video: ${msg}`)
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
