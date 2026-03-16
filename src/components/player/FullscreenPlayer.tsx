'use client'
import { useState } from 'react'
import { usePlayerStore, useLibraryStore } from '@/lib/store'
import {
  ChevronDown, SkipBack, SkipForward, Play, Pause,
  Shuffle, Repeat, Repeat1, Heart, Ellipsis, Volume2,
  ListMusic, Mic2,
} from 'lucide-react'
import Image from 'next/image'
import { QueueSheet } from './QueueSheet'
import { LyricsPanel } from './LyricsPanel'
import { TrackOptionsSheet } from '../music/TrackOptionsSheet'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { toast } from '@/components/ui/Toast'
import { Track } from '@/types'

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function FullscreenPlayer() {
  const {
    currentTrack, isPlaying, isExpanded, setExpanded,
    togglePlay, next, prev, progress, duration,
    volume, setVolume, isShuffle, toggleShuffle,
    repeatMode, cycleRepeat, isLoading,
  } = usePlayerStore()
  const { like, unlike, isLiked } = useLibraryStore()
  const [showQueue, setShowQueue] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)

  const { onTouchStart, onTouchEnd } = useSwipeGesture({
    onSwipeDown: () => setExpanded(false),
    threshold: 60,
  })

  if (!isExpanded || !currentTrack) return null

  const track = currentTrack as any
  const liked = isLiked(track.id)
  const pct = duration > 0 ? (progress / duration) * 100 : 0

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = document.querySelector('audio') as HTMLAudioElement
    if (audio && duration) audio.currentTime = (Number(e.target.value) / 100) * duration
  }

  const handleLike = () => {
    if (liked) { unlike(track.id); toast.info('Removed from Liked Songs') }
    else { like(track as Track); toast.success('Added to Liked Songs') }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex flex-col animate-slide-up"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Blurred background */}
        <div className="absolute inset-0 overflow-hidden">
          {track.thumbnail && (
            <img src={track.thumbnail} alt="" className="w-full h-full object-cover scale-125 blur-3xl opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/85" />
        </div>

        <div className="relative flex flex-col h-full px-6 pt-3 pb-2 max-w-sm mx-auto w-full">

          {/* Drag handle */}
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setExpanded(false)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <ChevronDown size={22} />
            </button>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Now Playing</p>
            <button
              onClick={() => setShowOptions(true)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Ellipsis size={20} />
            </button>
          </div>

          {/* Artwork */}
          <div className="flex-1 flex items-center justify-center mb-5">
            <div
              className="relative rounded-3xl overflow-hidden transition-all duration-500 ease-out"
              style={{
                width: isPlaying ? 288 : 224,
                height: isPlaying ? 288 : 224,
                boxShadow: isPlaying
                  ? '0 32px 80px rgba(252,60,68,0.25), 0 12px 40px rgba(0,0,0,0.6)'
                  : '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              {track.thumbnail ? (
                <Image src={track.thumbnail} alt={track.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-apple-surface2 flex items-center justify-center text-7xl">🎵</div>
              )}
            </div>
          </div>

          {/* Track info + like */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-2xl font-bold truncate leading-tight">{track.title}</h2>
              <p className="text-apple-red font-semibold text-base truncate mt-0.5">{track.artist}</p>
              {track.album && <p className="text-xs text-white/35 truncate mt-0.5">{track.album}</p>}
            </div>
            <button onClick={handleLike} className="w-10 h-10 flex items-center justify-center shrink-0 mt-1">
              <Heart
                size={26}
                className={`transition-all duration-200 ${liked ? 'text-apple-red fill-apple-red scale-110' : 'text-white/50'}`}
              />
            </button>
          </div>

          {/* Progress */}
          <div className="mb-5">
            <input
              type="range" min={0} max={100} value={pct}
              onChange={handleSeek}
              className="w-full progress-bar cursor-pointer"
              style={{ '--progress': `${pct}%` } as any}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-white/40 font-medium tabular-nums">{formatTime(progress)}</span>
              <span className="text-[11px] text-white/40 font-medium tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => { toggleShuffle(); toast.info(isShuffle ? 'Shuffle off' : 'Shuffle on') }}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${isShuffle ? 'text-apple-red' : 'text-white/50'}`}
            >
              <Shuffle size={20} />
            </button>

            <button onClick={prev} className="w-12 h-12 flex items-center justify-center active:scale-90 transition-transform">
              <SkipBack size={34} fill="white" className="text-white" />
            </button>

            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            >
              {isLoading ? (
                <div className="w-7 h-7 border-[3px] border-black/20 border-t-black rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={30} fill="black" className="text-black" />
              ) : (
                <Play size={30} fill="black" className="text-black ml-1" />
              )}
            </button>

            <button onClick={next} className="w-12 h-12 flex items-center justify-center active:scale-90 transition-transform">
              <SkipForward size={34} fill="white" className="text-white" />
            </button>

            <button
              onClick={() => { cycleRepeat(); toast.info(`Repeat: ${repeatMode === 'off' ? 'All' : repeatMode === 'all' ? 'One' : 'Off'}`) }}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${repeatMode !== 'off' ? 'text-apple-red' : 'text-white/50'}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
            </button>
          </div>

          {/* Volume + extras */}
          <div className="flex items-center gap-2">
            <Volume2 size={13} className="text-white/30 shrink-0" />
            <input
              type="range" min={0} max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="flex-1 progress-bar"
              style={{ '--progress': `${volume * 100}%` } as any}
            />
            <Volume2 size={17} className="text-white/50 shrink-0" />

            {/* Lyrics button */}
            <button
              onClick={() => setShowLyrics(true)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center ml-1 hover:bg-white/20 transition-colors shrink-0"
            >
              <Mic2 size={15} className="text-white" />
            </button>

            {/* Queue button */}
            <button
              onClick={() => setShowQueue(true)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
            >
              <ListMusic size={15} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {showQueue && <QueueSheet onClose={() => setShowQueue(false)} />}
      {showLyrics && (
        <LyricsPanel
          videoId={track.videoId}
          title={track.title}
          artist={track.artist}
          onClose={() => setShowLyrics(false)}
        />
      )}
      {showOptions && (
        <TrackOptionsSheet track={currentTrack as Track} onClose={() => setShowOptions(false)} />
      )}
    </>
  )
}
