(() => {
  if (window.COMMAND_CENTER_AGENT_TRUTH) return;
  window.COMMAND_CENTER_AGENT_TRUTH = { version: 1 };

  const OPEN = new Set(['draft','active','paused','blocked','needs_user_action','partially_completed']);
  let runs = [];
  let busy = false;

  async function rpc(name,args={}){
    const c=window.COMMAND_CENTER_SUPABASE;
    if(!c) throw new Error('No client');
    const {data:{session}}=await c.auth.getSession();
    if(!session?.user) throw new Error('No session');
    const {data,error}=await c.rpc(name,args);
    if(error) throw error;
    return data;
  }

  function summarize(run){
    const steps=(run.steps||[]).filter(s=>!['skipped','canceled'].includes(s.status));
    const verified=steps.filter(s=>s.status==='verified');
    const running=steps.find(s=>s.status==='running'&&s.started_at);
    const needs=steps.find(s=>['blocked','needs_user_action'].includes(s.status));
    const checking=steps.find(s=>s.status==='verification_pending');
    const current=running||needs||checking||steps.find(s=>s.id===run.session.current_step_id)||steps.find(s=>s.status==='pending')||null;
    const pct=steps.length?(verified.length/steps.length)*100:0;
    let state='Queued';
    if(run.session.status==='needs_user_action'||run.session.status==='blocked'||needs) state='Needs You';
    else if(running) state='Working';
    else if(checking) state='Verifying';
    else if(run.session.status==='paused') state='Paused';
    return {run,steps,verified,current,pct,state};
  }

  function aggregate(list=runs){
    const stats=list.map(summarize);
    if(!stats.length)return{state:'Idle',pct:0,verified:0,total:0,current:null};
    const total=stats.reduce((n,s)=>n+s.steps.length,0);
    const verified=stats.reduce((n,s)=>n+s.verified.length,0);
    const chosen=['Needs You','Working','Verifying','Paused','Queued'].map(x=>stats.find(s=>s.state===x)).find(Boolean)||stats[0];
    return{state:chosen.state,pct:total?(verified/total)*100:0,verified,total,current:chosen.current};
  }

  function pct(v){return `${Number(v||0).toFixed(1)}%`;}

  function addProgress(section,summary){
    section.querySelector('[data-agent-truth-progress]')?.remove();
    if(summary.state==='Idle')return;
    const box=document.createElement('div');box.className='cc-agent-truth-progress';box.dataset.agentTruthProgress='1';
    const row=document.createElement('div');row.className='cc-agent-truth-row';
    const strong=document.createElement('strong');strong.textContent=pct(summary.pct);
    const small=document.createElement('small');small.textContent=`${summary.verified} / ${summary.total} verified`;
    row.append(strong,small);
    const track=document.createElement('div');track.className='cc-agent-truth-track';track.style.setProperty('--cc-agent-progress',`${Math.max(0,Math.min(100,summary.pct))}%`);track.appendChild(document.createElement('span'));
    box.append(row,track);
    if(summary.current?.title){const cur=document.createElement('small');cur.className='cc-agent-truth-current';cur.textContent=`Current: ${summary.current.title}`;box.appendChild(cur);}
    section.querySelector('.cc-approved-agent-current')?.insertAdjacentElement('afterend',box);
  }

  function patch(){
    const root=document.getElementById('ccApprovedApp');if(!root)return;
    const all=aggregate();
    const home=root.querySelector('[data-cc-home="agent"]');
    if(home){const value=home.querySelector('.cc-approved-hero-copy>strong'),sub=home.querySelector('.cc-approved-hero-copy>small');if(value)value.textContent=all.state==='Idle'?'Idle':pct(all.pct);if(sub)sub.textContent=all.state==='Idle'?'Ready when you are':`${all.state} · ${all.total?`${all.verified}/${all.total} verified`:'plan not started'}`;}

    const agent=root.querySelector('.cc-approved-agent');
    if(agent&&runs.length){
      const shown=agent.querySelector('.cc-approved-agent-current strong')?.textContent?.trim();
      const match=runs.find(r=>r.session.objective===shown||(r.steps||[]).some(s=>s.title===shown))||runs[0];
      const s=summarize(match);const status=agent.querySelector('.cc-approved-section-title>span:last-child');if(status)status.textContent=`${s.state} · ${pct(s.pct)}`;addProgress(agent,s);
    }

    const agentHome=root.querySelector('.cc-approved-agent-home');
    if(agentHome){const status=agentHome.querySelector('.cc-approved-section-title>span:last-child');if(status)status.textContent=all.state==='Idle'?'Idle':`${all.state} · ${pct(all.pct)}`;}
    root.querySelectorAll('.cc-approved-section-title>strong').forEach(el=>{if(el.textContent.trim()==='ACTIVE RUNS')el.textContent='AGENT RUNS';});
  }

  async function refresh(){
    if(busy)return;busy=true;
    try{
      const sessions=(await rpc('command_center_agent_list_sessions',{p_project_id:null})||[]).filter(s=>OPEN.has(s.status));
      runs=await Promise.all(sessions.map(async s=>{const detail=await rpc('command_center_agent_status',{p_session_id:s.id}).catch(()=>null);return detail?.session?detail:{session:s,steps:[]};}));
      patch();
    }catch{runs=[];patch();}
    finally{busy=false;}
  }

  new MutationObserver(()=>requestAnimationFrame(patch)).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',refresh,{once:true});
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('command-center:client-ready',refresh);
  setInterval(()=>{if(!document.hidden)refresh();},8000);
  setTimeout(refresh,500);
})();
