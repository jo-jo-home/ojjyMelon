/* ojjyMelon service worker
   Strategy: network-first for code (js/, css/) so deploys go live immediately,
   cache-first for static assets. API/cross-origin traffic is never intercepted. */
const VERSION = 'ojjymelon-v3';
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
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.allSettled(CORE.map((u) => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isCode = (url) => url.pathname.includes('/js/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('index.html');

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   // never touch API/proxies/CDN
  if (url.pathname.includes('/api/')) return;
  if (e.request.method !== 'GET') return;

  // Network-first for code; cache-first for everything else.
  const strategy = isCode(url) ? 'network-first' : 'cache-first';
  e.respondWith((async () => {
    const cached = await caches.match(e.request, { ignoreSearch: url.pathname.endsWith('/') });
    if (strategy === 'cache-first' && cached) {
      // refresh in the background
      fetch(e.request).then((res) => { if (res && res.ok) caches.open(VERSION).then((c) => c.put(e.request, res)); }).catch(() => {});
      return cached;
    }
    try {
      const res = await fetch(e.request);
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    } catch (err) {
      if (cached) return cached;
      throw err;
    }
  })());
});
