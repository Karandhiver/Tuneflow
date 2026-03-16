const CACHE = 'wave-v1'
const OFFLINE_URL = '/offline.html'
const PRECACHE = ['/', '/offline.html', '/manifest.json', '/icon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Skip non-GET, API calls, audio streams, and cross-origin
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname !== self.location.hostname
  ) return

  // Navigation: network-first → cache → offline fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(request, res.clone()))
          return res
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    )
    return
  }

  // Static assets: cache-first → network
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()))
        return res
      }).catch(() => new Response('', { status: 408 }))
    })
  )
})
