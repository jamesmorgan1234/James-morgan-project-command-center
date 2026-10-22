(() => {
  if (window.COMMAND_CENTER_CONTROL_SURFACE) return;
  const api = window.COMMAND_CENTER_CONTROL_SURFACE = { version: 2 };
  const MODULES = [
    ['Brain','Durable memory, plans and handoffs'],
    ['Automation','Schedules, watches and notifications'],
    ['Integrations','Connected services and sources'],
    ['Analytics','Verified performance and progress'],
    ['Security','Permissions and protected gates'],
    ['Deployment','Release, hosting and rollback']
  ];
  let busy = false;
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const client = () => window.COMMAND_CENTER_SUPABASE || null;
  const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));

  async function owner() {
    const c = client(); if (!c) return null;
    const {data:{session},error} = await c.auth.getSession();
    if (error || !session?.user) return null;
    const gate = await c.rpc('is_command_center_authorized');
    return gate.error || !gate.data ? null : session.user;
  }
  async function autoState() {
    const c=client(),u=await owner(); if(!c||!u)return {enabled:false,available:false};
    const {data,error}=await c.rpc('command_center_agent_service_get_auto',{p_owner_id:u.id});
    if(error) return {enabled:false,available:false,error:error.message};
    return {enabled:!!data,available:true};
  }
  async function setAuto(enabled) {
    const c=client(),u=await owner(); if(!c||!u)throw new Error('Authorized Command Center session required.');
    const {data,error}=await c.rpc('command_center_agent_service_set_auto',{p_owner_id:u.id,p_enabled:!!enabled,p_updated_by:'command_center_ui'});
    if(error)throw error;
    return data;
  }
  function autoMarkup(state) {
    const label=state.available?(state.enabled?'AUTO ON':'AUTO OFF'):'AUTO N/A';
    const detail=state.available?(state.enabled?'Background Agent execution is allowed within existing gates.':'Background Agent execution is stopped. Manual controls still work.'):'AUTO state could not be verified.';
    return `<section class="cc-control-auto ${state.enabled?'is-on':'is-off'}" data-cc-control-auto><div><small>AGENT AUTONOMY</small><strong>${esc(label)}</strong><span>${esc(detail)}</span></div><button type="button" data-cc-auto-toggle ${state.available?'':'disabled'} aria-pressed="${state.enabled?'true':'false'}">${state.enabled?'Turn AUTO Off':'Turn AUTO On'}</button></section>`;
  }
  function modulesMarkup(){return `<section class="cc-control-modules" data-cc-control-modules><div class="cc-control-heading"><small>COMMAND CENTER</small><strong>Controls</strong></div><div class="cc-control-module-grid">${MODULES.map(([name,detail])=>`<button type="button" data-cc-module="${esc(name)}"><strong>${esc(name)}</strong><small>${esc(detail)}</small><span>›</span></button>`).join('')}</div></section>`;}

  async function enterAdvanced(name) {
    await window.COMMAND_CENTER_LOAD_ADVANCED?.();
    const about=document.getElementById('ccApprovedAbout');
    if(!about)throw new Error('About & More control is not available.');
    about.click();
    await wait(40);
    const action=document.querySelector(`[data-cc-about-action="${name==='Brain'?'brain':'advanced'}"]`);
    if(!action)throw new Error('Approved advanced navigation is not available.');
    action.click();
    await wait(100);
  }
  function moduleTarget(name){
    const wanted=name.toLowerCase();
    const candidates=[...document.querySelectorAll('button,[role="button"],a')].filter(el=>!el.closest('#ccApprovedAboutSheet'));
    return candidates.find(el=>String(el.textContent||'').trim().toLowerCase()===wanted)
      || candidates.find(el=>String(el.textContent||'').trim().toLowerCase().startsWith(wanted));
  }
  async function openModule(name) {
    await enterAdvanced(name);
    if(name==='Brain')return;
    const target=moduleTarget(name);
    if(!target)throw new Error(`${name} control is loaded but its navigation button was not found.`);
    target.click();
  }

  async function render() {
    if(busy)return; busy=true;
    try{
      const root=document.getElementById('ccApprovedApp');
      if(!root || root.hidden || document.body.classList.contains('cc-approved-legacy-open'))return;
      const route=root.dataset.ccLockedView||document.body.dataset.ccLockedView||'home';
      const state=await autoState();
      let autoHost=root.querySelector('[data-cc-control-auto]');
      if(route==='home'){
        const grid=root.querySelector('.cc-screen-home-grid');
        if(grid){
          if(!autoHost){grid.insertAdjacentHTML('afterend',autoMarkup(state));autoHost=root.querySelector('[data-cc-control-auto]');}
          else autoHost.outerHTML=autoMarkup(state);
          if(!root.querySelector('[data-cc-control-modules]'))root.insertAdjacentHTML('beforeend',modulesMarkup());
        }
      } else if(route==='agent') {
        const host=root.querySelector('.cc-approved-agent-home');
        if(host){if(!autoHost)host.insertAdjacentHTML('afterbegin',autoMarkup(state));else autoHost.outerHTML=autoMarkup(state);}
      }
    } catch(error){console.warn('Command Center control surface refresh failed',error);}
    finally{busy=false;}
  }

  document.addEventListener('click',async event=>{
    const toggle=event.target.closest?.('[data-cc-auto-toggle]');
    if(toggle){
      event.preventDefault();event.stopImmediatePropagation();
      if(toggle.disabled)return;
      const host=toggle.closest('[data-cc-control-auto]');
      try{toggle.disabled=true;toggle.textContent='Updating…';const current=toggle.getAttribute('aria-pressed')==='true';await setAuto(!current);await render();window.COMMAND_CENTER_AGENT_TRUTH?.refresh?.();window.COMMAND_CENTER_AGENT_RUNNER_STATUS?.refresh?.();}
      catch(error){if(host){let msg=host.querySelector('.cc-control-error');if(!msg){msg=document.createElement('em');msg.className='cc-control-error';host.appendChild(msg);}msg.textContent=error.message||String(error);}toggle.disabled=false;}
      return;
    }
    const module=event.target.closest?.('[data-cc-module]');
    if(module){
      event.preventDefault();event.stopImmediatePropagation();
      try{module.disabled=true;await openModule(module.dataset.ccModule);}catch(error){module.disabled=false;const host=module.closest('[data-cc-control-modules]');let msg=host?.querySelector('.cc-control-error');if(host&&!msg){msg=document.createElement('em');msg.className='cc-control-error';host.appendChild(msg);}if(msg)msg.textContent=error.message||String(error);}
    }
  },true);

  const observer=new MutationObserver(()=>{clearTimeout(observer._cc);observer._cc=setTimeout(render,80);});
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','data-cc-locked-view']});
  window.addEventListener('command-center:approved-rendered',render);
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
  setTimeout(render,500);
  api.refresh=render;
})();