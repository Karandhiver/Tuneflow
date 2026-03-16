import { NextRequest, NextResponse } from 'next/server'
import { INDIAN_PODCASTERS } from '@/types'

const RSS_BASE = 'https://www.youtube.com/feeds/videos.xml?channel_id='

// Decode XML entities
function decodeXml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

// Extract tag content from XML string
function extract(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return m ? decodeXml(m[1].trim()) : ''
}

async function fetchChannelFeed(channelId: string, limit = 15) {
  try {
    const res = await fetch(`${RSS_BASE}${channelId}`, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return []

    const xml = await res.text()
    const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || []

    return entries.slice(0, limit).map((entry) => {
      const videoId = extract(entry, 'yt:videoId')
      const title = extract(entry, 'title')
      const published = extract(entry, 'published')
      // Use mqdefault as fallback since maxresdefault sometimes 404s
      const thumbnail = videoId
        ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
        : ''

      return {
        id: videoId,
        videoId,
        title: title || 'Untitled',
        thumbnail,
        publishedAt: published,
        duration: 0,
        durationText: '',
      }
    }).filter((e) => e.videoId)
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get('channelId')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '15')

  if (channelId) {
    const episodes = await fetchChannelFeed(channelId, limit)
    return NextResponse.json({ episodes })
  }

  // Return all podcast metadata
  return NextResponse.json({ podcasts: INDIAN_PODCASTERS })
}
