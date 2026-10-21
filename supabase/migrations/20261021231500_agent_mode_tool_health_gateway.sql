-- Owner-visible tool health plus service-only registry updates.

create or replace function public.command_center_agent_tool_health()
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); outj jsonb; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'capability_key',capability_key,'environment',environment,'provider',provider,'tool_key',tool_key,
    'availability',availability,'auth_state',auth_state,'action_scope',action_scope,'free_status',free_status,
    'last_success_at',last_success_at,'error_class',error_class,'approved_fallback',approved_fallback,
    'last_verified_at',last_verified_at,'metadata',metadata
  ) order by capability_key,environment,provider,tool_key),'[]'::jsonb) into outj
  from public.agent_tool_registry where owner_id=u;
  return outj;
end $$;

create or replace function public.command_center_agent_service_upsert_tool_health(
  p_owner_id uuid,p_capability_key text,p_environment text,p_provider text,p_tool_key text,
  p_availability text,p_auth_state text,p_action_scope jsonb default '{}'::jsonb,p_free_status text default 'unknown',
  p_last_success_at timestamptz default null,p_error_class text default null,p_approved_fallback text default null,p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path to '' as $$
declare rowj jsonb; begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  if coalesce(btrim(p_capability_key),'')='' then raise exception 'Capability key is required'; end if;
  if p_environment not in ('normal_chat','work','external_tool','user_only') then raise exception 'Invalid tool environment'; end if;
  if p_availability not in ('available','unavailable','degraded','unknown') then raise exception 'Invalid tool availability'; end if;
  if p_auth_state not in ('authenticated','needs_auth','not_applicable','unknown') then raise exception 'Invalid auth state'; end if;
  if p_free_status not in ('free','paid','unknown') then raise exception 'Invalid free status'; end if;
  insert into public.agent_tool_registry(owner_id,capability_key,environment,provider,tool_key,availability,auth_state,action_scope,free_status,last_success_at,error_class,approved_fallback,last_verified_at,metadata)
  values(p_owner_id,btrim(p_capability_key),p_environment,coalesce(p_provider,''),coalesce(p_tool_key,''),p_availability,p_auth_state,coalesce(p_action_scope,'{}'::jsonb),p_free_status,p_last_success_at,nullif(btrim(p_error_class),''),nullif(btrim(p_approved_fallback),''),now(),coalesce(p_metadata,'{}'::jsonb))
  on conflict(owner_id,capability_key,environment,provider,tool_key) do update set
    availability=excluded.availability,auth_state=excluded.auth_state,action_scope=excluded.action_scope,free_status=excluded.free_status,
    last_success_at=coalesce(excluded.last_success_at,public.agent_tool_registry.last_success_at),error_class=excluded.error_class,
    approved_fallback=excluded.approved_fallback,last_verified_at=now(),metadata=excluded.metadata,updated_at=now()
  returning jsonb_build_object('capability_key',capability_key,'environment',environment,'provider',provider,'tool_key',tool_key,'availability',availability,'auth_state',auth_state,'free_status',free_status,'last_success_at',last_success_at,'last_verified_at',last_verified_at,'metadata',metadata) into rowj;
  return rowj;
end $$;

revoke execute on function public.command_center_agent_tool_health() from public,anon;
grant execute on function public.command_center_agent_tool_health() to authenticated;
revoke execute on function public.command_center_agent_service_upsert_tool_health(uuid,text,text,text,text,text,text,jsonb,text,timestamptz,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.command_center_agent_service_upsert_tool_health(uuid,text,text,text,text,text,text,jsonb,text,timestamptz,text,text,jsonb) to service_role;
