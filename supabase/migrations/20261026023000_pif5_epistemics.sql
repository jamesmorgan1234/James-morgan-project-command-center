-- PIF.5 — epistemic/contradiction/uncertainty companion to canonical C3 knowledge/provenance.
-- Branch-only migration. Does not create a second truth/knowledge owner.

create table if not exists public.command_center_epistemic_assessments (
  owner_id uuid not null references auth.users(id) on delete cascade,
  assessment_id text not null,
  claim_id text not null,
  subject_id text not null,
  value_fingerprint text not null,
  version bigint not null default 1 check(version>=1),
  epistemic_state text not null check(epistemic_state in ('OWNER_STATED','VERIFIED','EXTERNALLY_CONFIRMED','CALCULATED','OBSERVED','STRONGLY_SUPPORTED','INFERRED','WEAK_INFERENCE','GENERATED','HYPOTHESIS','PREDICTION','ESTIMATE','RECOMMENDATION','ASSUMPTION','EXPERIMENTAL_FINDING','STALE','CONFLICTING','SUPERSEDED','DISPROVEN','UNKNOWN','NOT_APPLICABLE')),
  authority_rank bigint not null check(authority_rank>=0),
  brain_id text,
  method_id text,
  domain_id text,
  evidence jsonb not null check(jsonb_typeof(evidence)='array'),
  calibration_score numeric(6,5) not null check(calibration_score between 0 and 1),
  confidence numeric(6,5) not null check(confidence between 0 and 1),
  observed_at timestamptz not null,
  recorded_at timestamptz not null,
  stale_after timestamptz,
  applicability_refs text[] not null default '{}'::text[],
  supersedes_assessment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,assessment_id),
  check(length(btrim(claim_id))>0 and length(btrim(subject_id))>0 and length(btrim(value_fingerprint))>0),
  check(brain_id is null or brain_id ~ '^brn_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check(method_id is null or method_id ~ '^mth_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check(domain_id is null or domain_id ~ '^dom_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check(recorded_at>=observed_at),
  check(stale_after is null or stale_after>observed_at),
  check(not (epistemic_state in ('INFERRED','WEAK_INFERENCE','GENERATED','HYPOTHESIS','PREDICTION','ESTIMATE','RECOMMENDATION','ASSUMPTION','EXPERIMENTAL_FINDING','UNKNOWN','CONFLICTING') and confidence=1))
);

create table if not exists public.command_center_epistemic_assessment_versions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  assessment_id text not null,
  version bigint not null check(version>=1),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
  provenance_evidence_ids text[] not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,assessment_id,version),
  foreign key(owner_id,assessment_id) references public.command_center_epistemic_assessments(owner_id,assessment_id) on delete cascade,
  check(cardinality(provenance_evidence_ids)>0)
);

create table if not exists public.command_center_epistemic_contradictions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  contradiction_id uuid primary key default gen_random_uuid(),
  subject_id text not null,
  assessment_ids text[] not null,
  authority_summary jsonb not null check(jsonb_typeof(authority_summary)='object'),
  evidence_summary jsonb not null check(jsonb_typeof(evidence_summary)='object'),
  applicability_refs text[] not null default '{}'::text[],
  resolution_state text not null check(resolution_state in ('UNRESOLVED','RESOLVED','ABSTAIN','SUPERSEDED')),
  resolution_evidence_ids text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check(cardinality(assessment_ids)>=2)
);

-- Evidence independence metadata is stored per contribution rather than counting mirrored sources as support.
-- Expected shape: [{evidence_id,source_ref,independence_group,source_confidence,transformation_confidence}].
create or replace function command_center_private.pif5_epistemic_evidence_valid(p_evidence jsonb)
returns boolean language sql immutable set search_path='' as $$
  select jsonb_typeof(p_evidence)='array'
     and not exists (
       select 1 from jsonb_array_elements(p_evidence) e
       where jsonb_typeof(e)<>'object'
          or coalesce(e->>'evidence_id','') !~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$'
          or length(btrim(coalesce(e->>'source_ref','')))=0
          or length(btrim(coalesce(e->>'independence_group','')))=0
          or coalesce((e->>'source_confidence')::numeric,-1) not between 0 and 1
          or coalesce((e->>'transformation_confidence')::numeric,-1) not between 0 and 1
     );
$$;
revoke all on function command_center_private.pif5_epistemic_evidence_valid(jsonb) from public,anon,authenticated;

alter table public.command_center_epistemic_assessments drop constraint if exists command_center_epistemic_assessments_evidence_valid;
alter table public.command_center_epistemic_assessments add constraint command_center_epistemic_assessments_evidence_valid check(command_center_private.pif5_epistemic_evidence_valid(evidence));

create index if not exists command_center_epistemic_subject_idx on public.command_center_epistemic_assessments(owner_id,subject_id,authority_rank desc,epistemic_state,stale_after);
create index if not exists command_center_epistemic_contradiction_subject_idx on public.command_center_epistemic_contradictions(owner_id,subject_id,resolution_state);

do $$ declare t text; begin
  foreach t in array array['command_center_epistemic_assessments','command_center_epistemic_assessment_versions','command_center_epistemic_contradictions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','pif5_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','pif5_owner_select_'||t,t);
  end loop;
end $$;

-- Mutation is intentionally restricted to governed service/RPC paths added with the effect owner.
-- Resolution must preserve unresolved disagreement; newer/fresher evidence alone never overwrites higher authority.
