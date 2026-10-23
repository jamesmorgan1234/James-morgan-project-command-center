const APPROVED_ATLAS_URL=new URL('./assets/book-cover-atlas-v2.webp',import.meta.url).href;
let queued=false;
let resizeTimer=null;

function visibleHomeScreen(){
  return [...document.querySelectorAll('.cc-screen')].find(screen=>screen.querySelector('.cc-title')?.textContent?.trim()==='Command Center')||null;
}

function homeCards(screen){
  return [...screen.querySelectorAll('.cc-agent-mode-card,.cc-home-card,.cc-module')];
}

function rowCount(cards){
  const tops=[];
  for(const card of cards){
    const top=card.getBoundingClientRect().top;
    if(!tops.some(value=>Math.abs(value-top)<3))tops.push(top);
  }
  return Math.max(1,tops.length);
}

function applyTileHeight(cards,height){
  const value=`${height.toFixed(1)}px`;
  for(const card of cards){
    card.style.setProperty('height',value,'important');
    card.style.setProperty('min-height',value,'important');
    card.style.setProperty('max-height',value,'important');
  }
}

function targetHomeBottom(screen){
  const viewport=window.visualViewport;
  const viewportBottom=(viewport?.offsetTop||0)+(viewport?.height||window.innerHeight)-8;
  const boundedRoot=screen.closest('.fixture-root');
  if(!boundedRoot)return viewportBottom;
  const containerBottom=boundedRoot.getBoundingClientRect().bottom-6;
  return Math.min(viewportBottom,containerBottom);
}

function fitHomeToViewport(){
  const screen=visibleHomeScreen();
  if(!screen)return;
  const cards=homeCards(screen);
  if(cards.length<14)return;
  for(let attempt=0;attempt<7;attempt+=1){
    const rows=rowCount(cards);
    const targetBottom=targetHomeBottom(screen);
    const currentBottom=Math.max(...cards.map(card=>card.getBoundingClientRect().bottom));
    const delta=targetBottom-currentBottom;
    if(Math.abs(delta)<=2)break;
    const currentHeight=parseFloat(getComputedStyle(cards[0]).height)||74;
    const next=Math.max(50,Math.min(108,currentHeight+(delta/rows)));
    if(Math.abs(next-currentHeight)<0.05)break;
    applyTileHeight(cards,next);
    void cards[cards.length-1].offsetHeight;
  }
}

function repairApprovedCoverUrls(){
  for(const cover of document.querySelectorAll('.cc-v7-approved-cover:not(.is-missing)')){
    cover.style.setProperty('background-image',`url("${APPROVED_ATLAS_URL}")`);
  }
}

function apply(){
  repairApprovedCoverUrls();
  fitHomeToViewport();
}

function schedule(){
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{
    queued=false;
    apply();
  });
}

new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('resize',()=>{
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(fitHomeToViewport,80);
});
window.visualViewport?.addEventListener('resize',()=>{
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(fitHomeToViewport,80);
});
window.addEventListener('cc7:global-refresh',()=>setTimeout(apply,0));
apply();
