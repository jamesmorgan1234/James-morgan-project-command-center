-- Agent Mode background runner gateway.
-- Service-role only. Browser roles cannot invoke these functions.

create or replace function public.command_center_agent_service_owner_active(p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists(
    select 1 from public.command_center_members m
    where m.user_id=p_owner_id
      and m.access_status='active'
      and m.revoked_at is null
  );
$$;

create or replace function public.command_center_agent_service_list_runnable(p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare outj jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'session_id',s.id,
    'owner_id',s.owner_id,
    'objective',s.objective,
    'scope_mode',s.scope_mode,
    'primary_project_id',s.primary_project_id,
    'current_project_id',s.current_project_id,
    'current_step_id',s.current_step_id,
    'status',s.status,
    'dry_run',s.dry_run,
    'pause_requested',s.pause_requested,
    'cancel_requested',s.cancel_requested,
    'exact_next_action',s.exact_next_action,
    'permission_envelope',s.permission_envelope,
    'execution_policy',s.execution_policy,
    'updated_at',s.updated_at
  ) order by s.updated_at), '[]'::jsonb)
  into outj
  from (
    select x.*
    from public.agent_sessions x
    where x.status in ('draft','active','blocked','needs_user_action','partially_completed')
      and not x.cancel_requested
      and public.command_center_agent_service_owner_active(x.owner_id)
    order by case when x.status='active' then 0 when x.status='draft' then 1 else 2 end,x.updated_at
    limit greatest(1,least(coalesce(p_limit,20),100))
  ) s;
  return outj;
end $$;

create or replace function public.command_center_agent_service_status(p_owner_id uuid,p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare s public.agent_sessions%rowtype; pj jsonb; sj jsonb; hj jsonb; bj jsonb; cp jsonb; begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=p_owner_id;
  if not found then raise exception 'Agent session not found'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('project_id',project_id,'role',project_role,'state',state,'books_target',books_target) order by sort_order),'[]'::jsonb) into pj from public.agent_session_projects where session_id=s.id and owner_id=p_owner_id;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'project_id',project_id,'step_key',step_key,'title',title,'details',details,'position',position,'dependencies',dependencies,'route',route,'tool_category',tool_category,'scope_class',scope_class,'model_rung',model_rung,'risk_class',risk_class,'impact_radius',impact_radius,'side_effect',side_effect,'protected_boundary',protected_boundary,'status',status,'verification_required',verification_required,'downstream_kind',downstream_kind,'downstream_ref',downstream_ref,'failure_class',last_failure_class,'retry_count',retry_count,'meaningful_failure_count',meaningful_failure_count,'metadata',metadata) order by position,created_at),'[]'::jsonb) into sj from public.agent_steps where session_id=s.id and owner_id=p_owner_id;
  select coalesce(jsonb_agg(jsonb_build_object('handoff_id',id,'project_id',project_id,'step_id',step_id,'provider',provider,'operation_key',operation_key,'model_rung',model_rung,'scope_class',scope_class,'risk_class',risk_class,'approval_state',approval_state,'state',state,'failure_class',failure_class,'normal_chat_resumed',normal_chat_resumed,'bounded_instructions',bounded_instructions,'forbidden_actions',forbidden_actions,'expected_evidence',expected_evidence) order by created_at desc),'[]'::jsonb) into hj from public.agent_work_handoffs where session_id=s.id and owner_id=p_owner_id;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'type',breaker_type,'scope_key',scope_key,'provider',provider,'reason',reason,'failure_count',failure_count,'status',status) order by opened_at desc),'[]'::jsonb) into bj from public.agent_circuit_breakers where owner_id=p_owner_id and (session_id=s.id or (session_id is null and status='open'));
  select jsonb_build_object('id',id,'created_at',created_at,'exact_next_action',exact_next_action,'progress_hash',progress_hash) into cp from public.agent_checkpoints where owner_id=p_owner_id and session_id=s.id order by created_at desc limit 1;
  return jsonb_build_object('session',to_jsonb(s)-'owner_id','projects',pj,'steps',sj,'work_queue',hj,'circuit_breakers',bj,'latest_checkpoint',cp);
end $$;

create or replace function public.command_center_agent_service_add_step(
  p_owner_id uuid,p_session_id uuid,p_project_id text,p_step_key text,p_title text,p_details text,p_route text,p_tool_category text,
  p_scope_class text default 'small',p_model_rung text default null,p_risk_class text default 'low',p_impact_radius text default 'local_unit',
  p_side_effect boolean default false,p_protected_boundary boolean default false,p_verification_required text default 'tool_result',
  p_dependencies uuid[] default '{}'::uuid[],p_idempotency_key text default null,p_downstream_kind text default null,p_downstream_ref text default null,
  p_position integer default null,p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare s public.agent_sessions%rowtype; sid uuid; pos integer; begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=p_owner_id for update;
  if not found then raise exception 'Agent session not found'; end if;
  if s.status not in ('draft','active','paused') then raise exception 'Session cannot accept steps in state %',s.status; end if;
  if not exists(select 1 from public.agent_session_projects sp where sp.session_id=s.id and sp.owner_id=p_owner_id and sp.project_id=p_project_id and sp.state<>'excluded') then raise exception 'Step project is outside explicit session scope'; end if;
  if coalesce(btrim(p_step_key),'')='' or coalesce(btrim(p_title),'')='' or coalesce(btrim(p_tool_category),'')='' then raise exception 'Step key, title and tool category are required'; end if;
  if p_route not in ('normal_chat','automation','integration','work','user_only') then raise exception 'Unsupported Agent route'; end if;
  if p_scope_class not in ('micro','small','moderate','substantial') then raise exception 'Invalid scope class'; end if;
  if p_risk_class not in ('low','medium','high','protected') then raise exception 'Invalid risk class'; end if;
  if p_impact_radius not in ('local_unit','single_project','multi_project','public_or_account','portfolio_wide') then raise exception 'Invalid impact radius'; end if;
  if p_verification_required not in ('tool_result','canonical_record','live_verified') then raise exception 'Invalid verification requirement'; end if;
  if not (coalesce(s.permission_envelope->'allowed_tool_categories','[]'::jsonb) ? p_tool_category) then raise exception 'Tool category is outside the session permission envelope'; end if;
  if p_route='work' then
    if coalesce((s.permission_envelope->>'allow_work')::boolean,false) is not true then raise exception 'Work is not allowed by this session'; end if;
    if p_model_rung not in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium') then raise exception 'Invalid or prohibited Work model rung'; end if;
  elsif p_model_rung is not null then raise exception 'Model rung is valid only for Work steps'; end if;
  if p_dependencies is not null and exists(select 1 from unnest(p_dependencies) d(id) left join public.agent_steps ds on ds.id=d.id and ds.session_id=s.id and ds.owner_id=p_owner_id where ds.id is null) then raise exception 'Dependency is outside this session'; end if;
  select coalesce(p_position,coalesce(max(position),-1)+1) into pos from public.agent_steps where session_id=s.id and owner_id=p_owner_id;
  insert into public.agent_steps(owner_id,session_id,project_id,step_key,title,details,position,dependencies,route,tool_category,scope_class,model_rung,risk_class,impact_radius,side_effect,protected_boundary,verification_required,idempotency_key,downstream_kind,downstream_ref,metadata)
  values(p_owner_id,s.id,p_project_id,btrim(p_step_key),btrim(p_title),coalesce(p_details,''),pos,coalesce(p_dependencies,'{}'::uuid[]),p_route,p_tool_category,p_scope_class,p_model_rung,p_risk_class,p_impact_radius,coalesce(p_side_effect,false),coalesce(p_protected_boundary,false),p_verification_required,nullif(btrim(p_idempotency_key),''),p_downstream_kind,p_downstream_ref,coalesce(p_metadata,'{}'::jsonb)) returning id into sid;
  return sid;
end $$;

create or replace function public.command_center_agent_service_start_session(p_owner_id uuid,p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare s public.agent_sessions%rowtype; nxt public.agent_steps%rowtype; begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=p_owner_id for update;
  if not found then raise exception 'Agent session not found'; end if;
  if s.status<>'draft' then raise exception 'Only draft sessions can be started'; end if;
  select * into nxt from public.agent_steps where session_id=s.id and owner_id=p_owner_id and status='pending' order by (project_id=s.primary_project_id) desc,position,created_at limit 1;
  if not found then raise exception 'Agent session has no executable steps'; end if;
  update public.agent_sessions set status='active',started_at=coalesce(started_at,now()),current_project_id=nxt.project_id,current_step_id=nxt.id,exact_next_action=nxt.title where id=s.id;
  update public.agent_session_projects set state=case when project_id=nxt.project_id then 'active' else state end where session_id=s.id and owner_id=p_owner_id;
  perform public.command_center_agent_log_event(p_owner_id,s.id,nxt.project_id,nxt.id,'session_started','Agent session started by service runner','{}'::jsonb);
  return jsonb_build_object('ok',true,'session_id',s.id,'current_step_id',nxt.id);
end $$;

create or replace function public.command_center_agent_service_begin_step(p_owner_id uuid,p_step_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare st public.agent_steps%rowtype; s public.agent_sessions%rowtype; auth_ok boolean; begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=p_owner_id for update; if not found then raise exception 'Agent step not found'; end if;
  select * into s from public.agent_sessions where id=st.session_id and owner_id=p_owner_id for update; if not found then raise exception 'Agent session not found'; end if;
  if s.status<>'active' or s.pause_requested or s.cancel_requested then raise exception 'Agent session is not eligible to begin a step'; end if;
  if st.status<>'pending' then raise exception 'Agent step is not pending'; end if;
  if st.route='work' then raise exception 'Work-routed steps must use the Work handoff gate'; end if;
  if exists(select 1 from unnest(st.dependencies) d(id) left join public.agent_steps ds on ds.id=d.id and ds.session_id=s.id and ds.owner_id=p_owner_id where ds.id is null or ds.status<>'verified') then raise exception 'Dependencies are not verified'; end if;
  if s.dry_run and st.side_effect then raise exception 'Dry-run session cannot begin a side effect'; end if;
  if st.protected_boundary or st.risk_class in ('high','protected') then
    select exists(select 1 from public.security_action_authorizations a where a.id=st.authorization_id and a.owner_id=p_owner_id and a.status='authorized' and a.resource_type='agent_step' and a.resource_id=st.id::text and (a.expires_at is null or a.expires_at>now())) into auth_ok;
    if not auth_ok then raise exception 'Protected Agent step requires valid Security authorization'; end if;
  end if;
  if st.route='user_only' then
    update public.agent_steps set status='needs_user_action' where id=st.id;
    update public.agent_sessions set status='needs_user_action',current_project_id=st.project_id,current_step_id=st.id,exact_next_action=st.title where id=s.id;
    update public.agent_session_projects set state='needs_user_action' where session_id=s.id and owner_id=p_owner_id and project_id=st.project_id;
    return jsonb_build_object('ok',false,'needs_user_action',true,'step_id',st.id);
  end if;
  update public.agent_steps set status='running',started_at=coalesce(started_at,now()) where id=st.id;
  update public.agent_sessions set current_project_id=st.project_id,current_step_id=st.id,exact_next_action=st.title where id=s.id;
  perform public.command_center_agent_log_event(p_owner_id,s.id,st.project_id,st.id,'step_started','Agent step started by service runner',jsonb_build_object('route',st.route));
  return jsonb_build_object('ok',true,'step_id',st.id,'route',st.route,'downstream_kind',st.downstream_kind,'downstream_ref',st.downstream_ref);
end $$;

create or replace function public.command_center_agent_service_add_evidence(p_owner_id uuid,p_step_id uuid,p_strength text,p_evidence_kind text,p_evidence_ref text default null,p_evidence jsonb default '{}'::jsonb,p_verified boolean default false,p_verified_by text default null)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare st public.agent_steps%rowtype; eid uuid; begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=p_owner_id; if not found then raise exception 'Agent step not found'; end if;
  if p_strength not in ('self_report_only','tool_result','canonical_record','live_verified') then raise exception 'Invalid evidence strength'; end if;
  if coalesce(btrim(p_evidence_kind),'')='' then raise exception 'Evidence kind is required'; end if;
  if p_strength in ('canonical_record','live_verified') and coalesce(btrim(p_evidence_ref),'')='' then raise exception 'Canonical/live evidence requires a concrete reference'; end if;
  if coalesce(p_verified,false) and p_strength='self_report_only' then raise exception 'Self-report evidence cannot satisfy verification'; end if;
  insert into public.agent_step_evidence(owner_id,session_id,step_id,strength,evidence_kind,evidence_ref,evidence,verified,verified_by,verified_at)
  values(p_owner_id,st.session_id,st.id,p_strength,btrim(p_evidence_kind),nullif(btrim(p_evidence_ref),''),coalesce(p_evidence,'{}'::jsonb),coalesce(p_verified,false),case when p_verified then coalesce(nullif(btrim(p_verified_by),''),'service_runner') end,case when p_verified then now() end) returning id into eid;
  return eid;
end $$;

create or replace function public.command_center_agent_service_verify_step(p_owner_id uuid,p_step_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare st public.agent_steps%rowtype; s public.agent_sessions%rowtype; req integer; got integer; nxt public.agent_steps%rowtype; remaining integer; begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=p_owner_id for update; if not found then raise exception 'Agent step not found'; end if;
  select * into s from public.agent_sessions where id=st.session_id and owner_id=p_owner_id for update;
  req:=public.command_center_agent_strength_rank(st.verification_required);
  select coalesce(max(public.command_center_agent_strength_rank(e.strength)),-1) into got from public.agent_step_evidence e where e.owner_id=p_owner_id and e.step_id=st.id and e.verified;
  if got<req then raise exception 'Verification gate not satisfied'; end if;
  update public.agent_steps set status='verified',verified_at=now(),completed_at=coalesce(completed_at,now()) where id=st.id;
  update public.agent_work_handoffs set state='verified' where owner_id=p_owner_id and step_id=st.id and state='returned';
  perform public.command_center_agent_log_event(p_owner_id,s.id,st.project_id,st.id,'step_verified','Agent step verified by service runner',jsonb_build_object('required',st.verification_required));
  select count(*) into remaining from public.agent_steps where session_id=s.id and owner_id=p_owner_id and status not in ('verified','skipped','canceled');
  if remaining=0 then
    update public.agent_sessions set status='completed',completed_at=now(),current_step_id=null,exact_next_action=null where id=s.id;
    update public.agent_session_projects set state='completed' where session_id=s.id and owner_id=p_owner_id;
    return jsonb_build_object('ok',true,'session_completed',true,'step_id',st.id);
  end if;
  select * into nxt from public.agent_steps cand where cand.session_id=s.id and cand.owner_id=p_owner_id and cand.status='pending' and not exists(select 1 from unnest(cand.dependencies) d(id) left join public.agent_steps ds on ds.id=d.id and ds.owner_id=p_owner_id and ds.session_id=s.id where ds.id is null or ds.status<>'verified') order by (cand.project_id=st.project_id) desc,(cand.project_id=s.primary_project_id) desc,cand.position,cand.created_at limit 1;
  if found then update public.agent_sessions set status=case when pause_requested then 'paused' when cancel_requested then 'canceled' else 'active' end,current_project_id=nxt.project_id,current_step_id=nxt.id,exact_next_action=nxt.title where id=s.id;
  else update public.agent_sessions set current_step_id=null,status=case when pause_requested then 'paused' when cancel_requested then 'canceled' when exists(select 1 from public.agent_steps x where x.session_id=s.id and x.owner_id=p_owner_id and x.status='needs_user_action') then 'needs_user_action' else 'blocked' end where id=s.id; end if;
  return jsonb_build_object('ok',true,'session_completed',false,'step_id',st.id,'next_step_id',case when nxt.id is null then null else nxt.id end);
end $$;

create or replace function public.command_center_agent_service_checkpoint(p_owner_id uuid,p_session_id uuid,p_exact_next_action text default null,p_forbidden_actions jsonb default '[]'::jsonb)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare s public.agent_sessions%rowtype; cid uuid; v uuid[]; f uuid[]; b uuid[]; scopej jsonb; workj jsonb; retryj jsonb; evj jsonb; ph text; same_count integer; begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=p_owner_id for update; if not found then raise exception 'Agent session not found'; end if;
  select coalesce(array_agg(id order by position) filter(where status='verified'),'{}'::uuid[]),coalesce(array_agg(id order by position) filter(where status='failed'),'{}'::uuid[]),coalesce(array_agg(id order by position) filter(where status in ('blocked','needs_user_action')),'{}'::uuid[]) into v,f,b from public.agent_steps where session_id=s.id and owner_id=p_owner_id;
  select coalesce(jsonb_agg(jsonb_build_object('project_id',project_id,'state',state,'books_target',books_target) order by sort_order),'[]'::jsonb) into scopej from public.agent_session_projects where session_id=s.id and owner_id=p_owner_id;
  select jsonb_build_object('handoffs',coalesce(jsonb_agg(jsonb_build_object('id',id,'step_id',step_id,'state',state,'model_rung',model_rung)),'[]'::jsonb),'in_progress',count(*) filter(where state='in_progress')) into workj from public.agent_work_handoffs where session_id=s.id and owner_id=p_owner_id;
  retryj:=jsonb_build_object('open_breakers',coalesce((select jsonb_agg(jsonb_build_object('id',id,'type',breaker_type,'reason',reason)) from public.agent_circuit_breakers where owner_id=p_owner_id and status='open' and (session_id=s.id or session_id is null)),'[]'::jsonb));
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'step_id',step_id,'strength',strength,'verified',verified)),'[]'::jsonb) into evj from public.agent_step_evidence where session_id=s.id and owner_id=p_owner_id;
  ph:=md5(jsonb_build_object('status',s.status,'project',s.current_project_id,'step',s.current_step_id,'verified',v,'failed',f,'blocked',b,'scope',scopej,'next',coalesce(p_exact_next_action,s.exact_next_action))::text);
  insert into public.agent_checkpoints(owner_id,session_id,project_id,step_id,session_status,objective,project_scope,permission_envelope,verified_step_ids,failed_step_ids,blocked_step_ids,work_state,retry_state,evidence_refs,exact_next_action,forbidden_actions,progress_hash)
  values(p_owner_id,s.id,s.current_project_id,s.current_step_id,s.status,s.objective,scopej,s.permission_envelope,v,f,b,coalesce(workj,'{}'::jsonb),retryj,coalesce(evj,'[]'::jsonb),coalesce(p_exact_next_action,s.exact_next_action),coalesce(p_forbidden_actions,'[]'::jsonb),ph) returning id into cid;
  update public.agent_sessions set latest_checkpoint_id=cid,exact_next_action=coalesce(p_exact_next_action,exact_next_action) where id=s.id;
  select count(*) into same_count from (select progress_hash from public.agent_checkpoints where session_id=s.id and owner_id=p_owner_id order by created_at desc limit 3) q where progress_hash=ph;
  if s.status='active' and same_count>=3 then
    insert into public.agent_circuit_breakers(owner_id,session_id,project_id,step_id,breaker_type,scope_key,status,reason,state_hash) values(p_owner_id,s.id,s.current_project_id,s.current_step_id,'no_progress','session:'||s.id::text,'open','Three consecutive checkpoints produced no meaningful progress',ph)
    on conflict(owner_id,breaker_type,scope_key) where status='open' do update set reason=excluded.reason,state_hash=excluded.state_hash;
    update public.agent_sessions set status='paused',pause_requested=true,paused_at=now() where id=s.id;
  end if;
  return cid;
end $$;

revoke execute on function public.command_center_agent_service_owner_active(uuid) from public,anon,authenticated;
revoke execute on function public.command_center_agent_service_list_runnable(integer) from public,anon,authenticated;
revoke execute on function public.command_center_agent_service_status(uuid,uuid) from public,anon,authenticated;
revoke execute on function public.command_center_agent_service_add_step(uuid,uuid,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text,uuid[],text,text,text,integer,jsonb) from public,anon,authenticated;
revoke execute on function public.command_center_agent_service_start_session(uuid,uuid) from public,anon,authenticated;
revoke execute on function public.command_center_agent_service_begin_step(uuid,uuid) from public,anon,authenticated;
revoke execute on function public.command_center_agent_service_add_evidence(uuid,uuid,text,text,text,jsonb,boolean,text) from public,anon,authenticated;
revoke execute on function public.command_center_agent_service_verify_step(uuid,uuid) from public,anon,authenticated;
revoke execute on function public.command_center_agent_service_checkpoint(uuid,uuid,text,jsonb) from public,anon,authenticated;

grant execute on function public.command_center_agent_service_owner_active(uuid) to service_role;
grant execute on function public.command_center_agent_service_list_runnable(integer) to service_role;
grant execute on function public.command_center_agent_service_status(uuid,uuid) to service_role;
grant execute on function public.command_center_agent_service_add_step(uuid,uuid,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text,uuid[],text,text,text,integer,jsonb) to service_role;
grant execute on function public.command_center_agent_service_start_session(uuid,uuid) to service_role;
grant execute on function public.command_center_agent_service_begin_step(uuid,uuid) to service_role;
grant execute on function public.command_center_agent_service_add_evidence(uuid,uuid,text,text,text,jsonb,boolean,text) to service_role;
grant execute on function public.command_center_agent_service_verify_step(uuid,uuid) to service_role;
grant execute on function public.command_center_agent_service_checkpoint(uuid,uuid,text,jsonb) to service_role;
