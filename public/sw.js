// Restart PWA Service Worker v2
// Strategies: Network-first (navigation), Stale-while-revalidate (static), Cache-first (images)

const CACHE_VERSION = 'v2'
const CACHE_NAME = `restart-${CACHE_VERSION}`
const STATIC_CACHE = `restart-static-${CACHE_VERSION}`
const IMAGE_CACHE = `restart-images-${CACHE_VERSION}`

// Max cached items per cache to prevent unbounded growth
const MAX_STATIC_ENTRIES = 100
const MAX_IMAGE_ENTRIES = 50

// Critical assets to pre-cache
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.svg',
]

// ─── Install ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => { /* Silently fail pre-cache — app still works without it */ })
  )
  self.skipWaiting()
})

// ─── Activate: clean old caches ───
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, IMAGE_CACHE]
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !currentCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ─── Helpers ───

/** Trim a cache to max entries (FIFO) */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > maxEntries) {
    await Promise.all(
      keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key))
    )
  }
}

/** Network-first with cache fallback */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || caches.match('/')
  }
}

/** Stale-while-revalidate: return cache immediately, update in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  // Always fire a fetch to update cache in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
        trimCache(cacheName, MAX_STATIC_ENTRIES)
      }
      return response
    })
    .catch(() => null)

  // Return cached version immediately if available
  return cached || fetchPromise
}

/** Cache-first for images (they rarely change) */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
      trimCache(cacheName, MAX_IMAGE_ENTRIES)
    }
    return response
  } catch {
    // Return a transparent 1x1 pixel for failed image requests
    return new Response(
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      { headers: { 'Content-Type': 'image/gif' }, status: 200 }
    )
  }
}

// ─── Fetch handler ───
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET
  if (request.method !== 'GET') return

  // Skip API, external origins, chrome-extension, etc.
  if (
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin ||
    url.protocol === 'chrome-extension:'
  ) return

  // Navigation: network-first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE_NAME))
    return
  }

  // Images: cache-first (Unsplash images won't change)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|webp|gif|avif)$/) ||
    url.pathname.startsWith('/images/')
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }

  // Hashed static assets (JS/CSS with content hash): cache-first (immutable)
  if (
    url.pathname.startsWith('/assets/') &&
    url.pathname.match(/\.[a-f0-9]{8,}\.(js|css)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Other static (SVG, icons, manifest, non-hashed): stale-while-revalidate
  if (
    url.pathname.match(/\.(js|css|svg|woff2?|ttf|eot|json)$/) ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
    return
  }

  // Default: network-first
  event.respondWith(networkFirst(request, CACHE_NAME))
})

// ─── Message handler for cache control ───
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data === 'CLEAR_CACHES') {
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  }
})
