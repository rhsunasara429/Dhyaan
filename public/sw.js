/* Dhyaan offline app shell.
 *
 * Intentionally small: no framework, no external requests.
 * - Navigations: network-first, cached fallback (fresh HTML when online,
 *   launchable shell when offline).
 * - Same-origin GET assets: stale-while-revalidate.
 * - Everything else (non-GET, cross-origin): untouched.
 *
 * Standard lifecycle: no skipWaiting()/clients.claim(). A new worker
 * activates on the next launch, so an open page is never swapped
 * mid-session. Task data lives in localStorage and is unaffected.
 */

const CACHE = 'dhyaan-shell-v1'
const NAVIGATION_FALLBACKS = ['/index.html', '/']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(NAVIGATION_FALLBACKS)),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('dhyaan-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  )
})

function navigationFallback() {
  return caches.match('/index.html').then((cached) => cached ?? caches.match('/'))
}

function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const network = fetch(request).then((response) => {
      if (response && response.ok) {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copy))
      }
      return response
    })
    return cached ?? network
  })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put('/index.html', copy))
          }
          return response
        })
        .catch(() => navigationFallback()),
    )
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})
