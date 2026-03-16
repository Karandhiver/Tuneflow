import { NextRequest, NextResponse } from 'next/server'
import { getYoutube, getBestThumbnail } from '@/lib/youtube/innertube'

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId')
  const artist = req.nextUrl.searchParams.get('artist') || ''

  if (!videoId && !artist) {
    return NextResponse.json({ tracks: [] })
  }

  try {
    const yt = await getYoutube()

    // Try to get radio/mix based on current song
    if (videoId) {
      try {
        const upNext = await yt.music.getUpNext(videoId)
        const items = upNext?.contents || []

        const tracks = items
          .filter((i: any) => i.id && i.id !== videoId)
          .slice(0, 15)
          .map((i: any) => ({
            id: i.id,
            videoId: i.id,
            title: i.title || 'Unknown',
            artist: i.artists?.map((a: any) => a.name).join(', ') || artist || 'Unknown',
            album: i.album?.name || '',
            thumbnail: getBestThumbnail(i.thumbnails || []),
            duration: i.duration?.seconds || 0,
            durationText: i.duration?.text || '0:00',
          }))

        if (tracks.length > 0) {
          return NextResponse.json({ tracks })
        }
      } catch {}
    }

    // Fallback: search by artist name
    const query = artist || 'trending india'
    const results = await yt.music.search(query, { type: 'song' })
    const songs = results.songs?.contents || []

    const tracks = songs
      .filter((s: any) => s.id && s.id !== videoId)
      .slice(0, 15)
      .map((s: any) => ({
        id: s.id,
        videoId: s.id,
        title: s.title || 'Unknown',
        artist: s.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
        album: s.album?.name || '',
        thumbnail: getBestThumbnail(s.thumbnails || []),
        duration: s.duration?.seconds || 0,
        durationText: s.duration?.text || '0:00',
      }))

    return NextResponse.json({ tracks })
  } catch (err: any) {
    console.error('Related error:', err.message)
    return NextResponse.json({ tracks: [] })
  }
}
