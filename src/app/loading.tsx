export default function Loading() {
  return (
    <div className="min-h-screen px-5 pt-14 md:pt-10">
      {/* Header skeleton */}
      <div className="pb-6">
        <div className="h-3 skeleton rounded w-24 mb-2" />
        <div className="h-8 skeleton rounded w-40" />
      </div>

      {/* Trending section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 skeleton rounded w-40" />
          <div className="h-4 skeleton rounded w-14" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shrink-0 w-36">
              <div className="w-36 h-36 rounded-xl skeleton mb-2" />
              <div className="h-3 rounded skeleton mb-1.5 w-28" />
              <div className="h-2.5 rounded skeleton w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Podcasts section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 skeleton rounded w-36" />
          <div className="h-4 skeleton rounded w-14" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-44">
              <div className="w-44 h-44 rounded-2xl skeleton mb-2" />
              <div className="h-3 rounded skeleton mb-1 w-32" />
              <div className="h-2.5 rounded skeleton w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Grid section */}
      <div>
        <div className="h-5 skeleton rounded w-44 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl skeleton" />
          ))}
        </div>
      </div>
    </div>
  )
}
