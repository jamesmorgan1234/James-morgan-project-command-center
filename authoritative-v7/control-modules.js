const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const pretty = value => String(value || 'N/A').replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase());
const fmtDate = value => { if (!value) return 'N/A'; const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString(); };
const fmtValue = row => {
  if (!row || row.verified === false) return 'N/A';
  if (row.value_numeric !== null && row.value_numeric !== undefined) {
    if (row.currency === 'USD' || row.unit === 'USD') return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(row.value_numeric));
    return `${row.value_numeric}${row.unit === 'percent' ? '%' : row.unit ? ` ${row.unit}` : ''}`;
  }
  return row.value_text || 'N/A';
};
const projectName = (projects,id) => projects.find(p => p.id === id)?.name || (id ? 'Tracked project' : 'Portfolio');

function stat(label,value,sub='') {
  return `<div class="cc-metric"><div><strong>${esc(value)}</strong><span>${esc(label)}</span>${sub ? `<span>${esc(sub)}</span>` : ''}</div></div>`;
}
function item(title,body,meta='') {
  return `<div class="cc-module-item"><strong>${esc(title)}</strong>${body ? `<p>${esc(body)}</p>` : ''}${meta ? `<small>${esc(meta)}</small>` : ''}</div>`;
}
function section(title,body,note='') {
  return `<section class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title">${esc(title)}</div>${note ? `<span class="cc-section-note">${esc(note)}</span>` : ''}</div>${body}</section>`;
}
function empty(text) { return `<div class="cc-empty">${esc(text)}</div>`; }

function brain(modules,projects) {
  const memories = modules.brainItems.filter(x => x.kind === 'memory');
  const contexts = modules.brainItems.filter(x => x.kind === 'context');
  const brainstorms = modules.brainItems.filter(x => x.kind === 'brainstorm');
  const activeTasks = modules.brainTasks.filter(x => !['completed','done','archived'].includes(String(x.status).toLowerCase()));
  const summary = `<div class="cc-metrics">${stat('Memories',memories.length)}${stat('Context packets',contexts.length)}${stat('Brainstorms',brainstorms.length)}${stat('Plans',modules.brainPlans.length)}${stat('Open tasks',activeTasks.length)}${stat('Projects represented',new Set(modules.brainItems.map(x=>x.project_id).filter(Boolean)).size)}</div>`;
  const plans = modules.brainPlans.length ? modules.brainPlans.slice(0,8).map(p => item(p.title,p.objective,`${projectName(projects,p.project_id)} • ${pretty(p.status)}`)).join('') : empty('No clean Brain plans are recorded.');
  const tasks = activeTasks.length ? activeTasks.slice(0,12).map(t => item(t.title,t.details,`${projectName(projects,t.project_id)} • ${pretty(t.status)}`)).join('') : empty('No open Brain tasks are recorded.');
  const recent = modules.brainItems.length ? modules.brainItems.slice(0,12).map(x => item(x.title,x.body,`${pretty(x.kind)} • ${projectName(projects,x.project_id)} • ${pretty(x.status)}`)).join('') : empty('No clean Brain items are recorded.');
  return section('BRAIN OVERVIEW',summary,'Verified clean data') + section('PLANS',plans) + section('OPEN TASKS',tasks) + section('RECENT CONTEXT',recent);
}

function automation(modules,projects) {
  const active = modules.automations.filter(x => ['active','enabled','scheduled','running'].includes(String(x.status).toLowerCase()));
  const upcoming = modules.automations.filter(x => x.next_run_at).sort((a,b)=>new Date(a.next_run_at)-new Date(b.next_run_at));
  const unread = modules.notifications.filter(x => !x.read_at && !['archived','dismissed'].includes(String(x.status).toLowerCase()));
  const summary = `<div class="cc-metrics">${stat('Automations',modules.automations.length)}${stat('Active',active.length)}${stat('Unread notices',unread.length)}</div>`;
  const rows = modules.automations.length ? modules.automations.slice(0,16).map(a => item(a.name,a.description,`${pretty(a.kind)} • ${pretty(a.status)}${a.next_run_at ? ` • next ${fmtDate(a.next_run_at)}` : ''}${a.project_id ? ` • ${projectName(projects,a.project_id)}` : ''}`)).join('') : empty('No clean Command Center automation records are active. Agent AUTO is separate and controlled from the Agent screen.');
  const notices = unread.length ? unread.slice(0,10).map(n => item(n.title,n.message,`${pretty(n.severity)} • ${fmtDate(n.created_at)}`)).join('') : empty('No unread Command Center automation notifications.');
  return section('AUTOMATION OVERVIEW',summary) + section('SCHEDULES / CONDITIONS / WORKFLOWS',rows,upcoming[0]?.next_run_at ? `Next ${fmtDate(upcoming[0].next_run_at)}` : 'No scheduled run') + section('NOTIFICATIONS',notices);
}

function integrations(modules,projects,basic) {
  const healthy = modules.connections.filter(x => ['connected','healthy','active','verified'].includes(String(x.status).toLowerCase()));
  const summary = `<div class="cc-metrics">${stat('Provider connections',modules.connections.length)}${stat('Healthy / connected',healthy.length)}${stat('Tracked source records',basic.length)}</div>`;
  const connections = modules.connections.length ? modules.connections.map(c => item(c.provider_label,c.account_label,`${projectName(projects,c.project_id)} • ${pretty(c.status)} • read ${c.read_enabled?'on':'off'} • write ${c.write_enabled?'on':'off'}`)).join('') : empty('No clean provider connection records are currently active. Existing tracked source requirements are shown below without pretending an account is connected.');
  const requirements = basic.length ? basic.slice(0,24).map(i => item(i.provider || i.metric_label || 'Source',i.metric_label || i.metric_key,`${projectName(projects,i.project_id)} • ${pretty(i.status)}`)).join('') : empty('No tracked integration requirements.');
  return section('INTEGRATION OVERVIEW',summary) + section('LIVE CONNECTIONS',connections) + section('TRACKED SOURCES',requirements);
}

function analytics(modules,projects) {
  const verified = modules.kpis.filter(x => x.verified === true);
  const projectCount = new Set(verified.map(x=>x.project_id).filter(Boolean)).size;
  const openGoals = modules.goals.filter(x => !['completed','closed','archived'].includes(String(x.status).toLowerCase()));
  const openAnomalies = modules.anomalies.filter(x => !['resolved','closed','dismissed'].includes(String(x.status).toLowerCase()));
  const summary = `<div class="cc-metrics">${stat('Verified KPI rows',verified.length)}${stat('Projects covered',projectCount)}${stat('Open goals',openGoals.length)}${stat('Open anomalies',openAnomalies.length)}</div>`;
  const latestByProject = [];
  const seen = new Set();
  for (const k of verified) {
    const key = `${k.project_id}:${k.metric_key}`;
    if (seen.has(key)) continue;
    seen.add(key);
    latestByProject.push(k);
    if (latestByProject.length >= 20) break;
  }
  const kpis = latestByProject.length ? latestByProject.map(k => item(k.label,fmtValue(k),`${projectName(projects,k.project_id)} • observed ${fmtDate(k.observed_at)}`)).join('') : empty('No verified clean analytics KPIs are available.');
  const anomalies = openAnomalies.length ? openAnomalies.slice(0,10).map(a => item(a.metric_key,`${a.previous_value ?? 'N/A'} → ${a.current_value ?? 'N/A'}`,`${projectName(projects,a.project_id)} • ${pretty(a.status)} • ${a.delta_percent ?? 'N/A'}%`)).join('') : empty('No open analytics anomalies.');
  return section('ANALYTICS OVERVIEW',summary,'Verified values only') + section('LATEST VERIFIED KPIS',kpis) + section('ANOMALIES',anomalies);
}

function security(modules,projects) {
  const pending = modules.authorizations.filter(x => ['required','pending'].includes(String(x.status).toLowerCase()));
  const openAlerts = modules.alerts.filter(x => !['resolved','closed'].includes(String(x.status).toLowerCase()));
  const allows = modules.permissions.filter(x => x.effect === 'allow' && String(x.status).toLowerCase() === 'active');
  const summary = `<div class="cc-metrics">${stat('Active permissions',allows.length)}${stat('Pending authorizations',pending.length)}${stat('Open alerts',openAlerts.length)}</div>`;
  const permissions = modules.permissions.length ? modules.permissions.slice(0,20).map(p => item(p.permission_key,`${pretty(p.effect)} • ${pretty(p.status)}`,`${p.project_id ? projectName(projects,p.project_id) : 'Global'} • ${p.principal_type}`)).join('') : empty('No clean security permissions recorded.');
  const auth = pending.length ? pending.map(a => item(a.action_key,a.reason,`${pretty(a.risk_level)} • ${pretty(a.status)} • ${a.expires_at ? `expires ${fmtDate(a.expires_at)}` : 'no expiry recorded'}`)).join('') : empty('No pending protected-action authorizations.');
  const alerts = openAlerts.length ? openAlerts.map(a => item(a.title,a.message,`${pretty(a.severity)} • ${pretty(a.status)}`)).join('') : empty('No open clean security alerts.');
  return section('SECURITY OVERVIEW',summary) + section('PERMISSIONS',permissions) + section('AUTHORIZATION GATES',auth) + section('ALERTS',alerts);
}

function deployment(modules) {
  const latest = modules.releases[0] || null;
  const checks = latest ? modules.deploymentChecks.filter(c => c.release_id === latest.id) : [];
  const passed = checks.filter(c => ['passed','success','healthy','verified'].includes(String(c.status).toLowerCase())).length;
  const failed = checks.filter(c => ['failed','error','unhealthy','blocked'].includes(String(c.status).toLowerCase())).length;
  const summary = `<div class="cc-metrics">${stat('Releases',modules.releases.length)}${stat('Latest checks',checks.length)}${stat('Passing',passed)}${stat('Failing',failed)}${stat('Rollback records',modules.rollbacks.length)}</div>`;
  const releases = modules.releases.length ? modules.releases.slice(0,10).map(r => item(r.release_key,`${r.repository || ''} ${r.source_commit || ''}`.trim(),`${pretty(r.environment)} • ${pretty(r.status)} • ${r.known_good?'known good':'not marked known good'} • ${fmtDate(r.verified_at || r.deployed_at)}`)).join('') : empty('No clean deployment release records are available.');
  const validations = checks.length ? checks.slice(0,30).map(c => item(c.check_key,pretty(c.status),`${pretty(c.check_kind)} • ${fmtDate(c.checked_at)}`)).join('') : empty('No checks are attached to the latest clean release record.');
  return section('DEPLOYMENT OVERVIEW',summary,latest ? latest.release_key : 'No release') + section('RELEASE HISTORY',releases) + section('LATEST RELEASE CHECKS',validations);
}

export function renderControlModule(view, modules, projects, basicIntegrations = []) {
  if (!modules) return empty('Control-module data has not loaded yet.');
  if (view === 'brain') return brain(modules,projects);
  if (view === 'automation') return automation(modules,projects);
  if (view === 'integrations') return integrations(modules,projects,basicIntegrations);
  if (view === 'analytics') return analytics(modules,projects);
  if (view === 'security') return security(modules,projects);
  if (view === 'deployment') return deployment(modules);
  return section('ADVANCED',`<p class="cc-desc">Clean-room Command Center V7 is isolated from legacy UI/runtime dependencies. Technical diagnostics stay here rather than cluttering the normal interface.</p>`);
}
