-- Additive, bounded COMMAND CENTER -> specialist activation-only exchange lane.
-- Existing 128 diagnostic/artifact receipts, PC token, normal tool queue, all seven
-- stopped Agency runs and release controls are untouched. No business execution.
create table public.command_center_pc_activation_exchanges (
 exchange_id uuid primary key,
 owner_id uuid not null references auth.users(id),
 worker_id uuid not null references public.command_center_pc_worker_registrations(worker_id),
 parent_turn_id uuid not null,
 parent_response_hash text not null check(parent_response_hash ~ '^[a-f0-9]{64}$'),
 project_id text not null,
 company_id text not null,
 brain_key text not null,
 brain_version bigint not null,
 model_id text not null,
 expected_model_digest text not null check(expected_model_digest ~ '^[a-f0-9]{64}$'),
 nonce uuid not null,
 input_hash text not null check(input_hash ~ '^[a-f0-9]{64}$'),
 state text not null default 'queued' check(state in ('queued','claimed','completed','cancelled','uncertain')),
 fence bigint not null default 0,
 lease_expires_at timestamptz,
 expires_at timestamptz not null default now()+interval '6 hours',
 result jsonb,
 commit_id uuid unique,
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 unique(owner_id,project_id,brain_version),
 foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id),
 check((state='completed' and result is not null and commit_id is not null and completed_at is not null) or state<>'completed')
);
alter table public.command_center_pc_activation_exchanges enable row level security;
revoke all on public.command_center_pc_activation_exchanges from public,anon,authenticated,service_role;
grant select on public.command_center_pc_activation_exchanges to authenticated;
create policy pc_activation_exchange_owner_read on public.command_center_pc_activation_exchanges for select to authenticated
 using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function command_center_pc_private.command_center_pc_queue_activation_exchange_service(
 p_owner uuid,p_worker uuid,p_project text,p_parent_turn uuid,p_exchange uuid,p_authority text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.command_center_specialist_brains%rowtype;
 p public.command_center_project_profiles%rowtype;
 pr public.command_center_provider_registry%rowtype;
 q public.command_center_pc_inference_requests%rowtype;
 t public.command_center_brain_conversation_turns%rowtype;
 j public.command_center_pc_activation_exchanges%rowtype;
 n uuid;body text;h text;
begin
 if p_authority is distinct from 'evd_owner-command-center-brain-activation-20261105' or p_exchange is null or p_parent_turn is null
 then raise exception 'Exact existing owner activation authority required';end if;
 perform 1 from public.command_center_pc_worker_registrations w join public.command_center_members m on m.user_id=w.owner_id
 where w.owner_id=p_owner and w.worker_id=p_worker and w.enabled and w.revoked_at is null
 and w.last_seen_at>now()-interval '3 minutes' and m.access_status='active' and m.revoked_at is null for share of w,m;
 if not found then raise exception 'Live paired owner worker required';end if;
 select * into strict p from public.command_center_project_profiles where owner_id=p_owner and project_id=p_project for share;
 select * into strict b from public.command_center_specialist_brains where owner_id=p_owner and project_id=p_project for share;
 if b.control_plane is distinct from 'command_center' or b.cost_class is distinct from 'free' or
 b.brain_key is distinct from 'brain:'||p.company_id||':v1' or
 b.supported_project_ids is distinct from array[p_project] or b.supported_company_ids is distinct from array[p.company_id] or
 (b.permission_keys @> array['project:'||p_project||':inference.read_only']) is not true or
 ('provider:owner-pc:'||p_worker::text=any(b.provider_keys)) is not true or
 not ((p_project ~ '^project:company:future:(00[1-9]|0[1-9][0-9]|[1-9][0-9]{2,96})$' and p.company_id=substring(p_project from 9)) or
 (p_project ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and p.company_id='company:legacy:'||p_project and p.protected))
 then raise exception 'Exact Command Center target Brain authority required';end if;
 if not exists(select 1 from public.command_center_specialist_brain_versions v where v.owner_id=p_owner
  and v.specialist_id=b.specialist_id and v.version=b.version and
  v.authority_evidence_ids @> array[p_authority])
 then raise exception 'Version-bound owner activation authorization missing';end if;
 select * into strict t from public.command_center_brain_conversation_turns where owner_id=p_owner
 and turn_id=p_parent_turn and project_id is null and role='brain' and redaction_state='safe_text'
 and canonical_writes_authorized=false for share;
 if t.content_hash is distinct from encode(sha256(convert_to(t.safe_text,'UTF8')),'hex') or
 not exists(select 1 from public.command_center_pc_inference_requests x where x.owner_id=p_owner and x.project_id is null
 and x.state='completed' and x.brain_turn_id=t.turn_id and x.worker_id=p_worker and x.content_hash=t.content_hash)
 then raise exception 'Canonical central Brain parent response missing';end if;
 select * into strict pr from public.command_center_provider_registry where owner_id=p_owner
 and provider_key='provider:owner-pc:'||p_worker::text for share;
 if pr.enabled is distinct from true or pr.cost is distinct from 'free' or pr.health is distinct from 'available'
 or pr.verification is distinct from 'live_verified' or pr.configuration->>'execution_mode' is distinct from 'local-ollama'
 or pr.configuration->>'worker_id' is distinct from p_worker::text or
 pr.configuration->>'gateway_ref' is distinct from 'supabase:functions:command-center-pc-worker' or
 pr.configuration->'payment_authorized' is distinct from 'false'::jsonb or
 pr.configuration->'company_build_authorized' is distinct from 'false'::jsonb
 or not exists(select 1 from jsonb_array_elements(b.model_assignments) a
 where a->>'providerKey'=pr.provider_key and a->>'modelId'=pr.configuration->>'model_id')
 then raise exception 'Verified zero-cost local model route required';end if;
 select * into strict q from public.command_center_pc_inference_requests where owner_id=p_owner
 and worker_id=p_worker and project_id=p_project and state='completed' and activation_contract is not null
 and model_id=pr.configuration->>'model_id' and model_digest ~ '^[a-f0-9]{64}$'
 and route_snapshot->>'brainVersion'=b.version::text order by completed_at desc limit 1 for share;
 perform pg_advisory_xact_lock(hashtextextended('pc-exchange:'||p_owner||':'||p_project,0));
 select * into j from public.command_center_pc_activation_exchanges where owner_id=p_owner
 and project_id=p_project and brain_version=b.version;
 if found then
  if j.worker_id is distinct from p_worker or j.parent_turn_id is distinct from p_parent_turn
  then raise exception 'Existing exchange identity changed';end if;
  return jsonb_build_object('exchangeId',j.exchange_id,'state',j.state,'duplicate',true);
 end if;
 n:=gen_random_uuid();
 body:='{"exchangeId":"'||p_exchange::text||'","projectId":"'||p_project||'","companyId":"'||p.company_id||
 '","targetBrainKey":"'||b.brain_key||'","nonce":"'||n::text||'","parentResponseHash":"'||t.content_hash||'"}';
 h:=encode(sha256(convert_to(body,'UTF8')),'hex');
 insert into public.command_center_pc_activation_exchanges(exchange_id,owner_id,worker_id,parent_turn_id,parent_response_hash,
 project_id,company_id,brain_key,brain_version,model_id,expected_model_digest,nonce,input_hash)
 values(p_exchange,p_owner,p_worker,p_parent_turn,t.content_hash,p_project,p.company_id,b.brain_key,b.version,
 pr.configuration->>'model_id',q.model_digest,n,h);
 return jsonb_build_object('exchangeId',p_exchange,'state','queued','duplicate',false,'companyBuildStarted',false,'paidUsageAuthorized',false);
end $$;
revoke all on function command_center_pc_private.command_center_pc_queue_activation_exchange_service(uuid,uuid,text,uuid,uuid,text) from public,anon,authenticated;
grant execute on function command_center_pc_private.command_center_pc_queue_activation_exchange_service(uuid,uuid,text,uuid,uuid,text) to service_role;
create or replace function public.command_center_pc_queue_activation_exchange_service(
 p_owner uuid,p_worker uuid,p_project text,p_parent_turn uuid,p_exchange uuid,p_authority text)
returns jsonb language sql security invoker set search_path='' as $$
 select command_center_pc_private.command_center_pc_queue_activation_exchange_service($1,$2,$3,$4,$5,$6)
$$;
revoke all on function public.command_center_pc_queue_activation_exchange_service(uuid,uuid,text,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.command_center_pc_queue_activation_exchange_service(uuid,uuid,text,uuid,uuid,text) to service_role;

create or replace function command_center_pc_private.command_center_pc_activation_exchange_service(
 p_owner uuid,p_worker uuid,p_action text,p_exchange uuid,p_fence bigint,p_result jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.command_center_pc_activation_exchanges%rowtype;
 b public.command_center_specialist_brains%rowtype;
 pr public.command_center_provider_registry%rowtype;
 l jsonb;s jsonb;e jsonb;h text;receipt jsonb;body text;
begin
 if p_action not in ('next','current','commit','readback') or p_action is null then raise exception 'Unsupported activation exchange';end if;
 perform 1 from public.command_center_pc_worker_registrations w join public.command_center_members m on m.user_id=w.owner_id
 where w.owner_id=p_owner and w.worker_id=p_worker and w.enabled and w.revoked_at is null
 and m.access_status='active' and m.revoked_at is null for share of w,m;
 if not found then raise exception 'Activation exchange worker revoked';end if;
 if p_action='next' then
  update public.command_center_pc_activation_exchanges set state='uncertain'
  where owner_id=p_owner and worker_id=p_worker and state='claimed' and lease_expires_at<=now();
  select * into j from public.command_center_pc_activation_exchanges
  where owner_id=p_owner and worker_id=p_worker and state='queued' and expires_at>now()
  order by created_at,exchange_id limit 1 for update skip locked;
  if not found then return null;end if;
 else
  select * into j from public.command_center_pc_activation_exchanges
  where owner_id=p_owner and worker_id=p_worker and exchange_id=p_exchange for update;
  if not found or j.fence is distinct from p_fence then raise exception 'Exact activation exchange lease required';end if;
 end if;
 select * into strict b from public.command_center_specialist_brains where owner_id=p_owner and project_id=j.project_id for share;
 select * into strict pr from public.command_center_provider_registry where owner_id=p_owner
 and provider_key='provider:owner-pc:'||p_worker::text for share;
 if b.version is distinct from j.brain_version or b.brain_key is distinct from j.brain_key or
 b.control_plane is distinct from 'command_center' or b.cost_class is distinct from 'free' or
 b.supported_project_ids is distinct from array[j.project_id] or b.supported_company_ids is distinct from array[j.company_id] or
 pr.enabled is distinct from true or pr.health is distinct from 'available' or pr.cost is distinct from 'free' or
 pr.configuration->>'model_id' is distinct from j.model_id or
 not exists(select 1 from public.command_center_pc_inference_requests q where q.owner_id=p_owner
 and q.worker_id=p_worker and q.project_id=j.project_id and q.state='completed' and q.activation_contract is not null
 and q.model_id=j.model_id and q.model_digest=j.expected_model_digest)
 then raise exception 'Activation exchange scope or verified model route changed';end if;
 if j.state='completed' and p_action in ('readback','commit') then
  if p_action='commit' and j.result is distinct from p_result then raise exception 'Already committed exchange differs';end if;
 elsif j.expires_at<=now() or j.state in ('cancelled','uncertain') then raise exception 'Activation exchange expired or stopped';
 elsif p_action='next' then
  update public.command_center_pc_activation_exchanges set state='claimed',fence=fence+1,
   lease_expires_at=least(expires_at,now()+interval '150 seconds') where exchange_id=j.exchange_id returning * into j;
 elsif j.state<>'claimed' or j.lease_expires_at<=now() then raise exception 'Activation exchange lease expired';end if;
 l:=jsonb_build_object('exchangeId',j.exchange_id,'workerId',j.worker_id,'ownerId',j.owner_id,'projectId',j.project_id,
  'companyId',j.company_id,'targetBrainKey',j.brain_key,'brainVersion',j.brain_version,
  'generation',1,'fencingToken',j.fence,'expiresAt',to_char(j.lease_expires_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
 if p_action='current' then return jsonb_build_object('current',true);end if;
 if p_action='commit' and j.state<>'completed' then
  if jsonb_typeof(p_result) is distinct from 'object' or
   jsonb_typeof(p_result->'outputText') is distinct from 'string' or
   octet_length(p_result->>'outputText')>3000 then raise exception 'Exact activation exchange result required';end if;
  h:=encode(sha256(convert_to(p_result->>'outputText','UTF8')),'hex');
  e:=jsonb_build_object('exchangeId',j.exchange_id,'projectId',j.project_id,'companyId',j.company_id,
    'targetBrainKey',j.brain_key,'nonce',j.nonce,'parentResponseHash',j.parent_response_hash,
    'accepted',true,'companyBuildStarted',false,'paidUsageAuthorized',false);
  if btrim(p_result->>'outputText')::jsonb is distinct from e or
   p_result is distinct from jsonb_build_object('exchangeId',j.exchange_id,'workerId',j.worker_id,
    'ownerId',j.owner_id,'projectId',j.project_id,'companyId',j.company_id,
    'targetBrainKey',j.brain_key,'brainVersion',j.brain_version,'generation',1,'fencingToken',j.fence,
    'modelId',j.model_id,'modelDigest',j.expected_model_digest,'inputHash',j.input_hash,
    'outputText',p_result->>'outputText','outputHash',h,
    'companyBuildStarted',false,'paidUsageAuthorized',false,'generalToolsExecuted',false)
  then raise exception 'Activation exchange proof, model, identity or output hash mismatch';end if;
  update public.command_center_pc_activation_exchanges
  set state='completed',result=p_result,commit_id=gen_random_uuid(),completed_at=now()
  where exchange_id=j.exchange_id returning * into j;
 end if;
 if p_action in ('commit','readback') then
  if j.state<>'completed' then raise exception 'Canonical activation exchange not completed';end if;
  receipt:=j.result||jsonb_build_object('commitId',j.commit_id,'canonicalCommitVerified',true,
     'parentTurnId',j.parent_turn_id,'parentResponseHash',j.parent_response_hash);
  return jsonb_build_object('receipt',receipt);
 end if;
 s:=jsonb_build_object('exchangeId',j.exchange_id,'workerId',j.worker_id,'ownerId',j.owner_id,
  'projectId',j.project_id,'companyId',j.company_id,'targetBrainKey',j.brain_key,'brainVersion',j.brain_version,
  'parentBrainKey','command_center','controlPlane','command_center','purpose','activation_exchange',
  'authorityRef','evd_owner-command-center-brain-activation-20261105','nonce',j.nonce,
  'parentResponseHash',j.parent_response_hash,'modelId',j.model_id,'expectedModelDigest',j.expected_model_digest,
  'inputHash',j.input_hash,'allowPaid',false,'allowProtected',false,
  'companyBuildAuthorized',false,'companyExecutionAuthorized',false,'generalToolsAuthorized',false);
 return jsonb_build_object('saved',s,'lease',l);
end $$;
revoke all on function command_center_pc_private.command_center_pc_activation_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function command_center_pc_private.command_center_pc_activation_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) to service_role;
create or replace function public.command_center_pc_activation_exchange_service(
 p_owner uuid,p_worker uuid,p_action text,p_exchange uuid,p_fence bigint,p_result jsonb)
returns jsonb language sql security invoker set search_path='' as $$
 select command_center_pc_private.command_center_pc_activation_exchange_service($1,$2,$3,$4,$5,$6)
$$;
revoke all on function public.command_center_pc_activation_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.command_center_pc_activation_exchange_service(uuid,uuid,text,uuid,bigint,jsonb) to service_role;