'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Upload, Loader2, AlertCircle } from 'lucide-react'
import { generateVideo } from '@/app/actions/generate-video'
import { TestCreditsButton } from '@/components/test-credits-button'
import { deductDemoCredits, getDemoData, addDemoGeneration } from '@/lib/demo-mode'
import { isConvexConfigured } from '@/lib/convex'

export default function DashboardPage() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(!isConvexConfigured())
  const credits = useQuery(api.profiles.getCredits)
  const ensureProfile = useMutation(api.profiles.ensureProfile)
  const deductCredit = useMutation(api.profiles.deductCredit)
  const refundCredit = useMutation(api.profiles.refundCredit)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const saveInputImage = useMutation(api.files.saveInputImage)
  const updateWavespeedId = useMutation(api.generations.updateWavespeedId)
  const markFailed = useMutation(api.generations.markFailed)

  useEffect(() => {
    setIsDemoMode(!isConvexConfigured())
  }, [])

  useEffect(() => {
    if (isConvexConfigured() && !authLoading && isAuthenticated && ensureProfile) {
      ensureProfile().catch(() => {})
    }
  }, [isConvexConfigured(), authLoading, isAuthenticated, ensureProfile])

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

  const GENERATE_TIMEOUT_MS = 90_000 // 90s so upload + save + WaveSpeed call can complete

  const handleGenerate = async () => {
    if (!file) return
    if (!isDemoMode && (!isAuthenticated || authLoading)) {
      alert('Please wait for sign-in to complete, or sign in again.')
      return
    }

    setUploading(true)
    try {
      const timeout = (ms: number) =>
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out. Check your connection and try again.')), ms)
        )
      if (isDemoMode) {
        const data = getDemoData()
        if (data.credits < 1) {
          alert('Insufficient credits. Use "Add Test Credits" button.')
          setUploading(false)
          return
        }
        deductDemoCredits(1)
        const imageUrl = URL.createObjectURL(file)
        const generationId = `demo-${Date.now()}`
        addDemoGeneration({
          id: generationId,
          prompt: null,
          input_image_url: imageUrl,
          output_video_url: null,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        alert(
          'Demo mode: Video generation would be triggered here. Configure Convex to enable full functionality.'
        )
        setFile(null)
        setPreview(null)
        window.location.reload()
        return
      }

      if (credits != null && credits < 1) {
        alert('Insufficient credits. Please purchase more credits.')
        setUploading(false)
        return
      }

      await Promise.race([deductCredit(), timeout(GENERATE_TIMEOUT_MS)])
      let uploadUrl: string
      try {
        uploadUrl = await Promise.race([generateUploadUrl(), timeout(GENERATE_TIMEOUT_MS)])
      } catch (e) {
        console.error('generateUploadUrl failed', e)
        await refundCredit().catch(() => {})
        throw new Error('Failed to get upload URL. Check console.')
      }
      if (!uploadUrl || typeof uploadUrl !== 'string') {
        await refundCredit().catch(() => {})
        throw new Error('Upload URL was empty.')
      }

      let storageId: string
      try {
        const result = await Promise.race([
          fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': file.type },
            body: file,
          }),
          timeout(GENERATE_TIMEOUT_MS),
        ])
        if (!result.ok) {
          await refundCredit()
          throw new Error(`Upload failed: ${result.status} ${result.statusText}`)
        }
        const data = await result.json()
        storageId = data?.storageId ?? data?.storage_id
        if (!storageId) {
          await refundCredit()
          throw new Error('Upload response missing storageId.')
        }
      } catch (e) {
        console.error('Upload to storage failed', e)
        await refundCredit().catch(() => {})
        throw e instanceof Error ? e : new Error('Upload failed.')
      }

      let id: string
      let inputImageUrl: string
      try {
        const saved = await Promise.race([saveInputImage({ storageId }), timeout(GENERATE_TIMEOUT_MS)])
        id = saved?.id
        inputImageUrl = saved?.inputImageUrl
        if (!id || !inputImageUrl) {
          await refundCredit()
          throw new Error('Save image failed: missing id or URL.')
        }
      } catch (e) {
        console.error('saveInputImage failed', e)
        await refundCredit().catch(() => {})
        throw e instanceof Error ? e : new Error('Saving image failed.')
      }

      try {
        const waveResult = await Promise.race([
          generateVideo(inputImageUrl, id),
          timeout(GENERATE_TIMEOUT_MS),
        ])
        if (waveResult.wavespeedId) {
          await updateWavespeedId({ id, wavespeedId: waveResult.wavespeedId })
        } else {
          alert('Generation started but no task ID returned. Check the gallery for status.')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await markFailed({ id, errorMessage })
        await refundCredit()
        if (errorMessage.includes('not configured')) {
          alert('WaveSpeedAI is not configured. Add WAVESPEED_API_KEY to your environment.')
        } else {
          alert(`Video generation failed: ${errorMessage}`)
        }
        setUploading(false)
        return
      }

      setFile(null)
      setPreview(null)
      alert('Video generation started. Check the gallery for status; it may take a few minutes.')
    } catch (error) {
      console.error('Error generating video:', error)
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Unknown error'
      if (!isDemoMode) await refundCredit().catch(() => {})
      alert(`Failed to generate video: ${msg}`)
    } finally {
      setUploading(false)
    }
  }

  if (!isDemoMode && authLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isDemoMode && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-yellow-500 mb-1">Demo Mode</p>
            <p className="text-sm text-muted-foreground">
              Convex is not configured. Set NEXT_PUBLIC_CONVEX_URL to enable full functionality.
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
                disabled={uploading || (!isDemoMode && !isAuthenticated)}
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
