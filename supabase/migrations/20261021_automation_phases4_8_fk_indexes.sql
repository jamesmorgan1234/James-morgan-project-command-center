-- Automation completion performance hardening.
-- Cover Automation foreign keys used by cascading deletes and joins.

create index if not exists automation_schedules_project_fk_idx
  on public.automation_schedules(project_id) where project_id is not null;
create index if not exists automation_schedules_condition_fk_idx
  on public.automation_schedules(condition_id) where condition_id is not null;

create index if not exists automation_conditions_project_fk_idx
  on public.automation_conditions(project_id);
create index if not exists automation_condition_evaluations_project_fk_idx
  on public.automation_condition_evaluations(project_id);
create index if not exists automation_condition_evaluations_condition_fk_idx
  on public.automation_condition_evaluations(condition_id);

create index if not exists automation_dispatch_project_fk_idx
  on public.automation_dispatch_queue(project_id) where project_id is not null;
create index if not exists automation_dispatch_condition_fk_idx
  on public.automation_dispatch_queue(condition_id) where condition_id is not null;

create index if not exists automation_notifications_project_fk_idx
  on public.automation_notifications(project_id) where project_id is not null;
create index if not exists automation_notifications_schedule_fk_idx
  on public.automation_notifications(schedule_id) where schedule_id is not null;
create index if not exists automation_notifications_condition_fk_idx
  on public.automation_notifications(condition_id) where condition_id is not null;

create index if not exists automation_report_definitions_project_fk_idx
  on public.automation_report_definitions(project_id) where project_id is not null;
create index if not exists automation_report_runs_project_fk_idx
  on public.automation_report_runs(project_id) where project_id is not null;
create index if not exists automation_report_runs_definition_fk_idx
  on public.automation_report_runs(report_definition_id);
create index if not exists automation_report_runs_run_fk_idx
  on public.automation_report_runs(run_id);

create index if not exists automation_action_definitions_project_fk_idx
  on public.automation_action_definitions(project_id) where project_id is not null;
create index if not exists automation_action_executions_definition_fk_idx
  on public.automation_action_executions(action_definition_id);
create index if not exists automation_action_executions_run_fk_idx
  on public.automation_action_executions(run_id);

create index if not exists automation_runs_project_fk_idx
  on public.automation_runs(project_id) where project_id is not null;
create index if not exists automation_runs_schedule_fk_idx
  on public.automation_runs(schedule_id) where schedule_id is not null;
create index if not exists automation_run_events_owner_fk_idx
  on public.automation_run_events(owner_id);

create index if not exists automation_workflow_steps_project_fk_idx
  on public.automation_workflow_steps(project_id) where project_id is not null;
create index if not exists automation_workflow_runs_workflow_fk_idx
  on public.automation_workflow_runs(workflow_id);
create index if not exists automation_workflow_step_runs_owner_fk_idx
  on public.automation_workflow_step_runs(owner_id);
create index if not exists automation_workflow_step_runs_step_fk_idx
  on public.automation_workflow_step_runs(workflow_step_id);