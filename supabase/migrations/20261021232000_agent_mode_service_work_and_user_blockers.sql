-- Background-runner Work queue support and truthful user-action resumption.

create or replace function public.command_center_agent_service_prepare_work_handoff(
  p_owner_id uuid,p_step_id uuid,p_capability_boundary_reason text,p_normal_chat_exhausted boolean,p_provider text,p_operation_key text,
  p_bounded_instructions jsonb,p_forbidden_actions jsonb default '[]'::jsonb,p_expected_evidence jsonb default '[]'::jsonb,
  p_account_ref text default null,p_input_hash text default null,p_state_hash text default null,p_expected_side_effect_key text default null,p_priority integer default 100
) returns uuid language plpgsql security definer set search_path to '' as $$
declare st public.agent_steps%rowtype; s public.agent_sessions%rowtype; hid uuid; auto_ok boolean; approval text; hstate text; begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=p_owner_id for update; if not found then raise exception 'Agent step not found'; end if;
  select * into s from public.agent_sessions where id=st.session_id and owner_id=p_owner_id; if not found then raise exception 'Agent session not found'; end if;
  if st.route<>'work' then raise exception 'Step is not Work-routed'; end if;
  if st.status<>'pending' then raise exception 'Work handoff requires a pending step'; end if;
  if s.status<>'active' or s.pause_requested or s.cancel_requested then raise exception 'Session is not eligible for Work'; end if;
  if not coalesce(p_normal_chat_exhausted,false) then raise exception 'Normal-chat exhaustion gate has not passed'; end if;
  if coalesce(btrim(p_capability_boundary_reason),'')='' or coalesce(btrim(p_provider),'')='' or coalesce(btrim(p_operation_key),'')='' then raise exception 'Boundary reason, provider and operation key are required'; end if;
  if st.model_rung not in ('GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium') then raise exception 'Invalid or prohibited Work model rung'; end if;
  if exists(select 1 from public.agent_circuit_breakers b where b.owner_id=p_owner_id and b.status='open' and b.breaker_type in ('provider','portfolio') and (b.provider is null or b.provider=p_provider)) then raise exception 'Work circuit breaker is open for this provider/capability'; end if;
  if exists(select 1 from public.agent_work_handoffs h where h.owner_id=p_owner_id and h.step_id=st.id and h.state in ('proposed','approved','in_progress','returned')) then raise exception 'Equivalent unresolved Work handoff already exists'; end if;
  if p_expected_side_effect_key is not null and exists(select 1 from public.agent_step_attempts a where a.owner_id=p_owner_id and a.expected_side_effect_key=p_expected_side_effect_key and a.status in ('returned','succeeded')) then raise exception 'Duplicate side effect prevented'; end if;
  auto_ok:=st.model_rung in ('GPT-6 Luna High','GPT-6.1 Sol Light') and st.risk_class='low' and not st.protected_boundary and st.scope_class in ('micro','small','moderate');
  approval:=case when auto_ok then 'not_required' else 'required' end;
  hstate:=case when auto_ok then 'approved' else 'proposed' end;
  insert into public.agent_work_handoffs(owner_id,session_id,project_id,step_id,capability_boundary_reason,normal_chat_exhausted,provider,account_ref,operation_key,model_rung,scope_class,risk_class,bounded_instructions,forbidden_actions,expected_evidence,input_hash,state_hash,expected_side_effect_key,approval_state,state)
  values(p_owner_id,st.session_id,st.project_id,st.id,btrim(p_capability_boundary_reason),true,btrim(p_provider),nullif(btrim(p_account_ref),''),btrim(p_operation_key),st.model_rung,st.scope_class,st.risk_class,coalesce(p_bounded_instructions,'{}'::jsonb),coalesce(p_forbidden_actions,'[]'::jsonb),coalesce(p_expected_evidence,'[]'::jsonb),p_input_hash,p_state_hash,p_expected_side_effect_key,approval,hstate) returning id into hid;
  insert into public.agent_work_queue(owner_id,session_id,project_id,step_id,handoff_id,priority,status) values(p_owner_id,st.session_id,st.project_id,st.id,hid,coalesce(p_priority,100),'queued');
  perform public.command_center_agent_log_event(p_owner_id,st.session_id,st.project_id,st.id,'work_handoff_prepared','Work handoff prepared by service runner',jsonb_build_object('handoff_id',hid,'model_rung',st.model_rung,'approval_state',approval));
  return hid;
end $$;

create or replace function public.command_center_agent_service_block_step(
  p_owner_id uuid,p_step_id uuid,p_failure_class text,p_reason text,p_required_environment text default null,p_user_action_instructions text default null
) returns jsonb language plpgsql security definer set search_path to '' as $$
declare st public.agent_steps%rowtype; new_status text; meta jsonb; begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  if p_failure_class not in ('account_auth_required','captcha_or_mfa','permission_denied','provider_outage','missing_input','tool_unavailable','unexpected_state','protected_boundary','capability_insufficient','execution_complexity','verification_failed') then raise exception 'Invalid blocker classification'; end if;
  if coalesce(btrim(p_reason),'')='' then raise exception 'Blocker reason is required'; end if;
  if p_required_environment is not null and p_required_environment not in ('pc','phone','local_browser','any_device') then raise exception 'Invalid required environment'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=p_owner_id for update; if not found then raise exception 'Agent step not found'; end if;
  new_status:=case when p_failure_class in ('account_auth_required','captcha_or_mfa','missing_input','protected_boundary') or p_required_environment is not null then 'needs_user_action' else 'blocked' end;
  meta:=coalesce(st.metadata,'{}'::jsonb)||jsonb_strip_nulls(jsonb_build_object('blocker_reason',btrim(p_reason),'required_environment',p_required_environment,'user_action_instructions',nullif(btrim(p_user_action_instructions),''),'resume_after_user_action',true,'blocked_at',now()));
  update public.agent_steps set status=new_status,last_failure_class=p_failure_class,metadata=meta where id=st.id;
  update public.agent_sessions set status=new_status,current_project_id=st.project_id,current_step_id=st.id,exact_next_action=st.title where id=st.session_id and owner_id=p_owner_id;
  update public.agent_session_projects set state=new_status where session_id=st.session_id and owner_id=p_owner_id and project_id=st.project_id;
  perform public.command_center_agent_log_event(p_owner_id,st.session_id,st.project_id,st.id,'step_blocked',btrim(p_reason),jsonb_build_object('failure_class',p_failure_class,'required_environment',p_required_environment));
  return jsonb_build_object('ok',true,'step_id',st.id,'status',new_status,'failure_class',p_failure_class,'required_environment',p_required_environment);
end $$;

create or replace function public.command_center_agent_complete_user_action(p_step_id uuid,p_note text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); st public.agent_steps%rowtype; meta jsonb; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u for update; if not found then raise exception 'Agent step not found'; end if;
  if st.status<>'needs_user_action' then raise exception 'Step is not awaiting user action'; end if;
  meta:=coalesce(st.metadata,'{}'::jsonb)||jsonb_build_object('user_action_claimed_at',now(),'user_action_note',coalesce(nullif(btrim(p_note),''),'Owner reports required action completed'),'awaiting_downstream_verification',true);
  update public.agent_steps set status='verification_pending',metadata=meta where id=st.id;
  update public.agent_sessions set status='active',exact_next_action='Verify user action: '||st.title where id=st.session_id and owner_id=u;
  update public.agent_session_projects set state='active' where session_id=st.session_id and owner_id=u and project_id=st.project_id;
  perform public.command_center_agent_log_event(u,st.session_id,st.project_id,st.id,'user_action_claimed','Owner reports user-only requirement completed; downstream verification still required','{}'::jsonb);
  return jsonb_build_object('ok',true,'step_id',st.id,'verification_pending',true);
end $$;

revoke execute on function public.command_center_agent_service_prepare_work_handoff(uuid,uuid,text,boolean,text,text,jsonb,jsonb,jsonb,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.command_center_agent_service_prepare_work_handoff(uuid,uuid,text,boolean,text,text,jsonb,jsonb,jsonb,text,text,text,text,integer) to service_role;
revoke execute on function public.command_center_agent_service_block_step(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.command_center_agent_service_block_step(uuid,uuid,text,text,text,text) to service_role;
revoke execute on function public.command_center_agent_complete_user_action(uuid,text) from public,anon;
grant execute on function public.command_center_agent_complete_user_action(uuid,text) to authenticated;
