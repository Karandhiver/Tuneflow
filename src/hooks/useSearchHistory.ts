'use client'
import { useState, useEffect } from 'react'

const KEY = 'wave_search_history'
const MAX = 10

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
  }, [])

  const addSearch = (query: string) => {
    if (!query.trim()) return
    setHistory((prev) => {
      const updated = [query, ...prev.filter((q) => q !== query)].slice(0, MAX)
      try { localStorage.setItem(KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  const removeSearch = (query: string) => {
    setHistory((prev) => {
      const updated = prev.filter((q) => q !== query)
      try { localStorage.setItem(KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  const clearHistory = () => {
    setHistory([])
    try { localStorage.removeItem(KEY) } catch {}
  }

  return { history, addSearch, removeSearch, clearHistory }
}
