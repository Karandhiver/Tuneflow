'use client'
import { useState } from 'react'
import { PodcastCard } from '@/components/podcast/PodcastCard'
import { INDIAN_PODCASTERS } from '@/types'

const CATEGORIES = ['All', 'Business', 'Education', 'Finance', 'Startups', 'Lifestyle', 'Entrepreneurship']

export default function PodcastsPage() {
  const [selected, setSelected] = useState('All')

  const filtered =
    selected === 'All'
      ? INDIAN_PODCASTERS
      : INDIAN_PODCASTERS.filter((p) => p.category === selected)

  return (
    <div className="page-enter min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 md:pt-10 pb-4">
        <h1 className="text-2xl font-bold mb-4">Podcasts</h1>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelected(c)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selected === c
                  ? 'bg-apple-red text-white'
                  : 'bg-apple-surface text-apple-text-secondary hover:bg-apple-surface2'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-5 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <PodcastCard key={p.id} podcast={p} size="lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
