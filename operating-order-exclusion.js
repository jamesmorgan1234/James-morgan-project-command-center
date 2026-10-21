(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  const excludedNames = new Set((cfg.excludedProjectNames || ['Operating Order']).map(v => String(v || '').trim().toLowerCase()));
  let client = null;
  let hiddenIds = new Set();
  let syncing = false;
  let scrubQueued = false;

  const norm = v => String(v || '').trim().toLowerCase();
  const isExcludedName = name => excludedNames.has(norm(name));
  const isAttention = p => p.attention === true || /needs|blocked|recovery|paused/i.test(p.status || '') || /needs|unverified/i.test(p.verification || '');
  const isActive = p => /active|live/i.test(p.status || '');
  const money = n => new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n || 0));

  function getClient() {
    if (window.COMMAND_CENTER_SUPABASE) return window.COMMAND_CENTER_SUPABASE;
    if (client) return client;
    if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
    return client;
  }

  function scrubDom() {
    document.querySelectorAll('[data-open],[data-continue]').forEach(el => {
      const id = el.dataset.open || el.dataset.continue;
      if (!hiddenIds.has(id)) return;
      const target = el.closest('.hub-project-card,.project-card,.revenue-row') || el;
      target.remove();
    });

    document.querySelectorAll('#revenueList .revenue-row').forEach(row => {
      const name = row.querySelector('strong')?.textContent || '';
      if (isExcludedName(name)) row.remove();
    });

    document.querySelectorAll('#activityList .list-item').forEach(item => {
      const text = norm(item.textContent);
      if ([...excludedNames].some(name => text.includes(name))) item.remove();
    });

    const detail = document.getElementById('detailPanel');
    const detailName = detail?.querySelector('.detail-title')?.textContent || '';
    if (detail && isExcludedName(detailName)) detail.replaceChildren();
  }

  function scheduleScrub() {
    if (scrubQueued) return;
    scrubQueued = true;
    requestAnimationFrame(() => { scrubQueued = false; scrubDom(); });
  }

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function updateTile(view, value, subtext) {
    const tile = document.querySelector(`.stat-button[data-view="${view}"]`);
    if (!tile) return;
    setText(tile.querySelector('.value'), value);
    if (subtext !== undefined) setText(tile.querySelector('.stat-sub'), subtext);
  }

  async function syncExclusions() {
    if (syncing) return;
    const c = getClient();
    if (!c) return;
    syncing = true;
    try {
      const { data: sessionData } = await c.auth.getSession();
      if (!sessionData?.session) return;

      const [pRes, mRes] = await Promise.all([
        c.from('projects').select('id,name,status,verification,attention'),
        c.from('metrics').select('project_id,key,verified,value_numeric')
      ]);
      if (pRes.error || mRes.error) return;

      const all = pRes.data || [];
      hiddenIds = new Set(all.filter(p => isExcludedName(p.name)).map(p => p.id));
      const visible = all.filter(p => !hiddenIds.has(p.id));
      const visibleIds = new Set(visible.map(p => p.id));
      const metrics = (mRes.data || []).filter(m => visibleIds.has(m.project_id));
      const revenue = metrics.filter(m => m.key === 'verified_revenue_usd' && m.verified && m.value_numeric !== null);
      const totalRevenue = revenue.reduce((sum,m) => sum + Number(m.value_numeric || 0), 0);
      const earningIds = new Set(revenue.filter(m => Number(m.value_numeric || 0) > 0).map(m => m.project_id));

      updateTile('all', String(visible.length));
      updateTile('active', String(visible.filter(isActive).length));
      updateTile('attention', String(visible.filter(isAttention).length), 'Highest-priority moves');
      updateTile('revenue', revenue.length ? money(totalRevenue) : 'N/A');
      updateTile('earning', String(earningIds.size), revenue.length ? `Total ${money(totalRevenue)}` : 'Revenue tracking not yet integrated');
      scrubDom();
    } finally {
      syncing = false;
    }
  }

  const observer = new MutationObserver(scheduleScrub);
  observer.observe(document.documentElement, {childList:true,subtree:true});

  window.addEventListener('load', syncExclusions, {once:true});
  document.addEventListener('commandcenter:audit-complete', () => setTimeout(syncExclusions, 150));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(syncExclusions, 250); });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-view]')) scheduleScrub();
  });
  setInterval(syncExclusions, Math.max(60000, Number(cfg.refreshMs || 60000)));
  setTimeout(syncExclusions, 250);
})();
