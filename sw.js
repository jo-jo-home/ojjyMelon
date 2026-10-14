/* ojjyMelon service worker — cache-first for static assets, never cache API calls. */
const VERSION = 'ojjymelon-v1';
const CORE = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/api.js',
  './js/ui.js',
  './js/grades.js',
  './js/districts.js',
  './manifest.json',
  './favicon.svg',
  './assets/img/logo.svg',
  './assets/img/hero.svg',
  './assets/img/default-avatar.svg',
  './assets/img/guest-avatar.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Never intercept API or cross-origin traffic (proxies, fonts, CDN)
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: url.pathname.endsWith('/') }).then((cached) => {
      const fetched = fetch(e.request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
