import { AlbumCard } from '@/components/music/AlbumCard'
import { PodcastCard } from '@/components/podcast/PodcastCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { HomeRelatedSongs } from '@/components/music/HomeRelatedSongs'
import { INDIAN_PODCASTERS, Track } from '@/types'
import { getYoutube, getBestThumbnail } from '@/lib/youtube/innertube'

async function getTrending(): Promise<Track[]> {
  try {
    const yt = await getYoutube()
    const charts = await yt.music.getCharts('IN')
    const trending = charts.items?.find((i: any) =>
      i.title?.toLowerCase().includes('trend')
    )
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

    if (tracks.length > 0) return tracks

    // Fallback
    const results = await yt.music.search('bollywood hits 2025', { type: 'song' })
    const songs = results.songs?.contents || []
    return songs.slice(0, 20).map((s: any) => ({
      id: s.id,
      videoId: s.id,
      title: s.title || 'Unknown',
      artist: s.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      album: s.album?.name || '',
      thumbnail: getBestThumbnail(s.thumbnails || []),
      duration: s.duration?.seconds || 0,
      durationText: s.duration?.text || '0:00',
    }))
  } catch (e) {
    console.error('getTrending error:', e)
    return []
  }
}

const QUICK_PICKS = [
  { label: 'Bollywood Hits', emoji: '🎬', query: 'bollywood hits 2025' },
  { label: 'Punjabi Beats', emoji: '🥁', query: 'punjabi songs 2025' },
  { label: 'Chill Vibes', emoji: '😌', query: 'chill hindi lofi songs' },
  { label: 'Top 50 India', emoji: '🇮🇳', query: 'top 50 india songs' },
  { label: 'Arijit Singh', emoji: '🎤', query: 'arijit singh best songs' },
  { label: 'A.R. Rahman', emoji: '🎼', query: 'ar rahman songs' },
  { label: 'Diljit Dosanjh', emoji: '🎸', query: 'diljit dosanjh songs' },
  { label: 'Old is Gold', emoji: '✨', query: 'classic hindi songs 90s' },
]

export default async function HomePage() {
  const trending = await getTrending()
  const hour = new Date().getHours()
  const greeting =
    hour < 5 ? 'Good Night' :
    hour < 12 ? 'Good Morning' :
    hour < 17 ? 'Good Afternoon' :
    hour < 21 ? 'Good Evening' : 'Good Night'

  return (
    <div className="page-enter min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 md:pt-10 pb-6">
        <p className="text-apple-text-secondary text-sm font-medium mb-1">{greeting}</p>
        <h1 className="text-3xl font-bold">Wave Music</h1>
      </div>

      {/* Trending in India */}
      <section className="mb-8">
        <div className="px-5">
          <SectionHeader title="🔥 Trending in India" href="/search?q=trending+india" />
        </div>
        {trending.length > 0 ? (
          <div className="flex gap-4 px-5 overflow-x-auto pb-3 no-scrollbar">
            {trending.map((track) => (
              <AlbumCard key={track.id} track={track} queue={trending} />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 px-5 overflow-x-auto pb-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="shrink-0 w-36">
                <div className="w-36 h-36 rounded-xl skeleton mb-2" />
                <div className="h-3 rounded skeleton mb-1.5 w-28" />
                <div className="h-2.5 rounded skeleton w-20" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Indian Podcasts */}
      <section className="mb-8">
        <div className="px-5">
          <SectionHeader title="🎙️ Indian Podcasts" href="/podcasts" />
        </div>
        <div className="flex gap-4 px-5 overflow-x-auto pb-3 no-scrollbar">
          {INDIAN_PODCASTERS.map((p) => (
            <PodcastCard key={p.id} podcast={p} size="lg" />
          ))}
        </div>
      </section>

      {/* Related / Up Next — client-side dynamic section */}
      <HomeRelatedSongs />

      {/* Quick Picks */}
      <section className="mb-10 px-5">
        <SectionHeader title="🎵 Browse Categories" />
        <div className="grid grid-cols-2 gap-3">
          {QUICK_PICKS.map((item) => (
            <a
              key={item.label}
              href={`/search?q=${encodeURIComponent(item.query)}`}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-apple-surface hover:bg-apple-surface2 active:scale-[0.98] transition-all"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-sm font-semibold truncate">{item.label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
