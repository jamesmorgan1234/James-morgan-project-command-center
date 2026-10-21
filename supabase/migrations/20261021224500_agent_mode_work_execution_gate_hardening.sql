-- Harden Work execution so queued handoffs cannot bypass dependencies or dry-run side-effect locks.
create or replace function public.command_center_agent_start_work_handoff(p_handoff_id uuid,p_retry_reason text default null,p_state_changed_before_retry boolean default false)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare
  u uuid:=(select auth.uid());
  h public.agent_work_handoffs%rowtype;
  st public.agent_steps%rowtype;
  s public.agent_sessions%rowtype;
  prev public.agent_step_attempts%rowtype;
  aid uuid;
  anum integer;
  fp text;
  same_count integer;
  auth_ok boolean;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into h from public.agent_work_handoffs where id=p_handoff_id and owner_id=u for update;
  if not found then raise exception 'Work handoff not found'; end if;
  if h.state<>'approved' then raise exception 'Work handoff is not approved'; end if;
  select * into st from public.agent_steps where id=h.step_id and owner_id=u for update;
  select * into s from public.agent_sessions where id=h.session_id and owner_id=u for update;
  if st.status<>'pending' or s.status<>'active' or s.pause_requested or s.cancel_requested then raise exception 'Agent state is not eligible to start Work'; end if;
  if exists(select 1 from unnest(st.dependencies) d(id) left join public.agent_steps ds on ds.id=d.id and ds.session_id=s.id and ds.owner_id=u where ds.id is null or ds.status<>'verified') then raise exception 'Dependencies are not verified'; end if;
  if s.dry_run and st.side_effect then raise exception 'Dry-run session cannot begin a side effect'; end if;
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
revoke execute on function public.command_center_agent_start_work_handoff(uuid,text,boolean) from public,anon;
grant execute on function public.command_center_agent_start_work_handoff(uuid,text,boolean) to authenticated;
