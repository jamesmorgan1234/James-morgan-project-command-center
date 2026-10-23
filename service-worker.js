const CACHE='command-center-v7-root-9';
const CORE=[
  './',
  './index.html',
  './manifest.webmanifest?v=11',
  './authoritative-v7/theme.css?v=4',
  './authoritative-v7/layout.css?v=4',
  './authoritative-v7/artwork.css?v=4',
  './authoritative-v7/refinement.css?v=1',
  './authoritative-v7/home-books-refinement.css?v=1',
  './authoritative-v7/book-ui-fixes.css?v=1',
  './authoritative-v7/interaction-feedback.js?v=1',
  './authoritative-v7/app.js?v=4',
  './authoritative-v7/refinement.js?v=1',
  './authoritative-v7/publication-truth.js',
  './authoritative-v7/agent-execution.js',
  './authoritative-v7/book-ui-fixes.js?v=1',
  './authoritative-v7/home-books-refinement.js?v=2',
  './authoritative-v7/phone-layout-cover-fix.js?v=1',
  './authoritative-v7/startup-recovery.js?v=1',
  './authoritative-v7/supabase-loader.js?v=1',
  './authoritative-v7/data.js',
  './authoritative-v7/config.js',
  './authoritative-v7/control-modules.js',
  './authoritative-v7/overview-screens.js',
  './authoritative-v7/root-pwa.js?v=1',
  './authoritative-v7/offline.html',
  './authoritative-v7/assets/landscape-eclipse.svg',
  './authoritative-v7/assets/neural-globe.svg',
  './authoritative-v7/assets/analytics-grid.svg',
  './authoritative-v7/assets/road-mountains.svg',
  './authoritative-v7/assets/network-globe.svg',
  './authoritative-v7/assets/header-planet.svg',
  './authoritative-v7/assets/time-portal.svg',
  './authoritative-v7/assets/server-racks.svg',
  './authoritative-v7/assets/merch-cases.svg',
  './authoritative-v7/assets/city-spires.svg',
  './authoritative-v7/assets/mobile-horizon.svg',
  './authoritative-v7/assets/book-cover-atlas-v2.webp',
  './command-center-approved-icon-192.png?cc7-root=2',
  './command-center-approved-icon-512.png?cc7-root=2',
  './command-center-approved-icon-512.png?cc7-root=2-maskable'
];

function isOldCommandCenterCache(key){
  return key!==CACHE&&(
    key.startsWith('james-command-center-')||
    key.startsWith('command-center-v7-clean-')||
    key.startsWith('command-center-v7-root-')
  );
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(isOldCommandCenterCache).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response?.ok){
          const cache=await caches.open(CACHE);
          cache.put('./index.html',response.clone()).catch(()=>{});
        }
        return response;
      }catch{
        return (await caches.match('./authoritative-v7/offline.html'))||Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response?.ok){
        const path=url.pathname;
        const cacheable=path.includes('/authoritative-v7/')||
          path.endsWith('/manifest.webmanifest')||
          path.endsWith('/command-center-approved-icon-192.png')||
          path.endsWith('/command-center-approved-icon-512.png');
        if(cacheable){
          const cache=await caches.open(CACHE);
          cache.put(request,response.clone()).catch(()=>{});
        }
      }
      return response;
    }catch{
      return cached||Response.error();
    }
  })());
});
