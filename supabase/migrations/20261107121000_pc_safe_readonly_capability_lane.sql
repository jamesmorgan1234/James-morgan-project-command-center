-- COMMAND CENTER safe-tool protocol v1.
-- Isolated from 128 completed PC artifact/activation/inference lanes.
-- Allowed effects: compile-only JavaScript syntax validation, allowlisted public documentation GET.
-- No shell, code execution, repo write, paid service, browser session, company run or account access.
create table if not exists public.command_center_pc_safe_tool_jobs (
  job_id uuid primary key,
  owner_id uuid not null references auth.users(id),
  worker_id uuid not null references public.command_center_pc_worker_registrations(worker_id),
  project_id text not null,
  company_id text not null,
  brain_key text not null,
  brain_version bigint not null check(brain_version>0),
  action_key text not null check(action_key in ('code.js_syntax_check','research.public_docs_read')),
  input_text text not null check(length(input_text) between 2 and 16000),
  input_hash text not null check(input_hash ~ '^[a-f0-9]{64}$'),
  state text not null default 'queued' check(state in ('queued','claimed','completed','cancelled','uncertain')),
  fence bigint not null default 0 check(fence>=0),
  lease_expires_at timestamptz,
  expires_at timestamptz not null default (now()+interval '20 minutes'),
  result jsonb,
  commit_id uuid unique,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint cc_safe_job_project_fk foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id),
  constraint cc_safe_completed_receipt check(state<>'completed' or (result is not null and commit_id is not null and completed_at is not null)),
  constraint cc_safe_readonly_commit check(result is null or (result->'paidUsageAuthorized'='false'::jsonb and result->'companyBuildStarted'='false'::jsonb))
);
create index if not exists cc_pc_safe_jobs_queue on public.command_center_pc_safe_tool_jobs(owner_id,worker_id,state,created_at);
alter table public.command_center_pc_safe_tool_jobs enable row level security;
revoke all on public.command_center_pc_safe_tool_jobs from public,anon,authenticated;
grant select on public.command_center_pc_safe_tool_jobs to authenticated;
create policy cc_safe_tool_owner_read on public.command_center_pc_safe_tool_jobs for select to authenticated
  using(owner_id=auth.uid() and public.is_command_center_authorized());

create or replace function public.command_center_pc_safe_tool_enqueue(
  p_job uuid,p_project text,p_action text,p_input text
) returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $func$
declare
  u uuid:=auth.uid(); w uuid:='737f5e7c-3884-4c61-81ac-634bdfc4828f';
  p record; b record; existing record; digest_hex text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'owner_auth_required'; end if;
  if p_job is null or p_project is null or length(p_project)>240
      or p_action not in ('code.js_syntax_check','research.public_docs_read')
      or p_input is null or length(p_input)>16000 then raise exception 'safe_tool_request_invalid'; end if;
  digest_hex:=encode(sha256(convert_to(p_input,'UTF8')),'hex');
  if left(trim(p_input),1)<>'{' or jsonb_typeof(p_input::jsonb)<>'object' then raise exception 'safe_tool_input_invalid';end if;
  if p_action='code.js_syntax_check' then
    if (p_input::jsonb-'source')<>'{}'::jsonb
       or jsonb_typeof(p_input::jsonb->'source')<>'string'
       or length(p_input::jsonb->>'source')>12000 then raise exception 'safe_tool_input_invalid';end if;
  else
    if (p_input::jsonb-'url')<>'{}'::jsonb
       or jsonb_typeof(p_input::jsonb->'url')<>'string'
       or length(p_input::jsonb->>'url')>700 then raise exception 'safe_tool_input_invalid';end if;
  end if;
  select project_id,company_id,protected into p
    from public.command_center_project_profiles
    where owner_id=u and project_id=p_project;
  if not found then raise exception 'project_not_owned';end if;
  select brain_key,version,provider_keys into b
    from public.command_center_specialist_brains
    where owner_id=u and project_id=p_project and control_plane='command_center'
      and cost_class='free' and brain_key='brain:'||p.company_id||':v1'
      and supported_project_ids=array[p_project] and supported_company_ids=array[p.company_id];
  if not found or not ('provider:owner-pc:'||w::text)=any(b.provider_keys) then raise exception 'specialist_not_bound';end if;
  if not exists(select 1 from public.command_center_pc_worker_registrations
      where owner_id=u and worker_id=w and enabled and revoked_at is null and last_seen_at>now()-interval '5 minutes') then
    raise exception 'owner_pc_unavailable';end if;
  if not exists(select 1 from public.command_center_pc_activation_exchanges
      where owner_id=u and worker_id=w and project_id=p_project
        and brain_key=b.brain_key and brain_version=b.version and state='completed'
        and commit_id is not null) then raise exception 'bounded_activation_unverified';end if;
  select * into existing from public.command_center_pc_safe_tool_jobs where job_id=p_job;
  if found then
    if existing.owner_id<>u or existing.project_id<>p_project or existing.worker_id<>w
       or existing.action_key<>p_action or existing.input_hash<>digest_hex or existing.input_text<>p_input
       then raise exception 'idempotency_conflict';end if;
    return jsonb_build_object('jobId',existing.job_id,'state',existing.state,'duplicate',true,'executionVerified',existing.state='completed');
  end if;
  if (select count(*) from public.command_center_pc_safe_tool_jobs where owner_id=u and worker_id=w and state in ('queued','claimed'))>=5 then
    raise exception 'safe_tool_queue_full';end if;
  insert into public.command_center_pc_safe_tool_jobs(job_id,owner_id,worker_id,project_id,company_id,brain_key,brain_version,action_key,input_text,input_hash)
    values(p_job,u,w,p_project,p.company_id,b.brain_key,b.version,p_action,p_input,digest_hex);
  return jsonb_build_object('jobId',p_job,'state','queued','duplicate',false,'executionVerified',false,
    'projectId',p_project,'actionKey',p_action,'paidUsageAuthorized',false,'companyBuildStarted',false);
end $func$;
revoke all on function public.command_center_pc_safe_tool_enqueue(uuid,text,text,text) from public,anon;
grant execute on function public.command_center_pc_safe_tool_enqueue(uuid,text,text,text) to authenticated;

create or replace function public.command_center_pc_safe_tool_cancel(p_job uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $func$
declare u uuid:=auth.uid(); rowrecord record;
begin
 if u is null or not public.is_command_center_authorized() then raise exception 'owner_auth_required';end if;
 update public.command_center_pc_safe_tool_jobs set state='cancelled'
 where job_id=p_job and owner_id=u and state='queued'
 returning * into rowrecord;
 if found then return jsonb_build_object('jobId',p_job,'state','cancelled','executionVerified',false);end if;
 select * into rowrecord from public.command_center_pc_safe_tool_jobs where job_id=p_job and owner_id=u;
 if not found then raise exception 'safe_tool_job_not_found';end if;
 return jsonb_build_object('jobId',p_job,'state',rowrecord.state,'executionVerified',rowrecord.state='completed');
end $func$;
revoke all on function public.command_center_pc_safe_tool_cancel(uuid) from public,anon;
grant execute on function public.command_center_pc_safe_tool_cancel(uuid) to authenticated;

create or replace function public.command_center_pc_safe_tool_worker_service(
 p_owner uuid,p_worker uuid,p_action text,p_job uuid,p_fence bigint,p_result jsonb
) returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $func$
declare j public.command_center_pc_safe_tool_jobs%rowtype; commit_uuid uuid;
begin
 if not exists(select 1 from public.command_center_pc_worker_registrations
   where owner_id=p_owner and worker_id=p_worker and enabled and revoked_at is null)
 then raise exception 'worker_not_authorized';end if;
 if p_action='next' then
   perform pg_advisory_xact_lock(hashtextextended('cc-pc-safe-tool:'||p_worker::text,0));
   update public.command_center_pc_safe_tool_jobs set state='uncertain'
    where owner_id=p_owner and worker_id=p_worker and state='claimed' and lease_expires_at<=now();
   update public.command_center_pc_safe_tool_jobs set state='cancelled'
    where owner_id=p_owner and worker_id=p_worker and state='queued' and expires_at<=now();
   if exists(select 1 from public.command_center_pc_safe_tool_jobs
      where owner_id=p_owner and worker_id=p_worker and state in ('claimed','uncertain'))
      then return null;end if;
   select * into j from public.command_center_pc_safe_tool_jobs
     where owner_id=p_owner and worker_id=p_worker and state='queued' and expires_at>now()
     order by created_at,job_id for update skip locked limit 1;
   if not found then return null;end if;
   update public.command_center_pc_safe_tool_jobs set state='claimed',fence=fence+1,
     lease_expires_at=now()+interval '3 minutes'
     where job_id=j.job_id returning * into j;
   return jsonb_build_object(
      'saved',jsonb_build_object('jobId',j.job_id,'ownerId',j.owner_id,'workerId',j.worker_id,
        'projectId',j.project_id,'companyId',j.company_id,'brainKey',j.brain_key,
        'brainVersion',j.brain_version,'actionKey',j.action_key,'inputText',j.input_text,
        'inputHash',j.input_hash,'toolVersion','safe-readonly-v1'),
      'lease',jsonb_build_object('jobId',j.job_id,'ownerId',j.owner_id,'workerId',j.worker_id,
        'projectId',j.project_id,'companyId',j.company_id,'actionKey',j.action_key,
        'fencingToken',j.fence,'generation',1,'expiresAt',j.lease_expires_at));
 end if;
 if p_job is null or p_fence is null then raise exception 'safe_tool_fence_required';end if;
 select * into j from public.command_center_pc_safe_tool_jobs where owner_id=p_owner and worker_id=p_worker
     and job_id=p_job and fence=p_fence for update;
 if not found then raise exception 'safe_tool_claim_missing';end if;
 if p_action='current' then
   return jsonb_build_object('current',j.state='claimed' and j.lease_expires_at>now());
 end if;
 if p_action='commit' then
   if j.state='completed' then
     if j.result=p_result then return jsonb_build_object('committed',true,'duplicate',true);end if;
     raise exception 'safe_tool_commit_conflict';
   end if;
   if j.state<>'claimed' or j.lease_expires_at<=now() then raise exception 'safe_tool_claim_expired';end if;
   if p_result is null or jsonb_typeof(p_result)<>'object'
      or p_result->>'jobId'<>j.job_id::text
      or p_result->>'ownerId'<>j.owner_id::text
      or p_result->>'workerId'<>j.worker_id::text
      or p_result->>'projectId'<>j.project_id
      or p_result->>'companyId'<>j.company_id
      or p_result->>'brainKey'<>j.brain_key
      or p_result->>'brainVersion'<>j.brain_version::text
      or p_result->>'actionKey'<>j.action_key
      or p_result->>'toolVersion'<>'safe-readonly-v1'
      or p_result->>'inputHash'<>j.input_hash
      or p_result->>'fencingToken'<>j.fence::text
      or p_result->>'generation'<>'1'
      or jsonb_typeof(p_result->'outputText') IS DISTINCT FROM 'string'
      or jsonb_typeof(p_result->'outputHash') IS DISTINCT FROM 'string'
      or p_result->>'outputHash' !~ '^[a-f0-9]{64}$'
      or (p_result - array['jobId','ownerId','workerId','projectId','companyId','brainKey',
          'brainVersion','actionKey','toolVersion','inputHash','fencingToken','generation',
          'outputText','outputHash','paidUsageAuthorized','companyBuildStarted',
          'generalCompanyExecution']) <> '{}'::jsonb
      or p_result->'paidUsageAuthorized'<>'false'::jsonb
      or p_result->'companyBuildStarted'<>'false'::jsonb
      or p_result->'generalCompanyExecution'<>'false'::jsonb
      or length(p_result->>'outputText')>120000
      or p_result->>'outputHash'<>encode(sha256(convert_to(p_result->>'outputText','UTF8')),'hex')
      then raise exception 'safe_tool_result_invalid';end if;
   commit_uuid:=gen_random_uuid();
   update public.command_center_pc_safe_tool_jobs
     set state='completed',result=p_result,commit_id=commit_uuid,completed_at=now()
     where job_id=j.job_id and state='claimed' and fence=j.fence;
   if not found then raise exception 'safe_tool_commit_race';end if;
   return jsonb_build_object('committed',true,'commitId',commit_uuid);
 end if;
 if p_action='readback' then
   return jsonb_build_object('jobId',j.job_id,'state',j.state,'fencingToken',j.fence,
     'commitId',j.commit_id,'result',j.result,'canonicalCommitVerified',
      j.state='completed' and j.commit_id is not null and j.completed_at is not null
      and j.result->>'outputHash'=encode(sha256(convert_to(j.result->>'outputText','UTF8')),'hex'));
 end if;
 raise exception 'safe_tool_action_invalid';
end $func$;
revoke all on function public.command_center_pc_safe_tool_worker_service(uuid,uuid,text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.command_center_pc_safe_tool_worker_service(uuid,uuid,text,uuid,bigint,jsonb) to service_role;
