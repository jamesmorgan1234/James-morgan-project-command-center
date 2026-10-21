-- Command Center Brain — Automation Phases 4–8
-- Phase 4: Recurring Report Jobs
-- Phase 5: Action Queue Runner
-- Phase 6: Cross-Project Workflow Chains
-- Phase 7: Run History
-- Phase 8: Failure Recovery
--
-- This migration is additive. Existing Phase 1–3 schedules remain notification jobs.
-- No user automation rows are created by this migration.

create schema if not exists command_center_private;
revoke all on schema command_center_private from public, anon, authenticated;
grant usage on schema command_center_private to postgres, service_role;

alter table public.automation_schedules
  add column if not exists job_kind text not null default 'notification',
  add column if not exists target_id uuid null,
  add column if not exists max_attempts integer not null default 3;

alter table public.automation_schedules
  drop constraint if exists automation_schedules_job_kind_check,
  add constraint automation_schedules_job_kind_check check (job_kind in ('notification','report','action','workflow')),
  drop constraint if exists automation_schedules_max_attempts_check,
  add constraint automation_schedules_max_attempts_check check (max_attempts between 1 and 10);

alter table public.automation_dispatch_queue
  alter column schedule_id drop not null,
  add column if not exists job_kind text not null default 'notification',
  add column if not exists target_id uuid null,
  add column if not exists max_attempts integer not null default 3;

alter table public.automation_dispatch_queue
  drop constraint if exists automation_dispatch_queue_job_kind_check,
  add constraint automation_dispatch_queue_job_kind_check check (job_kind in ('notification','report','action','workflow')),
  drop constraint if exists automation_dispatch_queue_max_attempts_check,
  add constraint automation_dispatch_queue_max_attempts_check check (max_attempts between 1 and 10),
  drop constraint if exists automation_dispatch_queue_notification_state_check,
  add constraint automation_dispatch_queue_notification_state_check check (notification_state in ('pending','delivered','suppressed','error','not_applicable'));

alter table public.automation_notifications
  add column if not exists idempotency_key text null;
create unique index if not exists automation_notifications_owner_idempotency_uidx
  on public.automation_notifications(owner_id,idempotency_key) where idempotency_key is not null;

create table if not exists public.automation_report_definitions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete cascade,
  name text not null,
  report_kind text not null check (report_kind in ('project_snapshot','portfolio_snapshot','automation_summary')),
  sections jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','paused','archived')),
  generation_count integer not null default 0 check (generation_count >= 0),
  last_generated_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint automation_report_project_kind_check check (
    (report_kind='project_snapshot' and project_id is not null)
    or (report_kind in ('portfolio_snapshot','automation_summary') and project_id is null)
  )
);

create table if not exists public.automation_action_definitions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete cascade,
  name text not null,
  action_type text not null check (action_type in ('create_activity','set_project_attention','set_project_next_action','create_notification')),
  payload jsonb not null default '{}'::jsonb,
  authorization_state text not null default 'draft' check (authorization_state in ('draft','authorized','revoked')),
  status text not null default 'active' check (status in ('active','paused','archived')),
  execution_count integer not null default 0 check (execution_count >= 0),
  last_executed_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_workflows (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text null,
  status text not null default 'active' check (status in ('active','paused','archived')),
  execution_count integer not null default 0 check (execution_count >= 0),
  last_executed_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workflow_id uuid not null references public.automation_workflows(id) on delete cascade,
  step_order integer not null check (step_order between 1 and 100),
  project_id text null references public.projects(id) on delete set null,
  step_kind text not null check (step_kind in ('report','action','notification')),
  target_id uuid null,
  label text not null,
  config jsonb not null default '{}'::jsonb,
  stop_on_failure boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workflow_id,step_order)
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  dispatch_id uuid not null references public.automation_dispatch_queue(id) on delete cascade,
  schedule_id uuid null references public.automation_schedules(id) on delete set null,
  run_kind text not null check (run_kind in ('notification','report','action','workflow')),
  target_id uuid null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','skipped','failed','retrying','canceled')),
  idempotency_key text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  next_retry_at timestamptz null,
  started_at timestamptz null,
  completed_at timestamptz null,
  last_error text null,
  resume_state jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(dispatch_id),
  unique(owner_id,idempotency_key)
);

create table if not exists public.automation_run_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null references public.automation_runs(id) on delete cascade,
  event_kind text not null,
  status text null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_report_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  report_definition_id uuid not null references public.automation_report_definitions(id) on delete cascade,
  run_id uuid not null references public.automation_runs(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  idempotency_key text not null,
  title text not null,
  summary text not null,
  report_json jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(owner_id,idempotency_key)
);

create table if not exists public.automation_action_executions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  action_definition_id uuid not null references public.automation_action_definitions(id) on delete cascade,
  run_id uuid not null references public.automation_runs(id) on delete cascade,
  idempotency_key text not null,
  status text not null default 'running' check (status in ('running','succeeded','failed')),
  attempt_count integer not null default 1 check (attempt_count >= 1),
  output jsonb not null default '{}'::jsonb,
  error_message text null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  unique(owner_id,idempotency_key)
);

create table if not exists public.automation_workflow_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workflow_id uuid not null references public.automation_workflows(id) on delete cascade,
  run_id uuid not null references public.automation_runs(id) on delete cascade,
  status text not null default 'running' check (status in ('running','succeeded','failed','skipped')),
  current_step_order integer null,
  output jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  unique(run_id)
);

create table if not exists public.automation_workflow_step_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workflow_run_id uuid not null references public.automation_workflow_runs(id) on delete cascade,
  workflow_step_id uuid not null references public.automation_workflow_steps(id) on delete cascade,
  status text not null default 'running' check (status in ('running','succeeded','failed','skipped')),
  attempt_count integer not null default 1 check (attempt_count >= 1),
  output jsonb not null default '{}'::jsonb,
  error_message text null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  unique(workflow_run_id,workflow_step_id)
);

create index if not exists automation_reports_owner_status_idx on public.automation_report_definitions(owner_id,status,updated_at desc);
create index if not exists automation_actions_owner_status_idx on public.automation_action_definitions(owner_id,status,updated_at desc);
create index if not exists automation_workflows_owner_status_idx on public.automation_workflows(owner_id,status,updated_at desc);
create index if not exists automation_workflow_steps_owner_workflow_idx on public.automation_workflow_steps(owner_id,workflow_id,step_order);
create index if not exists automation_runs_owner_status_idx on public.automation_runs(owner_id,status,created_at desc);
create index if not exists automation_runs_retry_idx on public.automation_runs(next_retry_at) where status='retrying';
create index if not exists automation_run_events_run_idx on public.automation_run_events(run_id,created_at);
create index if not exists automation_report_runs_owner_time_idx on public.automation_report_runs(owner_id,generated_at desc);
create index if not exists automation_action_executions_owner_time_idx on public.automation_action_executions(owner_id,started_at desc);
create index if not exists automation_workflow_runs_owner_time_idx on public.automation_workflow_runs(owner_id,started_at desc);

alter table public.automation_report_definitions enable row level security;
alter table public.automation_action_definitions enable row level security;
alter table public.automation_workflows enable row level security;
alter table public.automation_workflow_steps enable row level security;
alter table public.automation_runs enable row level security;
alter table public.automation_run_events enable row level security;
alter table public.automation_report_runs enable row level security;
alter table public.automation_action_executions enable row level security;
alter table public.automation_workflow_runs enable row level security;
alter table public.automation_workflow_step_runs enable row level security;

-- Definition tables: owner CRUD.
do $$
declare t text;
begin
  foreach t in array array['automation_report_definitions','automation_action_definitions','automation_workflows','automation_workflow_steps'] loop
    execute format('drop policy if exists %I_select_own on public.%I',t,t);
    execute format('create policy %I_select_own on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',t,t);
    execute format('drop policy if exists %I_insert_own on public.%I',t,t);
    execute format('create policy %I_insert_own on public.%I for insert to authenticated with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',t,t);
    execute format('drop policy if exists %I_update_own on public.%I',t,t);
    execute format('create policy %I_update_own on public.%I for update to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',t,t);
    execute format('drop policy if exists %I_delete_own on public.%I',t,t);
    execute format('create policy %I_delete_own on public.%I for delete to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',t,t);
  end loop;
end $$;

-- Result/history tables: owner read only.
do $$
declare t text;
begin
  foreach t in array array['automation_runs','automation_run_events','automation_report_runs','automation_action_executions','automation_workflow_runs','automation_workflow_step_runs'] loop
    execute format('drop policy if exists %I_select_own on public.%I',t,t);
    execute format('create policy %I_select_own on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',t,t);
  end loop;
end $$;

revoke all on public.automation_report_definitions,public.automation_action_definitions,public.automation_workflows,public.automation_workflow_steps from anon,authenticated;
grant select,insert,update,delete on public.automation_report_definitions,public.automation_action_definitions,public.automation_workflows,public.automation_workflow_steps to authenticated;
revoke all on public.automation_runs,public.automation_run_events,public.automation_report_runs,public.automation_action_executions,public.automation_workflow_runs,public.automation_workflow_step_runs from anon,authenticated;
grant select on public.automation_runs,public.automation_run_events,public.automation_report_runs,public.automation_action_executions,public.automation_workflow_runs,public.automation_workflow_step_runs to authenticated;

create or replace function command_center_private.prepare_report_definition()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  new.name:=btrim(new.name);
  if new.name='' then raise exception 'Report name is required'; end if;
  if new.project_id is not null and not exists(select 1 from public.projects p where p.id=new.project_id and p.owner_id=new.owner_id) then
    raise exception 'Report project must belong to the owner';
  end if;
  if new.status='archived' then new.archived_at:=coalesce(new.archived_at,now()); else new.archived_at:=null; end if;
  return new;
end;
$$;

drop trigger if exists automation_report_definitions_prepare on public.automation_report_definitions;
create trigger automation_report_definitions_prepare before insert or update on public.automation_report_definitions
for each row execute function command_center_private.prepare_report_definition();
drop trigger if exists automation_report_definitions_updated_at on public.automation_report_definitions;
create trigger automation_report_definitions_updated_at before update on public.automation_report_definitions
for each row execute function public.command_center_set_updated_at();

create or replace function command_center_private.prepare_action_definition()
returns trigger
language plpgsql
set search_path=''
as $$
declare v_text text;
begin
  new.name:=btrim(new.name);
  if new.name='' then raise exception 'Action name is required'; end if;
  if new.project_id is not null and not exists(select 1 from public.projects p where p.id=new.project_id and p.owner_id=new.owner_id) then
    raise exception 'Action project must belong to the owner';
  end if;
  if new.action_type in ('create_activity','set_project_attention','set_project_next_action') and new.project_id is null then
    raise exception 'This action requires a project';
  end if;
  if new.action_type='create_activity' then
    v_text:=btrim(coalesce(new.payload->>'headline',''));
    if v_text='' then raise exception 'Activity headline is required'; end if;
  elsif new.action_type='set_project_attention' then
    if jsonb_typeof(new.payload->'value') is distinct from 'boolean' then raise exception 'Attention action requires a boolean value'; end if;
  elsif new.action_type='set_project_next_action' then
    v_text:=btrim(coalesce(new.payload->>'value',''));
    if v_text='' then raise exception 'Next action text is required'; end if;
  elsif new.action_type='create_notification' then
    if btrim(coalesce(new.payload->>'title',''))='' or btrim(coalesce(new.payload->>'message',''))='' then
      raise exception 'Notification title and message are required';
    end if;
    if coalesce(new.payload->>'severity','info') not in ('info','attention') then raise exception 'Unsupported notification severity'; end if;
  end if;
  if new.status='archived' then new.archived_at:=coalesce(new.archived_at,now()); else new.archived_at:=null; end if;
  return new;
end;
$$;

drop trigger if exists automation_action_definitions_prepare on public.automation_action_definitions;
create trigger automation_action_definitions_prepare before insert or update on public.automation_action_definitions
for each row execute function command_center_private.prepare_action_definition();
drop trigger if exists automation_action_definitions_updated_at on public.automation_action_definitions;
create trigger automation_action_definitions_updated_at before update on public.automation_action_definitions
for each row execute function public.command_center_set_updated_at();

create or replace function command_center_private.prepare_workflow()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  new.name:=btrim(new.name);
  if new.name='' then raise exception 'Workflow name is required'; end if;
  if new.status='archived' then new.archived_at:=coalesce(new.archived_at,now()); else new.archived_at:=null; end if;
  return new;
end;
$$;

drop trigger if exists automation_workflows_prepare on public.automation_workflows;
create trigger automation_workflows_prepare before insert or update on public.automation_workflows
for each row execute function command_center_private.prepare_workflow();
drop trigger if exists automation_workflows_updated_at on public.automation_workflows;
create trigger automation_workflows_updated_at before update on public.automation_workflows
for each row execute function public.command_center_set_updated_at();

create or replace function command_center_private.prepare_workflow_step()
returns trigger
language plpgsql
set search_path=''
as $$
declare v_owner uuid; v_project text; v_state text;
begin
  new.label:=btrim(new.label);
  if new.label='' then raise exception 'Workflow step label is required'; end if;
  select owner_id into v_owner from public.automation_workflows where id=new.workflow_id;
  if not found or v_owner<>new.owner_id then raise exception 'Workflow step must belong to the workflow owner'; end if;
  if new.project_id is not null and not exists(select 1 from public.projects p where p.id=new.project_id and p.owner_id=new.owner_id) then
    raise exception 'Workflow step project must belong to the owner';
  end if;
  if new.step_kind='report' then
    if new.target_id is null then raise exception 'Report step requires a report definition'; end if;
    select owner_id,project_id,status into v_owner,v_project,v_state from public.automation_report_definitions where id=new.target_id;
    if not found or v_owner<>new.owner_id or v_state='archived' then raise exception 'Workflow report target is unavailable'; end if;
    if new.project_id is distinct from v_project then raise exception 'Workflow report step project must match the report definition'; end if;
  elsif new.step_kind='action' then
    if new.target_id is null then raise exception 'Action step requires an action definition'; end if;
    select owner_id,project_id,authorization_state into v_owner,v_project,v_state from public.automation_action_definitions where id=new.target_id;
    if not found or v_owner<>new.owner_id or v_state<>'authorized' then raise exception 'Workflow action target must be authorized'; end if;
    if new.project_id is distinct from v_project then raise exception 'Workflow action step project must match the action definition'; end if;
  else
    new.target_id:=null;
    if btrim(coalesce(new.config->>'title',''))='' or btrim(coalesce(new.config->>'message',''))='' then
      raise exception 'Notification step needs a title and message';
    end if;
    if coalesce(new.config->>'severity','info') not in ('info','attention') then raise exception 'Unsupported notification severity'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists automation_workflow_steps_prepare on public.automation_workflow_steps;
create trigger automation_workflow_steps_prepare before insert or update on public.automation_workflow_steps
for each row execute function command_center_private.prepare_workflow_step();
drop trigger if exists automation_workflow_steps_updated_at on public.automation_workflow_steps;
create trigger automation_workflow_steps_updated_at before update on public.automation_workflow_steps
for each row execute function public.command_center_set_updated_at();

create or replace function command_center_private.log_run_event(p_run_id uuid,p_event_kind text,p_status text default null,p_detail jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare r public.automation_runs%rowtype;
begin
  select * into r from public.automation_runs where id=p_run_id;
  if not found then return; end if;
  insert into public.automation_run_events(owner_id,run_id,event_kind,status,detail)
  values(r.owner_id,r.id,p_event_kind,p_status,coalesce(p_detail,'{}'::jsonb));
end;
$$;

create or replace function command_center_private.ensure_dispatch_notification(p_dispatch_id uuid)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare d public.automation_dispatch_queue%rowtype; v_id uuid; v_when timestamptz;
begin
  select * into d from public.automation_dispatch_queue where id=p_dispatch_id for update;
  if not found then return 'error'; end if;
  if d.job_kind<>'notification' then
    update public.automation_dispatch_queue set notification_state='not_applicable' where id=d.id;
    return 'not_applicable';
  end if;
  if d.condition_state not in ('not_required','passed') then
    update public.automation_dispatch_queue set notification_state='suppressed' where id=d.id;
    return 'suppressed';
  end if;
  insert into public.automation_notifications(owner_id,project_id,schedule_id,dispatch_id,condition_id,title,message,severity,idempotency_key,metadata)
  values(d.owner_id,d.project_id,d.schedule_id,d.id,d.condition_id,'Command Center · '||d.schedule_name,d.job_label,'info','dispatch:'||d.id::text||':notification',jsonb_build_object('notification_delivery_phase',3,'condition_state',d.condition_state,'scheduled_for',d.scheduled_for))
  on conflict(owner_id,idempotency_key) where idempotency_key is not null do nothing
  returning id,delivered_at into v_id,v_when;
  if v_id is null then
    select id,delivered_at into v_id,v_when from public.automation_notifications where owner_id=d.owner_id and idempotency_key='dispatch:'||d.id::text||':notification';
  end if;
  if v_id is null then
    update public.automation_dispatch_queue set notification_state='error' where id=d.id;
    return 'error';
  end if;
  update public.automation_dispatch_queue set notification_state='delivered',notification_delivered_at=coalesce(v_when,now()) where id=d.id;
  return 'delivered';
exception when others then
  update public.automation_dispatch_queue set notification_state='error' where id=p_dispatch_id;
  return 'error';
end;
$$;

create or replace function command_center_private.generate_report(p_report_id uuid,p_run_id uuid,p_idempotency_key text)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare d public.automation_report_definitions%rowtype; r public.automation_runs%rowtype; v_json jsonb; v_summary text; v_title text; v_id uuid;
begin
  select * into d from public.automation_report_definitions where id=p_report_id;
  select * into r from public.automation_runs where id=p_run_id;
  if d.id is null or r.id is null or d.owner_id<>r.owner_id then raise exception 'Report definition is unavailable'; end if;
  if d.status<>'active' then raise exception 'Report definition is not active'; end if;

  if d.report_kind='project_snapshot' then
    select jsonb_build_object(
      'project',jsonb_build_object('id',p.id,'name',p.name,'category',p.category,'status',p.status,'verification',p.verification,'stage',p.stage,'next_action',p.next_action,'blocker',p.blocker,'attention',p.attention,'last_verified',p.last_verified,'source_status',p.source_status),
      'verified_metrics',coalesce((select jsonb_agg(jsonb_build_object('key',m.key,'label',m.label,'value_numeric',m.value_numeric,'value_text',m.value_text,'unit',m.unit,'updated_at',m.updated_at) order by m.key) from public.metrics m where m.owner_id=d.owner_id and m.project_id=d.project_id and m.verified=true),'[]'::jsonb),
      'recent_activity',coalesce((select jsonb_agg(x.item order by x.happened_at desc) from (select a.happened_at,jsonb_build_object('headline',a.headline,'detail',a.detail,'happened_at',a.happened_at) item from public.activity a where a.owner_id=d.owner_id and a.project_id=d.project_id order by a.happened_at desc limit 10)x),'[]'::jsonb)
    ) into v_json
    from public.projects p where p.id=d.project_id and p.owner_id=d.owner_id;
    if v_json is null then raise exception 'Report project is unavailable'; end if;
    v_title:=d.name;
    v_summary:=coalesce(v_json#>>'{project,name}','Project')||' · '||coalesce(v_json#>>'{project,status}','Status N/A')||' · '||coalesce(v_json#>>'{project,verification}','Verification N/A');
  elsif d.report_kind='portfolio_snapshot' then
    select jsonb_build_object(
      'project_count',count(*),
      'attention_count',count(*) filter(where attention),
      'projects',coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'status',status,'verification',verification,'stage',stage,'next_action',next_action,'attention',attention) order by sort_order,name),'[]'::jsonb)
    ) into v_json from public.projects where owner_id=d.owner_id;
    v_title:=d.name;
    v_summary:=coalesce(v_json->>'project_count','0')||' projects · '||coalesce(v_json->>'attention_count','0')||' need attention';
  else
    v_json:=jsonb_build_object(
      'active_schedules',(select count(*) from public.automation_schedules s where s.owner_id=d.owner_id and s.status='active'),
      'active_conditions',(select count(*) from public.automation_conditions c where c.owner_id=d.owner_id and c.status='active'),
      'active_reports',(select count(*) from public.automation_report_definitions x where x.owner_id=d.owner_id and x.status='active'),
      'authorized_actions',(select count(*) from public.automation_action_definitions x where x.owner_id=d.owner_id and x.status='active' and x.authorization_state='authorized'),
      'active_workflows',(select count(*) from public.automation_workflows x where x.owner_id=d.owner_id and x.status='active'),
      'recent_runs',coalesce((select jsonb_agg(y.item order by y.created_at desc) from (select rr.created_at,jsonb_build_object('id',rr.id,'kind',rr.run_kind,'status',rr.status,'attempts',rr.attempt_count,'created_at',rr.created_at,'completed_at',rr.completed_at) item from public.automation_runs rr where rr.owner_id=d.owner_id order by rr.created_at desc limit 20)y),'[]'::jsonb)
    );
    v_title:=d.name;
    v_summary:=coalesce(v_json->>'active_schedules','0')||' active schedules · '||coalesce(v_json->>'recent_runs','[]');
  end if;

  insert into public.automation_report_runs(owner_id,report_definition_id,run_id,project_id,idempotency_key,title,summary,report_json)
  values(d.owner_id,d.id,r.id,d.project_id,p_idempotency_key,v_title,v_summary,v_json)
  on conflict(owner_id,idempotency_key) do nothing returning id into v_id;
  if v_id is null then
    select id into v_id from public.automation_report_runs where owner_id=d.owner_id and idempotency_key=p_idempotency_key;
  else
    update public.automation_report_definitions set generation_count=generation_count+1,last_generated_at=now() where id=d.id;
  end if;
  return v_id;
end;
$$;

create or replace function command_center_private.execute_action(p_action_id uuid,p_run_id uuid,p_idempotency_key text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare a public.automation_action_definitions%rowtype; r public.automation_runs%rowtype; e public.automation_action_executions%rowtype; v_output jsonb:='{}'::jsonb; v_activity uuid; v_notification uuid;
begin
  select * into a from public.automation_action_definitions where id=p_action_id;
  select * into r from public.automation_runs where id=p_run_id;
  if a.id is null or r.id is null or a.owner_id<>r.owner_id then return jsonb_build_object('success',false,'error','Action definition is unavailable'); end if;
  if a.status<>'active' or a.authorization_state<>'authorized' then return jsonb_build_object('success',false,'error','Action is not currently authorized'); end if;

  insert into public.automation_action_executions(owner_id,action_definition_id,run_id,idempotency_key)
  values(a.owner_id,a.id,r.id,p_idempotency_key)
  on conflict(owner_id,idempotency_key) do nothing returning * into e;
  if e.id is null then
    select * into e from public.automation_action_executions where owner_id=a.owner_id and idempotency_key=p_idempotency_key for update;
    if e.status='succeeded' then return jsonb_build_object('success',true,'execution_id',e.id,'output',e.output,'reused',true); end if;
    update public.automation_action_executions set status='running',attempt_count=attempt_count+1,error_message=null,started_at=now(),completed_at=null where id=e.id returning * into e;
  end if;

  begin
    if a.action_type='create_activity' then
      insert into public.activity(owner_id,project_id,headline,detail,happened_at)
      values(a.owner_id,a.project_id,btrim(a.payload->>'headline'),nullif(btrim(coalesce(a.payload->>'detail','')),''),now()) returning id into v_activity;
      v_output:=jsonb_build_object('activity_id',v_activity);
    elsif a.action_type='set_project_attention' then
      update public.projects set attention=(a.payload->>'value')::boolean where id=a.project_id and owner_id=a.owner_id;
      if not found then raise exception 'Project not found'; end if;
      v_output:=jsonb_build_object('project_id',a.project_id,'attention',(a.payload->>'value')::boolean);
    elsif a.action_type='set_project_next_action' then
      update public.projects set next_action=btrim(a.payload->>'value') where id=a.project_id and owner_id=a.owner_id;
      if not found then raise exception 'Project not found'; end if;
      v_output:=jsonb_build_object('project_id',a.project_id,'next_action',btrim(a.payload->>'value'));
    else
      insert into public.automation_notifications(owner_id,project_id,title,message,severity,status,idempotency_key,metadata)
      values(a.owner_id,a.project_id,btrim(a.payload->>'title'),btrim(a.payload->>'message'),coalesce(a.payload->>'severity','info'),'unread',p_idempotency_key||':notification',jsonb_build_object('action_definition_id',a.id,'run_id',r.id,'automation_phase',5))
      on conflict(owner_id,idempotency_key) where idempotency_key is not null do nothing returning id into v_notification;
      if v_notification is null then select id into v_notification from public.automation_notifications where owner_id=a.owner_id and idempotency_key=p_idempotency_key||':notification'; end if;
      v_output:=jsonb_build_object('notification_id',v_notification);
    end if;
    update public.automation_action_executions set status='succeeded',output=v_output,error_message=null,completed_at=now() where id=e.id;
    update public.automation_action_definitions set execution_count=execution_count+1,last_executed_at=now() where id=a.id;
    return jsonb_build_object('success',true,'execution_id',e.id,'output',v_output);
  exception when others then
    update public.automation_action_executions set status='failed',error_message=sqlerrm,completed_at=now() where id=e.id;
    return jsonb_build_object('success',false,'execution_id',e.id,'error',sqlerrm);
  end;
end;
$$;

create or replace function command_center_private.execute_workflow(p_workflow_id uuid,p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare w public.automation_workflows%rowtype; r public.automation_runs%rowtype; wr public.automation_workflow_runs%rowtype; s public.automation_workflow_steps%rowtype; sr public.automation_workflow_step_runs%rowtype; v_result jsonb; v_report uuid; v_notification uuid; v_outputs jsonb:='[]'::jsonb; v_key text;
begin
  select * into w from public.automation_workflows where id=p_workflow_id;
  select * into r from public.automation_runs where id=p_run_id;
  if w.id is null or r.id is null or w.owner_id<>r.owner_id then return jsonb_build_object('success',false,'error','Workflow is unavailable'); end if;
  if w.status<>'active' then return jsonb_build_object('success',false,'error','Workflow is not active'); end if;
  if not exists(select 1 from public.automation_workflow_steps where workflow_id=w.id) then return jsonb_build_object('success',false,'error','Workflow has no steps'); end if;

  insert into public.automation_workflow_runs(owner_id,workflow_id,run_id,status)
  values(w.owner_id,w.id,r.id,'running') on conflict(run_id) do nothing returning * into wr;
  if wr.id is null then select * into wr from public.automation_workflow_runs where run_id=r.id for update; end if;

  for s in select * from public.automation_workflow_steps where workflow_id=w.id order by step_order,id loop
    select * into sr from public.automation_workflow_step_runs where workflow_run_id=wr.id and workflow_step_id=s.id for update;
    if found and sr.status='succeeded' then
      v_outputs:=v_outputs||jsonb_build_array(jsonb_build_object('step_id',s.id,'status','succeeded','reused',true,'output',sr.output));
      continue;
    end if;
    if not found then
      insert into public.automation_workflow_step_runs(owner_id,workflow_run_id,workflow_step_id,status,attempt_count)
      values(w.owner_id,wr.id,s.id,'running',1) returning * into sr;
    else
      update public.automation_workflow_step_runs set status='running',attempt_count=attempt_count+1,error_message=null,started_at=now(),completed_at=null where id=sr.id returning * into sr;
    end if;
    update public.automation_workflow_runs set current_step_order=s.step_order,status='running' where id=wr.id;
    update public.automation_runs set resume_state=jsonb_build_object('workflow_id',w.id,'workflow_run_id',wr.id,'current_step_order',s.step_order,'current_step_id',s.id) where id=r.id;
    v_key:='run:'||r.id::text||':step:'||s.id::text;

    begin
      if s.step_kind='report' then
        v_report:=command_center_private.generate_report(s.target_id,r.id,v_key||':report');
        v_result:=jsonb_build_object('report_run_id',v_report);
      elsif s.step_kind='action' then
        v_result:=command_center_private.execute_action(s.target_id,r.id,v_key||':action');
        if coalesce((v_result->>'success')::boolean,false) is false then
          update public.automation_workflow_step_runs set status='failed',error_message=coalesce(v_result->>'error','Action step failed'),output=v_result,completed_at=now() where id=sr.id;
          update public.automation_workflow_runs set status='failed',current_step_order=s.step_order,output=v_outputs,completed_at=now() where id=wr.id;
          return jsonb_build_object('success',false,'error',coalesce(v_result->>'error','Action step failed'),'step_order',s.step_order,'step_id',s.id);
        end if;
      else
        insert into public.automation_notifications(owner_id,project_id,title,message,severity,status,idempotency_key,metadata)
        values(w.owner_id,s.project_id,btrim(s.config->>'title'),btrim(s.config->>'message'),coalesce(s.config->>'severity','info'),'unread',v_key||':notification',jsonb_build_object('workflow_id',w.id,'workflow_step_id',s.id,'run_id',r.id,'automation_phase',6))
        on conflict(owner_id,idempotency_key) where idempotency_key is not null do nothing returning id into v_notification;
        if v_notification is null then select id into v_notification from public.automation_notifications where owner_id=w.owner_id and idempotency_key=v_key||':notification'; end if;
        v_result:=jsonb_build_object('notification_id',v_notification);
      end if;
      update public.automation_workflow_step_runs set status='succeeded',output=coalesce(v_result,'{}'::jsonb),error_message=null,completed_at=now() where id=sr.id;
      v_outputs:=v_outputs||jsonb_build_array(jsonb_build_object('step_id',s.id,'status','succeeded','output',coalesce(v_result,'{}'::jsonb)));
    exception when others then
      update public.automation_workflow_step_runs set status='failed',error_message=sqlerrm,completed_at=now() where id=sr.id;
      update public.automation_workflow_runs set status='failed',current_step_order=s.step_order,output=v_outputs,completed_at=now() where id=wr.id;
      return jsonb_build_object('success',false,'error',sqlerrm,'step_order',s.step_order,'step_id',s.id);
    end;
  end loop;

  update public.automation_workflow_runs set status='succeeded',current_step_order=null,output=v_outputs,completed_at=now() where id=wr.id;
  update public.automation_workflows set execution_count=execution_count+1,last_executed_at=now() where id=w.id;
  return jsonb_build_object('success',true,'workflow_run_id',wr.id,'output',v_outputs);
end;
$$;

create or replace function command_center_private.execute_run(p_run_id uuid)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare r public.automation_runs%rowtype; d public.automation_dispatch_queue%rowtype; v_attempt integer; v_result jsonb; v_report uuid; v_notification_state text; v_error text; v_delay integer;
begin
  select * into r from public.automation_runs where id=p_run_id for update;
  if not found then return 'missing'; end if;
  if r.status in ('succeeded','skipped','canceled') then return r.status; end if;
  select * into d from public.automation_dispatch_queue where id=r.dispatch_id for update;
  if not found then return 'missing_dispatch'; end if;

  v_attempt:=r.attempt_count+1;
  update public.automation_runs set status='running',attempt_count=v_attempt,started_at=coalesce(started_at,now()),next_retry_at=null,last_error=null,updated_at=now() where id=r.id returning * into r;
  update public.automation_dispatch_queue set status='claimed',claimed_at=coalesce(claimed_at,now()) where id=d.id;
  perform command_center_private.log_run_event(r.id,'attempt_started','running',jsonb_build_object('attempt',v_attempt,'max_attempts',r.max_attempts));

  if d.condition_state not in ('not_required','passed') then
    update public.automation_runs set status='skipped',completed_at=now(),resume_state='{}'::jsonb,updated_at=now() where id=r.id;
    update public.automation_dispatch_queue set status='skipped',completed_at=now(),notification_state=case when d.job_kind='notification' then 'suppressed' else 'not_applicable' end where id=d.id;
    perform command_center_private.log_run_event(r.id,'condition_blocked','skipped',jsonb_build_object('condition_state',d.condition_state));
    return 'skipped';
  end if;

  begin
    if r.run_kind='notification' then
      v_notification_state:=command_center_private.ensure_dispatch_notification(d.id);
      if v_notification_state='delivered' then v_result:=jsonb_build_object('success',true,'notification_state',v_notification_state);
      elsif v_notification_state='suppressed' then
        update public.automation_runs set status='skipped',completed_at=now(),resume_state='{}'::jsonb,updated_at=now() where id=r.id;
        update public.automation_dispatch_queue set status='skipped',completed_at=now() where id=d.id;
        perform command_center_private.log_run_event(r.id,'notification_suppressed','skipped','{}'::jsonb);
        return 'skipped';
      else raise exception 'Notification delivery failed'; end if;
    elsif r.run_kind='report' then
      if r.target_id is null then raise exception 'Report run has no target'; end if;
      v_report:=command_center_private.generate_report(r.target_id,r.id,'run:'||r.id::text||':report');
      v_result:=jsonb_build_object('success',true,'report_run_id',v_report);
    elsif r.run_kind='action' then
      if r.target_id is null then raise exception 'Action run has no target'; end if;
      v_result:=command_center_private.execute_action(r.target_id,r.id,'run:'||r.id::text||':action');
      if coalesce((v_result->>'success')::boolean,false) is false then raise exception '%',coalesce(v_result->>'error','Action execution failed'); end if;
    else
      if r.target_id is null then raise exception 'Workflow run has no target'; end if;
      v_result:=command_center_private.execute_workflow(r.target_id,r.id);
      if coalesce((v_result->>'success')::boolean,false) is false then raise exception '%',coalesce(v_result->>'error','Workflow execution failed'); end if;
    end if;

    update public.automation_runs set status='succeeded',completed_at=now(),next_retry_at=null,last_error=null,resume_state='{}'::jsonb,metadata=metadata||jsonb_build_object('result',coalesce(v_result,'{}'::jsonb)),updated_at=now() where id=r.id;
    update public.automation_dispatch_queue set status='completed',completed_at=now(),notification_state=case when d.job_kind='notification' then notification_state else 'not_applicable' end where id=d.id;
    perform command_center_private.log_run_event(r.id,'run_completed','succeeded',coalesce(v_result,'{}'::jsonb));
    return 'succeeded';
  exception when others then
    v_error:=sqlerrm;
    if v_attempt<r.max_attempts then
      v_delay:=least(3600,60*(2^greatest(v_attempt-1,0))::integer);
      update public.automation_runs set status='retrying',next_retry_at=now()+make_interval(secs=>v_delay),last_error=v_error,updated_at=now() where id=r.id;
      update public.automation_dispatch_queue set status='failed',completed_at=null where id=d.id;
      perform command_center_private.log_run_event(r.id,'attempt_failed','retrying',jsonb_build_object('attempt',v_attempt,'error',v_error,'retry_in_seconds',v_delay));
      return 'retrying';
    else
      update public.automation_runs set status='failed',next_retry_at=null,last_error=v_error,completed_at=now(),updated_at=now() where id=r.id;
      update public.automation_dispatch_queue set status='failed',completed_at=now() where id=d.id;
      perform command_center_private.log_run_event(r.id,'run_failed','failed',jsonb_build_object('attempt',v_attempt,'error',v_error));
      return 'failed';
    end if;
  end;
end;
$$;

create or replace function command_center_private.dispatch_to_run()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_run uuid;
begin
  insert into public.automation_runs(owner_id,project_id,dispatch_id,schedule_id,run_kind,target_id,status,idempotency_key,max_attempts,metadata)
  values(new.owner_id,new.project_id,new.id,new.schedule_id,new.job_kind,new.target_id,'queued','dispatch:'||new.id::text,new.max_attempts,jsonb_build_object('automation_phase',7,'scheduled_for',new.scheduled_for))
  on conflict(dispatch_id) do nothing returning id into v_run;
  if v_run is null then select id into v_run from public.automation_runs where dispatch_id=new.id; end if;
  perform command_center_private.log_run_event(v_run,'run_created','queued',jsonb_build_object('job_kind',new.job_kind,'target_id',new.target_id));
  perform command_center_private.execute_run(v_run);
  return new;
end;
$$;

drop trigger if exists zy_automation_dispatch_run on public.automation_dispatch_queue;
create trigger zy_automation_dispatch_run after insert on public.automation_dispatch_queue
for each row execute function command_center_private.dispatch_to_run();

-- Phase 3 delivery is retained, but delegated to the idempotent helper so Phase 8 can safely retry it.
create or replace function public.command_center_deliver_dispatch_notification()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.job_kind='notification' then perform command_center_private.ensure_dispatch_notification(new.id); end if;
  return new;
end;
$$;
revoke all on function public.command_center_deliver_dispatch_notification() from public,anon,authenticated;
grant execute on function public.command_center_deliver_dispatch_notification() to postgres,service_role;

create or replace function public.command_center_prepare_automation_schedule()
returns trigger
language plpgsql
set search_path=public,pg_temp
as $$
declare
  v_recalculate boolean;
  v_condition_owner uuid;
  v_condition_project text;
  v_condition_status text;
  v_target_owner uuid;
  v_target_project text;
  v_target_status text;
begin
  new.name:=btrim(new.name);
  new.job_label:=btrim(new.job_label);
  new.timezone:=coalesce(nullif(btrim(new.timezone),''),'UTC');
  if new.name='' then raise exception 'Schedule name is required'; end if;
  if new.job_label='' then raise exception 'Scheduled job is required'; end if;
  if not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'Invalid scheduler timezone'; end if;

  if new.condition_id is not null then
    select owner_id,project_id,status into v_condition_owner,v_condition_project,v_condition_status from public.automation_conditions where id=new.condition_id;
    if not found or v_condition_owner<>new.owner_id then raise exception 'Schedule condition must belong to the owner'; end if;
    if new.project_id is null or v_condition_project<>new.project_id then raise exception 'Schedule and condition must use the same project'; end if;
    if v_condition_status='archived' then raise exception 'Archived conditions cannot be attached to schedules'; end if;
  end if;

  if new.job_kind='notification' then
    new.target_id:=null;
  elsif new.job_kind='report' then
    if new.target_id is null then raise exception 'Report schedule requires a report definition'; end if;
    select owner_id,project_id,status into v_target_owner,v_target_project,v_target_status from public.automation_report_definitions where id=new.target_id;
    if not found or v_target_owner<>new.owner_id or v_target_status='archived' then raise exception 'Report target is unavailable'; end if;
    if new.project_id is distinct from v_target_project then raise exception 'Report schedule project must match the report definition'; end if;
  elsif new.job_kind='action' then
    if new.target_id is null then raise exception 'Action schedule requires an action definition'; end if;
    select owner_id,project_id,authorization_state into v_target_owner,v_target_project,v_target_status from public.automation_action_definitions where id=new.target_id;
    if not found or v_target_owner<>new.owner_id or v_target_status<>'authorized' then raise exception 'Action schedule target must be authorized'; end if;
    if new.project_id is distinct from v_target_project then raise exception 'Action schedule project must match the action definition'; end if;
  else
    if new.target_id is null then raise exception 'Workflow schedule requires a workflow'; end if;
    select owner_id,null::text,status into v_target_owner,v_target_project,v_target_status from public.automation_workflows where id=new.target_id;
    if not found or v_target_owner<>new.owner_id or v_target_status='archived' then raise exception 'Workflow target is unavailable'; end if;
    new.project_id:=null;
    new.condition_id:=null;
  end if;

  if new.schedule_kind<>'weekly' then new.weekdays:='{}'::smallint[]; end if;
  if new.schedule_kind not in ('daily','weekly') then new.local_time:=null; end if;
  if new.schedule_kind<>'interval' then new.interval_minutes:=null; end if;
  if new.status='archived' then new.archived_at:=coalesce(new.archived_at,now()); else new.archived_at:=null; end if;

  v_recalculate:=tg_op='INSERT';
  if tg_op='UPDATE' then
    v_recalculate:=new.schedule_kind is distinct from old.schedule_kind or new.schedule_at is distinct from old.schedule_at or new.interval_minutes is distinct from old.interval_minutes or new.local_time is distinct from old.local_time or new.weekdays is distinct from old.weekdays or new.timezone is distinct from old.timezone or new.status is distinct from old.status;
  end if;
  if new.status='active' and v_recalculate then
    new.next_run_at:=public.command_center_scheduler_next_run(new.schedule_kind,new.schedule_at,new.interval_minutes,new.local_time,new.weekdays,new.timezone,clock_timestamp()-interval '1 second');
    if new.next_run_at is null then new.status:='completed'; end if;
  elsif new.status<>'active' then new.next_run_at:=null;
  end if;
  return new;
end;
$$;

create or replace function public.command_center_scheduler_tick(p_now timestamptz default clock_timestamp(),p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare r public.automation_schedules%rowtype; v_count integer:=0; v_trigger_count integer; v_next timestamptz;
begin
  for r in select * from public.automation_schedules where status='active' and next_run_at is not null and next_run_at<=p_now order by next_run_at,id limit greatest(1,least(coalesce(p_limit,100),500)) for update skip locked loop
    insert into public.automation_dispatch_queue(owner_id,project_id,schedule_id,schedule_name,job_label,scheduled_for,condition_id,condition_state,notification_state,job_kind,target_id,max_attempts,metadata)
    values(r.owner_id,r.project_id,r.id,r.name,r.job_label,r.next_run_at,r.condition_id,case when r.condition_id is null then 'not_required' else 'pending' end,case when r.job_kind='notification' then 'pending' else 'not_applicable' end,r.job_kind,r.target_id,r.max_attempts,jsonb_build_object('scheduler_phase',1,'condition_evaluator_phase',2,'job_kind',r.job_kind,'automation_complete_phases',jsonb_build_array(4,5,6,7,8)))
    on conflict(schedule_id,scheduled_for) do nothing;
    v_trigger_count:=r.trigger_count+1;
    if r.schedule_kind='once' or (r.max_runs is not null and v_trigger_count>=r.max_runs) then
      update public.automation_schedules set last_triggered_at=r.next_run_at,trigger_count=v_trigger_count,status='completed',next_run_at=null where id=r.id;
    else
      v_next:=public.command_center_scheduler_next_run(r.schedule_kind,r.schedule_at,r.interval_minutes,r.local_time,r.weekdays,r.timezone,greatest(p_now,r.next_run_at));
      update public.automation_schedules set last_triggered_at=r.next_run_at,trigger_count=v_trigger_count,next_run_at=v_next,status=case when v_next is null then 'completed' else 'active' end where id=r.id;
    end if;
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.command_center_scheduler_tick(timestamptz,integer) from public,anon,authenticated;
grant execute on function public.command_center_scheduler_tick(timestamptz,integer) to postgres,service_role;

create or replace function command_center_private.queue_manual(p_kind text,p_target uuid)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare v_owner uuid:=(select auth.uid()); v_project text; v_name text; v_label text; v_state text; v_dispatch uuid;
begin
  if v_owner is null then raise exception 'Authentication required'; end if;
  if not (select public.is_command_center_authorized()) then raise exception 'Command Center authorization required'; end if;
  if p_kind='report' then
    select project_id,name,status into v_project,v_name,v_state from public.automation_report_definitions where id=p_target and owner_id=v_owner;
    if not found or v_state<>'active' then raise exception 'Active report definition not found'; end if;
    v_label:='Generate report · '||v_name;
  elsif p_kind='action' then
    select project_id,name,authorization_state into v_project,v_name,v_state from public.automation_action_definitions where id=p_target and owner_id=v_owner and status='active';
    if not found or v_state<>'authorized' then raise exception 'Authorized active action not found'; end if;
    v_label:='Run action · '||v_name;
  elsif p_kind='workflow' then
    select null::text,name,status into v_project,v_name,v_state from public.automation_workflows where id=p_target and owner_id=v_owner;
    if not found or v_state<>'active' then raise exception 'Active workflow not found'; end if;
    v_label:='Run workflow · '||v_name;
  else raise exception 'Unsupported automation kind';
  end if;
  insert into public.automation_dispatch_queue(owner_id,project_id,schedule_id,schedule_name,job_label,scheduled_for,status,condition_state,notification_state,job_kind,target_id,max_attempts,metadata)
  values(v_owner,v_project,null,'Manual · '||v_name,v_label,now(),'queued','not_required','not_applicable',p_kind,p_target,3,jsonb_build_object('manual_run',true,'automation_phase',case p_kind when 'report' then 4 when 'action' then 5 else 6 end)) returning id into v_dispatch;
  return v_dispatch;
end;
$$;

create or replace function public.command_center_queue_report(p_report_id uuid) returns uuid language sql security definer set search_path='' as $$ select command_center_private.queue_manual('report',p_report_id); $$;
create or replace function public.command_center_queue_action(p_action_id uuid) returns uuid language sql security definer set search_path='' as $$ select command_center_private.queue_manual('action',p_action_id); $$;
create or replace function public.command_center_queue_workflow(p_workflow_id uuid) returns uuid language sql security definer set search_path='' as $$ select command_center_private.queue_manual('workflow',p_workflow_id); $$;
revoke all on function public.command_center_queue_report(uuid),public.command_center_queue_action(uuid),public.command_center_queue_workflow(uuid) from public,anon;
grant execute on function public.command_center_queue_report(uuid),public.command_center_queue_action(uuid),public.command_center_queue_workflow(uuid) to authenticated;

create or replace function public.command_center_retry_automation_run(p_run_id uuid)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare r public.automation_runs%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not (select public.is_command_center_authorized()) then raise exception 'Command Center authorization required'; end if;
  select * into r from public.automation_runs where id=p_run_id and owner_id=(select auth.uid()) for update;
  if not found then raise exception 'Automation run not found'; end if;
  if r.status not in ('failed','retrying') then raise exception 'Only failed or retrying runs can be retried'; end if;
  if r.attempt_count>=r.max_attempts then
    update public.automation_runs set max_attempts=least(10,max_attempts+1) where id=r.id returning * into r;
  end if;
  update public.automation_runs set status='retrying',next_retry_at=now(),completed_at=null,updated_at=now() where id=r.id;
  perform command_center_private.log_run_event(r.id,'manual_retry_requested','retrying',jsonb_build_object('previous_attempts',r.attempt_count));
  return command_center_private.execute_run(r.id);
end;
$$;
revoke all on function public.command_center_retry_automation_run(uuid) from public,anon;
grant execute on function public.command_center_retry_automation_run(uuid) to authenticated;

create or replace function public.command_center_automation_recovery_tick(p_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare r record; v_count integer:=0;
begin
  for r in select id from public.automation_runs where status='retrying' and next_retry_at is not null and next_retry_at<=now() order by next_retry_at,id limit greatest(1,least(coalesce(p_limit,50),200)) for update skip locked loop
    perform command_center_private.execute_run(r.id);
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.command_center_automation_recovery_tick(integer) from public,anon,authenticated;
grant execute on function public.command_center_automation_recovery_tick(integer) to postgres,service_role;

-- Keep the existing scheduler heartbeat and add one bounded recovery heartbeat.
do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname='command-center-automation-recovery' loop perform cron.unschedule(j.jobid); end loop;
  perform cron.schedule('command-center-automation-recovery','* * * * *','select public.command_center_automation_recovery_tick();');
end $$;

-- Private execution functions are never exposed to browser roles.
revoke all on all functions in schema command_center_private from public,anon,authenticated;
grant execute on all functions in schema command_center_private to postgres,service_role;
