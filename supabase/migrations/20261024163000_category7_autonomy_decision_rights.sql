-- Category 7 / P7.14 — durable autonomy levels and formal decision rights.
-- Branch-only migration. Autonomy level never grants spending, protected-action authority, or scope expansion by itself.

create table if not exists public.command_center_agency_autonomy_envelopes (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  version bigint not null default 1 check (version>=1),
  autonomy_level text not null check (autonomy_level in ('observe','propose','prepare','execute','continuous')),
  authority_scopes text[] not null,
  protected_actions_granted_by_level boolean not null default false check (protected_actions_granted_by_level=false),
  spending_granted_by_level boolean not null default false check (spending_granted_by_level=false),
  evidence_refs text[] not null,
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id,run_id),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  check (cardinality(authority_scopes)>0),
  check (cardinality(evidence_refs)>0)
);

create table if not exists public.command_center_agency_decision_rights (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  decision_key text not null,
  decision_class text not null check (decision_class in ('self_decidable','defaultable','recommend','protected','prohibited')),
  required_scopes text[] not null default '{}'::text[],
  risk text not null check (risk in ('low','medium','high','critical')),
  evidence_refs text[] not null,
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id,run_id,decision_key),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  check (length(btrim(decision_key)) between 1 and 240),
  check (cardinality(evidence_refs)>0)
);

create table if not exists public.command_center_agency_autonomy_decisions (
  decision_event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  decision_key text not null,
  autonomy_level text not null,
  decision_class text not null,
  result text not null check (result in ('allowed','recommend_only','requires_protected_gate','prohibited','scope_blocked')),
  reason text not null,
  evidence_refs text[] not null,
  decided_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check (decided_at<=recorded_at + interval '5 minutes')
);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_autonomy_envelopes','command_center_agency_decision_rights','command_center_agency_autonomy_decisions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_set_autonomy(
  p_project_id text,p_run_id text,p_expected_version bigint,p_autonomy_level text,p_authority_scopes text[],p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); current public.command_center_agency_autonomy_envelopes%rowtype; v_next bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id)) then raise exception 'Autonomy run not found'; end if;
  if p_autonomy_level not in ('observe','propose','prepare','execute','continuous') then raise exception 'Invalid autonomy level'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_authority_scopes,'Autonomy scopes');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Autonomy evidence');
  if cardinality(coalesce(p_authority_scopes,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Autonomy requires scope/evidence'; end if;
  select * into current from public.command_center_agency_autonomy_envelopes where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) for update;
  if not found then
    if p_expected_version<>0 then raise exception 'New autonomy envelope expected version must be 0'; end if;
    v_next:=1;
    insert into public.command_center_agency_autonomy_envelopes(owner_id,project_id,run_id,version,autonomy_level,authority_scopes,evidence_refs)
    values(u,btrim(p_project_id),btrim(p_run_id),v_next,p_autonomy_level,p_authority_scopes,p_evidence_refs);
  else
    if current.version<>p_expected_version then raise exception 'Autonomy version conflict'; end if;
    if not p_authority_scopes <@ current.authority_scopes then raise exception 'Autonomy change cannot expand authority scope'; end if;
    v_next:=current.version+1;
    update public.command_center_agency_autonomy_envelopes set version=v_next,autonomy_level=p_autonomy_level,authority_scopes=p_authority_scopes,evidence_refs=p_evidence_refs,updated_at=now() where owner_id=u and project_id=current.project_id and run_id=current.run_id;
  end if;
  return jsonb_build_object('project_id',btrim(p_project_id),'run_id',btrim(p_run_id),'version',v_next,'autonomy_level',p_autonomy_level,'protected_actions_granted_by_level',false,'spending_granted_by_level',false);
end $$;

create or replace function public.command_center_agency_evaluate_decision_right(
  p_project_id text,p_run_id text,p_decision_key text,p_requested_scopes text[],p_evidence_refs text[],p_decided_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  e public.command_center_agency_autonomy_envelopes%rowtype;
  d public.command_center_agency_decision_rights%rowtype;
  v_result text;
  v_reason text;
  level_rank integer;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into e from public.command_center_agency_autonomy_envelopes where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id);
  select * into d from public.command_center_agency_decision_rights where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) and decision_key=btrim(p_decision_key);
  if e.run_id is null or d.decision_key is null then raise exception 'Autonomy envelope/decision right not found'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_requested_scopes,'Decision requested scopes');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Decision-right evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Decision-right evaluation requires evidence'; end if;
  if not coalesce(p_requested_scopes,'{}'::text[]) <@ e.authority_scopes or not d.required_scopes <@ e.authority_scopes then v_result:='scope_blocked'; v_reason:='authority_scope_exceeded';
  elsif d.decision_class='prohibited' then v_result:='prohibited'; v_reason:='decision_prohibited';
  elsif d.decision_class='protected' then v_result:='requires_protected_gate'; v_reason:='protected_action_requires_separate_authorization';
  elsif d.decision_class='recommend' then v_result:='recommend_only'; v_reason:='recommendation_only';
  else
    level_rank:=case e.autonomy_level when 'observe' then 0 when 'propose' then 1 when 'prepare' then 2 when 'execute' then 3 else 4 end;
    if d.decision_class='defaultable' and level_rank<2 then v_result:='recommend_only'; v_reason:='autonomy_below_prepare';
    elsif d.decision_class='self_decidable' and level_rank<3 then v_result:='recommend_only'; v_reason:='autonomy_below_execute';
    else v_result:='allowed'; v_reason:='within_autonomy_and_scope'; end if;
  end if;
  insert into public.command_center_agency_autonomy_decisions(owner_id,project_id,run_id,decision_key,autonomy_level,decision_class,result,reason,evidence_refs,decided_at)
  values(u,e.project_id,e.run_id,d.decision_key,e.autonomy_level,d.decision_class,v_result,v_reason,p_evidence_refs,p_decided_at);
  return jsonb_build_object('result',v_result,'reason',v_reason,'autonomy_level',e.autonomy_level,'decision_class',d.decision_class,'protected_authorization_inherited',false);
end $$;

revoke all on function public.command_center_agency_set_autonomy(text,text,bigint,text,text[],text[]) from public,anon;
revoke all on function public.command_center_agency_evaluate_decision_right(text,text,text,text[],text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_set_autonomy(text,text,bigint,text,text[],text[]) to authenticated;
grant execute on function public.command_center_agency_evaluate_decision_right(text,text,text,text[],text[],timestamptz) to authenticated;
