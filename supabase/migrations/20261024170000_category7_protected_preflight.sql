-- Category 7 / P7.20 — durable protected-action preflight over Category 2 authorization.
-- Branch-only migration. Preflight validates but does not consume authorization; the real side-effect boundary consumes exactly once.

create table if not exists public.command_center_agency_protected_preflights (
  preflight_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  task_id text not null,
  agent_generation bigint not null check (agent_generation>=1),
  context_packet_id uuid not null,
  authorization_id uuid not null,
  action_key text not null,
  resource_type text not null,
  resource_id text not null,
  provider_key text,
  credential_reference_id text,
  requested_scopes text[] not null default '{}'::text[],
  artifact_refs text[] not null default '{}'::text[],
  artifact_hashes text[] not null default '{}'::text[],
  result text not null check (result in ('passed','blocked')),
  blocker text,
  evidence_refs text[] not null,
  checked_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  foreign key(owner_id,context_packet_id) references public.command_center_agency_context_packets(owner_id,packet_id) on delete restrict,
  foreign key(owner_id,provider_key) references public.command_center_provider_registry(owner_id,provider_key) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check (cardinality(artifact_refs)=cardinality(artifact_hashes)),
  check ((result='passed' and blocker is null) or (result='blocked' and blocker is not null)),
  check (checked_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_protected_preflight_idx
  on public.command_center_agency_protected_preflights(owner_id,project_id,run_id,task_id,checked_at desc,preflight_id);

alter table public.command_center_agency_protected_preflights enable row level security;
revoke all on table public.command_center_agency_protected_preflights from public,anon,authenticated;
grant select on table public.command_center_agency_protected_preflights to authenticated;
drop policy if exists c7_owner_select_agency_protected_preflights on public.command_center_agency_protected_preflights;
create policy c7_owner_select_agency_protected_preflights
  on public.command_center_agency_protected_preflights for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_agency_preflight_protected_action(
  p_project_id text,p_run_id text,p_task_id text,p_agent_generation bigint,p_context_packet_id uuid,p_authorization_id uuid,p_action_key text,p_resource_type text,p_resource_id text,p_provider_key text,p_requested_scopes text[],p_artifact_refs text[],p_artifact_hashes text[],p_evidence_refs text[],p_checked_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  a public.security_action_authorizations%rowtype;
  pa public.command_center_agency_project_agents%rowtype;
  cp public.command_center_agency_context_packets%rowtype;
  pr public.command_center_provider_registry%rowtype;
  i integer;
  v_blocker text;
  v_id uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_requested_scopes,'Protected preflight requested scopes');
  perform command_center_private.c3_assert_unique_text_array(p_artifact_refs,'Protected preflight artifacts');
  perform command_center_private.c3_assert_unique_text_array(p_artifact_hashes,'Protected preflight artifact hashes');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Protected preflight evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Protected preflight requires evidence'; end if;
  if cardinality(coalesce(p_artifact_refs,'{}'::text[]))<>cardinality(coalesce(p_artifact_hashes,'{}'::text[])) then raise exception 'Protected preflight artifact references/hashes mismatch'; end if;

  if not exists(select 1 from public.command_center_agency_runs r where r.owner_id=u and r.project_id=btrim(p_project_id) and r.run_id=btrim(p_run_id) and r.state='working' and not r.stop_requested and not r.pause_requested) then v_blocker:='run_not_working'; end if;

  if v_blocker is null then
    select * into pa from public.command_center_agency_project_agents where owner_id=u and project_id=btrim(p_project_id);
    if not found or pa.generation<>p_agent_generation or pa.state<>'working' or pa.active_run_ref<>btrim(p_run_id) then v_blocker:='project_agent_generation_or_run_mismatch'; end if;
  end if;

  if v_blocker is null and not exists(select 1 from public.command_center_agency_project_auto_locks l where l.owner_id=u and l.project_id=btrim(p_project_id) and l.run_id=btrim(p_run_id) and l.agent_generation=p_agent_generation and l.state='active') then
    v_blocker:='project_lock_missing';
  end if;

  if v_blocker is null then
    select * into cp from public.command_center_agency_context_packets where owner_id=u and packet_id=p_context_packet_id;
    if not found or cp.project_id<>btrim(p_project_id) or cp.run_ref<>btrim(p_run_id) or cp.task_id<>btrim(p_task_id) then v_blocker:='context_scope_mismatch';
    elsif cp.agent_generation<>p_agent_generation then v_blocker:='context_generation_stale';
    elsif p_checked_at>=cp.stale_after then v_blocker:='context_stale';
    end if;
  end if;

  if v_blocker is null then
    select * into a from public.security_action_authorizations x where x.id=p_authorization_id and x.owner_id=u;
    if not found then v_blocker:='authorization_missing';
    elsif a.status<>'authorized' then v_blocker:='authorization_not_available';
    elsif a.action_key<>btrim(p_action_key) or a.resource_type<>btrim(p_resource_type) or a.resource_id<>btrim(p_resource_id) then v_blocker:='authorization_scope_mismatch';
    elsif a.expires_at<=p_checked_at then v_blocker:='authorization_expired';
    elsif a.authorized_session_id is null or a.fresh_verified_at is null then v_blocker:='authorization_freshness_missing';
    elsif not exists(select 1 from auth.sessions s where s.id=a.authorized_session_id and s.user_id=u and (s.not_after is null or s.not_after>p_checked_at)) then v_blocker:='authorization_session_not_live';
    elsif exists(
      select 1 from public.command_center_owner_sessions cs
      left join public.command_center_owner_devices cd on cd.owner_id=cs.owner_id and cd.id=cs.device_id
      where cs.owner_id=u and cs.session_id=a.authorized_session_id and (cs.revoked_at is not null or cd.revoked_at is not null or coalesce(cd.trust_state,'untrusted')='revoked')
    ) then v_blocker:='authorization_session_or_device_revoked';
    end if;
  end if;

  if v_blocker is null and nullif(btrim(coalesce(p_provider_key,'')),'') is not null then
    select * into pr from public.command_center_provider_registry where owner_id=u and provider_key=btrim(p_provider_key);
    if not found or not pr.enabled or pr.health in ('unavailable','unconfigured') then v_blocker:='provider_unavailable';
    elsif pr.credential_reference_id is null then v_blocker:='credential_reference_missing';
    elsif not coalesce(p_requested_scopes,'{}'::text[]) <@ pr.scopes then v_blocker:='credential_scope_denied';
    end if;
  elsif v_blocker is null and cardinality(coalesce(p_requested_scopes,'{}'::text[]))>0 then
    v_blocker:='provider_required_for_scoped_credential';
  end if;

  if v_blocker is null then
    for i in 1..cardinality(coalesce(p_artifact_refs,'{}'::text[])) loop
      if p_artifact_hashes[i] !~ '^[a-f0-9]{64}$' then v_blocker:='artifact_hash_invalid'; exit; end if;
      if not exists(
        select 1 from public.command_center_assets ass
        where ass.owner_id=u and ass.asset_id=p_artifact_refs[i] and coalesce(ass.project_id,btrim(p_project_id))=btrim(p_project_id) and ass.sha256=p_artifact_hashes[i] and ass.original_state='available'
      ) then v_blocker:='artifact_missing_or_hash_mismatch'; exit; end if;
    end loop;
  end if;

  insert into public.command_center_agency_protected_preflights(owner_id,project_id,run_id,task_id,agent_generation,context_packet_id,authorization_id,action_key,resource_type,resource_id,provider_key,credential_reference_id,requested_scopes,artifact_refs,artifact_hashes,result,blocker,evidence_refs,checked_at)
  values(u,btrim(p_project_id),btrim(p_run_id),btrim(p_task_id),p_agent_generation,p_context_packet_id,p_authorization_id,btrim(p_action_key),btrim(p_resource_type),btrim(p_resource_id),nullif(btrim(coalesce(p_provider_key,'')),''),case when pr.provider_key is null then null else pr.credential_reference_id end,coalesce(p_requested_scopes,'{}'::text[]),coalesce(p_artifact_refs,'{}'::text[]),coalesce(p_artifact_hashes,'{}'::text[]),case when v_blocker is null then 'passed' else 'blocked' end,v_blocker,p_evidence_refs,p_checked_at)
  returning preflight_id into v_id;

  return jsonb_build_object('preflight_id',v_id,'result',case when v_blocker is null then 'passed' else 'blocked' end,'blocker',v_blocker,'authorization_id',p_authorization_id,'authorization_consumed',false,'protected_side_effect_executed',false);
end $$;

revoke all on function public.command_center_agency_preflight_protected_action(text,text,text,bigint,uuid,uuid,text,text,text,text,text[],text[],text[],text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_preflight_protected_action(text,text,text,bigint,uuid,uuid,text,text,text,text,text[],text[],text[],text[],timestamptz) to authenticated;
