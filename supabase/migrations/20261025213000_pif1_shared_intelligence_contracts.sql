-- PIF.1 — shared intelligence contracts / ontology extension of the existing C1/C3 owners.
-- Branch-only migration. No production database state changes until an explicitly authorized migration window.
-- Existing Category 3 knowledge claims remain valid. Only claims promoted into the shared intelligence plane carry this contract metadata.

create or replace function command_center_private.c3_pif1_evidence_ids_valid(p_values text[])
returns boolean
language sql
immutable
strict
set search_path=''
as $$
  select command_center_private.c3_text_array_unique_nonblank(p_values)
     and not exists (
       select 1 from unnest(p_values) as v(value)
       where v.value !~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$'
     );
$$;
revoke all on function command_center_private.c3_pif1_evidence_ids_valid(text[]) from public, anon, authenticated;

create or replace function command_center_private.c3_pif1_applicability_valid(p_scope text,p_ref text)
returns boolean
language sql
immutable
set search_path=''
as $$
  select case p_scope
    when 'global' then p_ref is null
    when 'domain' then p_ref ~ '^dom_[a-z0-9]+(?:-[a-z0-9]+)*$'
    when 'brain' then p_ref ~ '^brn_[a-z0-9]+(?:-[a-z0-9]+)*$'
    when 'company' then p_ref ~ '^cmp_[a-z0-9]+(?:-[a-z0-9]+)*$'
    when 'project' then p_ref ~ '^prj_[a-z0-9]+(?:-[a-z0-9]+)*$'
    when 'task' then p_ref ~ '^tsk_[a-z0-9]+(?:-[a-z0-9]+)*$'
    when 'condition' then p_ref ~ '^cnd_[a-z0-9]+(?:-[a-z0-9]+)*$'
    else false
  end;
$$;
revoke all on function command_center_private.c3_pif1_applicability_valid(text,text) from public, anon, authenticated;

create or replace function command_center_private.c3_pif1_privacy_valid(p_class text,p_scope_ref text)
returns boolean
language sql
immutable
set search_path=''
as $$
  select case p_class
    when 'ecosystem_shared' then p_scope_ref is null
    when 'domain_shared' then p_scope_ref ~ '^dom_[a-z0-9]+(?:-[a-z0-9]+)*$'
    when 'company_private' then p_scope_ref ~ '^cmp_[a-z0-9]+(?:-[a-z0-9]+)*$'
    when 'project_private' then p_scope_ref ~ '^prj_[a-z0-9]+(?:-[a-z0-9]+)*$'
    when 'owner_private' then p_scope_ref is null
    when 'quarantined' then p_scope_ref is null
    else false
  end;
$$;
revoke all on function command_center_private.c3_pif1_privacy_valid(text,text) from public, anon, authenticated;

alter table public.command_center_knowledge_claims
  add column if not exists intelligence_contract_version integer,
  add column if not exists ontology_id text,
  add column if not exists ontology_version integer,
  add column if not exists epistemic_label text,
  add column if not exists temporal_label text,
  add column if not exists causal_label text,
  add column if not exists applicability_scope text,
  add column if not exists applicability_ref text,
  add column if not exists privacy_class text,
  add column if not exists privacy_scope_ref text,
  add column if not exists evidence_ids text[];

alter table public.command_center_knowledge_claims
  drop constraint if exists command_center_knowledge_pif1_contract_complete;
alter table public.command_center_knowledge_claims
  add constraint command_center_knowledge_pif1_contract_complete check (
    (
      intelligence_contract_version is null and ontology_id is null and ontology_version is null
      and epistemic_label is null and temporal_label is null and causal_label is null
      and applicability_scope is null and applicability_ref is null
      and privacy_class is null and privacy_scope_ref is null and evidence_ids is null
    )
    or
    (
      intelligence_contract_version = 1
      and ontology_id ~ '^mod_[a-z0-9]+(?:-[a-z0-9]+)*$'
      and ontology_version >= 1
      and epistemic_label = kind
      and temporal_label in ('current','historical','stale','superseded')
      and causal_label in ('not_claimed','observed_association','causal_hypothesis','causal_supported')
      and command_center_private.c3_pif1_applicability_valid(applicability_scope,applicability_ref)
      and command_center_private.c3_pif1_privacy_valid(privacy_class,privacy_scope_ref)
      and command_center_private.c3_pif1_evidence_ids_valid(evidence_ids)
      and (applicability_scope <> 'global' or privacy_class = 'ecosystem_shared')
      and (state <> 'superseded' or temporal_label = 'superseded')
      and (temporal_label <> 'superseded' or state = 'superseded')
      and (temporal_label <> 'historical' or kind = 'historical')
      and (temporal_label <> 'stale' or stale_after is not null)
      and (privacy_class <> 'company_private' or applicability_scope <> 'company' or privacy_scope_ref = applicability_ref)
      and (privacy_class <> 'project_private' or applicability_scope <> 'project' or privacy_scope_ref = applicability_ref)
    )
  );

create index if not exists command_center_knowledge_intelligence_scope_idx
  on public.command_center_knowledge_claims(owner_id,applicability_scope,applicability_ref,recorded_at desc)
  where intelligence_contract_version is not null;

create or replace function public.command_center_append_shared_intelligence_claim(
  p_claim_id text,
  p_project_id text,
  p_subject_id text,
  p_version bigint,
  p_kind text,
  p_state text,
  p_truth_state text,
  p_value_jsonb jsonb,
  p_confidence numeric,
  p_source_refs text[],
  p_observed_at timestamptz,
  p_stale_after timestamptz,
  p_supersedes_claim_id text,
  p_ontology_id text,
  p_ontology_version integer,
  p_temporal_label text,
  p_causal_label text,
  p_applicability_scope text,
  p_applicability_ref text,
  p_privacy_class text,
  p_privacy_scope_ref text,
  p_evidence_ids text[]
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid := auth.uid();
  result jsonb;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_ontology_id),'')='' or p_ontology_id !~ '^mod_[a-z0-9]+(?:-[a-z0-9]+)*$' or coalesce(p_ontology_version,0)<1 then
    raise exception 'Shared intelligence requires a compatible canonical ontology identity/version';
  end if;
  if p_temporal_label not in ('current','historical','stale','superseded') then raise exception 'Invalid shared intelligence temporal label'; end if;
  if p_causal_label not in ('not_claimed','observed_association','causal_hypothesis','causal_supported') then raise exception 'Invalid shared intelligence causal label'; end if;
  if not command_center_private.c3_pif1_applicability_valid(p_applicability_scope,p_applicability_ref) then raise exception 'Invalid shared intelligence applicability scope'; end if;
  if not command_center_private.c3_pif1_privacy_valid(p_privacy_class,p_privacy_scope_ref) then raise exception 'Invalid shared intelligence privacy boundary'; end if;
  if not command_center_private.c3_pif1_evidence_ids_valid(p_evidence_ids) then raise exception 'Shared intelligence canonical evidence is required'; end if;
  if p_applicability_scope='global' and p_privacy_class<>'ecosystem_shared' then raise exception 'Private intelligence cannot be generalized globally'; end if;
  if p_privacy_class='company_private' and p_applicability_scope='company' and p_privacy_scope_ref<>p_applicability_ref then raise exception 'Company-private intelligence cannot cross company scope'; end if;
  if p_privacy_class='project_private' and p_applicability_scope='project' and p_privacy_scope_ref<>p_applicability_ref then raise exception 'Project-private intelligence cannot cross project scope'; end if;

  result := public.command_center_append_knowledge_claim(
    p_claim_id,p_project_id,p_subject_id,p_version,p_kind,p_state,p_truth_state,p_value_jsonb,p_confidence,
    p_source_refs,p_observed_at,p_stale_after,p_supersedes_claim_id
  );

  update public.command_center_knowledge_claims
  set intelligence_contract_version=1,
      ontology_id=p_ontology_id,
      ontology_version=p_ontology_version,
      epistemic_label=p_kind,
      temporal_label=p_temporal_label,
      causal_label=p_causal_label,
      applicability_scope=p_applicability_scope,
      applicability_ref=p_applicability_ref,
      privacy_class=p_privacy_class,
      privacy_scope_ref=p_privacy_scope_ref,
      evidence_ids=p_evidence_ids
  where owner_id=u and claim_id=p_claim_id;

  return result || jsonb_build_object(
    'intelligence_contract_version',1,
    'ontology_id',p_ontology_id,
    'ontology_version',p_ontology_version,
    'applicability_scope',p_applicability_scope,
    'applicability_ref',p_applicability_ref,
    'privacy_class',p_privacy_class
  );
end;
$$;

revoke all on function public.command_center_append_shared_intelligence_claim(text,text,text,bigint,text,text,text,jsonb,numeric,text[],timestamptz,timestamptz,text,text,integer,text,text,text,text,text,text,text[]) from public, anon;
grant execute on function public.command_center_append_shared_intelligence_claim(text,text,text,bigint,text,text,text,jsonb,numeric,text[],timestamptz,timestamptz,text,text,integer,text,text,text,text,text,text,text[]) to authenticated;
