-- C8 / P8.9 — durable scheduled automation occurrences.
-- Agency remains the scheduler/executor authority; Personal Ops stores schedule references and occurrence receipts only.

create table if not exists public.command_center_scheduled_automations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  automation_id text not null check (btrim(automation_id) <> ''),
  project_id text,
  schedule_ref text not null check (btrim(schedule_ref) <> ''),
  enabled boolean not null default true,
  action_policy text not null check (action_policy in ('notification_only','safe_action')),
  provider_health text not null check (provider_health in ('available','degraded','unavailable')),
  protected_actions_authorized boolean not null default false check (protected_actions_authorized = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,automation_id)
);

create table if not exists public.command_center_automation_occurrences (
  owner_id uuid not null,
  automation_id text not null,
  scheduled_for timestamptz not null,
  started_at timestamptz not null,
  state text not null check (state in ('started','completed','failed')),
  agency_step_id uuid references public.agent_steps(id) on delete set null,
  authorization_ref text,
  policy_epoch bigint,
  revocation_epoch bigint,
  evidence_refs text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,automation_id,scheduled_for),
  unique(owner_id,automation_id,scheduled_for),
  foreign key(owner_id,automation_id) references public.command_center_scheduled_automations(owner_id,automation_id) on delete restrict,
  check ((state='started') or cardinality(evidence_refs)>0)
);

create index if not exists command_center_automation_occurrence_state_idx
  on public.command_center_automation_occurrences(owner_id,state,scheduled_for);
create index if not exists command_center_automation_occurrence_agency_idx
  on public.command_center_automation_occurrences(owner_id,agency_step_id) where agency_step_id is not null;

create or replace function public.command_center_automation_set_updated_at()
returns trigger language plpgsql set search_path to 'public' as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists command_center_scheduled_automations_set_updated_at on public.command_center_scheduled_automations;
create trigger command_center_scheduled_automations_set_updated_at before update on public.command_center_scheduled_automations
for each row execute function public.command_center_automation_set_updated_at();
drop trigger if exists command_center_automation_occurrences_set_updated_at on public.command_center_automation_occurrences;
create trigger command_center_automation_occurrences_set_updated_at before update on public.command_center_automation_occurrences
for each row execute function public.command_center_automation_set_updated_at();

do $$ declare t text; begin
  foreach t in array array['command_center_scheduled_automations','command_center_automation_occurrences'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select,insert,update on table public.%I to authenticated',t);
    execute format('create policy %I on public.%I for all to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','p8_9_owner_'||t,t);
  end loop;
end $$;
