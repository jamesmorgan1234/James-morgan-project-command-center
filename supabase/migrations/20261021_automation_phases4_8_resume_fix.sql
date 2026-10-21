-- Preserve successful workflow/action attempt state when a later step fails.
-- Returned execution failures are handled without raising through the root
-- exception block, so already-completed workflow steps remain durable and the
-- next retry resumes at the first incomplete step.

create or replace function command_center_private.execute_run(p_run_id uuid)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  r public.automation_runs%rowtype;
  d public.automation_dispatch_queue%rowtype;
  v_attempt integer;
  v_result jsonb;
  v_report uuid;
  v_notification_state text;
  v_error text;
  v_delay integer;
begin
  select * into r from public.automation_runs where id=p_run_id for update;
  if not found then return 'missing'; end if;
  if r.status in ('succeeded','skipped','canceled') then return r.status; end if;

  select * into d from public.automation_dispatch_queue where id=r.dispatch_id for update;
  if not found then return 'missing_dispatch'; end if;

  v_attempt:=r.attempt_count+1;
  update public.automation_runs
    set status='running',attempt_count=v_attempt,started_at=coalesce(started_at,now()),
        next_retry_at=null,last_error=null,updated_at=now()
    where id=r.id returning * into r;
  update public.automation_dispatch_queue
    set status='claimed',claimed_at=coalesce(claimed_at,now())
    where id=d.id;
  perform command_center_private.log_run_event(
    r.id,'attempt_started','running',
    jsonb_build_object('attempt',v_attempt,'max_attempts',r.max_attempts)
  );

  if d.condition_state not in ('not_required','passed') then
    update public.automation_runs
      set status='skipped',completed_at=now(),resume_state='{}'::jsonb,updated_at=now()
      where id=r.id;
    update public.automation_dispatch_queue
      set status='skipped',completed_at=now(),
          notification_state=case when d.job_kind='notification' then 'suppressed' else 'not_applicable' end
      where id=d.id;
    perform command_center_private.log_run_event(
      r.id,'condition_blocked','skipped',jsonb_build_object('condition_state',d.condition_state)
    );
    return 'skipped';
  end if;

  begin
    if r.run_kind='notification' then
      v_notification_state:=command_center_private.ensure_dispatch_notification(d.id);
      if v_notification_state='delivered' then
        v_result:=jsonb_build_object('success',true,'notification_state',v_notification_state);
      elsif v_notification_state='suppressed' then
        update public.automation_runs
          set status='skipped',completed_at=now(),resume_state='{}'::jsonb,updated_at=now()
          where id=r.id;
        update public.automation_dispatch_queue set status='skipped',completed_at=now() where id=d.id;
        perform command_center_private.log_run_event(r.id,'notification_suppressed','skipped','{}'::jsonb);
        return 'skipped';
      else
        raise exception 'Notification delivery failed';
      end if;

    elsif r.run_kind='report' then
      if r.target_id is null then raise exception 'Report run has no target'; end if;
      v_report:=command_center_private.generate_report(r.target_id,r.id,'run:'||r.id::text||':report');
      v_result:=jsonb_build_object('success',true,'report_run_id',v_report);

    elsif r.run_kind='action' then
      if r.target_id is null then raise exception 'Action run has no target'; end if;
      v_result:=command_center_private.execute_action(r.target_id,r.id,'run:'||r.id::text||':action');
      if coalesce((v_result->>'success')::boolean,false) is false then
        v_error:=coalesce(v_result->>'error','Action execution failed');
        if v_attempt<r.max_attempts then
          v_delay:=least(3600,60*(2^greatest(v_attempt-1,0))::integer);
          update public.automation_runs
            set status='retrying',next_retry_at=now()+make_interval(secs=>v_delay),
                last_error=v_error,metadata=metadata||jsonb_build_object('last_result',v_result),updated_at=now()
            where id=r.id;
          update public.automation_dispatch_queue set status='failed',completed_at=null where id=d.id;
          perform command_center_private.log_run_event(
            r.id,'attempt_failed','retrying',
            jsonb_build_object('attempt',v_attempt,'error',v_error,'retry_in_seconds',v_delay,'result',v_result)
          );
          return 'retrying';
        else
          update public.automation_runs
            set status='failed',next_retry_at=null,last_error=v_error,completed_at=now(),
                metadata=metadata||jsonb_build_object('last_result',v_result),updated_at=now()
            where id=r.id;
          update public.automation_dispatch_queue set status='failed',completed_at=now() where id=d.id;
          perform command_center_private.log_run_event(
            r.id,'run_failed','failed',jsonb_build_object('attempt',v_attempt,'error',v_error,'result',v_result)
          );
          return 'failed';
        end if;
      end if;

    else
      if r.target_id is null then raise exception 'Workflow run has no target'; end if;
      v_result:=command_center_private.execute_workflow(r.target_id,r.id);
      if coalesce((v_result->>'success')::boolean,false) is false then
        v_error:=coalesce(v_result->>'error','Workflow execution failed');
        if v_attempt<r.max_attempts then
          v_delay:=least(3600,60*(2^greatest(v_attempt-1,0))::integer);
          update public.automation_runs
            set status='retrying',next_retry_at=now()+make_interval(secs=>v_delay),
                last_error=v_error,metadata=metadata||jsonb_build_object('last_result',v_result),updated_at=now()
            where id=r.id;
          update public.automation_dispatch_queue set status='failed',completed_at=null where id=d.id;
          perform command_center_private.log_run_event(
            r.id,'attempt_failed','retrying',
            jsonb_build_object('attempt',v_attempt,'error',v_error,'retry_in_seconds',v_delay,'result',v_result)
          );
          return 'retrying';
        else
          update public.automation_runs
            set status='failed',next_retry_at=null,last_error=v_error,completed_at=now(),
                metadata=metadata||jsonb_build_object('last_result',v_result),updated_at=now()
            where id=r.id;
          update public.automation_dispatch_queue set status='failed',completed_at=now() where id=d.id;
          perform command_center_private.log_run_event(
            r.id,'run_failed','failed',jsonb_build_object('attempt',v_attempt,'error',v_error,'result',v_result)
          );
          return 'failed';
        end if;
      end if;
    end if;

    update public.automation_runs
      set status='succeeded',completed_at=now(),next_retry_at=null,last_error=null,
          resume_state='{}'::jsonb,metadata=metadata||jsonb_build_object('result',coalesce(v_result,'{}'::jsonb)),updated_at=now()
      where id=r.id;
    update public.automation_dispatch_queue
      set status='completed',completed_at=now(),
          notification_state=case when d.job_kind='notification' then notification_state else 'not_applicable' end
      where id=d.id;
    perform command_center_private.log_run_event(r.id,'run_completed','succeeded',coalesce(v_result,'{}'::jsonb));
    return 'succeeded';

  exception when others then
    v_error:=sqlerrm;
    if v_attempt<r.max_attempts then
      v_delay:=least(3600,60*(2^greatest(v_attempt-1,0))::integer);
      update public.automation_runs
        set status='retrying',next_retry_at=now()+make_interval(secs=>v_delay),last_error=v_error,updated_at=now()
        where id=r.id;
      update public.automation_dispatch_queue set status='failed',completed_at=null where id=d.id;
      perform command_center_private.log_run_event(
        r.id,'attempt_failed','retrying',
        jsonb_build_object('attempt',v_attempt,'error',v_error,'retry_in_seconds',v_delay)
      );
      return 'retrying';
    else
      update public.automation_runs
        set status='failed',next_retry_at=null,last_error=v_error,completed_at=now(),updated_at=now()
        where id=r.id;
      update public.automation_dispatch_queue set status='failed',completed_at=now() where id=d.id;
      perform command_center_private.log_run_event(
        r.id,'run_failed','failed',jsonb_build_object('attempt',v_attempt,'error',v_error)
      );
      return 'failed';
    end if;
  end;
end;
$$;

revoke all on function command_center_private.execute_run(uuid) from public,anon,authenticated;
grant execute on function command_center_private.execute_run(uuid) to postgres,service_role;