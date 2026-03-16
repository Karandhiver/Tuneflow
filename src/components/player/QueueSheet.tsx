'use client'
import { usePlayerStore } from '@/lib/store'
import { X, ListMusic, GripVertical, Play, Pause } from 'lucide-react'
import Image from 'next/image'

interface Props {
  onClose: () => void
}

export function QueueSheet({ onClose }: Props) {
  const { queue, queueIndex, currentTrack, isPlaying, play, togglePlay } = usePlayerStore()

  return (
    <div className="fixed inset-0 z-[150] flex items-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full glass rounded-t-3xl animate-slide-up flex flex-col"
        style={{
          maxHeight: '75vh',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-apple-border">
          <div className="flex items-center gap-2">
            <ListMusic size={18} className="text-apple-red" />
            <span className="font-semibold text-base">Next Up</span>
            <span className="text-xs text-apple-text-secondary ml-1">
              {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-apple-surface2 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Queue list */}
        <div className="overflow-y-auto flex-1 px-2 py-2">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ListMusic size={36} className="text-apple-text-secondary mb-3" />
              <p className="text-sm text-apple-text-secondary">Queue is empty</p>
            </div>
          ) : (
            queue.map((item, i) => {
              const t = item as any
              const isCurrent = i === queueIndex
              const isPast = i < queueIndex

              return (
                <div
                  key={`${t.id}-${i}`}
                  onClick={() => {
                    if (!isCurrent) {
                      play(item, queue)
                    } else {
                      togglePlay()
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-apple-surface2'
                      : 'hover:bg-apple-surface opacity-' + (isPast ? '40' : '100')
                  } ${isPast ? 'opacity-40' : ''}`}
                >
                  {/* Index / playing */}
                  <div className="w-5 shrink-0 flex items-center justify-center">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end gap-[2px] h-4">
                        <div className="w-[3px] bg-apple-red rounded-sm playing-bar-1" />
                        <div className="w-[3px] bg-apple-red rounded-sm playing-bar-2" />
                        <div className="w-[3px] bg-apple-red rounded-sm playing-bar-3" />
                      </div>
                    ) : (
                      <span className={`text-xs ${isCurrent ? 'text-apple-red font-bold' : 'text-apple-text-secondary'}`}>
                        {i + 1}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-9 h-9 rounded-md overflow-hidden shrink-0 bg-apple-surface3">
                    {t.thumbnail && (
                      <Image src={t.thumbnail} alt={t.title} fill className="object-cover" unoptimized />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-apple-red' : 'text-white'}`}>
                      {t.title}
                    </p>
                    <p className="text-[11px] text-apple-text-secondary truncate">{t.artist}</p>
                  </div>

                  {/* Duration */}
                  {t.durationText && (
                    <span className="text-[11px] text-apple-text-secondary shrink-0">{t.durationText}</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
