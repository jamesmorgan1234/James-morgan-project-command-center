(() => {
  if (window.COMMAND_CENTER_LOCKED_VISUAL_SPEC?.version >= 2) return;
  const api = window.COMMAND_CENTER_LOCKED_VISUAL_SPEC = { version: 2 };

  function syncView(){
    const root=document.getElementById('ccApprovedApp');
    if(!root || document.body.classList.contains('cc-approved-legacy-open')) return;
    const view=root.dataset.ccLockedView || document.body.dataset.ccLockedView || 'home';
    root.dataset.ccLockedView=view;
    document.body.dataset.ccLockedView=view;
  }

  window.addEventListener('command-center:approved-rendered',syncView);
  window.addEventListener('command-center:client-ready',syncView);
  window.addEventListener('popstate',()=>setTimeout(syncView,0));
  window.addEventListener('load',()=>setTimeout(syncView,0),{once:true});
  api.refresh=syncView;
})();
