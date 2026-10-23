(()=>{
  const boot=document.getElementById('ccBoot');
  const app=document.getElementById('ccApp');
  if(!boot||!app)return;

  const RECOVERY_KEY='cc7-startup-recovery-attempted-v1';
  let settled=false;

  const markSettled=()=>{
    if(settled)return;
    if(boot.hidden||!app.hidden){
      settled=true;
      try{sessionStorage.removeItem(RECOVERY_KEY);}catch{}
      observer.disconnect();
    }
  };

  const observer=new MutationObserver(markSettled);
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['hidden']});
  markSettled();

  setTimeout(async()=>{
    if(settled||boot.hidden||!app.hidden)return;

    let alreadyTried=false;
    try{alreadyTried=sessionStorage.getItem(RECOVERY_KEY)==='1';}catch{}
    if(alreadyTried){
      boot.textContent='Command Center startup failed. Tap to retry.';
      boot.setAttribute('role','button');
      boot.tabIndex=0;
      const retry=()=>location.reload();
      boot.addEventListener('click',retry,{once:true});
      boot.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();retry();}
      },{once:true});
      return;
    }

    try{sessionStorage.setItem(RECOVERY_KEY,'1');}catch{}
    boot.textContent='Recovering Command Center…';

    try{
      if('serviceWorker' in navigator){
        const registrations=await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.filter(reg=>reg.scope.startsWith(location.origin)).map(reg=>reg.unregister()));
      }
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(key=>
          key.startsWith('command-center-v7-')||key.startsWith('james-command-center-')
        ).map(key=>caches.delete(key)));
      }
    }catch{}

    const url=new URL(location.href);
    url.searchParams.set('cc7-recover',Date.now().toString());
    location.replace(url.toString());
  },12000);
})();
