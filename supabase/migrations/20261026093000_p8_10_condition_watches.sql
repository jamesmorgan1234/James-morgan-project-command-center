-- C8 / P8.10 — durable condition watches, observations, transitions, and bounded backoff.

create table if not exists public.command_center_condition_watches (
  owner_id uuid not null references auth.users(id) on delete cascade,
  watch_id text not null check (btrim(watch_id) <> ''),
  project_id text,
  condition_key text not null check (btrim(condition_key) <> ''),
  cadence_ref text not null check (btrim(cadence_ref) <> ''),
  action_policy text not null check (action_policy in ('notification_only','safe_action')),
  protected_actions_authorized boolean not null default false check (protected_actions_authorized = false),
  prior_verified_state boolean not null default false,
  last_observation_id text,
  last_verified_observed_at timestamptz,
  backoff_until timestamptz,
  consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,watch_id)
);

create table if not exists public.command_center_watch_observations (
  owner_id uuid not null,
  watch_id text not null,
  observation_id text not null check (btrim(observation_id) <> ''),
  observed_at timestamptz not null,
  condition_met boolean not null,
  verified boolean not null,
  source_refs text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  primary key(owner_id,watch_id,observation_id),
  unique(owner_id,watch_id,observation_id),
  foreign key(owner_id,watch_id) references public.command_center_condition_watches(owner_id,watch_id) on delete restrict,
  check (not verified or cardinality(source_refs) > 0)
);

create table if not exists public.command_center_watch_transitions (
  owner_id uuid not null,
  watch_id text not null,
  observation_id text not null,
  decision text not null check (decision in ('fire','no_fire')),
  reason text not null check (btrim(reason) <> ''),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  recorded_at timestamptz not null default now(),
  primary key(owner_id,watch_id,observation_id),
  foreign key(owner_id,watch_id,observation_id) references public.command_center_watch_observations(owner_id,watch_id,observation_id) on delete restrict
);

create index if not exists command_center_watch_due_idx on public.command_center_condition_watches(owner_id,backoff_until,updated_at);
create index if not exists command_center_watch_observed_idx on public.command_center_watch_observations(owner_id,watch_id,observed_at desc);

create or replace function public.command_center_watch_set_updated_at()
returns trigger language plpgsql set search_path to 'public' as $$
begin new.updated_at=now(); return new; end $$;
drop trigger if exists command_center_condition_watches_set_updated_at on public.command_center_condition_watches;
create trigger command_center_condition_watches_set_updated_at before update on public.command_center_condition_watches
for each row execute function public.command_center_watch_set_updated_at();

create or replace function public.command_center_reject_watch_history_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Condition watch observation/transition history is immutable'; end $$;
drop trigger if exists command_center_watch_observations_immutable on public.command_center_watch_observations;
create trigger command_center_watch_observations_immutable before update or delete on public.command_center_watch_observations
for each row execute function public.command_center_reject_watch_history_mutation();
drop trigger if exists command_center_watch_transitions_immutable on public.command_center_watch_transitions;
create trigger command_center_watch_transitions_immutable before update or delete on public.command_center_watch_transitions
for each row execute function public.command_center_reject_watch_history_mutation();

do $$ declare t text; begin
  foreach t in array array['command_center_condition_watches','command_center_watch_observations','command_center_watch_transitions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
  end loop;
end $$;

grant select,insert,update on table public.command_center_condition_watches to authenticated;
grant select,insert on table public.command_center_watch_observations to authenticated;
grant select,insert on table public.command_center_watch_transitions to authenticated;

create policy p8_10_watch_owner on public.command_center_condition_watches for all to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_10_observation_owner on public.command_center_watch_observations for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_10_observation_insert on public.command_center_watch_observations for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_10_transition_owner on public.command_center_watch_transitions for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_10_transition_insert on public.command_center_watch_transitions for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
