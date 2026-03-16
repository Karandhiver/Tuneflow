'use client'
import { useEffect, useRef, useState } from 'react'
import { Heart, ListPlus, Share2, X, Plus, CheckCircle } from 'lucide-react'
import { usePlayerStore, useLibraryStore } from '@/lib/store'
import { usePlaylists } from '@/hooks/usePlaylists'
import { useAuth } from '@/hooks/useAuth'
import { Track } from '@/types'
import Image from 'next/image'
import { toast } from '@/components/ui/Toast'

interface Props {
  track: Track | null
  onClose: () => void
}

export function TrackOptionsSheet({ track, onClose }: Props) {
  const { addToQueue } = usePlayerStore()
  const { like, unlike, isLiked } = useLibraryStore()
  const { playlists, fetchPlaylists, addTrackToPlaylist } = usePlaylists()
  const { user } = useAuth()
  const [showPlaylists, setShowPlaylists] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    if (track) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [track])

  useEffect(() => {
    if (user && showPlaylists) fetchPlaylists()
  }, [showPlaylists, user])

  if (!track) return null
  const liked = isLiked(track.id)

  return (
    <div className="fixed inset-0 z-[200] flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={ref}
        className="relative w-full glass rounded-t-3xl animate-slide-up overflow-hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-apple-border">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-apple-surface2">
            {track.thumbnail ? (
              <Image src={track.thumbnail} alt={track.title} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center">🎵</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{track.title}</p>
            <p className="text-xs text-apple-text-secondary truncate">{track.artist}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-apple-surface2 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        {!showPlaylists ? (
          <div className="px-2 py-2">
            <button
              onClick={() => {
                liked ? unlike(track.id) : like(track)
                toast[liked ? 'info' : 'success'](liked ? 'Removed from Liked Songs' : 'Added to Liked Songs')
                onClose()
              }}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-apple-surface transition-colors"
            >
              <Heart size={20} className={liked ? 'text-apple-red fill-apple-red' : 'text-white'} />
              <span className={`text-sm font-medium ${liked ? 'text-apple-red' : 'text-white'}`}>
                {liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
              </span>
            </button>
            <button
              onClick={() => { addToQueue(track); toast.success('Added to queue'); onClose() }}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-apple-surface transition-colors"
            >
              <ListPlus size={20} className="text-white" />
              <span className="text-sm font-medium text-white">Add to Queue</span>
            </button>
            {user && (
              <button
                onClick={() => setShowPlaylists(true)}
                className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-apple-surface transition-colors"
              >
                <Plus size={20} className="text-white" />
                <span className="text-sm font-medium text-white">Add to Playlist</span>
              </button>
            )}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: track.title, text: `${track.title} by ${track.artist}`, url: `https://music.youtube.com/watch?v=${track.videoId}` })
                } else {
                  navigator.clipboard?.writeText(`https://music.youtube.com/watch?v=${track.videoId}`)
                  toast.info('Link copied!')
                }
                onClose()
              }}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-apple-surface transition-colors"
            >
              <Share2 size={20} className="text-white" />
              <span className="text-sm font-medium text-white">Share</span>
            </button>
          </div>
        ) : (
          <div className="px-2 py-2">
            <div className="flex items-center gap-2 px-4 py-2 mb-1">
              <button onClick={() => setShowPlaylists(false)} className="text-apple-red text-sm font-medium">Back</button>
              <span className="text-sm font-semibold flex-1 text-center pr-8">Add to Playlist</span>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {playlists.length === 0 ? (
                <p className="text-center text-apple-text-secondary text-sm py-6">No playlists yet.</p>
              ) : (
                playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={async () => {
                      await addTrackToPlaylist(pl.id, track)
                      toast.success(`Added to "${pl.name}"`)
                      onClose()
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-apple-surface transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-apple-surface2 flex items-center justify-center shrink-0 text-sm">🎵</div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pl.name}</p>
                      <p className="text-xs text-apple-text-secondary">{(pl.tracks || []).length} songs</p>
                    </div>
                    {(pl.tracks || []).some((t: Track) => t.id === track.id) && (
                      <CheckCircle size={16} className="text-apple-red shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
