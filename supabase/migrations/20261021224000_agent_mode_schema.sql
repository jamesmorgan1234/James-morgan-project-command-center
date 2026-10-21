-- Command Center Agent Mode durable schema.
-- Owner-scoped, RLS-enabled, no seed/fake activity.

create table if not exists public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  objective text not null check (btrim(objective) <> ''),
  success_criteria jsonb not null default '[]'::jsonb,
  excluded_scope jsonb not null default '[]'::jsonb,
  scope_mode text not null default 'explicit_multi_project' check (scope_mode in ('project_only','explicit_multi_project')),
  primary_project_id text not null references public.projects(id) on delete restrict,
  current_project_id text references public.projects(id) on delete restrict,
  permission_envelope jsonb not null default '{"allowed_tool_categories":[],"allow_work":false}'::jsonb,
  execution_policy jsonb not null default '{}'::jsonb,
  dry_run boolean not null default false,
  status text not null default 'draft' check (status in ('draft','active','paused','blocked','needs_user_action','completed','partially_completed','canceled','failed')),
  pause_requested boolean not null default false,
  cancel_requested boolean not null default false,
  current_step_id uuid,
  latest_checkpoint_id uuid,
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
  state text not null default 'eligible' check (state in ('eligible','active','blocked','needs_user_action','completed','excluded')),
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
  route text not null check (route in ('normal_chat','automation','integration','work','user_only')),
  tool_category text not null check (btrim(tool_category) <> ''),
  scope_class text not null default 'small' check (scope_class in ('micro','small','moderate','substantial')),
  model_rung text check (model_rung is null or model_rung in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium')),
  risk_class text not null default 'low' check (risk_class in ('low','medium','high','protected')),
  impact_radius text not null default 'local_unit' check (impact_radius in ('local_unit','single_project','multi_project','public_or_account','portfolio_wide')),
  side_effect boolean not null default false,
  protected_boundary boolean not null default false,
  authorization_id uuid references public.security_action_authorizations(id) on delete set null,
  verification_required text not null default 'tool_result' check (verification_required in ('tool_result','canonical_record','live_verified')),
  status text not null default 'pending' check (status in ('pending','running','verification_pending','verified','blocked','needs_user_action','failed','canceled','skipped')),
  idempotency_key text,
  downstream_kind text check (downstream_kind is null or downstream_kind in ('brain','automation','integration','security','deployment','work','normal_chat','user_only')),
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

create table if not exists public.agent_step_evidence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  step_id uuid not null references public.agent_steps(id) on delete cascade,
  strength text not null check (strength in ('self_report_only','tool_result','canonical_record','live_verified')),
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
  status text not null default 'in_progress' check (status in ('in_progress','returned','succeeded','failed','blocked','canceled')),
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
  normal_chat_exhausted boolean not null default false,
  provider text not null check (btrim(provider) <> ''),
  account_ref text,
  operation_key text not null check (btrim(operation_key) <> ''),
  model_rung text not null check (model_rung in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium')),
  scope_class text not null check (scope_class in ('micro','small','moderate','substantial')),
  risk_class text not null check (risk_class in ('low','medium','high','protected')),
  bounded_instructions jsonb not null default '{}'::jsonb,
  forbidden_actions jsonb not null default '[]'::jsonb,
  expected_evidence jsonb not null default '[]'::jsonb,
  input_hash text,
  state_hash text,
  expected_side_effect_key text,
  approval_state text not null default 'not_required' check (approval_state in ('not_required','required','authorized','revoked')),
  authorization_id uuid references public.security_action_authorizations(id) on delete set null,
  state text not null default 'proposed' check (state in ('proposed','approved','in_progress','returned','verified','failed','blocked','canceled')),
  attempt_id uuid,
  returned_evidence jsonb not null default '{}'::jsonb,
  failure_class text,
  normal_chat_resumed boolean not null default false,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_work_queue (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  project_id text not null references public.projects(id) on delete restrict,
  step_id uuid not null references public.agent_steps(id) on delete cascade,
  handoff_id uuid not null unique references public.agent_work_handoffs(id) on delete cascade,
  priority integer not null default 100,
  status text not null default 'queued' check (status in ('queued','claimed','done','failed','blocked','canceled')),
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
  breaker_type text not null check (breaker_type in ('step','provider','portfolio','no_progress')),
  scope_key text not null,
  status text not null default 'open' check (status in ('open','closed')),
  reason text not null,
  failure_count integer not null default 0,
  retry_fingerprint text,
  state_hash text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.agent_tool_registry (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  capability_key text not null,
  environment text not null check (environment in ('normal_chat','work','external_tool','user_only')),
  provider text not null default '',
  tool_key text not null default '',
  availability text not null check (availability in ('available','unavailable','degraded','unknown')),
  auth_state text not null check (auth_state in ('authenticated','needs_auth','not_applicable','unknown')),
  action_scope jsonb not null default '{}'::jsonb,
  free_status text not null default 'unknown' check (free_status in ('free','paid','unknown')),
  last_success_at timestamptz,
  error_class text,
  approved_fallback text,
  last_verified_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,capability_key,environment,provider,tool_key)
);

create table if not exists public.agent_run_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  project_id text references public.projects(id) on delete restrict,
  step_id uuid references public.agent_steps(id) on delete set null,
  event_kind text not null,
  message text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.agent_step_attempts drop constraint if exists agent_step_attempts_handoff_fk;
alter table public.agent_step_attempts add constraint agent_step_attempts_handoff_fk foreign key (handoff_id) references public.agent_work_handoffs(id) on delete set null;
alter table public.agent_work_handoffs drop constraint if exists agent_work_handoffs_attempt_fk;
alter table public.agent_work_handoffs add constraint agent_work_handoffs_attempt_fk foreign key (attempt_id) references public.agent_step_attempts(id) on delete set null;

create index if not exists agent_sessions_owner_status_idx on public.agent_sessions(owner_id,status,updated_at desc);
create index if not exists agent_session_projects_owner_idx on public.agent_session_projects(owner_id,session_id,sort_order);
create index if not exists agent_steps_session_status_idx on public.agent_steps(owner_id,session_id,status,position);
create index if not exists agent_steps_project_status_idx on public.agent_steps(owner_id,project_id,status);
create index if not exists agent_step_evidence_step_idx on public.agent_step_evidence(owner_id,step_id,verified,strength);
create index if not exists agent_checkpoints_session_idx on public.agent_checkpoints(owner_id,session_id,created_at desc);
create index if not exists agent_attempts_step_idx on public.agent_step_attempts(owner_id,step_id,attempt_number desc);
create index if not exists agent_attempts_provider_fail_idx on public.agent_step_attempts(owner_id,provider,status,ended_at desc);
create unique index if not exists agent_attempts_success_side_effect_uq on public.agent_step_attempts(owner_id,expected_side_effect_key) where expected_side_effect_key is not null and status in ('returned','succeeded');
create index if not exists agent_work_handoffs_state_idx on public.agent_work_handoffs(owner_id,state,created_at);
create index if not exists agent_work_queue_status_idx on public.agent_work_queue(owner_id,status,priority,queued_at);
create unique index if not exists agent_circuit_breakers_one_open_scope on public.agent_circuit_breakers(owner_id,breaker_type,scope_key) where status='open';
create index if not exists agent_tool_registry_owner_idx on public.agent_tool_registry(owner_id,last_verified_at desc);
create index if not exists agent_events_session_idx on public.agent_run_events(owner_id,session_id,created_at desc);

create or replace function public.command_center_agent_set_updated_at()
returns trigger language plpgsql set search_path to 'public' as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists agent_sessions_set_updated_at on public.agent_sessions;
create trigger agent_sessions_set_updated_at before update on public.agent_sessions for each row execute function public.command_center_agent_set_updated_at();
drop trigger if exists agent_session_projects_set_updated_at on public.agent_session_projects;
create trigger agent_session_projects_set_updated_at before update on public.agent_session_projects for each row execute function public.command_center_agent_set_updated_at();
drop trigger if exists agent_steps_set_updated_at on public.agent_steps;
create trigger agent_steps_set_updated_at before update on public.agent_steps for each row execute function public.command_center_agent_set_updated_at();
drop trigger if exists agent_work_handoffs_set_updated_at on public.agent_work_handoffs;
create trigger agent_work_handoffs_set_updated_at before update on public.agent_work_handoffs for each row execute function public.command_center_agent_set_updated_at();
drop trigger if exists agent_tool_registry_set_updated_at on public.agent_tool_registry;
create trigger agent_tool_registry_set_updated_at before update on public.agent_tool_registry for each row execute function public.command_center_agent_set_updated_at();

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
alter table public.agent_run_events enable row level security;

-- Browser roles do not receive direct table access to execution internals.
revoke all on table public.agent_sessions from public,anon,authenticated;
revoke all on table public.agent_session_projects from public,anon,authenticated;
revoke all on table public.agent_steps from public,anon,authenticated;
revoke all on table public.agent_step_evidence from public,anon,authenticated;
revoke all on table public.agent_checkpoints from public,anon,authenticated;
revoke all on table public.agent_step_attempts from public,anon,authenticated;
revoke all on table public.agent_work_handoffs from public,anon,authenticated;
revoke all on table public.agent_work_queue from public,anon,authenticated;
revoke all on table public.agent_circuit_breakers from public,anon,authenticated;
revoke all on table public.agent_tool_registry from public,anon,authenticated;
revoke all on table public.agent_run_events from public,anon,authenticated;

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
grant select,insert,update,delete on table public.agent_run_events to service_role;

create or replace function public.command_center_agent_strength_rank(p_strength text)
returns integer language sql immutable set search_path to '' as $$
select case p_strength when 'self_report_only' then 0 when 'tool_result' then 1 when 'canonical_record' then 2 when 'live_verified' then 3 else -1 end
$$;
revoke execute on function public.command_center_agent_strength_rank(text) from public,anon,authenticated;
grant execute on function public.command_center_agent_strength_rank(text) to service_role;
