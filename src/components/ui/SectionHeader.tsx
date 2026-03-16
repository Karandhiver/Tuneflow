import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Props {
  title: string
  href?: string
}

export function SectionHeader({ title, href }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-apple-red text-sm font-medium">
          See All <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}
