'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePlayerStore } from '@/lib/store'
import { Track } from '@/types'
import { Play, Pause } from 'lucide-react'

interface Props {
  track: Track
  queue?: Track[]
  size?: 'sm' | 'md'
}

export function AlbumCard({ track, queue, size = 'md' }: Props) {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayerStore()
  const isActive = currentTrack?.id === track.id
  const dim = size === 'sm' ? 'w-28 h-28' : 'w-36 h-36'
  const width = size === 'sm' ? 'w-28' : 'w-36'

  const handleClick = () => {
    if (isActive) {
      togglePlay()
    } else {
      play(track, queue)
    }
  }

  return (
    <div className={`cursor-pointer shrink-0 ${width} group`} onClick={handleClick}>
      <div className={`relative ${dim} rounded-xl overflow-hidden shadow-lg mb-2 bg-apple-surface2`}>
        {track.thumbnail ? (
          <Image
            src={track.thumbnail}
            alt={track.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🎵</div>
        )}

        {/* Overlay on hover / active */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            isActive ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100 bg-black/30'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
            {isActive && isPlaying ? (
              <div className="flex items-end gap-[2px] h-4">
                <div className="w-[2px] bg-black rounded-sm playing-bar-1" />
                <div className="w-[2px] bg-black rounded-sm playing-bar-2" />
                <div className="w-[2px] bg-black rounded-sm playing-bar-3" />
              </div>
            ) : (
              <Play size={16} fill="black" className="text-black ml-0.5" />
            )}
          </div>
        </div>

        {/* Active indicator dot */}
        {isActive && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-apple-red shadow-lg" />
        )}
      </div>

      <p className={`text-xs font-semibold truncate ${isActive ? 'text-apple-red' : 'text-white'}`}>
        {track.title}
      </p>
      <Link
        href={`/artist?artist=${encodeURIComponent(track.artist)}`}
        onClick={(e) => e.stopPropagation()}
        className="text-[11px] text-apple-text-secondary truncate mt-0.5 hover:text-apple-red transition-colors block"
      >
        {track.artist}
      </Link>
    </div>
  )
}
