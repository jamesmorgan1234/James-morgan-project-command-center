(() => {
  if (window.COMMAND_CENTER_AUTHORITATIVE_RUNTIME?.version >= 2) return;
  const api = window.COMMAND_CENTER_AUTHORITATIVE_RUNTIME = { version: 2 };
  let timer = null;

  function enforce(){
    if (document.body.classList.contains('cc-approved-legacy-open')) return;
    const dashboard = document.getElementById('dashboard');
    const root = document.getElementById('ccApprovedApp');
    if (!dashboard || !root) return;
    dashboard.hidden = false;
    root.hidden = false;
    const about = document.getElementById('ccApprovedAbout');
    if (about && about.parentElement !== root) root.appendChild(about);
  }

  function schedule(delay=0){
    clearTimeout(timer);
    timer = setTimeout(() => requestAnimationFrame(enforce), delay);
  }

  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-cc-home],[data-cc-project],[data-cc-back],[data-cc-about-close]')) schedule(100);
  }, true);
  window.addEventListener('load', () => schedule(120), { once: true });
  window.addEventListener('popstate', () => schedule(80));
  window.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(60); });
  window.addEventListener('command-center:client-ready', () => schedule(60));
  window.addEventListener('command-center:approved-rendered', () => schedule(0));
  [250,700,1400].forEach(ms => setTimeout(() => schedule(0), ms));

  api.enforce = enforce;
  api.refresh = () => schedule(0);
})();