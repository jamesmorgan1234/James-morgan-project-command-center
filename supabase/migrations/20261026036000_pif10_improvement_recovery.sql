-- PIF.10 — governed self-improvement and recovery invariants. Branch-only; no production mutation.

create table if not exists public.command_center_improvement_governance (
  owner_id uuid not null references auth.users(id) on delete cascade,
  proposal_id text not null,
  lifecycle_version bigint not null check(lifecycle_version >= 1),
  stage text not null check(stage in ('proposed','evidence_validated','scoped','risk_assessed','evaluated','baseline_locked','authorized','shadow','canary','verified','promoted','monitoring','rolled_back','lesson_recorded','rejected')),
  applicability_refs text[] not null,
  requested_permission_refs text[] not null default '{}'::text[],
  minimum_effect_confidence numeric not null check(minimum_effect_confidence >= 0 and minimum_effect_confidence <= 1),
  maximum_canary_fraction numeric not null check(maximum_canary_fraction > 0 and maximum_canary_fraction <= 1),
  rollback_checkpoint_ref text not null,
  baseline_ref text,
  acceptance_fingerprint text,
  authorization_ref text,
  current_snapshot_ref text,
  policy_epoch bigint,
  revocation_epoch bigint,
  installs_automatically boolean not null default false,
  evidence_refs text[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id, proposal_id),
  check(cardinality(applicability_refs) > 0),
  check(cardinality(evidence_refs) > 0),
  check(installs_automatically = false)
);

create table if not exists public.command_center_improvement_authorizations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  authorization_id text not null,
  proposal_id text not null,
  issuer_ref text not null,
  policy_epoch bigint not null check(policy_epoch >= 0),
  revocation_epoch bigint not null check(revocation_epoch >= 0),
  permission_refs text[] not null default '{}'::text[],
  maximum_canary_fraction numeric not null check(maximum_canary_fraction > 0 and maximum_canary_fraction <= 1),
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  evidence_refs text[] not null,
  created_at timestamptz not null default now(),
  primary key(owner_id, authorization_id),
  foreign key(owner_id, proposal_id) references public.command_center_improvement_governance(owner_id, proposal_id) on delete cascade,
  check(expires_at > issued_at),
  check(cardinality(evidence_refs) > 0)
);

create table if not exists public.command_center_improvement_snapshots (
  owner_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id text not null,
  proposal_id text not null,
  captured_at timestamptz not null,
  policy_epoch bigint not null check(policy_epoch >= 0),
  revocation_epoch bigint not null check(revocation_epoch >= 0),
  exact_version_refs text[] not null,
  learning_refs text[] not null default '{}'::text[],
  invalidated_learning_refs text[] not null default '{}'::text[],
  permission_refs text[] not null default '{}'::text[],
  trace_ref text not null,
  baseline_ref text not null,
  acceptance_fingerprint text not null,
  rollback_checkpoint_ref text not null,
  evidence_refs text[] not null,
  created_at timestamptz not null default now(),
  primary key(owner_id, snapshot_id),
  foreign key(owner_id, proposal_id) references public.command_center_improvement_governance(owner_id, proposal_id) on delete cascade,
  check(cardinality(exact_version_refs) > 0),
  check(cardinality(evidence_refs) > 0),
  check(not (learning_refs && invalidated_learning_refs))
);

create table if not exists public.command_center_improvement_transitions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  proposal_id text not null,
  lifecycle_version bigint not null check(lifecycle_version >= 1),
  sequence bigint not null check(sequence >= 1),
  from_stage text,
  to_stage text not null,
  occurred_at timestamptz not null,
  actor_ref text not null,
  reason text not null,
  evidence_refs text[] not null,
  snapshot_ref text,
  authorization_ref text,
  created_at timestamptz not null default now(),
  primary key(owner_id, proposal_id, lifecycle_version),
  unique(owner_id, proposal_id, sequence),
  foreign key(owner_id, proposal_id) references public.command_center_improvement_governance(owner_id, proposal_id) on delete cascade,
  check(cardinality(evidence_refs) > 0)
);

create table if not exists public.command_center_improvement_monitoring (
  owner_id uuid not null references auth.users(id) on delete cascade,
  observation_id text not null,
  proposal_id text not null,
  observed_at timestamptz not null,
  healthy boolean not null,
  effect_confidence numeric not null check(effect_confidence >= 0 and effect_confidence <= 1),
  permission_refs text[] not null default '{}'::text[],
  acceptance_fingerprint text not null,
  policy_epoch bigint not null check(policy_epoch >= 0),
  revocation_epoch bigint not null check(revocation_epoch >= 0),
  evidence_refs text[] not null,
  created_at timestamptz not null default now(),
  primary key(owner_id, observation_id),
  foreign key(owner_id, proposal_id) references public.command_center_improvement_governance(owner_id, proposal_id) on delete cascade,
  check(cardinality(evidence_refs) > 0)
);

-- Transition and snapshot evidence are append-only audit truth. Even privileged application paths
-- must create a new version/record rather than rewriting historical governance evidence.
create or replace function public.pif10_reject_immutable_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$ begin
  raise exception 'PIF.10 immutable governance record cannot be updated or deleted';
end $$;

drop trigger if exists pif10_immutable_transitions on public.command_center_improvement_transitions;
create trigger pif10_immutable_transitions before update or delete on public.command_center_improvement_transitions
for each row execute function public.pif10_reject_immutable_mutation();

drop trigger if exists pif10_immutable_snapshots on public.command_center_improvement_snapshots;
create trigger pif10_immutable_snapshots before update or delete on public.command_center_improvement_snapshots
for each row execute function public.pif10_reject_immutable_mutation();

drop trigger if exists pif10_immutable_authorizations on public.command_center_improvement_authorizations;
create trigger pif10_immutable_authorizations before update or delete on public.command_center_improvement_authorizations
for each row execute function public.pif10_reject_immutable_mutation();

create index if not exists command_center_improvement_stage_idx
  on public.command_center_improvement_governance(owner_id, stage, lifecycle_version);
create index if not exists command_center_improvement_transition_seq_idx
  on public.command_center_improvement_transitions(owner_id, proposal_id, sequence);
create index if not exists command_center_improvement_snapshot_versions_idx
  on public.command_center_improvement_snapshots using gin(exact_version_refs);
create index if not exists command_center_improvement_snapshot_learning_idx
  on public.command_center_improvement_snapshots using gin(learning_refs);

do $$ declare t text; begin
  foreach t in array array['command_center_improvement_governance','command_center_improvement_authorizations','command_center_improvement_snapshots','command_center_improvement_transitions','command_center_improvement_monitoring'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public,anon,authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', 'pif10_owner_select_'||t, t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))', 'pif10_owner_select_'||t, t);
  end loop;
end $$;
