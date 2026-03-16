'use client'
import dynamic from 'next/dynamic'

const RelatedSongs = dynamic(
  () => import('@/components/music/RelatedSongs').then((m) => m.RelatedSongs),
  { ssr: false }
)

export function HomeRelatedSongs() {
  return <RelatedSongs />
}
