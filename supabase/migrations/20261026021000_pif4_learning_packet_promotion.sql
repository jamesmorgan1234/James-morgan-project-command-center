-- PIF.4 — canonical Learning Packet + governed promotion. Branch-only; no production mutation.

create table if not exists public.command_center_learning_packets (
  owner_id uuid not null references auth.users(id) on delete cascade,
  learning_id text not null,
  version bigint not null check(version>=1),
  source_brain_id text not null,
  source_system_ref text not null,
  source_company_id text,
  source_project_id text,
  source_run_id text,
  source_task_id text,
  source_method_id text not null,
  source_method_version bigint not null check(source_method_version>=1),
  source_capability_key text not null,
  observed_at timestamptz not null,
  task_class text not null,
  domain_id text not null,
  condition_ids text[] not null default '{}'::text[],
  constraints text[] not null default '{}'::text[],
  discovery text not null,
  action_taken text not null,
  evidence_ids text[] not null,
  source_refs text[] not null,
  sample_count bigint not null check(sample_count>=1),
  metrics jsonb not null check(jsonb_typeof(metrics)='array'),
  outcome text not null,
  success_criteria text[] not null,
  failure_criteria text[] not null,
  confidence numeric(6,5) not null check(confidence between 0 and 1),
  calibration numeric(6,5) not null check(calibration between 0 and 1),
  reproducibility numeric(6,5) not null check(reproducibility between 0 and 1),
  causal_confidence numeric(6,5) not null check(causal_confidence between 0 and 1),
  confounders text[] not null default '{}'::text[],
  limitations text[] not null default '{}'::text[],
  failure_conditions text[] not null default '{}'::text[],
  prerequisites text[] not null default '{}'::text[],
  required_tools text[] not null default '{}'::text[],
  required_data_classes text[] not null default '{}'::text[],
  resource_implications text[] not null default '{}'::text[],
  latency_implications text[] not null default '{}'::text[],
  financial_implications text[] not null default '{}'::text[],
  privacy_class text not null,
  privacy_scope_ref text,
  security_implications text[] not null default '{}'::text[],
  applicable_systems text[] not null default '{}'::text[],
  transferability_hypothesis text not null,
  proposed_scope jsonb not null check(jsonb_typeof(proposed_scope)='object'),
  proposed_promotion_class text not null,
  validation_state text not null check(validation_state in ('submitted','validated','contradicted','stale','invalid','retracted')),
  fresh_until timestamptz not null,
  revalidate_after timestamptz not null,
  negative_knowledge text[] not null default '{}'::text[],
  recovery_lesson text[] not null default '{}'::text[],
  rollback_evidence_id text not null,
  retraction_evidence_ids text[] not null default '{}'::text[],
  provenance_evidence_ids text[] not null,
  created_at timestamptz not null default now(),
  primary key(owner_id,learning_id),
  check(learning_id ~ '^lrn_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check(source_brain_id ~ '^brn_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check(source_method_id ~ '^mth_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check(domain_id ~ '^dom_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check(cardinality(evidence_ids)>0 and cardinality(source_refs)>0 and cardinality(success_criteria)>0 and cardinality(failure_criteria)>0 and cardinality(provenance_evidence_ids)>0),
  check(rollback_evidence_id ~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check(fresh_until>observed_at and revalidate_after>observed_at)
);

create table if not exists public.command_center_learning_packet_versions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  learning_id text not null,
  version bigint not null check(version>=1),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
  provenance_evidence_ids text[] not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,learning_id,version),
  foreign key(owner_id,learning_id) references public.command_center_learning_packets(owner_id,learning_id) on delete cascade
);

create table if not exists public.command_center_learning_promotion_decisions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  promotion_id text not null,
  version bigint not null check(version>=1),
  learning_id text not null,
  learning_version bigint not null check(learning_version>=1),
  promotion_class text not null check(promotion_class in ('GLOBAL','DOMAIN','BRAIN','TASK','CONDITION','EXPERIMENTAL','QUARANTINED','REJECTED','ALTERNATIVE','DEPRECATED')),
  lifecycle text not null check(lifecycle in ('classified','promoted','quarantined','rejected','alternative','deprecated','retracted')),
  applicability jsonb not null check(jsonb_typeof(applicability)='object'),
  evidence_ids text[] not null,
  validator_refs text[] not null,
  reason_codes text[] not null,
  decided_at timestamptz not null,
  expires_at timestamptz not null,
  rollback_evidence_id text not null,
  executable_policy boolean not null default false,
  primary key(owner_id,promotion_id,version),
  foreign key(owner_id,learning_id) references public.command_center_learning_packets(owner_id,learning_id) on delete restrict,
  check(promotion_id ~ '^prm_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check(cardinality(evidence_ids)>0 and cardinality(validator_refs)>0 and cardinality(reason_codes)>0),
  check(rollback_evidence_id ~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check(executable_policy=false)
);

create index if not exists command_center_learning_packets_scope_idx on public.command_center_learning_packets(owner_id,domain_id,validation_state,fresh_until,revalidate_after);
create index if not exists command_center_learning_promotion_state_idx on public.command_center_learning_promotion_decisions(owner_id,promotion_class,lifecycle,expires_at);

do $$ declare t text; begin
  foreach t in array array['command_center_learning_packets','command_center_learning_packet_versions','command_center_learning_promotion_decisions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','pif4_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','pif4_owner_select_'||t,t);
  end loop;
end $$;

-- Mutation remains service/RPC controlled. PIF.4 intentionally does not install executable policy.
-- PIF.5/7/8/9/10 must establish epistemic, evaluator, negative-knowledge, trace and recovery readiness before any future effect path can consume a GLOBAL decision.
