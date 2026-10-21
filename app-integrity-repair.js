(() => {
  const APPROVED='./command-center-approved-icon-512.png?icon=7-ui';
  let scheduled=false;
  function setStyle(el,name,value){if(!el)return;if(el.style.getPropertyValue(name)!==value||el.style.getPropertyPriority(name)!=='important')el.style.setProperty(name,value,'important');}
  function enforceScrollContract(){
    const root=document.documentElement,body=document.body,app=document.getElementById('app');
    setStyle(root,'overflow-x','hidden');setStyle(root,'overflow-y','auto');setStyle(root,'touch-action','pan-y');setStyle(root,'overscroll-behavior-y','contain');setStyle(root,'-webkit-overflow-scrolling','touch');
    setStyle(body,'overflow-x','hidden');setStyle(body,'overflow-y','visible');setStyle(body,'touch-action','pan-y');setStyle(body,'overscroll-behavior-y','contain');setStyle(body,'min-height','100dvh');
    setStyle(app,'overflow-x','clip');setStyle(app,'overflow-y','visible');setStyle(app,'min-height','100dvh');
    const hard=document.getElementById('systemBarHardening');if(hard&&hard.textContent.includes('overscroll-behavior-y:none'))hard.textContent=hard.textContent.replace(/overscroll-behavior-y\s*:\s*none/g,'overscroll-behavior-y:contain');
  }
  function enforceApprovedIdentity(){
    const icon=document.querySelector('.brand-icon');if(icon&&!String(icon.getAttribute('src')||'').includes('command-center-approved-icon-512.png'))icon.setAttribute('src',APPROVED);
    const fav=document.querySelector('link[rel="icon"]');if(fav&&!String(fav.getAttribute('href')||'').includes('command-center-approved-icon-512.png'))fav.setAttribute('href','./command-center-approved-icon-512.png?icon=7-browser');
    const apple=document.querySelector('link[rel="apple-touch-icon"]');if(apple&&!String(apple.getAttribute('href')||'').includes('command-center-approved-icon-512.png'))apple.setAttribute('href','./command-center-approved-icon-512.png?icon=7-apple');
  }
  function store(){try{return JSON.parse(localStorage.getItem('ccv4-dismissed-notices')||'{}')||{};}catch{return {};}}
  function hash(text){let h=5381;for(const ch of String(text||''))h=((h<<5)+h)^ch.charCodeAt(0);return(h>>>0).toString(36);}
  function safeSwipe(card){
    if(!card||card.dataset.ccSafeSwipe==='1')return card;
    const replacement=card.cloneNode(true);replacement.dataset.ccSafeSwipe='1';replacement.classList.add('ccv4-swipe-card');replacement.style.touchAction='pan-y';card.replaceWith(replacement);card=replacement;
    const key=card.id||card.dataset.noticeType||'notice';let startX=0,startY=0,dx=0,axis=null,active=false;
    const signature=()=>hash(card.textContent.replace(/\s+/g,' ').trim());const prior=store();if(prior[key]===signature())card.hidden=true;
    card.addEventListener('pointerdown',e=>{startX=e.clientX;startY=e.clientY;dx=0;axis=null;active=true;},{passive:true});
    card.addEventListener('pointermove',e=>{if(!active)return;const x=e.clientX-startX,y=e.clientY-startY;if(!axis&&Math.max(Math.abs(x),Math.abs(y))>12)axis=Math.abs(x)>Math.abs(y)*1.15?'horizontal':'vertical';if(axis!=='horizontal')return;dx=x;card.style.transform=`translate3d(${dx}px,0,0)`;card.style.opacity=String(Math.max(.22,1-Math.abs(dx)/Math.max(1,card.offsetWidth)));},{passive:true});
    const finish=()=>{if(!active)return;active=false;const threshold=Math.max(64,Math.min(120,card.offsetWidth*.22));if(axis==='horizontal'&&Math.abs(dx)>=threshold){const map=store();map[key]=signature();localStorage.setItem('ccv4-dismissed-notices',JSON.stringify(map));const dir=dx<0?-1:1;card.style.transform=`translate3d(${dir*120}%,0,0)`;card.style.opacity='0';setTimeout(()=>{card.hidden=true;card.style.transform='';card.style.opacity='';},210);}else{card.style.transform='';card.style.opacity='';}axis=null;dx=0;};
    card.addEventListener('pointerup',finish,{passive:true});card.addEventListener('pointercancel',finish,{passive:true});return card;
  }
  function repair(){enforceScrollContract();enforceApprovedIdentity();safeSwipe(document.getElementById('canonicalAuditPanel'));safeSwipe(document.getElementById('sourceHealthPanel'));}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;repair();});}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','href']});
  window.addEventListener('load',()=>{repair();setTimeout(repair,250);setTimeout(repair,1000);},{once:true});document.addEventListener('commandcenter:audit-complete',()=>setTimeout(repair,80));repair();window.COMMAND_CENTER_INTEGRITY=Object.freeze({repair,enforceScrollContract,enforceApprovedIdentity});
})();
