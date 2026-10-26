-- C8 / P8.1 — durable personal tasks/reminders.
-- Personal Ops owns task truth only. Agency remains the execution/scheduler authority.

create table if not exists public.command_center_personal_tasks (
  owner_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null check (btrim(task_id) <> ''),
  project_id text references public.projects(id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  priority text not null check (priority in ('critical','high','normal','low')),
  state text not null check (state in ('open','completed','cancelled')),
  due_at timestamptz,
  recurrence_key text check (recurrence_key is null or btrim(recurrence_key) <> ''),
  source_refs text[] not null check (cardinality(source_refs) > 0),
  version bigint not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id, task_id)
);

create table if not exists public.command_center_personal_task_occurrences (
  owner_id uuid not null,
  task_id text not null,
  occurrence_key text not null check (btrim(occurrence_key) <> ''),
  project_id text,
  scheduled_for timestamptz not null,
  state text not null default 'reserved' check (state in ('reserved','completed','cancelled')),
  idempotency_key text not null check (btrim(idempotency_key) <> ''),
  agency_step_id uuid references public.agent_steps(id) on delete set null,
  agency_execution_ref text check (agency_execution_ref is null or btrim(agency_execution_ref) <> ''),
  pif_trace_ref text check (pif_trace_ref is null or btrim(pif_trace_ref) <> ''),
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id, task_id, occurrence_key),
  unique(owner_id, idempotency_key),
  foreign key(owner_id, task_id) references public.command_center_personal_tasks(owner_id, task_id) on delete restrict
);

create table if not exists public.command_center_personal_task_completions (
  owner_id uuid not null,
  task_id text not null,
  occurrence_key text not null,
  project_id text,
  completed_at timestamptz not null,
  idempotency_key text not null check (btrim(idempotency_key) <> ''),
  agency_execution_ref text check (agency_execution_ref is null or btrim(agency_execution_ref) <> ''),
  pif_trace_ref text check (pif_trace_ref is null or btrim(pif_trace_ref) <> ''),
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  created_at timestamptz not null default now(),
  primary key(owner_id, task_id, occurrence_key),
  unique(owner_id, idempotency_key),
  foreign key(owner_id, task_id, occurrence_key)
    references public.command_center_personal_task_occurrences(owner_id, task_id, occurrence_key) on delete restrict
);

create index if not exists command_center_personal_tasks_search_idx
  on public.command_center_personal_tasks(owner_id, project_id, state, priority, due_at);
create index if not exists command_center_personal_tasks_title_idx
  on public.command_center_personal_tasks(owner_id, lower(title));
create index if not exists command_center_personal_task_occurrences_schedule_idx
  on public.command_center_personal_task_occurrences(owner_id, state, scheduled_for);
create index if not exists command_center_personal_task_occurrences_agency_idx
  on public.command_center_personal_task_occurrences(owner_id, agency_step_id) where agency_step_id is not null;
create index if not exists command_center_personal_task_completions_history_idx
  on public.command_center_personal_task_completions(owner_id, task_id, completed_at desc);

create or replace function public.command_center_personal_set_updated_at()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists command_center_personal_tasks_set_updated_at on public.command_center_personal_tasks;
create trigger command_center_personal_tasks_set_updated_at
before update on public.command_center_personal_tasks
for each row execute function public.command_center_personal_set_updated_at();

drop trigger if exists command_center_personal_task_occurrences_set_updated_at on public.command_center_personal_task_occurrences;
create trigger command_center_personal_task_occurrences_set_updated_at
before update on public.command_center_personal_task_occurrences
for each row execute function public.command_center_personal_set_updated_at();

create or replace function public.command_center_reject_personal_completion_mutation()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  raise exception 'Personal task completion history is immutable';
end $$;

drop trigger if exists command_center_personal_task_completions_immutable on public.command_center_personal_task_completions;
create trigger command_center_personal_task_completions_immutable
before update or delete on public.command_center_personal_task_completions
for each row execute function public.command_center_reject_personal_completion_mutation();

-- Atomic completion of a previously reserved occurrence. The caller supplies the same
-- idempotency key used by Agency; duplicate completion is rejected by durable uniqueness.
create or replace function public.command_center_complete_personal_task_occurrence(
  p_task_id text,
  p_occurrence_key text,
  p_completed_at timestamptz,
  p_idempotency_key text,
  p_evidence_refs text[],
  p_agency_execution_ref text default null,
  p_pif_trace_ref text default null
)
returns void
language plpgsql
set search_path to 'public'
as $$
declare
  v_owner uuid := (select auth.uid());
  v_project_id text;
begin
  if v_owner is null then raise exception 'Authenticated owner required'; end if;
  if btrim(coalesce(p_task_id,'')) = '' or btrim(coalesce(p_occurrence_key,'')) = '' or btrim(coalesce(p_idempotency_key,'')) = '' then
    raise exception 'Task occurrence identity is required';
  end if;
  if coalesce(cardinality(p_evidence_refs),0) = 0 then raise exception 'Task completion evidence is required'; end if;

  update public.command_center_personal_task_occurrences
     set state = 'completed',
         agency_execution_ref = coalesce(p_agency_execution_ref, agency_execution_ref),
         pif_trace_ref = coalesce(p_pif_trace_ref, pif_trace_ref),
         evidence_refs = array(select distinct x from unnest(evidence_refs || p_evidence_refs) as x)
   where owner_id = v_owner
     and task_id = p_task_id
     and occurrence_key = p_occurrence_key
     and idempotency_key = p_idempotency_key
     and state = 'reserved'
  returning project_id into v_project_id;

  if not found then raise exception 'Task occurrence is missing, already completed, cancelled, or idempotency identity mismatched'; end if;

  insert into public.command_center_personal_task_completions(
    owner_id, task_id, occurrence_key, project_id, completed_at, idempotency_key,
    agency_execution_ref, pif_trace_ref, evidence_refs
  ) values (
    v_owner, p_task_id, p_occurrence_key, v_project_id, p_completed_at, p_idempotency_key,
    p_agency_execution_ref, p_pif_trace_ref, p_evidence_refs
  );
end $$;

do $$ declare t text; begin
  foreach t in array array[
    'command_center_personal_tasks',
    'command_center_personal_task_occurrences',
    'command_center_personal_task_completions'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public,anon,authenticated', t);
  end loop;
end $$;

grant select,insert,update on table public.command_center_personal_tasks to authenticated;
grant select,insert,update on table public.command_center_personal_task_occurrences to authenticated;
grant select,insert on table public.command_center_personal_task_completions to authenticated;
grant execute on function public.command_center_complete_personal_task_occurrence(text,text,timestamptz,text,text[],text,text) to authenticated;

create policy p8_1_personal_tasks_owner_all on public.command_center_personal_tasks
for all to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create policy p8_1_personal_occurrences_owner_all on public.command_center_personal_task_occurrences
for all to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create policy p8_1_personal_completions_owner_select on public.command_center_personal_task_completions
for select to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create policy p8_1_personal_completions_owner_insert on public.command_center_personal_task_completions
for insert to authenticated
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
