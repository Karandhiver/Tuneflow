'use client'
import { useEffect, useRef } from 'react'
import { usePlayerStore, useLibraryStore, useSpeedStore } from '@/lib/store'

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasSyncedRef = useRef<string | null>(null)

  const {
    currentTrack,
    isPlaying,
    volume,
    streamUrl,
    setStreamUrl,
    setProgress,
    setDuration,
    setLoading,
    next,
    repeatMode,
  } = usePlayerStore()

  const { addToHistory } = useLibraryStore()
  const { speed } = useSpeedStore()

  // Fetch stream URL when track changes
  useEffect(() => {
    if (!currentTrack) return
    const videoId = (currentTrack as any).videoId
    if (!videoId) return
    setLoading(true)
    fetch(`/api/stream?videoId=${videoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) setStreamUrl(data.url)
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentTrack?.id])

  // Load new stream + autoplay
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !streamUrl) return
    audio.src = streamUrl
    audio.volume = volume
    audio.playbackRate = speed
    if (isPlaying) audio.play().catch(console.error)
  }, [streamUrl])

  // Play / pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !streamUrl) return
    if (isPlaying) audio.play().catch(console.error)
    else audio.pause()
  }, [isPlaying])

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Playback speed
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  // Media Session API — lock screen & headphone controls
  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return
    const t = currentTrack as any
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title || 'Unknown',
      artist: t.artist || '',
      album: t.album || '',
      artwork: t.thumbnail
        ? [{ src: t.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    })
    navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().resume())
    navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().pause())
    navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().next())
    navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().prev())
    navigator.mediaSession.setActionHandler('seekto', (e) => {
      const audio = audioRef.current
      if (audio && e.seekTime != null) audio.currentTime = e.seekTime
    })
    navigator.mediaSession.setActionHandler('seekforward', (e) => {
      const audio = audioRef.current
      if (audio) audio.currentTime = Math.min(audio.duration, audio.currentTime + (e.seekOffset ?? 10))
    })
    navigator.mediaSession.setActionHandler('seekbackward', (e) => {
      const audio = audioRef.current
      if (audio) audio.currentTime = Math.max(0, audio.currentTime - (e.seekOffset ?? 10))
    })
  }, [currentTrack?.id])

  // Sync history to Supabase after 30s
  useEffect(() => {
    if (!currentTrack) return
    const t = currentTrack as any
    if (hasSyncedRef.current === t.id) return
    const timer = setTimeout(() => {
      hasSyncedRef.current = t.id
      addToHistory(currentTrack)
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: t.videoId, title: t.title, artist: t.artist, thumbnail: t.thumbnail }),
      }).catch(() => {})
    }, 30_000)
    return () => clearTimeout(timer)
  }, [currentTrack?.id])

  return (
    <audio
      ref={audioRef}
      preload="auto"
      crossOrigin="anonymous"
      onTimeUpdate={(e) => {
        const a = e.currentTarget
        setProgress(a.currentTime)
        if (a.duration && !isNaN(a.duration)) setDuration(a.duration)
        // Update media session position state
        if ('mediaSession' in navigator && a.duration) {
          try {
            navigator.mediaSession.setPositionState({
              duration: a.duration,
              playbackRate: a.playbackRate,
              position: a.currentTime,
            })
          } catch {}
        }
      }}
      onLoadedMetadata={(e) => {
        const d = e.currentTarget.duration
        if (d && !isNaN(d)) setDuration(d)
        // Apply speed after load
        e.currentTarget.playbackRate = speed
      }}
      onEnded={() => {
        if (repeatMode === 'one') {
          if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(console.error)
          }
        } else {
          next()
        }
      }}
      onWaiting={() => setLoading(true)}
      onCanPlay={() => setLoading(false)}
      onError={() => setLoading(false)}
    />
  )
}
