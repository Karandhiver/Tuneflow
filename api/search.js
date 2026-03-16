export const config = { runtime: 'edge' }

const CTX = {
  client: { clientName: 'WEB', clientVersion: '2.20240101.00.00', hl: 'en', gl: 'IN' }
}
const KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'

function sec(txt) {
  if (!txt) return 0
  const p = txt.split(':').map(Number)
  if (p.length === 3) return p[0]*3600 + p[1]*60 + p[2]
  if (p.length === 2) return p[0]*60 + p[1]
  return 0
}
function dur(s) {
  if (!s) return ''
  return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0')
}
function thumb(v) {
  const t = v.thumbnail?.thumbnails || []
  return t.sort((a,b)=>(b.width||0)-(a.width||0))[0]?.url
    || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`
}

function parse(data) {
  const out = []
  try {
    const sections =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents ?? []
    for (const s of sections) {
      for (const item of s?.itemSectionRenderer?.contents ?? []) {
        const v = item?.videoRenderer
        if (!v?.videoId || !v.title) continue
        const title = v.title?.runs?.[0]?.text || v.title?.simpleText || ''
        const artist = v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || ''
        const durSec = sec(v.lengthText?.simpleText || '')
        if (durSec > 0 && durSec < 61) continue  // skip shorts
        if (durSec > 1200) continue                // skip mega-compilations
        const bad = ['nonstop','jukebox','10 hours','8 hours','5 hours','mashup playlist','top 100','best of playlist']
        if (bad.some(b => title.toLowerCase().includes(b))) continue
        out.push({ videoId: v.videoId, title, artist, thumb: thumb(v), dur: dur(durSec), durSec })
      }
    }
  } catch (_) {}
  return out
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const hdrs = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600'
  }
  if (!q) return new Response(JSON.stringify({ items: [] }), { headers: hdrs })

  try {
    const r = await fetch(`https://www.youtube.com/youtubei/v1/search?key=${KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q),
      },
      body: JSON.stringify({ query: q, context: CTX, params: 'EgIQAQ%3D%3D' })
    })
    if (!r.ok) throw new Error(r.status)
    const data = await r.json()
    const items = parse(data)
    return new Response(JSON.stringify({ items, more: items.length >= 15 }), { headers: hdrs })
  } catch (e) {
    return new Response(JSON.stringify({ items: [], error: e.message }), { status: 502, headers: hdrs })
  }
}
