/* Service worker: la app funciona sin conexión. Cambia CACHE al publicar cambios de archivos. */
const CACHE = 'titan-workout-v31';
const ASSETS = ['./', './index.html', './styles.css', './manifest.webmanifest', './icon.svg',
  './js/catalog.js', './js/nombres.js', './js/anim.js', './js/ejercicios2.js', './js/ejercicios3.js', './js/ejercicios4.js', './js/cuerpo3d.js', './js/figura.js', './js/db.js', './js/logic.js', './js/app.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ASSETS.map((u) => fetch(new Request(u, { cache: 'reload' })).then((r) => { if (r.ok) return c.put(u, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* Con conexión siempre trae la versión más reciente; sin conexión usa la copia guardada. */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request.url, { cache: 'no-cache' }).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request.url, copy)); }
    return res;
  }).catch(() => caches.match(e.request.url).then((hit) => hit || caches.match('./index.html'))));
});
