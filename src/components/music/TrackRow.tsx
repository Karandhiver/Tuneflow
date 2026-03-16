'use client'
import Image from 'next/image'
import Link from 'next/link'
import { MoreHorizontal } from 'lucide-react'
import { usePlayerStore, useLibraryStore } from '@/lib/store'
import { Track } from '@/types'
import { useState } from 'react'
import { TrackOptionsSheet } from './TrackOptionsSheet'

interface Props {
  track: Track
  index?: number
  queue?: Track[]
  showIndex?: boolean
}

export function TrackRow({ track, index, queue, showIndex }: Props) {
  const { play, currentTrack, isPlaying } = usePlayerStore()
  const { addToHistory } = useLibraryStore()
  const [showOptions, setShowOptions] = useState(false)
  const isActive = currentTrack?.id === track.id

  const handlePlay = () => {
    play(track, queue)
    addToHistory(track)
  }

  return (
    <>
      <div className="track-row flex items-center gap-3 px-2 py-2 cursor-pointer group" onClick={handlePlay}>
        {/* Index / playing indicator */}
        {showIndex && (
          <div className="w-6 flex items-center justify-center shrink-0">
            {isActive && isPlaying ? (
              <div className="flex items-end gap-[2px] h-4">
                <div className="w-[3px] bg-apple-red rounded-sm playing-bar-1" />
                <div className="w-[3px] bg-apple-red rounded-sm playing-bar-2" />
                <div className="w-[3px] bg-apple-red rounded-sm playing-bar-3" />
              </div>
            ) : (
              <span className={`text-xs ${isActive ? 'text-apple-red' : 'text-apple-text-secondary'}`}>
                {(index ?? 0) + 1}
              </span>
            )}
          </div>
        )}

        {/* Thumbnail */}
        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-apple-surface2">
          {track.thumbnail ? (
            <Image src={track.thumbnail} alt={track.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm">🎵</div>
          )}
          {isActive && isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex items-end gap-[2px] h-3">
                <div className="w-[2px] bg-white rounded-sm playing-bar-1" />
                <div className="w-[2px] bg-white rounded-sm playing-bar-2" />
                <div className="w-[2px] bg-white rounded-sm playing-bar-3" />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? 'text-apple-red' : 'text-white'}`}>
            {track.title}
          </p>
          <Link
            href={`/artist?artist=${encodeURIComponent(track.artist)}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-apple-text-secondary truncate hover:text-apple-red transition-colors block"
          >
            {track.artist}
          </Link>
        </div>

        {/* Duration */}
        <span className="text-xs text-apple-text-secondary shrink-0 mr-1 tabular-nums">
          {track.durationText}
        </span>

        {/* Options button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowOptions(true) }}
          className="w-7 h-7 flex items-center justify-center text-apple-text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {showOptions && (
        <TrackOptionsSheet track={track} onClose={() => setShowOptions(false)} />
      )}
    </>
  )
}
