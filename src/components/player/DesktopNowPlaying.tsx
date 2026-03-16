'use client'
import { usePlayerStore } from '@/lib/store'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import Image from 'next/image'

// This renders inline in the sidebar on desktop
export function DesktopNowPlaying() {
  const { currentTrack, isPlaying, togglePlay, next, prev, progress, duration, setExpanded } =
    usePlayerStore()

  if (!currentTrack) return null

  const t = currentTrack as any
  const pct = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div className="border-t border-apple-border pt-3 mt-2">
      {/* Mini artwork + info */}
      <div
        className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-apple-surface rounded-lg p-1.5 -mx-1.5 transition-colors"
        onClick={() => setExpanded(true)}
      >
        <div className="relative w-9 h-9 rounded-md overflow-hidden shrink-0">
          {t.thumbnail ? (
            <Image src={t.thumbnail} alt={t.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-apple-surface2 flex items-center justify-center text-xs">🎵</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{t.title}</p>
          <p className="text-[11px] text-apple-text-secondary truncate">{t.artist}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-0.5 rounded-full bg-apple-surface2 mb-2 overflow-hidden">
        <div className="h-full bg-apple-red transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-1">
        <button onClick={prev} className="w-8 h-8 flex items-center justify-center text-apple-text-secondary hover:text-white transition-colors">
          <SkipBack size={16} />
        </button>
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow"
        >
          {isPlaying ? (
            <Pause size={14} fill="black" className="text-black" />
          ) : (
            <Play size={14} fill="black" className="text-black ml-0.5" />
          )}
        </button>
        <button onClick={next} className="w-8 h-8 flex items-center justify-center text-apple-text-secondary hover:text-white transition-colors">
          <SkipForward size={16} />
        </button>
      </div>
    </div>
  )
}
