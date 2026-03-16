import { NextRequest, NextResponse } from 'next/server'
import { getYoutube } from '@/lib/youtube/innertube'

export const maxDuration = 30 // Vercel function timeout

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId')
  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 })
  }

  try {
    const yt = await getYoutube()
    const info = await yt.getInfo(videoId)

    if (!info?.streaming_data) {
      return NextResponse.json({ error: 'No streaming data found' }, { status: 404 })
    }

    // Prefer adaptive audio formats (higher quality, audio only)
    const adaptive = info.streaming_data.adaptive_formats ?? []
    const regular = info.streaming_data.formats ?? []

    // Sort audio adaptive formats by bitrate descending
    const audioFormats = adaptive
      .filter((f: any) => {
        const mime = f.mime_type ?? ''
        return (mime.includes('audio/mp4') || mime.includes('audio/webm')) && f.url
      })
      .sort((a: any, b: any) => (b.bitrate ?? 0) - (a.bitrate ?? 0))

    if (audioFormats.length > 0) {
      const best = audioFormats[0]
      return NextResponse.json({
        url: best.url,
        mimeType: best.mime_type,
        bitrate: best.bitrate,
        quality: best.audio_quality,
      })
    }

    // Fallback: regular formats (contain video+audio)
    const fallback = regular.find((f: any) => f.url)
    if (fallback?.url) {
      return NextResponse.json({ url: fallback.url, mimeType: fallback.mime_type })
    }

    return NextResponse.json({ error: 'No playable stream found' }, { status: 404 })
  } catch (err: any) {
    console.error('[stream]', videoId, err?.message)
    // Provide a helpful error for common issues
    if (err?.message?.includes('403')) {
      return NextResponse.json(
        { error: 'Stream access denied. Video may be region-restricted or age-gated.' },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: 'Failed to fetch stream URL' }, { status: 500 })
  }
}
