export const config = { runtime: 'edge' }

const CTX = { client: { clientName: 'WEB', clientVersion: '2.20240101.00.00', hl: 'en', gl: 'IN' } }
const KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'

function fmtDur(s) {
  if (!s) return ''
  return Math.floor(s/60) + ':' + String(Math.floor(s%60)).padStart(2,'0')
}

function decodeHtml(s) {
  return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"')
}

function parseRSS(xml, host) {
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || []
  return entries.slice(0, 25).map(e => {
    const vid = e.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] || ''
    const title = decodeHtml(e.match(/<title>(.*?)<\/title>/)?.[1] || 'Untitled')
    const pub = e.match(/<published>(.*?)<\/published>/)?.[1] || ''
    return {
      videoId: vid, title, artist: host,
      thumb: vid ? `https://i.ytimg.com/vi/${vid}/mqdefault.jpg` : '',
      pub: pub ? new Date(pub).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '',
      dur: '', durSec: 0
    }
  }).filter(e => e.videoId)
}

function parseSearch(data, host) {
  const results = []
  try {
    const sections = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ?? []
    for (const s of sections) {
      for (const item of s?.itemSectionRenderer?.contents ?? []) {
        const v = item?.videoRenderer
        if (!v?.videoId || !v.title) continue
        const title = v.title?.runs?.[0]?.text || v.title?.simpleText || ''
        const durTxt = v.lengthText?.simpleText || ''
        const durSec = durTxt ? durTxt.split(':').reduce((acc,t,i,a)=>acc+(+t)*Math.pow(60,a.length-1-i),0) : 0
        if (durSec > 0 && durSec < 61) continue
        if (durSec > 3600) continue
        const thumbs = v.thumbnail?.thumbnails || []
        const thumb = thumbs.sort((a,b)=>(b.width||0)-(a.width||0))[0]?.url
          || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`
        results.push({ videoId: v.videoId, title, artist: host, thumb, dur: fmtDur(durSec), durSec, pub: '' })
      }
    }
  } catch (_) {}
  return results
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

  // ── Attempt 1: YouTube RSS (fastest, most reliable) ──────
  try {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'application/atom+xml,application/xml,text/xml,*/*',
      }
    })
    if (r.ok) {
      const xml = await r.text()
      if (xml.includes('<yt:videoId>')) {
        const items = parseRSS(xml, host)
        if (items.length > 0) return new Response(JSON.stringify({ items }), { headers: hdrs })
      }
    }
  } catch (_) {}

  // ── Attempt 2: Search YouTube for channel name ─────────────
  // This always works because it goes through the same InnerTube as search
  try {
    const q = `${host} podcast latest`
    const r = await fetch(`https://www.youtube.com/youtubei/v1/search?key=${KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
      },
      body: JSON.stringify({ query: q, context: CTX, params: 'EgIQAQ%3D%3D' })
    })
    if (r.ok) {
      const data = await r.json()
      const items = parseSearch(data, host)
      if (items.length > 0) return new Response(JSON.stringify({ items }), { headers: hdrs })
    }
  } catch (_) {}

  // ── Attempt 3: InnerTube browse ─────────────────────────────
  try {
    const r = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
      },
      body: JSON.stringify({ browseId: id, params: 'EgZ2aWRlb3M%3D', context: CTX })
    })
    if (r.ok) {
      const data = await r.json()
      const items = []
      const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? []
      for (const tab of tabs) {
        const sections = tab?.tabRenderer?.content?.sectionListRenderer?.contents
          ?? tab?.tabRenderer?.content?.richGridRenderer?.contents ?? []
        for (const sec of sections) {
          const grid = sec?.richGridRenderer?.contents
            ?? sec?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items ?? []
          for (const gi of grid) {
            const v = gi?.richItemRenderer?.content?.videoRenderer ?? gi?.gridVideoRenderer
            if (!v?.videoId) continue
            const title = v.title?.runs?.[0]?.text || v.title?.simpleText || ''
            const durTxt = v.lengthText?.simpleText || ''
            const durSec = durTxt ? durTxt.split(':').reduce((acc,t,i,a)=>acc+(+t)*Math.pow(60,a.length-1-i),0) : 0
            const thumb = `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`
            items.push({ videoId: v.videoId, title, artist: host, thumb, dur: fmtDur(durSec), durSec, pub: '' })
          }
        }
      }
      if (items.length > 0) return new Response(JSON.stringify({ items: items.slice(0,25) }), { headers: hdrs })
    }
  } catch (_) {}

  return new Response(JSON.stringify({ items: [], error: 'All attempts failed' }), { status: 502, headers: hdrs })
}
