const CACHE_NAME = 'la-maison-glam-offline-v1';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map(async path => {
      try {
        const request = new Request(path, { mode: path.startsWith('http') ? 'no-cors' : 'same-origin' });
        const response = await fetch(request);
        if (response && (response.ok || response.type === 'opaque')) await cache.put(request, response);
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(response => {
      if (response && (response.ok || response.type === 'opaque')) caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
      return response;
    }).catch(() => caches.match('./index.html'))));
  }
});
