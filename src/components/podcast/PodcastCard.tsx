'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Podcast } from '@/types'

// Unique gradient per category so each card looks distinct
const CATEGORY_GRADIENTS: Record<string, string> = {
  Business: 'from-blue-600/80 to-blue-900/80',
  Education: 'from-green-600/80 to-emerald-900/80',
  Finance: 'from-yellow-500/80 to-orange-800/80',
  Startups: 'from-purple-600/80 to-purple-900/80',
  Lifestyle: 'from-pink-500/80 to-rose-800/80',
  Entrepreneurship: 'from-orange-500/80 to-red-800/80',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Business: '💼',
  Education: '📚',
  Finance: '💰',
  Startups: '🚀',
  Lifestyle: '✨',
  Entrepreneurship: '⚡',
}

interface Props {
  podcast: Podcast
  size?: 'sm' | 'lg'
}

export function PodcastCard({ podcast, size = 'sm' }: Props) {
  const dim = size === 'lg' ? 'w-40 h-40' : 'w-28 h-28'
  const cardW = size === 'lg' ? 'w-40' : 'w-28'
  const gradient = CATEGORY_GRADIENTS[podcast.category] || 'from-apple-surface2 to-apple-surface3'
  const emoji = CATEGORY_EMOJIS[podcast.category] || '🎙️'

  return (
    <Link
      href={`/podcasts/${podcast.id}`}
      className={`cursor-pointer shrink-0 ${cardW} group`}
    >
      <div
        className={`relative ${dim} rounded-2xl overflow-hidden shadow-lg mb-2 bg-apple-surface2 transition-transform duration-200 group-active:scale-95`}
      >
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
          <span className={size === 'lg' ? 'text-5xl' : 'text-4xl'}>{emoji}</span>
          <span className="text-white/70 text-[10px] font-semibold uppercase tracking-wider px-2 text-center">
            {podcast.category}
          </span>
        </div>
      </div>
      <p className={`font-semibold truncate ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
        {podcast.name}
      </p>
      <p className="text-xs text-apple-text-secondary truncate mt-0.5">{podcast.host}</p>
    </Link>
  )
}
