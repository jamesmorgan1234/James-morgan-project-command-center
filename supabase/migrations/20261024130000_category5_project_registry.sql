-- Category 5 / P5.1 — durable project registry and generic project contract.
-- Branch-only migration. No production state is changed by committing this file.
-- Requires Category 3 canonical persistence and Category 2 authorization helpers.

create table if not exists public.command_center_project_types (
  owner_id uuid not null references auth.users(id) on delete cascade,
  type_key text not null,
  version bigint not null default 1 check (version >= 1),
  label text not null,
  domain_playbook_key text not null,
  default_capabilities text[] not null default '{}'::text[],
  required_detail_sections text[] not null default '{}'::text[],
  active boolean not null default true,
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,type_key),
  check (type_key ~ '^project-type:[a-z0-9][a-z0-9._:-]{0,119}$'),
  check (length(btrim(label)) between 1 and 200),
  check (length(btrim(domain_playbook_key)) between 1 and 200),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (updated_at >= created_at)
);

create table if not exists public.command_center_project_profiles (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  canonical_entity_id text not null,
  type_key text not null,
  company_id text,
  name text not null,
  mission text not null,
  lifecycle text not null check (lifecycle in ('candidate','active','paused','blocked','completed','archived','superseded')),
  status text not null,
  verification text not null check (verification in ('verified','implemented_unverified','partial','blocked','unknown')),
  priority text not null check (priority in ('critical','high','normal','low')),
  version bigint not null default 1 check (version >= 1),
  protected boolean not null default false,
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id),
  unique(owner_id,canonical_entity_id),
  foreign key(owner_id,canonical_entity_id) references public.command_center_canonical_entities(owner_id,entity_id) on delete restrict,
  foreign key(owner_id,type_key) references public.command_center_project_types(owner_id,type_key) on delete restrict,
  check (length(btrim(project_id)) between 1 and 240),
  check (length(btrim(name)) between 1 and 500),
  check (length(btrim(mission)) between 1 and 4000),
  check (length(btrim(status)) between 1 and 120),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (company_id is null or length(btrim(company_id)) between 1 and 240),
  check (updated_at >= created_at)
);

create table if not exists public.command_center_project_capabilities (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  capability_key text not null,
  enabled boolean not null default true,
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id,capability_key),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  check (capability_key ~ '^capability:[a-z0-9][a-z0-9._:-]{0,159}$'),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (updated_at >= created_at)
);

create table if not exists public.command_center_project_authorizations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  authorization_key text not null,
  state text not null check (state in ('enabled','disabled','requires_owner')),
  owner_decision_ref text,
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id,authorization_key),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  check (authorization_key ~ '^project-auth:[a-z0-9][a-z0-9._:-]{0,159}$'),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (state <> 'enabled' or owner_decision_ref is not null),
  check (owner_decision_ref is null or length(btrim(owner_decision_ref)) between 1 and 1000),
  check (updated_at >= created_at)
);

create index if not exists command_center_project_profiles_owner_lifecycle_idx
  on public.command_center_project_profiles(owner_id,lifecycle,priority,updated_at desc);
create index if not exists command_center_project_profiles_company_idx
  on public.command_center_project_profiles(owner_id,company_id) where company_id is not null;
create index if not exists command_center_project_capabilities_enabled_idx
  on public.command_center_project_capabilities(owner_id,project_id,capability_key) where enabled;

-- Owner read only from browser roles. Mutation is narrow RPC only.
do $$
declare t text;
begin
  foreach t in array array[
    'command_center_project_types',
    'command_center_project_profiles',
    'command_center_project_capabilities',
    'command_center_project_authorizations'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public, anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c5_owner_select_'||t,t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',
      'c5_owner_select_'||t,t
    );
  end loop;
end $$;

create or replace function command_center_private.c5_assert_unique_text_array(p_values text[],p_label text)
returns void language plpgsql immutable set search_path='' as $$
begin
  if exists(select 1 from unnest(coalesce(p_values,'{}'::text[])) v where coalesce(btrim(v),'')='') then
    raise exception '% entries cannot be blank',p_label;
  end if;
  if exists(select 1 from unnest(coalesce(p_values,'{}'::text[])) v group by v having count(*)>1) then
    raise exception '% entries must be unique',p_label;
  end if;
end $$;
revoke all on function command_center_private.c5_assert_unique_text_array(text[],text) from public,anon,authenticated;

create or replace function public.command_center_project_register_type(
  p_type_key text,
  p_label text,
  p_domain_playbook_key text,
  p_capabilities text[],
  p_required_detail_sections text[],
  p_source_ref text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  v_key text:=btrim(coalesce(p_type_key,''));
  v_next bigint;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if v_key !~ '^project-type:[a-z0-9][a-z0-9._:-]{0,119}$' then raise exception 'Invalid project type key'; end if;
  if coalesce(btrim(p_label),'')='' or coalesce(btrim(p_domain_playbook_key),'')='' or coalesce(btrim(p_source_ref),'')='' then raise exception 'Project type label, playbook and source are required'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_capabilities,'Project type capabilities');
  perform command_center_private.c5_assert_unique_text_array(p_required_detail_sections,'Project detail sections');

  select version+1 into v_next
    from public.command_center_project_types
    where owner_id=u and type_key=v_key
    for update;

  if v_next is null then
    insert into public.command_center_project_types(owner_id,type_key,version,label,domain_playbook_key,default_capabilities,required_detail_sections,source_ref)
    values(u,v_key,1,btrim(p_label),btrim(p_domain_playbook_key),coalesce(p_capabilities,'{}'::text[]),coalesce(p_required_detail_sections,'{}'::text[]),btrim(p_source_ref));
    v_next:=1;
  else
    update public.command_center_project_types
      set version=v_next,label=btrim(p_label),domain_playbook_key=btrim(p_domain_playbook_key),
          default_capabilities=coalesce(p_capabilities,'{}'::text[]),required_detail_sections=coalesce(p_required_detail_sections,'{}'::text[]),
          source_ref=btrim(p_source_ref),active=true,updated_at=now()
      where owner_id=u and type_key=v_key;
  end if;
  return jsonb_build_object('type_key',v_key,'version',v_next);
end $$;

create or replace function public.command_center_project_create(
  p_project_id text,
  p_type_key text,
  p_company_id text,
  p_name text,
  p_mission text,
  p_lifecycle text,
  p_status text,
  p_verification text,
  p_priority text,
  p_source_ref text,
  p_owner_decision_ref text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  v_project_id text:=btrim(coalesce(p_project_id,''));
  v_type_key text:=btrim(coalesce(p_type_key,''));
  v_entity_id text;
  v_payload jsonb;
  v_hash text;
  v_type public.command_center_project_types%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_owner_decision_ref),'')='' then raise exception 'Owner project-creation decision is required'; end if;
  if v_project_id='' or coalesce(btrim(p_name),'')='' or coalesce(btrim(p_mission),'')='' or coalesce(btrim(p_source_ref),'')='' then raise exception 'Project identity, name, mission and source are required'; end if;
  if p_lifecycle not in ('candidate','active','paused','blocked','completed','archived','superseded') then raise exception 'Invalid project lifecycle'; end if;
  if p_verification not in ('verified','implemented_unverified','partial','blocked','unknown') then raise exception 'Invalid project verification'; end if;
  if p_priority not in ('critical','high','normal','low') then raise exception 'Invalid project priority'; end if;
  if coalesce(btrim(p_status),'')='' then raise exception 'Project status is required'; end if;

  select * into v_type from public.command_center_project_types where owner_id=u and type_key=v_type_key and active for share;
  if not found then raise exception 'Unknown or inactive project type'; end if;

  v_entity_id:='project:'||v_project_id;
  v_payload:=jsonb_build_object(
    'project_id',v_project_id,
    'type_key',v_type_key,
    'company_id',nullif(btrim(coalesce(p_company_id,'')),''),
    'name',btrim(p_name),
    'mission',btrim(p_mission),
    'lifecycle',p_lifecycle,
    'status',btrim(p_status),
    'verification',p_verification,
    'priority',p_priority,
    'owner_decision_ref',btrim(p_owner_decision_ref)
  );
  v_hash:=command_center_private.c3_hash_json(v_payload);

  insert into public.command_center_canonical_entities(owner_id,entity_id,project_id,entity_type,version,schema_version,payload,content_hash)
  values(u,v_entity_id,v_project_id,'project',1,1,v_payload,v_hash);
  insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref)
  values(u,v_entity_id,1,v_project_id,'project',1,v_payload,v_hash,'create',btrim(p_source_ref));

  insert into public.command_center_project_profiles(owner_id,project_id,canonical_entity_id,type_key,company_id,name,mission,lifecycle,status,verification,priority,version,source_ref)
  values(u,v_project_id,v_entity_id,v_type_key,nullif(btrim(coalesce(p_company_id,'')),''),btrim(p_name),btrim(p_mission),p_lifecycle,btrim(p_status),p_verification,p_priority,1,btrim(p_source_ref));

  insert into public.command_center_project_capabilities(owner_id,project_id,capability_key,enabled,source_ref)
  select u,v_project_id,
         case when capability like 'capability:%' then capability else 'capability:'||capability end,
         true,btrim(p_source_ref)
  from unnest(v_type.default_capabilities) capability;

  insert into public.command_center_project_authorizations(owner_id,project_id,authorization_key,state,owner_decision_ref,source_ref)
  values
    (u,v_project_id,'project-auth:agent-access','requires_owner',null,btrim(p_source_ref)),
    (u,v_project_id,'project-auth:portfolio-auto','requires_owner',null,btrim(p_source_ref));

  return jsonb_build_object('project_id',v_project_id,'canonical_entity_id',v_entity_id,'version',1,'type_key',v_type_key);
end $$;

revoke all on function public.command_center_project_register_type(text,text,text,text[],text[],text) from public,anon;
revoke all on function public.command_center_project_create(text,text,text,text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.command_center_project_register_type(text,text,text,text[],text[],text) to authenticated;
grant execute on function public.command_center_project_create(text,text,text,text,text,text,text,text,text,text,text) to authenticated;
