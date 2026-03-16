'use client'
import { useRef, useCallback } from 'react'

interface SwipeOptions {
  onSwipeDown?: () => void
  onSwipeUp?: () => void
  threshold?: number
}

export function useSwipeGesture({ onSwipeDown, onSwipeUp, threshold = 80 }: SwipeOptions) {
  const startY = useRef<number>(0)
  const startX = useRef<number>(0)
  const isDragging = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    startX.current = e.touches[0].clientX
    isDragging.current = true
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return
      isDragging.current = false

      const deltaY = e.changedTouches[0].clientY - startY.current
      const deltaX = Math.abs(e.changedTouches[0].clientX - startX.current)

      // Only trigger if mostly vertical swipe
      if (deltaX > 60) return

      if (deltaY > threshold && onSwipeDown) onSwipeDown()
      if (deltaY < -threshold && onSwipeUp) onSwipeUp()
    },
    [onSwipeDown, onSwipeUp, threshold]
  )

  return { onTouchStart, onTouchEnd }
}
