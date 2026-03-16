import { NextRequest, NextResponse } from 'next/server'
import { getYoutube } from '@/lib/youtube/innertube'

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId')
  if (!videoId) return NextResponse.json({ lyrics: null })

  try {
    const yt = await getYoutube()

    // Try YouTube Music lyrics endpoint
    const info = await yt.music.getUpNext(videoId)
    const playlistId = info?.current?.playlistId

    if (playlistId) {
      try {
        const lyrics = await yt.music.getLyrics(playlistId)
        if (lyrics?.description?.text) {
          return NextResponse.json({
            lyrics: lyrics.description.text,
            source: 'youtube_music',
          })
        }
      } catch {}
    }

    // Fallback: try searching for lyrics via a public API
    const title = req.nextUrl.searchParams.get('title') || ''
    const artist = req.nextUrl.searchParams.get('artist') || ''

    if (title && artist) {
      try {
        const query = encodeURIComponent(`${artist} ${title}`)
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

    return NextResponse.json({ lyrics: null })
  } catch (err: any) {
    console.error('Lyrics error:', err.message)
    return NextResponse.json({ lyrics: null })
  }
}
