create table if not exists public.command_center_metric_registry (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  metric_key text not null,
  semantic_version text not null,
  metric_class text not null check (metric_class in ('business','reliability','performance','calibration','cognitive_health','ecosystem_health','agency','routing','security','trust','learning','evaluation')),
  definition text not null,
  unit text not null,
  aggregation text not null,
  provenance_requirements jsonb not null default '[]'::jsonb check (jsonb_typeof(provenance_requirements)='array'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs)='array'),
  registered_at timestamptz not null default now(),
  unique(owner_user_id, metric_key, semantic_version)
);

create table if not exists public.command_center_observability_events (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  project_ref text,
  company_ref text,
  trace_ref text not null,
  event_class text not null check (event_class in ('context','policy','router','specialist','method','tool','evidence','verifier','state','outcome','learning','promotion','security','reliability')),
  predecessor_ref text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object'),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_user_id,event_id)
);

create table if not exists public.command_center_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id text not null,
  project_ref text,
  company_ref text,
  health_class text not null check (health_class in ('reliability','performance','calibration_drift','contradiction_growth','stale_memory','evaluator_health','routing_regret','transfer_outcome','ecosystem_learning','provider_drift','model_drift','method_drift','revalidation_pressure')),
  value double precision not null,
  unit text not null,
  threshold_state text not null check (threshold_state in ('healthy','watch','degraded','critical','unknown')),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'),
  observed_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_user_id,snapshot_id)
);

create table if not exists public.command_center_decision_outcomes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  decision_ref text not null,
  project_ref text,
  company_ref text,
  recommendation_ref text,
  predicted_outcome jsonb not null default '{}'::jsonb check (jsonb_typeof(predicted_outcome)='object'),
  actual_outcome jsonb not null default '{}'::jsonb check (jsonb_typeof(actual_outcome)='object'),
  process_quality double precision,
  decision_quality double precision,
  transfer_effect double precision,
  luck_confounded boolean not null default false,
  authorization_ref text,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'),
  observed_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_user_id,decision_ref,observed_at)
);

create table if not exists public.command_center_learning_lessons (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  lesson_ref text not null,
  project_ref text,
  company_ref text,
  lesson_class text not null check (lesson_class in ('build_history','failure_intelligence','negative_knowledge','procedure_learning')),
  scope_class text not null check (scope_class in ('project','company','domain','ecosystem_candidate')),
  content jsonb not null check (jsonb_typeof(content)='object'),
  applicability jsonb not null default '{}'::jsonb check (jsonb_typeof(applicability)='object'),
  confidence double precision not null check (confidence between 0 and 1),
  promotion_state text not null check (promotion_state in ('local','candidate','evaluating','approved','rejected','revoked')),
  promotion_authorization_ref text,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'),
  recorded_at timestamptz not null default now(),
  unique(owner_user_id,lesson_ref)
);

create table if not exists public.command_center_security_analytics (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  finding_ref text not null,
  project_ref text,
  company_ref text,
  finding_class text not null check (finding_class in ('security','trust','correlated_error','shared_source','shared_model','shared_benchmark')),
  severity text not null check (severity in ('info','low','medium','high','critical')),
  correlation_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(correlation_refs)='array'),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'),
  observed_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_user_id,finding_ref)
);

create table if not exists public.command_center_governance_findings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  finding_ref text not null,
  project_ref text,
  finding_class text not null check (finding_class in ('self_audit','compliance','architecture_critic','ecosystem_optimizer')),
  finding jsonb not null check (jsonb_typeof(finding)='object'),
  proposal jsonb check (proposal is null or jsonb_typeof(proposal)='object'),
  may_self_mutate boolean not null default false check (may_self_mutate=false),
  status text not null check (status in ('open','accepted','rejected','superseded','resolved')),
  authorization_ref text,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'),
  recorded_at timestamptz not null default now(),
  unique(owner_user_id,finding_ref)
);

create table if not exists public.command_center_evaluator_results (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  evaluation_ref text not null,
  evaluator_ref text not null,
  evaluator_version text not null,
  benchmark_ref text not null,
  benchmark_version text not null,
  project_ref text,
  reproducibility_ref text not null,
  privacy_class text not null,
  sample_count bigint not null check (sample_count >= 0),
  result jsonb not null check (jsonb_typeof(result)='object'),
  calibration_state text not null check (calibration_state in ('calibrated','recalibration_required','invalid','unknown')),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'),
  evaluated_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_user_id,evaluation_ref)
);

create or replace function public.command_center_reject_analytics_evidence_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Analytics and governance evidence is immutable'; end $$;

create trigger command_center_metric_registry_immutable before update or delete on public.command_center_metric_registry for each row execute function public.command_center_reject_analytics_evidence_mutation();
create trigger command_center_observability_events_immutable before update or delete on public.command_center_observability_events for each row execute function public.command_center_reject_analytics_evidence_mutation();
create trigger command_center_health_snapshots_immutable before update or delete on public.command_center_health_snapshots for each row execute function public.command_center_reject_analytics_evidence_mutation();
create trigger command_center_decision_outcomes_immutable before update or delete on public.command_center_decision_outcomes for each row execute function public.command_center_reject_analytics_evidence_mutation();
create trigger command_center_learning_lessons_immutable before update or delete on public.command_center_learning_lessons for each row execute function public.command_center_reject_analytics_evidence_mutation();
create trigger command_center_security_analytics_immutable before update or delete on public.command_center_security_analytics for each row execute function public.command_center_reject_analytics_evidence_mutation();
create trigger command_center_governance_findings_immutable before update or delete on public.command_center_governance_findings for each row execute function public.command_center_reject_analytics_evidence_mutation();
create trigger command_center_evaluator_results_immutable before update or delete on public.command_center_evaluator_results for each row execute function public.command_center_reject_analytics_evidence_mutation();

alter table public.command_center_metric_registry enable row level security;
alter table public.command_center_observability_events enable row level security;
alter table public.command_center_health_snapshots enable row level security;
alter table public.command_center_decision_outcomes enable row level security;
alter table public.command_center_learning_lessons enable row level security;
alter table public.command_center_security_analytics enable row level security;
alter table public.command_center_governance_findings enable row level security;
alter table public.command_center_evaluator_results enable row level security;

create policy p13_metric_registry_owner on public.command_center_metric_registry for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p13_observability_events_owner on public.command_center_observability_events for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p13_health_snapshots_owner on public.command_center_health_snapshots for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p13_decision_outcomes_owner on public.command_center_decision_outcomes for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p13_learning_lessons_owner on public.command_center_learning_lessons for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p13_security_analytics_owner on public.command_center_security_analytics for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p13_governance_findings_owner on public.command_center_governance_findings for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p13_evaluator_results_owner on public.command_center_evaluator_results for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));

create index if not exists command_center_observability_trace_idx on public.command_center_observability_events(owner_user_id,trace_ref,occurred_at);
create index if not exists command_center_health_class_idx on public.command_center_health_snapshots(owner_user_id,health_class,observed_at desc);
create index if not exists command_center_learning_scope_idx on public.command_center_learning_lessons(owner_user_id,scope_class,promotion_state);
create index if not exists command_center_security_analytics_idx on public.command_center_security_analytics(owner_user_id,finding_class,severity,observed_at desc);
