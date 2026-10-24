-- Category 6 / P6.9 — exact referent resolution evidence and immutable execution snapshots.
-- Branch-only migration. Snapshots freeze intent; they do not execute protected side effects.

create table if not exists public.command_center_brain_referent_resolutions (
  resolution_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  reference_hash text not null check (reference_hash ~ '^[a-f0-9]{64}$'),
  result text not null check (result in ('resolved','ambiguous','missing')),
  proposal_ref text,
  proposal_version bigint,
  candidate_refs text[] not null default '{}'::text[],
  evidence_refs text[] not null,
  reason text not null check (length(btrim(reason)) between 1 and 500),
  resolved_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check ((result='resolved' and proposal_ref is not null and proposal_version is not null) or (result<>'resolved' and proposal_ref is null and proposal_version is null)),
  check (resolved_at<=recorded_at + interval '5 minutes')
);

create table if not exists public.command_center_brain_execution_snapshots (
  owner_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id uuid primary key,
  project_id text not null,
  plan_id uuid references public.command_center_brain_plans(plan_id) on delete restrict,
  proposal_ref text not null,
  proposal_version bigint not null check (proposal_version>=1),
  spec_version bigint not null check (spec_version>=1),
  authorization_ref text not null check (length(btrim(authorization_ref)) between 1 and 1000),
  decision_refs text[] not null default '{}'::text[],
  requirement_refs text[] not null default '{}'::text[],
  action_refs text[] not null,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  evidence_refs text[] not null,
  frozen_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (cardinality(action_refs)>0),
  check (cardinality(evidence_refs)>0),
  check (frozen_at<=created_at + interval '5 minutes')
);
create index if not exists command_center_brain_execution_snapshots_project_idx
  on public.command_center_brain_execution_snapshots(owner_id,project_id,frozen_at desc,snapshot_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_brain_referent_resolutions','command_center_brain_execution_snapshots'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c6_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c6_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_brain_record_referent_resolution(
  p_project_id text,p_reference_hash text,p_result text,p_proposal_ref text,p_proposal_version bigint,p_candidate_refs text[],p_evidence_refs text[],p_reason text,p_resolved_at timestamptz
) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Referent project not found'; end if;
  if coalesce(p_reference_hash,'') !~ '^[a-f0-9]{64}$' or p_result not in ('resolved','ambiguous','missing') then raise exception 'Invalid referent resolution envelope'; end if;
  if (p_result='resolved' and (coalesce(btrim(p_proposal_ref),'')='' or coalesce(p_proposal_version,0)<1)) or (p_result<>'resolved' and (p_proposal_ref is not null or p_proposal_version is not null)) then raise exception 'Referent result/proposal mismatch'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_candidate_refs,'Referent candidates');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Referent evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 or coalesce(btrim(p_reason),'')='' then raise exception 'Referent resolution requires reason/evidence'; end if;
  insert into public.command_center_brain_referent_resolutions(owner_id,project_id,reference_hash,result,proposal_ref,proposal_version,candidate_refs,evidence_refs,reason,resolved_at)
  values(u,btrim(p_project_id),p_reference_hash,p_result,case when p_result='resolved' then btrim(p_proposal_ref) else null end,p_proposal_version,coalesce(p_candidate_refs,'{}'::text[]),p_evidence_refs,btrim(p_reason),p_resolved_at)
  returning resolution_id into v_id;
  return v_id;
end $$;

create or replace function public.command_center_brain_freeze_execution_snapshot(
  p_snapshot_id uuid,p_project_id text,p_plan_id uuid,p_proposal_ref text,p_proposal_version bigint,p_spec_version bigint,p_authorization_ref text,p_decision_refs text[],p_requirement_refs text[],p_action_refs text[],p_evidence_refs text[],p_frozen_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_hash text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_snapshot_id is null or coalesce(btrim(p_project_id),'')='' or coalesce(btrim(p_proposal_ref),'')='' or coalesce(p_proposal_version,0)<1 or coalesce(p_spec_version,0)<1 or coalesce(btrim(p_authorization_ref),'')='' then raise exception 'Execution snapshot identity/version/authorization required'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Execution snapshot project not found'; end if;
  if p_plan_id is not null and not exists(select 1 from public.command_center_brain_plans where owner_id=u and plan_id=p_plan_id and coalesce(project_id,'')=btrim(p_project_id)) then raise exception 'Execution snapshot plan scope mismatch'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_decision_refs,'Execution snapshot decisions');
  perform command_center_private.c3_assert_unique_text_array(p_requirement_refs,'Execution snapshot requirements');
  perform command_center_private.c3_assert_unique_text_array(p_action_refs,'Execution snapshot actions');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Execution snapshot evidence');
  if cardinality(coalesce(p_action_refs,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Execution snapshot requires actions/evidence'; end if;
  v_hash:=encode(extensions.digest((btrim(p_project_id)||'|'||btrim(p_proposal_ref)||'|'||p_proposal_version::text||'|'||p_spec_version::text||'|'||array_to_string(p_decision_refs,',')||'|'||array_to_string(p_requirement_refs,',')||'|'||array_to_string(p_action_refs,',')),'sha256'),'hex');
  insert into public.command_center_brain_execution_snapshots(owner_id,snapshot_id,project_id,plan_id,proposal_ref,proposal_version,spec_version,authorization_ref,decision_refs,requirement_refs,action_refs,content_hash,evidence_refs,frozen_at)
  values(u,p_snapshot_id,btrim(p_project_id),p_plan_id,btrim(p_proposal_ref),p_proposal_version,p_spec_version,btrim(p_authorization_ref),coalesce(p_decision_refs,'{}'::text[]),coalesce(p_requirement_refs,'{}'::text[]),p_action_refs,v_hash,p_evidence_refs,p_frozen_at);
  return jsonb_build_object('snapshot_id',p_snapshot_id,'proposal_ref',btrim(p_proposal_ref),'proposal_version',p_proposal_version,'spec_version',p_spec_version,'content_hash',v_hash,'immutable',true,'executed',false);
end $$;

revoke all on function public.command_center_brain_record_referent_resolution(text,text,text,text,bigint,text[],text[],text,timestamptz) from public,anon;
revoke all on function public.command_center_brain_freeze_execution_snapshot(uuid,text,uuid,text,bigint,bigint,text,text[],text[],text[],text[],timestamptz) from public,anon;
grant execute on function public.command_center_brain_record_referent_resolution(text,text,text,text,bigint,text[],text[],text,timestamptz) to authenticated;
grant execute on function public.command_center_brain_freeze_execution_snapshot(uuid,text,uuid,text,bigint,bigint,text,text[],text[],text[],text[],timestamptz) to authenticated;
