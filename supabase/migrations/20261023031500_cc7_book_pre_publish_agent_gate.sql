-- KDP pre-publish truth gate.
-- Production-complete unpublished books must pass a real Agent review before owner PC review.
-- Project Checkpoint is read-only and can never promote publication readiness.

create or replace function public.cc7_book_pre_publish_agent_gate()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_is_review_run boolean;
  v_reached_owner_review boolean;
begin
  v_is_review_run :=
    new.project_id is not null
    and new.control_mode <> 'project_checkpoint'
    and coalesce(new.allow_work,false) = false
    and new.objective like '[PRE-PUBLISH BOOK REVIEW]%';

  if not v_is_review_run or old.status is not distinct from new.status then
    return new;
  end if;

  v_reached_owner_review :=
    new.status in ('completed','needs_user')
    and (
      coalesce(new.exact_next_action,'') ilike '%owner%review%'
      or coalesce(new.exact_next_action,'') ilike '%pc required%'
      or coalesce(new.exact_next_action,'') ilike '%inspect%computer%'
    );

  if v_reached_owner_review then
    update public.cc7_projects
    set status='Owner review required — Agent verified / unpublished',
        next_action='PC REQUIRED: James Morgan must inspect the exact final PDF/package on his computer. Do not upload, submit, or publish until James explicitly approves the inspected final package.',
        blocker='Owner PC review is required after Agent verification and before any publishing action.',
        updated_at=now()
    where id=new.project_id
      and owner_id=new.owner_id
      and (lower(coalesce(category,'')) like '%kdp%' or id like 'kdp-%')
      and lower(coalesce(status,'')) in (
        'agent review required / unpublished',
        'production complete / unpublished'
      );
  end if;

  return new;
end;
$function$;

drop trigger if exists cc7_book_pre_publish_agent_gate_trg on public.cc7_agent_runs;
create trigger cc7_book_pre_publish_agent_gate_trg
after update of status, exact_next_action on public.cc7_agent_runs
for each row
execute function public.cc7_book_pre_publish_agent_gate();

-- Align all visible production-complete unpublished KDP projects with the owner-required Agent gate.
update public.cc7_projects
set status='Agent review required / unpublished',
    stage=case
      when lower(coalesce(category,'')) like '%individual book%'
        then 'Production complete; awaiting required Agent pre-publish review'
      else 'Production complete; awaiting required Agent pre-publish review before owner PC review'
    end,
    next_action='Run the Agent pre-publish review. The Agent must verify all normal-chat production/QC requirements and stop at the owner PC review boundary. Do not upload, submit, publish, or use Work yet.',
    blocker='Required pre-publish Agent review has not yet been completed.',
    updated_at=now()
where status='Production complete / unpublished'
  and (lower(coalesce(category,'')) like '%kdp%' or id like 'kdp-%')
  and coalesce(source_status,'') not like 'filing_only_hidden%';
