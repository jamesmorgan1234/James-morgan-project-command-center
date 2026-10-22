const CACHE='james-command-center-v71';
const PRECACHE=[
  './','./index.html','./styles.css?v=7','./project-hub.css?v=2','./mobile-accordion-polish.css?v=4','./command-center-startup-shell.css?v=1',
  './app-config.js?v=27','./startup-loader.js?v=4','./app.js?v=10','./project-hub.js?v=3','./mobile-accordion-polish.js?v=3',
  './source-health.css?v=2','./source-health.js?v=4','./command-center-agent-mode-completion.js?v=2','./command-center-book-review-guard.js?v=1','./command-center-book-review-ui.css?v=2','./command-center-book-review-ui.js?v=3',
  './command-center-approved-ui.css?v=2','./command-center-approved-ui.js?v=2','./command-center-precise-progress.js?v=2','./command-center-approved-nav.js?v=2',
  './command-center-mobile-first.css?v=1','./command-center-artwork-polish.css?v=1','./command-center-book-covers.css?v=2','./command-center-book-covers.js?v=2','./book-cover-atlas-v2.webp?v=2',
  './manifest.webmanifest?v=9','./command-center-approved-icon-192.png?icon=9-approved-any','./command-center-approved-icon-512.png?icon=9-approved-any','./command-center-approved-icon-512.png?icon=9-approved-maskable',
  './cc6-eclipse.webp','./cc6-mountain.webp','./cc6-chart.webp','./cc6-road.webp','./art-brain.svg','./art-castle.svg','./art-chart.svg','./art-eclipse.svg','./art-mountain-red.svg','./art-mountain.svg','./art-network.svg','./art-road.svg'
];

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok) cache.put(request,response.clone()).catch(()=>{});
    return response;
  }catch{
    return (await cache.match(request)) || (request.mode==='navigate' ? await cache.match('./index.html') : null) || Response.error();
  }
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request);
  if(cached){
    fetch(request).then(response=>{if(response&&response.ok)cache.put(request,response.clone());}).catch(()=>{});
    return cached;
  }
  try{
    const response=await fetch(request);
    if(response&&response.ok) cache.put(request,response.clone()).catch(()=>{});
    return response;
  }catch{return Response.error();}
}

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(PRECACHE.map(asset=>cache.add(asset)))));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('james-command-center-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(windows=>{for(const win of windows){if('focus' in win)return win.focus();}return clients.openWindow('./');}));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){event.respondWith(networkFirst(request));return;}
  if(/\.(?:js|css|json|webmanifest)$/i.test(url.pathname)){event.respondWith(networkFirst(request));return;}
  if(/\.(?:png|webp|svg|jpg|jpeg)$/i.test(url.pathname)){event.respondWith(cacheFirst(request));return;}
  event.respondWith(networkFirst(request));
});
