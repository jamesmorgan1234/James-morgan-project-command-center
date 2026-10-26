create table if not exists public.command_center_recovery_artifacts (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
  artifact_ref text not null, artifact_class text not null check (artifact_class in ('backup','known_good','intelligence_state','migration','rollback','historical_recovery','scale_plan','dormant_state','device_seam','simulation','replacement_audit')),
  version_ref text not null, checksum text not null, storage_ref text not null, policy_snapshot_ref text not null,
  revocation_snapshot_ref text not null, source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs)='array'),
  created_at timestamptz not null default now(), unique(owner_user_id,artifact_ref,version_ref)
);
create table if not exists public.command_center_recovery_exercises (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
  exercise_ref text not null, exercise_class text not null check (exercise_class in ('restore','migration','rollback','provider_replacement','historical_recovery','scale_10x','scale_100x','reactivation','chaos','shadow','control_plane_failover','revalidation','counterfactual')),
  project_ref text, source_version_ref text not null, target_version_ref text, production_side_effects boolean not null default false check (production_side_effects=false),
  deterministic_replay_ref text, result jsonb not null check (jsonb_typeof(result)='object'), evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'),
  executed_at timestamptz not null, recorded_at timestamptz not null default now(), unique(owner_user_id,exercise_ref)
);
create table if not exists public.command_center_dependency_replacements (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
  replacement_ref text not null, project_ref text, dependency_class text not null check (dependency_class in ('provider','model','method','specialist','evaluator','ontology','library','service')),
  old_ref text not null, new_ref text not null, compatibility_state text not null check (compatibility_state in ('candidate','compatible','incompatible','degraded','revalidation_required')),
  rollback_ref text not null, authorization_ref text, evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'),
  assessed_at timestamptz not null, unique(owner_user_id,replacement_ref)
);
create table if not exists public.command_center_dormant_reactivations (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
  reactivation_ref text not null, project_ref text not null, dormant_class text not null check (dormant_class in ('capability','specialist','procedure','promotion')),
  dormant_ref text not null, prior_version_ref text not null, current_policy_ref text not null, current_revocation_ref text not null,
  revalidation_state text not null check (revalidation_state in ('required','passed','failed','blocked')),
  authorization_ref text, evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'),
  assessed_at timestamptz not null, unique(owner_user_id,reactivation_ref)
);
create table if not exists public.command_center_future_boundaries (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
  boundary_ref text not null, boundary_class text not null check (boundary_class in ('multi_user','commercial_public_fork','device','interface')),
  status text not null check (status in ('dormant','design_only','isolated_candidate','authorized')),
  may_inherit_private_state boolean not null default false check (may_inherit_private_state=false), authorization_ref text,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'), recorded_at timestamptz not null default now(),
  unique(owner_user_id,boundary_ref)
);
create table if not exists public.command_center_drift_revalidation (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
  finding_ref text not null, project_ref text, finding_class text not null check (finding_class in ('architecture_drift','config_drift','external_reality','memory_age','dependency_age','replacement_audit','causal_validation')),
  expected_ref text not null, observed_ref text not null, state text not null check (state in ('current','drifted','stale','revalidation_required','resolved')),
  action_ref text, evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs)='array'), observed_at timestamptz not null,
  unique(owner_user_id,finding_ref)
);
create or replace function public.command_center_reject_recovery_evidence_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Recovery and lifecycle evidence is immutable'; end $$;
create trigger command_center_recovery_artifacts_immutable before update or delete on public.command_center_recovery_artifacts for each row execute function public.command_center_reject_recovery_evidence_mutation();
create trigger command_center_recovery_exercises_immutable before update or delete on public.command_center_recovery_exercises for each row execute function public.command_center_reject_recovery_evidence_mutation();
create trigger command_center_dependency_replacements_immutable before update or delete on public.command_center_dependency_replacements for each row execute function public.command_center_reject_recovery_evidence_mutation();
create trigger command_center_dormant_reactivations_immutable before update or delete on public.command_center_dormant_reactivations for each row execute function public.command_center_reject_recovery_evidence_mutation();
create trigger command_center_future_boundaries_immutable before update or delete on public.command_center_future_boundaries for each row execute function public.command_center_reject_recovery_evidence_mutation();
create trigger command_center_drift_revalidation_immutable before update or delete on public.command_center_drift_revalidation for each row execute function public.command_center_reject_recovery_evidence_mutation();
alter table public.command_center_recovery_artifacts enable row level security; alter table public.command_center_recovery_exercises enable row level security; alter table public.command_center_dependency_replacements enable row level security; alter table public.command_center_dormant_reactivations enable row level security; alter table public.command_center_future_boundaries enable row level security; alter table public.command_center_drift_revalidation enable row level security;
create policy p14_recovery_artifacts_owner on public.command_center_recovery_artifacts for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p14_recovery_exercises_owner on public.command_center_recovery_exercises for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p14_dependency_replacements_owner on public.command_center_dependency_replacements for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p14_dormant_reactivations_owner on public.command_center_dormant_reactivations for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p14_future_boundaries_owner on public.command_center_future_boundaries for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
create policy p14_drift_revalidation_owner on public.command_center_drift_revalidation for all to authenticated using (auth.uid()=owner_user_id and (select public.is_command_center_authorized())) with check (auth.uid()=owner_user_id and (select public.is_command_center_authorized()));
