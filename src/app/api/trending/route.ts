import { NextResponse } from 'next/server'
import { getYoutube, getBestThumbnail } from '@/lib/youtube/innertube'

export async function GET() {
  try {
    const yt = await getYoutube()

    // Get trending music for India
    const charts = await yt.music.getCharts('IN')
    const trending = charts.items?.find((i: any) => i.title?.toLowerCase().includes('trend'))
    const items = trending?.contents || charts.items?.[0]?.contents || []

    const tracks = items
      .filter((i: any) => i.id)
      .slice(0, 20)
      .map((i: any) => ({
        id: i.id,
        videoId: i.id,
        title: i.title || 'Unknown',
        artist: i.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
        album: i.album?.name || '',
        thumbnail: getBestThumbnail(i.thumbnails || []),
        duration: i.duration?.seconds || 0,
        durationText: i.duration?.text || '0:00',
      }))

    if (tracks.length === 0) {
      // Fallback: search for trending Bollywood
      const results = await yt.music.search('trending india 2025', { type: 'song' })
      const songs = results.songs?.contents || []
      const fallback = songs.slice(0, 20).map((s: any) => ({
        id: s.id,
        videoId: s.id,
        title: s.title || 'Unknown',
        artist: s.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
        album: s.album?.name || '',
        thumbnail: getBestThumbnail(s.thumbnails || []),
        duration: s.duration?.seconds || 0,
        durationText: s.duration?.text || '0:00',
      }))
      return NextResponse.json({ tracks: fallback })
    }

    return NextResponse.json({ tracks })
  } catch (err: any) {
    console.error('Trending error:', err)
    return NextResponse.json({ tracks: [] }, { status: 500 })
  }
}
