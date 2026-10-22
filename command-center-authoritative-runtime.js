(() => {
  if (window.COMMAND_CENTER_AUTHORITATIVE_RUNTIME) return;
  window.COMMAND_CENTER_AUTHORITATIVE_RUNTIME = { version: 1 };

  let scheduled = false;
  function enforce(){
    scheduled = false;
    if (document.body.classList.contains('cc-approved-legacy-open')) return;
    const dashboard = document.getElementById('dashboard');
    const root = document.getElementById('ccApprovedApp');
    const about = document.getElementById('ccApprovedAbout');
    if (!dashboard || !root) return;
    dashboard.hidden = false;
    root.hidden = false;
    if (about && about.parentElement !== root) root.appendChild(about);
  }
  function schedule(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enforce);
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
  window.addEventListener('load',schedule,{once:true});
  window.addEventListener('command-center:client-ready',schedule);
  setTimeout(schedule,300);
})();
