-- P5.14 / Category 2 integration hardening — project recovery lifecycle is a protected single-use action.
-- Branch-only migration. No production state is changed by committing this file.

create or replace function command_center_private.security_action_policy(p_action_key text)
returns table(risk_level text, resource_type text, ttl interval)
language sql
immutable
set search_path = ''
as $$
  select v.risk_level, v.resource_type, v.ttl
  from (values
    ('agent.step.execute',                    'high',      'agent_step',                interval '10 minutes'),
    ('agent_mode_work_sol_medium',           'protected', 'agent_step',                interval '10 minutes'),
    ('integration.execute_write',            'high',      'integration_write_request', interval '10 minutes'),
    ('integration.reconnect_mark_connected', 'high',      'integration_connection',    interval '10 minutes'),
    ('integration.rotate_webhook_secret',    'critical',  'integration_connection',    interval '5 minutes'),
    ('security.revoke_session',              'high',      'owner_session',             interval '10 minutes'),
    ('security.revoke_device',               'critical',  'owner_device',              interval '5 minutes'),
    ('security.permission.change',           'critical',  'security_permission',       interval '5 minutes'),
    ('security.passkey.remove',              'critical',  'passkey',                   interval '5 minutes'),
    ('deployment.deploy',                    'critical',  'deployment',                interval '5 minutes'),
    ('deployment.rollback',                  'critical',  'deployment',                interval '5 minutes'),
    ('repository.merge',                     'critical',  'repository_change',         interval '5 minutes'),
    ('publishing.publish',                   'critical',  'publication',               interval '5 minutes'),
    ('communications.send',                  'high',      'communication',             interval '10 minutes'),
    ('money.purchase',                       'critical',  'financial_action',           interval '5 minutes'),
    ('money.transfer',                       'critical',  'financial_action',           interval '5 minutes'),
    ('legal.accept',                         'critical',  'legal_action',               interval '5 minutes'),
    ('protected_asset.modify',               'critical',  'protected_asset',           interval '5 minutes'),
    ('project.recovery.lifecycle',           'critical',  'project_recovery',           interval '5 minutes')
  ) as v(action_key, risk_level, resource_type, ttl)
  where v.action_key = btrim(coalesce(p_action_key,''));
$$;
revoke all on function command_center_private.security_action_policy(text) from public,anon,authenticated;

-- Eliminate the earlier ungated signature so there is no parallel bypass path.
revoke all on function public.command_center_project_apply_recovery_lifecycle(text,text[],timestamptz) from public,anon,authenticated;
drop function public.command_center_project_apply_recovery_lifecycle(text,text[],timestamptz);

create or replace function public.command_center_project_apply_recovery_lifecycle(
  p_recovery_plan_id text,p_authorization_id uuid,p_evidence_refs text[],p_occurred_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); r public.command_center_project_recovery_plans%rowtype; p public.command_center_project_profiles%rowtype; e public.command_center_canonical_entities%rowtype;
  v_target text; v_event text; v_next bigint; v_payload jsonb; v_hash text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into r from public.command_center_project_recovery_plans where owner_id=u and recovery_plan_id=btrim(p_recovery_plan_id) and state='authorized' for update;
  if not found then raise exception 'Authorized recovery plan not found'; end if;
  if r.mode not in ('archived_revival','retirement') then raise exception 'This recovery mode does not define a canonical lifecycle transition'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Recovery lifecycle evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Recovery lifecycle evidence is required'; end if;

  -- This is the actual canonical side-effect boundary: consume exactly one fresh, live-session-bound authorization.
  perform command_center_private.consume_action_authorization(
    u,p_authorization_id,'project.recovery.lifecycle','project_recovery',r.recovery_plan_id
  );

  select * into p from public.command_center_project_profiles where owner_id=u and project_id=r.project_id for update;
  if not found then raise exception 'Project profile not found'; end if;
  select * into e from public.command_center_canonical_entities where owner_id=u and entity_id=p.canonical_entity_id for update;
  if not found or e.deleted_at is not null then raise exception 'Live canonical project entity not found'; end if;

  if r.mode='archived_revival' then
    if p.lifecycle<>'archived' then raise exception 'Archived revival requires an archived project'; end if;
    if coalesce(btrim(r.owner_reactivation_ref),'')='' then raise exception 'Owner reactivation evidence is missing'; end if;
    v_target:='paused'; v_event:='reactivated';
  else
    if p.lifecycle in ('archived','superseded') then raise exception 'Project is already retired from active lifecycle'; end if;
    v_target:='archived'; v_event:='retired';
  end if;

  v_next:=e.version+1;
  v_payload:=jsonb_set(e.payload,'{lifecycle}',to_jsonb(v_target),true);
  v_hash:=command_center_private.c3_hash_json(v_payload);
  update public.command_center_canonical_entities set version=v_next,payload=v_payload,content_hash=v_hash,updated_at=now() where owner_id=u and entity_id=e.entity_id;
  insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref)
  values(u,e.entity_id,v_next,e.project_id,e.entity_type,e.schema_version,v_payload,v_hash,'replace','recovery-plan:'||r.recovery_plan_id);
  update public.command_center_project_profiles set lifecycle=v_target,version=version+1,source_ref='recovery-plan:'||r.recovery_plan_id,updated_at=now() where owner_id=u and project_id=p.project_id;
  insert into public.command_center_project_lineage_events(owner_id,project_id,event_type,occurred_at,owner_decision_ref,related_project_id,evidence_refs)
  values(u,p.project_id,v_event,p_occurred_at,r.owner_decision_ref,null,p_evidence_refs);
  update public.command_center_project_recovery_plans set state='completed',updated_at=now() where owner_id=u and recovery_plan_id=r.recovery_plan_id;
  insert into public.command_center_project_recovery_events(owner_id,recovery_plan_id,project_id,event_type,evidence_refs,detail,occurred_at)
  values(u,r.recovery_plan_id,p.project_id,'canonical_lifecycle_changed',p_evidence_refs,jsonb_build_object('from',p.lifecycle,'to',v_target,'canonical_version',v_next,'authorization_id',p_authorization_id),p_occurred_at);
  insert into public.command_center_project_recovery_events(owner_id,recovery_plan_id,project_id,event_type,evidence_refs,detail,occurred_at)
  values(u,r.recovery_plan_id,p.project_id,'completed',p_evidence_refs,jsonb_build_object('mode',r.mode),p_occurred_at);
  return jsonb_build_object('recovery_plan_id',r.recovery_plan_id,'project_id',p.project_id,'from_lifecycle',p.lifecycle,'to_lifecycle',v_target,'canonical_version',v_next,'state','completed');
end $$;

revoke all on function public.command_center_project_apply_recovery_lifecycle(text,uuid,text[],timestamptz) from public,anon;
grant execute on function public.command_center_project_apply_recovery_lifecycle(text,uuid,text[],timestamptz) to authenticated;
