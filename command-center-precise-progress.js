(() => {
  if (window.COMMAND_CENTER_PRECISE_PROGRESS) return;
  window.COMMAND_CENTER_PRECISE_PROGRESS = { version: 1 };
  let rows = new Map();
  let busy = false;
  let scheduled = null;

  function precise(row) {
    if (!row) return null;
    try {
      const meta = JSON.parse(row.value_text || '{}');
      const done = Number(meta.completed_weight), total = Number(meta.total_weight);
      if (Number.isFinite(done) && Number.isFinite(total) && total > 0) {
        const value = Math.max(0, Math.min(100, (done / total) * 100));
        return Math.round(value * 10) / 10;
      }
    } catch {}
    const n = Number(row.value_numeric);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n * 10) / 10)) : null;
  }

  function apply() {
    const root = document.getElementById('ccApprovedApp');
    if (!root) return;
    root.querySelectorAll('[data-cc-project]').forEach(card => {
      const id = card.dataset.ccProject;
      const ring = card.querySelector('.cc-approved-ring');
      if (!ring) return;
      const value = precise(rows.get(id));
      const label = value === null ? 'N/A' : `${value.toFixed(1)}%`;
      ring.style.setProperty('--cc-pct', `${value === null ? 0 : value * 3.6}deg`);
      const text = ring.querySelector('b');
      if (text) text.textContent = label;
      ring.dataset.precise = value === null ? 'na' : String(value);
    });

    const projectId = window.history.state?.projectId || null;
    const value = precise(rows.get(projectId));
    const hero = root.querySelector('.cc-approved-project-hero .cc-approved-ring');
    if (hero && value !== null) {
      hero.style.setProperty('--cc-pct', `${value * 3.6}deg`);
      const text = hero.querySelector('b');
      if (text) text.textContent = `${value.toFixed(1)}%`;
      hero.dataset.precise = String(value);
    }
    if (projectId) {
      root.querySelectorAll('.cc-approved-kpi-grid > div').forEach(cell => {
        const label = cell.querySelector('small')?.textContent?.trim().toLowerCase();
        if (label !== 'current scope' && label !== 'progress') return;
        const out = cell.querySelector('strong');
        if (out) out.textContent = value === null ? 'N/A' : `${value.toFixed(1)}%`;
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

  function schedule() {
    clearTimeout(scheduled);
    scheduled = setTimeout(() => { if (rows.size) apply(); else refresh(); }, 40);
  }

  const rootObserver = new MutationObserver(schedule);
  const attach = () => {
    const root = document.getElementById('ccApprovedApp');
    if (!root || root.dataset.preciseObserved === '1') return;
    root.dataset.preciseObserved = '1';
    rootObserver.observe(root,{childList:true,subtree:true});
    schedule();
  };
  const bootObserver = new MutationObserver(attach);
  bootObserver.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('popstate',schedule);
  setInterval(()=>{if(!document.hidden)refresh();},60000);
  attach();refresh();
})();