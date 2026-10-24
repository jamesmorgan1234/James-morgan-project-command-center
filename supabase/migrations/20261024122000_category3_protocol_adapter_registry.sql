-- Category 3 / P3.11 — vendor-neutral protocol adapter registry behind capability/security routing.
-- Branch-only migration.

create table if not exists public.command_center_protocol_adapters (
  owner_id uuid not null references auth.users(id) on delete cascade,
  adapter_key text not null,
  protocol text not null check (protocol in ('mcp','a2a','custom')),
  version bigint not null check (version >= 1),
  enabled boolean not null default false,
  capabilities text[] not null default '{}'::text[],
  security_route_key text not null,
  provider_key text,
  health text not null default 'unconfigured' check (health in ('unconfigured','available','degraded','unavailable','retired')),
  configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration)='object'),
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,adapter_key),
  check (adapter_key ~ '^protocol:[a-z0-9][a-z0-9._-]*$'),
  check (security_route_key ~ '^security\.[a-z0-9][a-z0-9._-]*$'),
  check (cardinality(capabilities)>0),
  check (command_center_private.c3_text_array_unique_nonblank(capabilities)),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (configuration::text !~* '(^|[^a-z])(secret|token|password|private[_ -]?key|authorization)([^a-z]|$)'),
  check (configuration::text !~* 'Bearer[[:space:]]+[A-Za-z0-9._~+/=-]{12,}')
);

create table if not exists public.command_center_protocol_adapter_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  adapter_key text not null,
  version bigint not null check (version >= 1),
  protocol text not null check (protocol in ('mcp','a2a','custom')),
  enabled boolean not null,
  capabilities text[] not null,
  security_route_key text not null,
  provider_key text,
  health text not null,
  configuration jsonb not null,
  source_ref text not null,
  operation text not null check (operation in ('register','replace','disable','retire')),
  recorded_at timestamptz not null default now(),
  unique(owner_id,adapter_key,version),
  foreign key(owner_id,adapter_key) references public.command_center_protocol_adapters(owner_id,adapter_key) on delete cascade
);

alter table public.command_center_protocol_adapters enable row level security;
alter table public.command_center_protocol_adapter_versions enable row level security;
revoke all on table public.command_center_protocol_adapters from public,anon,authenticated;
revoke all on table public.command_center_protocol_adapter_versions from public,anon,authenticated;
grant select on table public.command_center_protocol_adapters to authenticated;
grant select on table public.command_center_protocol_adapter_versions to authenticated;
drop policy if exists c3_owner_select_protocol_adapters on public.command_center_protocol_adapters;
create policy c3_owner_select_protocol_adapters on public.command_center_protocol_adapters for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists c3_owner_select_protocol_adapter_versions on public.command_center_protocol_adapter_versions;
create policy c3_owner_select_protocol_adapter_versions on public.command_center_protocol_adapter_versions for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_register_protocol_adapter(
  p_adapter_key text,p_protocol text,p_capabilities text[],p_security_route_key text,p_provider_key text,p_configuration jsonb,p_source_ref text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare u uuid:=auth.uid(); v_key text:=lower(btrim(coalesce(p_adapter_key,''))); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if v_key !~ '^protocol:[a-z0-9][a-z0-9._-]*$' or p_protocol not in ('mcp','a2a','custom') then raise exception 'Invalid protocol adapter identity'; end if;
  if not command_center_private.c3_text_array_unique_nonblank(p_capabilities) then raise exception 'Protocol capabilities must be unique and nonblank'; end if;
  if coalesce(btrim(p_security_route_key),'') !~ '^security\.[a-z0-9][a-z0-9._-]*$' then raise exception 'Protocol adapter requires a security route'; end if;
  if coalesce(jsonb_typeof(p_configuration),'null')<>'object' then raise exception 'Protocol configuration must be an object'; end if;
  if p_configuration::text ~* '(^|[^a-z])(secret|token|password|private[_ -]?key|authorization)([^a-z]|$)' or p_configuration::text ~* 'Bearer[[:space:]]+[A-Za-z0-9._~+/=-]{12,}' then raise exception 'Protocol configuration contains confidential material; use provider credential references'; end if;
  if coalesce(btrim(p_source_ref),'')='' then raise exception 'Protocol adapter provenance is required'; end if;
  if exists(select 1 from public.command_center_protocol_adapters where owner_id=u and adapter_key=v_key) then raise exception 'Protocol adapter already exists'; end if;
  if p_provider_key is not null and not exists(select 1 from public.command_center_provider_registry p where p.owner_id=u and p.provider_key=p_provider_key) then raise exception 'Protocol adapter provider reference is not registered'; end if;
  insert into public.command_center_protocol_adapters(owner_id,adapter_key,protocol,version,enabled,capabilities,security_route_key,provider_key,health,configuration,source_ref)
  values(u,v_key,p_protocol,1,false,p_capabilities,btrim(p_security_route_key),p_provider_key,'unconfigured',p_configuration,btrim(p_source_ref));
  insert into public.command_center_protocol_adapter_versions(owner_id,adapter_key,version,protocol,enabled,capabilities,security_route_key,provider_key,health,configuration,source_ref,operation)
  values(u,v_key,1,p_protocol,false,p_capabilities,btrim(p_security_route_key),p_provider_key,'unconfigured',p_configuration,btrim(p_source_ref),'register');
  return jsonb_build_object('adapter_key',v_key,'version',1,'enabled',false,'protocol',p_protocol);
end $$;

create or replace function public.command_center_replace_protocol_adapter(
  p_adapter_key text,p_expected_version bigint,p_enabled boolean,p_capabilities text[],p_security_route_key text,p_provider_key text,p_health text,p_configuration jsonb,p_source_ref text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare u uuid:=auth.uid(); a public.command_center_protocol_adapters%rowtype; v_next bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into a from public.command_center_protocol_adapters where owner_id=u and adapter_key=lower(btrim(p_adapter_key)) for update;
  if not found then raise exception 'Protocol adapter not found'; end if;
  if a.version<>p_expected_version then raise exception 'Protocol adapter version conflict'; end if;
  if not command_center_private.c3_text_array_unique_nonblank(p_capabilities) then raise exception 'Protocol capabilities must be unique and nonblank'; end if;
  if coalesce(btrim(p_security_route_key),'') !~ '^security\.[a-z0-9][a-z0-9._-]*$' then raise exception 'Protocol adapter requires a security route'; end if;
  if p_health not in ('unconfigured','available','degraded','unavailable','retired') then raise exception 'Invalid protocol adapter health'; end if;
  if coalesce(jsonb_typeof(p_configuration),'null')<>'object' or p_configuration::text ~* '(^|[^a-z])(secret|token|password|private[_ -]?key|authorization)([^a-z]|$)' or p_configuration::text ~* 'Bearer[[:space:]]+[A-Za-z0-9._~+/=-]{12,}' then raise exception 'Protocol configuration cannot contain confidential material'; end if;
  if coalesce(btrim(p_source_ref),'')='' then raise exception 'Protocol adapter provenance is required'; end if;
  if p_provider_key is not null and not exists(select 1 from public.command_center_provider_registry p where p.owner_id=u and p.provider_key=p_provider_key) then raise exception 'Protocol adapter provider reference is not registered'; end if;
  v_next:=a.version+1;
  update public.command_center_protocol_adapters set version=v_next,enabled=coalesce(p_enabled,false),capabilities=p_capabilities,security_route_key=btrim(p_security_route_key),provider_key=p_provider_key,health=p_health,configuration=p_configuration,source_ref=btrim(p_source_ref),updated_at=now() where owner_id=u and adapter_key=a.adapter_key;
  insert into public.command_center_protocol_adapter_versions(owner_id,adapter_key,version,protocol,enabled,capabilities,security_route_key,provider_key,health,configuration,source_ref,operation)
  values(u,a.adapter_key,v_next,a.protocol,coalesce(p_enabled,false),p_capabilities,btrim(p_security_route_key),p_provider_key,p_health,p_configuration,btrim(p_source_ref),case when p_health='retired' then 'retire' when not coalesce(p_enabled,false) then 'disable' else 'replace' end);
  return jsonb_build_object('adapter_key',a.adapter_key,'version',v_next,'enabled',coalesce(p_enabled,false),'health',p_health);
end $$;

revoke all on function public.command_center_register_protocol_adapter(text,text,text[],text,text,jsonb,text) from public,anon;
grant execute on function public.command_center_register_protocol_adapter(text,text,text[],text,text,jsonb,text) to authenticated;
revoke all on function public.command_center_replace_protocol_adapter(text,bigint,boolean,text[],text,text,text,jsonb,text) from public,anon;
grant execute on function public.command_center_replace_protocol_adapter(text,bigint,boolean,text[],text,text,text,jsonb,text) to authenticated;
