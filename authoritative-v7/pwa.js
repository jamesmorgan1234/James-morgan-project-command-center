const RELOAD_KEY='cc7-sw-reloaded';

if('scrollRestoration' in history)history.scrollRestoration='manual';

async function registerCleanServiceWorker(){
  if(!('serviceWorker' in navigator))return;
  const hadController=Boolean(navigator.serviceWorker.controller);
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadController||reloading||sessionStorage.getItem(RELOAD_KEY)==='1')return;
    reloading=true;
    sessionStorage.setItem(RELOAD_KEY,'1');
    location.reload();
  });
  try{
    const registration=await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
    await registration.update();
    if(navigator.serviceWorker.controller?.scriptURL?.includes('/authoritative-v7/service-worker.js'))sessionStorage.removeItem(RELOAD_KEY);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)registration.update().catch(()=>{});});
  }catch(error){
    console.warn('Command Center V7 service worker registration failed',error);
  }
}

registerCleanServiceWorker();
