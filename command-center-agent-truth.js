(() => {
  if (window.COMMAND_CENTER_AGENT_TRUTH?.version >= 3) return;

  const api = window.COMMAND_CENTER_AGENT_TRUTH = { version: 3 };
  const OPEN = new Set(['draft','active','paused','blocked','needs_user_action','partially_completed']);
  let runs = [];
  let busy = false;
  let scheduled = null;

  async function rpc(name,args={}){
    const c=window.COMMAND_CENTER_SUPABASE;
    if(!c) throw new Error('No client');
    const {data:{session}}=await c.auth.getSession();
    if(!session?.user) throw new Error('No session');
    const {data,error}=await c.rpc(name,args);
    if(error) throw error;
    return data;
  }

  function baseSummary(run){
    const steps=(run.steps||[]).filter(s=>!['skipped','canceled'].includes(s.status));
    const verified=steps.filter(s=>s.status==='verified');
    const running=steps.find(s=>s.status==='running'&&s.started_at);
    const needs=steps.find(s=>['blocked','needs_user_action'].includes(s.status));
    const checking=steps.find(s=>s.status==='verification_pending');
    const current=running||needs||checking||steps.find(s=>s.id===run.session.current_step_id)||steps.find(s=>s.status==='pending')||null;
    const percent=steps.length?(verified.length/steps.length)*100:0;
    let state='Starting';
    if(run.session.status==='needs_user_action'||run.session.status==='blocked'||needs) state='Needs You';
    else if(running) state='Working';
    else if(checking) state='Verifying';
    else if(run.session.status==='paused') state='Paused';
    return {run,steps,verified,current,percent,state};
  }

  function classified(list=runs){
    const stats=list.map(baseSummary);
    const hasWorking=stats.some(s=>s.state==='Working');
    if(hasWorking){
      stats.forEach(s=>{if(s.state==='Starting')s.state='Queued';});
    }
    return stats;
  }

  function aggregate(list=runs){
    const stats=classified(list);
    if(!stats.length)return{state:'Idle',percent:0,verified:0,total:0,current:null};
    const total=stats.reduce((n,s)=>n+s.steps.length,0);
    const verified=stats.reduce((n,s)=>n+s.verified.length,0);
    const chosen=['Needs You','Working','Verifying','Paused','Starting','Queued'].map(x=>stats.find(s=>s.state===x)).find(Boolean)||stats[0];
    return{state:chosen.state,percent:total?(verified/total)*100:0,verified,total,current:chosen.current};
  }

  function summaryFor(run){
    return classified().find(s=>s.run?.session?.id===run?.session?.id)||baseSummary(run);
  }

  const pct=v=>`${Math.floor(Number(v||0)*10)/10 .toFixed?.(1) || Number(v||0).toFixed(1)}%`;
  const safePct=v=>`${(Math.floor(Number(v||0)*10)/10).toFixed(1)}%`;
  const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};

  function updateProgress(section,summary){
    let box=section.querySelector('[data-agent-truth-progress]');
    if(summary.state==='Idle'){
      box?.remove();
      return;
    }
    if(!box){
      box=document.createElement('div');
      box.className='cc-agent-truth-progress';
      box.dataset.agentTruthProgress='1';
      box.innerHTML='<div class="cc-agent-truth-row"><strong></strong><small></small></div><div class="cc-agent-truth-track"><span></span></div><small class="cc-agent-truth-current"></small>';
      section.querySelector('.cc-approved-agent-current')?.insertAdjacentElement('afterend',box);
    }
    setText(box.querySelector('.cc-agent-truth-row strong'),safePct(summary.percent));
    setText(box.querySelector('.cc-agent-truth-row small'),`${summary.verified} / ${summary.steps.length} verified`);
    box.querySelector('.cc-agent-truth-track')?.style.setProperty('--cc-agent-progress',`${Math.max(0,Math.min(100,summary.percent))}%`);
    const current=box.querySelector('.cc-agent-truth-current');
    const currentText=summary.current?.title?`Current: ${summary.current.title}`:'';
    setText(current,currentText);
    if(current)current.hidden=!currentText;
  }

  function homeSub(summary){
    if(summary.state==='Idle')return'Ready when you are';
    if(summary.state==='Starting')return'Starting · waiting for Agent runner';
    if(summary.state==='Queued')return`Queued · ${summary.total?`${summary.verified}/${summary.total} verified`:'waiting behind active work'}`;
    return `${summary.state} · ${summary.total?`${summary.verified}/${summary.total} verified`:'plan not started'}`;
  }

  function patch(){
    const root=document.getElementById('ccApprovedApp');
    if(!root)return;
    const all=aggregate();

    const home=root.querySelector('[data-cc-home="agent"]');
    if(home){
      const value=home.querySelector('.cc-approved-hero-copy>strong');
      const sub=home.querySelector('.cc-approved-hero-copy>small');
      setText(value,all.state==='Idle'?'Idle':safePct(all.percent));
      setText(sub,homeSub(all));
    }

    const agent=root.querySelector('.cc-approved-agent');
    if(agent&&runs.length){
      const projectId=window.history.state?.projectId||null;
      const scoped=projectId?runs.filter(r=>(r.session.current_project_id||r.session.primary_project_id)===projectId):runs;
      const shown=agent.querySelector('.cc-approved-agent-current strong')?.textContent?.trim();
      const match=scoped.find(r=>r.session.objective===shown||(r.steps||[]).some(s=>s.title===shown))||scoped[0]||runs[0];
      const summary=summaryFor(match);
      setText(agent.querySelector('.cc-approved-section-title>span:last-child'),`${summary.state} · ${safePct(summary.percent)}`);
      updateProgress(agent,summary);
    }else if(agent){
      updateProgress(agent,{state:'Idle'});
    }

    const agentHome=root.querySelector('.cc-approved-agent-home');
    if(agentHome)setText(agentHome.querySelector('.cc-approved-section-title>span:last-child'),all.state==='Idle'?'Idle':`${all.state} · ${safePct(all.percent)}`);
    root.querySelectorAll('.cc-approved-section-title>strong').forEach(el=>{if(el.textContent.trim()==='ACTIVE RUNS')setText(el,'AGENT RUNS');});
  }

  async function refresh(){
    if(busy)return;
    busy=true;
    try{
      const sessions=(await rpc('command_center_agent_list_sessions',{p_project_id:null})||[]).filter(s=>OPEN.has(s.status));
      runs=await Promise.all(sessions.map(async s=>{
        const detail=await rpc('command_center_agent_status',{p_session_id:s.id}).catch(()=>null);
        return detail?.session?detail:{session:s,steps:[]};
      }));
      patch();
    }catch{
      runs=[];
      patch();
    }finally{
      busy=false;
    }
  }

  function scheduleRefresh(delay=160){
    clearTimeout(scheduled);
    scheduled=setTimeout(refresh,delay);
  }

  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-cc-home],[data-cc-project],[data-cc-back],[data-cc-agent-mode],[data-cc-agent-home-mode],[data-cc-agent-action],[data-cc-agent-refresh],[data-cc-agent-checkpoint],[data-cc-agent-stop]'))scheduleRefresh(350);
  },true);
  window.addEventListener('load',()=>scheduleRefresh(200),{once:true});
  window.addEventListener('popstate',()=>scheduleRefresh(120));
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleRefresh(100);});
  window.addEventListener('command-center:client-ready',()=>scheduleRefresh(100));
  setInterval(()=>{if(!document.hidden)refresh();},8000);
  setTimeout(()=>scheduleRefresh(0),500);

  api.refresh=refresh;
  api.patch=patch;
})();
