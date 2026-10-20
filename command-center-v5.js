(() => {
  const ART = ['art-mountain.svg','art-chart.svg','art-road.svg','art-network.svg','art-brain.svg','art-castle.svg','art-mountain-red.svg'];
  const ICONS = {
    'amazon books / kdp':'▤','ecommerce':'◇','creator business':'✦','service business':'⬡','digital products':'▱','savings platform':'◫','ai / media automation':'⚡','job platform':'◎','media production':'▶','software / saas':'⌘','software / sports tools':'◈','operations':'⌂'
  };
  const norm = v => String(v || '').trim().toLowerCase();
  const hash = s => [...String(s||'')].reduce((a,c)=>((a*31)+c.charCodeAt(0))>>>0,0);
  const iconFor = text => {
    const n=norm(text);
    for(const [k,v] of Object.entries(ICONS)) if(n.includes(k)) return v;
    if(/book|kdp|trilogy|series|workbook|cookbook|coloring/.test(n)) return '▤';
    if(/shop|commerce|store|coupon/.test(n)) return '◇';
    if(/ai|brain|automation|velo/.test(n)) return '⚡';
    if(/garage|service/.test(n)) return '⬡';
    if(/video|media|movie|content/.test(n)) return '▶';
    return '◈';
  };
  function setTheme(){
    document.documentElement.dataset.commandCenterTheme='v5';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#000000');
    const brand=document.querySelector('.brand-icon');
    if(brand) brand.src='./command-center-icon-v5.svg';
  }
  function decorateStats(){
    const stats=document.getElementById('stats'); if(!stats) return;
    const revenue=stats.querySelector('[data-view="revenue"]'); if(revenue) revenue.remove();
    const attention=stats.querySelector('[data-view="attention"]');
    if(attention){attention.querySelector('.label')&&(attention.querySelector('.label').textContent='Next Up');attention.querySelector('.stat-sub')&&(attention.querySelector('.stat-sub').textContent='Highest-priority moves');}
    const earning=stats.querySelector('[data-view="earning"]');
    if(earning){earning.querySelector('.label')&&(earning.querySelector('.label').textContent='Projects earning');earning.setAttribute('aria-label','Projects earning');stats.appendChild(earning);}
  }
  function pctFrom(card){
    const pb=card.querySelector('[role="progressbar"]');
    const raw=pb?.getAttribute('aria-valuenow');
    if(raw!==null && raw!==undefined && raw!==''){const n=Number(raw); if(Number.isFinite(n)) return Math.max(0,Math.min(100,Math.round(n)));}
    const txt=card.textContent.match(/(\d{1,3})%/); if(txt){const n=Number(txt[1]);if(Number.isFinite(n))return Math.max(0,Math.min(100,n));}
    return null;
  }
  function nameFrom(card){return card.querySelector('.hub-project-name,h3,.detail-title')?.textContent?.trim()||card.getAttribute('aria-label')||'Project';}
  function categoryFrom(card){return card.querySelector('.hub-project-stage,.muted')?.textContent||'';}
  function decorateProjectCard(card){
    if(!card || card.dataset.cc5==='1') return;
    card.dataset.cc5='1';
    const name=nameFrom(card), category=categoryFrom(card);
    card.dataset.cc5Icon=iconFor(`${name} ${category}`);
    card.style.setProperty('--cc5-card-art',`url('./${ART[hash(name)%ART.length]}')`);
    const pct=pctFrom(card);
    const ring=document.createElement('span'); ring.className='cc5-project-ring'+(pct===null?' is-na':'');
    if(pct!==null) ring.style.setProperty('--p',String(pct)); else ring.style.setProperty('--p','0');
    ring.innerHTML=`<strong>${pct===null?'N/A':pct+'%'}</strong>`;
    const ch=document.createElement('span'); ch.className='cc5-card-chevron'; ch.setAttribute('aria-hidden','true'); ch.textContent='›';
    card.append(ring,ch);
  }
  function decorateProjectCards(){document.querySelectorAll('.hub-project-card,.project-card').forEach(decorateProjectCard);}
  function makeDetailHero(){
    const detail=document.getElementById('detailPanel'); if(!detail || detail.hidden) return;
    const title=detail.querySelector('.detail-title')?.textContent?.trim(); if(!title) return;
    detail.style.setProperty('--cc5-detail-art',`url('./${ART[hash(title)%ART.length]}')`);
  }
  function cleanSwipeXs(){
    document.querySelectorAll('#canonicalAuditPanel,#sourceHealthPanel').forEach(card=>{
      card.querySelectorAll('button').forEach(btn=>{if(/close|dismiss|×|x/i.test(`${btn.getAttribute('aria-label')||''} ${btn.textContent||''}`.trim())) btn.remove();});
    });
  }
  function decoratePipeline(){
    document.querySelectorAll('.ccv4-pipeline-item').forEach(item=>{
      const row=item.querySelector('.ccv4-pipeline-row'); if(!row) return;
      const ring=row.querySelector('.ccv4-ring');
      if(ring && !ring.textContent.trim()) ring.innerHTML='<b>0%</b>';
    });
  }
  function apply(){setTheme();decorateStats();decorateProjectCards();makeDetailHero();decoratePipeline();cleanSwipeXs();}
  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  window.addEventListener('load',()=>{apply();setTimeout(apply,200);setTimeout(apply,900);},{once:true});
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',()=>{setTimeout(apply,0);setTimeout(apply,120);});
})();
