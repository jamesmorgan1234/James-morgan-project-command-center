(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  const $ = id => document.getElementById(id);
  let client = null;
  let cache = { projects: [], metrics: [] };
  let loading = null;
  let decorating = false;
  let timer = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
  const norm = value => String(value || '').trim().toLowerCase();

  const CORE_PIPELINE = [
    {
      key: 'project-brain',
      icon: '✦',
      title: 'Project Brain',
      summary: 'Project-specific context, rules, decisions, brainstorms, notes, blockers, next actions, history, and reusable prompt/context packaging.'
    },
    {
      key: 'automation',
      icon: '⚡',
      title: 'Automation',
      summary: 'Recurring checks, scheduled jobs, condition triggers, queues, retries, and verified project handoffs.'
    },
    {
      key: 'integrations',
      icon: '⌁',
      title: 'Integrations',
      summary: 'Authorized project connections with useful connection state in the UI while credentials and source plumbing stay hidden.'
    },
    {
      key: 'analytics',
      icon: '◫',
      title: 'Analytics',
      summary: 'Verified trends, comparisons, alerts, and decision support without duplicating raw metrics throughout the screen.'
    },
    {
      key: 'security',
      icon: '⬡',
      title: 'Security',
      summary: 'Project-specific permission, credential, access, privacy, and safety controls as capabilities become more connected.'
    },
    {
      key: 'deployment',
      icon: '▲',
      title: 'Deployment',
      summary: 'Controlled release, publishing, hosting, verification, rollback, and environment state when the project needs deployment tooling.'
    },
    {
      key: 'agent-mode',
      icon: '◎',
      title: 'Agent Mode',
      summary: 'Long-term controlled execution layer built only after planning, permissions, actions, verification, and audit foundations are ready.'
    }
  ];

  const SPECIAL_PIPELINE = {
    publishing: {
      key: 'publishing', icon: '▤', title: 'Publishing',
      summary: 'Publication readiness, format state, submission sequencing, KDP Select state, and publication verification.'
    },
    commerce: {
      key: 'commerce-operations', icon: '◇', title: 'Commerce Operations',
      summary: 'Catalog, sourcing, pricing, margin, fulfillment, merchandising, and order operations.'
    },
    content: {
      key: 'content-engine', icon: '▶', title: 'Content Engine',
      summary: 'Capture, creation/editing, scheduling, publishing, and performance feedback loops.'
    }
  };

  async function getClient() {
    if (client) return client;
    if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return client;
  }

  async function load(force = false) {
    if (!force && cache.projects.length) return cache;
    if (loading) return loading;
    loading = (async () => {
      const c = await getClient();
      if (!c) return cache;
      const { data: { session } } = await c.auth.getSession();
      if (!session) return cache;
      const [p, m] = await Promise.all([
        c.from('projects').select('id,name,category,status,stage,verification,next_action,blocker'),
        c.from('metrics').select('project_id,key,label,value_numeric,value_text,unit,verified,source,updated_at').order('updated_at', { ascending: false })
      ]);
      if (!p.error && !m.error) cache = { projects: p.data || [], metrics: m.data || [] };
      return cache;
    })().finally(() => { loading = null; });
    return loading;
  }

  function currentProject() {
    const name = $('detailPanel')?.querySelector('.detail-title')?.textContent?.trim();
    if (!name) return null;
    return cache.projects.find(p => norm(p.name) === norm(name)) || null;
  }

  function pipelineFor(project) {
    const id = norm(project?.id);
    const name = norm(project?.name);
    const category = norm(project?.category);
    const lanes = [...CORE_PIPELINE];

    if (/^kdp-|book|cookbook|workbook|coloring/.test(`${id} ${name} ${category}`)) {
      lanes.splice(1, 0, SPECIAL_PIPELINE.publishing);
    }
    if (/shopify|commerce|store|garage|coupon|margin|zendrop|cjdrop/.test(`${id} ${name} ${category}`)) {
      lanes.splice(2, 0, SPECIAL_PIPELINE.commerce);
    }
    if (/veloclip|mini-movie|fanvue|content|video|media/.test(`${id} ${name} ${category}`)) {
      lanes.splice(2, 0, SPECIAL_PIPELINE.content);
    }

    return lanes;
  }

  function pipelineRow(lane) {
    return `<div class="ccv4-pipeline-item" data-capability="${esc(lane.key)}">
      <button class="ccv4-pipeline-row" type="button" aria-expanded="false">
        <span class="ccv4-pipeline-icon" aria-hidden="true">${esc(lane.icon)}</span>
        <span class="ccv4-pipeline-copy">
          <strong>${esc(lane.title)}</strong>
          <small>Planned capability · ready to build when useful</small>
        </span>
        <span class="ccv4-ring" style="--ccv4-progress:0" role="img" aria-label="${esc(lane.title)}: 0 percent"><b>0%</b></span>
      </button>
      <div class="ccv4-pipeline-plan" hidden>
        <p>${esc(lane.summary)}</p>
        <div class="ccv4-plan-state"><span>Pipeline state</span><strong>Not started</strong></div>
        <small>This 0% roadmap lane does not reduce the project's verified current-scope progress. It becomes part of tracked scope only after it is intentionally activated with a real completion definition.</small>
      </div>
    </div>`;
  }

  function renderPipeline(project) {
    const detail = $('detailPanel');
    if (!detail || detail.hidden || !project) return;
    const signature = pipelineFor(project).map(x => x.key).join('|');
    let panel = $('ccv4CapabilityPipeline');
    if (panel?.dataset.projectId === project.id && panel.dataset.signature === signature) return;
    panel?.remove();

    const lanes = pipelineFor(project);
    const html = `<section id="ccv4CapabilityPipeline" class="ccv4-control-panel" data-project-id="${esc(project.id)}" data-signature="${esc(signature)}">
      <div class="ccv4-panel-heading">
        <div>
          <span>BUILD PIPELINE</span>
          <h3>Command Center capabilities</h3>
          <p>These buttons are the roadmap. A 0% circle means the capability is planned but not started yet.</p>
        </div>
        <span class="ccv4-roadmap-badge">Modular</span>
      </div>
      <div class="ccv4-pipeline-list">${lanes.map(pipelineRow).join('')}</div>
    </section>`;

    const publication = $('ccv4PublicationStatus');
    const bookPanel = $('bookRevenuePanel');
    const performance = $('projectPerformancePanel');
    const current = detail.querySelector('.hub-current-state');
    const anchor = publication || bookPanel || performance || current || detail.querySelector('.project-meta');
    if (anchor) anchor.insertAdjacentHTML('afterend', html);
  }

  function safeJson(value) {
    try {
      const parsed = JSON.parse(String(value || ''));
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function formatState(value) {
    const s = norm(value);
    if (!s) return { label: 'N/A', cls: 'na' };
    if (/live|published|complete|enrolled|active|verified/.test(s) && !/not |unpublished/.test(s)) return { label: 'Published', cls: 'yes' };
    if (/pending|review|processing|submitted/.test(s)) return { label: 'Pending', cls: 'pending' };
    if (/not published|unpublished|not started|planned|not submitted/.test(s)) return { label: 'Not Published', cls: 'no' };
    if (/not applicable|n\/a|excluded|no kindle/.test(s)) return { label: 'N/A', cls: 'na' };
    return { label: String(value).replaceAll('_', ' '), cls: 'na' };
  }

  function formatFromMeta(meta, key) {
    const formats = meta?.formats && typeof meta.formats === 'object' ? meta.formats : {};
    const direct = formats[key] ?? meta?.[key] ?? null;
    if (direct !== null && direct !== undefined) return formatState(direct);
    const status = norm(meta?.publication_status);
    if (key === 'kindle' && /kindle[^.;,]*(live|published)/.test(status)) return { label: 'Published', cls: 'yes' };
    if (key === 'paperback' && /paperback[^.;,]*(live|published)/.test(status)) return { label: 'Published', cls: 'yes' };
    if (key === 'hardcover' && /hardcover[^.;,]*(live|published)/.test(status)) return { label: 'Published', cls: 'yes' };
    return { label: 'N/A', cls: 'na' };
  }

  function publicationBooks(projectId) {
    return cache.metrics
      .filter(m => m.project_id === projectId && /^bookmap\.[^.]+\.metadata$/i.test(String(m.key || '')) && m.verified === true)
      .map(m => ({ metric: m, meta: safeJson(m.value_text) }))
      .filter(x => x.meta?.title)
      .sort((a, b) => (Number(a.meta.series_order) || 9999) - (Number(b.meta.series_order) || 9999));
  }

  function statusPill(state) {
    return `<span class="ccv4-pub-state is-${esc(state.cls)}">${esc(state.label)}</span>`;
  }

  function renderPublicationStatus(project) {
    const detail = $('detailPanel');
    if (!detail || !project || !/^kdp-/i.test(project.id)) {
      $('ccv4PublicationStatus')?.remove();
      return;
    }
    const books = publicationBooks(project.id);
    const signature = books.map(x => `${x.meta.title}:${x.metric.updated_at || ''}`).join('|');
    const existing = $('ccv4PublicationStatus');
    if (existing?.dataset.projectId === project.id && existing.dataset.signature === signature) return;
    existing?.remove();

    const rows = books.length ? books.map(({ meta }) => {
      const kindle = formatFromMeta(meta, 'kindle');
      const paperback = formatFromMeta(meta, 'paperback');
      const hardcover = formatFromMeta(meta, 'hardcover');
      const select = formatState(meta.kdp_select);
      return `<div class="ccv4-pub-row">
        <strong>${esc(meta.title)}</strong>
        <div class="ccv4-pub-formats">
          <span><small>Kindle</small>${statusPill(kindle)}</span>
          <span><small>KDP Select</small>${statusPill(select)}</span>
          <span><small>Paperback</small>${statusPill(paperback)}</span>
          <span><small>Hardcover</small>${statusPill(hardcover)}</span>
        </div>
      </div>`;
    }).join('') : '<div class="ccv4-empty">No verified per-book publication mapping is available yet.</div>';

    const html = `<section id="ccv4PublicationStatus" class="ccv4-utility-panel" data-project-id="${esc(project.id)}" data-signature="${esc(signature)}">
      <details>
        <summary><span><b>Publication Status</b><small>Kindle · KDP Select · Paperback · Hardcover</small></span><strong>${books.length || 'N/A'}</strong></summary>
        <div class="ccv4-pub-list">${rows}</div>
      </details>
    </section>`;
    const bookPanel = $('bookRevenuePanel');
    const anchor = bookPanel || $('projectPerformancePanel') || detail.querySelector('.hub-current-state') || detail.querySelector('.project-meta');
    anchor?.insertAdjacentHTML('afterend', html);
  }

  function hideInternalBlocks() {
    const detail = $('detailPanel');
    if (!detail) return;
    [...detail.querySelectorAll('.block')].forEach(block => {
      const heading = norm(block.querySelector('h3')?.textContent);
      if (heading === 'private kpis' || heading.includes('source metadata') || heading.includes('checkpoint mechanics')) {
        block.hidden = true;
        block.dataset.ccv4Internal = 'hidden';
      }
    });
  }

  function compactBlock(block, label) {
    if (!block || block.dataset.ccv4Compact === '1') return;
    const heading = block.querySelector('h3');
    if (!heading) return;
    const nodes = [...block.childNodes].filter(node => node !== heading);
    const details = document.createElement('details');
    details.className = 'ccv4-compact-details';
    const summary = document.createElement('summary');
    summary.innerHTML = `<span><b>${esc(label)}</b><small>Tap to view details</small></span><strong>View</strong>`;
    details.appendChild(summary);
    const body = document.createElement('div');
    body.className = 'ccv4-compact-body';
    nodes.forEach(node => body.appendChild(node));
    details.appendChild(body);
    block.replaceChildren(details);
    block.classList.add('ccv4-compact-block');
    block.dataset.ccv4Compact = '1';
  }

  function compactUtilities() {
    const detail = $('detailPanel');
    if (!detail) return;
    [...detail.querySelectorAll('.block')].forEach(block => {
      const heading = norm(block.querySelector('h3')?.textContent);
      if (heading === 'tracking integrations') compactBlock(block, 'Tracking Integrations');
      if (heading === 'recent updates') compactBlock(block, 'Recent Updates');
      if (heading === 'update project information') compactBlock(block, 'Update Project Information');
    });

    const snapshot = $('kdpSnapshotPanel');
    if (snapshot && snapshot.dataset.ccv4Compact !== '1') {
      const content = [...snapshot.childNodes];
      const details = document.createElement('details');
      details.className = 'ccv4-compact-details';
      const summary = document.createElement('summary');
      summary.innerHTML = '<span><b>KDP Snapshot History</b><small>Historical verified checks</small></span><strong>View history</strong>';
      details.appendChild(summary);
      const body = document.createElement('div');
      body.className = 'ccv4-compact-body';
      content.forEach(node => body.appendChild(node));
      details.appendChild(body);
      snapshot.replaceChildren(details);
      snapshot.dataset.ccv4Compact = '1';
    }
  }

  function hashText(text) {
    let hash = 5381;
    for (const ch of String(text || '')) hash = ((hash << 5) + hash) ^ ch.charCodeAt(0);
    return (hash >>> 0).toString(36);
  }

  function dismissStore() {
    try { return JSON.parse(localStorage.getItem('ccv4-dismissed-notices') || '{}') || {}; }
    catch { return {}; }
  }

  function noticeSignature(card) {
    return hashText(card.textContent.replace(/\s+/g, ' ').trim());
  }

  function wireSwipeDismiss(card) {
    if (!card || card.dataset.ccv4Swipe === '1') return;
    card.dataset.ccv4Swipe = '1';
    card.classList.add('ccv4-swipe-card');
    const key = card.id || card.dataset.noticeType || 'notice';
    let signature = noticeSignature(card);
    const stored = dismissStore();
    if (stored[key] === signature) card.hidden = true;

    let startX = 0, startY = 0, dx = 0, axis = null, active = false;
    card.addEventListener('pointerdown', event => {
      startX = event.clientX; startY = event.clientY; dx = 0; axis = null; active = true;
      card.classList.add('is-dragging');
      try { card.setPointerCapture(event.pointerId); } catch {}
    });
    card.addEventListener('pointermove', event => {
      if (!active) return;
      const x = event.clientX - startX;
      const y = event.clientY - startY;
      if (!axis && Math.max(Math.abs(x), Math.abs(y)) > 10) axis = Math.abs(x) > Math.abs(y) ? 'horizontal' : 'vertical';
      if (axis !== 'horizontal') return;
      dx = x;
      const width = Math.max(1, card.offsetWidth);
      card.style.transform = `translate3d(${dx}px,0,0)`;
      card.style.opacity = String(Math.max(.22, 1 - Math.abs(dx) / width));
    });
    const finish = event => {
      if (!active) return;
      active = false;
      card.classList.remove('is-dragging');
      const threshold = Math.max(64, Math.min(120, card.offsetWidth * .22));
      if (axis === 'horizontal' && Math.abs(dx) >= threshold) {
        signature = noticeSignature(card);
        const map = dismissStore();
        map[key] = signature;
        localStorage.setItem('ccv4-dismissed-notices', JSON.stringify(map));
        const direction = dx < 0 ? -1 : 1;
        card.style.transform = `translate3d(${direction * 120}%,0,0)`;
        card.style.opacity = '0';
        setTimeout(() => { card.hidden = true; card.style.transform = ''; card.style.opacity = ''; }, 210);
      } else {
        card.style.transform = '';
        card.style.opacity = '';
      }
      axis = null; dx = 0;
      try { card.releasePointerCapture(event.pointerId); } catch {}
    };
    card.addEventListener('pointerup', finish);
    card.addEventListener('pointercancel', finish);

    const observer = new MutationObserver(() => {
      const next = noticeSignature(card);
      if (next === signature) return;
      signature = next;
      const map = dismissStore();
      if (map[key] !== next) card.hidden = false;
    });
    observer.observe(card, { childList: true, subtree: true, characterData: true });
  }

  function wireNotices() {
    wireSwipeDismiss($('canonicalAuditPanel'));
    wireSwipeDismiss($('sourceHealthPanel'));
  }

  function applyBrand() {
    document.documentElement.dataset.commandCenterTheme = 'v4';
    const icon = document.querySelector('.brand-icon');
    if (icon && !/command-center-icon-v4\.svg$/.test(icon.getAttribute('src') || '')) icon.src = './command-center-icon-v4.svg';
  }

  function wirePipelineButtons() {
    document.querySelectorAll('.ccv4-pipeline-row:not([data-ccv4-wired])').forEach(button => {
      button.dataset.ccv4Wired = '1';
      button.addEventListener('click', () => {
        const plan = button.closest('.ccv4-pipeline-item')?.querySelector('.ccv4-pipeline-plan');
        if (!plan) return;
        const opening = plan.hidden;
        plan.hidden = !opening;
        button.setAttribute('aria-expanded', String(opening));
      });
    });
  }

  async function decorate(force = false) {
    if (decorating) return;
    decorating = true;
    try {
      applyBrand();
      wireNotices();
      await load(force);
      const project = currentProject();
      if (project) {
        hideInternalBlocks();
        compactUtilities();
        renderPublicationStatus(project);
        renderPipeline(project);
        wirePipelineButtons();
        hideInternalBlocks();
        compactUtilities();
      }
    } finally {
      decorating = false;
    }
  }

  function queue(force = false, delay = 70) {
    clearTimeout(timer);
    timer = setTimeout(() => decorate(force), delay);
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-open],[data-continue],[data-hub-back],[data-books-group],[data-books-back],[data-view]')) queue(false, 90);
    if (event.target.closest('#refreshBtn')) {
      setTimeout(() => queue(true, 0), 900);
      setTimeout(() => queue(true, 0), 3000);
    }
  });

  const observer = new MutationObserver(() => {
    wireNotices();
    if (!decorating) queue(false, 80);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => queue(true, 0), { once: true });
  } else {
    queue(true, 0);
  }
})();
