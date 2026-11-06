-- Scoped activation checks under the owner's authorized COMMAND CENTER task.
-- Operator admission is distinguished from an explicit owner JWT command.
create table public.command_center_pc_tool_client_status (
 owner_id uuid not null references auth.users(id),
 worker_id uuid not null references public.command_center_pc_worker_registrations(worker_id),
 client_contract text not null check(client_contract='cc-pc-tools-v1'),
 last_seen_at timestamptz not null,
 primary key(owner_id,worker_id)
);
alter table public.command_center_pc_tool_client_status enable row level security;
revoke all on public.command_center_pc_tool_client_status from public,anon,authenticated,service_role;
grant select on public.command_center_pc_tool_client_status to authenticated;
create policy pc_tool_client_owner_read on public.command_center_pc_tool_client_status for select to authenticated
 using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
alter table public.command_center_pc_tool_jobs add column if not exists admission_authority text not null default 'owner-explicit';
alter table public.command_center_pc_tool_jobs add constraint pc_tool_admission_scope check(admission_authority in ('owner-explicit','delegated-activation-check'));
alter table public.command_center_pc_tool_jobs add constraint pc_tool_activation_input check(admission_authority<>'delegated-activation-check' or (
 action_key='artifact.write' and input_text::jsonb=jsonb_build_object('name','activation-check-'||invocation_id||'.txt','content','COMMAND_CENTER_ACTIVATION_CHECK:'||project_id||':'||invocation_id)
));
create unique index pc_one_artifact_activation_per_brain on public.command_center_pc_tool_jobs(owner_id,project_id,brain_version) where admission_authority='delegated-activation-check';
create index pc_tool_job_ready_queue on public.command_center_pc_tool_jobs(owner_id,worker_id,state,created_at,invocation_id);

create or replace function command_center_pc_private.command_center_pc_tool_exchange_service(p_owner uuid,p_worker uuid,p_action text,p_id uuid,p_fence bigint,p_result jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.command_center_pc_tool_jobs%rowtype;a jsonb;l jsonb;v record;h text;r jsonb;
begin
 perform 1 from public.command_center_pc_worker_registrations w join public.command_center_members m on m.user_id=w.owner_id
 where w.owner_id=p_owner and w.worker_id=p_worker and w.enabled and w.revoked_at is null and m.access_status='active' and m.revoked_at is null for share of w,m;
 if not found then raise exception 'Worker and owner authorization required';end if;
 if p_action not in ('next','current','commit','readback') or p_action is null then raise exception 'Unsupported tool exchange';end if;
 insert into public.command_center_pc_tool_client_status(owner_id,worker_id,client_contract,last_seen_at)
 values(p_owner,p_worker,'cc-pc-tools-v1',now()) on conflict(owner_id,worker_id) do update set last_seen_at=excluded.last_seen_at;
 if p_action='next' then
  -- An expired effect is uncertain, never a fresh retry.
  update public.command_center_pc_tool_jobs set state='uncertain' where owner_id=p_owner and worker_id=p_worker and state='claimed' and lease_expires_at<=now();
  select * into j from public.command_center_pc_tool_jobs where owner_id=p_owner and worker_id=p_worker and state='queued' and expires_at>now() order by created_at,invocation_id limit 1 for update skip locked;
  if not found then return null;end if;
 else
  select * into j from public.command_center_pc_tool_jobs where owner_id=p_owner and worker_id=p_worker and invocation_id=p_id for update;
  if not found or j.fence is distinct from p_fence then raise exception 'Exact current tool job required';end if;
 end if;
 select b.version,b.brain_key,p.company_id into v from public.command_center_specialist_brains b join public.command_center_project_profiles p using(owner_id,project_id)
 where b.owner_id=p_owner and b.project_id=j.project_id and b.control_plane='command_center' and b.cost_class='free'
 and b.supported_project_ids=array[j.project_id] and b.supported_company_ids=array[j.company_id]
 and b.permission_keys @> array['project:'||j.project_id||':tools.request'] for share of b,p;
 if not found or v.version<>j.brain_version or v.brain_key<>j.brain_key or v.company_id<>j.company_id then raise exception 'Tool job project binding changed';end if;
 if j.state='completed' and p_action in ('readback','commit') then
  if p_action='commit' and j.result is distinct from p_result then raise exception 'Committed tool result differs';end if;
 elsif j.expires_at<=now() or j.state in ('cancelled','uncertain') then raise exception 'Tool job stopped or expired';
 elsif p_action='next' then
  update public.command_center_pc_tool_jobs set state='claimed',fence=fence+1,lease_expires_at=least(expires_at,now()+interval '90 seconds') where invocation_id=j.invocation_id returning * into j;
 elsif j.state<>'claimed' or j.lease_expires_at<=now() then raise exception 'Tool job lease expired or unclaimed';end if;
 l:=jsonb_build_object('invocationId',j.invocation_id,'taskId','pc-tool:'||j.invocation_id,'workerId',p_worker,'ownerId',p_owner,'projectId',j.project_id,'companyId',j.company_id,'generation',1,'fencingToken',j.fence,'expiresAt',to_char(j.lease_expires_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
 if p_action='current' then return jsonb_build_object('current',true);end if;
 if p_action='commit' and j.state<>'completed' then
  h:=encode(sha256(convert_to(coalesce(p_result->>'outputText',''),'UTF8')),'hex');
  if p_result->'lease' is distinct from l or p_result->>'toolKey' is distinct from 'owner-pc-artifacts'
  or p_result->>'actionKey' is distinct from j.action_key or p_result->>'toolVersion' is distinct from 'artifact-v1'
  or p_result->>'inputHash' is distinct from j.input_hash or p_result->>'outputHash' is distinct from h
  or jsonb_typeof(p_result->'outputText') is distinct from 'string' or octet_length(p_result->>'outputText')>120000
  then raise exception 'Tool result identity or hash mismatch';end if;
  if j.action_key='artifact.write' then
   r:=(p_result->>'outputText')::jsonb;
   if r->>'name' is distinct from (j.input_text::jsonb->>'name') or r->>'sha256' is distinct from encode(sha256(convert_to(j.input_text::jsonb->>'content','UTF8')),'hex')
   or r->>'bytes' is distinct from octet_length(j.input_text::jsonb->>'content')::text or r->>'scope' is distinct from 'project_artifact_only'
   then raise exception 'Artifact effect readback not verified';end if;
  end if;
  update public.command_center_pc_tool_jobs set state='completed',result=p_result,commit_id=gen_random_uuid(),completed_at=now() where invocation_id=j.invocation_id returning * into j;
 end if;
 if p_action in ('commit','readback') then
  if j.state<>'completed' then raise exception 'Completed tool result missing';end if;
  return j.result||jsonb_build_object('receipt',l||jsonb_build_object('toolKey','owner-pc-artifacts','actionKey',j.action_key,'toolVersion','artifact-v1','inputHash',j.input_hash,'outputHash',j.result->>'outputHash','commitId',j.commit_id,'resultRef','supabase:command_center_pc_tool_jobs:'||j.invocation_id,'canonicalCommitVerified',true));
 end if;
 a:=jsonb_build_object('ownerId',p_owner,'projectId',j.project_id,'companyId',j.company_id,'toolKey','owner-pc-artifacts','actionKey',j.action_key,
 'accountRef','artifact:'||p_owner||':'||j.project_id,'resourceProjectId',j.project_id,'resourceCompanyId',j.company_id,
 'effect',case j.action_key when 'artifact.write' then 'local_write' else 'private_read' end,'now',now(),'maximumHealthAgeMs',180000,
 'authority',jsonb_build_object('issuer','command_center','ownerId',p_owner,'projectId',j.project_id,'companyId',j.company_id,'actionKeys',jsonb_build_array(j.action_key),
 'accountRefs',jsonb_build_array('artifact:'||p_owner||':'||j.project_id),'reference',case when j.admission_authority='delegated-activation-check' then 'command-center:activation-artifact-check:' else 'owner:explicit-artifact-job:' end||j.invocation_id,'expiresAt',j.expires_at,'protectedActionAuthorized',false));
 return jsonb_build_object('saved',jsonb_build_object('invocationId',j.invocation_id,'taskId','pc-tool:'||j.invocation_id,'workerId',p_worker,'inputText',j.input_text,'action',a),'lease',l);
end $$;
revoke all on function command_center_pc_private.command_center_pc_tool_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function command_center_pc_private.command_center_pc_tool_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) to service_role;
create or replace function public.command_center_pc_tool_exchange_service(p_owner uuid,p_worker uuid,p_action text,p_id uuid,p_fence bigint,p_result jsonb)
returns jsonb language sql security invoker set search_path='' as $$select command_center_pc_private.command_center_pc_tool_exchange_service(p_owner,p_worker,p_action,p_id,p_fence,p_result)$$;
revoke all on function public.command_center_pc_tool_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.command_center_pc_tool_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) to service_role;

create function command_center_pc_private.command_center_pc_queue_activation_artifact_service(p_owner uuid,p_worker uuid,p_project text,p_invocation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.command_center_specialist_brains%rowtype;p public.command_center_project_profiles%rowtype;j public.command_center_pc_tool_jobs%rowtype;s text;
begin
 if p_invocation is null then raise exception 'Activation invocation required';end if;
 perform 1 from public.command_center_pc_worker_registrations w join public.command_center_members m on m.user_id=w.owner_id
 where w.owner_id=p_owner and w.worker_id=p_worker and w.enabled and w.revoked_at is null and m.access_status='active' and m.revoked_at is null for share of w,m;
 if not found then raise exception 'Current paired worker and owner required';end if;
 select * into strict b from public.command_center_specialist_brains where owner_id=p_owner and project_id=p_project for share;
 select * into strict p from public.command_center_project_profiles where owner_id=p_owner and project_id=p_project for share;
 if b.scope is distinct from 'project' or b.control_plane is distinct from 'command_center' or b.cost_class is distinct from 'free'
 or b.brain_key is distinct from 'brain:'||p.company_id||':v1' or b.supported_project_ids is distinct from array[p_project] or b.supported_company_ids is distinct from array[p.company_id]
 or (b.permission_keys @> array['project:'||p_project||':tools.request']) is not true
 or ('provider:owner-pc:'||p_worker::text=any(b.provider_keys)) is not true then raise exception 'Exact activation tool binding required';end if;
 if not exists(select 1 from public.command_center_specialist_brain_versions v where v.owner_id=p_owner and v.specialist_id=b.specialist_id and v.version=b.version and
 v.authority_evidence_ids @> array['evd_owner-command-center-brain-activation-20261105']) then raise exception 'Versioned owner activation authority required';end if;
 if not exists(select 1 from public.command_center_pc_inference_requests q where q.owner_id=p_owner and q.worker_id=p_worker and q.project_id=p_project and q.state='completed'
 and q.activation_contract is not null and q.route_snapshot->>'brainKey'=b.brain_key and q.route_snapshot->>'brainVersion'=b.version::text and q.model_digest ~ '^[a-f0-9]{64}$')
 then raise exception 'Existing live specialist inference proof required';end if;
 s:=jsonb_build_object('name','activation-check-'||p_invocation||'.txt','content','COMMAND_CENTER_ACTIVATION_CHECK:'||p_project||':'||p_invocation)::text;
 insert into public.command_center_pc_tool_jobs(invocation_id,owner_id,worker_id,project_id,company_id,brain_key,brain_version,action_key,input_text,input_hash,admission_authority,expires_at)
 values(p_invocation,p_owner,p_worker,p_project,p.company_id,b.brain_key,b.version,'artifact.write',s,encode(sha256(convert_to(s,'UTF8')),'hex'),'delegated-activation-check',now()+interval '6 hours') on conflict do nothing;
 select * into strict j from public.command_center_pc_tool_jobs where owner_id=p_owner and project_id=p_project and brain_version=b.version and admission_authority='delegated-activation-check';
 if j.worker_id<>p_worker then raise exception 'Activation worker binding changed';end if;
 return jsonb_build_object('invocationId',j.invocation_id,'projectId',j.project_id,'state',j.state,'admissionAuthority',j.admission_authority,'companyBuildStarted',false,'paidActionsAuthorized',false);
end $$;
revoke all on function command_center_pc_private.command_center_pc_queue_activation_artifact_service(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function command_center_pc_private.command_center_pc_queue_activation_artifact_service(uuid,uuid,text,uuid) to service_role;
create function public.command_center_pc_queue_activation_artifact_service(p_owner uuid,p_worker uuid,p_project text,p_invocation uuid)
returns jsonb language sql security invoker set search_path='' as $$select command_center_pc_private.command_center_pc_queue_activation_artifact_service(p_owner,p_worker,p_project,p_invocation)$$;
revoke all on function public.command_center_pc_queue_activation_artifact_service(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.command_center_pc_queue_activation_artifact_service(uuid,uuid,text,uuid) to service_role;
