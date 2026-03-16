'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TrackRow } from '@/components/music/TrackRow'
import { AlbumCard } from '@/components/music/AlbumCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Track } from '@/types'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

function ArtistContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const artist = searchParams.get('artist') || ''
  const [songs, setSongs] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!artist) return
    fetch(`/api/search?q=${encodeURIComponent(artist + ' songs')}&type=music`)
      .then((r) => r.json())
      .then((d) => setSongs(d.results || []))
      .catch(() => setSongs([]))
      .finally(() => setLoading(false))
  }, [artist])

  return (
    <div className="page-enter min-h-screen">
      <div className="px-5 pt-14 md:pt-10 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-apple-red text-sm mb-4 font-medium"
        >
          <ChevronLeft size={18} /> Back
        </button>

        {/* Artist header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-apple-red/60 to-purple-600/60 flex items-center justify-center text-4xl shrink-0">
            🎤
          </div>
          <div>
            <h1 className="text-2xl font-bold">{artist}</h1>
            <p className="text-sm text-apple-text-secondary mt-0.5">
              {loading ? '...' : `${songs.length} songs`}
            </p>
          </div>
        </div>
      </div>

      {/* Songs list */}
      <div className="px-3">
        {loading ? (
          <div className="space-y-3 px-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 text-center text-xs text-apple-text-secondary">{i + 1}</div>
                <div className="w-10 h-10 rounded-md skeleton shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 skeleton rounded mb-1.5 w-3/4" />
                  <div className="h-2.5 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-4xl mb-3">🎵</p>
            <p className="font-semibold">No songs found</p>
          </div>
        ) : (
          songs.map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} queue={songs} showIndex />
          ))
        )}
      </div>
    </div>
  )
}

export default function ArtistPage() {
  return (
    <Suspense>
      <ArtistContent />
    </Suspense>
  )
}
