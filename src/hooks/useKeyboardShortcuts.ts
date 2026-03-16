'use client'
import { useEffect } from 'react'
import { usePlayerStore } from '@/lib/store'

export function useKeyboardShortcuts() {
  const {
    togglePlay,
    next,
    prev,
    setVolume,
    volume,
    isShuffle,
    toggleShuffle,
    cycleRepeat,
  } = usePlayerStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); next() }
          break
        case 'ArrowLeft':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); prev() }
          break
        case 'ArrowUp':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            setVolume(Math.min(1, volume + 0.1))
          }
          break
        case 'ArrowDown':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            setVolume(Math.max(0, volume - 0.1))
          }
          break
        case 'KeyS':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); toggleShuffle() }
          break
        case 'KeyR':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); cycleRepeat() }
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, next, prev, setVolume, volume, toggleShuffle, cycleRepeat])
}
