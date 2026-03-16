import { NextRequest, NextResponse } from 'next/server'
import { getYoutube } from '@/lib/youtube/innertube'

export const maxDuration = 15

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId')
  const title  = req.nextUrl.searchParams.get('title')  || ''
  const artist = req.nextUrl.searchParams.get('artist') || ''

  if (!videoId) return NextResponse.json({ lyrics: null })

  try {
    const yt = await getYoutube()

    // Try lyrics.ovh first (free, no API key)
    if (title && artist) {
      try {
        const res = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
          { next: { revalidate: 86400 } }
        )
        if (res.ok) {
          const data = await res.json()
          if (data.lyrics) {
            return NextResponse.json({ lyrics: data.lyrics, source: 'lyrics_ovh' })
          }
        }
      } catch {}
    }

    // Fallback: try YouTube Music lyrics via browse endpoint
    try {
      // Get watch page to find browseId for lyrics
      const info = await yt.getInfo(videoId)
      // Some videos expose lyrics via related endpoints
      const engagement = (info as any)?.engagement_panels
      if (engagement) {
        for (const panel of engagement) {
          const content = panel?.engagementPanelSectionListRenderer?.content
          const lyrics = content?.sectionListRenderer?.contents?.[0]
            ?.musicDescriptionShelfRenderer?.description?.runs?.[0]?.text
          if (lyrics) {
            return NextResponse.json({ lyrics, source: 'youtube' })
          }
        }
      }
    } catch {}

    return NextResponse.json({ lyrics: null })
  } catch (err: any) {
    console.error('[lyrics]', err?.message)
    return NextResponse.json({ lyrics: null })
  }
}
