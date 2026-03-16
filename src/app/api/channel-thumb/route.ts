import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get('channelId')
  if (!channelId) return NextResponse.json({ thumbnail: null })

  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const res = await fetch(rssUrl, { next: { revalidate: 86400 } })
    if (!res.ok) return NextResponse.json({ thumbnail: null })

    const xml = await res.text()
    const videoId = xml.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1]
    const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : null
    return NextResponse.json({ thumbnail })
  } catch {
    return NextResponse.json({ thumbnail: null })
  }
}
