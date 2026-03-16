import { NextRequest, NextResponse } from 'next/server'
import { getYoutube, getBestThumbnail, formatDuration } from '@/lib/youtube/innertube'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const type = req.nextUrl.searchParams.get('type') || 'music'
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

  if (!q) return NextResponse.json({ results: [] })

  try {
    const yt = await getYoutube()

    if (type === 'music') {
      // Try YouTube Music first for better results
      const results = await yt.music.search(q, { type: 'song' })
      const songs = results.songs?.contents ?? []

      const tracks = songs
        .filter((s: any) => s.id && s.title)
        .slice(0, limit)
        .map((s: any) => ({
          id: s.id,
          videoId: s.id,
          title: s.title ?? 'Unknown',
          artist: s.artists?.map((a: any) => a.name).join(', ') ?? 'Unknown Artist',
          album: s.album?.name ?? '',
          thumbnail: getBestThumbnail(s.thumbnails ?? []),
          duration: s.duration?.seconds ?? 0,
          durationText: s.duration?.text ?? formatDuration(s.duration?.seconds ?? 0),
        }))

      return NextResponse.json({ results: tracks })
    }

    if (type === 'podcast') {
      const results = await yt.search(q, { type: 'video' })
      const items = (results as any).videos ?? []

      const episodes = items
        .filter((v: any) => v.id && v.title?.text)
        .slice(0, limit)
        .map((v: any) => ({
          id: v.id,
          videoId: v.id,
          title: v.title?.text ?? 'Unknown',
          artist: v.author?.name ?? 'Unknown',
          thumbnail: getBestThumbnail(v.thumbnails ?? []),
          duration: v.duration?.seconds ?? 0,
          durationText: v.duration?.text ?? '',
          publishedAt: v.published?.text ?? '',
        }))

      return NextResponse.json({ results: episodes })
    }

    return NextResponse.json({ results: [] })
  } catch (err: any) {
    console.error('[search]', q, err?.message)
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 })
  }
}
