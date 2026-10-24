-- Category 7 / P7.12 — durable Work ladder and executor escalation policy.
-- Branch-only migration. Work escalation never auto-launches Work and never broadens project/protected authority.

create table if not exists public.command_center_agency_work_ladder_decisions (
  decision_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  failure_class text not null check (failure_class in ('transient_network','provider_timeout','provider_unavailable','quota_unavailable','credentials','missing_input','user_boundary','protected_boundary','capability_insufficient','execution_complexity','verification_failed')),
  current_rung text not null check (current_rung in ('normal_chat','luna_high','sol_light','sol_medium')),
  decided_action text not null check (decided_action in ('stay','retry_once','escalate','block')),
  decided_rung text not null check (decided_rung in ('normal_chat','luna_high','sol_light','sol_medium')),
  reason text not null,
  authorization_ref text not null,
  authorized_scopes text[] not null,
  requested_scopes text[] not null,
  max_rung text not null check (max_rung in ('normal_chat','luna_high','sol_light','sol_medium')),
  work_authorized boolean not null,
  protected_actions_authorized boolean not null default false check (protected_actions_authorized=false),
  automatic_work_launch boolean not null default false check (automatic_work_launch=false),
  transient_retries_used integer not null check (transient_retries_used>=0),
  evidence_refs text[] not null,
  decided_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  check (cardinality(authorized_scopes)>0),
  check (cardinality(evidence_refs)>0),
  check (requested_scopes <@ authorized_scopes),
  check (decided_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_work_ladder_idx
  on public.command_center_agency_work_ladder_decisions(owner_id,project_id,run_id,decided_at desc,decision_id);

alter table public.command_center_agency_work_ladder_decisions enable row level security;
revoke all on table public.command_center_agency_work_ladder_decisions from public,anon,authenticated;
grant select on table public.command_center_agency_work_ladder_decisions to authenticated;
drop policy if exists c7_owner_select_agency_work_ladder on public.command_center_agency_work_ladder_decisions;
create policy c7_owner_select_agency_work_ladder
  on public.command_center_agency_work_ladder_decisions for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_agency_decide_work_ladder(
  p_project_id text,p_run_id text,p_current_rung text,p_failure_class text,p_work_authorized boolean,p_max_rung text,p_authorization_ref text,p_authorized_scopes text[],p_requested_scopes text[],p_transient_retries_used integer,p_evidence_refs text[],p_decided_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  v_action text;
  v_rung text:=p_current_rung;
  v_reason text:=p_failure_class;
  next_rung text;
  current_rank integer;
  next_rank integer;
  max_rank integer;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id)) then raise exception 'Work ladder run not found'; end if;
  if p_current_rung not in ('normal_chat','luna_high','sol_light','sol_medium') or p_max_rung not in ('normal_chat','luna_high','sol_light','sol_medium') then raise exception 'Invalid Work ladder rung'; end if;
  if p_failure_class not in ('transient_network','provider_timeout','provider_unavailable','quota_unavailable','credentials','missing_input','user_boundary','protected_boundary','capability_insufficient','execution_complexity','verification_failed') then raise exception 'Invalid Work ladder failure class'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_authorized_scopes,'Work authorized scopes');
  perform command_center_private.c3_assert_unique_text_array(p_requested_scopes,'Work requested scopes');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Work ladder evidence');
  if cardinality(coalesce(p_authorized_scopes,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 or coalesce(btrim(p_authorization_ref),'')='' then raise exception 'Work ladder requires authorization scope/ref/evidence'; end if;
  if not coalesce(p_requested_scopes,'{}'::text[]) <@ p_authorized_scopes then raise exception 'Work escalation cannot broaden authorization scope'; end if;

  current_rank:=case p_current_rung when 'normal_chat' then 0 when 'luna_high' then 1 when 'sol_light' then 2 else 3 end;
  max_rank:=case p_max_rung when 'normal_chat' then 0 when 'luna_high' then 1 when 'sol_light' then 2 else 3 end;
  next_rung:=case p_current_rung when 'normal_chat' then 'luna_high' when 'luna_high' then 'sol_light' when 'sol_light' then 'sol_medium' else null end;
  next_rank:=case next_rung when 'normal_chat' then 0 when 'luna_high' then 1 when 'sol_light' then 2 when 'sol_medium' then 3 else 999 end;

  if not p_work_authorized and p_current_rung<>'normal_chat' then v_action:='block'; v_reason:='work_not_authorized';
  elsif p_failure_class in ('transient_network','provider_timeout') then
    if p_transient_retries_used<1 then v_action:='retry_once'; v_reason:=p_failure_class; else v_action:='block'; v_reason:='transient_retry_exhausted'; end if;
  elsif p_failure_class in ('provider_unavailable','quota_unavailable','credentials','missing_input','user_boundary','protected_boundary','verification_failed') then v_action:='block'; v_reason:=p_failure_class;
  elsif next_rung is null then v_action:='block'; v_reason:='work_ladder_ceiling';
  elsif next_rank>max_rank then v_action:='block'; v_reason:='authorization_rung_ceiling';
  elsif not p_work_authorized then v_action:='block'; v_reason:='work_not_authorized';
  else v_action:='escalate'; v_rung:=next_rung; v_reason:=p_failure_class; end if;

  insert into public.command_center_agency_work_ladder_decisions(owner_id,project_id,run_id,failure_class,current_rung,decided_action,decided_rung,reason,authorization_ref,authorized_scopes,requested_scopes,max_rung,work_authorized,transient_retries_used,evidence_refs,decided_at)
  values(u,btrim(p_project_id),btrim(p_run_id),p_failure_class,p_current_rung,v_action,v_rung,v_reason,btrim(p_authorization_ref),p_authorized_scopes,coalesce(p_requested_scopes,'{}'::text[]),p_max_rung,p_work_authorized,p_transient_retries_used,p_evidence_refs,p_decided_at);

  return jsonb_build_object('action',v_action,'rung',v_rung,'reason',v_reason,'automatic_work_launch',false,'protected_actions_authorized',false,'authorized_scopes',to_jsonb(p_authorized_scopes));
end $$;

revoke all on function public.command_center_agency_decide_work_ladder(text,text,text,text,boolean,text,text,text[],text[],integer,text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_decide_work_ladder(text,text,text,text,boolean,text,text,text[],text[],integer,text[],timestamptz) to authenticated;
