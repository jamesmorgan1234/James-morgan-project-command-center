(() => {
  if (window.COMMAND_CENTER_PRECISE_PROGRESS?.version >= 3) return;
  const api = window.COMMAND_CENTER_PRECISE_PROGRESS = { version: 3 };
  let rows = new Map();
  let busy = false;
  let scheduled = null;

  function precise(row) {
    if (!row) return null;
    try {
      const meta = JSON.parse(row.value_text || '{}');
      const done = Number(meta.completed_weight), total = Number(meta.total_weight);
      if (Number.isFinite(done) && Number.isFinite(total) && total > 0) return Math.max(0, Math.min(100, (done / total) * 100));
    } catch {}
    const n = Number(row.value_numeric);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
  }

  const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};

  function apply() {
    const root = document.getElementById('ccApprovedApp');
    if (!root) return;
    root.querySelectorAll('[data-cc-project]').forEach(card => {
      const id = card.dataset.ccProject;
      const ring = card.querySelector('.cc-screen-ring,.cc-approved-ring');
      if (!ring) return;
      const value = precise(rows.get(id));
      const label = value === null ? 'N/A' : `${value.toFixed(1)}%`;
      const angle = `${value === null ? 0 : value * 3.6}deg`;
      if(ring.style.getPropertyValue('--cc-pct')!==angle)ring.style.setProperty('--cc-pct', angle);
      setText(ring.querySelector('b'),label);
      ring.dataset.precise=value===null?'na':String(value);
    });

    const projectId = window.history.state?.projectId || null;
    const value = precise(rows.get(projectId));
    const hero = root.querySelector('.cc-screen-project-hero .cc-screen-ring,.cc-approved-project-hero .cc-approved-ring');
    if (hero) {
      const label = value === null ? 'N/A' : `${value.toFixed(1)}%`;
      const angle = `${value === null ? 0 : value * 3.6}deg`;
      if(hero.style.getPropertyValue('--cc-pct')!==angle)hero.style.setProperty('--cc-pct',angle);
      setText(hero.querySelector('b'),label);
      hero.dataset.precise=value===null?'na':String(value);
    }
    if (projectId) {
      root.querySelectorAll('.cc-screen-kpi-grid > div,.cc-approved-kpi-grid > div').forEach(cell => {
        const label = cell.querySelector('small')?.textContent?.trim().toLowerCase();
        if (label !== 'current scope' && label !== 'progress') return;
        setText(cell.querySelector('strong'),value === null ? 'N/A' : `${value.toFixed(1)}%`);
      });
    }
  }

  async function refresh() {
    if (busy) return;
    const c = window.COMMAND_CENTER_SUPABASE;
    if (!c) return;
    busy = true;
    try {
      const { data: { session } } = await c.auth.getSession();
      if (!session?.user) return;
      const gate = await c.rpc('is_command_center_authorized');
      if (gate.error || !gate.data) return;
      const { data, error } = await c.from('analytics_project_kpis')
        .select('project_id,value_numeric,value_text,verified')
        .eq('metric_key','current_scope_progress_percent')
        .eq('verified',true);
      if (error) return;
      rows = new Map((data || []).map(row => [row.project_id,row]));
      apply();
    } finally { busy = false; }
  }

  function schedule(delay=100) {
    clearTimeout(scheduled);
    scheduled = setTimeout(() => { if (rows.size) apply(); else refresh(); }, delay);
  }

  document.addEventListener('click',event=>{if(event.target.closest?.('[data-cc-home],[data-cc-project],[data-cc-back],[data-cc-toggle]'))schedule(180);},true);
  window.addEventListener('load',()=>schedule(150),{once:true});
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('popstate',()=>schedule(100));
  window.addEventListener('command-center:client-ready',()=>schedule(100));
  window.addEventListener('command-center:approved-rendered',()=>schedule(50));
  setInterval(()=>{if(!document.hidden)refresh();},60000);
  setTimeout(()=>refresh(),500);

  api.refresh=refresh;
  api.apply=apply;
})();
