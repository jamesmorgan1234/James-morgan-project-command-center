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
  const result = await client.from('cc7_owner_access').select('enabled').eq('owner_id', ownerId).maybeSingle();
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
  return {
    projects: projects.filter(p => !CONFIG.excludedProjectNames.has(p.name)),
    metrics: throwIf(metricsResult) || [],
    activity: throwIf(activityResult) || [],
    integrations: throwIf(integrationsResult) || [],
    controls: throwIf(controlsResult) || null,
    loadedAt: new Date().toISOString()
  };
}

export async function loadControlModules(ownerId) {
  const [brainItems, brainPlans, brainTasks, automations, notifications, connections, kpis, goals, anomalies, permissions, authorizations, alerts, releases, checks, rollbacks] = await Promise.all([
    ownerFilter(client.from('cc7_brain_items').select('*'), ownerId).order('updated_at', { ascending: false }).limit(200),
    ownerFilter(client.from('cc7_brain_plans').select('*'), ownerId).order('updated_at', { ascending: false }).limit(100),
    ownerFilter(client.from('cc7_brain_tasks').select('*'), ownerId).order('sort_order', { ascending: true }).limit(300),
    ownerFilter(client.from('cc7_automations').select('*'), ownerId).order('updated_at', { ascending: false }).limit(200),
    ownerFilter(client.from('cc7_notifications').select('*'), ownerId).order('created_at', { ascending: false }).limit(100),
    ownerFilter(client.from('cc7_integration_connections').select('*'), ownerId).order('updated_at', { ascending: false }).limit(200),
    ownerFilter(client.from('cc7_analytics_kpis').select('*'), ownerId).order('observed_at', { ascending: false }).limit(500),
    ownerFilter(client.from('cc7_analytics_goals').select('*'), ownerId).order('updated_at', { ascending: false }).limit(100),
    ownerFilter(client.from('cc7_analytics_anomalies').select('*'), ownerId).order('observed_at', { ascending: false }).limit(100),
    ownerFilter(client.from('cc7_security_permissions').select('*'), ownerId).order('updated_at', { ascending: false }).limit(200),
    ownerFilter(client.from('cc7_security_authorizations').select('*'), ownerId).order('created_at', { ascending: false }).limit(100),
    ownerFilter(client.from('cc7_security_alerts').select('*'), ownerId).order('created_at', { ascending: false }).limit(100),
    ownerFilter(client.from('cc7_deployment_releases').select('*'), ownerId).order('created_at', { ascending: false }).limit(50),
    ownerFilter(client.from('cc7_deployment_checks').select('*'), ownerId).order('checked_at', { ascending: false }).limit(300),
    ownerFilter(client.from('cc7_deployment_rollbacks').select('*'), ownerId).order('created_at', { ascending: false }).limit(100)
  ]);
  return {
    brainItems: throwIf(brainItems) || [],
    brainPlans: throwIf(brainPlans) || [],
    brainTasks: throwIf(brainTasks) || [],
    automations: throwIf(automations) || [],
    notifications: throwIf(notifications) || [],
    connections: throwIf(connections) || [],
    kpis: throwIf(kpis) || [],
    goals: throwIf(goals) || [],
    anomalies: throwIf(anomalies) || [],
    permissions: throwIf(permissions) || [],
    authorizations: throwIf(authorizations) || [],
    alerts: throwIf(alerts) || [],
    releases: throwIf(releases) || [],
    deploymentChecks: throwIf(checks) || [],
    rollbacks: throwIf(rollbacks) || []
  };
}

export async function loadAgentState(ownerId) {
  const controlsResult = await ownerFilter(client.from('cc7_agent_controls').select('*'), ownerId).maybeSingle();
  const controls = throwIf(controlsResult) || null;
  const runsResult = await ownerFilter(client.from('cc7_agent_runs').select('*'), ownerId).order('created_at', { ascending: false }).limit(20);
  const runs = throwIf(runsResult) || [];
  const activeRun = controls?.current_run_id
    ? runs.find(r => r.id === controls.current_run_id) || null
    : runs.find(r => ['queued','working','paused','blocked','needs_user','work_boundary'].includes(r.status)) || null;
  let tasks = [], events = [], approvals = [], checkpoints = [];
  if (activeRun) {
    const [tasksResult, eventsResult, approvalsResult, checkpointsResult] = await Promise.all([
      client.from('cc7_agent_tasks').select('*').eq('run_id', activeRun.id).order('position', { ascending: true }),
      client.from('cc7_agent_events').select('*').eq('run_id', activeRun.id).order('created_at', { ascending: false }).limit(30),
      client.from('cc7_agent_approvals').select('*').eq('run_id', activeRun.id).order('created_at', { ascending: false }),
      client.from('cc7_agent_checkpoints').select('*').eq('run_id', activeRun.id).order('created_at', { ascending: false }).limit(20)
    ]);
    tasks = throwIf(tasksResult) || [];
    events = throwIf(eventsResult) || [];
    approvals = throwIf(approvalsResult) || [];
    checkpoints = throwIf(checkpointsResult) || [];
  }
  const heartbeatResult = await ownerFilter(client.from('cc7_agent_runner_heartbeat').select('*'), ownerId).maybeSingle();
  return { controls, runs, activeRun, tasks, events, approvals, checkpoints, heartbeat: throwIf(heartbeatResult) || null };
}

export async function setAuto(ownerId, enabled) {
  const result = await client.from('cc7_agent_controls').update({
    auto_enabled: !!enabled,
    updated_by: 'cc7_owner_ui',
    updated_at: new Date().toISOString()
  }).eq('owner_id', ownerId).select('*').single();
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
  return throwIf(await client.from('cc7_agent_runs').update({ pause_requested: true, updated_at: new Date().toISOString() }).eq('id', runId).eq('owner_id', ownerId).select('*').single());
}

export async function requestResume(ownerId, runId) {
  return throwIf(await client.from('cc7_agent_runs').update({ pause_requested: false, status: 'queued', updated_at: new Date().toISOString() }).eq('id', runId).eq('owner_id', ownerId).select('*').single());
}

export async function requestStop(ownerId, runId) {
  const { data, error } = await client.rpc('cc7_agent_owner_stop_run', { p_run_id: runId });
  if (error) throw error;
  if (!data?.ok) throw new Error('V7 Agent stop did not verify.');
  return data;
}

export async function resolveApproval(ownerId, approvalId, approved) {
  return throwIf(await client.from('cc7_agent_approvals').update({
    state: approved ? 'approved' : 'declined',
    resolved_at: new Date().toISOString()
  }).eq('id', approvalId).eq('owner_id', ownerId).select('*').single());
}

export function subscribe(ownerId, onChange) {
  const channel = client.channel(`cc7-owner-${ownerId}`);
  const tables = [
    'cc7_projects','cc7_metrics','cc7_activity','cc7_integrations',
    'cc7_brain_items','cc7_brain_plans','cc7_brain_tasks','cc7_automations','cc7_notifications','cc7_integration_connections',
    'cc7_analytics_kpis','cc7_analytics_goals','cc7_analytics_anomalies','cc7_security_permissions','cc7_security_authorizations','cc7_security_alerts',
    'cc7_deployment_releases','cc7_deployment_checks','cc7_deployment_rollbacks',
    'cc7_agent_controls','cc7_agent_runs','cc7_agent_tasks','cc7_agent_events','cc7_agent_approvals','cc7_agent_checkpoints','cc7_agent_runner_heartbeat'
  ];
  for (const table of tables) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `owner_id=eq.${ownerId}` }, payload => onChange({ table, payload }));
  }
  channel.subscribe();
  return () => { client.removeChannel(channel); };
}
