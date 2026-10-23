const CACHE_VERSION = 'command-center-root-vnext-12';
const SHELL = ['./','./index.html','./manifest.webmanifest','./rebuild-vnext/web/styles.css','./rebuild-vnext/web/app.js','./rebuild-vnext/web/ui.js','./rebuild-vnext/web/progress.js','./rebuild-vnext/web/config.js','./command-center-approved-icon-192.png','./command-center-approved-icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('command-center-root-') && key !== CACHE_VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/') || url.pathname.includes('/supabase/') || /\/(rest|auth|realtime|storage|functions)\/v\d/i.test(url.pathname)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_VERSION).then(cache => cache.put('./index.html', copy));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && ['style','script','image','font'].includes(event.request.destination)) {
      const copy = response.clone();
      caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
