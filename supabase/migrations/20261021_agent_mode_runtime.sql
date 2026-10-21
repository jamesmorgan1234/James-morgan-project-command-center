-- Agent Mode core/runtime migration.
-- Bounded, owner-scoped, fail-closed orchestration over existing Command Center capabilities.
-- No seed/fake activity is created by this migration.

create table if not exists public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  objective text not null check (btrim(objective) <> ''),
  success_criteria jsonb not null default '[]'::jsonb,
  excluded_scope jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft','active','paused','blocked','needs_user_action','completed','partially_completed','canceled','failed')),
  primary_project_id text not null references public.projects(id) on delete restrict,
  current_project_id text references public.projects(id) on delete restrict,
  permission_envelope jsonb not null default '{"allowed_tool_categories":[],"allow_work":false}'::jsonb,
  execution_policy jsonb not null default '{}'::jsonb,
  dry_run boolean not null default false,
  pause_requested boolean not null default false,
  cancel_requested boolean not null default false,
  current_step_id uuid,
  checkpoint_id uuid,
  exact_next_action text,
  started_at timestamptz,
  completed_at timestamptz,
  paused_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(success_criteria) in ('array','object')),
  check (jsonb_typeof(excluded_scope) in ('array','object')),
  check (jsonb_typeof(permission_envelope)='object'),
  check (jsonb_typeof(execution_policy)='object')
);

create table if not exists public.agent_session_projects (
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  owner_id uuid not null,
  project_id text not null references public.projects(id) on delete restrict,
  sort_order integer not null default 0,
  project_role text not null default 'secondary' check (project_role in ('primary','secondary')),
  books_target text,
  state text not null default 'eligible'
    check (state in ('eligible','active','blocked','needs_user_action','completed','excluded')),
  checkpoint_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(session_id,project_id)
);

create table if not exists public.agent_steps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  project_id text not null references public.projects(id) on delete restrict,
  step_key text not null,
  title text not null check (btrim(title) <> ''),
  details text not null default '',
  position integer not null default 0,
  dependencies uuid[] not null default '{}'::uuid[],
  route text not null
    check (route in ('normal_chat','automation','integration','work','user_only')),
  tool_category text not null check (btrim(tool_category) <> ''),
  scope_class text not null default 'small'
    check (scope_class in ('micro','small','moderate','substantial')),
  model_rung text
    check (model_rung is null or model_rung in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium')),
  risk_class text not null default 'low'
    check (risk_class in ('low','medium','high','protected')),
  impact_radius text not null default 'local_unit'
    check (impact_radius in ('local_unit','single_project','multi_project','public_or_account','portfolio_wide')),
  side_effect boolean not null default false,
  protected_boundary boolean not null default false,
  authorization_id uuid references public.security_action_authorizations(id) on delete set null,
  verification_required text not null default 'tool_result'
    check (verification_required in ('tool_result','canonical_record','live_verified')),
  status text not null default 'pending'
    check (status in ('pending','running','verification_pending','verified','blocked','needs_user_action','failed','canceled','skipped')),
  idempotency_key text,
  downstream_kind text
    check (downstream_kind is null or downstream_kind in ('brain','automation','integration','security','deployment','work','normal_chat','user_only')),
  downstream_ref text,
  retry_epoch integer not null default 0 check (retry_epoch >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  meaningful_failure_count integer not null default 0 check (meaningful_failure_count >= 0),
  retry_count integer not null default 0 check (retry_count >= 0),
  last_failure_class text,
  last_retry_fingerprint text,
  last_state_hash text,
  next_retry_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id,step_key),
  unique(owner_id,idempotency_key),
  check ((route='work' and model_rung is not null) or (route<>'work' and model_rung is null))
);

alter table public.agent_sessions
  add constraint agent_sessions_current_step_fk
  foreign key (current_step_id) references public.agent_steps(id) on delete set null;

create table if not exists public.agent_step_evidence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  step_id uuid not null references public.agent_steps(id) on delete cascade,
  strength text not null
    check (strength in ('self_report_only','tool_result','canonical_record','live_verified')),
  evidence_kind text not null check (btrim(evidence_kind) <> ''),
  evidence_ref text,
  evidence jsonb not null default '{}'::jsonb,
  verified boolean not null default false,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_checkpoints (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  project_id text references public.projects(id) on delete restrict,
  step_id uuid references public.agent_steps(id) on delete set null,
  session_status text not null,
  objective text not null,
  project_scope jsonb not null,
  permission_envelope jsonb not null,
  verified_step_ids uuid[] not null default '{}'::uuid[],
  failed_step_ids uuid[] not null default '{}'::uuid[],
  blocked_step_ids uuid[] not null default '{}'::uuid[],
  work_state jsonb not null default '{}'::jsonb,
  retry_state jsonb not null default '{}'::jsonb,
  evidence_refs jsonb not null default '[]'::jsonb,
  exact_next_action text,
  forbidden_actions jsonb not null default '[]'::jsonb,
  progress_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.agent_sessions
  add constraint agent_sessions_checkpoint_fk
  foreign key (checkpoint_id) references public.agent_checkpoints(id) on delete set null;

create table if not exists public.agent_step_attempts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  project_id text not null references public.projects(id) on delete restrict,
  step_id uuid not null references public.agent_steps(id) on delete cascade,
  handoff_id uuid,
  attempt_number integer not null check (attempt_number > 0),
  route text not null check (route in ('normal_chat','automation','integration','work','user_only')),
  model_rung text check (model_rung is null or model_rung in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium')),
  provider text,
  operation_key text not null,
  input_hash text,
  expected_side_effect_key text,
  state_hash text,
  retry_fingerprint text not null,
  state_changed_before_retry boolean not null default false,
  retry_reason text,
  status text not null default 'in_progress'
    check (status in ('in_progress','returned','succeeded','failed','blocked','canceled')),
  failure_class text,
  result_evidence jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique(step_id,attempt_number)
);

create table if not exists public.agent_work_handoffs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  project_id text not null references public.projects(id) on delete restrict,
  step_id uuid not null references public.agent_steps(id) on delete cascade,
  capability_boundary_reason text not null check (btrim(capability_boundary_reason) <> ''),
  provider text not null check (btrim(provider) <> ''),
  account_ref text,
  operation_key text not null check (btrim(operation_key) <> ''),
  model_rung text not null
    check (model_rung in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium')),
  scope_class text not null
    check (scope_class in ('micro','small','moderate','substantial')),
  risk_class text not null
    check (risk_class in ('low','medium','high','protected')),
  bounded_instructions jsonb not null default '{}'::jsonb,
  forbidden_actions jsonb not null default '[]'::jsonb,
  expected_evidence jsonb not null default '[]'::jsonb,
  input_hash text,
  state_hash text,
  expected_side_effect_key text,
  approval_state text not null default 'not_required'
    check (approval_state in ('not_required','required','authorized','revoked')),
  authorization_id uuid references public.security_action_authorizations(id) on delete set null,
  state text not null default 'proposed'
    check (state in ('proposed','approved','in_progress','returned','verified','failed','blocked','canceled')),
  attempt_id uuid,
  returned_evidence jsonb not null default '{}'::jsonb,
  failure_class text,
  normal_chat_resumed boolean not null default false,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_step_attempts
  add constraint agent_step_attempts_handoff_fk
  foreign key (handoff_id) references public.agent_work_handoffs(id) on delete set null;

alter table public.agent_work_handoffs
  add constraint agent_work_handoffs_attempt_fk
  foreign key (attempt_id) references public.agent_step_attempts(id) on delete set null;

create table if not exists public.agent_work_queue (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  project_id text not null references public.projects(id) on delete restrict,
  step_id uuid not null references public.agent_steps(id) on delete cascade,
  handoff_id uuid not null unique references public.agent_work_handoffs(id) on delete cascade,
  priority integer not null default 100,
  status text not null default 'queued'
    check (status in ('queued','claimed','done','failed','blocked','canceled')),
  queued_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.agent_circuit_breakers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid references public.agent_sessions(id) on delete cascade,
  project_id text references public.projects(id) on delete restrict,
  step_id uuid references public.agent_steps(id) on delete cascade,
  provider text,
  breaker_type text not null
    check (breaker_type in ('step','provider','portfolio','no_progress')),
  scope_key text not null,
  status text not null default 'open' check (status in ('open','closed')),
  reason text not null,
  failure_count integer not null default 0,
  retry_fingerprint text,
  state_hash text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  reopened_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists agent_circuit_breakers_one_open_scope
  on public.agent_circuit_breakers(owner_id,breaker_type,scope_key)
  where status='open';

create table if not exists public.agent_tool_registry (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  capability_key text not null,
  environment text not null
    check (environment in ('normal_chat','work','external_tool','user_only')),
  provider text not null default '',
  tool_key text not null default '',
  availability text not null
    check (availability in ('available','unavailable','degraded','unknown')),
  auth_state text not null
    check (auth_state in ('authenticated','needs_auth','not_applicable','unknown')),
  action_scope jsonb not null default '{}'::jsonb,
  free_status text not null default 'unknown'
    check (free_status in ('free','paid','unknown')),
  last_success_at timestamptz,
  error_class text,
  approved_fallback text,
  last_verified_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,capability_key,environment,provider,tool_key)
);

create index if not exists agent_sessions_owner_status_idx on public.agent_sessions(owner_id,status,updated_at desc);
create index if not exists agent_session_projects_owner_idx on public.agent_session_projects(owner_id,session_id,sort_order);
create index if not exists agent_steps_session_status_idx on public.agent_steps(owner_id,session_id,status,position);
create index if not exists agent_steps_project_status_idx on public.agent_steps(owner_id,project_id,status);
create index if not exists agent_step_evidence_step_idx on public.agent_step_evidence(owner_id,step_id,verified,strength);
create index if not exists agent_checkpoints_session_idx on public.agent_checkpoints(owner_id,session_id,created_at desc);
create index if not exists agent_attempts_step_idx on public.agent_step_attempts(owner_id,step_id,attempt_number desc);
create index if not exists agent_attempts_provider_fail_idx on public.agent_step_attempts(owner_id,provider,status,ended_at desc);
create index if not exists agent_work_handoffs_state_idx on public.agent_work_handoffs(owner_id,state,created_at);
create index if not exists agent_work_queue_status_idx on public.agent_work_queue(owner_id,status,priority,queued_at);
create index if not exists agent_breakers_open_idx on public.agent_circuit_breakers(owner_id,status,breaker_type,provider);
create index if not exists agent_tool_registry_owner_idx on public.agent_tool_registry(owner_id,last_verified_at desc);

create trigger agent_sessions_set_updated_at
before update on public.agent_sessions
for each row execute function public.command_center_set_updated_at();

create trigger agent_session_projects_set_updated_at
before update on public.agent_session_projects
for each row execute function public.command_center_set_updated_at();

create trigger agent_steps_set_updated_at
before update on public.agent_steps
for each row execute function public.command_center_set_updated_at();

create trigger agent_work_handoffs_set_updated_at
before update on public.agent_work_handoffs
for each row execute function public.command_center_set_updated_at();

create trigger agent_tool_registry_set_updated_at
before update on public.agent_tool_registry
for each row execute function public.command_center_set_updated_at();

alter table public.agent_sessions enable row level security;
alter table public.agent_session_projects enable row level security;
alter table public.agent_steps enable row level security;
alter table public.agent_step_evidence enable row level security;
alter table public.agent_checkpoints enable row level security;
alter table public.agent_step_attempts enable row level security;
alter table public.agent_work_handoffs enable row level security;
alter table public.agent_work_queue enable row level security;
alter table public.agent_circuit_breakers enable row level security;
alter table public.agent_tool_registry enable row level security;

create policy agent_sessions_select_own on public.agent_sessions
for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create policy agent_session_projects_select_own on public.agent_session_projects
for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create policy agent_steps_select_own on public.agent_steps
for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create policy agent_step_evidence_select_own on public.agent_step_evidence
for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create policy agent_checkpoints_select_own on public.agent_checkpoints
for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

revoke all on table public.agent_sessions from public, anon, authenticated;
revoke all on table public.agent_session_projects from public, anon, authenticated;
revoke all on table public.agent_steps from public, anon, authenticated;
revoke all on table public.agent_step_evidence from public, anon, authenticated;
revoke all on table public.agent_checkpoints from public, anon, authenticated;
revoke all on table public.agent_step_attempts from public, anon, authenticated;
revoke all on table public.agent_work_handoffs from public, anon, authenticated;
revoke all on table public.agent_work_queue from public, anon, authenticated;
revoke all on table public.agent_circuit_breakers from public, anon, authenticated;
revoke all on table public.agent_tool_registry from public, anon, authenticated;

grant select on table public.agent_sessions to authenticated;
grant select on table public.agent_session_projects to authenticated;
grant select on table public.agent_steps to authenticated;
grant select on table public.agent_step_evidence to authenticated;
grant select on table public.agent_checkpoints to authenticated;

grant select,insert,update,delete on table public.agent_sessions to service_role;
grant select,insert,update,delete on table public.agent_session_projects to service_role;
grant select,insert,update,delete on table public.agent_steps to service_role;
grant select,insert,update,delete on table public.agent_step_evidence to service_role;
grant select,insert,update,delete on table public.agent_checkpoints to service_role;
grant select,insert,update,delete on table public.agent_step_attempts to service_role;
grant select,insert,update,delete on table public.agent_work_handoffs to service_role;
grant select,insert,update,delete on table public.agent_work_queue to service_role;
grant select,insert,update,delete on table public.agent_circuit_breakers to service_role;
grant select,insert,update,delete on table public.agent_tool_registry to service_role;

create or replace function public.command_center_agent_strength_rank(p_strength text)
returns integer
language sql
immutable
set search_path to ''
as $$
  select case p_strength
    when 'self_report_only' then 0
    when 'tool_result' then 1
    when 'canonical_record' then 2
    when 'live_verified' then 3
    else -1
  end;
$$;

create or replace function public.command_center_agent_create_session(
  p_objective text,
  p_project_ids text[],
  p_primary_project_id text,
  p_success_criteria jsonb default '[]'::jsonb,
  p_excluded_scope jsonb default '[]'::jsonb,
  p_permission_envelope jsonb default '{"allowed_tool_categories":[],"allow_work":false}'::jsonb,
  p_execution_policy jsonb default '{}'::jsonb,
  p_books_targets jsonb default '{}'::jsonb,
  p_dry_run boolean default false
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid := (select auth.uid());
  sid uuid;
  p record;
  n_distinct integer;
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;
  if coalesce(btrim(p_objective),'')='' then
    raise exception 'Agent objective is required';
  end if;
  if p_project_ids is null or cardinality(p_project_ids)=0 then
    raise exception 'Explicit project scope is required';
  end if;
  select count(*) into n_distinct from (select distinct x from unnest(p_project_ids) x) q;
  if n_distinct <> cardinality(p_project_ids) then
    raise exception 'Duplicate project IDs are not allowed';
  end if;
  if not (p_primary_project_id = any(p_project_ids)) then
    raise exception 'Primary project must be inside explicit project scope';
  end if;
  if jsonb_typeof(coalesce(p_permission_envelope,'{}'::jsonb)) <> 'object' then
    raise exception 'Permission envelope must be an object';
  end if;
  if jsonb_typeof(coalesce(p_permission_envelope->'allowed_tool_categories','[]'::jsonb)) <> 'array' then
    raise exception 'allowed_tool_categories must be an array';
  end if;
  if jsonb_typeof(coalesce(p_books_targets,'{}'::jsonb)) <> 'object' then
    raise exception 'Books targets must be an object keyed by project ID';
  end if;
  if exists (
    select 1
    from unnest(p_project_ids) x(project_id)
    left join public.projects pr on pr.id=x.project_id and pr.owner_id=u
    where pr.id is null
  ) then
    raise exception 'Project scope contains a missing or unauthorized project';
  end if;

  for p in
    select pr.id,pr.category
    from public.projects pr
    join unnest(p_project_ids) x(project_id) on x.project_id=pr.id
    where pr.owner_id=u
  loop
    if lower(coalesce(p.category,'')) like '%book%'
       and coalesce(btrim(p_books_targets->>p.id),'')='' then
      raise exception 'Books project % requires an explicit named Books target',p.id;
    end if;
  end loop;

  insert into public.agent_sessions(
    owner_id,objective,success_criteria,excluded_scope,primary_project_id,current_project_id,
    permission_envelope,execution_policy,dry_run
  ) values (
    u,btrim(p_objective),coalesce(p_success_criteria,'[]'::jsonb),coalesce(p_excluded_scope,'[]'::jsonb),
    p_primary_project_id,p_primary_project_id,coalesce(p_permission_envelope,'{}'::jsonb),
    coalesce(p_execution_policy,'{}'::jsonb),coalesce(p_dry_run,false)
  ) returning id into sid;

  insert into public.agent_session_projects(
    session_id,owner_id,project_id,sort_order,project_role,books_target
  )
  select sid,u,x.project_id,x.ord-1,
         case when x.project_id=p_primary_project_id then 'primary' else 'secondary' end,
         nullif(btrim(p_books_targets->>x.project_id),'')
  from unnest(p_project_ids) with ordinality x(project_id,ord);

  return sid;
end
$$;

create or replace function public.command_center_agent_add_step(
  p_session_id uuid,
  p_project_id text,
  p_step_key text,
  p_title text,
  p_details text,
  p_route text,
  p_tool_category text,
  p_scope_class text default 'small',
  p_model_rung text default null,
  p_risk_class text default 'low',
  p_impact_radius text default 'local_unit',
  p_side_effect boolean default false,
  p_protected_boundary boolean default false,
  p_verification_required text default 'tool_result',
  p_dependencies uuid[] default '{}'::uuid[],
  p_idempotency_key text default null,
  p_downstream_kind text default null,
  p_downstream_ref text default null,
  p_position integer default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid := (select auth.uid());
  s public.agent_sessions%rowtype;
  step_id uuid;
  pos integer;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=u;
  if not found then raise exception 'Agent session not found'; end if;
  if s.status not in ('draft','active','paused') then raise exception 'Session cannot accept new steps in state %',s.status; end if;
  if not exists(select 1 from public.agent_session_projects sp where sp.session_id=s.id and sp.owner_id=u and sp.project_id=p_project_id and sp.state<>'excluded') then
    raise exception 'Step project is outside explicit session scope';
  end if;
  if coalesce(btrim(p_step_key),'')='' or coalesce(btrim(p_title),'')='' or coalesce(btrim(p_tool_category),'')='' then
    raise exception 'Step key, title and tool category are required';
  end if;
  if p_route not in ('normal_chat','automation','integration','work','user_only') then raise exception 'Unsupported Agent Mode route'; end if;
  if p_scope_class not in ('micro','small','moderate','substantial') then raise exception 'Invalid scope class'; end if;
  if p_risk_class not in ('low','medium','high','protected') then raise exception 'Invalid risk class'; end if;
  if p_impact_radius not in ('local_unit','single_project','multi_project','public_or_account','portfolio_wide') then raise exception 'Invalid impact radius'; end if;
  if p_verification_required not in ('tool_result','canonical_record','live_verified') then raise exception 'Invalid verification requirement'; end if;
  if not (coalesce(s.permission_envelope->'allowed_tool_categories','[]'::jsonb) ? p_tool_category) then
    raise exception 'Tool category is outside the session permission envelope';
  end if;
  if p_route='work' then
    if coalesce((s.permission_envelope->>'allow_work')::boolean,false) is not true then raise exception 'Work is not allowed by this session permission envelope'; end if;
    if p_model_rung not in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium') then raise exception 'Invalid or prohibited Work model rung'; end if;
  elsif p_model_rung is not null then
    raise exception 'Model rung is valid only for Work-routed steps';
  end if;
  if p_dependencies is not null and exists (
    select 1 from unnest(p_dependencies) d(dep)
    left join public.agent_steps ds on ds.id=d.dep and ds.session_id=s.id and ds.owner_id=u
    where ds.id is null
  ) then
    raise exception 'Dependency is outside this session';
  end if;

  select coalesce(p_position,coalesce(max(position),-1)+1) into pos
  from public.agent_steps where session_id=s.id and owner_id=u;

  insert into public.agent_steps(
    owner_id,session_id,project_id,step_key,title,details,position,dependencies,route,tool_category,
    scope_class,model_rung,risk_class,impact_radius,side_effect,protected_boundary,
    verification_required,idempotency_key,downstream_kind,downstream_ref,metadata
  ) values (
    u,s.id,p_project_id,btrim(p_step_key),btrim(p_title),coalesce(p_details,''),pos,coalesce(p_dependencies,'{}'::uuid[]),
    p_route,p_tool_category,p_scope_class,p_model_rung,p_risk_class,p_impact_radius,coalesce(p_side_effect,false),
    coalesce(p_protected_boundary,false),p_verification_required,nullif(btrim(p_idempotency_key),''),
    p_downstream_kind,p_downstream_ref,coalesce(p_metadata,'{}'::jsonb)
  ) returning id into step_id;

  return step_id;
end
$$;

create or replace function public.command_center_agent_start_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid := (select auth.uid());
  s public.agent_sessions%rowtype;
  nxt public.agent_steps%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=u for update;
  if not found then raise exception 'Agent session not found'; end if;
  if s.status <> 'draft' then raise exception 'Only draft sessions can be started'; end if;
  select * into nxt
  from public.agent_steps st
  where st.session_id=s.id and st.owner_id=u and st.status='pending'
  order by (st.project_id=s.primary_project_id) desc, st.position, st.created_at
  limit 1;
  if not found then raise exception 'Agent session has no executable steps'; end if;

  update public.agent_sessions
  set status='active',started_at=coalesce(started_at,now()),current_project_id=nxt.project_id,
      current_step_id=nxt.id,exact_next_action=nxt.title,pause_requested=false,cancel_requested=false
  where id=s.id;

  update public.agent_session_projects
  set state=case when project_id=nxt.project_id then 'active' else state end
  where session_id=s.id and owner_id=u;

  return jsonb_build_object('ok',true,'session_id',s.id,'current_step_id',nxt.id,'current_project_id',nxt.project_id);
end
$$;

create or replace function public.command_center_agent_attach_authorization(
  p_step_id uuid,
  p_authorization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid := (select auth.uid());
  st public.agent_steps%rowtype;
  a public.security_action_authorizations%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u;
  if not found then raise exception 'Agent step not found'; end if;
  select * into a from public.security_action_authorizations
  where id=p_authorization_id and owner_id=u and status='authorized'
    and (expires_at is null or expires_at>now());
  if not found then raise exception 'Valid Security authorization not found'; end if;
  if a.resource_type<>'agent_step' or a.resource_id<>st.id::text then
    raise exception 'Security authorization does not match this Agent step';
  end if;
  update public.agent_steps set authorization_id=a.id where id=st.id;
  return jsonb_build_object('ok',true,'step_id',st.id,'authorization_id',a.id);
end
$$;

create or replace function public.command_center_agent_begin_step(p_step_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid := (select auth.uid());
  st public.agent_steps%rowtype;
  s public.agent_sessions%rowtype;
  a public.security_action_authorizations%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u for update;
  if not found then raise exception 'Agent step not found'; end if;
  select * into s from public.agent_sessions where id=st.session_id and owner_id=u for update;
  if not found then raise exception 'Agent session not found'; end if;
  if s.status<>'active' or s.pause_requested or s.cancel_requested then raise exception 'Agent session is not eligible to begin a new side effect'; end if;
  if st.status<>'pending' then raise exception 'Agent step is not pending'; end if;
  if not exists(select 1 from public.agent_session_projects sp where sp.session_id=s.id and sp.owner_id=u and sp.project_id=st.project_id and sp.state<>'excluded') then
    raise exception 'Step project is outside explicit session scope';
  end if;
  if exists (
    select 1 from unnest(st.dependencies) d(dep)
    left join public.agent_steps ds on ds.id=d.dep and ds.session_id=s.id and ds.owner_id=u
    where ds.id is null or ds.status<>'verified'
  ) then raise exception 'Agent step dependencies are not verified'; end if;
  if not (coalesce(s.permission_envelope->'allowed_tool_categories','[]'::jsonb) ? st.tool_category) then
    raise exception 'Tool category is outside the session permission envelope';
  end if;
  if s.dry_run and st.side_effect then raise exception 'Dry-run session cannot begin an external side effect'; end if;
  if st.route='work' then raise exception 'Work-routed steps must start through the Work handoff gate'; end if;
  if st.protected_boundary or st.risk_class in ('high','protected') then
    if st.authorization_id is null then raise exception 'Protected Agent step requires Security authorization'; end if;
    select * into a from public.security_action_authorizations
    where id=st.authorization_id and owner_id=u and status='authorized'
      and resource_type='agent_step' and resource_id=st.id::text
      and (expires_at is null or expires_at>now());
    if not found then raise exception 'Protected Agent step authorization is invalid or expired'; end if;
  end if;
  if st.route='user_only' then
    update public.agent_steps set status='needs_user_action' where id=st.id;
    update public.agent_sessions set status='needs_user_action',exact_next_action=st.title where id=s.id;
    update public.agent_session_projects set state='needs_user_action' where session_id=s.id and project_id=st.project_id;
    return jsonb_build_object('ok',false,'needs_user_action',true,'step_id',st.id);
  end if;

  update public.agent_steps set status='running',started_at=coalesce(started_at,now()) where id=st.id;
  update public.agent_sessions set current_project_id=st.project_id,current_step_id=st.id,exact_next_action=st.title where id=s.id;
  update public.agent_session_projects set state='active' where session_id=s.id and project_id=st.project_id;
  return jsonb_build_object('ok',true,'step_id',st.id,'route',st.route,'downstream_kind',st.downstream_kind,'downstream_ref',st.downstream_ref);
end
$$;

create or replace function public.command_center_agent_add_evidence(
  p_step_id uuid,
  p_strength text,
  p_evidence_kind text,
  p_evidence_ref text default null,
  p_evidence jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid := (select auth.uid());
  st public.agent_steps%rowtype;
  eid uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u;
  if not found then raise exception 'Agent step not found'; end if;
  if p_strength not in ('self_report_only','tool_result','canonical_record','live_verified') then raise exception 'Invalid evidence strength'; end if;
  if coalesce(btrim(p_evidence_kind),'')='' then raise exception 'Evidence kind is required'; end if;
  insert into public.agent_step_evidence(owner_id,session_id,step_id,strength,evidence_kind,evidence_ref,evidence)
  values(u,st.session_id,st.id,p_strength,btrim(p_evidence_kind),nullif(btrim(p_evidence_ref),''),coalesce(p_evidence,'{}'::jsonb))
  returning id into eid;
  return eid;
end
$$;

create or replace function public.command_center_agent_confirm_evidence(
  p_evidence_id uuid,
  p_verified_by text default 'canonical_reconciler'
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid := (select auth.uid());
  e public.agent_step_evidence%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into e from public.agent_step_evidence where id=p_evidence_id and owner_id=u for update;
  if not found then raise exception 'Agent evidence not found'; end if;
  if e.strength='self_report_only' then raise exception 'Self-report evidence cannot satisfy verification'; end if;
  update public.agent_step_evidence
  set verified=true,verified_by=coalesce(nullif(btrim(p_verified_by),''),'canonical_reconciler'),verified_at=now()
  where id=e.id;
  return jsonb_build_object('ok',true,'evidence_id',e.id,'strength',e.strength);
end
$$;

create or replace function public.command_center_agent_verify_step(p_step_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid := (select auth.uid());
  st public.agent_steps%rowtype;
  s public.agent_sessions%rowtype;
  required_rank integer;
  actual_rank integer;
  nxt public.agent_steps%rowtype;
  remaining integer;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u for update;
  if not found then raise exception 'Agent step not found'; end if;
  select * into s from public.agent_sessions where id=st.session_id and owner_id=u for update;
  required_rank:=public.command_center_agent_strength_rank(st.verification_required);
  select coalesce(max(public.command_center_agent_strength_rank(e.strength)),-1) into actual_rank
  from public.agent_step_evidence e
  where e.step_id=st.id and e.owner_id=u and e.verified;
  if actual_rank < required_rank then
    raise exception 'Verification gate not satisfied: required %, verified evidence rank %',st.verification_required,actual_rank;
  end if;

  update public.agent_steps set status='verified',verified_at=now(),completed_at=coalesce(completed_at,now()) where id=st.id;
  update public.agent_work_handoffs set state='verified' where step_id=st.id and owner_id=u and state='returned';

  select count(*) into remaining
  from public.agent_steps
  where session_id=s.id and owner_id=u and status not in ('verified','skipped','canceled');

  if remaining=0 then
    update public.agent_sessions
    set status='completed',completed_at=now(),current_step_id=null,exact_next_action=null
    where id=s.id;
    update public.agent_session_projects set state='completed' where session_id=s.id and owner_id=u;
    return jsonb_build_object('ok',true,'verified',true,'session_completed',true,'step_id',st.id);
  end if;

  select * into nxt
  from public.agent_steps cand
  where cand.session_id=s.id and cand.owner_id=u and cand.status='pending'
    and not exists (
      select 1 from unnest(cand.dependencies) d(dep)
      left join public.agent_steps ds on ds.id=d.dep and ds.session_id=s.id and ds.owner_id=u
      where ds.id is null or ds.status<>'verified'
    )
  order by (cand.project_id=st.project_id) desc,
           (cand.project_id=s.primary_project_id) desc,
           cand.position,cand.created_at
  limit 1;

  if found then
    update public.agent_sessions
    set current_project_id=nxt.project_id,current_step_id=nxt.id,exact_next_action=nxt.title,
        status=case when pause_requested then 'paused' when cancel_requested then 'canceled' else 'active' end,
        paused_at=case when pause_requested then now() else paused_at end,
        canceled_at=case when cancel_requested then now() else canceled_at end
    where id=s.id;
    update public.agent_session_projects
    set state=case when project_id=nxt.project_id then 'active' when project_id=st.project_id then 'eligible' else state end
    where session_id=s.id and owner_id=u and state not in ('completed','excluded');
  else
    update public.agent_sessions
    set current_step_id=null,status=case
      when pause_requested then 'paused'
      when cancel_requested then 'canceled'
      when exists(select 1 from public.agent_steps x where x.session_id=s.id and x.owner_id=u and x.status='needs_user_action') then 'needs_user_action'
      else 'blocked' end
    where id=s.id;
  end if;
  return jsonb_build_object('ok',true,'verified',true,'session_completed',false,'step_id',st.id,'next_step_id',case when nxt.id is null then null else nxt.id end);
end
$$;

create or replace function public.command_center_agent_checkpoint(
  p_session_id uuid,
  p_exact_next_action text default null,
  p_forbidden_actions jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid := (select auth.uid());
  s public.agent_sessions%rowtype;
  cid uuid;
  v_ids uuid[];
  f_ids uuid[];
  b_ids uuid[];
  scope_json jsonb;
  work_json jsonb;
  retry_json jsonb;
  ev_json jsonb;
  ph text;
  same_count integer;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=u for update;
  if not found then raise exception 'Agent session not found'; end if;

  select coalesce(array_agg(id order by position) filter(where status='verified'),'{}'::uuid[]),
         coalesce(array_agg(id order by position) filter(where status='failed'),'{}'::uuid[]),
         coalesce(array_agg(id order by position) filter(where status in ('blocked','needs_user_action')),'{}'::uuid[])
  into v_ids,f_ids,b_ids
  from public.agent_steps where session_id=s.id and owner_id=u;

  select coalesce(jsonb_agg(jsonb_build_object(
    'project_id',sp.project_id,'state',sp.state,'checkpoint_ref',sp.checkpoint_ref,
    'books_opt_in',sp.books_target is not null
  ) order by sp.sort_order),'[]'::jsonb)
  into scope_json
  from public.agent_session_projects sp where sp.session_id=s.id and sp.owner_id=u;

  select jsonb_build_object(
    'active',coalesce(jsonb_agg(jsonb_build_object('handoff_id',h.id,'step_id',h.step_id,'state',h.state,'model_rung',h.model_rung))
      filter(where h.state in ('proposed','approved','in_progress','returned')),'[]'::jsonb),
    'in_progress_count',count(*) filter(where h.state='in_progress')
  ) into work_json
  from public.agent_work_handoffs h where h.session_id=s.id and h.owner_id=u;

  retry_json:=jsonb_build_object(
    'open_breakers',coalesce((
      select jsonb_agg(jsonb_build_object('type',b.breaker_type,'scope_key',b.scope_key,'reason',b.reason) order by b.opened_at desc)
      from public.agent_circuit_breakers b
      where b.session_id=s.id and b.owner_id=u and b.status='open'
    ),'[]'::jsonb),
    'failed_attempts',(
      select count(*) from public.agent_step_attempts a
      where a.session_id=s.id and a.owner_id=u and a.status='failed'
    )
  );

  select coalesce(jsonb_agg(jsonb_build_object('step_id',e.step_id,'evidence_id',e.id,'strength',e.strength,'verified',e.verified)),'[]'::jsonb)
  into ev_json
  from public.agent_step_evidence e where e.session_id=s.id and e.owner_id=u;

  ph:=md5(jsonb_build_object(
    'status',s.status,'current_project_id',s.current_project_id,'current_step_id',s.current_step_id,
    'verified',v_ids,'failed',f_ids,'blocked',b_ids,'scope',scope_json,
    'next',coalesce(p_exact_next_action,s.exact_next_action)
  )::text);

  insert into public.agent_checkpoints(
    owner_id,session_id,project_id,step_id,session_status,objective,project_scope,permission_envelope,
    verified_step_ids,failed_step_ids,blocked_step_ids,work_state,retry_state,evidence_refs,
    exact_next_action,forbidden_actions,progress_hash
  ) values (
    u,s.id,s.current_project_id,s.current_step_id,s.status,s.objective,scope_json,s.permission_envelope,
    v_ids,f_ids,b_ids,coalesce(work_json,'{}'::jsonb),coalesce(retry_json,'{}'::jsonb),coalesce(ev_json,'[]'::jsonb),
    coalesce(p_exact_next_action,s.exact_next_action),coalesce(p_forbidden_actions,'[]'::jsonb),ph
  ) returning id into cid;

  update public.agent_sessions set checkpoint_id=cid,exact_next_action=coalesce(p_exact_next_action,exact_next_action) where id=s.id;

  select count(*) into same_count
  from (
    select progress_hash from public.agent_checkpoints
    where session_id=s.id and owner_id=u
    order by created_at desc limit 3
  ) q where progress_hash=ph;

  if s.status='active' and same_count>=3 then
    insert into public.agent_circuit_breakers(owner_id,session_id,project_id,step_id,breaker_type,scope_key,status,reason,state_hash,failure_count)
    values(u,s.id,s.current_project_id,s.current_step_id,'no_progress','session:'||s.id::text,'open','Three consecutive checkpoints produced no meaningful progress',ph,0)
    on conflict(owner_id,breaker_type,scope_key) where status='open'
    do update set reason=excluded.reason,state_hash=excluded.state_hash;
    update public.agent_sessions set status='paused',pause_requested=true,paused_at=now() where id=s.id;
  end if;

  return cid;
end
$$;

create or replace function public.command_center_agent_pause(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare u uuid:=(select auth.uid()); running boolean; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.agent_sessions where id=p_session_id and owner_id=u) then raise exception 'Agent session not found'; end if;
  select exists(select 1 from public.agent_steps where session_id=p_session_id and owner_id=u and status='running')
      or exists(select 1 from public.agent_work_handoffs where session_id=p_session_id and owner_id=u and state='in_progress')
  into running;
  update public.agent_sessions
  set pause_requested=true,status=case when running then status else 'paused' end,
      paused_at=case when running then paused_at else now() end
  where id=p_session_id and owner_id=u and status not in ('completed','canceled','failed');
  return jsonb_build_object('ok',true,'pause_requested',true,'waiting_for_atomic_action',running);
end
$$;

create or replace function public.command_center_agent_resume(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare u uuid:=(select auth.uid()); s public.agent_sessions%rowtype; nxt public.agent_steps%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=u for update;
  if not found then raise exception 'Agent session not found'; end if;
  if s.status<>'paused' then raise exception 'Only paused sessions can resume'; end if;
  if exists(select 1 from public.agent_circuit_breakers where owner_id=u and session_id=s.id and status='open' and breaker_type='no_progress') then
    raise exception 'No-progress circuit breaker must be reconciled before resume';
  end if;
  select * into nxt from public.agent_steps st
  where st.session_id=s.id and st.owner_id=u and st.status='pending'
    and not exists (
      select 1 from unnest(st.dependencies) d(dep)
      left join public.agent_steps ds on ds.id=d.dep and ds.owner_id=u and ds.session_id=s.id
      where ds.id is null or ds.status<>'verified'
    )
  order by (st.project_id=s.current_project_id) desc,(st.project_id=s.primary_project_id) desc,st.position limit 1;
  if not found then raise exception 'No eligible pending step is available to resume'; end if;
  update public.agent_sessions set status='active',pause_requested=false,paused_at=null,current_project_id=nxt.project_id,current_step_id=nxt.id,exact_next_action=nxt.title where id=s.id;
  return jsonb_build_object('ok',true,'session_id',s.id,'current_step_id',nxt.id);
end
$$;

create or replace function public.command_center_agent_cancel(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare u uuid:=(select auth.uid()); running boolean; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.agent_sessions where id=p_session_id and owner_id=u) then raise exception 'Agent session not found'; end if;
  select exists(select 1 from public.agent_steps where session_id=p_session_id and owner_id=u and status='running')
      or exists(select 1 from public.agent_work_handoffs where session_id=p_session_id and owner_id=u and state='in_progress')
  into running;
  update public.agent_sessions
  set cancel_requested=true,status=case when running then status else 'canceled' end,
      canceled_at=case when running then canceled_at else now() end
  where id=p_session_id and owner_id=u and status not in ('completed','canceled','failed');
  if not running then
    update public.agent_steps set status='canceled' where session_id=p_session_id and owner_id=u and status='pending';
    update public.agent_work_handoffs set state='canceled',ended_at=now() where session_id=p_session_id and owner_id=u and state in ('proposed','approved');
    update public.agent_work_queue set status='canceled',completed_at=now() where session_id=p_session_id and owner_id=u and status='queued';
  end if;
  return jsonb_build_object('ok',true,'cancel_requested',true,'waiting_for_atomic_action',running);
end
$$;

create or replace function public.command_center_agent_prepare_work_handoff(
  p_step_id uuid,
  p_capability_boundary_reason text,
  p_provider text,
  p_operation_key text,
  p_bounded_instructions jsonb,
  p_forbidden_actions jsonb default '[]'::jsonb,
  p_expected_evidence jsonb default '[]'::jsonb,
  p_account_ref text default null,
  p_input_hash text default null,
  p_state_hash text default null,
  p_expected_side_effect_key text default null,
  p_priority integer default 100
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid:=(select auth.uid());
  st public.agent_steps%rowtype;
  s public.agent_sessions%rowtype;
  hid uuid;
  auto_ok boolean;
  approval text;
  hstate text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u for update;
  if not found then raise exception 'Agent step not found'; end if;
  select * into s from public.agent_sessions where id=st.session_id and owner_id=u;
  if st.route<>'work' then raise exception 'Step is not Work-routed'; end if;
  if st.status<>'pending' then raise exception 'Work handoff requires a pending step'; end if;
  if s.status<>'active' or s.pause_requested or s.cancel_requested then raise exception 'Agent session is not eligible for a new Work handoff'; end if;
  if coalesce(btrim(p_capability_boundary_reason),'')='' or coalesce(btrim(p_provider),'')='' or coalesce(btrim(p_operation_key),'')='' then
    raise exception 'Work boundary reason, provider and operation key are required';
  end if;
  if st.model_rung not in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium') then raise exception 'Prohibited Work model rung'; end if;
  if exists(select 1 from public.agent_circuit_breakers b where b.owner_id=u and b.status='open' and b.breaker_type in ('provider','portfolio') and (b.provider is null or b.provider=p_provider)) then
    raise exception 'Work circuit breaker is open for this provider/capability';
  end if;
  if exists(select 1 from public.agent_work_handoffs h where h.owner_id=u and h.step_id=st.id and h.state in ('proposed','approved','in_progress','returned')) then
    raise exception 'Equivalent unresolved Work handoff already exists for this step';
  end if;

  auto_ok:=st.model_rung in ('GPT-6 Luna High','GPT-6.1 Sol Light')
           and st.risk_class='low' and not st.protected_boundary
           and st.scope_class in ('micro','small','moderate');
  approval:=case when auto_ok then 'not_required' else 'required' end;
  hstate:=case when auto_ok then 'approved' else 'proposed' end;

  insert into public.agent_work_handoffs(
    owner_id,session_id,project_id,step_id,capability_boundary_reason,provider,account_ref,operation_key,
    model_rung,scope_class,risk_class,bounded_instructions,forbidden_actions,expected_evidence,
    input_hash,state_hash,expected_side_effect_key,approval_state,state
  ) values (
    u,st.session_id,st.project_id,st.id,btrim(p_capability_boundary_reason),btrim(p_provider),nullif(btrim(p_account_ref),''),
    btrim(p_operation_key),st.model_rung,st.scope_class,st.risk_class,coalesce(p_bounded_instructions,'{}'::jsonb),
    coalesce(p_forbidden_actions,'[]'::jsonb),coalesce(p_expected_evidence,'[]'::jsonb),
    p_input_hash,p_state_hash,p_expected_side_effect_key,approval,hstate
  ) returning id into hid;

  insert into public.agent_work_queue(owner_id,session_id,project_id,step_id,handoff_id,priority,status)
  values(u,st.session_id,st.project_id,st.id,hid,coalesce(p_priority,100),'queued');

  return hid;
end
$$;

create or replace function public.command_center_agent_approve_work_handoff(
  p_handoff_id uuid,
  p_authorization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid:=(select auth.uid());
  h public.agent_work_handoffs%rowtype;
  a public.security_action_authorizations%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into h from public.agent_work_handoffs where id=p_handoff_id and owner_id=u for update;
  if not found then raise exception 'Work handoff not found'; end if;
  if h.state<>'proposed' or h.approval_state<>'required' then raise exception 'Work handoff is not awaiting approval'; end if;
  select * into a from public.security_action_authorizations
  where id=p_authorization_id and owner_id=u and status='authorized'
    and resource_type='agent_step' and resource_id=h.step_id::text
    and (expires_at is null or expires_at>now());
  if not found then raise exception 'Valid Agent step Security authorization not found'; end if;
  if h.model_rung='GPT-6.1 Sol Medium' and a.action_key<>'agent_mode_work_sol_medium' then
    raise exception 'Sol Medium requires the specific Agent Mode Sol Medium authorization';
  end if;
  update public.agent_work_handoffs set approval_state='authorized',authorization_id=a.id,state='approved' where id=h.id;
  return jsonb_build_object('ok',true,'handoff_id',h.id,'state','approved');
end
$$;

create or replace function public.command_center_agent_start_work_handoff(
  p_handoff_id uuid,
  p_retry_reason text default null,
  p_state_changed_before_retry boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid:=(select auth.uid());
  h public.agent_work_handoffs%rowtype;
  st public.agent_steps%rowtype;
  s public.agent_sessions%rowtype;
  prev public.agent_step_attempts%rowtype;
  aid uuid;
  anum integer;
  fp text;
  same_fp_count integer;
  auth_ok boolean;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into h from public.agent_work_handoffs where id=p_handoff_id and owner_id=u for update;
  if not found then raise exception 'Work handoff not found'; end if;
  if h.state<>'approved' then raise exception 'Work handoff is not approved'; end if;
  select * into st from public.agent_steps where id=h.step_id and owner_id=u for update;
  select * into s from public.agent_sessions where id=h.session_id and owner_id=u for update;
  if st.status<>'pending' or s.status<>'active' or s.pause_requested or s.cancel_requested then raise exception 'Agent state is not eligible to start Work'; end if;
  if h.model_rung not in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium') then raise exception 'Prohibited Work model rung'; end if;
  if h.model_rung='GPT-6.1 Sol Medium' then
    select exists(
      select 1 from public.security_action_authorizations a
      where a.id=h.authorization_id and a.owner_id=u and a.status='authorized'
        and a.action_key='agent_mode_work_sol_medium'
        and a.resource_type='agent_step' and a.resource_id=st.id::text
        and (a.expires_at is null or a.expires_at>now())
    ) into auth_ok;
    if not auth_ok then raise exception 'Sol Medium Work is approval-required'; end if;
  end if;
  if exists(select 1 from public.agent_work_handoffs x where x.owner_id=u and x.state='in_progress' and x.id<>h.id) then
    raise exception 'Agent Mode Work concurrency limit is 1';
  end if;
  if exists(select 1 from public.agent_circuit_breakers b where b.owner_id=u and b.status='open' and b.breaker_type in ('provider','portfolio') and (b.provider is null or b.provider=h.provider)) then
    raise exception 'Work circuit breaker is open for this provider/capability';
  end if;
  if h.expected_side_effect_key is not null and exists(
    select 1 from public.agent_step_attempts a
    where a.owner_id=u and a.expected_side_effect_key=h.expected_side_effect_key
      and a.status in ('returned','succeeded')
  ) then raise exception 'Duplicate side effect prevented: equivalent successful attempt already exists'; end if;

  fp:=md5(concat_ws('|',h.session_id::text,h.project_id,h.step_id::text,h.provider,coalesce(h.account_ref,''),
    h.operation_key,coalesce(h.input_hash,''),h.model_rung,coalesce(h.state_hash,''),coalesce(h.expected_side_effect_key,''),
    h.bounded_instructions::text,st.retry_epoch::text));

  select * into prev from public.agent_step_attempts
  where owner_id=u and step_id=st.id
  order by attempt_number desc limit 1;

  if found and prev.status='failed' then
    if prev.retry_fingerprint=fp then
      select count(*) into same_fp_count from public.agent_step_attempts
      where owner_id=u and step_id=st.id and retry_fingerprint=fp;
      if prev.failure_class not in ('transient_network','provider_timeout') then
        raise exception 'Identical blind retry is forbidden after failure class %',prev.failure_class;
      end if;
      if same_fp_count>=2 then raise exception 'Transient automatic retry budget is exhausted'; end if;
    elsif prev.model_rung is distinct from h.model_rung then
      if prev.failure_class not in ('capability_insufficient','execution_complexity') then
        raise exception 'Model escalation is not justified by failure class %',coalesce(prev.failure_class,'unknown');
      end if;
      if not (
        (prev.model_rung='GPT-6 Luna High' and h.model_rung='GPT-6.1 Sol Light') or
        (prev.model_rung='GPT-6.1 Sol Light' and h.model_rung='GPT-6.1 Sol Medium')
      ) then raise exception 'Work model escalation must use the next sufficient allowed rung'; end if;
    elsif not coalesce(p_state_changed_before_retry,false) then
      raise exception 'Later retry requires materially changed state';
    end if;
  end if;

  select coalesce(max(attempt_number),0)+1 into anum
  from public.agent_step_attempts where owner_id=u and step_id=st.id;

  insert into public.agent_step_attempts(
    owner_id,session_id,project_id,step_id,handoff_id,attempt_number,route,model_rung,provider,
    operation_key,input_hash,expected_side_effect_key,state_hash,retry_fingerprint,state_changed_before_retry,
    retry_reason,status
  ) values (
    u,h.session_id,h.project_id,h.step_id,h.id,anum,'work',h.model_rung,h.provider,h.operation_key,h.input_hash,
    h.expected_side_effect_key,h.state_hash,fp,coalesce(p_state_changed_before_retry,false),p_retry_reason,'in_progress'
  ) returning id into aid;

  update public.agent_work_handoffs set state='in_progress',attempt_id=aid,started_at=now() where id=h.id;
  update public.agent_work_queue set status='claimed',claimed_at=now() where handoff_id=h.id and owner_id=u;
  update public.agent_steps set status='running',started_at=coalesce(started_at,now()),last_retry_fingerprint=fp,last_state_hash=h.state_hash where id=st.id;
  update public.agent_sessions set current_project_id=st.project_id,current_step_id=st.id,exact_next_action=st.title where id=s.id;

  return jsonb_build_object('ok',true,'handoff_id',h.id,'attempt_id',aid,'retry_fingerprint',fp,'attempt_number',anum);
end
$$;

create or replace function public.command_center_agent_record_work_result(
  p_handoff_id uuid,
  p_outcome text,
  p_failure_class text default null,
  p_result_evidence jsonb default '{}'::jsonb,
  p_evidence_kind text default null,
  p_resulting_state_hash text default null,
  p_state_changed boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid:=(select auth.uid());
  h public.agent_work_handoffs%rowtype;
  st public.agent_steps%rowtype;
  s public.agent_sessions%rowtype;
  a public.agent_step_attempts%rowtype;
  new_failures integer;
  systemic_failures integer;
  next_step public.agent_steps%rowtype;
  eid uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_outcome not in ('returned','failed','canceled') then raise exception 'Invalid Work outcome'; end if;
  select * into h from public.agent_work_handoffs where id=p_handoff_id and owner_id=u for update;
  if not found or h.state<>'in_progress' then raise exception 'In-progress Work handoff not found'; end if;
  select * into st from public.agent_steps where id=h.step_id and owner_id=u for update;
  select * into s from public.agent_sessions where id=h.session_id and owner_id=u for update;
  select * into a from public.agent_step_attempts where id=h.attempt_id and owner_id=u for update;
  if not found then raise exception 'Work attempt not found'; end if;

  if p_outcome='returned' then
    update public.agent_step_attempts set status='returned',result_evidence=coalesce(p_result_evidence,'{}'::jsonb),
      state_hash=coalesce(p_resulting_state_hash,state_hash),ended_at=now() where id=a.id;
    update public.agent_work_handoffs set state='returned',returned_evidence=coalesce(p_result_evidence,'{}'::jsonb),
      ended_at=now(),failure_class=null where id=h.id;
    update public.agent_work_queue set status='done',completed_at=now() where handoff_id=h.id and owner_id=u;
    update public.agent_steps set status='verification_pending',last_state_hash=coalesce(p_resulting_state_hash,last_state_hash) where id=st.id;
    if coalesce(btrim(p_evidence_kind),'')<>'' then
      insert into public.agent_step_evidence(owner_id,session_id,step_id,strength,evidence_kind,evidence)
      values(u,st.session_id,st.id,'tool_result',btrim(p_evidence_kind),coalesce(p_result_evidence,'{}'::jsonb))
      returning id into eid;
    end if;
    if s.pause_requested then update public.agent_sessions set status='paused',paused_at=now() where id=s.id; end if;
    if s.cancel_requested then update public.agent_sessions set status='canceled',canceled_at=now() where id=s.id; end if;
    return jsonb_build_object('ok',true,'handoff_id',h.id,'step_id',st.id,'verification_pending',true,'evidence_id',eid);
  end if;

  if p_outcome='canceled' then
    update public.agent_step_attempts set status='canceled',result_evidence=coalesce(p_result_evidence,'{}'::jsonb),ended_at=now() where id=a.id;
    update public.agent_work_handoffs set state='canceled',ended_at=now() where id=h.id;
    update public.agent_work_queue set status='canceled',completed_at=now() where handoff_id=h.id and owner_id=u;
    update public.agent_steps set status='canceled' where id=st.id;
    return jsonb_build_object('ok',true,'canceled',true,'handoff_id',h.id);
  end if;

  if p_failure_class not in (
    'transient_network','provider_timeout','capability_insufficient','execution_complexity',
    'account_auth_required','captcha_or_mfa','permission_denied','provider_outage','missing_input',
    'tool_unavailable','unexpected_state','protected_boundary','rate_limited','session_expired',
    'invalid_input','verification_failed','duplicate_prevented','unknown'
  ) then raise exception 'Failure classification is required before retry'; end if;

  new_failures:=st.meaningful_failure_count+1;
  update public.agent_step_attempts set status='failed',failure_class=p_failure_class,
    result_evidence=coalesce(p_result_evidence,'{}'::jsonb),
    state_hash=coalesce(p_resulting_state_hash,state_hash),ended_at=now() where id=a.id;
  update public.agent_work_handoffs set state='failed',failure_class=p_failure_class,returned_evidence=coalesce(p_result_evidence,'{}'::jsonb),ended_at=now() where id=h.id;
  update public.agent_work_queue set status='failed',completed_at=now() where handoff_id=h.id and owner_id=u;

  update public.agent_steps
  set failure_count=failure_count+1,meaningful_failure_count=new_failures,
      retry_count=retry_count + case when p_failure_class in ('transient_network','provider_timeout') then 1 else 0 end,
      last_failure_class=p_failure_class,last_state_hash=coalesce(p_resulting_state_hash,last_state_hash),
      next_retry_at=case when p_failure_class in ('transient_network','provider_timeout') and new_failures<2 then now()+interval '1 minute' else null end,
      status=case
        when new_failures>=2 then 'blocked'
        when p_failure_class in ('transient_network','provider_timeout') then 'pending'
        when p_failure_class in ('account_auth_required','captcha_or_mfa','missing_input','protected_boundary','session_expired') then 'needs_user_action'
        else 'blocked'
      end
  where id=st.id;

  if new_failures>=2 then
    insert into public.agent_circuit_breakers(owner_id,session_id,project_id,step_id,provider,breaker_type,scope_key,status,reason,failure_count,retry_fingerprint,state_hash)
    values(u,st.session_id,st.project_id,st.id,h.provider,'step','step:'||st.id::text,'open',
      'Two meaningful failed attempts reached the Agent Mode step circuit breaker',new_failures,a.retry_fingerprint,coalesce(p_resulting_state_hash,a.state_hash))
    on conflict(owner_id,breaker_type,scope_key) where status='open'
    do update set failure_count=excluded.failure_count,reason=excluded.reason,retry_fingerprint=excluded.retry_fingerprint,state_hash=excluded.state_hash;
  end if;

  if p_failure_class in ('transient_network','provider_timeout','provider_outage','tool_unavailable') then
    select count(*) into systemic_failures
    from public.agent_step_attempts x
    where x.owner_id=u and x.provider=h.provider and x.status='failed'
      and x.failure_class in ('transient_network','provider_timeout','provider_outage','tool_unavailable')
      and x.ended_at>=now()-interval '30 minutes';
    if systemic_failures>=3 then
      insert into public.agent_circuit_breakers(owner_id,provider,breaker_type,scope_key,status,reason,failure_count,state_hash)
      values(u,h.provider,'portfolio','provider:'||h.provider,'open',
        'Repeated Work failures indicate a shared provider/tool problem',systemic_failures,coalesce(p_resulting_state_hash,a.state_hash))
      on conflict(owner_id,breaker_type,scope_key) where status='open'
      do update set failure_count=excluded.failure_count,reason=excluded.reason,state_hash=excluded.state_hash;
    end if;
  end if;

  if p_failure_class in ('transient_network','provider_timeout') and new_failures<2 then
    update public.agent_sessions set current_project_id=st.project_id,current_step_id=st.id,exact_next_action='Retry after verified transient cooldown' where id=s.id;
    return jsonb_build_object('ok',false,'failed',true,'retry_eligible',true,'failure_class',p_failure_class,'next_retry_at',(select next_retry_at from public.agent_steps where id=st.id));
  end if;

  select * into next_step
  from public.agent_steps cand
  where cand.session_id=s.id and cand.owner_id=u and cand.status='pending' and cand.id<>st.id
    and not exists(
      select 1 from unnest(cand.dependencies) d(dep)
      left join public.agent_steps ds on ds.id=d.dep and ds.owner_id=u and ds.session_id=s.id
      where ds.id is null or ds.status<>'verified'
    )
  order by (cand.project_id=st.project_id) desc,(cand.project_id=s.primary_project_id) desc,cand.position limit 1;

  if found then
    update public.agent_sessions set status='active',current_project_id=next_step.project_id,current_step_id=next_step.id,exact_next_action=next_step.title where id=s.id;
    update public.agent_session_projects set state=case when project_id=st.project_id then
      case when (select status from public.agent_steps where id=st.id)='needs_user_action' then 'needs_user_action' else 'blocked' end
      when project_id=next_step.project_id then 'active' else state end
    where session_id=s.id and owner_id=u;
  else
    update public.agent_sessions
    set status=case when (select status from public.agent_steps where id=st.id)='needs_user_action' then 'needs_user_action' else 'blocked' end,
        current_step_id=st.id,current_project_id=st.project_id,exact_next_action=st.title
    where id=s.id;
  end if;

  return jsonb_build_object('ok',false,'failed',true,'retry_eligible',false,'failure_class',p_failure_class,'step_status',(select status from public.agent_steps where id=st.id));
end
$$;

create or replace function public.command_center_agent_reopen_step(
  p_step_id uuid,
  p_new_state_hash text default null,
  p_new_model_rung text default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid:=(select auth.uid());
  st public.agent_steps%rowtype;
  state_changed boolean;
  model_changed boolean;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u for update;
  if not found then raise exception 'Agent step not found'; end if;
  if st.status not in ('blocked','needs_user_action','failed') then raise exception 'Only blocked/failed Agent steps can be reopened'; end if;

  state_changed:=p_new_state_hash is not null and p_new_state_hash is distinct from st.last_state_hash;
  model_changed:=p_new_model_rung is not null and p_new_model_rung is distinct from st.model_rung;

  if model_changed then
    if st.route<>'work' then raise exception 'Model reclassification is valid only for Work steps'; end if;
    if st.last_failure_class not in ('capability_insufficient','execution_complexity') then
      raise exception 'Failure class does not justify model escalation';
    end if;
    if not (
      (st.model_rung='GPT-6 Luna High' and p_new_model_rung='GPT-6.1 Sol Light') or
      (st.model_rung='GPT-6.1 Sol Light' and p_new_model_rung='GPT-6.1 Sol Medium')
    ) then raise exception 'Model escalation must use the next sufficient allowed rung and never exceed Sol Medium'; end if;
  end if;

  if not state_changed and not model_changed then raise exception 'Blocked step requires materially changed state before retry'; end if;

  update public.agent_steps
  set status='pending',retry_epoch=retry_epoch+1,meaningful_failure_count=0,retry_count=0,next_retry_at=null,
      last_state_hash=coalesce(p_new_state_hash,last_state_hash),
      model_rung=coalesce(p_new_model_rung,model_rung),
      metadata=metadata||jsonb_build_object('reopened_reason',coalesce(p_reason,'material state change'),'reopened_at',now())
  where id=st.id;

  update public.agent_circuit_breakers
  set status='closed',closed_at=now(),metadata=metadata||jsonb_build_object('closed_reason',coalesce(p_reason,'material state change'))
  where owner_id=u and step_id=st.id and status='open' and breaker_type='step';

  update public.agent_sessions
  set status=case when pause_requested then 'paused' when cancel_requested then 'canceled' else 'active' end,
      current_project_id=st.project_id,current_step_id=st.id,exact_next_action=st.title
  where id=st.session_id and owner_id=u and status in ('blocked','needs_user_action','failed','active');

  update public.agent_session_projects set state='active'
  where session_id=st.session_id and owner_id=u and project_id=st.project_id;

  return jsonb_build_object('ok',true,'step_id',st.id,'state_changed',state_changed,'model_changed',model_changed,'model_rung',coalesce(p_new_model_rung,st.model_rung));
end
$$;

create or replace function public.command_center_agent_close_circuit_breaker(
  p_breaker_id uuid,
  p_new_state_hash text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare u uuid:=(select auth.uid()); b public.agent_circuit_breakers%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into b from public.agent_circuit_breakers where id=p_breaker_id and owner_id=u for update;
  if not found or b.status<>'open' then raise exception 'Open circuit breaker not found'; end if;
  if coalesce(btrim(p_new_state_hash),'')='' or p_new_state_hash is not distinct from b.state_hash then
    raise exception 'Circuit breaker requires materially changed state before closing';
  end if;
  update public.agent_circuit_breakers
  set status='closed',closed_at=now(),state_hash=p_new_state_hash,
      metadata=metadata||jsonb_build_object('closed_reason',coalesce(nullif(btrim(p_reason),''),'material state change'))
  where id=b.id;
  return jsonb_build_object('ok',true,'breaker_id',b.id,'status','closed');
end
$$;

create or replace function public.command_center_agent_mark_normal_chat_resumed(p_handoff_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare u uuid:=(select auth.uid()); h public.agent_work_handoffs%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into h from public.agent_work_handoffs where id=p_handoff_id and owner_id=u for update;
  if not found then raise exception 'Work handoff not found'; end if;
  if h.state not in ('returned','verified','failed','blocked','canceled') then raise exception 'Work handoff has not returned to normal chat'; end if;
  update public.agent_work_handoffs set normal_chat_resumed=true where id=h.id;
  return jsonb_build_object('ok',true,'handoff_id',h.id,'normal_chat_resumed',true);
end
$$;

create or replace function public.command_center_agent_record_tool_health(
  p_capability_key text,
  p_environment text,
  p_availability text,
  p_auth_state text,
  p_free_status text default 'unknown',
  p_provider text default null,
  p_tool_key text default null,
  p_action_scope jsonb default '{}'::jsonb,
  p_error_class text default null,
  p_approved_fallback text default null,
  p_success boolean default false,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare u uuid:=(select auth.uid()); rid uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_capability_key),'')='' then raise exception 'Capability key is required'; end if;
  if p_environment not in ('normal_chat','work','external_tool','user_only') then raise exception 'Invalid capability environment'; end if;
  if p_availability not in ('available','unavailable','degraded','unknown') then raise exception 'Invalid availability'; end if;
  if p_auth_state not in ('authenticated','needs_auth','not_applicable','unknown') then raise exception 'Invalid auth state'; end if;
  if p_free_status not in ('free','paid','unknown') then raise exception 'Invalid free/paid state'; end if;

  insert into public.agent_tool_registry(
    owner_id,capability_key,environment,provider,tool_key,availability,auth_state,action_scope,free_status,
    last_success_at,error_class,approved_fallback,last_verified_at,metadata
  ) values (
    u,btrim(p_capability_key),p_environment,coalesce(nullif(btrim(p_provider),''),''),coalesce(nullif(btrim(p_tool_key),''),''),
    p_availability,p_auth_state,coalesce(p_action_scope,'{}'::jsonb),p_free_status,
    case when p_success then now() else null end,p_error_class,p_approved_fallback,now(),coalesce(p_metadata,'{}'::jsonb)
  )
  on conflict(owner_id,capability_key,environment,provider,tool_key)
  do update set availability=excluded.availability,auth_state=excluded.auth_state,action_scope=excluded.action_scope,
    free_status=excluded.free_status,last_success_at=case when p_success then now() else public.agent_tool_registry.last_success_at end,
    error_class=excluded.error_class,approved_fallback=excluded.approved_fallback,last_verified_at=now(),metadata=excluded.metadata
  returning id into rid;
  return rid;
end
$$;

create or replace function public.command_center_agent_status(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid:=(select auth.uid());
  s public.agent_sessions%rowtype;
  projects_json jsonb;
  steps_json jsonb;
  work_json jsonb;
  breakers_json jsonb;
  metrics_json jsonb;
  latest_checkpoint jsonb;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=u;
  if not found then raise exception 'Agent session not found'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'project_id',sp.project_id,'role',sp.project_role,'state',sp.state,'books_opt_in',sp.books_target is not null
  ) order by sp.sort_order),'[]'::jsonb)
  into projects_json from public.agent_session_projects sp where sp.session_id=s.id and sp.owner_id=u;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',st.id,'project_id',st.project_id,'step_key',st.step_key,'title',st.title,'position',st.position,
    'route',st.route,'tool_category',st.tool_category,'scope_class',st.scope_class,'model_rung',st.model_rung,
    'risk_class',st.risk_class,'impact_radius',st.impact_radius,'status',st.status,
    'verification_required',st.verification_required,'failure_class',st.last_failure_class,
    'retry_count',st.retry_count,'meaningful_failure_count',st.meaningful_failure_count
  ) order by st.position,st.created_at),'[]'::jsonb)
  into steps_json from public.agent_steps st where st.session_id=s.id and st.owner_id=u;

  select coalesce(jsonb_agg(jsonb_build_object(
    'handoff_id',h.id,'project_id',h.project_id,'step_id',h.step_id,'provider',h.provider,
    'model_rung',h.model_rung,'scope_class',h.scope_class,'risk_class',h.risk_class,
    'approval_state',h.approval_state,'state',h.state,'failure_class',h.failure_class,
    'normal_chat_resumed',h.normal_chat_resumed
  ) order by h.created_at desc),'[]'::jsonb)
  into work_json from public.agent_work_handoffs h where h.session_id=s.id and h.owner_id=u;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',b.id,'type',b.breaker_type,'scope_key',b.scope_key,'provider',b.provider,'reason',b.reason,
    'failure_count',b.failure_count,'status',b.status
  ) order by b.opened_at desc),'[]'::jsonb)
  into breakers_json from public.agent_circuit_breakers b
  where b.owner_id=u and (b.session_id=s.id or (b.session_id is null and b.status='open'));

  select jsonb_build_object(
    'total_steps',count(*),
    'verified_steps',count(*) filter(where status='verified'),
    'normal_chat_steps',count(*) filter(where route='normal_chat'),
    'work_steps',count(*) filter(where route='work'),
    'blocked_steps',count(*) filter(where status in ('blocked','needs_user_action')),
    'work_handoffs',(select count(*) from public.agent_work_handoffs h where h.session_id=s.id and h.owner_id=u),
    'luna_high_handoffs',(select count(*) from public.agent_work_handoffs h where h.session_id=s.id and h.owner_id=u and h.model_rung='GPT-6 Luna High'),
    'sol_light_handoffs',(select count(*) from public.agent_work_handoffs h where h.session_id=s.id and h.owner_id=u and h.model_rung='GPT-6.1 Sol Light'),
    'sol_medium_handoffs',(select count(*) from public.agent_work_handoffs h where h.session_id=s.id and h.owner_id=u and h.model_rung='GPT-6.1 Sol Medium'),
    'duplicate_actions_prevented',(select count(*) from public.agent_step_attempts a where a.session_id=s.id and a.owner_id=u and a.failure_class='duplicate_prevented'),
    'failed_attempts',(select count(*) from public.agent_step_attempts a where a.session_id=s.id and a.owner_id=u and a.status='failed'),
    'work_allowance_total','N/A','work_allowance_remaining','N/A','predicted_work_percentage','N/A'
  ) into metrics_json
  from public.agent_steps where session_id=s.id and owner_id=u;

  select jsonb_build_object('id',c.id,'created_at',c.created_at,'exact_next_action',c.exact_next_action,'progress_hash',c.progress_hash)
  into latest_checkpoint
  from public.agent_checkpoints c where c.session_id=s.id and c.owner_id=u order by c.created_at desc limit 1;

  return jsonb_build_object(
    'session',jsonb_build_object(
      'id',s.id,'objective',s.objective,'status',s.status,'primary_project_id',s.primary_project_id,
      'current_project_id',s.current_project_id,'current_step_id',s.current_step_id,'dry_run',s.dry_run,
      'pause_requested',s.pause_requested,'cancel_requested',s.cancel_requested,'exact_next_action',s.exact_next_action,
      'started_at',s.started_at,'completed_at',s.completed_at
    ),
    'projects',projects_json,'steps',steps_json,'work_queue',work_json,'circuit_breakers',breakers_json,
    'latest_checkpoint',latest_checkpoint,'metrics',metrics_json
  );
end
$$;

-- Lock down all Agent Mode RPCs from anonymous/public access.
revoke execute on function public.command_center_agent_strength_rank(text) from public, anon, authenticated;

revoke execute on function public.command_center_agent_create_session(text,text[],text,jsonb,jsonb,jsonb,jsonb,jsonb,boolean) from public, anon;
grant execute on function public.command_center_agent_create_session(text,text[],text,jsonb,jsonb,jsonb,jsonb,jsonb,boolean) to authenticated;

revoke execute on function public.command_center_agent_add_step(uuid,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text,uuid[],text,text,text,integer,jsonb) from public, anon;
grant execute on function public.command_center_agent_add_step(uuid,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text,uuid[],text,text,text,integer,jsonb) to authenticated;

revoke execute on function public.command_center_agent_start_session(uuid) from public, anon;
grant execute on function public.command_center_agent_start_session(uuid) to authenticated;

revoke execute on function public.command_center_agent_attach_authorization(uuid,uuid) from public, anon;
grant execute on function public.command_center_agent_attach_authorization(uuid,uuid) to authenticated;

revoke execute on function public.command_center_agent_begin_step(uuid) from public, anon;
grant execute on function public.command_center_agent_begin_step(uuid) to authenticated;

revoke execute on function public.command_center_agent_add_evidence(uuid,text,text,text,jsonb) from public, anon;
grant execute on function public.command_center_agent_add_evidence(uuid,text,text,text,jsonb) to authenticated;

revoke execute on function public.command_center_agent_confirm_evidence(uuid,text) from public, anon;
grant execute on function public.command_center_agent_confirm_evidence(uuid,text) to authenticated;

revoke execute on function public.command_center_agent_verify_step(uuid) from public, anon;
grant execute on function public.command_center_agent_verify_step(uuid) to authenticated;

revoke execute on function public.command_center_agent_checkpoint(uuid,text,jsonb) from public, anon;
grant execute on function public.command_center_agent_checkpoint(uuid,text,jsonb) to authenticated;

revoke execute on function public.command_center_agent_pause(uuid) from public, anon;
grant execute on function public.command_center_agent_pause(uuid) to authenticated;

revoke execute on function public.command_center_agent_resume(uuid) from public, anon;
grant execute on function public.command_center_agent_resume(uuid) to authenticated;

revoke execute on function public.command_center_agent_cancel(uuid) from public, anon;
grant execute on function public.command_center_agent_cancel(uuid) to authenticated;

revoke execute on function public.command_center_agent_prepare_work_handoff(uuid,text,text,text,jsonb,jsonb,jsonb,text,text,text,text,integer) from public, anon;
grant execute on function public.command_center_agent_prepare_work_handoff(uuid,text,text,text,jsonb,jsonb,jsonb,text,text,text,text,integer) to authenticated;

revoke execute on function public.command_center_agent_approve_work_handoff(uuid,uuid) from public, anon;
grant execute on function public.command_center_agent_approve_work_handoff(uuid,uuid) to authenticated;

revoke execute on function public.command_center_agent_start_work_handoff(uuid,text,boolean) from public, anon;
grant execute on function public.command_center_agent_start_work_handoff(uuid,text,boolean) to authenticated;

revoke execute on function public.command_center_agent_record_work_result(uuid,text,text,jsonb,text,text,boolean) from public, anon;
grant execute on function public.command_center_agent_record_work_result(uuid,text,text,jsonb,text,text,boolean) to authenticated;

revoke execute on function public.command_center_agent_reopen_step(uuid,text,text,text) from public, anon;
grant execute on function public.command_center_agent_reopen_step(uuid,text,text,text) to authenticated;

revoke execute on function public.command_center_agent_close_circuit_breaker(uuid,text,text) from public, anon;
grant execute on function public.command_center_agent_close_circuit_breaker(uuid,text,text) to authenticated;

revoke execute on function public.command_center_agent_mark_normal_chat_resumed(uuid) from public, anon;
grant execute on function public.command_center_agent_mark_normal_chat_resumed(uuid) to authenticated;

revoke execute on function public.command_center_agent_record_tool_health(text,text,text,text,text,text,text,jsonb,text,text,boolean,jsonb) from public, anon;
grant execute on function public.command_center_agent_record_tool_health(text,text,text,text,text,text,text,jsonb,text,text,boolean,jsonb) to authenticated;

revoke execute on function public.command_center_agent_status(uuid) from public, anon;
grant execute on function public.command_center_agent_status(uuid) to authenticated;

grant execute on function public.command_center_agent_strength_rank(text) to service_role;
