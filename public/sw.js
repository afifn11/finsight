// public/sw.js
const CACHE_NAME = 'finsight-cache-v1'
const OFFLINE_URL = '/offline'

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
]

// ── Cache & Offline handlers ──────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // 1. Navigation requests (HTML pages) - Network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME)
        const cachedOffline = await cache.match(OFFLINE_URL)
        return cachedOffline || Response.error()
      })
    )
    return
  }

  // 2. Static branding assets - Cache-first with network fallback
  if (
    url.pathname.startsWith('/icon-') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname === '/favicon.ico'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((res) => {
            if (res.status === 200) {
              const copy = res.clone()
              caches.open(CACHE_NAME).then((c) => c.put(event.request, copy))
            }
            return res
          })
        )
      })
    )
    return
  }
})

// ── Push Notification handlers ─────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'FinSight', body: '' }
  try {
    data = event.data ? event.data.json() : data
  } catch {
    // payload bukan JSON, pakai default
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
