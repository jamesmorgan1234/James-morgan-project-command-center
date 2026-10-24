-- Category 6 / P6.5 — durable Brain planner, research/scenario and decision-support evidence.
-- Branch-only migration. Plans propose work; they never grant execution authority.

create table if not exists public.command_center_brain_plans (
  owner_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid primary key default gen_random_uuid(),
  project_id text,
  decision_id uuid references public.command_center_brain_decisions(decision_id) on delete set null,
  plan_type text not null check (plan_type in ('research','workflow','roadmap','scenario','decision_support')),
  version bigint not null default 1 check (version >= 1),
  objective text not null check (length(btrim(objective)) between 1 and 2000),
  state text not null default 'proposed' check (state in ('draft','proposed','accepted','rejected','superseded')),
  requires_owner_decision boolean not null default false,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  source_refs text[] not null check (cardinality(source_refs) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (updated_at >= created_at)
);
create index if not exists command_center_brain_plans_project_idx
  on public.command_center_brain_plans(owner_id,project_id,updated_at desc,plan_id);

create table if not exists public.command_center_brain_plan_claims (
  claim_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.command_center_brain_plans(plan_id) on delete cascade,
  claim_key text not null,
  claim_class text not null check (claim_class in ('verified_fact','owner_decision','assumption','estimate','recommendation')),
  statement text not null check (length(btrim(statement)) between 1 and 4000),
  evidence_refs text[] not null default '{}'::text[],
  confidence numeric(6,5),
  source_ref text,
  created_at timestamptz not null default now(),
  unique(owner_id,plan_id,claim_key),
  check ((claim_class in ('verified_fact','owner_decision') and cardinality(evidence_refs)>0) or claim_class not in ('verified_fact','owner_decision')),
  check ((claim_class in ('assumption','estimate','recommendation') and confidence is not null) or claim_class not in ('assumption','estimate','recommendation')),
  check (confidence is null or confidence between 0 and 1)
);

create table if not exists public.command_center_brain_plan_actions (
  action_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.command_center_brain_plans(plan_id) on delete cascade,
  action_key text not null,
  description text not null check (length(btrim(description)) between 1 and 4000),
  action_class text not null check (action_class in ('analysis','research','proposal','agent_request','protected_action_request')),
  dependency_keys text[] not null default '{}'::text[],
  evidence_refs text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  unique(owner_id,plan_id,action_key)
);

-- Planner evidence is owner-readable and mutation is narrow-RPC only.
do $$
declare t text;
begin
  foreach t in array array['command_center_brain_plans','command_center_brain_plan_claims','command_center_brain_plan_actions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c6_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c6_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_brain_record_plan(
  p_project_id text,
  p_decision_id uuid,
  p_plan_type text,
  p_objective text,
  p_requires_owner_decision boolean,
  p_claims jsonb,
  p_actions jsonb,
  p_source_refs text[]
)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  v_plan uuid;
  v_project text:=nullif(btrim(coalesce(p_project_id,'')),'');
  c jsonb;
  a jsonb;
  v_hash text;
  v_class text;
  v_conf numeric;
  v_evidence text[];
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_plan_type not in ('research','workflow','roadmap','scenario','decision_support') or coalesce(btrim(p_objective),'')='' then raise exception 'Invalid Brain plan'; end if;
  if v_project is not null and not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=v_project) then raise exception 'Plan project not found'; end if;
  if p_decision_id is not null and not exists(select 1 from public.command_center_brain_decisions where owner_id=u and decision_id=p_decision_id and coalesce(project_id,'')=coalesce(v_project,'')) then raise exception 'Plan decision scope mismatch'; end if;
  if jsonb_typeof(p_claims)<>'array' or jsonb_typeof(p_actions)<>'array' then raise exception 'Plan claims/actions must be arrays'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_source_refs,'Brain plan sources');
  if cardinality(coalesce(p_source_refs,'{}'::text[]))=0 then raise exception 'Plan requires sources'; end if;
  v_hash:=encode(extensions.digest((p_plan_type||'|'||p_objective||'|'||p_claims::text||'|'||p_actions::text),'sha256'),'hex');

  insert into public.command_center_brain_plans(owner_id,project_id,decision_id,plan_type,objective,requires_owner_decision,content_hash,source_refs)
  values(u,v_project,p_decision_id,p_plan_type,btrim(p_objective),p_requires_owner_decision,v_hash,p_source_refs)
  returning plan_id into v_plan;

  for c in select value from jsonb_array_elements(p_claims) loop
    v_class:=btrim(coalesce(c->>'class',''));
    v_evidence:=array(select jsonb_array_elements_text(coalesce(c->'evidenceRefs','[]'::jsonb)));
    begin v_conf:=(c->>'confidence')::numeric; exception when others then v_conf:=null; end;
    if coalesce(btrim(c->>'id'),'')='' or coalesce(btrim(c->>'statement'),'')='' then raise exception 'Planning claim identity/statement required'; end if;
    if v_class not in ('verified_fact','owner_decision','assumption','estimate','recommendation') then raise exception 'Invalid planning claim class'; end if;
    perform command_center_private.c3_assert_unique_text_array(v_evidence,'Planning claim evidence');
    if v_class in ('verified_fact','owner_decision') and cardinality(v_evidence)=0 then raise exception 'Verified/owner planning claim requires evidence'; end if;
    if v_class in ('assumption','estimate','recommendation') and (v_conf is null or v_conf<0 or v_conf>1) then raise exception 'Uncertain planning claim requires confidence'; end if;
    insert into public.command_center_brain_plan_claims(owner_id,plan_id,claim_key,claim_class,statement,evidence_refs,confidence,source_ref)
    values(u,v_plan,btrim(c->>'id'),v_class,btrim(c->>'statement'),v_evidence,v_conf,nullif(btrim(coalesce(c->>'sourceRef','')),''));
  end loop;

  for a in select value from jsonb_array_elements(p_actions) loop
    if coalesce(btrim(a->>'id'),'')='' or coalesce(btrim(a->>'description'),'')='' then raise exception 'Plan action identity/description required'; end if;
    if coalesce(a->>'actionClass','') not in ('analysis','research','proposal','agent_request','protected_action_request') then raise exception 'Invalid plan action class'; end if;
    insert into public.command_center_brain_plan_actions(owner_id,plan_id,action_key,description,action_class,dependency_keys,evidence_refs)
    values(
      u,v_plan,btrim(a->>'id'),btrim(a->>'description'),a->>'actionClass',
      array(select jsonb_array_elements_text(coalesce(a->'dependencyKeys','[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(a->'evidenceRefs','[]'::jsonb)))
    );
  end loop;

  return v_plan;
end $$;

revoke all on function public.command_center_brain_record_plan(text,uuid,text,text,boolean,jsonb,jsonb,text[]) from public,anon;
grant execute on function public.command_center_brain_record_plan(text,uuid,text,text,boolean,jsonb,jsonb,text[]) to authenticated;
