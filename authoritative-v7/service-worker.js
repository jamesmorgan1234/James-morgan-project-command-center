const CACHE='command-center-v7-clean-7';
const CORE=[
  './index.html',
  './theme.css?v=4',
  './layout.css?v=4',
  './artwork.css?v=4',
  './app.js?v=4',
  './data.js',
  './config.js',
  './control-modules.js',
  './overview-screens.js',
  './manifest.webmanifest',
  './offline.html',
  './assets/landscape-eclipse.svg',
  './assets/neural-globe.svg',
  './assets/analytics-grid.svg',
  './assets/road-mountains.svg',
  './assets/network-globe.svg',
  './assets/header-planet.svg',
  './assets/time-portal.svg',
  './assets/server-racks.svg',
  './assets/merch-cases.svg',
  './assets/city-spires.svg',
  './assets/mobile-horizon.svg',
  '../command-center-approved-icon-192.png',
  '../command-center-approved-icon-512.png'
];

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
    await Promise.all(keys.filter(key=>key.startsWith('command-center-v7-clean-')&&key!==CACHE).map(key=>caches.delete(key)));
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
        return (await caches.match('./offline.html'))||Response.error();
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response?.ok&&url.pathname.includes('/authoritative-v7/')){
        const cache=await caches.open(CACHE);
        cache.put(request,response.clone()).catch(()=>{});
      }
      return response;
    }catch{
      return Response.error();
    }
  })());
});
