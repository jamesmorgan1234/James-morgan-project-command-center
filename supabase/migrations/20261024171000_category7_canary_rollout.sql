-- Category 7 / P7.22 — durable shadow/canary rollout evidence and automatic rollback recommendation.
-- Branch-only migration. This control plane does not deploy/promote production; it records safe rollout decisions.

create table if not exists public.command_center_agency_rollout_candidates (
  candidate_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  component_key text not null,
  stable_version_ref text not null,
  candidate_version_ref text not null,
  mode text not null check (mode in ('shadow','canary')),
  traffic_fraction numeric(6,5) not null check (traffic_fraction>=0 and traffic_fraction<=1),
  state text not null default 'observing' check (state in ('observing','promotion_recommended','rollback_required','rejected','closed')),
  protected_actions_allowed boolean not null default false check (protected_actions_allowed=false),
  evidence_refs text[] not null,
  opened_at timestamptz not null,
  closed_at timestamptz,
  recorded_at timestamptz not null default now(),
  unique(owner_id,component_key,candidate_version_ref),
  check (length(btrim(component_key)) between 1 and 240),
  check (length(btrim(stable_version_ref)) between 1 and 500),
  check (length(btrim(candidate_version_ref)) between 1 and 500),
  check (stable_version_ref<>candidate_version_ref),
  check (cardinality(evidence_refs)>0),
  check ((state in ('observing','promotion_recommended','rollback_required') and closed_at is null) or (state in ('rejected','closed') and closed_at is not null)),
  check (opened_at<=recorded_at + interval '5 minutes')
);

create table if not exists public.command_center_agency_rollout_observations (
  observation_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  candidate_id uuid not null references public.command_center_agency_rollout_candidates(candidate_id) on delete cascade,
  stable_success_rate numeric(8,7) not null check (stable_success_rate between 0 and 1),
  candidate_success_rate numeric(8,7) not null check (candidate_success_rate between 0 and 1),
  stable_verification_failure_rate numeric(8,7) not null check (stable_verification_failure_rate between 0 and 1),
  candidate_verification_failure_rate numeric(8,7) not null check (candidate_verification_failure_rate between 0 and 1),
  protected_boundary_violation_count integer not null check (protected_boundary_violation_count>=0),
  duplicate_side_effect_count integer not null check (duplicate_side_effect_count>=0),
  sample_count integer not null check (sample_count>=1),
  evidence_refs text[] not null,
  observed_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check (observed_at<=recorded_at + interval '5 minutes')
);

create table if not exists public.command_center_agency_rollout_decisions (
  decision_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  candidate_id uuid not null references public.command_center_agency_rollout_candidates(candidate_id) on delete cascade,
  result text not null check (result in ('continue_observation','promotion_recommended','rollback_required')),
  reason text not null check (reason in ('insufficient_samples','protected_boundary_violation','duplicate_side_effect','success_rate_regression','verification_regression','candidate_within_safe_thresholds')),
  max_success_regression numeric(8,7) not null check (max_success_regression between 0 and 1),
  min_samples integer not null check (min_samples>=1),
  protected_side_effect_executed boolean not null default false check (protected_side_effect_executed=false),
  deployment_changed boolean not null default false check (deployment_changed=false),
  evidence_refs text[] not null,
  decided_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check (decided_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_rollout_obs_idx
  on public.command_center_agency_rollout_observations(owner_id,candidate_id,observed_at,observation_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_rollout_candidates','command_center_agency_rollout_observations','command_center_agency_rollout_decisions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_evaluate_rollout(
  p_candidate_id uuid,p_max_success_regression numeric,p_min_samples integer,p_evidence_refs text[],p_decided_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  c public.command_center_agency_rollout_candidates%rowtype;
  o public.command_center_agency_rollout_observations%rowtype;
  v_result text;
  v_reason text;
  v_id uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into c from public.command_center_agency_rollout_candidates where owner_id=u and candidate_id=p_candidate_id for update;
  if not found or c.state<>'observing' then raise exception 'Observing rollout candidate not found'; end if;
  if p_max_success_regression<0 or p_max_success_regression>1 or p_min_samples<1 then raise exception 'Invalid rollout thresholds'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Rollout decision evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Rollout decision requires evidence'; end if;
  select * into o from public.command_center_agency_rollout_observations where owner_id=u and candidate_id=c.candidate_id order by observed_at desc,observation_id desc limit 1;
  if not found or o.sample_count<p_min_samples then v_result:='continue_observation'; v_reason:='insufficient_samples';
  elsif o.protected_boundary_violation_count>0 then v_result:='rollback_required'; v_reason:='protected_boundary_violation';
  elsif o.duplicate_side_effect_count>0 then v_result:='rollback_required'; v_reason:='duplicate_side_effect';
  elsif o.candidate_success_rate < o.stable_success_rate-p_max_success_regression then v_result:='rollback_required'; v_reason:='success_rate_regression';
  elsif o.candidate_verification_failure_rate>o.stable_verification_failure_rate then v_result:='rollback_required'; v_reason:='verification_regression';
  else v_result:='promotion_recommended'; v_reason:='candidate_within_safe_thresholds'; end if;
  insert into public.command_center_agency_rollout_decisions(owner_id,candidate_id,result,reason,max_success_regression,min_samples,evidence_refs,decided_at)
  values(u,c.candidate_id,v_result,v_reason,p_max_success_regression,p_min_samples,p_evidence_refs,p_decided_at) returning decision_id into v_id;
  update public.command_center_agency_rollout_candidates set state=case when v_result='rollback_required' then 'rollback_required' when v_result='promotion_recommended' then 'promotion_recommended' else state end where owner_id=u and candidate_id=c.candidate_id;
  return jsonb_build_object('decision_id',v_id,'result',v_result,'reason',v_reason,'protected_side_effect_executed',false,'deployment_changed',false);
end $$;

revoke all on function public.command_center_agency_evaluate_rollout(uuid,numeric,integer,text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_evaluate_rollout(uuid,numeric,integer,text[],timestamptz) to authenticated;
