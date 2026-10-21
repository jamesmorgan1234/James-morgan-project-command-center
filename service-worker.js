const CACHE='james-command-center-v55';
const STATIC=[
  './','./index.html','./styles.css?v=7','./project-hub.css?v=2','./app.js?v=10','./project-hub.js?v=3',
  './mobile-accordion-polish.css?v=1','./mobile-accordion-polish.js?v=1','./books-hub.css?v=1','./books-hub.js?v=1',
  './books-revenue.css?v=4','./books-revenue.js?v=5','./ux-polish.css?v=1','./books-portfolio-polish.js?v=1',
  './next-up-label.js?v=1','./operating-order-exclusion.js?v=2','./performance-hub.css?v=2','./performance-hub.js?v=5',
  './refresh-orchestrator.css?v=1','./refresh-orchestrator.js?v=6','./source-health.css?v=1','./source-health.js?v=2',
  './command-center-v4.css?v=1','./command-center-v4.js?v=1','./command-center-v6.css?v=1','./command-center-v6.js?v=1',
  './command-center-v6-2.css?v=1','./command-center-v6-2.js?v=1','./command-center-v6-art.css?v=1',
  './command-center-book-covers.css?v=2','./command-center-book-covers.js?v=2','./book-cover-atlas-v2.webp?v=2',
  './command-center-exact-menus.css?v=1','./command-center-exact-menus.js?v=1','./command-center-earnings.css?v=1','./command-center-earnings.js?v=2','./command-center-brain-home.css?v=3','./command-center-brain-home.js?v=3','./command-center-brain-memory.css?v=1','./command-center-brain-memory.js?v=1','./app-config.js?v=13',
  './manifest.webmanifest?v=9','./command-center-approved-icon-192.png?icon=9-approved-any','./command-center-approved-icon-512.png?icon=9-approved-any','./command-center-approved-icon-512.png?icon=9-approved-maskable',
  './cc6-eclipse.webp','./cc6-mountain.webp','./cc6-chart.webp','./cc6-road.webp',
  './art-brain.svg','./art-castle.svg','./art-chart.svg','./art-eclipse.svg','./art-mountain-red.svg','./art-mountain.svg','./art-network.svg','./art-road.svg'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);

  if(e.request.mode==='navigate'){
    const refresh=fetch(e.request,{cache:'no-store'}).then(r=>{
      if(r&&r.ok&&url.origin===self.location.origin){
        const copy=r.clone();
        caches.open(CACHE).then(c=>c.put('./index.html',copy)).catch(()=>{});
      }
      return r;
    }).catch(()=>null);
    e.waitUntil(refresh.then(()=>{}));
    e.respondWith(
      caches.match('./index.html').then(cached=>cached||caches.match('./').then(root=>root||refresh.then(r=>r||Response.error())))
    );
    return;
  }

  // Never substitute the app shell for API/CDN requests. Cross-origin requests
  // stay on the browser network path so a failed Supabase request cannot become
  // index.html and leak raw page markup into a sync error message.
  if(url.origin!==self.location.origin)return;

  const freshAsset=url.pathname.endsWith('/app-config.js')||url.pathname.endsWith('/project-hub.js')||url.pathname.endsWith('/mobile-accordion-polish.js')||url.pathname.endsWith('/mobile-accordion-polish.css')||url.pathname.endsWith('/command-center-v4.js')||url.pathname.endsWith('/command-center-v4.css')||url.pathname.endsWith('/command-center-v6.js')||url.pathname.endsWith('/command-center-v6.css')||url.pathname.endsWith('/command-center-v6-2.js')||url.pathname.endsWith('/command-center-v6-2.css')||url.pathname.endsWith('/command-center-v6-art.css')||url.pathname.endsWith('/command-center-book-covers.js')||url.pathname.endsWith('/command-center-book-covers.css')||url.pathname.endsWith('/command-center-exact-menus.js')||url.pathname.endsWith('/command-center-exact-menus.css')||url.pathname.endsWith('/command-center-earnings.js')||url.pathname.endsWith('/command-center-earnings.css')||url.pathname.endsWith('/command-center-brain-home.js')||url.pathname.endsWith('/command-center-brain-home.css')||url.pathname.endsWith('/command-center-brain-memory.js')||url.pathname.endsWith('/command-center-brain-memory.css')||url.pathname.endsWith('/book-cover-atlas-v2.webp')||url.pathname.endsWith('/manifest.webmanifest')||url.pathname.endsWith('/command-center-approved-icon-192.png')||url.pathname.endsWith('/command-center-approved-icon-512.png')||url.pathname.endsWith('/cc6-eclipse.webp')||url.pathname.endsWith('/cc6-mountain.webp')||url.pathname.endsWith('/cc6-chart.webp')||url.pathname.endsWith('/cc6-road.webp');
  if(freshAsset){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request).then(x=>x||Response.error())));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;})));
});
