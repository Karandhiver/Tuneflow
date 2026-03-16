'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, X, Clock, TrendingUp } from 'lucide-react'
import { TrackRow } from '@/components/music/TrackRow'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { Track } from '@/types'

const CATEGORIES = ['Songs', 'Podcasts']

const TRENDING_SEARCHES = [
  'Arijit Singh', 'AP Dhillon', 'Diljit Dosanjh',
  'Bollywood 2025', 'Punjabi hits', 'A.R. Rahman',
  'Nikhil Kamath Podcast', 'BeerBiceps', 'Study IQ',
]

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQ = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [category, setCategory] = useState<'Songs' | 'Podcasts'>('Songs')
  const [results, setResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<NodeJS.Timeout>()
  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory()

  useEffect(() => {
    if (initialQ) doSearch(initialQ)
  }, [])

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    setFocused(false)
    try {
      const type = category === 'Podcasts' ? 'podcast' : 'music'
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`)
      const data = await res.json()
      setResults(data.results || [])
      addSearch(q)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (q: string) => {
    setQuery(q)
    doSearch(q)
    router.replace(`/search?q=${encodeURIComponent(q)}`)
  }

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.trim()) {
      timer.current = setTimeout(() => {
        doSearch(query)
        router.replace(`/search?q=${encodeURIComponent(query)}`)
      }, 600)
    } else {
      setResults([])
    }
    return () => clearTimeout(timer.current)
  }, [query, category])

  const showDropdown = focused && query === '' && (history.length > 0)

  return (
    <div className="page-enter min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl px-5 pt-14 md:pt-8 pb-3 border-b border-apple-border/50">
        <h1 className="text-2xl font-bold mb-3">Search</h1>

        {/* Search input */}
        <div className="relative">
          <div className="flex items-center bg-apple-surface rounded-xl px-3 gap-2">
            <Search size={17} className="text-apple-text-secondary shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={(e) => { if (e.key === 'Enter' && query) handleSubmit(query) }}
              placeholder="Songs, artists, podcasts..."
              className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-apple-text-secondary"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]) }}>
                <X size={17} className="text-apple-text-secondary" />
              </button>
            )}
          </div>

          {/* History dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 glass rounded-2xl overflow-hidden shadow-2xl z-30">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-apple-border">
                <span className="text-xs font-semibold text-apple-text-secondary">Recent</span>
                <button onClick={clearHistory} className="text-xs text-apple-red font-medium">Clear</button>
              </div>
              {history.map((q) => (
                <div key={q} className="flex items-center gap-3 px-4 py-3 hover:bg-apple-surface transition-colors">
                  <Clock size={15} className="text-apple-text-secondary shrink-0" />
                  <button
                    className="flex-1 text-sm text-left"
                    onClick={() => handleSubmit(q)}
                  >
                    {q}
                  </button>
                  <button onClick={() => removeSearch(q)}>
                    <X size={14} className="text-apple-text-secondary" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mt-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                category === cat ? 'bg-apple-red text-white' : 'bg-apple-surface text-apple-text-secondary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-4">
        {/* Skeleton */}
        {loading && (
          <div className="space-y-3 px-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md skeleton shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 rounded skeleton mb-1.5 w-3/4" />
                  <div className="h-2.5 rounded skeleton w-1/2" />
                </div>
                <div className="h-2.5 rounded skeleton w-10" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            <p className="text-xs text-apple-text-secondary px-2 mb-2 font-medium">
              {results.length} results
            </p>
            {results.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} queue={results} showIndex />
            ))}
          </>
        )}

        {/* Empty state with suggestions */}
        {!loading && results.length === 0 && query === '' && (
          <div className="px-2">
            <p className="text-sm font-semibold text-apple-text-secondary mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-apple-red" /> Trending
            </p>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSubmit(s)}
                  className="px-4 py-2 rounded-full bg-apple-surface text-sm font-medium hover:bg-apple-surface2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && results.length === 0 && query !== '' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-semibold text-lg">No results for &quot;{query}&quot;</p>
            <p className="text-sm text-apple-text-secondary mt-1">Try a different search term</p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center px-4">
              {TRENDING_SEARCHES.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSubmit(s)}
                  className="px-4 py-2 rounded-full bg-apple-surface text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
