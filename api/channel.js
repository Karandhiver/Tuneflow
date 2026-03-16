export const config = { runtime: 'edge' }

const CTX = {
  client: { clientName: 'WEB', clientVersion: '2.20240101.00.00', hl: 'en', gl: 'IN' }
}
const KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'

function dur(s) {
  if (!s) return ''
  return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0')
}

function parseRSS(xml, host) {
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || []
  return entries.slice(0, 25).map(e => {
    const vid = e.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] || ''
    const raw = e.match(/<title>(.*?)<\/title>/)?.[1] || 'Untitled'
    const title = raw.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"')
    const pub = e.match(/<published>(.*?)<\/published>/)?.[1] || ''
    return {
      videoId: vid, title, artist: host,
      thumb: vid ? `https://i.ytimg.com/vi/${vid}/mqdefault.jpg` : '',
      pub: pub ? new Date(pub).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '',
      dur: '', durSec: 0
    }
  }).filter(e => e.videoId)
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const id   = searchParams.get('id') || ''
  const host = searchParams.get('host') || ''
  const hdrs = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800'
  }

  if (!id) return new Response(JSON.stringify({ items: [] }), { headers: hdrs })

  // Try RSS first — always works, simplest
  try {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    if (r.ok) {
      const xml = await r.text()
      const items = parseRSS(xml, host)
      if (items.length > 0) return new Response(JSON.stringify({ items }), { headers: hdrs })
    }
  } catch (_) {}

  // Fallback: InnerTube browse
  try {
    const r = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
      },
      body: JSON.stringify({
        browseId: id,
        params: 'EgZ2aWRlb3M%3D',
        context: CTX
      })
    })
    if (r.ok) {
      const data = await r.json()
      const items = []
      const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? []
      for (const tab of tabs) {
        const sections =
          tab?.tabRenderer?.content?.sectionListRenderer?.contents ??
          tab?.tabRenderer?.content?.richGridRenderer?.contents ?? []
        for (const sec of sections) {
          const grid = sec?.richGridRenderer?.contents
            ?? sec?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items ?? []
          for (const gi of grid) {
            const v = gi?.richItemRenderer?.content?.videoRenderer ?? gi?.gridVideoRenderer
            if (!v?.videoId) continue
            const title = v.title?.runs?.[0]?.text || v.title?.simpleText || ''
            const thumb = `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`
            items.push({ videoId: v.videoId, title, artist: host, thumb, dur: '', durSec: 0, pub: '' })
          }
        }
      }
      if (items.length > 0) return new Response(JSON.stringify({ items: items.slice(0,25) }), { headers: hdrs })
    }
  } catch (_) {}

  return new Response(JSON.stringify({ items: [] }), { status: 502, headers: hdrs })
}
