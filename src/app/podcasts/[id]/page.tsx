'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { INDIAN_PODCASTERS, PodcastEpisode } from '@/types'
import { usePlayerStore, useSpeedStore } from '@/lib/store'
import { Play, Pause, ChevronLeft, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { SpeedControl } from '@/components/podcast/SpeedControl'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return '' }
}

export default function PodcastDetailPage() {
  const { id } = useParams<{ id: string }>()
  const podcast = INDIAN_PODCASTERS.find((p) => p.id === id)
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([])
  const [loading, setLoading] = useState(true)
  const { play, currentTrack, isPlaying } = usePlayerStore()
  const { speed, setSpeed } = useSpeedStore()

  useEffect(() => {
    if (!podcast) return
    fetch(`/api/podcasts?channelId=${podcast.channelId}`)
      .then((r) => r.json())
      .then((data) => {
        setEpisodes(
          (data.episodes || []).map((e: any) => ({
            ...e,
            podcastId: podcast.id,
            artist: podcast.host,
            durationText: e.durationText || '',
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [podcast?.channelId])

  if (!podcast) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-apple-text-secondary">Podcast not found</p>
        <Link href="/podcasts" className="text-apple-red text-sm font-medium">← Back</Link>
      </div>
    )
  }

  const isCurrentPlaying = (ep: PodcastEpisode) =>
    currentTrack?.id === ep.id && isPlaying

  return (
    <div className="page-enter min-h-screen">
      <div className="px-5 pt-14 md:pt-10">
        <Link href="/podcasts" className="flex items-center gap-1 text-apple-red text-sm mb-4 font-medium">
          <ChevronLeft size={18} /> Podcasts
        </Link>

        {/* Podcast hero */}
        <div className="flex gap-4 mb-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-apple-surface2 to-apple-surface3 flex items-center justify-center text-5xl shadow-xl shrink-0 border border-apple-border">
            🎙️
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-xl font-bold leading-tight">{podcast.name}</h1>
            <p className="text-apple-red font-semibold text-sm mt-1">{podcast.host}</p>
            <span className="inline-block text-[11px] font-medium bg-apple-surface px-2.5 py-1 rounded-full mt-2 text-apple-text-secondary">
              {podcast.category}
            </span>
          </div>
        </div>

        <p className="text-sm text-apple-text-secondary leading-relaxed mb-5 px-0.5">
          {podcast.description}
        </p>

        {/* Speed control row */}
        <div className="flex items-center justify-between mb-5 px-0.5">
          <p className="text-sm font-semibold text-white">
            Episodes {!loading && `(${episodes.length})`}
          </p>
          <SpeedControl currentSpeed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>

      {/* Episodes list */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-16 h-16 rounded-xl skeleton shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 skeleton rounded mb-2 w-4/5" />
                  <div className="h-2.5 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">🎙️</p>
            <p className="font-semibold mb-1">No episodes found</p>
            <a
              href={`https://www.youtube.com/channel/${podcast.channelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-apple-red text-sm font-medium mt-3"
            >
              View on YouTube <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          <div className="space-y-1">
            {episodes.map((ep) => {
              const isActive = currentTrack?.id === ep.id
              const playing = isCurrentPlaying(ep)

              return (
                <div
                  key={ep.id}
                  className="track-row flex items-center gap-3 p-2.5 cursor-pointer"
                  onClick={() => play(ep as any, episodes as any[])}
                >
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-apple-surface2 shrink-0">
                    {ep.thumbnail ? (
                      <Image src={ep.thumbnail} alt={ep.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎙️</div>
                    )}
                    {/* Playing overlay */}
                    {playing && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex items-end gap-[2px] h-4">
                          <div className="w-[3px] bg-white rounded-sm playing-bar-1" />
                          <div className="w-[3px] bg-white rounded-sm playing-bar-2" />
                          <div className="w-[3px] bg-white rounded-sm playing-bar-3" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold line-clamp-2 leading-snug ${isActive ? 'text-apple-red' : 'text-white'}`}>
                      {ep.title}
                    </p>
                    <p className="text-xs text-apple-text-secondary mt-1">
                      {formatDate(ep.publishedAt)}
                    </p>
                  </div>

                  {/* Play/pause icon */}
                  <button className="w-9 h-9 flex items-center justify-center shrink-0">
                    {playing ? (
                      <Pause size={18} className="text-apple-red" />
                    ) : (
                      <Play size={18} className="text-apple-text-secondary" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
