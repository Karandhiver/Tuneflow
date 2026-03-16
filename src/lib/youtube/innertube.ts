import { Innertube } from 'youtubei.js'

let _yt: Innertube | null = null
let _initPromise: Promise<Innertube> | null = null

/** Singleton InnerTube instance — call from server-side only */
export async function getYoutube(): Promise<Innertube> {
  if (_yt) return _yt
  // Prevent duplicate initialisation during concurrent requests
  if (_initPromise) return _initPromise
  _initPromise = Innertube.create({
    lang: 'en',
    location: 'IN',
    retrieve_player: true,
    generate_session_locally: true,
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, next: { revalidate: 0 } } as RequestInit),
  }).then((yt) => {
    _yt = yt
    _initPromise = null
    return yt
  })
  return _initPromise
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export function parseDuration(text: string): number {
  if (!text) return 0
  const parts = text.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

export function getBestThumbnail(thumbnails: any[]): string {
  if (!thumbnails?.length) return ''
  // Sort by width descending, prefer ≥300px
  const sorted = [...thumbnails].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
  // Try to find a reasonable-sized one (not 4K to avoid bandwidth)
  const good = sorted.find((t) => (t.width ?? 0) <= 1280 && t.url)
  return (good ?? sorted[0])?.url ?? ''
}
