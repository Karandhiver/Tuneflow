'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLibraryStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { usePlaylists } from '@/hooks/usePlaylists'
import { TrackRow } from '@/components/music/TrackRow'
import { Heart, History, ListMusic, Plus, LogIn, ChevronRight } from 'lucide-react'
import { Track } from '@/types'

const TABS = ['Liked Songs', 'Recently Played', 'Playlists'] as const
type Tab = typeof TABS[number]

export default function LibraryPage() {
  const { likedSongs, recentlyPlayed } = useLibraryStore()
  const { user, signInWithGoogle } = useAuth()
  const { playlists, loading: playlistsLoading, fetchPlaylists, createPlaylist } = usePlaylists()
  const [tab, setTab] = useState<Tab>('Liked Songs')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (user && tab === 'Playlists') fetchPlaylists()
  }, [user, tab])

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createPlaylist(newName.trim())
    setNewName('')
    setCreating(false)
  }

  const trackList: Track[] =
    tab === 'Liked Songs'
      ? likedSongs
      : tab === 'Recently Played'
      ? (recentlyPlayed as Track[])
      : []

  return (
    <div className="page-enter min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 md:pt-10 pb-4">
        <h1 className="text-2xl font-bold mb-4">Library</h1>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-apple-red text-white'
                  : 'bg-apple-surface text-apple-text-secondary hover:bg-apple-surface2'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Liked Songs ── */}
      {tab === 'Liked Songs' && (
        <>
          <div className="mx-5 mb-5 rounded-2xl overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-[#fc3c44] to-[#a83279] flex items-end p-4">
              <div>
                <Heart size={20} fill="white" className="text-white mb-1" />
                <p className="text-lg font-bold">Liked Songs</p>
                <p className="text-xs text-white/70">{likedSongs.length} songs</p>
              </div>
            </div>
          </div>
          <div className="px-3">
            {trackList.length === 0 ? (
              <EmptyState
                icon={<Heart size={32} className="text-apple-text-secondary" />}
                title="No liked songs yet"
                body="Tap ♥ on any song to save it here"
              />
            ) : (
              trackList.map((track, i) => (
                <TrackRow key={track.id} track={track} index={i} queue={trackList} showIndex />
              ))
            )}
          </div>
        </>
      )}

      {/* ── Recently Played ── */}
      {tab === 'Recently Played' && (
        <div className="px-3">
          {trackList.length === 0 ? (
            <EmptyState
              icon={<History size={32} className="text-apple-text-secondary" />}
              title="No recent plays"
              body="Songs you play will appear here"
            />
          ) : (
            trackList.map((track, i) => (
              <TrackRow key={`${track.id}-${i}`} track={track} index={i} queue={trackList} showIndex />
            ))
          )}
        </div>
      )}

      {/* ── Playlists ── */}
      {tab === 'Playlists' && (
        <div className="px-5">
          {!user ? (
            <EmptyState
              icon={<LogIn size={32} className="text-apple-text-secondary" />}
              title="Sign in for Playlists"
              body="Create and sync playlists across all your devices"
              action={
                <button
                  onClick={signInWithGoogle}
                  className="px-6 py-3 rounded-full bg-apple-red text-white font-semibold text-sm mt-4"
                >
                  Sign in with Google
                </button>
              }
            />
          ) : (
            <>
              {/* Create input */}
              {creating ? (
                <div className="flex gap-2 mb-4">
                  <input
                    autoFocus
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="Playlist name…"
                    className="flex-1 bg-apple-surface rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                  <button
                    onClick={handleCreate}
                    className="px-4 py-2.5 rounded-xl bg-apple-red text-white text-sm font-semibold"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setCreating(false); setNewName('') }}
                    className="px-4 py-2.5 rounded-xl bg-apple-surface text-apple-text-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-2 w-full p-3.5 rounded-xl bg-apple-surface mb-4 text-sm font-semibold text-apple-red hover:bg-apple-surface2 transition-colors"
                >
                  <Plus size={18} />
                  New Playlist
                </button>
              )}

              {/* List */}
              {playlistsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-12 h-12 skeleton rounded-xl shrink-0" />
                      <div className="flex-1">
                        <div className="h-3.5 skeleton rounded mb-2 w-1/2" />
                        <div className="h-2.5 skeleton rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : playlists.length === 0 ? (
                <EmptyState
                  icon={<ListMusic size={32} className="text-apple-text-secondary" />}
                  title="No playlists yet"
                  body='Tap "New Playlist" to get started'
                />
              ) : (
                playlists.map((pl) => (
                  <Link
                    key={pl.id}
                    href={`/library/playlist/${pl.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-apple-surface transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-apple-surface2 to-apple-surface3 flex items-center justify-center shrink-0">
                      <ListMusic size={20} className="text-apple-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{pl.name}</p>
                      <p className="text-xs text-apple-text-secondary mt-0.5">
                        {pl.tracks.length} {pl.tracks.length === 1 ? 'song' : 'songs'}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-apple-text-secondary shrink-0" />
                  </Link>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({
  icon, title, body, action
}: {
  icon: React.ReactNode
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <div className="w-20 h-20 rounded-full bg-apple-surface flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="font-semibold text-lg mb-2">{title}</p>
      <p className="text-sm text-apple-text-secondary leading-relaxed">{body}</p>
      {action}
    </div>
  )
}
