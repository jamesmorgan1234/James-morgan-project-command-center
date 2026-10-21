(() => {
  let timer=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmt=v=>{if(!v)return 'N/A';const d=new Date(v);return Number.isNaN(d.getTime())?'N/A':d.toLocaleString();};
  function ensureEmailScopes(){
    const select=document.querySelector('#ccIntegrationsMount select[name="scope_key"]');
    if(!select)return;
    for(const [value,label] of [['email_metadata','email metadata'],['email_content','email full content'],['records','generic records']]){
      if(select.querySelector(`option[value="${value}"]`))continue;
      const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option);
    }
  }
  async function render(){
    const root=document.getElementById('ccIntegrationsMount');
    const client=window.COMMAND_CENTER_SUPABASE;
    if(!root||!client)return;
    ensureEmailScopes();
    let section=document.getElementById('ccIntegrationEmailRecords');
    if(!section){section=document.createElement('section');section.id='ccIntegrationEmailRecords';section.className='cc-int-phase';root.appendChild(section);}
    section.innerHTML='<div class="cc-int-phase-head"><div><span>Integrations · Email records</span><h4>Normalized Mailboxes</h4><p>Each Yahoo, Gmail, Outlook, Proton, or other mailbox stays source-separated. Full body content requires an explicit deeper-content permission.</p></div></div><div class="cc-int-loading">Loading mailbox records…</div>';
    const [r,c]=await Promise.all([
      client.from('integration_records').select('connection_id,external_record_id,parent_external_id,title,summary,status,occurred_at,data,source').eq('record_type','email.message').order('occurred_at',{ascending:false}).limit(50),
      client.from('integration_connections').select('id,provider_label,account_label').order('provider_label')
    ]);
    if(r.error||c.error){section.querySelector('.cc-int-loading').textContent='Mailbox records are unavailable until the authorized source is connected.';return;}
    const names=new Map((c.data||[]).map(x=>[x.id,`${x.provider_label} · ${x.account_label}`]));
    const rows=(r.data||[]).map(m=>{
      const sender=typeof m.data?.from==='string'?m.data.from:Array.isArray(m.data?.from)?m.data.from.join(', '):'';
      return `<div><strong>${esc(m.title||'(No subject)')}</strong><span>${esc(names.get(m.connection_id)||'Mailbox')} · ${esc(sender||'sender unavailable')} · ${esc(m.status||'N/A')} · ${esc(fmt(m.occurred_at))}</span>${m.summary?`<small>${esc(m.summary)}</small>`:''}</div>`;
    }).join('');
    section.innerHTML=`<div class="cc-int-phase-head"><div><span>Integrations · Email records</span><h4>Normalized Mailboxes</h4><p>Each Yahoo, Gmail, Outlook, Proton, or other mailbox stays source-separated. Full body content requires an explicit deeper-content permission.</p></div><span class="badge active">Source separated</span></div><div class="cc-int-list">${rows||'<div><span>No authorized mailbox messages have been normalized yet.</span></div>'}</div>`;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>render().catch(()=>{}),80);}
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Integrations')schedule();});
  document.addEventListener('commandcenter:data-refresh-requested',schedule);
  new MutationObserver(()=>{if(document.getElementById('ccIntegrationsMount'))ensureEmailScopes();}).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',schedule,{once:true});
})();
