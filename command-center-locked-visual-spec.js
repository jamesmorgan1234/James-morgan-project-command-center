(() => {
  if (window.COMMAND_CENTER_LOCKED_VISUAL_SPEC?.version >= 3) return;
  const api = window.COMMAND_CENTER_LOCKED_VISUAL_SPEC = { version: 3 };

  function syncView(){
    const root=document.getElementById('ccApprovedApp');
    if(!root || document.body.classList.contains('cc-approved-legacy-open')) return;
    const view=root.dataset.ccLockedView || document.body.dataset.ccLockedView || 'home';
    root.dataset.ccLockedView=view;
    document.body.dataset.ccLockedView=view;

    root.querySelectorAll('.cc-cc-art-mountain,.cc-cc-art-road,.cc-cc-art-chart,.cc-cc-art-network,.cc-cc-art-eclipse,.cc-cc-art-castle').forEach(node=>{
      [...node.classList].filter(name=>name.startsWith('cc-cc-art-')).forEach(name=>{
        node.classList.remove(name);
        node.classList.add(name.replace('cc-cc-art-','cc-art-'));
      });
    });

    const hero=root.querySelector('.cc-screen-project-hero');
    if(hero){
      hero.classList.add('cc-approved-project-hero');
      if(hero.classList.contains('cc-art-eclipse')) hero.classList.add('art-eclipse');
    }
  }

  window.addEventListener('command-center:approved-rendered',syncView);
  window.addEventListener('command-center:client-ready',syncView);
  window.addEventListener('popstate',()=>setTimeout(syncView,0));
  window.addEventListener('load',()=>setTimeout(syncView,0),{once:true});
  api.refresh=syncView;
})();
