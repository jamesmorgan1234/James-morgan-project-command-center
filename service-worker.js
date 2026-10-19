const CACHE='james-command-center-v18';
const STATIC=['./','./index.html','./styles.css?v=7','./project-hub.css?v=1','./app.js?v=8','./project-hub.js?v=2','./books-hub.css?v=1','./books-hub.js?v=1','./next-up-label.js?v=1','./operating-order-exclusion.js?v=1','./performance-hub.css?v=2','./performance-hub.js?v=2','./refresh-orchestrator.css?v=1','./refresh-orchestrator.js?v=2','./app-config.js','./manifest.webmanifest','./command-center-icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.hostname.includes('supabase.co')||url.pathname.endsWith('/app-config.js')||e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();if(url.origin===self.location.origin)caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request).then(x=>x||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();if(url.origin===self.location.origin)caches.open(CACHE).then(c=>c.put(e.request,copy));return r;})));
});
