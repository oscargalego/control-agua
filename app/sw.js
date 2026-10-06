/* Osmosis Control — service worker: funciona sin conexión (red primero, caché si no hay red) */
const CACHE = 'osmosis-control-2.0.0-dev';
const SHELL = ['./', './index.html', './css/app.css', './css/oc.css', './js/config.js', './js/app.js', './data/datos.js',
  './ill/illus-base.js', './ill/frontal-g3p600.js', './ill/escenas-g3p600.js', './ill/escenas-gen5.js', './ill/escenas-frizzlife.js',
  './ill/escenas-g5p500.js', './ill/escenas-jimmy.js', './ill/escenas-k19.js', './ill/escenas-ropot.js', './ill/luces.js',
  './app.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(ks => Promise.all(ks.filter(k => k.startsWith('osmosis-control-') && k !== CACHE).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
