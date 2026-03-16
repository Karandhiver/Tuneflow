'use client'
import { useState, useEffect } from 'react'
import { usePlayerStore } from '@/lib/store'
import { AlbumCard } from './AlbumCard'
import { Track } from '@/types'
import { SectionHeader } from '@/components/ui/SectionHeader'

export function RelatedSongs() {
  const { currentTrack } = usePlayerStore()
  const [related, setRelated] = useState<Track[]>([])

  useEffect(() => {
    if (!currentTrack) return
    const t = currentTrack as any
    fetch(`/api/related?videoId=${t.videoId}&artist=${encodeURIComponent(t.artist || '')}`)
      .then((r) => r.json())
      .then((d) => setRelated(d.tracks || []))
      .catch(() => {})
  }, [currentTrack?.id])

  if (!currentTrack || related.length === 0) return null

  return (
    <section className="mb-8">
      <div className="px-5">
        <SectionHeader title="✨ You Might Also Like" />
      </div>
      <div className="flex gap-4 px-5 overflow-x-auto pb-3 no-scrollbar">
        {related.map((track) => (
          <AlbumCard key={track.id} track={track} queue={related} />
        ))}
      </div>
    </section>
  )
}
