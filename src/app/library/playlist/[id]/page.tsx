'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePlaylists } from '@/hooks/usePlaylists'
import { TrackRow } from '@/components/music/TrackRow'
import { usePlayerStore } from '@/lib/store'
import { ChevronLeft, Play, Shuffle, Music2, Trash2, Pencil } from 'lucide-react'
import { Track } from '@/types'
import { toast } from '@/components/ui/Toast'

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { playlists, fetchPlaylists, deletePlaylist, renamePlaylist } = usePlaylists()
  const { play, isShuffle, toggleShuffle } = usePlayerStore()
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    fetchPlaylists().then(() => setLoaded(true))
  }, [])

  const playlist = playlists.find((p) => p.id === id)

  const handlePlay = (shuffle = false) => {
    if (!playlist?.tracks?.length) return
    if (shuffle && !isShuffle) toggleShuffle()
    play(playlist.tracks[0], playlist.tracks)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${playlist?.name}"? This can't be undone.`)) return
    await deletePlaylist(id)
    toast.info('Playlist deleted')
    router.push('/library')
  }

  const handleRename = async () => {
    if (!editName.trim() || editName === playlist?.name) { setEditing(false); return }
    await renamePlaylist(id, editName.trim())
    toast.success('Playlist renamed')
    setEditing(false)
  }

  if (!loaded) {
    return (
      <div className="min-h-screen px-5 pt-14">
        <div className="h-5 skeleton rounded w-24 mb-8" />
        <div className="flex gap-4 mb-6">
          <div className="w-28 h-28 skeleton rounded-2xl shrink-0" />
          <div className="flex-1 pt-2 space-y-2">
            <div className="h-6 skeleton rounded w-3/4" />
            <div className="h-4 skeleton rounded w-1/3" />
          </div>
        </div>
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="w-6 h-4 skeleton rounded shrink-0" />
              <div className="w-10 h-10 skeleton rounded-lg shrink-0" />
              <div className="flex-1">
                <div className="h-3.5 skeleton rounded mb-1.5 w-3/4" />
                <div className="h-2.5 skeleton rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-4xl">💿</p>
        <p className="font-semibold">Playlist not found</p>
        <button onClick={() => router.push('/library')} className="text-apple-red text-sm font-medium">
          ← Back to Library
        </button>
      </div>
    )
  }

  const tracks: Track[] = playlist.tracks ?? []

  return (
    <div className="page-enter min-h-screen">
      <div className="px-5 pt-14 md:pt-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-apple-red text-sm mb-5 font-medium"
        >
          <ChevronLeft size={18} /> Library
        </button>

        {/* Hero */}
        <div className="flex gap-4 mb-6 items-end">
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-apple-red/70 to-purple-700/70 flex items-center justify-center shrink-0 shadow-2xl overflow-hidden">
            {tracks[0]?.thumbnail ? (
              <img src={tracks[0].thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <Music2 size={40} className="text-white/60" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            {editing ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false) }}
                  className="flex-1 bg-apple-surface rounded-lg px-3 py-2 text-base font-bold outline-none min-w-0"
                />
                <button onClick={handleRename} className="px-3 py-2 rounded-lg bg-apple-red text-white text-sm font-semibold shrink-0">Save</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold truncate">{playlist.name}</h1>
                <button onClick={() => { setEditName(playlist.name); setEditing(true) }} className="text-apple-text-secondary hover:text-white transition-colors shrink-0">
                  <Pencil size={16} />
                </button>
              </div>
            )}
            <p className="text-sm text-apple-text-secondary mt-1">
              {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
            </p>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs text-apple-text-secondary hover:text-apple-red transition-colors mt-2"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>

        {/* Action buttons */}
        {tracks.length > 0 && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => handlePlay(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-apple-red text-white font-semibold text-sm"
            >
              <Play size={18} fill="white" /> Play
            </button>
            <button
              onClick={() => handlePlay(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-apple-surface text-white font-semibold text-sm hover:bg-apple-surface2 transition-colors"
            >
              <Shuffle size={18} /> Shuffle
            </button>
          </div>
        )}
      </div>

      {/* Tracks */}
      <div className="px-3">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Music2 size={36} className="text-apple-text-secondary mb-3" />
            <p className="font-semibold mb-1">No songs yet</p>
            <p className="text-sm text-apple-text-secondary">
              Tap ··· on any song → Add to Playlist
            </p>
          </div>
        ) : (
          tracks.map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} queue={tracks} showIndex />
          ))
        )}
      </div>
    </div>
  )
}
