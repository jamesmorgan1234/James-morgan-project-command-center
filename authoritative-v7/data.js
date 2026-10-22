import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';
import { CONFIG } from './config.js';

export const client = createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const ownerFilter = (query, ownerId) => query.eq('owner_id', ownerId);
const throwIf = result => { if (result?.error) throw result.error; return result?.data; };

export async function getSession() {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

export async function signIn(email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session || null;
}

export async function signOut() {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function isAuthorized(ownerId) {
  const result = await client
    .from('cc7_owner_access')
    .select('enabled')
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data?.enabled === true;
}

export async function loadSnapshot(ownerId) {
  const [projectsResult, metricsResult, activityResult, integrationsResult, controlsResult] = await Promise.all([
    ownerFilter(client.from('cc7_projects').select('*'), ownerId).order('sort_order', { ascending: true }).order('name', { ascending: true }),
    ownerFilter(client.from('cc7_metrics').select('*'), ownerId).order('updated_at', { ascending: false }),
    ownerFilter(client.from('cc7_activity').select('*'), ownerId).order('happened_at', { ascending: false }).limit(100),
    ownerFilter(client.from('cc7_integrations').select('*'), ownerId).order('updated_at', { ascending: false }),
    ownerFilter(client.from('cc7_agent_controls').select('*'), ownerId).maybeSingle()
  ]);

  const projects = throwIf(projectsResult) || [];
  const metrics = throwIf(metricsResult) || [];
  const activity = throwIf(activityResult) || [];
  const integrations = throwIf(integrationsResult) || [];
  const controls = throwIf(controlsResult) || null;

  return {
    projects: projects.filter(p => !CONFIG.excludedProjectNames.has(p.name)),
    metrics,
    activity,
    integrations,
    controls,
    loadedAt: new Date().toISOString()
  };
}

export async function loadAgentState(ownerId) {
  const controlsResult = await ownerFilter(client.from('cc7_agent_controls').select('*'), ownerId).maybeSingle();
  const controls = throwIf(controlsResult) || null;
  const runsResult = await ownerFilter(client.from('cc7_agent_runs').select('*'), ownerId).order('created_at', { ascending: false }).limit(20);
  const runs = throwIf(runsResult) || [];
  const activeRun = controls?.current_run_id ? runs.find(r => r.id === controls.current_run_id) || null : runs.find(r => ['queued','working','paused','blocked','needs_user','work_boundary'].includes(r.status)) || null;

  let tasks = [];
  let events = [];
  let approvals = [];
  if (activeRun) {
    const [tasksResult, eventsResult, approvalsResult] = await Promise.all([
      client.from('cc7_agent_tasks').select('*').eq('run_id', activeRun.id).order('position', { ascending: true }),
      client.from('cc7_agent_events').select('*').eq('run_id', activeRun.id).order('created_at', { ascending: false }).limit(30),
      client.from('cc7_agent_approvals').select('*').eq('run_id', activeRun.id).order('created_at', { ascending: false })
    ]);
    tasks = throwIf(tasksResult) || [];
    events = throwIf(eventsResult) || [];
    approvals = throwIf(approvalsResult) || [];
  }

  const heartbeatResult = await ownerFilter(client.from('cc7_agent_runner_heartbeat').select('*'), ownerId).maybeSingle();
  const heartbeat = throwIf(heartbeatResult) || null;
  return { controls, runs, activeRun, tasks, events, approvals, heartbeat };
}

export async function setAuto(ownerId, enabled) {
  const result = await client
    .from('cc7_agent_controls')
    .update({ auto_enabled: !!enabled, updated_by: 'cc7_owner_ui', updated_at: new Date().toISOString() })
    .eq('owner_id', ownerId)
    .select('*')
    .single();
  return throwIf(result);
}

export async function createAgentRun({ ownerId, projectId = null, objective, controlMode, booksTarget = null, allowWork = false }) {
  const cleanObjective = String(objective || '').trim();
  if (!cleanObjective) throw new Error('A concrete Agent task is required.');
  const result = await client.from('cc7_agent_runs').insert({
    owner_id: ownerId,
    project_id: projectId || null,
    objective: cleanObjective,
    control_mode: controlMode,
    books_target: booksTarget || null,
    allow_work: !!allowWork,
    exact_next_action: 'Awaiting clean runner planning',
    status: 'queued'
  }).select('*').single();
  const run = throwIf(result);
  const controlResult = await client.from('cc7_agent_controls').update({
    current_run_id: run.id,
    runner_state: 'ready',
    updated_by: 'cc7_owner_ui',
    updated_at: new Date().toISOString()
  }).eq('owner_id', ownerId).select('*').single();
  throwIf(controlResult);
  return run;
}

export async function requestPause(ownerId, runId) {
  const result = await client.from('cc7_agent_runs').update({ pause_requested: true, updated_at: new Date().toISOString() }).eq('id', runId).eq('owner_id', ownerId).select('*').single();
  return throwIf(result);
}

export async function requestResume(ownerId, runId) {
  const result = await client.from('cc7_agent_runs').update({ pause_requested: false, status: 'queued', updated_at: new Date().toISOString() }).eq('id', runId).eq('owner_id', ownerId).select('*').single();
  return throwIf(result);
}

export async function requestStop(ownerId, runId) {
  const result = await client.from('cc7_agent_runs').update({ stop_requested: true, updated_at: new Date().toISOString() }).eq('id', runId).eq('owner_id', ownerId).select('*').single();
  return throwIf(result);
}

export async function resolveApproval(ownerId, approvalId, approved) {
  const result = await client.from('cc7_agent_approvals').update({
    state: approved ? 'approved' : 'declined',
    resolved_at: new Date().toISOString()
  }).eq('id', approvalId).eq('owner_id', ownerId).select('*').single();
  return throwIf(result);
}

export function subscribe(ownerId, onChange) {
  const channel = client.channel(`cc7-owner-${ownerId}`);
  for (const table of ['cc7_projects','cc7_metrics','cc7_activity','cc7_integrations','cc7_agent_controls','cc7_agent_runs','cc7_agent_tasks','cc7_agent_events','cc7_agent_approvals','cc7_agent_runner_heartbeat']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `owner_id=eq.${ownerId}` }, payload => onChange({ table, payload }));
  }
  channel.subscribe();
  return () => { client.removeChannel(channel); };
}
