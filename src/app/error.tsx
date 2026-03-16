'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-5 text-center">
      <div className="text-5xl mb-2">⚠️</div>
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-apple-text-secondary text-sm max-w-xs">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-full bg-apple-red text-white text-sm font-semibold"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full bg-apple-surface text-white text-sm font-semibold"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
