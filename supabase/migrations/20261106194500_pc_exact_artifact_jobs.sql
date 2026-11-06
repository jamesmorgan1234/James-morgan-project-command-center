-- Explicit owner-requested artifact jobs on an existing paired worker.
-- Does not enable a specialist, resume a company run, or grant general PC access.
create table public.command_center_pc_tool_jobs (
 invocation_id uuid primary key,
 owner_id uuid not null references auth.users(id),
 worker_id uuid not null references public.command_center_pc_worker_registrations(worker_id),
 project_id text not null,
 company_id text not null,
 brain_key text not null,
 brain_version bigint not null,
 action_key text not null check(action_key in ('artifact.write','artifact.read')),
 input_text text not null check(length(input_text)<=120000),
 input_hash text not null check(input_hash ~ '^[a-f0-9]{64}$'),
 state text not null default 'queued' check(state in ('queued','claimed','completed','cancelled','uncertain')),
 fence bigint not null default 0,
 lease_expires_at timestamptz,
 expires_at timestamptz not null default now()+interval '10 minutes',
 result jsonb,
 commit_id uuid unique,
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id),
 check((state='completed' and result is not null and commit_id is not null and completed_at is not null) or state<>'completed')
);
alter table public.command_center_pc_tool_jobs enable row level security;
revoke all on public.command_center_pc_tool_jobs from public,anon,authenticated,service_role;
grant select on public.command_center_pc_tool_jobs to authenticated;
create policy pc_tool_owner_read on public.command_center_pc_tool_jobs for select to authenticated
 using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_pc_enqueue_artifact_job(p_invocation uuid,p_project text,p_worker uuid,p_action text,p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();b public.command_center_specialist_brains%rowtype;p public.command_center_project_profiles%rowtype;j public.command_center_pc_tool_jobs%rowtype;s text;
begin
 if u is null or not public.is_command_center_authorized() then raise exception 'Owner authorization required';end if;
 if p_action not in ('artifact.read','artifact.write') or p_action is null or p_invocation is null
 or jsonb_typeof(p_input) is distinct from 'object'
 or jsonb_typeof(p_input->'name') is distinct from 'string' or coalesce(p_input->>'name','') !~ '^[A-Za-z0-9][A-Za-z0-9_.-]{0,119}$'
 or p_input->>'name' ~* '^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)' or p_input->>'name' ~ '\.$'
 or exists(select 1 from jsonb_object_keys(p_input) k where k not in ('name','content'))
 or (p_action='artifact.write' and (jsonb_typeof(p_input->'content') is distinct from 'string' or octet_length(p_input->>'content')>100000))
 or (p_action='artifact.read' and p_input?'content') then raise exception 'Exact artifact input required';end if;
 select * into strict b from public.command_center_specialist_brains where owner_id=u and project_id=p_project for share;
 select * into strict p from public.command_center_project_profiles where owner_id=u and project_id=p_project for share;
 if b.control_plane is distinct from 'command_center' or b.cost_class is distinct from 'free'
 or b.brain_key is distinct from 'brain:'||p.company_id||':v1'
 or b.supported_project_ids is distinct from array[p_project] or b.supported_company_ids is distinct from array[p.company_id]
 or (b.permission_keys @> array['project:'||p_project||':tools.request']) is not true
 then raise exception 'Exact registered project tool authority required';end if;
 if not exists(select 1 from public.command_center_pc_worker_registrations w join public.command_center_members m on m.user_id=w.owner_id
 where w.owner_id=u and w.worker_id=p_worker and w.enabled and w.revoked_at is null and m.access_status='active' and m.revoked_at is null)
 then raise exception 'Paired worker not authorized';end if;
 s:=p_input::text;
 insert into public.command_center_pc_tool_jobs(invocation_id,owner_id,worker_id,project_id,company_id,brain_key,brain_version,action_key,input_text,input_hash)
 values(p_invocation,u,p_worker,p_project,p.company_id,b.brain_key,b.version,p_action,s,encode(sha256(convert_to(s,'UTF8')),'hex')) on conflict do nothing;
 select * into strict j from public.command_center_pc_tool_jobs where invocation_id=p_invocation;
 if j.owner_id<>u or j.worker_id<>p_worker or j.project_id<>p_project or j.company_id<>p.company_id or j.brain_version<>b.version
 or j.action_key<>p_action or j.input_text<>s then raise exception 'Invocation identity already bound';end if;
 return jsonb_build_object('invocationId',j.invocation_id,'state',j.state,'projectId',j.project_id,'companyBuildStarted',false);
end $$;
revoke all on function public.command_center_pc_enqueue_artifact_job(uuid,text,uuid,text,jsonb) from public,anon;
grant execute on function public.command_center_pc_enqueue_artifact_job(uuid,text,uuid,text,jsonb) to authenticated;

create or replace function public.command_center_pc_cancel_artifact_job(p_invocation uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_command_center_authorized() then raise exception 'Owner authorization required';end if;
 update public.command_center_pc_tool_jobs set state='cancelled' where invocation_id=p_invocation and owner_id=auth.uid() and state in ('queued','claimed');
 return found;
end $$;
revoke all on function public.command_center_pc_cancel_artifact_job(uuid) from public,anon;
grant execute on function public.command_center_pc_cancel_artifact_job(uuid) to authenticated;

create or replace function command_center_pc_private.command_center_pc_tool_exchange_service(p_owner uuid,p_worker uuid,p_action text,p_id uuid,p_fence bigint,p_result jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.command_center_pc_tool_jobs%rowtype;a jsonb;l jsonb;v record;h text;r jsonb;
begin
 perform 1 from public.command_center_pc_worker_registrations w join public.command_center_members m on m.user_id=w.owner_id
 where w.owner_id=p_owner and w.worker_id=p_worker and w.enabled and w.revoked_at is null and m.access_status='active' and m.revoked_at is null for share of w,m;
 if not found then raise exception 'Worker and owner authorization required';end if;
 if p_action not in ('next','current','commit','readback') or p_action is null then raise exception 'Unsupported tool exchange';end if;
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
 'accountRefs',jsonb_build_array('artifact:'||p_owner||':'||j.project_id),'reference','owner:explicit-artifact-job:'||j.invocation_id,'expiresAt',j.expires_at,'protectedActionAuthorized',false));
 return jsonb_build_object('saved',jsonb_build_object('invocationId',j.invocation_id,'taskId','pc-tool:'||j.invocation_id,'workerId',p_worker,'inputText',j.input_text,'action',a),'lease',l);
end $$;
revoke all on function command_center_pc_private.command_center_pc_tool_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function command_center_pc_private.command_center_pc_tool_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) to service_role;
create or replace function public.command_center_pc_tool_exchange_service(p_owner uuid,p_worker uuid,p_action text,p_id uuid,p_fence bigint,p_result jsonb)
returns jsonb language sql security invoker set search_path='' as $$select command_center_pc_private.command_center_pc_tool_exchange_service(p_owner,p_worker,p_action,p_id,p_fence,p_result)$$;
revoke all on function public.command_center_pc_tool_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.command_center_pc_tool_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) to service_role;
