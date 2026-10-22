const ROOT_RELOAD_KEY='cc7-root-sw-reloaded';

if('scrollRestoration' in history)history.scrollRestoration='manual';

async function registerRootServiceWorker(){
  if(!('serviceWorker' in navigator))return;
  const hadController=Boolean(navigator.serviceWorker.controller);
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadController||reloading||sessionStorage.getItem(ROOT_RELOAD_KEY)==='1')return;
    reloading=true;
    sessionStorage.setItem(ROOT_RELOAD_KEY,'1');
    location.reload();
  });
  try{
    const registration=await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
    await registration.update();
    if(navigator.serviceWorker.controller?.scriptURL?.endsWith('/service-worker.js'))sessionStorage.removeItem(ROOT_RELOAD_KEY);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)registration.update().catch(()=>{});});
  }catch(error){
    console.warn('Command Center V7 root service worker registration failed',error);
  }
}

registerRootServiceWorker();
