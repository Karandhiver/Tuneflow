'use client'
import { useState, useEffect } from 'react'
import { X, Music2 } from 'lucide-react'

interface Props {
  videoId: string
  title: string
  artist: string
  onClose: () => void
}

export function LyricsPanel({ videoId, title, artist, onClose }: Props) {
  const [lyrics, setLyrics] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(
      `/api/lyrics?videoId=${videoId}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
    )
      .then((r) => r.json())
      .then((d) => setLyrics(d.lyrics || null))
      .catch(() => setLyrics(null))
      .finally(() => setLoading(false))
  }, [videoId])

  return (
    <div className="fixed inset-0 z-[160] flex items-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full glass rounded-t-3xl animate-slide-up flex flex-col"
        style={{
          maxHeight: '70vh',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-apple-border">
          <div>
            <p className="font-semibold text-sm">Lyrics</p>
            <p className="text-xs text-apple-text-secondary">{title} · {artist}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-apple-surface2 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 skeleton rounded"
                  style={{ width: `${55 + Math.random() * 40}%` }}
                />
              ))}
            </div>
          ) : lyrics ? (
            <pre className="text-sm leading-8 font-sans whitespace-pre-wrap text-white/90">
              {lyrics}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Music2 size={36} className="text-apple-text-secondary mb-3" />
              <p className="font-semibold text-sm mb-1">No lyrics found</p>
              <p className="text-xs text-apple-text-secondary">
                Lyrics aren't available for this song
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
