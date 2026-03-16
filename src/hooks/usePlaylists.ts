'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Track, Playlist } from '@/types'

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchPlaylists = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error && data) {
        setPlaylists(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description ?? undefined,
            thumbnail: p.thumbnail ?? undefined,
            tracks: (p.tracks as Track[]) ?? [],
            userId: p.user_id,
            createdAt: p.created_at,
          }))
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const createPlaylist = async (name: string, description?: string): Promise<Playlist | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('playlists')
      .insert({ name, description, user_id: user.id, tracks: [] })
      .select()
      .single()
    if (error || !data) return null
    const pl: Playlist = {
      id: data.id,
      name: data.name,
      description: data.description ?? undefined,
      tracks: [],
      userId: data.user_id,
      createdAt: data.created_at,
    }
    setPlaylists((prev) => [pl, ...prev])
    return pl
  }

  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist) return
    const already = playlist.tracks.some((t) => t.id === track.id)
    if (already) return
    const tracks: Track[] = [...playlist.tracks, track]
    const { error } = await supabase
      .from('playlists')
      .update({ tracks, updated_at: new Date().toISOString() })
      .eq('id', playlistId)
    if (!error) {
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, tracks } : p))
      )
    }
  }

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist) return
    const tracks = playlist.tracks.filter((t) => t.id !== trackId)
    await supabase
      .from('playlists')
      .update({ tracks, updated_at: new Date().toISOString() })
      .eq('id', playlistId)
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, tracks } : p))
    )
  }

  const deletePlaylist = async (playlistId: string) => {
    await supabase.from('playlists').delete().eq('id', playlistId)
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId))
  }

  const renamePlaylist = async (playlistId: string, name: string) => {
    const { error } = await supabase
      .from('playlists')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', playlistId)
    if (!error) {
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, name } : p))
      )
    }
  }

  return {
    playlists,
    loading,
    fetchPlaylists,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    deletePlaylist,
    renamePlaylist,
  }
}
