-- Agent Mode relationship integrity and FK covering indexes.

do $$ begin
  if not exists(select 1 from pg_constraint where conname='agent_sessions_current_step_fk') then
    alter table public.agent_sessions add constraint agent_sessions_current_step_fk foreign key(current_step_id) references public.agent_steps(id) on delete set null;
  end if;
  if not exists(select 1 from pg_constraint where conname='agent_sessions_latest_checkpoint_fk') then
    alter table public.agent_sessions add constraint agent_sessions_latest_checkpoint_fk foreign key(latest_checkpoint_id) references public.agent_checkpoints(id) on delete set null;
  end if;
end $$;

create index if not exists agent_sessions_primary_project_fk_idx on public.agent_sessions(primary_project_id);
create index if not exists agent_sessions_current_project_fk_idx on public.agent_sessions(current_project_id);
create index if not exists agent_sessions_current_step_fk_idx on public.agent_sessions(current_step_id);
create index if not exists agent_sessions_latest_checkpoint_fk_idx on public.agent_sessions(latest_checkpoint_id);
create index if not exists agent_session_projects_project_fk_idx on public.agent_session_projects(project_id);
create index if not exists agent_steps_project_fk_idx on public.agent_steps(project_id);
create index if not exists agent_steps_authorization_fk_idx on public.agent_steps(authorization_id);
create index if not exists agent_step_evidence_session_fk_idx on public.agent_step_evidence(session_id);
create index if not exists agent_step_evidence_step_fk_idx on public.agent_step_evidence(step_id);
create index if not exists agent_checkpoints_session_fk_idx on public.agent_checkpoints(session_id);
create index if not exists agent_checkpoints_project_fk_idx on public.agent_checkpoints(project_id);
create index if not exists agent_checkpoints_step_fk_idx on public.agent_checkpoints(step_id);
create index if not exists agent_attempts_session_fk_idx on public.agent_step_attempts(session_id);
create index if not exists agent_attempts_project_fk_idx on public.agent_step_attempts(project_id);
create index if not exists agent_attempts_handoff_fk_idx on public.agent_step_attempts(handoff_id);
create index if not exists agent_handoffs_session_fk_idx on public.agent_work_handoffs(session_id);
create index if not exists agent_handoffs_project_fk_idx on public.agent_work_handoffs(project_id);
create index if not exists agent_handoffs_step_fk_idx on public.agent_work_handoffs(step_id);
create index if not exists agent_handoffs_authorization_fk_idx on public.agent_work_handoffs(authorization_id);
create index if not exists agent_handoffs_attempt_fk_idx on public.agent_work_handoffs(attempt_id);
create index if not exists agent_work_queue_session_fk_idx on public.agent_work_queue(session_id);
create index if not exists agent_work_queue_project_fk_idx on public.agent_work_queue(project_id);
create index if not exists agent_work_queue_step_fk_idx on public.agent_work_queue(step_id);
create index if not exists agent_breakers_session_fk_idx on public.agent_circuit_breakers(session_id);
create index if not exists agent_breakers_project_fk_idx on public.agent_circuit_breakers(project_id);
create index if not exists agent_breakers_step_fk_idx on public.agent_circuit_breakers(step_id);
create index if not exists agent_events_session_fk_idx on public.agent_run_events(session_id);
create index if not exists agent_events_project_fk_idx on public.agent_run_events(project_id);
create index if not exists agent_events_step_fk_idx on public.agent_run_events(step_id);
