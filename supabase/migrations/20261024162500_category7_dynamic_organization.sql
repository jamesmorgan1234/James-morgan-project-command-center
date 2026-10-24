-- Category 7 / P7.13 — durable dynamic lead registry and temporary mission organization.
-- Branch-only migration. Team shape is registry-driven, workload/risk/authority bounded, and fully auditable.

create table if not exists public.command_center_agency_leads (
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_key text not null,
  version bigint not null default 1 check (version>=1),
  capabilities text[] not null,
  project_type_keys text[] not null default '{}'::text[],
  authority_scopes text[] not null,
  max_concurrent_assignments integer not null check (max_concurrent_assignments between 1 and 1000),
  max_risk text not null check (max_risk in ('low','medium','high','critical')),
  health text not null check (health in ('available','degraded','unavailable')),
  evidence_refs text[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  retired_at timestamptz,
  primary key(owner_id,lead_key),
  check (lead_key ~ '^lead:[a-z0-9][a-z0-9._:-]{0,160}$'),
  check (cardinality(capabilities)>0),
  check (cardinality(authority_scopes)>0),
  check (cardinality(evidence_refs)>0),
  check (updated_at>=created_at)
);

create table if not exists public.command_center_agency_organizations (
  organization_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  mission_ref text not null check (length(btrim(mission_ref)) between 1 and 1000),
  required_capability text not null check (length(btrim(required_capability)) between 1 and 240),
  required_authority_scopes text[] not null,
  risk text not null check (risk in ('low','medium','high','critical')),
  lead_key text not null,
  lead_version bigint not null,
  workload_at_assignment integer not null check (workload_at_assignment>=0),
  state text not null default 'active' check (state in ('active','rebalanced','completed','dissolved')),
  evidence_refs text[] not null,
  formed_at timestamptz not null,
  ended_at timestamptz,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  foreign key(owner_id,lead_key) references public.command_center_agency_leads(owner_id,lead_key) on delete restrict,
  check (cardinality(required_authority_scopes)>0),
  check (cardinality(evidence_refs)>0),
  check ((state='active' and ended_at is null) or (state<>'active' and ended_at is not null)),
  check (formed_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_org_active_idx
  on public.command_center_agency_organizations(owner_id,project_id,state,lead_key,formed_at);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_leads','command_center_agency_organizations'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_register_lead(
  p_lead_key text,p_capabilities text[],p_project_type_keys text[],p_authority_scopes text[],p_max_concurrent_assignments integer,p_max_risk text,p_health text,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_lead_key),'') !~ '^lead:[a-z0-9][a-z0-9._:-]{0,160}$' then raise exception 'Invalid lead key'; end if;
  if p_max_concurrent_assignments<1 or p_max_concurrent_assignments>1000 or p_max_risk not in ('low','medium','high','critical') or p_health not in ('available','degraded','unavailable') then raise exception 'Invalid lead operating envelope'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_capabilities,'Lead capabilities');
  perform command_center_private.c3_assert_unique_text_array(p_project_type_keys,'Lead project types');
  perform command_center_private.c3_assert_unique_text_array(p_authority_scopes,'Lead authority');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Lead evidence');
  if cardinality(coalesce(p_capabilities,'{}'::text[]))=0 or cardinality(coalesce(p_authority_scopes,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Lead requires capability/authority/evidence'; end if;
  insert into public.command_center_agency_leads(owner_id,lead_key,version,capabilities,project_type_keys,authority_scopes,max_concurrent_assignments,max_risk,health,evidence_refs)
  values(u,btrim(p_lead_key),1,p_capabilities,coalesce(p_project_type_keys,'{}'::text[]),p_authority_scopes,p_max_concurrent_assignments,p_max_risk,p_health,p_evidence_refs);
  return jsonb_build_object('lead_key',btrim(p_lead_key),'version',1);
end $$;

create or replace function public.command_center_agency_form_organization(
  p_project_id text,p_run_id text,p_mission_ref text,p_required_capability text,p_required_authority_scopes text[],p_risk text,p_evidence_refs text[],p_formed_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  pp public.command_center_project_profiles%rowtype;
  l record;
  v_id uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into pp from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id);
  if not found or not exists(select 1 from public.command_center_agency_runs where owner_id=u and project_id=pp.project_id and run_id=btrim(p_run_id)) then raise exception 'Organization project/run not found'; end if;
  if coalesce(btrim(p_mission_ref),'')='' or coalesce(btrim(p_required_capability),'')='' or p_risk not in ('low','medium','high','critical') then raise exception 'Organization mission/capability/risk required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_required_authority_scopes,'Organization authority');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Organization evidence');
  if cardinality(coalesce(p_required_authority_scopes,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Organization requires authority/evidence'; end if;

  select lead.lead_key,lead.version,
         (select count(*)::integer from public.command_center_agency_organizations o where o.owner_id=u and o.lead_key=lead.lead_key and o.state='active') as workload
  into l
  from public.command_center_agency_leads lead
  where lead.owner_id=u and lead.retired_at is null and lead.health<>'unavailable'
    and btrim(p_required_capability)=any(lead.capabilities)
    and (cardinality(lead.project_type_keys)=0 or pp.type_key=any(lead.project_type_keys))
    and p_required_authority_scopes <@ lead.authority_scopes
    and (case p_risk when 'low' then 0 when 'medium' then 1 when 'high' then 2 else 3 end) <= (case lead.max_risk when 'low' then 0 when 'medium' then 1 when 'high' then 2 else 3 end)
    and (select count(*) from public.command_center_agency_organizations o where o.owner_id=u and o.lead_key=lead.lead_key and o.state='active') < lead.max_concurrent_assignments
  order by workload asc,lead.lead_key asc
  limit 1;
  if l.lead_key is null then raise exception 'No eligible lead for mission'; end if;

  insert into public.command_center_agency_organizations(owner_id,project_id,run_id,mission_ref,required_capability,required_authority_scopes,risk,lead_key,lead_version,workload_at_assignment,evidence_refs,formed_at)
  values(u,pp.project_id,btrim(p_run_id),btrim(p_mission_ref),btrim(p_required_capability),p_required_authority_scopes,p_risk,l.lead_key,l.version,l.workload,p_evidence_refs,p_formed_at)
  returning organization_id into v_id;
  return jsonb_build_object('organization_id',v_id,'lead_key',l.lead_key,'lead_version',l.version,'workload_at_assignment',l.workload,'auditable',true);
end $$;

revoke all on function public.command_center_agency_register_lead(text,text[],text[],text[],integer,text,text,text[]) from public,anon;
revoke all on function public.command_center_agency_form_organization(text,text,text,text,text[],text,text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_register_lead(text,text[],text[],text[],integer,text,text,text[]) to authenticated;
grant execute on function public.command_center_agency_form_organization(text,text,text,text,text[],text,text[],timestamptz) to authenticated;
