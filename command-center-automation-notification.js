(() => {
  const MOUNT_ID='ccAutomationNotificationMount';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtDate=v=>{if(!v)return 'N/A';const d=new Date(v);return Number.isNaN(d.getTime())?'N/A':d.toLocaleString();};
  const state={notifications:[],projects:[],preference:null,openId:null,loading:false,message:'',showArchived:false,poll:null};
  function client(){return window.COMMAND_CENTER_SUPABASE||null;}
  async function ownerId(){const c=client();if(!c)throw new Error('Secure Command Center connection is unavailable.');const {data,error}=await c.auth.getUser();if(error||!data?.user?.id)throw error||new Error('Sign in to use Automation.');return data.user.id;}
  function projectName(id){return state.projects.find(p=>p.id===id)?.name||id||'No project';}
  function deviceSupport(){return typeof Notification!=='undefined'&&!!navigator?.serviceWorker;}
  function deviceState(){if(!deviceSupport())return 'unsupported';if(!state.preference?.browser_enabled)return 'off';return Notification.permission==='granted'?'on':Notification.permission;}
  async function load(){
    const c=client();if(!c)return;state.loading=true;render();
    try{
      const owner=await ownerId();
      const [notifications,projects,pref]=await Promise.all([
        c.from('automation_notifications').select('id,project_id,schedule_id,dispatch_id,condition_id,title,message,severity,status,delivered_at,read_at,browser_shown_at,archived_at,created_at').order('delivered_at',{ascending:false}).limit(200),
        c.from('projects').select('id,name').order('name',{ascending:true}),
        c.from('automation_notification_preferences').select('owner_id,browser_enabled').eq('owner_id',owner).maybeSingle()
      ]);
      for(const r of [notifications,projects,pref])if(r.error)throw r.error;
      state.notifications=notifications.data||[];state.projects=projects.data||[];state.preference=pref.data||{owner_id:owner,browser_enabled:false};state.message='';
      await showPendingDeviceNotifications();
    }catch(error){state.message=error?.message||'Notification Delivery data could not be loaded.';}finally{state.loading=false;render();}
  }
  async function savePreference(enabled){const c=client(),owner=await ownerId();const {data,error}=await c.from('automation_notification_preferences').upsert({owner_id:owner,browser_enabled:!!enabled},{onConflict:'owner_id'}).select('owner_id,browser_enabled').single();if(error)throw error;state.preference=data;render();return data;}
  async function enableDeviceNotifications(){
    if(!deviceSupport())throw new Error('Device notifications are not supported in this browser.');
    const permission=await Notification.requestPermission();
    if(permission!=='granted'){await savePreference(false);throw new Error(permission==='denied'?'Device notification permission was denied.':'Device notification permission was not granted.');}
    await savePreference(true);await showPendingDeviceNotifications();
  }
  async function setNotificationState(id,action){const c=client();await ownerId();const {error}=await c.rpc('command_center_notification_set_state',{p_notification_id:id,p_action:action});if(error)throw error;await load();}
  async function markBrowserShown(id){const c=client();await ownerId();const {error}=await c.rpc('command_center_notification_mark_browser_shown',{p_notification_id:id});if(error)throw error;}
  async function showPendingDeviceNotifications(){
    if(!state.preference?.browser_enabled||!deviceSupport()||Notification.permission!=='granted')return;
    let registration;try{registration=await navigator.serviceWorker.ready;}catch{return;}
    const pending=state.notifications.filter(n=>n.status==='unread'&&!n.browser_shown_at).slice(0,10);
    for(const n of pending){
      try{
        await registration.showNotification(n.title,{body:n.message,tag:`cc-automation-${n.id}`,renotify:false,icon:'./command-center-approved-icon-192.png?icon=9-approved-any',badge:'./command-center-approved-icon-192.png?icon=9-approved-any',data:{notification_id:n.id,url:'./'}});
        await markBrowserShown(n.id);n.browser_shown_at=new Date().toISOString();
      }catch{}
    }
  }
  function statusBadge(n){return `<span class="cc-notify-status ${esc(n.status)}">${esc(n.status)}</span>`;}
  function renderNotification(n){const open=state.openId===n.id;return `<article class="cc-notify-card ${open?'open':''}" data-cc-notify-card="${esc(n.id)}">
    <button type="button" class="cc-notify-card-toggle" data-cc-notify-toggle="${esc(n.id)}" aria-expanded="${open}"><span><strong>${esc(n.title)}</strong><small>${esc(projectName(n.project_id))} · ${fmtDate(n.delivered_at)}</small></span><span>${statusBadge(n)}<b>${open?'⌃':'›'}</b></span></button>
    ${open?`<div class="cc-notify-detail"><p>${esc(n.message)}</p><dl><div><dt>Delivered</dt><dd>${fmtDate(n.delivered_at)}</dd></div><div><dt>Project</dt><dd>${esc(projectName(n.project_id))}</dd></div><div><dt>Status</dt><dd>${esc(n.status)}</dd></div><div><dt>Device alert shown</dt><dd>${fmtDate(n.browser_shown_at)}</dd></div></dl><p class="cc-notify-note">This alert was created server-side from a passed Automation trigger. Later phases may generate reports or execute separately authorized actions.</p><div class="cc-notify-actions">${n.status==='unread'?`<button type="button" class="btn btn-primary" data-notify-action="read" data-id="${esc(n.id)}">Mark read</button>`:''}${n.status==='read'?`<button type="button" class="btn" data-notify-action="unread" data-id="${esc(n.id)}">Mark unread</button>`:''}${n.status!=='archived'?`<button type="button" class="btn" data-notify-action="archive" data-id="${esc(n.id)}">Archive</button>`:`<button type="button" class="btn btn-primary" data-notify-action="restore" data-id="${esc(n.id)}">Restore</button>`}</div></div>`:''}
  </article>`;}
  function bind(root){
    root.querySelector('[data-cc-notify-refresh]')?.addEventListener('click',load);
    root.querySelector('[data-device-enable]')?.addEventListener('click',async()=>{try{state.message='Requesting device notification permission…';render();await enableDeviceNotifications();state.message='Device alerts enabled.';render();}catch(error){state.message=error?.message||'Device alerts could not be enabled.';render();}});
    root.querySelector('[data-device-disable]')?.addEventListener('click',async()=>{try{await savePreference(false);state.message='Device alerts disabled. Alerts will still be saved in Command Center.';render();}catch(error){state.message=error?.message||'Device alert preference could not be saved.';render();}});
    root.querySelector('[data-show-archived]')?.addEventListener('change',e=>{state.showArchived=e.currentTarget.checked;render();});
    root.querySelectorAll('[data-cc-notify-toggle]').forEach(b=>b.addEventListener('click',()=>toggleNotification(b.dataset.ccNotifyToggle,true)));
    root.querySelectorAll('[data-notify-action]').forEach(b=>b.addEventListener('click',async()=>{try{state.message='Saving…';render();await setNotificationState(b.dataset.id,b.dataset.notifyAction);}catch(error){state.message=error?.message||'Alert could not be updated.';render();}}));
  }
  function render(){
    const root=document.getElementById(MOUNT_ID);if(!root)return;
    const visible=state.notifications.filter(n=>state.showArchived||n.status!=='archived');const unread=state.notifications.filter(n=>n.status==='unread').length;const ds=deviceState();
    root.innerHTML=`<section class="cc-notify"><div class="cc-notify-head"><div><span class="cc-notify-kicker">Automation · Phase 3</span><h4>Notification Delivery</h4><p>Passed scheduled triggers become durable Command Center alerts, even when the app is closed.</p></div><span class="badge active">100% · Complete</span></div><div class="cc-notify-stats"><span><b>${state.notifications.length}</b> alerts</span><span><b>${unread}</b> unread</span><button type="button" class="btn" data-cc-notify-refresh>Refresh</button></div><div class="cc-notify-device"><div><strong>Device alerts</strong><small>${esc(ds==='on'?'Enabled':ds==='unsupported'?'Not supported':ds==='denied'?'Permission denied':'Off')} · Command Center inbox delivery always remains active.</small></div>${ds==='on'?'<button type="button" class="btn" data-device-disable>Disable device alerts</button>':ds==='unsupported'||ds==='denied'?'': '<button type="button" class="btn btn-primary" data-device-enable>Enable device alerts</button>'}</div>${state.message?`<div class="cc-notify-message">${esc(state.message)}</div>`:''}<label class="cc-notify-archive-toggle"><input type="checkbox" data-show-archived ${state.showArchived?'checked':''}> Show archived</label>${state.loading?'<div class="cc-notify-loading">Loading alerts…</div>':`<div class="cc-notify-list">${visible.length?visible.map(renderNotification).join(''):'<div class="cc-notify-empty">No alerts yet. A passed scheduled trigger will appear here automatically.</div>'}</div>`}</section>`;bind(root);
  }
  function toggleNotification(id,push=true){if(state.openId===id){if(push&&history.state?.ccAutomationNotification===id){history.back();return;}state.openId=null;render();return;}state.openId=id;render();if(push)history.pushState({...history.state,ccAutomationNotification:id},'',location.href);}
  function startPolling(){if(state.poll)clearInterval(state.poll);state.poll=setInterval(()=>{if(!document.getElementById(MOUNT_ID)){clearInterval(state.poll);state.poll=null;return;}load();},30000);}
  function mount(){if(!document.getElementById(MOUNT_ID))return;render();load();startPolling();}
  window.addEventListener('popstate',e=>{if(state.openId&&e.state?.ccAutomationNotification!==state.openId){state.openId=null;render();}});
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Automation')mount();});
  window.COMMAND_CENTER_AUTOMATION_NOTIFICATION={load,savePreference,enableDeviceNotifications,setNotificationState,showPendingDeviceNotifications,mount,state,deviceState};
  if(document.getElementById(MOUNT_ID))mount();
})();
