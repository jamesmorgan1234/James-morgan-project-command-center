(() => {
  const MARK='ccProjectDetailAccordion';
  const BASE='ccProjectDetailAccordionBase';
  const DETAIL='detailPanel';
  const defs=[
    {key:'roadmap',label:'Project Roadmap',sub:'Build status, categories, phases, and verified progress'},
    {key:'performance',label:'Lifetime Performance',sub:'Verified lifetime results and performance tracking'},
    {key:'tracking',label:'Tracking Integrations',sub:'Connected sources, missing connections, and tracking status'}
  ];
  let projectToken='';
  let openKey=null;
  let scheduled=false;
  let observer=null;

  const norm=v=>String(v||'').trim().toLowerCase();
  const detail=()=>document.getElementById(DETAIL);
  const currentToken=()=>detail()?.querySelector('.detail-title')?.textContent?.trim()||'';

  function trackingBlock(root){
    if(!root)return null;
    return [...root.children].find(el=>{
      if(!el.classList?.contains('block'))return false;
      const h=norm(el.querySelector('h3')?.textContent);
      const compact=norm(el.querySelector('.ccv4-compact-details summary b')?.textContent);
      return h==='tracking integrations'||compact==='tracking integrations';
    })||null;
  }

  function directSource(root,key){
    if(key==='roadmap')return root?.querySelector(':scope > #ccProjectRoadmap')||null;
    if(key==='performance')return root?.querySelector(':scope > #projectPerformancePanel')||null;
    if(key==='tracking')return trackingBlock(root);
    return null;
  }

  function wrapperHasSource(shell,key){
    const body=shell?.querySelector(':scope > .cc-project-detail-body');
    if(!body)return false;
    if(key==='roadmap')return !!body.querySelector('#ccProjectRoadmap');
    if(key==='performance')return !!body.querySelector('#projectPerformancePanel');
    if(key==='tracking')return !!body.querySelector('[data-cc-project-detail-source="tracking"]');
    return false;
  }

  function sourceFor(root,key){
    const existing=root?.querySelector(`:scope > .cc-project-detail-section[data-cc-detail-section="${key}"]`);
    if(existing){
      if(wrapperHasSource(existing,key))return existing;
      existing.remove();
    }
    return directSource(root,key);
  }

  function prepare(root,def){
    const node=sourceFor(root,def.key);
    if(!node)return null;
    if(node.classList?.contains('cc-project-detail-section'))return node;

    const shell=document.createElement('section');
    shell.className='cc-project-detail-section';
    shell.dataset.ccDetailSection=def.key;
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='cc-project-detail-toggle';
    toggle.innerHTML=`<span class="cc-project-detail-toggle-copy"><strong>${def.label}</strong><small>${def.sub}</small></span><span class="cc-project-detail-chevron" aria-hidden="true">›</span>`;
    const body=document.createElement('div');
    body.className='cc-project-detail-body';

    node.parentElement?.insertBefore(shell,node);
    shell.append(toggle,body);
    body.append(node);
    node.dataset.ccProjectDetailSource=def.key;
    if(def.key==='tracking')node.dataset.ccv4Compact='1';
    toggle.addEventListener('click',()=>toggleSection(def.key));
    return shell;
  }

  function markSecondary(root){
    [...root.children].forEach((el,index)=>{
      if(el.matches('.section-head,.project-meta,.cc-project-detail-section'))return;
      el.classList.add('cc-project-detail-secondary');
      el.style.setProperty('order',String(40+index),'important');
    });
  }

  function sync(root){
    defs.forEach(def=>{
      const shell=prepare(root,def);
      if(!shell)return;
      const isOpen=openKey===def.key;
      shell.classList.toggle('is-open',isOpen);
      const btn=shell.querySelector(':scope > .cc-project-detail-toggle');
      const body=shell.querySelector(':scope > .cc-project-detail-body');
      if(btn){btn.setAttribute('aria-expanded',String(isOpen));btn.setAttribute('aria-label',`${isOpen?'Close':'Open'} ${def.label}`);}
      if(body)body.hidden=!isOpen;
    });
    markSecondary(root);
  }

  function closeNestedAndSection(){
    if(history.state?.ccProjectRoadmapCategory){history.go(-2);return true;}
    return false;
  }

  function toggleSection(key){
    const token=currentToken();
    if(!token)return;
    if(openKey===key){
      if(closeNestedAndSection())return;
      if(history.state?.[MARK]===key){history.back();return;}
      openKey=null;schedule();return;
    }
    if(openKey&&history.state?.[MARK]){
      openKey=key;
      history.replaceState({...history.state,[MARK]:key,ccProjectDetailProject:token},'',location.href);
      schedule();
      return;
    }
    const base={...history.state,[BASE]:true};
    delete base[MARK];
    history.replaceState(base,'',location.href);
    openKey=key;
    history.pushState({...base,[MARK]:key,ccProjectDetailProject:token},'',location.href);
    schedule();
  }

  function resetForProject(token){projectToken=token;openKey=null;}

  function apply(){
    const root=detail();
    if(!root||root.hidden)return;
    const token=currentToken();
    if(!token)return;
    if(projectToken!==token)resetForProject(token);
    sync(root);
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply();});
  }

  window.addEventListener('popstate',event=>{
    const token=currentToken();
    if(event.state?.[MARK]&&event.state?.ccProjectDetailProject===token)openKey=event.state[MARK];
    else if(event.state?.[BASE])openKey=null;
    schedule();
  });

  document.addEventListener('click',event=>{
    if(event.target.closest('[data-open],[data-continue],[data-hub-back]'))setTimeout(schedule,0);
  },true);
  document.addEventListener('commandcenter:audit-complete',schedule);
  window.addEventListener('load',()=>{schedule();setTimeout(schedule,180);setTimeout(schedule,700);},{once:true});

  const root=detail();
  if(root){observer=new MutationObserver(mutations=>{
    if(mutations.every(m=>m.target.closest?.('.cc-project-detail-toggle')))return;
    schedule();
  });observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});}
  schedule();
})();
