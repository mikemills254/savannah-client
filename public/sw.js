// DocConnect service worker: makes the app installable and keeps its shell
// available offline. API requests are never cached; they always go to the network.

const VERSION = 'v1'
const SHELL = `docconnect-shell-${VERSION}`
const ASSETS = `docconnect-assets-${VERSION}`

// Enough to open the app without a connection
const PRECACHE = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/favicon.png']

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)))
    // A new version takes over straight away; pages always fetch fresh HTML first anyway
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== SHELL && key !== ASSETS).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    )
})

self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)
    // Only this site's own GETs; the API, fonts and everything else pass straight through
    if (request.method !== 'GET' || url.origin !== self.location.origin) return

    // Pages: the network first so a new release shows at once, the cached shell when offline.
    // Every route is the same single-page app, so one cached index serves them all.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone()
                        caches.open(SHELL).then((cache) => cache.put('/', copy))
                    }
                    return response
                })
                .catch(() => caches.match('/').then((cached) => cached ?? Response.error())),
        )
        return
    }

    // Built files have a content hash in their name, so a cached copy never goes stale
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ??
                    fetch(request).then((response) => {
                        if (response.ok) {
                            const copy = response.clone()
                            caches.open(ASSETS).then((cache) => cache.put(request, copy))
                        }
                        return response
                    }),
            ),
        )
        return
    }

    // Icons, logos and the manifest: answer from the cache, refresh it in the background
    if (/\.(png|svg|ico|webmanifest|jpg|jpeg|webp|woff2?)$/.test(url.pathname)) {
        event.respondWith(
            caches.open(SHELL).then((cache) =>
                cache.match(request).then((cached) => {
                    const fresh = fetch(request)
                        .then((response) => {
                            if (response.ok) cache.put(request, response.clone())
                            return response
                        })
                        .catch(() => cached)
                    return cached ?? fresh
                }),
            ),
        )
    }
})
