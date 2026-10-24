-- Category 7 / P7.23 — durable crash/lease recovery, worker replacement and lead failover.
-- Branch-only migration. Recovery preserves project lock/checkpoint/queue/evidence and fences stale workers.

create table if not exists public.command_center_agency_recovery_events (
  recovery_event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  task_id text,
  recovery_key text not null,
  cause text not null check (cause in ('process_crash','lease_expired','worker_loss','network_partition','provider_outage','control_restart')),
  prior_worker_id text,
  replacement_worker_id text,
  prior_generation bigint,
  new_generation bigint,
  prior_fencing_token bigint,
  new_fencing_token bigint,
  checkpoint_id uuid not null,
  queue_ref text not null,
  context_revalidation_required boolean not null,
  duplicate_side_effect_prevented boolean not null default true check (duplicate_side_effect_prevented=true),
  result text not null check (result in ('reclaimed','blocked_already_committed','blocked_live_lease','blocked_scope','failed')),
  blocker text,
  evidence_refs text[] not null,
  recovered_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_id,recovery_key),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  foreign key(checkpoint_id) references public.command_center_project_checkpoints(checkpoint_id) on delete restrict,
  check (length(btrim(recovery_key)) between 1 and 500),
  check (length(btrim(queue_ref)) between 1 and 1000),
  check (cardinality(evidence_refs)>0),
  check ((result='reclaimed' and replacement_worker_id is not null and new_generation is not null and new_fencing_token is not null and blocker is null) or result<>'reclaimed'),
  check (recovered_at<=recorded_at + interval '5 minutes')
);

create table if not exists public.command_center_agency_lead_failovers (
  failover_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.command_center_agency_organizations(organization_id) on delete cascade,
  project_id text not null,
  run_id text not null,
  prior_lead_key text not null,
  replacement_lead_key text not null,
  mission_ref text not null,
  queue_ref text not null,
  checkpoint_id uuid not null,
  authority_scopes text[] not null,
  evidence_refs text[] not null,
  failover_key text not null,
  failed_over_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_id,failover_key),
  check (prior_lead_key<>replacement_lead_key),
  check (cardinality(authority_scopes)>0),
  check (cardinality(evidence_refs)>0),
  check (failed_over_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_recovery_run_idx
  on public.command_center_agency_recovery_events(owner_id,project_id,run_id,recovered_at desc,recovery_event_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_recovery_events','command_center_agency_lead_failovers'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_recover_orphan_task(
  p_project_id text,p_run_id text,p_task_id text,p_replacement_worker_id text,p_recovery_key text,p_cause text,p_now timestamptz,p_expires_at timestamptz,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  r public.command_center_agency_runs%rowtype;
  pa public.command_center_agency_project_agents%rowtype;
  c public.command_center_agency_task_claims%rowtype;
  w public.command_center_agency_worker_health%rowtype;
  existing public.command_center_agency_recovery_events%rowtype;
  v_generation bigint;
  v_fence bigint;
  v_retry integer;
  v_revalidate boolean;
  v_event uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_cause not in ('process_crash','lease_expired','worker_loss','network_partition','provider_outage','control_restart') then raise exception 'Invalid recovery cause'; end if;
  if coalesce(btrim(p_recovery_key),'')='' or coalesce(btrim(p_replacement_worker_id),'')='' then raise exception 'Recovery key/replacement worker required'; end if;
  if p_expires_at<=p_now then raise exception 'Recovery lease expiry must be in the future'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Recovery evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Recovery requires evidence'; end if;

  select * into existing from public.command_center_agency_recovery_events where owner_id=u and recovery_key=btrim(p_recovery_key);
  if found then
    return jsonb_build_object('recovery_event_id',existing.recovery_event_id,'result',existing.result,'duplicate_request',true,'duplicate_side_effect_prevented',true,'new_generation',existing.new_generation,'new_fencing_token',existing.new_fencing_token);
  end if;

  select * into r from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) for update;
  if not found or r.checkpoint_id is null then raise exception 'Recoverable run/checkpoint not found'; end if;
  if r.state in ('completed','stopped','failed') or r.stop_requested then raise exception 'Terminal/stopped run cannot recover task'; end if;
  if not exists(select 1 from public.command_center_agency_project_auto_locks l where l.owner_id=u and l.project_id=r.project_id and l.run_id=r.run_id and l.state='active') then raise exception 'Recovery requires preserved project lock'; end if;
  select * into pa from public.command_center_agency_project_agents where owner_id=u and project_id=r.project_id for update;
  if not found or pa.state='retired' or pa.checkpoint_id is distinct from r.checkpoint_id then raise exception 'Recovery Project Agent/checkpoint mismatch'; end if;
  if coalesce(btrim(pa.queue_ref),'')='' then raise exception 'Recovery requires persisted Project Agent queue'; end if;

  if exists(select 1 from public.command_center_agency_task_commits tc where tc.owner_id=u and tc.project_id=r.project_id and tc.task_id=btrim(p_task_id)) then
    insert into public.command_center_agency_recovery_events(owner_id,project_id,run_id,task_id,recovery_key,cause,checkpoint_id,queue_ref,context_revalidation_required,result,blocker,evidence_refs,recovered_at)
    values(u,r.project_id,r.run_id,btrim(p_task_id),btrim(p_recovery_key),p_cause,r.checkpoint_id,pa.queue_ref,false,'blocked_already_committed','task_already_committed_exactly_once',p_evidence_refs,p_now) returning recovery_event_id into v_event;
    return jsonb_build_object('recovery_event_id',v_event,'result','blocked_already_committed','duplicate_side_effect_prevented',true);
  end if;

  select * into c from public.command_center_agency_task_claims where owner_id=u and project_id=r.project_id and task_id=btrim(p_task_id) for update;
  if not found then raise exception 'Task claim not found for recovery'; end if;
  if c.status='claimed' and c.expires_at>p_now then
    insert into public.command_center_agency_recovery_events(owner_id,project_id,run_id,task_id,recovery_key,cause,prior_worker_id,prior_generation,prior_fencing_token,checkpoint_id,queue_ref,context_revalidation_required,result,blocker,evidence_refs,recovered_at)
    values(u,r.project_id,r.run_id,c.task_id,btrim(p_recovery_key),p_cause,c.worker_id,c.generation,c.fencing_token,r.checkpoint_id,pa.queue_ref,false,'blocked_live_lease','live_claim_not_reapable',p_evidence_refs,p_now) returning recovery_event_id into v_event;
    return jsonb_build_object('recovery_event_id',v_event,'result','blocked_live_lease','duplicate_side_effect_prevented',true);
  end if;

  select * into w from public.command_center_agency_worker_health where owner_id=u and worker_id=btrim(p_replacement_worker_id);
  if not found or w.project_id<>r.project_id or w.state not in ('idle','working') then raise exception 'Replacement worker unavailable or wrong project'; end if;

  v_generation:=c.generation+1;
  v_fence:=c.fencing_token+1;
  v_retry:=c.retry_count+1;
  select not exists(
    select 1 from public.command_center_agency_context_packets cp
    where cp.owner_id=u and cp.project_id=r.project_id and cp.run_ref=r.run_id and cp.task_id=c.task_id
      and cp.agent_generation=pa.generation and cp.stale_after>p_now
  ) into v_revalidate;

  update public.command_center_agency_task_claims
  set worker_id=btrim(p_replacement_worker_id),generation=v_generation,fencing_token=v_fence,status='claimed',retry_count=v_retry,
      idempotency_key='recovery:'||btrim(p_recovery_key),claimed_at=p_now,heartbeat_at=p_now,expires_at=p_expires_at,updated_at=p_now
  where owner_id=u and project_id=r.project_id and task_id=c.task_id;

  update public.command_center_agency_worker_health set state='dead',updated_at=now()
  where owner_id=u and worker_id=c.worker_id and c.worker_id<>btrim(p_replacement_worker_id);
  update public.command_center_agency_worker_health set task_id=c.task_id,state='working',updated_at=now()
  where owner_id=u and worker_id=btrim(p_replacement_worker_id);

  insert into public.command_center_agency_task_claim_events(owner_id,project_id,task_id,worker_id,generation,fencing_token,event_type,retry_count,idempotency_key,evidence_refs,occurred_at)
  values(u,r.project_id,c.task_id,btrim(p_replacement_worker_id),v_generation,v_fence,'reclaimed',v_retry,'recovery:'||btrim(p_recovery_key),p_evidence_refs,p_now);

  insert into public.command_center_agency_recovery_events(owner_id,project_id,run_id,task_id,recovery_key,cause,prior_worker_id,replacement_worker_id,prior_generation,new_generation,prior_fencing_token,new_fencing_token,checkpoint_id,queue_ref,context_revalidation_required,result,evidence_refs,recovered_at)
  values(u,r.project_id,r.run_id,c.task_id,btrim(p_recovery_key),p_cause,c.worker_id,btrim(p_replacement_worker_id),c.generation,v_generation,c.fencing_token,v_fence,r.checkpoint_id,pa.queue_ref,v_revalidate,'reclaimed',p_evidence_refs,p_now)
  returning recovery_event_id into v_event;

  return jsonb_build_object('recovery_event_id',v_event,'result','reclaimed','task_id',c.task_id,'replacement_worker_id',btrim(p_replacement_worker_id),'new_generation',v_generation,'new_fencing_token',v_fence,'checkpoint_id',r.checkpoint_id,'queue_ref',pa.queue_ref,'context_revalidation_required',v_revalidate,'duplicate_side_effect_prevented',true,'next_action','resume_reclaimed_task');
end $$;

create or replace function public.command_center_agency_failover_lead(
  p_organization_id uuid,p_failover_key text,p_now timestamptz,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  o public.command_center_agency_organizations%rowtype;
  pa public.command_center_agency_project_agents%rowtype;
  pp public.command_center_project_profiles%rowtype;
  replacement record;
  existing public.command_center_agency_lead_failovers%rowtype;
  v_id uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_failover_key),'')='' then raise exception 'Lead failover key required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Lead failover evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Lead failover requires evidence'; end if;
  select * into existing from public.command_center_agency_lead_failovers where owner_id=u and failover_key=btrim(p_failover_key);
  if found then return jsonb_build_object('failover_id',existing.failover_id,'replacement_lead_key',existing.replacement_lead_key,'duplicate_request',true); end if;
  select * into o from public.command_center_agency_organizations where owner_id=u and organization_id=p_organization_id for update;
  if not found or o.state<>'active' then raise exception 'Active organization not found'; end if;
  select * into pa from public.command_center_agency_project_agents where owner_id=u and project_id=o.project_id;
  select * into pp from public.command_center_project_profiles where owner_id=u and project_id=o.project_id;
  if pa.project_id is null or pa.checkpoint_id is null or coalesce(btrim(pa.queue_ref),'')='' then raise exception 'Lead failover must preserve Project Agent queue/checkpoint'; end if;
  select l.lead_key,l.version into replacement
  from public.command_center_agency_leads l
  where l.owner_id=u and l.lead_key<>o.lead_key and l.retired_at is null and l.health='available'
    and o.required_capability=any(l.capabilities)
    and (cardinality(l.project_type_keys)=0 or pp.type_key=any(l.project_type_keys))
    and o.required_authority_scopes <@ l.authority_scopes
    and (case o.risk when 'low' then 0 when 'medium' then 1 when 'high' then 2 else 3 end) <= (case l.max_risk when 'low' then 0 when 'medium' then 1 when 'high' then 2 else 3 end)
    and (select count(*) from public.command_center_agency_organizations active where active.owner_id=u and active.lead_key=l.lead_key and active.state='active') < l.max_concurrent_assignments
  order by (select count(*) from public.command_center_agency_organizations active where active.owner_id=u and active.lead_key=l.lead_key and active.state='active'),l.lead_key
  limit 1;
  if replacement.lead_key is null then raise exception 'No eligible replacement lead'; end if;
  insert into public.command_center_agency_lead_failovers(owner_id,organization_id,project_id,run_id,prior_lead_key,replacement_lead_key,mission_ref,queue_ref,checkpoint_id,authority_scopes,evidence_refs,failover_key,failed_over_at)
  values(u,o.organization_id,o.project_id,o.run_id,o.lead_key,replacement.lead_key,o.mission_ref,pa.queue_ref,pa.checkpoint_id,o.required_authority_scopes,p_evidence_refs,btrim(p_failover_key),p_now) returning failover_id into v_id;
  update public.command_center_agency_organizations set lead_key=replacement.lead_key,lead_version=replacement.version where owner_id=u and organization_id=o.organization_id;
  return jsonb_build_object('failover_id',v_id,'organization_id',o.organization_id,'prior_lead_key',o.lead_key,'replacement_lead_key',replacement.lead_key,'mission_ref',o.mission_ref,'queue_ref',pa.queue_ref,'checkpoint_id',pa.checkpoint_id,'authority_scopes',to_jsonb(o.required_authority_scopes),'authority_expanded',false,'next_action','resume_under_replacement_lead');
end $$;

revoke all on function public.command_center_agency_recover_orphan_task(text,text,text,text,text,text,timestamptz,timestamptz,text[]) from public,anon;
revoke all on function public.command_center_agency_failover_lead(uuid,text,timestamptz,text[]) from public,anon;
grant execute on function public.command_center_agency_recover_orphan_task(text,text,text,text,text,text,timestamptz,timestamptz,text[]) to authenticated;
grant execute on function public.command_center_agency_failover_lead(uuid,text,timestamptz,text[]) to authenticated;
