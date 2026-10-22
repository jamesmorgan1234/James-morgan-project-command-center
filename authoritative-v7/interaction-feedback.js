const RESTORE_MS=30000;

function markButtonBusy(button,label){
  if(!button||button.dataset.ccBusy==='true')return;
  const strong=button.querySelector('strong');
  const originalLabel=strong?.textContent||'';
  button.dataset.ccBusy='true';
  button.setAttribute('aria-busy','true');
  button.disabled=true;
  if(strong)strong.textContent=label;
  const restore=()=>{
    if(!button.isConnected||button.dataset.ccBusy!=='true')return;
    button.dataset.ccBusy='false';
    button.removeAttribute('aria-busy');
    button.disabled=false;
    if(strong)strong.textContent=originalLabel;
  };
  setTimeout(restore,RESTORE_MS);
}

document.addEventListener('click',event=>{
  const checkpoint=event.target.closest?.('[data-agent-create="project_checkpoint"]');
  if(checkpoint){
    markButtonBusy(checkpoint,'Checking…');
    return;
  }

  const refresh=event.target.closest?.('[data-agent-action="refresh"]');
  if(refresh){
    markButtonBusy(refresh,'Refreshing…');
    return;
  }

  const action=event.target.closest?.('[data-agent-action="pause"],[data-agent-action="resume"],[data-agent-action="stop"]');
  if(action){
    const labels={pause:'Pausing…',resume:'Resuming…',stop:'Stopping…'};
    markButtonBusy(action,labels[action.dataset.agentAction]||'Working…');
  }
},true);
