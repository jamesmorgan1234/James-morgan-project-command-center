-- Command Center Agent Mode Work/retry/circuit-breaker RPCs.

create or replace function public.command_center_agent_prepare_work_handoff(
  p_step_id uuid,
  p_capability_boundary_reason text,
  p_normal_chat_exhausted boolean,
  p_provider text,
  p_operation_key text,
  p_bounded_instructions jsonb,
  p_forbidden_actions jsonb default '[]'::jsonb,
  p_expected_evidence jsonb default '[]'::jsonb,
  p_account_ref text default null,
  p_input_hash text default null,
  p_state_hash text default null,
  p_expected_side_effect_key text default null,
  p_priority integer default 100
) returns uuid language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); st public.agent_steps%rowtype; s public.agent_sessions%rowtype; hid uuid; auto_ok boolean; approval text; hstate text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u for update; if not found then raise exception 'Agent step not found'; end if;
  select * into s from public.agent_sessions where id=st.session_id and owner_id=u; if not found then raise exception 'Agent session not found'; end if;
  if st.route<>'work' then raise exception 'Step is not Work-routed'; end if;
  if st.status<>'pending' then raise exception 'Work handoff requires a pending step'; end if;
  if s.status<>'active' or s.pause_requested or s.cancel_requested then raise exception 'Session is not eligible for Work'; end if;
  if not coalesce(p_normal_chat_exhausted,false) then raise exception 'Normal-chat exhaustion gate has not passed'; end if;
  if coalesce(btrim(p_capability_boundary_reason),'')='' or coalesce(btrim(p_provider),'')='' or coalesce(btrim(p_operation_key),'')='' then raise exception 'Boundary reason, provider and operation key are required'; end if;
  if st.model_rung not in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium') then raise exception 'Invalid or prohibited Work model rung'; end if;
  if exists(select 1 from public.agent_circuit_breakers b where b.owner_id=u and b.status='open' and b.breaker_type in ('provider','portfolio') and (b.provider is null or b.provider=p_provider)) then raise exception 'Work circuit breaker is open for this provider/capability'; end if;
  if exists(select 1 from public.agent_work_handoffs h where h.owner_id=u and h.step_id=st.id and h.state in ('proposed','approved','in_progress','returned')) then raise exception 'Equivalent unresolved Work handoff already exists'; end if;
  if p_expected_side_effect_key is not null and exists(select 1 from public.agent_step_attempts a where a.owner_id=u and a.expected_side_effect_key=p_expected_side_effect_key and a.status in ('returned','succeeded')) then raise exception 'Duplicate side effect prevented'; end if;
  auto_ok:=st.model_rung in ('GPT-6 Luna High','GPT-6.1 Sol Light') and st.risk_class='low' and not st.protected_boundary and st.scope_class in ('micro','small','moderate');
  approval:=case when auto_ok then 'not_required' else 'required' end;
  hstate:=case when auto_ok then 'approved' else 'proposed' end;
  insert into public.agent_work_handoffs(owner_id,session_id,project_id,step_id,capability_boundary_reason,normal_chat_exhausted,provider,account_ref,operation_key,model_rung,scope_class,risk_class,bounded_instructions,forbidden_actions,expected_evidence,input_hash,state_hash,expected_side_effect_key,approval_state,state)
  values(u,st.session_id,st.project_id,st.id,btrim(p_capability_boundary_reason),true,btrim(p_provider),nullif(btrim(p_account_ref),''),btrim(p_operation_key),st.model_rung,st.scope_class,st.risk_class,coalesce(p_bounded_instructions,'{}'::jsonb),coalesce(p_forbidden_actions,'[]'::jsonb),coalesce(p_expected_evidence,'[]'::jsonb),p_input_hash,p_state_hash,p_expected_side_effect_key,approval,hstate) returning id into hid;
  insert into public.agent_work_queue(owner_id,session_id,project_id,step_id,handoff_id,priority,status) values(u,st.session_id,st.project_id,st.id,hid,coalesce(p_priority,100),'queued');
  perform public.command_center_agent_log_event(u,st.session_id,st.project_id,st.id,'work_handoff_prepared','Work handoff prepared',jsonb_build_object('handoff_id',hid,'model_rung',st.model_rung,'approval_state',approval));
  return hid;
end $$;

create or replace function public.command_center_agent_approve_work_handoff(p_handoff_id uuid,p_authorization_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); h public.agent_work_handoffs%rowtype; a public.security_action_authorizations%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into h from public.agent_work_handoffs where id=p_handoff_id and owner_id=u for update; if not found then raise exception 'Work handoff not found'; end if;
  if h.state<>'proposed' or h.approval_state<>'required' then raise exception 'Work handoff is not awaiting approval'; end if;
  select * into a from public.security_action_authorizations where id=p_authorization_id and owner_id=u and status='authorized' and resource_type='agent_step' and resource_id=h.step_id::text and (expires_at is null or expires_at>now());
  if not found then raise exception 'Valid Agent step authorization not found'; end if;
  if h.model_rung='GPT-6.1 Sol Medium' and a.action_key<>'agent_mode_work_sol_medium' then raise exception 'Sol Medium requires its exact Agent Mode authorization'; end if;
  update public.agent_work_handoffs set approval_state='authorized',authorization_id=a.id,state='approved' where id=h.id;
  update public.agent_steps set authorization_id=a.id where id=h.step_id;
  return jsonb_build_object('ok',true,'handoff_id',h.id,'state','approved');
end $$;

create or replace function public.command_center_agent_start_work_handoff(p_handoff_id uuid,p_retry_reason text default null,p_state_changed_before_retry boolean default false)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); h public.agent_work_handoffs%rowtype; st public.agent_steps%rowtype; s public.agent_sessions%rowtype; prev public.agent_step_attempts%rowtype; aid uuid; anum integer; fp text; same_count integer; auth_ok boolean; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into h from public.agent_work_handoffs where id=p_handoff_id and owner_id=u for update; if not found then raise exception 'Work handoff not found'; end if;
  if h.state<>'approved' then raise exception 'Work handoff is not approved'; end if;
  select * into st from public.agent_steps where id=h.step_id and owner_id=u for update;
  select * into s from public.agent_sessions where id=h.session_id and owner_id=u for update;
  if st.status<>'pending' or s.status<>'active' or s.pause_requested or s.cancel_requested then raise exception 'Agent state is not eligible to start Work'; end if;
  if h.model_rung not in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium') then raise exception 'Prohibited Work model rung'; end if;
  if h.model_rung='GPT-6.1 Sol Medium' then
    select exists(select 1 from public.security_action_authorizations a where a.id=h.authorization_id and a.owner_id=u and a.status='authorized' and a.action_key='agent_mode_work_sol_medium' and a.resource_type='agent_step' and a.resource_id=st.id::text and (a.expires_at is null or a.expires_at>now())) into auth_ok;
    if not auth_ok then raise exception 'Sol Medium Work is approval-required'; end if;
  end if;
  if exists(select 1 from public.agent_work_handoffs x where x.owner_id=u and x.state='in_progress' and x.id<>h.id) then raise exception 'Agent Mode Work concurrency limit is 1'; end if;
  if exists(select 1 from public.agent_circuit_breakers b where b.owner_id=u and b.status='open' and b.breaker_type in ('provider','portfolio') and (b.provider is null or b.provider=h.provider)) then raise exception 'Work circuit breaker is open'; end if;
  if h.expected_side_effect_key is not null and exists(select 1 from public.agent_step_attempts a where a.owner_id=u and a.expected_side_effect_key=h.expected_side_effect_key and a.status in ('returned','succeeded')) then raise exception 'Duplicate side effect prevented'; end if;
  fp:=md5(concat_ws('|',h.session_id::text,h.project_id,h.step_id::text,h.provider,coalesce(h.account_ref,''),h.operation_key,coalesce(h.input_hash,''),h.model_rung,coalesce(h.state_hash,''),coalesce(h.expected_side_effect_key,''),h.bounded_instructions::text,st.retry_epoch::text));
  select * into prev from public.agent_step_attempts where owner_id=u and step_id=st.id order by attempt_number desc limit 1;
  if found and prev.status='failed' then
    if prev.retry_fingerprint=fp then
      select count(*) into same_count from public.agent_step_attempts where owner_id=u and step_id=st.id and retry_fingerprint=fp;
      if prev.failure_class not in ('transient_network','provider_timeout') then raise exception 'Identical blind retry is forbidden after %',coalesce(prev.failure_class,'unknown'); end if;
      if same_count>=2 then raise exception 'Transient automatic retry budget is exhausted'; end if;
    elsif prev.model_rung is distinct from h.model_rung then
      if prev.failure_class not in ('capability_insufficient','execution_complexity') then raise exception 'Model escalation is not justified by failure class'; end if;
      if not ((prev.model_rung='GPT-6 Luna High' and h.model_rung='GPT-6.1 Sol Light') or (prev.model_rung='GPT-6.1 Sol Light' and h.model_rung='GPT-6.1 Sol Medium')) then raise exception 'Escalation must use the next allowed rung'; end if;
    elsif not coalesce(p_state_changed_before_retry,false) then raise exception 'Later retry requires materially changed state'; end if;
  end if;
  select coalesce(max(attempt_number),0)+1 into anum from public.agent_step_attempts where owner_id=u and step_id=st.id;
  insert into public.agent_step_attempts(owner_id,session_id,project_id,step_id,handoff_id,attempt_number,route,model_rung,provider,operation_key,input_hash,expected_side_effect_key,state_hash,retry_fingerprint,state_changed_before_retry,retry_reason,status)
  values(u,h.session_id,h.project_id,h.step_id,h.id,anum,'work',h.model_rung,h.provider,h.operation_key,h.input_hash,h.expected_side_effect_key,h.state_hash,fp,coalesce(p_state_changed_before_retry,false),p_retry_reason,'in_progress') returning id into aid;
  update public.agent_work_handoffs set state='in_progress',attempt_id=aid,started_at=now() where id=h.id;
  update public.agent_work_queue set status='claimed',claimed_at=now() where handoff_id=h.id and owner_id=u;
  update public.agent_steps set status='running',started_at=coalesce(started_at,now()),last_retry_fingerprint=fp,last_state_hash=h.state_hash where id=st.id;
  update public.agent_sessions set current_project_id=st.project_id,current_step_id=st.id,exact_next_action=st.title where id=s.id;
  perform public.command_center_agent_log_event(u,s.id,st.project_id,st.id,'work_started','Work handoff started',jsonb_build_object('handoff_id',h.id,'attempt_id',aid,'model_rung',h.model_rung));
  return jsonb_build_object('ok',true,'handoff_id',h.id,'attempt_id',aid,'retry_fingerprint',fp,'attempt_number',anum);
end $$;

create or replace function public.command_center_agent_record_work_result(
  p_handoff_id uuid,p_outcome text,p_failure_class text default null,p_result_evidence jsonb default '{}'::jsonb,p_evidence_kind text default null,p_evidence_ref text default null,p_resulting_state_hash text default null
) returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); h public.agent_work_handoffs%rowtype; st public.agent_steps%rowtype; s public.agent_sessions%rowtype; a public.agent_step_attempts%rowtype; failures integer; systemic integer; eid uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_outcome not in ('returned','failed','canceled') then raise exception 'Invalid Work outcome'; end if;
  select * into h from public.agent_work_handoffs where id=p_handoff_id and owner_id=u for update; if not found or h.state<>'in_progress' then raise exception 'In-progress Work handoff not found'; end if;
  select * into st from public.agent_steps where id=h.step_id and owner_id=u for update;
  select * into s from public.agent_sessions where id=h.session_id and owner_id=u for update;
  select * into a from public.agent_step_attempts where id=h.attempt_id and owner_id=u for update; if not found then raise exception 'Work attempt not found'; end if;
  if p_outcome='returned' then
    update public.agent_step_attempts set status='returned',result_evidence=coalesce(p_result_evidence,'{}'::jsonb),state_hash=coalesce(p_resulting_state_hash,state_hash),ended_at=now() where id=a.id;
    update public.agent_work_handoffs set state='returned',returned_evidence=coalesce(p_result_evidence,'{}'::jsonb),ended_at=now(),failure_class=null where id=h.id;
    update public.agent_work_queue set status='done',completed_at=now() where handoff_id=h.id and owner_id=u;
    update public.agent_steps set status='verification_pending',last_state_hash=coalesce(p_resulting_state_hash,last_state_hash) where id=st.id;
    if coalesce(btrim(p_evidence_kind),'')<>'' then
      insert into public.agent_step_evidence(owner_id,session_id,step_id,strength,evidence_kind,evidence_ref,evidence) values(u,st.session_id,st.id,'tool_result',btrim(p_evidence_kind),nullif(btrim(p_evidence_ref),''),coalesce(p_result_evidence,'{}'::jsonb)) returning id into eid;
    end if;
    if s.pause_requested then update public.agent_sessions set status='paused',paused_at=now() where id=s.id; end if;
    if s.cancel_requested then update public.agent_sessions set status='canceled',canceled_at=now() where id=s.id; end if;
    perform public.command_center_agent_log_event(u,s.id,st.project_id,st.id,'work_returned','Work handoff returned for verification',jsonb_build_object('handoff_id',h.id));
    return jsonb_build_object('ok',true,'verification_pending',true,'evidence_id',eid);
  end if;
  if p_outcome='canceled' then
    update public.agent_step_attempts set status='canceled',result_evidence=coalesce(p_result_evidence,'{}'::jsonb),ended_at=now() where id=a.id;
    update public.agent_work_handoffs set state='canceled',ended_at=now() where id=h.id;
    update public.agent_work_queue set status='canceled',completed_at=now() where handoff_id=h.id and owner_id=u;
    update public.agent_steps set status='canceled' where id=st.id;
    return jsonb_build_object('ok',true,'canceled',true);
  end if;
  if p_failure_class not in ('transient_network','provider_timeout','capability_insufficient','execution_complexity','account_auth_required','captcha_or_mfa','permission_denied','provider_outage','missing_input','tool_unavailable','unexpected_state','protected_boundary','rate_limited','session_expired','invalid_input','verification_failed','duplicate_prevented','unknown') then raise exception 'Failure classification is required before retry'; end if;
  failures:=st.meaningful_failure_count+1;
  update public.agent_step_attempts set status='failed',failure_class=p_failure_class,result_evidence=coalesce(p_result_evidence,'{}'::jsonb),state_hash=coalesce(p_resulting_state_hash,state_hash),ended_at=now() where id=a.id;
  update public.agent_work_handoffs set state='failed',failure_class=p_failure_class,returned_evidence=coalesce(p_result_evidence,'{}'::jsonb),ended_at=now() where id=h.id;
  update public.agent_work_queue set status='failed',completed_at=now() where handoff_id=h.id and owner_id=u;
  update public.agent_steps set failure_count=failure_count+1,meaningful_failure_count=failures,retry_count=retry_count+case when p_failure_class in ('transient_network','provider_timeout') then 1 else 0 end,last_failure_class=p_failure_class,last_state_hash=coalesce(p_resulting_state_hash,last_state_hash),next_retry_at=case when p_failure_class in ('transient_network','provider_timeout') and failures<2 then now()+interval '1 minute' else null end,status=case when failures>=2 then 'blocked' when p_failure_class in ('transient_network','provider_timeout') then 'pending' when p_failure_class in ('account_auth_required','captcha_or_mfa','missing_input','protected_boundary','session_expired') then 'needs_user_action' else 'blocked' end where id=st.id;
  if failures>=2 then
    insert into public.agent_circuit_breakers(owner_id,session_id,project_id,step_id,provider,breaker_type,scope_key,status,reason,failure_count,retry_fingerprint,state_hash) values(u,st.session_id,st.project_id,st.id,h.provider,'step','step:'||st.id::text,'open','Two meaningful failed attempts reached the step circuit breaker',failures,a.retry_fingerprint,coalesce(p_resulting_state_hash,a.state_hash)) on conflict(owner_id,breaker_type,scope_key) where status='open' do update set failure_count=excluded.failure_count,reason=excluded.reason,retry_fingerprint=excluded.retry_fingerprint,state_hash=excluded.state_hash;
  end if;
  if p_failure_class in ('transient_network','provider_timeout','provider_outage','tool_unavailable') then
    select count(*) into systemic from public.agent_step_attempts x where x.owner_id=u and x.provider=h.provider and x.status='failed' and x.failure_class in ('transient_network','provider_timeout','provider_outage','tool_unavailable') and x.ended_at>=now()-interval '30 minutes';
    if systemic>=3 then
      insert into public.agent_circuit_breakers(owner_id,provider,breaker_type,scope_key,status,reason,failure_count,state_hash) values(u,h.provider,'portfolio','provider:'||h.provider,'open','Repeated Work failures indicate a shared provider/tool problem',systemic,coalesce(p_resulting_state_hash,a.state_hash)) on conflict(owner_id,breaker_type,scope_key) where status='open' do update set failure_count=excluded.failure_count,reason=excluded.reason,state_hash=excluded.state_hash;
    end if;
  end if;
  if p_failure_class in ('transient_network','provider_timeout') and failures<2 then
    update public.agent_sessions set status='active',current_project_id=st.project_id,current_step_id=st.id,exact_next_action='Retry after verified transient cooldown' where id=s.id;
    return jsonb_build_object('ok',false,'failed',true,'retry_eligible',true,'failure_class',p_failure_class,'next_retry_at',(select next_retry_at from public.agent_steps where id=st.id));
  end if;
  update public.agent_sessions set status=case when (select status from public.agent_steps where id=st.id)='needs_user_action' then 'needs_user_action' else 'blocked' end,current_project_id=st.project_id,current_step_id=st.id,exact_next_action=st.title where id=s.id;
  update public.agent_session_projects set state=case when (select status from public.agent_steps where id=st.id)='needs_user_action' then 'needs_user_action' else 'blocked' end where session_id=s.id and owner_id=u and project_id=st.project_id;
  perform public.command_center_agent_log_event(u,s.id,st.project_id,st.id,'work_failed','Work handoff failed',jsonb_build_object('failure_class',p_failure_class,'failure_count',failures));
  return jsonb_build_object('ok',false,'failed',true,'retry_eligible',false,'failure_class',p_failure_class,'step_status',(select status from public.agent_steps where id=st.id));
end $$;

create or replace function public.command_center_agent_reopen_step(p_step_id uuid,p_new_state_hash text default null,p_new_model_rung text default null,p_reason text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); st public.agent_steps%rowtype; state_changed boolean; model_changed boolean; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u for update; if not found then raise exception 'Agent step not found'; end if;
  if st.status not in ('blocked','needs_user_action','failed') then raise exception 'Only blocked/failed steps can be reopened'; end if;
  state_changed:=p_new_state_hash is not null and p_new_state_hash is distinct from st.last_state_hash;
  model_changed:=p_new_model_rung is not null and p_new_model_rung is distinct from st.model_rung;
  if model_changed then
    if st.route<>'work' then raise exception 'Model reclassification is Work-only'; end if;
    if st.last_failure_class not in ('capability_insufficient','execution_complexity') then raise exception 'Failure class does not justify escalation'; end if;
    if not ((st.model_rung='GPT-6 Luna High' and p_new_model_rung='GPT-6.1 Sol Light') or (st.model_rung='GPT-6.1 Sol Light' and p_new_model_rung='GPT-6.1 Sol Medium')) then raise exception 'Escalation must use the next allowed rung and never exceed Sol Medium'; end if;
  end if;
  if not state_changed and not model_changed then raise exception 'Blocked step requires materially changed state'; end if;
  update public.agent_steps set status='pending',retry_epoch=retry_epoch+1,meaningful_failure_count=0,retry_count=0,next_retry_at=null,last_state_hash=coalesce(p_new_state_hash,last_state_hash),model_rung=coalesce(p_new_model_rung,model_rung),metadata=metadata||jsonb_build_object('reopened_reason',coalesce(p_reason,'material state change'),'reopened_at',now()) where id=st.id;
  update public.agent_circuit_breakers set status='closed',closed_at=now(),metadata=metadata||jsonb_build_object('closed_reason',coalesce(p_reason,'material state change')) where owner_id=u and step_id=st.id and status='open' and breaker_type='step';
  update public.agent_sessions set status=case when pause_requested then 'paused' when cancel_requested then 'canceled' else 'active' end,current_project_id=st.project_id,current_step_id=st.id,exact_next_action=st.title where id=st.session_id and owner_id=u and status in ('blocked','needs_user_action','failed','active');
  update public.agent_session_projects set state='active' where session_id=st.session_id and owner_id=u and project_id=st.project_id;
  return jsonb_build_object('ok',true,'step_id',st.id,'state_changed',state_changed,'model_changed',model_changed,'model_rung',coalesce(p_new_model_rung,st.model_rung));
end $$;

create or replace function public.command_center_agent_close_circuit_breaker(p_breaker_id uuid,p_new_state_hash text,p_reason text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); b public.agent_circuit_breakers%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into b from public.agent_circuit_breakers where id=p_breaker_id and owner_id=u for update; if not found or b.status<>'open' then raise exception 'Open circuit breaker not found'; end if;
  if coalesce(btrim(p_new_state_hash),'')='' or p_new_state_hash is not distinct from b.state_hash then raise exception 'Circuit breaker requires materially changed state'; end if;
  update public.agent_circuit_breakers set status='closed',closed_at=now(),state_hash=p_new_state_hash,metadata=metadata||jsonb_build_object('closed_reason',coalesce(nullif(btrim(p_reason),''),'material state change')) where id=b.id;
  return jsonb_build_object('ok',true,'breaker_id',b.id,'status','closed');
end $$;

create or replace function public.command_center_agent_mark_normal_chat_resumed(p_handoff_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); h public.agent_work_handoffs%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into h from public.agent_work_handoffs where id=p_handoff_id and owner_id=u for update; if not found then raise exception 'Work handoff not found'; end if;
  if h.state not in ('returned','verified','failed','blocked','canceled') then raise exception 'Work handoff has not returned'; end if;
  update public.agent_work_handoffs set normal_chat_resumed=true where id=h.id;
  return jsonb_build_object('ok',true,'handoff_id',h.id,'normal_chat_resumed',true);
end $$;

create or replace function public.command_center_agent_record_tool_health(p_capability_key text,p_environment text,p_availability text,p_auth_state text,p_free_status text default 'unknown',p_provider text default null,p_tool_key text default null,p_action_scope jsonb default '{}'::jsonb,p_error_class text default null,p_approved_fallback text default null,p_success boolean default false,p_metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); rid uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_capability_key),'')='' then raise exception 'Capability key is required'; end if;
  if p_environment not in ('normal_chat','work','external_tool','user_only') then raise exception 'Invalid capability environment'; end if;
  if p_availability not in ('available','unavailable','degraded','unknown') then raise exception 'Invalid availability'; end if;
  if p_auth_state not in ('authenticated','needs_auth','not_applicable','unknown') then raise exception 'Invalid auth state'; end if;
  if p_free_status not in ('free','paid','unknown') then raise exception 'Invalid free/paid state'; end if;
  insert into public.agent_tool_registry(owner_id,capability_key,environment,provider,tool_key,availability,auth_state,action_scope,free_status,last_success_at,error_class,approved_fallback,last_verified_at,metadata)
  values(u,btrim(p_capability_key),p_environment,coalesce(nullif(btrim(p_provider),''),''),coalesce(nullif(btrim(p_tool_key),''),''),p_availability,p_auth_state,coalesce(p_action_scope,'{}'::jsonb),p_free_status,case when p_success then now() else null end,p_error_class,p_approved_fallback,now(),coalesce(p_metadata,'{}'::jsonb))
  on conflict(owner_id,capability_key,environment,provider,tool_key) do update set availability=excluded.availability,auth_state=excluded.auth_state,action_scope=excluded.action_scope,free_status=excluded.free_status,last_success_at=case when p_success then now() else public.agent_tool_registry.last_success_at end,error_class=excluded.error_class,approved_fallback=excluded.approved_fallback,last_verified_at=now(),metadata=excluded.metadata returning id into rid;
  return rid;
end $$;

revoke execute on function public.command_center_agent_prepare_work_handoff(uuid,text,boolean,text,text,jsonb,jsonb,jsonb,text,text,text,text,integer) from public,anon; grant execute on function public.command_center_agent_prepare_work_handoff(uuid,text,boolean,text,text,jsonb,jsonb,jsonb,text,text,text,text,integer) to authenticated;
revoke execute on function public.command_center_agent_approve_work_handoff(uuid,uuid) from public,anon; grant execute on function public.command_center_agent_approve_work_handoff(uuid,uuid) to authenticated;
revoke execute on function public.command_center_agent_start_work_handoff(uuid,text,boolean) from public,anon; grant execute on function public.command_center_agent_start_work_handoff(uuid,text,boolean) to authenticated;
revoke execute on function public.command_center_agent_record_work_result(uuid,text,text,jsonb,text,text,text) from public,anon; grant execute on function public.command_center_agent_record_work_result(uuid,text,text,jsonb,text,text,text) to authenticated;
revoke execute on function public.command_center_agent_reopen_step(uuid,text,text,text) from public,anon; grant execute on function public.command_center_agent_reopen_step(uuid,text,text,text) to authenticated;
revoke execute on function public.command_center_agent_close_circuit_breaker(uuid,text,text) from public,anon; grant execute on function public.command_center_agent_close_circuit_breaker(uuid,text,text) to authenticated;
revoke execute on function public.command_center_agent_mark_normal_chat_resumed(uuid) from public,anon; grant execute on function public.command_center_agent_mark_normal_chat_resumed(uuid) to authenticated;
revoke execute on function public.command_center_agent_record_tool_health(text,text,text,text,text,text,text,jsonb,text,text,boolean,jsonb) from public,anon; grant execute on function public.command_center_agent_record_tool_health(text,text,text,text,text,text,text,jsonb,text,text,boolean,jsonb) to authenticated;
