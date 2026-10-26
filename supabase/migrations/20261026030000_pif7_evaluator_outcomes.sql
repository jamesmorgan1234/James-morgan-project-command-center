-- PIF.7 — evaluator/outcome foundation. Branch-only; no production mutation.

create table if not exists public.command_center_evaluators (
  owner_id uuid not null references auth.users(id) on delete cascade,
  evaluator_key text not null,
  version bigint not null check(version>=1),
  owner_ref text not null,
  purpose text not null,
  bias_risks text[] not null,
  required_data_classes text[] not null default '{}'::text[],
  prohibited_data_classes text[] not null default '{}'::text[],
  applicable_domains text[] not null,
  applicable_task_classes text[] not null,
  minimum_evidence_classes text[] not null,
  repeat_count bigint not null check(repeat_count>=1),
  minimum_sample_count bigint not null check(minimum_sample_count>=1),
  minimum_confidence numeric(6,5) not null check(minimum_confidence between 0 and 1),
  acceptance_authority text not null check(acceptance_authority in ('command_center','owner')),
  calibration_evidence_refs text[] not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,evaluator_key),
  check(evaluator_key ~ '^evaluator:[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check(cardinality(bias_risks)>0 and cardinality(applicable_domains)>0 and cardinality(applicable_task_classes)>0 and cardinality(minimum_evidence_classes)>0 and cardinality(calibration_evidence_refs)>0)
);

create table if not exists public.command_center_evaluator_versions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  evaluator_key text not null,
  version bigint not null check(version>=1),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
  evidence_refs text[] not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,evaluator_key,version),
  foreign key(owner_id,evaluator_key) references public.command_center_evaluators(owner_id,evaluator_key) on delete cascade,
  check(cardinality(evidence_refs)>0)
);

create table if not exists public.command_center_evaluation_runs (
  owner_id uuid not null references auth.users(id) on delete cascade,
  evaluation_run_id uuid primary key default gen_random_uuid(),
  evaluator_key text not null,
  evaluator_version bigint not null check(evaluator_version>=1),
  candidate_ref text not null,
  baseline_ref text not null,
  decision_snapshot jsonb not null check(jsonb_typeof(decision_snapshot)='object'),
  evidence_class text not null check(evidence_class in ('synthetic','simulation','shadow','canary','production','external','owner_verified')),
  sample_count bigint not null check(sample_count>=1),
  repeat_index bigint not null check(repeat_index>=1),
  baseline_score double precision not null,
  candidate_score double precision not null,
  confidence numeric(6,5) not null check(confidence between 0 and 1),
  source_refs text[] not null,
  synthetic boolean not null,
  created_at timestamptz not null default now(),
  foreign key(owner_id,evaluator_key,evaluator_version) references public.command_center_evaluator_versions(owner_id,evaluator_key,version) on delete restrict,
  check(cardinality(source_refs)>0),
  check(not (synthetic and evidence_class in ('production','external','owner_verified')))
);

create table if not exists public.command_center_evaluation_outcomes (
  owner_id uuid not null references auth.users(id) on delete cascade,
  outcome_id uuid primary key default gen_random_uuid(),
  evaluation_run_id uuid not null references public.command_center_evaluation_runs(evaluation_run_id) on delete restrict,
  candidate_ref text not null,
  observed_at timestamptz not null,
  truth text not null check(truth in ('observed','verified','calculated','synthetic')),
  metric_key text not null,
  value double precision not null,
  source_refs text[] not null,
  confounders text[] not null default '{}'::text[],
  causal_attribution text not null check(causal_attribution in ('none','possible','supported')),
  created_at timestamptz not null default now(),
  check(cardinality(source_refs)>0),
  check(not (truth='synthetic' and causal_attribution<>'none')),
  check(not (causal_attribution='supported' and (truth<>'verified' or cardinality(confounders)>0)))
);

create index if not exists command_center_eval_run_candidate_idx on public.command_center_evaluation_runs(owner_id,candidate_ref,evaluator_key,evaluator_version);
create index if not exists command_center_eval_outcome_candidate_idx on public.command_center_evaluation_outcomes(owner_id,candidate_ref,observed_at desc);

do $$ declare t text; begin
  foreach t in array array['command_center_evaluators','command_center_evaluator_versions','command_center_evaluation_runs','command_center_evaluation_outcomes'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','pif7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','pif7_owner_select_'||t,t);
  end loop;
end $$;

-- Evaluator acceptance remains Command Center/owner governed. A candidate's own evaluator may supply evidence but cannot silently decide acceptance.
