-- C8 / P8.11 — privacy-preserving personal-ops backup/recovery with immutable provenance and replay barriers.

create table if not exists public.command_center_personal_recovery_snapshots (
  owner_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id text not null check (btrim(snapshot_id) <> ''),
  schema_version text not null check (schema_version = 'cc-personal-recovery-v1'),
  project_id text not null check (btrim(project_id) <> ''),
  domain text not null check (btrim(domain) <> ''),
  snapshot_created_at timestamptz not null,
  sensitivity_rank integer not null check (sensitivity_rank >= 0),
  integrity_hash text not null check (btrim(integrity_hash) <> ''),
  provenance_refs text[] not null check (cardinality(provenance_refs) > 0),
  completed_occurrence_keys text[] not null default '{}'::text[],
  execution_refs text[] not null default '{}'::text[],
  receipt_refs text[] not null default '{}'::text[],
  completed_effect_keys text[] not null default '{}'::text[],
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  recorded_at timestamptz not null default now(),
  primary key(owner_id,snapshot_id),
  unique(owner_id,snapshot_id,integrity_hash),
  unique(owner_id,snapshot_id,project_id,domain)
);

create table if not exists public.command_center_personal_recovery_records (
  owner_id uuid not null,
  snapshot_id text not null,
  record_id text not null check (btrim(record_id) <> ''),
  project_id text not null check (btrim(project_id) <> ''),
  domain text not null check (btrim(domain) <> ''),
  sensitivity_rank integer not null check (sensitivity_rank >= 0),
  record_kind text not null check (record_kind in ('data','occurrence_history','execution_history','receipt_history','effect_history','authority')),
  content_hash text not null check (btrim(content_hash) <> ''),
  provenance_refs text[] not null check (cardinality(provenance_refs) > 0),
  authority_ref text,
  primary key(owner_id,snapshot_id,record_id),
  foreign key(owner_id,snapshot_id,project_id,domain) references public.command_center_personal_recovery_snapshots(owner_id,snapshot_id,project_id,domain) on delete restrict
);

create table if not exists public.command_center_personal_recovery_applies (
  owner_id uuid not null,
  recovery_id text not null check (btrim(recovery_id) <> ''),
  snapshot_id text not null,
  integrity_hash text not null check (btrim(integrity_hash) <> ''),
  project_id text not null check (btrim(project_id) <> ''),
  domain text not null check (btrim(domain) <> ''),
  mode text not null check (mode in ('dry_run','deferred','rejected','applied','already_applied')),
  reason text not null check (btrim(reason) <> ''),
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  recorded_at timestamptz not null default now(),
  primary key(owner_id,recovery_id),
  foreign key(owner_id,snapshot_id,integrity_hash) references public.command_center_personal_recovery_snapshots(owner_id,snapshot_id,integrity_hash) on delete restrict,
  foreign key(owner_id,snapshot_id,project_id,domain) references public.command_center_personal_recovery_snapshots(owner_id,snapshot_id,project_id,domain) on delete restrict
);

create unique index if not exists command_center_personal_recovery_applied_once_idx
on public.command_center_personal_recovery_applies(owner_id,snapshot_id)
where mode='applied';

create index if not exists command_center_personal_recovery_snapshot_scope_idx
on public.command_center_personal_recovery_snapshots(owner_id,project_id,domain,snapshot_created_at desc);

create or replace function public.command_center_reject_personal_recovery_history_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Personal recovery history is immutable'; end $$;

do $$ declare t text; begin
  foreach t in array array['command_center_personal_recovery_snapshots','command_center_personal_recovery_records','command_center_personal_recovery_applies'] loop
    execute format('drop trigger if exists %I on public.%I',t || '_immutable',t);
    execute format('create trigger %I before update or delete on public.%I for each row execute function public.command_center_reject_personal_recovery_history_mutation()',t || '_immutable',t);
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
  end loop;
end $$;

grant select,insert on table public.command_center_personal_recovery_snapshots to authenticated;
grant select,insert on table public.command_center_personal_recovery_records to authenticated;
grant select,insert on table public.command_center_personal_recovery_applies to authenticated;

create policy p8_11_recovery_snapshots_owner on public.command_center_personal_recovery_snapshots for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_11_recovery_snapshots_insert on public.command_center_personal_recovery_snapshots for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
create policy p8_11_recovery_records_owner on public.command_center_personal_recovery_records for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_11_recovery_records_insert on public.command_center_personal_recovery_records for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_11_recovery_applies_owner on public.command_center_personal_recovery_applies for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_11_recovery_applies_insert on public.command_center_personal_recovery_applies for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
