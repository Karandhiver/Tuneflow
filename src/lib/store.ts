'use client'
import { create } from 'zustand'
import { Track, PodcastEpisode } from '@/types'

type MediaItem = Track | PodcastEpisode

interface PlayerStore {
  currentTrack: MediaItem | null
  isPlaying: boolean
  volume: number
  progress: number
  duration: number
  queue: MediaItem[]
  queueIndex: number
  isShuffle: boolean
  repeatMode: 'off' | 'one' | 'all'
  isExpanded: boolean
  streamUrl: string | null
  isLoading: boolean

  // Actions
  play: (track: MediaItem, queue?: MediaItem[]) => void
  pause: () => void
  resume: () => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  setVolume: (v: number) => void
  setProgress: (p: number) => void
  setDuration: (d: number) => void
  setExpanded: (e: boolean) => void
  setStreamUrl: (url: string | null) => void
  setLoading: (l: boolean) => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  addToQueue: (track: MediaItem) => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  queue: [],
  queueIndex: 0,
  isShuffle: false,
  repeatMode: 'off',
  isExpanded: false,
  streamUrl: null,
  isLoading: false,

  play: (track, queue) => {
    const newQueue = queue || [track]
    const idx = newQueue.findIndex((t) => t.id === track.id)
    set({
      currentTrack: track,
      isPlaying: true,
      queue: newQueue,
      queueIndex: idx >= 0 ? idx : 0,
      streamUrl: null,
      isLoading: true,
      progress: 0,
      duration: 0,
    })
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { queue, queueIndex, isShuffle, repeatMode } = get()
    if (!queue.length) return
    let nextIdx: number
    if (repeatMode === 'one') {
      nextIdx = queueIndex
    } else if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length)
    } else {
      nextIdx = queueIndex + 1
      if (nextIdx >= queue.length) {
        if (repeatMode === 'all') nextIdx = 0
        else return set({ isPlaying: false })
      }
    }
    set({
      currentTrack: queue[nextIdx],
      queueIndex: nextIdx,
      streamUrl: null,
      isLoading: true,
      progress: 0,
      duration: 0,
    })
  },

  prev: () => {
    const { queue, queueIndex, progress } = get()
    if (progress > 5) return set({ progress: 0 })
    if (!queue.length || queueIndex === 0) return
    const prevIdx = queueIndex - 1
    set({
      currentTrack: queue[prevIdx],
      queueIndex: prevIdx,
      streamUrl: null,
      isLoading: true,
      progress: 0,
      duration: 0,
    })
  },

  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setExpanded: (isExpanded) => set({ isExpanded }),
  setStreamUrl: (streamUrl) => set({ streamUrl, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),
  cycleRepeat: () =>
    set((s) => ({
      repeatMode: s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off',
    })),
  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
}))

// Liked songs store
interface LibraryStore {
  likedSongs: Track[]
  recentlyPlayed: MediaItem[]
  like: (track: Track) => void
  unlike: (id: string) => void
  isLiked: (id: string) => boolean
  addToHistory: (item: MediaItem) => void
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  likedSongs: [],
  recentlyPlayed: [],

  like: (track) =>
    set((s) => ({
      likedSongs: s.likedSongs.find((t) => t.id === track.id)
        ? s.likedSongs
        : [track, ...s.likedSongs],
    })),

  unlike: (id) =>
    set((s) => ({ likedSongs: s.likedSongs.filter((t) => t.id !== id) })),

  isLiked: (id) => get().likedSongs.some((t) => t.id === id),

  addToHistory: (item) =>
    set((s) => ({
      recentlyPlayed: [
        item,
        ...s.recentlyPlayed.filter((t) => t.id !== item.id),
      ].slice(0, 50),
    })),
}))


// Playback speed store (for podcasts) — SSR safe
interface SpeedStore {
  speed: number
  setSpeed: (s: number) => void
}

export const useSpeedStore = create<SpeedStore>((set) => ({
  speed: 1,
  setSpeed: (speed) => {
    set({ speed })
    // Only touch DOM on client
    if (typeof document !== 'undefined') {
      const audio = document.querySelector('audio') as HTMLAudioElement
      if (audio) audio.playbackRate = speed
    }
  },
}))
