'use client'
import { usePlayerStore, useLibraryStore } from '@/lib/store'
import { Play, Pause, SkipForward, Heart } from 'lucide-react'
import Image from 'next/image'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'

export function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlay, next, progress, duration, setExpanded, isLoading } = usePlayerStore()
  const { isLiked, like, unlike } = useLibraryStore()
  const { onTouchStart, onTouchEnd } = useSwipeGesture({ onSwipeUp: () => setExpanded(true), threshold: 40 })

  if (!currentTrack) return null
  const track = currentTrack as any
  const pct = duration > 0 ? (progress / duration) * 100 : 0
  const liked = isLiked(track.id)

  return (
    <div
      className="fixed left-0 right-0 z-50 md:left-56 px-2 md:bottom-2"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 58px)' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="glass rounded-2xl overflow-hidden shadow-2xl cursor-pointer active:scale-[0.99] transition-transform"
        onClick={() => setExpanded(true)}
      >
        <div className="h-[3px] bg-apple-surface2">
          <div className="h-full bg-apple-red transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className={`relative rounded-xl overflow-hidden shrink-0 shadow-lg transition-all duration-300 ${isPlaying ? 'w-11 h-11' : 'w-10 h-10'}`}>
            {track.thumbnail ? (
              <Image src={track.thumbnail} alt={track.title} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-apple-surface2 flex items-center justify-center text-lg">🎵</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{track.title}</p>
            <p className="text-xs text-apple-text-secondary truncate mt-0.5">{track.artist}</p>
          </div>
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => liked ? unlike(track.id) : like(track)} className="w-10 h-10 flex items-center justify-center">
              <Heart size={19} className={liked ? 'text-apple-red fill-apple-red' : 'text-white/40'} />
            </button>
            <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center" disabled={isLoading}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={22} fill="white" className="text-white" />
              ) : (
                <Play size={22} fill="white" className="text-white" />
              )}
            </button>
            <button onClick={next} className="w-10 h-10 flex items-center justify-center">
              <SkipForward size={22} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
