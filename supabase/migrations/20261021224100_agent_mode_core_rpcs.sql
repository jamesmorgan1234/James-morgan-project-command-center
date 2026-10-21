-- Command Center Agent Mode core RPCs.

create or replace function public.command_center_agent_log_event(
  p_owner uuid,p_session uuid,p_project text,p_step uuid,p_kind text,p_message text,p_payload jsonb default '{}'::jsonb
) returns void language sql security definer set search_path to '' as $$
  insert into public.agent_run_events(owner_id,session_id,project_id,step_id,event_kind,message,payload)
  values(p_owner,p_session,p_project,p_step,p_kind,coalesce(p_message,''),coalesce(p_payload,'{}'::jsonb));
$$;
revoke execute on function public.command_center_agent_log_event(uuid,uuid,text,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.command_center_agent_log_event(uuid,uuid,text,uuid,text,text,jsonb) to service_role;

create or replace function public.command_center_agent_create_session(
  p_objective text,
  p_project_ids text[],
  p_primary_project_id text,
  p_success_criteria jsonb default '[]'::jsonb,
  p_excluded_scope jsonb default '[]'::jsonb,
  p_permission_envelope jsonb default '{"allowed_tool_categories":[],"allow_work":false}'::jsonb,
  p_execution_policy jsonb default '{}'::jsonb,
  p_books_targets jsonb default '{}'::jsonb,
  p_dry_run boolean default false,
  p_scope_mode text default 'explicit_multi_project'
) returns uuid language plpgsql security definer set search_path to '' as $$
declare
  u uuid:=(select auth.uid()); sid uuid; p record; n integer;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_objective),'')='' then raise exception 'Agent objective is required'; end if;
  if p_scope_mode not in ('project_only','explicit_multi_project') then raise exception 'Invalid Agent scope mode'; end if;
  if p_project_ids is null or cardinality(p_project_ids)=0 then raise exception 'Explicit project scope is required'; end if;
  select count(*) into n from (select distinct x from unnest(p_project_ids) x) q;
  if n<>cardinality(p_project_ids) then raise exception 'Duplicate project IDs are not allowed'; end if;
  if p_scope_mode='project_only' and cardinality(p_project_ids)<>1 then raise exception 'Project-only Agent Mode requires exactly one project'; end if;
  if not (p_primary_project_id=any(p_project_ids)) then raise exception 'Primary project must be inside explicit project scope'; end if;
  if jsonb_typeof(coalesce(p_permission_envelope,'{}'::jsonb))<>'object' then raise exception 'Permission envelope must be an object'; end if;
  if jsonb_typeof(coalesce(p_permission_envelope->'allowed_tool_categories','[]'::jsonb))<>'array' then raise exception 'allowed_tool_categories must be an array'; end if;
  if jsonb_typeof(coalesce(p_books_targets,'{}'::jsonb))<>'object' then raise exception 'Books targets must be an object'; end if;
  if exists(select 1 from unnest(p_project_ids) x(id) left join public.projects p on p.id=x.id and p.owner_id=u where p.id is null) then raise exception 'Project scope contains a missing or unauthorized project'; end if;
  for p in select pr.id,pr.category from public.projects pr join unnest(p_project_ids) x(id) on x.id=pr.id where pr.owner_id=u loop
    if lower(coalesce(p.category,'')) like '%book%' and coalesce(btrim(p_books_targets->>p.id),'')='' then
      raise exception 'Books project % requires an explicit named Books target',p.id;
    end if;
  end loop;
  insert into public.agent_sessions(owner_id,objective,success_criteria,excluded_scope,scope_mode,primary_project_id,current_project_id,permission_envelope,execution_policy,dry_run)
  values(u,btrim(p_objective),coalesce(p_success_criteria,'[]'::jsonb),coalesce(p_excluded_scope,'[]'::jsonb),p_scope_mode,p_primary_project_id,p_primary_project_id,coalesce(p_permission_envelope,'{}'::jsonb),coalesce(p_execution_policy,'{}'::jsonb),coalesce(p_dry_run,false)) returning id into sid;
  insert into public.agent_session_projects(session_id,owner_id,project_id,sort_order,project_role,books_target)
  select sid,u,x.id,x.ord-1,case when x.id=p_primary_project_id then 'primary' else 'secondary' end,nullif(btrim(p_books_targets->>x.id),'')
  from unnest(p_project_ids) with ordinality x(id,ord);
  perform public.command_center_agent_log_event(u,sid,p_primary_project_id,null,'session_created','Agent session created',jsonb_build_object('scope_mode',p_scope_mode));
  return sid;
end $$;

create or replace function public.command_center_agent_add_step(
  p_session_id uuid,p_project_id text,p_step_key text,p_title text,p_details text,p_route text,p_tool_category text,
  p_scope_class text default 'small',p_model_rung text default null,p_risk_class text default 'low',p_impact_radius text default 'local_unit',
  p_side_effect boolean default false,p_protected_boundary boolean default false,p_verification_required text default 'tool_result',
  p_dependencies uuid[] default '{}'::uuid[],p_idempotency_key text default null,p_downstream_kind text default null,p_downstream_ref text default null,
  p_position integer default null,p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); s public.agent_sessions%rowtype; sid uuid; pos integer; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=u;
  if not found then raise exception 'Agent session not found'; end if;
  if s.status not in ('draft','active','paused') then raise exception 'Session cannot accept steps in state %',s.status; end if;
  if not exists(select 1 from public.agent_session_projects sp where sp.session_id=s.id and sp.owner_id=u and sp.project_id=p_project_id and sp.state<>'excluded') then raise exception 'Step project is outside explicit session scope'; end if;
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
  if p_dependencies is not null and exists(select 1 from unnest(p_dependencies) d(id) left join public.agent_steps ds on ds.id=d.id and ds.session_id=s.id and ds.owner_id=u where ds.id is null) then raise exception 'Dependency is outside this session'; end if;
  select coalesce(p_position,coalesce(max(position),-1)+1) into pos from public.agent_steps where session_id=s.id and owner_id=u;
  insert into public.agent_steps(owner_id,session_id,project_id,step_key,title,details,position,dependencies,route,tool_category,scope_class,model_rung,risk_class,impact_radius,side_effect,protected_boundary,verification_required,idempotency_key,downstream_kind,downstream_ref,metadata)
  values(u,s.id,p_project_id,btrim(p_step_key),btrim(p_title),coalesce(p_details,''),pos,coalesce(p_dependencies,'{}'::uuid[]),p_route,p_tool_category,p_scope_class,p_model_rung,p_risk_class,p_impact_radius,coalesce(p_side_effect,false),coalesce(p_protected_boundary,false),p_verification_required,nullif(btrim(p_idempotency_key),''),p_downstream_kind,p_downstream_ref,coalesce(p_metadata,'{}'::jsonb)) returning id into sid;
  return sid;
end $$;

create or replace function public.command_center_agent_start_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); s public.agent_sessions%rowtype; nxt public.agent_steps%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=u for update;
  if not found then raise exception 'Agent session not found'; end if;
  if s.status<>'draft' then raise exception 'Only draft sessions can be started'; end if;
  select * into nxt from public.agent_steps where session_id=s.id and owner_id=u and status='pending' order by (project_id=s.primary_project_id) desc,position,created_at limit 1;
  if not found then raise exception 'Agent session has no executable steps'; end if;
  update public.agent_sessions set status='active',started_at=now(),current_project_id=nxt.project_id,current_step_id=nxt.id,exact_next_action=nxt.title where id=s.id;
  update public.agent_session_projects set state=case when project_id=nxt.project_id then 'active' else state end where session_id=s.id and owner_id=u;
  perform public.command_center_agent_log_event(u,s.id,nxt.project_id,nxt.id,'session_started','Agent session started','{}'::jsonb);
  return jsonb_build_object('ok',true,'session_id',s.id,'current_project_id',nxt.project_id,'current_step_id',nxt.id);
end $$;

create or replace function public.command_center_agent_attach_authorization(p_step_id uuid,p_authorization_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); st public.agent_steps%rowtype; a public.security_action_authorizations%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u; if not found then raise exception 'Agent step not found'; end if;
  select * into a from public.security_action_authorizations where id=p_authorization_id and owner_id=u and status='authorized' and resource_type='agent_step' and resource_id=st.id::text and (expires_at is null or expires_at>now());
  if not found then raise exception 'Valid Security authorization not found for this Agent step'; end if;
  update public.agent_steps set authorization_id=a.id where id=st.id;
  return jsonb_build_object('ok',true,'step_id',st.id,'authorization_id',a.id);
end $$;

create or replace function public.command_center_agent_begin_step(p_step_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); st public.agent_steps%rowtype; s public.agent_sessions%rowtype; auth_ok boolean; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u for update; if not found then raise exception 'Agent step not found'; end if;
  select * into s from public.agent_sessions where id=st.session_id and owner_id=u for update; if not found then raise exception 'Agent session not found'; end if;
  if s.status<>'active' or s.pause_requested or s.cancel_requested then raise exception 'Agent session is not eligible to begin a step'; end if;
  if st.status<>'pending' then raise exception 'Agent step is not pending'; end if;
  if st.route='work' then raise exception 'Work-routed steps must use the Work handoff gate'; end if;
  if not exists(select 1 from public.agent_session_projects sp where sp.session_id=s.id and sp.owner_id=u and sp.project_id=st.project_id and sp.state<>'excluded') then raise exception 'Step project is outside session scope'; end if;
  if exists(select 1 from unnest(st.dependencies) d(id) left join public.agent_steps ds on ds.id=d.id and ds.session_id=s.id and ds.owner_id=u where ds.id is null or ds.status<>'verified') then raise exception 'Dependencies are not verified'; end if;
  if s.dry_run and st.side_effect then raise exception 'Dry-run session cannot begin a side effect'; end if;
  if st.protected_boundary or st.risk_class in ('high','protected') then
    select exists(select 1 from public.security_action_authorizations a where a.id=st.authorization_id and a.owner_id=u and a.status='authorized' and a.resource_type='agent_step' and a.resource_id=st.id::text and (a.expires_at is null or a.expires_at>now())) into auth_ok;
    if not auth_ok then raise exception 'Protected Agent step requires valid Security authorization'; end if;
  end if;
  if st.route='user_only' then
    update public.agent_steps set status='needs_user_action' where id=st.id;
    update public.agent_sessions set status='needs_user_action',current_project_id=st.project_id,current_step_id=st.id,exact_next_action=st.title where id=s.id;
    update public.agent_session_projects set state='needs_user_action' where session_id=s.id and project_id=st.project_id;
    return jsonb_build_object('ok',false,'needs_user_action',true,'step_id',st.id);
  end if;
  update public.agent_steps set status='running',started_at=coalesce(started_at,now()) where id=st.id;
  update public.agent_sessions set current_project_id=st.project_id,current_step_id=st.id,exact_next_action=st.title where id=s.id;
  perform public.command_center_agent_log_event(u,s.id,st.project_id,st.id,'step_started','Agent step started',jsonb_build_object('route',st.route));
  return jsonb_build_object('ok',true,'step_id',st.id,'route',st.route,'downstream_kind',st.downstream_kind,'downstream_ref',st.downstream_ref);
end $$;

create or replace function public.command_center_agent_add_evidence(p_step_id uuid,p_strength text,p_evidence_kind text,p_evidence_ref text default null,p_evidence jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); st public.agent_steps%rowtype; eid uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u; if not found then raise exception 'Agent step not found'; end if;
  if p_strength not in ('self_report_only','tool_result','canonical_record','live_verified') then raise exception 'Invalid evidence strength'; end if;
  if coalesce(btrim(p_evidence_kind),'')='' then raise exception 'Evidence kind is required'; end if;
  if p_strength in ('canonical_record','live_verified') and coalesce(btrim(p_evidence_ref),'')='' then raise exception 'Canonical/live evidence requires a concrete reference'; end if;
  insert into public.agent_step_evidence(owner_id,session_id,step_id,strength,evidence_kind,evidence_ref,evidence) values(u,st.session_id,st.id,p_strength,btrim(p_evidence_kind),nullif(btrim(p_evidence_ref),''),coalesce(p_evidence,'{}'::jsonb)) returning id into eid;
  return eid;
end $$;

create or replace function public.command_center_agent_confirm_evidence(p_evidence_id uuid,p_verified_by text default 'canonical_reconciler')
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); e public.agent_step_evidence%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into e from public.agent_step_evidence where id=p_evidence_id and owner_id=u for update; if not found then raise exception 'Agent evidence not found'; end if;
  if e.strength='self_report_only' then raise exception 'Self-report evidence cannot satisfy verification'; end if;
  update public.agent_step_evidence set verified=true,verified_by=coalesce(nullif(btrim(p_verified_by),''),'canonical_reconciler'),verified_at=now() where id=e.id;
  return jsonb_build_object('ok',true,'evidence_id',e.id,'strength',e.strength);
end $$;

create or replace function public.command_center_agent_verify_step(p_step_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); st public.agent_steps%rowtype; s public.agent_sessions%rowtype; req integer; got integer; nxt public.agent_steps%rowtype; remaining integer; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u for update; if not found then raise exception 'Agent step not found'; end if;
  select * into s from public.agent_sessions where id=st.session_id and owner_id=u for update;
  req:=public.command_center_agent_strength_rank(st.verification_required);
  select coalesce(max(public.command_center_agent_strength_rank(e.strength)),-1) into got from public.agent_step_evidence e where e.owner_id=u and e.step_id=st.id and e.verified;
  if got<req then raise exception 'Verification gate not satisfied'; end if;
  update public.agent_steps set status='verified',verified_at=now(),completed_at=coalesce(completed_at,now()) where id=st.id;
  update public.agent_work_handoffs set state='verified' where owner_id=u and step_id=st.id and state='returned';
  perform public.command_center_agent_log_event(u,s.id,st.project_id,st.id,'step_verified','Agent step verified',jsonb_build_object('required',st.verification_required));
  select count(*) into remaining from public.agent_steps where session_id=s.id and owner_id=u and status not in ('verified','skipped','canceled');
  if remaining=0 then
    update public.agent_sessions set status='completed',completed_at=now(),current_step_id=null,exact_next_action=null where id=s.id;
    update public.agent_session_projects set state='completed' where session_id=s.id and owner_id=u;
    return jsonb_build_object('ok',true,'session_completed',true,'step_id',st.id);
  end if;
  select * into nxt from public.agent_steps cand where cand.session_id=s.id and cand.owner_id=u and cand.status='pending' and not exists(select 1 from unnest(cand.dependencies) d(id) left join public.agent_steps ds on ds.id=d.id and ds.owner_id=u and ds.session_id=s.id where ds.id is null or ds.status<>'verified') order by (cand.project_id=st.project_id) desc,(cand.project_id=s.primary_project_id) desc,cand.position,cand.created_at limit 1;
  if found then
    update public.agent_sessions set status=case when pause_requested then 'paused' when cancel_requested then 'canceled' else 'active' end,current_project_id=nxt.project_id,current_step_id=nxt.id,exact_next_action=nxt.title,paused_at=case when pause_requested then now() else paused_at end,canceled_at=case when cancel_requested then now() else canceled_at end where id=s.id;
    update public.agent_session_projects set state=case when project_id=nxt.project_id then 'active' when project_id=st.project_id and state='active' then 'eligible' else state end where session_id=s.id and owner_id=u;
  else
    update public.agent_sessions set current_step_id=null,status=case when pause_requested then 'paused' when cancel_requested then 'canceled' when exists(select 1 from public.agent_steps x where x.session_id=s.id and x.owner_id=u and x.status='needs_user_action') then 'needs_user_action' else 'blocked' end where id=s.id;
  end if;
  return jsonb_build_object('ok',true,'session_completed',false,'step_id',st.id,'next_step_id',case when nxt.id is null then null else nxt.id end);
end $$;

create or replace function public.command_center_agent_checkpoint(p_session_id uuid,p_exact_next_action text default null,p_forbidden_actions jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); s public.agent_sessions%rowtype; cid uuid; v uuid[]; f uuid[]; b uuid[]; scopej jsonb; workj jsonb; retryj jsonb; evj jsonb; ph text; same_count integer; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=u for update; if not found then raise exception 'Agent session not found'; end if;
  select coalesce(array_agg(id order by position) filter(where status='verified'),'{}'::uuid[]),coalesce(array_agg(id order by position) filter(where status='failed'),'{}'::uuid[]),coalesce(array_agg(id order by position) filter(where status in ('blocked','needs_user_action')),'{}'::uuid[]) into v,f,b from public.agent_steps where session_id=s.id and owner_id=u;
  select coalesce(jsonb_agg(jsonb_build_object('project_id',project_id,'state',state,'books_target',books_target) order by sort_order),'[]'::jsonb) into scopej from public.agent_session_projects where session_id=s.id and owner_id=u;
  select jsonb_build_object('handoffs',coalesce(jsonb_agg(jsonb_build_object('id',id,'step_id',step_id,'state',state,'model_rung',model_rung)),'[]'::jsonb),'in_progress',count(*) filter(where state='in_progress')) into workj from public.agent_work_handoffs where session_id=s.id and owner_id=u;
  retryj:=jsonb_build_object('open_breakers',coalesce((select jsonb_agg(jsonb_build_object('id',id,'type',breaker_type,'reason',reason)) from public.agent_circuit_breakers where owner_id=u and status='open' and (session_id=s.id or session_id is null)),'[]'::jsonb));
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'step_id',step_id,'strength',strength,'verified',verified)),'[]'::jsonb) into evj from public.agent_step_evidence where session_id=s.id and owner_id=u;
  ph:=md5(jsonb_build_object('status',s.status,'project',s.current_project_id,'step',s.current_step_id,'verified',v,'failed',f,'blocked',b,'scope',scopej,'next',coalesce(p_exact_next_action,s.exact_next_action))::text);
  insert into public.agent_checkpoints(owner_id,session_id,project_id,step_id,session_status,objective,project_scope,permission_envelope,verified_step_ids,failed_step_ids,blocked_step_ids,work_state,retry_state,evidence_refs,exact_next_action,forbidden_actions,progress_hash)
  values(u,s.id,s.current_project_id,s.current_step_id,s.status,s.objective,scopej,s.permission_envelope,v,f,b,coalesce(workj,'{}'::jsonb),retryj,coalesce(evj,'[]'::jsonb),coalesce(p_exact_next_action,s.exact_next_action),coalesce(p_forbidden_actions,'[]'::jsonb),ph) returning id into cid;
  update public.agent_sessions set latest_checkpoint_id=cid,exact_next_action=coalesce(p_exact_next_action,exact_next_action) where id=s.id;
  select count(*) into same_count from (select progress_hash from public.agent_checkpoints where session_id=s.id and owner_id=u order by created_at desc limit 3) q where progress_hash=ph;
  if s.status='active' and same_count>=3 then
    insert into public.agent_circuit_breakers(owner_id,session_id,project_id,step_id,breaker_type,scope_key,status,reason,state_hash) values(u,s.id,s.current_project_id,s.current_step_id,'no_progress','session:'||s.id::text,'open','Three consecutive checkpoints produced no meaningful progress',ph)
    on conflict(owner_id,breaker_type,scope_key) where status='open' do update set reason=excluded.reason,state_hash=excluded.state_hash;
    update public.agent_sessions set status='paused',pause_requested=true,paused_at=now() where id=s.id;
  end if;
  return cid;
end $$;

create or replace function public.command_center_agent_pause(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); running boolean; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.agent_sessions where id=p_session_id and owner_id=u) then raise exception 'Agent session not found'; end if;
  select exists(select 1 from public.agent_steps where session_id=p_session_id and owner_id=u and status='running') or exists(select 1 from public.agent_work_handoffs where session_id=p_session_id and owner_id=u and state='in_progress') into running;
  update public.agent_sessions set pause_requested=true,status=case when running then status else 'paused' end,paused_at=case when running then paused_at else now() end where id=p_session_id and owner_id=u and status not in ('completed','canceled','failed');
  return jsonb_build_object('ok',true,'pause_requested',true,'waiting_for_atomic_action',running);
end $$;

create or replace function public.command_center_agent_resume(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); s public.agent_sessions%rowtype; nxt public.agent_steps%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=u for update; if not found then raise exception 'Agent session not found'; end if;
  if s.status<>'paused' then raise exception 'Only paused sessions can resume'; end if;
  if exists(select 1 from public.agent_circuit_breakers where owner_id=u and session_id=s.id and status='open' and breaker_type='no_progress') then raise exception 'No-progress circuit breaker must be reconciled first'; end if;
  select * into nxt from public.agent_steps st where st.session_id=s.id and st.owner_id=u and st.status='pending' and not exists(select 1 from unnest(st.dependencies) d(id) left join public.agent_steps ds on ds.id=d.id and ds.owner_id=u and ds.session_id=s.id where ds.id is null or ds.status<>'verified') order by (st.project_id=s.current_project_id) desc,(st.project_id=s.primary_project_id) desc,st.position limit 1;
  if not found then raise exception 'No eligible pending step'; end if;
  update public.agent_sessions set status='active',pause_requested=false,paused_at=null,current_project_id=nxt.project_id,current_step_id=nxt.id,exact_next_action=nxt.title where id=s.id;
  return jsonb_build_object('ok',true,'session_id',s.id,'current_step_id',nxt.id);
end $$;

create or replace function public.command_center_agent_cancel(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); running boolean; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.agent_sessions where id=p_session_id and owner_id=u) then raise exception 'Agent session not found'; end if;
  select exists(select 1 from public.agent_steps where session_id=p_session_id and owner_id=u and status='running') or exists(select 1 from public.agent_work_handoffs where session_id=p_session_id and owner_id=u and state='in_progress') into running;
  update public.agent_sessions set cancel_requested=true,status=case when running then status else 'canceled' end,canceled_at=case when running then canceled_at else now() end where id=p_session_id and owner_id=u and status not in ('completed','canceled','failed');
  if not running then
    update public.agent_steps set status='canceled' where session_id=p_session_id and owner_id=u and status='pending';
    update public.agent_work_handoffs set state='canceled',ended_at=now() where session_id=p_session_id and owner_id=u and state in ('proposed','approved');
    update public.agent_work_queue set status='canceled',completed_at=now() where session_id=p_session_id and owner_id=u and status='queued';
  end if;
  return jsonb_build_object('ok',true,'cancel_requested',true,'waiting_for_atomic_action',running);
end $$;

create or replace function public.command_center_agent_list_sessions(p_project_id text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); outj jsonb; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'objective',s.objective,'scope_mode',s.scope_mode,'primary_project_id',s.primary_project_id,'current_project_id',s.current_project_id,'current_step_id',s.current_step_id,'status',s.status,'exact_next_action',s.exact_next_action,'dry_run',s.dry_run,'created_at',s.created_at,'updated_at',s.updated_at) order by s.updated_at desc),'[]'::jsonb) into outj
  from public.agent_sessions s where s.owner_id=u and (p_project_id is null or exists(select 1 from public.agent_session_projects sp where sp.session_id=s.id and sp.owner_id=u and sp.project_id=p_project_id));
  return outj;
end $$;

create or replace function public.command_center_agent_status(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); s public.agent_sessions%rowtype; pj jsonb; sj jsonb; hj jsonb; bj jsonb; ej jsonb; cp jsonb; mj jsonb; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=u; if not found then raise exception 'Agent session not found'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('project_id',project_id,'role',project_role,'state',state,'books_target',books_target) order by sort_order),'[]'::jsonb) into pj from public.agent_session_projects where session_id=s.id and owner_id=u;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'project_id',project_id,'step_key',step_key,'title',title,'details',details,'position',position,'route',route,'tool_category',tool_category,'scope_class',scope_class,'model_rung',model_rung,'risk_class',risk_class,'impact_radius',impact_radius,'status',status,'verification_required',verification_required,'failure_class',last_failure_class,'retry_count',retry_count,'meaningful_failure_count',meaningful_failure_count) order by position,created_at),'[]'::jsonb) into sj from public.agent_steps where session_id=s.id and owner_id=u;
  select coalesce(jsonb_agg(jsonb_build_object('handoff_id',id,'project_id',project_id,'step_id',step_id,'provider',provider,'model_rung',model_rung,'scope_class',scope_class,'risk_class',risk_class,'approval_state',approval_state,'state',state,'failure_class',failure_class,'normal_chat_resumed',normal_chat_resumed) order by created_at desc),'[]'::jsonb) into hj from public.agent_work_handoffs where session_id=s.id and owner_id=u;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'type',breaker_type,'scope_key',scope_key,'provider',provider,'reason',reason,'failure_count',failure_count,'status',status) order by opened_at desc),'[]'::jsonb) into bj from public.agent_circuit_breakers where owner_id=u and (session_id=s.id or (session_id is null and status='open'));
  select coalesce(jsonb_agg(jsonb_build_object('kind',event_kind,'message',message,'project_id',project_id,'step_id',step_id,'created_at',created_at) order by created_at desc),'[]'::jsonb) into ej from (select * from public.agent_run_events where owner_id=u and session_id=s.id order by created_at desc limit 20) x;
  select jsonb_build_object('id',id,'created_at',created_at,'exact_next_action',exact_next_action,'progress_hash',progress_hash) into cp from public.agent_checkpoints where owner_id=u and session_id=s.id order by created_at desc limit 1;
  select jsonb_build_object('total_steps',count(*),'verified_steps',count(*) filter(where status='verified'),'normal_chat_steps',count(*) filter(where route='normal_chat'),'work_steps',count(*) filter(where route='work'),'blocked_steps',count(*) filter(where status in ('blocked','needs_user_action')),'work_handoffs',(select count(*) from public.agent_work_handoffs h where h.owner_id=u and h.session_id=s.id),'luna_high_handoffs',(select count(*) from public.agent_work_handoffs h where h.owner_id=u and h.session_id=s.id and h.model_rung='GPT-6 Luna High'),'sol_light_handoffs',(select count(*) from public.agent_work_handoffs h where h.owner_id=u and h.session_id=s.id and h.model_rung='GPT-6.1 Sol Light'),'sol_medium_handoffs',(select count(*) from public.agent_work_handoffs h where h.owner_id=u and h.session_id=s.id and h.model_rung='GPT-6.1 Sol Medium'),'failed_attempts',(select count(*) from public.agent_step_attempts a where a.owner_id=u and a.session_id=s.id and a.status='failed'),'work_allowance_total','N/A','work_allowance_remaining','N/A','predicted_work_percentage','N/A') into mj from public.agent_steps where owner_id=u and session_id=s.id;
  return jsonb_build_object('session',jsonb_build_object('id',s.id,'objective',s.objective,'status',s.status,'scope_mode',s.scope_mode,'primary_project_id',s.primary_project_id,'current_project_id',s.current_project_id,'current_step_id',s.current_step_id,'dry_run',s.dry_run,'pause_requested',s.pause_requested,'cancel_requested',s.cancel_requested,'exact_next_action',s.exact_next_action,'started_at',s.started_at,'completed_at',s.completed_at),'projects',pj,'steps',sj,'work_queue',hj,'circuit_breakers',bj,'recent_events',ej,'latest_checkpoint',cp,'metrics',mj);
end $$;

revoke execute on function public.command_center_agent_create_session(text,text[],text,jsonb,jsonb,jsonb,jsonb,jsonb,boolean,text) from public,anon;
grant execute on function public.command_center_agent_create_session(text,text[],text,jsonb,jsonb,jsonb,jsonb,jsonb,boolean,text) to authenticated;
revoke execute on function public.command_center_agent_add_step(uuid,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text,uuid[],text,text,text,integer,jsonb) from public,anon;
grant execute on function public.command_center_agent_add_step(uuid,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text,uuid[],text,text,text,integer,jsonb) to authenticated;
revoke execute on function public.command_center_agent_start_session(uuid) from public,anon; grant execute on function public.command_center_agent_start_session(uuid) to authenticated;
revoke execute on function public.command_center_agent_attach_authorization(uuid,uuid) from public,anon; grant execute on function public.command_center_agent_attach_authorization(uuid,uuid) to authenticated;
revoke execute on function public.command_center_agent_begin_step(uuid) from public,anon; grant execute on function public.command_center_agent_begin_step(uuid) to authenticated;
revoke execute on function public.command_center_agent_add_evidence(uuid,text,text,text,jsonb) from public,anon; grant execute on function public.command_center_agent_add_evidence(uuid,text,text,text,jsonb) to authenticated;
revoke execute on function public.command_center_agent_confirm_evidence(uuid,text) from public,anon; grant execute on function public.command_center_agent_confirm_evidence(uuid,text) to authenticated;
revoke execute on function public.command_center_agent_verify_step(uuid) from public,anon; grant execute on function public.command_center_agent_verify_step(uuid) to authenticated;
revoke execute on function public.command_center_agent_checkpoint(uuid,text,jsonb) from public,anon; grant execute on function public.command_center_agent_checkpoint(uuid,text,jsonb) to authenticated;
revoke execute on function public.command_center_agent_pause(uuid) from public,anon; grant execute on function public.command_center_agent_pause(uuid) to authenticated;
revoke execute on function public.command_center_agent_resume(uuid) from public,anon; grant execute on function public.command_center_agent_resume(uuid) to authenticated;
revoke execute on function public.command_center_agent_cancel(uuid) from public,anon; grant execute on function public.command_center_agent_cancel(uuid) to authenticated;
revoke execute on function public.command_center_agent_list_sessions(text) from public,anon; grant execute on function public.command_center_agent_list_sessions(text) to authenticated;
revoke execute on function public.command_center_agent_status(uuid) from public,anon; grant execute on function public.command_center_agent_status(uuid) to authenticated;
