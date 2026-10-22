(() => {
  if (window.COMMAND_CENTER_WORK_BOUNDARY_MODE) return;
  window.COMMAND_CENTER_WORK_BOUNDARY_MODE = { version: 1 };

  const CONTRACT = ' NEXT WORK BOUNDARY CHECKPOINT: Keep moving the project forward with eligible normal-chat and $0/free-first work. At the first genuine Work-only capability boundary, stop before Work execution and write a durable verified checkpoint that records: exact current verified state, work completed in this run, evidence/verification, remaining scope, the exact next Work task, required inputs/files/account context, and the continuation handoff. Update the project current/next/checkpoint state so Command Center and Agent can resume from this boundary without reconstructing the project from chat history.';

  function installRpcGuard(){
    const c=window.COMMAND_CENTER_SUPABASE;
    if(!c?.rpc || c.__ccWorkBoundaryGuardInstalled) return false;
    const original=c.rpc.bind(c);
    c.rpc=(name,args,options)=>{
      if(name==='command_center_agent_create_project_only_session' && /first genuine Work-only execution boundary/i.test(String(args?.p_objective||''))){
        const objective=String(args.p_objective||'');
        if(!objective.includes('NEXT WORK BOUNDARY CHECKPOINT:')) args={...args,p_objective:`${objective}${CONTRACT}`,p_allow_work:false};
      }
      return original(name,args,options);
    };
    c.__ccWorkBoundaryGuardInstalled=true;
    return true;
  }

  function relabel(root=document){
    root.querySelectorAll('[data-cc-agent-mode="until-work"],[data-cc-agent-home-mode="until-work"]').forEach(button=>{
      const strong=button.querySelector('strong');
      const small=button.querySelector('small');
      if(strong) strong.textContent='Next Work Boundary';
      if(small) small.textContent='Advance + save checkpoint';
      button.setAttribute('aria-label','Advance this project to the next Work boundary and save a verified checkpoint');
      button.title='Move the project forward until Work is genuinely required, then save the exact verified handoff/checkpoint.';
    });
  }

  let raf=0;
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;installRpcGuard();relabel();});}
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('command-center:client-ready',schedule);
  window.addEventListener('load',schedule,{once:true});
  schedule();
})();
