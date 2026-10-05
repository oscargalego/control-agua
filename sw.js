/* Control Agua — service worker: funciona sin conexión y avisos periódicos (experimental) */
const CACHE = 'control-agua-v1.0.0';
const SHELL = ['./', './index.html', './app.js', './data.js', './illus.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('control-agua-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // red primero para tener siempre la última versión; caché si no hay conexión
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});

const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
async function check() {
  const c = await caches.open('ca-state');
  const r = await c.match('./__state.json'); if (!r) return;
  const st = await r.json(); if (!st.on) return;
  const t = today(), last = await c.match('./__notified.txt').then(x => x ? x.text() : '');
  if (last === t) return;
  const due = st.filters.filter(f => f.warnAt <= t);
  if (!due.length) return;
  const body = due.map(f => f.due <= t ? `${f.f}: caducado (${f.due})` : `${f.f}: vence el ${f.due}`).join(' · ');
  await self.registration.showNotification('Toca cambiar filtro de ósmosis', { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: 'filtros' });
  await c.put('./__notified.txt', new Response(t));
}
self.addEventListener('periodicsync', e => { if (e.tag === 'check-filters') e.waitUntil(check()); });
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs[0] ? cs[0].focus() : self.clients.openWindow('./#filtros')));
});
