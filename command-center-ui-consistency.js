(() => {
  const $ = id => document.getElementById(id);
  let scheduled = false;

  function placeBrainInline() {
    const stats = $('stats');
    const button = $('ccBrainHomeButton');
    const roadmap = $('ccBrainHomeRoadmap');
    const shell = $('dashboardViewShell');
    const stack = $('dashboardStack');
    if (!stats || !button) return;

    button.style.setProperty('order','35','important');
    if (!roadmap) {
      button.classList.remove('is-open');
      button.setAttribute('aria-expanded','false');
      return;
    }

    stats.hidden = false;
    button.hidden = false;
    button.classList.add('is-open');
    button.setAttribute('aria-expanded','true');
    roadmap.classList.add('cc-brain-inline-roadmap');
    roadmap.style.setProperty('order','36','important');

    if (stack && roadmap.parentElement !== stack) {
      stack.insertBefore(roadmap, shell || null);
    }
    if (shell) shell.hidden = true;
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      placeBrainInline();
    });
  }

  window.addEventListener('command-center:brain-open', () => {
    placeBrainInline();
    schedule();
    setTimeout(placeBrainInline, 0);
  });

  const stats = $('stats');
  if (stats) new MutationObserver(schedule).observe(stats,{childList:true});
  const shell = $('dashboardViewShell');
  if (shell) new MutationObserver(schedule).observe(shell,{attributes:true,attributeFilter:['hidden']});

  window.addEventListener('popstate',schedule);
  window.addEventListener('load',() => { placeBrainInline(); setTimeout(placeBrainInline,180); },{once:true});
  placeBrainInline();
})();
