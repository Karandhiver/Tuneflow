import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-5 text-center">
      <div className="text-6xl mb-2">🎵</div>
      <h2 className="text-2xl font-bold">Page Not Found</h2>
      <p className="text-apple-text-secondary text-sm">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-2 px-6 py-3 rounded-full bg-apple-red text-white text-sm font-semibold"
      >
        Back to Home
      </Link>
    </div>
  )
}
