import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL("../../supabase/migrations/20261025200000_category7_auto_execution_transition_hardening.sql", import.meta.url);

test("P7.9 Project Auto preserves canonical P7.1 run transition evidence", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const projectStart = sql.indexOf("create or replace function public.command_center_agency_activate_project_auto");
  const agentStart = sql.indexOf("create or replace function public.command_center_agency_dispatch_agent_auto_cycle");
  assert.ok(projectStart >= 0 && agentStart > projectStart);
  const projectSql = sql.slice(projectStart, agentStart);

  assert.match(projectSql, /r\.state='draft' then v_blocker:='project_auto_run_not_queued'/);
  assert.match(projectSql, /public\.command_center_agency_transition_run\(/);
  assert.match(projectSql, /r\.run_id,r\.generation,'working'/);
  assert.match(projectSql, /if r\.state<>'working' then/);
  assert.doesNotMatch(projectSql, /update\s+public\.command_center_agency_runs\s+set\s+state='working'/i);
  assert.match(projectSql, /run_not_at_latest_verified_checkpoint/);
  assert.match(projectSql, /project_locked_by_other_run/);
  assert.match(projectSql, /p\.state not in \('verified','skipped'\)/);
  assert.match(projectSql, /e\.cost_class<>'paid'/);
});

test("P7.10 Agent Auto separates deterministic planning from revalidated durable execution", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const agentStart = sql.indexOf("create or replace function public.command_center_agency_dispatch_agent_auto_cycle");
  assert.ok(agentStart >= 0);
  const agentSql = sql.slice(agentStart);

  assert.match(sql, /dispatch_state text not null default 'planned'/);
  assert.match(sql, /command_center_agency_agent_auto_dispatch_events/);
  assert.match(agentSql, /from unnest\(c\.selected_project_ids\) with ordinality/);
  assert.match(agentSql, /x\.eligible/);
  assert.match(agentSql, /pp\.priority<>d\.stored_priority/);
  assert.match(agentSql, /portfolio_priority_changed_replan_required/);
  assert.match(agentSql, /authorization_key='project-auth:agent-auto'/);
  assert.match(agentSql, /agent_auto_authorization_changed_or_revoked/);
  assert.match(agentSql, /pp\.type_key like 'project-type:book%'/);
  assert.match(agentSql, /books_portfolio_auto_excluded/);
  assert.match(agentSql, /project_agent_generation_changed_replan_required/);
  assert.match(agentSql, /control_mode='agent_auto'/);
  assert.match(agentSql, /ambiguous_agent_auto_run/);
  assert.match(agentSql, /r\.state='draft' then v_blocker:='agent_auto_run_not_queued'/);
  assert.match(agentSql, /run_not_at_latest_verified_checkpoint/);
  assert.match(agentSql, /command_center_agency_task_dependencies/);
  assert.match(agentSql, /prereq\.state not in \('verified','skipped'\)/);
  assert.match(agentSql, /e\.cost_class<>'paid'/);
  assert.match(agentSql, /command_center_agency_project_auto_locks/);
  assert.match(agentSql, /public\.command_center_agency_transition_run\(/);
  assert.match(agentSql, /r\.run_id,r\.generation,'working'/);
  assert.doesNotMatch(agentSql, /update\s+public\.command_center_agency_runs\s+set\s+state='working'/i);
  assert.match(agentSql, /dispatch_state='working'/);
  assert.match(agentSql, /dispatch_state='blocked'/);
  assert.doesNotMatch(agentSql, /random\(|order by random/i);
  assert.doesNotMatch(agentSql, /e\.cost_class='paid'/);
});

test("P7.10 dispatch tables remain owner-readable but not client-mutable", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on table public\.command_center_agency_agent_auto_dispatch_events from public,anon,authenticated/);
  assert.match(sql, /grant select on table public\.command_center_agency_agent_auto_dispatch_events to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_agency_agent_auto_dispatch_events/i);
  assert.match(sql, /Agent Auto cycle contains a selected project without an eligible decision/);
  assert.match(sql, /agent_auto_run_missing/);
  assert.match(sql, /no_ready_task/);
  assert.match(sql, /no_eligible_executor/);
  assert.match(sql, /project_lock_acquisition_failed/);
});
