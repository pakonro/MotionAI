import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createWaveSpeedService } from '@/lib/wavespeed/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('WaveSpeedAI webhook received:', JSON.stringify(body, null, 2))

    const service = createWaveSpeedService()
    const parsed = service?.parseWebhookPayload(body)

    if (!parsed) {
      console.error('Invalid or missing wavespeed ID in webhook payload:', body)
      return NextResponse.json(
        { error: 'Missing generation ID' },
        { status: 400 }
      )
    }

    const { wavespeedId, status, videoUrl, errorMessage } = parsed

    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to initialize Supabase' },
        { status: 500 }
      )
    }

    // Find the generation by wavespeed_id
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('*')
      .eq('wavespeed_id', wavespeedId)
      .single()

    if (fetchError || !generation) {
      console.error('Generation not found:', fetchError)
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    // If video is completed, download and store in Supabase Storage
    let finalVideoUrl = videoUrl

    if ((status === 'completed' || status === 'success') && videoUrl) {
      try {
        // Download video from WaveSpeedAI
        const videoResponse = await fetch(videoUrl)
        if (!videoResponse.ok) {
          throw new Error('Failed to download video')
        }

        const videoBlob = await videoResponse.blob()
        const videoBuffer = await videoBlob.arrayBuffer()

        // Upload to Supabase Storage
        const fileName = `${generation.user_id}/${generation.id}.mp4`
        const { error: uploadError } = await supabase.storage
          .from('generated-videos')
          .upload(fileName, videoBuffer, {
            contentType: 'video/mp4',
            upsert: true,
          })

        if (uploadError) {
          console.error('Error uploading video:', uploadError)
          // Continue with original URL if upload fails
        } else {
          // Get public URL from Supabase Storage
          const {
            data: { publicUrl },
          } = supabase.storage.from('generated-videos').getPublicUrl(fileName)
          finalVideoUrl = publicUrl
        }
      } catch (error) {
        console.error('Error processing video:', error)
        // Continue with original URL if processing fails
      }
    }

    // Determine final status
    const finalStatus = (status === 'completed' || status === 'success') ? 'completed' : 'failed'

    // Update the generation record
    const { error: updateError } = await supabase
      .from('generations')
      .update({
        status: finalStatus,
        output_video_url: finalVideoUrl || null,
        error_message: errorMessage || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', generation.id)

    if (updateError) {
      console.error('Error updating generation:', updateError)
      return NextResponse.json(
        { error: 'Failed to update generation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
