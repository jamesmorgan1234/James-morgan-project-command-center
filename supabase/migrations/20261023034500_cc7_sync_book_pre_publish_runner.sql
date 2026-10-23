-- Zero-cost synchronous V7 book pre-publish runner.
-- This is intentionally fail-closed: it verifies canonical Command Center records only,
-- records that visual PDF/package inspection is still outstanding, and stops at James's PC review gate.

create or replace function public.cc7_agent_owner_execute_run(p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner uuid := auth.uid();
  v_run public.cc7_agent_runs%rowtype;
  v_project public.cc7_projects%rowtype;
  v_task public.cc7_agent_tasks%rowtype;
  v_book_count integer := 0;
  v_bad_book_count integer := 0;
  v_expected_books integer := null;
  v_title_gap_count integer := 0;
  v_reasons text[] := '{}'::text[];
  v_evidence jsonb;
  v_next text := 'PC REQUIRED: Inspect the exact final PDF/package on your computer. Choose Approve only after the final package passes your inspection; choose Decline if any change is needed. Publishing remains locked until approval.';
begin
  if v_owner is null then raise exception 'authenticated owner required'; end if;
  if not exists (select 1 from public.cc7_owner_access a where a.owner_id=v_owner and a.enabled=true) then
    raise exception 'Command Center V7 owner access required';
  end if;

  select * into v_run
  from public.cc7_agent_runs
  where id=p_run_id and owner_id=v_owner
  for update;
  if not found then raise exception 'V7 Agent run not found'; end if;

  if v_run.status not in ('queued','working') then
    return jsonb_build_object('ok',true,'run',to_jsonb(v_run),'already_terminal',true);
  end if;
  if v_run.project_id is null then raise exception 'A project-scoped run is required'; end if;
  if v_run.control_mode='project_checkpoint' then raise exception 'Project Checkpoint is read-only and cannot execute Agent review'; end if;
  if coalesce(v_run.allow_work,false) then raise exception 'This synchronous pre-publish runner never authorizes Work'; end if;
  if v_run.objective not like '[PRE-PUBLISH BOOK REVIEW]%' then
    raise exception 'No synchronous execution route is registered for this Agent objective';
  end if;

  select * into v_project
  from public.cc7_projects
  where id=v_run.project_id and owner_id=v_owner
  for update;
  if not found then raise exception 'V7 project not found'; end if;

  update public.cc7_agent_runs
  set status='working',started_at=coalesce(started_at,now()),
      exact_next_action='Verify canonical book production evidence and publication truth; do not publish or use Work.',
      updated_at=now()
  where id=v_run.id;

  insert into public.cc7_agent_runner_heartbeat(owner_id,runner_id,status,last_seen_at,last_success_at,detail,updated_at)
  values(v_owner,'cc7-book-prepublish-sync-v1','working',now(),null,'Synchronous owner-triggered book pre-publish verification is running.',now())
  on conflict(owner_id) do update set
    runner_id=excluded.runner_id,status=excluded.status,last_seen_at=excluded.last_seen_at,
    detail=excluded.detail,updated_at=now();

  insert into public.cc7_agent_tasks(
    run_id,owner_id,project_id,position,title,details,route,status,
    requires_verification,side_effect,idempotency_key,evidence,started_at,updated_at
  ) values(
    v_run.id,v_owner,v_project.id,0,'Verify pre-publish canonical book evidence',
    'Verify production-complete project state, verified book mapping, unpublished publication truth, approved/package verification records, and owner review boundary. Visual PDF/package inspection is explicitly reserved for James on PC.',
    'deterministic','working',true,false,'book-prepublish:'||v_run.id::text,'{}'::jsonb,now(),now()
  )
  on conflict(run_id,position) do update set
    status='working',failure_class=null,started_at=coalesce(public.cc7_agent_tasks.started_at,now()),updated_at=now()
  returning * into v_task;

  if lower(coalesce(v_project.category,'')) not like '%kdp%' and v_project.id not like 'kdp-%' then
    v_reasons:=array_append(v_reasons,'Project is not a KDP/book project.');
  end if;
  if lower(coalesce(v_project.status,'')) <> 'agent review required / unpublished' then
    v_reasons:=array_append(v_reasons,'Project is not at the Agent Review Needed gate.');
  end if;
  if lower(coalesce(v_project.stage,'')) not like 'production complete%' then
    v_reasons:=array_append(v_reasons,'Production-complete stage is not verified.');
  end if;
  if btrim(coalesce(v_project.verification,''))='' then
    v_reasons:=array_append(v_reasons,'Project verification summary is missing.');
  end if;
  if v_project.last_verified is null then
    v_reasons:=array_append(v_reasons,'Project verification date is missing.');
  end if;

  select count(*) into v_book_count
  from public.cc7_metrics m
  where m.owner_id=v_owner and m.project_id=v_project.id and m.verified=true
    and m.key like 'bookmap.%.metadata';
  if v_book_count=0 then
    v_reasons:=array_append(v_reasons,'No verified book mapping exists.');
  end if;

  select count(*) into v_bad_book_count
  from public.cc7_metrics m
  where m.owner_id=v_owner and m.project_id=v_project.id and m.verified=true
    and m.key like 'bookmap.%.metadata'
    and (
      btrim(coalesce((m.value_text::jsonb)->>'title',''))=''
      or lower(coalesce((m.value_text::jsonb)->>'publication_state','')) <> 'unpublished'
      or lower(coalesce((m.value_text::jsonb)->>'publication_status','')) not like '%not published%'
    );
  if v_bad_book_count>0 then
    v_reasons:=array_append(v_reasons,'One or more verified book mappings do not prove an unpublished pre-publish state.');
  end if;

  select m.value_numeric::integer into v_expected_books
  from public.cc7_metrics m
  where m.owner_id=v_owner and m.project_id=v_project.id and m.verified=true and m.key='books'
  order by m.updated_at desc limit 1;
  if v_expected_books is not null and v_expected_books<>v_book_count then
    v_reasons:=array_append(v_reasons,'Verified series book count does not match verified book mappings.');
  end if;
  if lower(coalesce(v_project.category,'')) like '%individual book%' and v_book_count<>1 then
    v_reasons:=array_append(v_reasons,'Individual-book project must have exactly one verified book mapping.');
  end if;

  if lower(coalesce(v_project.category,'')) like '%individual book%' then
    if lower(coalesce(v_project.verification,'')) not like '%approved cover locked%' then
      v_reasons:=array_append(v_reasons,'Exact approved-cover lock is not present in the project verification record.');
    end if;
  else
    if lower(coalesce(v_project.verification,'')) not like '%package%verified%'
       and lower(coalesce(v_project.verification,'')) not like '%production qc verified%' then
      v_reasons:=array_append(v_reasons,'Verified final-package/production-QC evidence is missing for the series.');
    end if;
  end if;

  v_evidence:=jsonb_build_object(
    'runner','cc7-book-prepublish-sync-v1',
    'project_id',v_project.id,
    'project_last_verified',v_project.last_verified,
    'verified_bookmap_count',v_book_count,
    'expected_book_count',v_expected_books,
    'canonical_record_checks_passed',cardinality(v_reasons)=0,
    'visual_pdf_or_package_inspection_performed',false,
    'visual_inspection_reserved_for_owner_pc_review',true,
    'work_authorized',false,
    'publishing_authorized',false,
    'checked_at',now(),
    'reasons',to_jsonb(v_reasons)
  );

  if cardinality(v_reasons)>0 then
    update public.cc7_agent_tasks
    set status='blocked',failure_class='verification_gap',evidence=v_evidence,completed_at=now(),updated_at=now()
    where id=v_task.id;
    update public.cc7_agent_runs
    set status='blocked',exact_next_action='Agent pre-publish verification is blocked by missing or conflicting canonical evidence. Correct the recorded verification gap, then run the Agent review again.',completed_at=now(),updated_at=now()
    where id=v_run.id;
    update public.cc7_projects
    set blocker='Agent pre-publish verification blocked: '||array_to_string(v_reasons,' '),
        next_action='Correct the recorded canonical verification gap, then run the Agent pre-publish review again.',updated_at=now()
    where id=v_project.id and owner_id=v_owner;
    update public.cc7_agent_controls
    set current_run_id=null,runner_state='blocked',updated_by='cc7-book-prepublish-sync-v1',updated_at=now()
    where owner_id=v_owner;
    insert into public.cc7_agent_runner_heartbeat(owner_id,runner_id,status,last_seen_at,last_success_at,detail,updated_at)
    values(v_owner,'cc7-book-prepublish-sync-v1','degraded',now(),null,'Book pre-publish verification blocked by canonical evidence gaps.',now())
    on conflict(owner_id) do update set status='degraded',last_seen_at=now(),detail=excluded.detail,updated_at=now();
    insert into public.cc7_agent_events(owner_id,run_id,task_id,kind,message,payload)
    values(v_owner,v_run.id,v_task.id,'prepublish_blocked','Book pre-publish Agent verification blocked by canonical evidence gaps.',v_evidence);
    return jsonb_build_object('ok',true,'outcome','blocked','run_id',v_run.id,'task_id',v_task.id,'evidence',v_evidence);
  end if;

  update public.cc7_agent_tasks
  set status='verified',evidence=v_evidence,completed_at=now(),updated_at=now()
  where id=v_task.id;

  insert into public.cc7_agent_approvals(owner_id,run_id,task_id,approval_type,state,reason)
  select v_owner,v_run.id,v_task.id,'protected_action','required',
    '[BOOK OWNER PC REVIEW] Inspect the exact final PDF/package on your computer. Approve only after the inspected final package is acceptable. Decline if any correction is needed.'
  where not exists(
    select 1 from public.cc7_agent_approvals a
    where a.owner_id=v_owner and a.run_id=v_run.id and a.approval_type='protected_action' and a.state='required'
  );

  update public.cc7_agent_runs
  set status='needs_user',exact_next_action=v_next,completed_at=null,updated_at=now()
  where id=v_run.id;

  update public.cc7_agent_controls
  set current_run_id=v_run.id,runner_state='needs_user',updated_by='cc7-book-prepublish-sync-v1',updated_at=now()
  where owner_id=v_owner;

  insert into public.cc7_agent_runner_heartbeat(owner_id,runner_id,status,last_seen_at,last_success_at,detail,updated_at)
  values(v_owner,'cc7-book-prepublish-sync-v1','ready',now(),now(),'Canonical book pre-publish verification passed; owner PC visual review is required.',now())
  on conflict(owner_id) do update set
    runner_id=excluded.runner_id,status='ready',last_seen_at=now(),last_success_at=now(),detail=excluded.detail,updated_at=now();

  insert into public.cc7_agent_events(owner_id,run_id,task_id,kind,message,payload)
  values(v_owner,v_run.id,v_task.id,'prepublish_verified','Canonical book pre-publish Agent verification passed. Owner PC visual review is now required.',v_evidence);

  select * into v_run from public.cc7_agent_runs where id=v_run.id;
  return jsonb_build_object('ok',true,'outcome','needs_owner_pc_review','run',to_jsonb(v_run),'task',to_jsonb(v_task),'evidence',v_evidence);
end;
$function$;

-- Extend the existing explicit approval action so the protected book owner-review gate
-- has a truthful lifecycle. Approval never publishes; it only unlocks the publishing stage.
create or replace function public.cc7_agent_owner_resolve_approval(p_approval_id uuid,p_approved boolean)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner uuid := auth.uid();
  v_approval public.cc7_agent_approvals%rowtype;
  v_run public.cc7_agent_runs%rowtype;
  v_is_book_review boolean := false;
begin
  if v_owner is null then raise exception 'authenticated owner required'; end if;
  if not exists (select 1 from public.cc7_owner_access a where a.owner_id=v_owner and a.enabled=true) then
    raise exception 'Command Center V7 owner access required';
  end if;

  select * into v_approval from public.cc7_agent_approvals where id=p_approval_id and owner_id=v_owner for update;
  if not found then raise exception 'V7 Agent approval not found'; end if;
  if v_approval.state <> 'required' then
    return jsonb_build_object('ok',true,'approval',to_jsonb(v_approval),'already_resolved',true);
  end if;

  select * into v_run from public.cc7_agent_runs where id=v_approval.run_id and owner_id=v_owner for update;
  v_is_book_review := found
    and v_approval.approval_type='protected_action'
    and coalesce(v_approval.reason,'') like '[BOOK OWNER PC REVIEW]%'
    and coalesce(v_run.objective,'') like '[PRE-PUBLISH BOOK REVIEW]%';

  update public.cc7_agent_approvals
  set state=case when coalesce(p_approved,false) then 'approved' else 'declined' end,resolved_at=now()
  where id=v_approval.id
  returning * into v_approval;

  insert into public.cc7_agent_events(owner_id,run_id,task_id,kind,message,payload)
  values(v_owner,v_approval.run_id,v_approval.task_id,'owner_approval',
    case when p_approved then 'Owner approved exact V7 Agent step.' else 'Owner declined exact V7 Agent step.' end,
    jsonb_build_object('approval_id',v_approval.id,'approval_type',v_approval.approval_type,'state',v_approval.state));

  if v_is_book_review then
    if coalesce(p_approved,false) then
      update public.cc7_projects
      set status='Ready to publish — owner approved / unpublished',
          stage='Agent verification and owner PC review complete; ready for publishing stage',
          next_action='Publishing stage only: upload the owner-approved final package to KDP, run Previewer, complete required metadata/ISBN steps, and submit according to the locked rollout plan.',
          blocker=null,updated_at=now()
      where id=v_run.project_id and owner_id=v_owner
        and lower(coalesce(status,'')) like 'owner review required%';
      update public.cc7_agent_runs
      set status='completed',exact_next_action='Owner PC review approved. Project is ready for the publishing stage; no publication action has been performed.',completed_at=now(),updated_at=now()
      where id=v_run.id;
    else
      update public.cc7_projects
      set status='Corrections required / unpublished',
          stage='Owner PC review found changes required',
          next_action='Correct the final files in normal chat, regenerate/reverify affected outputs, then return this project to Agent Review Needed and run the pre-publish Agent review again.',
          blocker='Owner PC review declined the current final package; corrections are required before publishing.',updated_at=now()
      where id=v_run.project_id and owner_id=v_owner;
      update public.cc7_agent_runs
      set status='completed',exact_next_action='Owner declined the inspected package. Correct and reverify the affected files before a new pre-publish review.',completed_at=now(),updated_at=now()
      where id=v_run.id;
    end if;
    update public.cc7_agent_controls
    set current_run_id=null,runner_state='idle',updated_by='owner_ui_v7',updated_at=now()
    where owner_id=v_owner;
  end if;

  return jsonb_build_object('ok',true,'approval',to_jsonb(v_approval),'already_resolved',false,'book_owner_review',v_is_book_review);
end;
$function$;

grant execute on function public.cc7_agent_owner_execute_run(uuid) to authenticated;
revoke execute on function public.cc7_agent_owner_execute_run(uuid) from anon;
revoke execute on function public.cc7_agent_owner_execute_run(uuid) from public;
