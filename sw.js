// Service worker: deixa o app abrir offline.
// Ao mudar qualquer arquivo, suba o número da versão.
const VERSION = 'mge-v1';
const FILES = [
  './', './index.html', './css/styles.css', './manifest.webmanifest',
  './js/app.js', './js/data.js', './js/store.js', './js/planner.js',
  './js/hydration.js', './js/mascot.js', './js/achievements.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// rede primeiro (pra pegar atualizações), cache se estiver offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
  );
});
