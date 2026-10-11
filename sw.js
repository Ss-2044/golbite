/* GolBite — offline cache so the demo keeps working without a connection. */
const CACHE = 'golbite-v1';
const FILES = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'assets/logo.png', 'assets/logo-light.png', 'assets/icon-192.png',
  'js/data.js', 'js/store.js', 'js/ui.js', 'js/engine.js', 'js/map.js', 'js/views/fan.js', 'js/views/ordering.js', 'js/views/play.js',
  'js/views/shop.js', 'js/views/profile.js', 'js/views/ops.js', 'js/views/partner.js', 'js/app.js'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); return r; }).catch(() => caches.match(e.request)));
});
