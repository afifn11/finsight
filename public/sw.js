// public/sw.js
// FinSight Service Worker — PWA offline support

const CACHE_NAME = 'finsight-v1'
const STATIC_ASSETS = [
  '/',
  '/login',
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
]

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore individual failures
      })
    })
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET, API calls, and cross-origin
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin
  ) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful page navigations
        if (response.ok && request.mode === 'navigate') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        // Offline fallback
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // For navigation requests, show offline page
          if (request.mode === 'navigate') {
            return caches.match('/offline') || new Response(
              '<h1>Offline</h1><p>Buka FinSight saat online.</p>',
              { headers: { 'Content-Type': 'text/html' } }
            )
          }
        })
      })
  )
})