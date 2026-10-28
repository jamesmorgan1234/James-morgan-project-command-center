begin;
-- Category 13: extend the existing metric/health owners, never production implicitly.
do $$declare t text;begin foreach t in array array['command_center_metric_registry','command_center_health_snapshots','command_center_observability_events','command_center_decision_outcomes','command_center_learning_lessons','command_center_security_analytics','command_center_governance_findings','command_center_evaluator_results'] loop
 execute format('alter table public.%I add column record_ref text, add column record_version bigint, add column record_digest text, add column record_scope jsonb, add column record_contract jsonb, add column expires_at timestamptz',t);
 execute format('create unique index %I on public.%I(owner_user_id,record_ref,record_version)',t||'_c13_version',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select,insert,delete on public.%I to service_role',t);
end loop;end$$;
alter table public.command_center_health_snapshots alter column value drop not null;
alter table public.command_center_learning_lessons alter column confidence drop not null;
alter table public.command_center_health_snapshots drop constraint command_center_health_snapshots_health_class_check;
alter table public.command_center_health_snapshots add constraint c13_health_class check(health_class in ('metric_observation','reliability','performance','calibration_drift','contradiction_growth','stale_memory','evaluator_health','routing_regret','transfer_outcome','ecosystem_learning','provider_drift','model_drift','method_drift','revalidation_pressure'));
create function command_center_private.p13_analytics_table(kind text) returns text language sql immutable set search_path='' as $$select case kind when 'metric' then 'command_center_metric_registry' when 'health' then 'command_center_health_snapshots' when 'trace' then 'command_center_observability_events' when 'outcome' then 'command_center_decision_outcomes' when 'lesson' then 'command_center_learning_lessons' when 'security' then 'command_center_security_analytics' when 'governance' then 'command_center_governance_findings' when 'evaluation' then 'command_center_evaluator_results' end$$;
alter table public.command_center_observability_events drop constraint command_center_observability_events_event_class_check;
alter table public.command_center_observability_events add constraint c13_trace_stage check(event_class in ('request','context','policy','router','specialist','method','tool','provider','evidence','verifier','state','outcome','learning','promotion','transfer','procedure','rollback','metric','security','reliability'));
create function command_center_private.p13_append_analytics(r jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare t text;prior jsonb;owner_value uuid;scope_value jsonb;v bigint;d jsonb;o jsonb;legacy_ref text;parent jsonb;
begin
 if not(r ?& array['id','version','scope','kind','occurredAt','expiresAt','retentionClass','temporalLabel','benchmarkClass','evidenceIds','payload','digest','recordedAt']) then raise exception 'Analytics envelope incomplete';end if;
 t:=command_center_private.p13_analytics_table(r->>'kind');if t is null then raise exception 'Unsupported analytics kind';end if;
 scope_value:=r->'scope';owner_value:=(scope_value->>'ownerId')::uuid;v:=(r->>'version')::bigint;
 if owner_value is null or v is null or v<1 or coalesce(r->>'id','') !~ '^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,180}$' or coalesce(r->>'digest','') !~ '^[a-f0-9]{64}$' then raise exception 'Invalid analytics identity/version/digest';end if;
 if coalesce(scope_value->>'companyId','') !~ '^cmp_[a-z0-9]+(?:-[a-z0-9]+)*$' or coalesce(scope_value->>'projectId','') !~ '^prj_[a-z0-9]+(?:-[a-z0-9]+)*$' or coalesce(scope_value->>'brainId','') !~ '^brn_[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid analytics scope';end if;
 if (r->>'expiresAt')::timestamptz<=now() or (r->>'occurredAt')::timestamptz>now() or (r->>'expiresAt')::timestamptz>(r->>'occurredAt')::timestamptz+(case r->>'retentionClass' when 'short' then interval '1 day' when 'standard' then interval '30 days' when 'long' then interval '365 days' else interval '0' end) then raise exception 'Invalid analytics retention/time';end if;
 if coalesce(r->>'temporalLabel','') not in ('current','historical') then raise exception 'Invalid temporal label';end if;
 if coalesce(r->>'benchmarkClass','') not in ('synthetic','replay','simulation','shadow','canary','staging','production','external','owner_verified') then raise exception 'Invalid benchmark class';end if;
 if jsonb_typeof(r->'evidenceIds')<>'array' or jsonb_array_length(r->'evidenceIds')=0 then raise exception 'Analytics evidence required';end if;
 if exists(select 1 from jsonb_array_elements_text(r->'evidenceIds') e where e is null or e !~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$') then raise exception 'Canonical analytics evidence required';end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_value::text||':'||t||':'||(r->>'id'),13));
 execute format('select record_contract from public.%I where owner_user_id=$1 and record_ref=$2 and record_version=$3',t) into prior using owner_value,r->>'id',v;
 if prior is not null then if prior->>'digest'<>r->>'digest' or prior->'scope'<>scope_value then raise exception 'Analytics idempotency/scope conflict';end if;return prior;end if;
 legacy_ref:=(r->>'id')||'-v'||v::text;
 if r->>'kind'='metric' then
  d:=r->'payload'->'definition';if d->>'key'<>r->>'id' or (d->>'version')::bigint<>v or d->'semantics'->>'validationState'<>'verified' then raise exception 'Metric definition binding mismatch';end if;
  insert into public.command_center_metric_registry(owner_user_id,metric_key,semantic_version,metric_class,definition,unit,aggregation,source_refs,record_ref,record_version,record_digest,record_scope,record_contract,expires_at) values(owner_value,d->>'key',v::text,d->'semantics'->>'metricClass',d->'semantics'->>'definition',d->'semantics'->>'unit',d->'semantics'->>'aggregation',r->'evidenceIds',r->>'id',v,r->>'digest',scope_value,r,(r->>'expiresAt')::timestamptz);
 elsif r->>'kind'='health' then
  o:=r->'payload'->'observation';if coalesce(o->'scope','{}'::jsonb)<>scope_value or o->>'id'<>r->>'id' or o->>'benchmarkClass'<>r->>'benchmarkClass' then raise exception 'Observation binding mismatch';end if;
  select m.record_contract->'payload'->'definition' into d from public.command_center_metric_registry m where m.owner_user_id=owner_value and (m.record_contract->'payload'->'definition'->'semantics'->'applicabilityScopeKeys' ?| array['global','company:'||(scope_value->>'companyId'),'project:'||(scope_value->>'projectId'),'brain:'||(scope_value->>'brainId')]) and m.metric_key=o->>'metricKey' and m.semantic_version=o->>'metricVersion' and m.unit=o->>'unit';
  if d is null then raise exception 'Metric semantic version/unit/scope mismatch';end if;
  if ((extract(epoch from ((o->>'windowEnd')::timestamptz-(o->>'windowStart')::timestamptz))*1000)::bigint)<>(d->'semantics'->>'windowMs')::bigint or (o->>'occurredAt')::timestamptz not between (o->>'windowStart')::timestamptz and (o->>'windowEnd')::timestamptz or (o->>'receivedAt')::timestamptz<(o->>'occurredAt')::timestamptz or (o->>'receivedAt')::timestamptz>now() then raise exception 'Invalid observation window/time';end if;
  if r->>'temporalLabel'='current' and ((d->'semantics'->>'lifecycle')<>'active' or (extract(epoch from (now()-(o->>'occurredAt')::timestamptz))*1000)>(d->>'freshnessMs')::numeric or exists(select 1 from public.command_center_metric_registry m where m.owner_user_id=owner_value and m.metric_key=o->>'metricKey' and m.record_contract is not null and m.record_version>(o->>'metricVersion')::bigint)) then raise exception 'Observation is historical/stale';end if;
  if o->>'state'<>'known' and o->'value' is distinct from 'null'::jsonb then raise exception 'Ambiguous missing observation';end if;
  if o->>'state'='known' then
   if d->'semantics'->>'min' is not null and (o->>'value')::numeric<(d->'semantics'->>'min')::numeric or d->'semantics'->>'max' is not null and (o->>'value')::numeric>(d->'semantics'->>'max')::numeric then raise exception 'Metric value out of bounds';end if;
   if d->'semantics'->>'dataType'='integer' and trunc((o->>'value')::numeric)<>(o->>'value')::numeric then raise exception 'Integer metric required';end if;
  end if;
  if coalesce(o->>'state','') not in ('known','unknown','not_applicable','absent','deleted','stale','conflicting') then raise exception 'Invalid observation truth state';end if;
  if (o->>'state'='known')<>(jsonb_typeof(o->'value')='number') then raise exception 'Ambiguous observation truth';end if;
  insert into public.command_center_health_snapshots(owner_user_id,snapshot_id,project_ref,company_ref,health_class,value,unit,threshold_state,evidence_refs,observed_at,record_ref,record_version,record_digest,record_scope,record_contract,expires_at) values(owner_value,legacy_ref,scope_value->>'projectId',scope_value->>'companyId','metric_observation',(o->>'value')::float8,o->>'unit','unknown',r->'evidenceIds',(o->>'occurredAt')::timestamptz,r->>'id',v,r->>'digest',scope_value,r,(r->>'expiresAt')::timestamptz);
 elsif r->>'kind'='trace' then
  o:=r->'payload'->'event';if coalesce(o->'scope','{}'::jsonb)<>scope_value or o->>'id'<>r->>'id' or (o->>'version')::bigint<>v then raise exception 'Trace binding mismatch';end if;
  perform pg_advisory_xact_lock(hashtextextended(owner_value::text||':'||(o->>'traceId'),132));
  if o->>'parentId' is not null then
   select record_contract->'payload'->'event' into parent from public.command_center_observability_events where owner_user_id=owner_value and record_ref=o->>'parentId' and record_version=(o->>'parentVersion')::bigint and record_scope=scope_value and expires_at>now();
   if parent is null or parent->>'traceId'<>o->>'traceId' or parent->>'correlationId'<>o->>'correlationId' or (parent->>'occurredAt')::timestamptz>(o->>'occurredAt')::timestamptz then raise exception 'Trace parent scope/version/time mismatch';end if;
  end if;
  if exists(select 1 from jsonb_object_keys(o->'fields') k where k not in ('code','durationMs','count')) then raise exception 'Unsafe trace fields';end if;
  insert into public.command_center_observability_events(owner_user_id,event_id,project_ref,company_ref,trace_ref,event_class,predecessor_ref,payload,evidence_refs,occurred_at,record_ref,record_version,record_digest,record_scope,record_contract,expires_at) values(owner_value,legacy_ref,scope_value->>'projectId',scope_value->>'companyId',o->>'traceId',o->>'stage',o->>'parentId',o->'fields',r->'evidenceIds',(r->>'occurredAt')::timestamptz,r->>'id',v,r->>'digest',scope_value,r,(r->>'expiresAt')::timestamptz);
 elsif r->>'kind'='outcome' then
  o:=r->'payload'->'analysis';if coalesce(o->'scope','{}'::jsonb)<>scope_value or coalesce(o->>'authorizationGranted','')<>'false' then raise exception 'Outcome scope/authority mismatch';end if;
  insert into public.command_center_decision_outcomes(owner_user_id,decision_ref,project_ref,company_ref,recommendation_ref,predicted_outcome,actual_outcome,process_quality,luck_confounded,evidence_refs,observed_at,record_ref,record_version,record_digest,record_scope,record_contract,expires_at) values(owner_value,legacy_ref,scope_value->>'projectId',scope_value->>'companyId',o->>'recommendationId',jsonb_build_object('value',o->'predictedValue','snapshot',o->'snapshot'),jsonb_build_object('value',o->'outcomeValue','ref',o->'actualOutcomeRef'),(o->>'processQuality')::float8,jsonb_array_length(o->'confounders')>0,r->'evidenceIds',(r->>'occurredAt')::timestamptz,r->>'id',v,r->>'digest',scope_value,r,(r->>'expiresAt')::timestamptz);
 elsif r->>'kind'='lesson' then
  o:=r->'payload'->'lesson';
  insert into public.command_center_learning_lessons(owner_user_id,lesson_ref,project_ref,company_ref,lesson_class,scope_class,content,confidence,promotion_state,evidence_refs,record_ref,record_version,record_digest,record_scope,record_contract,expires_at) values(owner_value,legacy_ref,scope_value->>'projectId',scope_value->>'companyId',case when o ? 'procedureId' then 'procedure_learning' else 'failure_intelligence' end,'project',o,(o->>'rootCauseConfidence')::float8,'local',r->'evidenceIds',r->>'id',v,r->>'digest',scope_value,r,(r->>'expiresAt')::timestamptz);
 elsif r->>'kind'='security' then
  o:=r->'payload'->'report';if coalesce(o->'scope','{}'::jsonb)<>scope_value or coalesce(o->>'authorizationGranted','')<>'false' or coalesce(o->>'automaticResponse','')<>'false' then raise exception 'Security analytics authority mismatch';end if;
  insert into public.command_center_security_analytics(owner_user_id,finding_ref,project_ref,company_ref,finding_class,severity,correlation_refs,evidence_refs,observed_at,record_ref,record_version,record_digest,record_scope,record_contract,expires_at) values(owner_value,legacy_ref,scope_value->>'projectId',scope_value->>'companyId','correlated_error','info',coalesce(o->'independence'->'correlatedGroups','[]'::jsonb),r->'evidenceIds',(r->>'occurredAt')::timestamptz,r->>'id',v,r->>'digest',scope_value,r,(r->>'expiresAt')::timestamptz);
 elsif r->>'kind'='governance' then
  o:=r->'payload'->'report';if coalesce(o->'scope','{}'::jsonb)<>scope_value or coalesce(o->>'controlPlane','')<>'command_center' or not(coalesce(o->>'maySelfMutate','false')='false' and coalesce(o->>'mayExecute','false')='false' and coalesce(o->>'mayPromote','false')='false') then raise exception 'Governance authority mismatch';end if;
  insert into public.command_center_governance_findings(owner_user_id,finding_ref,project_ref,finding_class,finding,proposal,status,evidence_refs,record_ref,record_version,record_digest,record_scope,record_contract,expires_at) values(owner_value,legacy_ref,scope_value->>'projectId',case when o ? 'proposals' then 'ecosystem_optimizer' else 'architecture_critic' end,o,case when o ? 'proposals' then jsonb_build_object('proposals',o->'proposals') else null end,'open',r->'evidenceIds',r->>'id',v,r->>'digest',scope_value,r,(r->>'expiresAt')::timestamptz);
 elsif r->>'kind'='evaluation' then
  o:=r->'payload'->'result';if not exists(select 1 from public.command_center_evaluator_versions where owner_id=owner_value and evaluator_key=o->>'evaluatorKey' and version=(o->>'evaluatorVersion')::bigint) then raise exception 'Canonical evaluator version required';end if; if coalesce(o->>'authorizationGranted','')<>'false' or o->>'productionObserved'='true' and r->>'benchmarkClass'<>'production' then raise exception 'Evaluation benchmark authority mismatch';end if;
  insert into public.command_center_evaluator_results(owner_user_id,evaluation_ref,evaluator_ref,evaluator_version,benchmark_ref,benchmark_version,project_ref,reproducibility_ref,privacy_class,sample_count,result,calibration_state,evidence_refs,evaluated_at,record_ref,record_version,record_digest,record_scope,record_contract,expires_at) values(owner_value,legacy_ref,o->>'evaluatorKey',o->>'evaluatorVersion',o->>'benchmarkRef',o->>'benchmarkVersion',scope_value->>'projectId',r->>'digest','project_private',coalesce((o->>'sampleCount')::bigint,0),o,case when o->>'requiresRecalibration'='true' then 'recalibration_required' else 'unknown' end,r->'evidenceIds',(r->>'occurredAt')::timestamptz,r->>'id',v,r->>'digest',scope_value,r,(r->>'expiresAt')::timestamptz);
 end if;
 return r;
end$$;
create function command_center_private.p13_read_analytics(s jsonb,kind text,at_time timestamptz) returns jsonb language plpgsql security invoker set search_path='' as $$declare t text;result jsonb;begin t:=command_center_private.p13_analytics_table(kind);if t is null then raise exception 'Unsupported analytics kind';end if;execute format('select coalesce(jsonb_agg(record_contract order by record_ref,record_version),''[]''::jsonb) from public.%I where owner_user_id=$1 and record_scope=$2 and expires_at>$3 and expires_at>now()',t) into result using (s->>'ownerId')::uuid,s,at_time;return result;end$$;
revoke all on function command_center_private.p13_analytics_table(text),command_center_private.p13_append_analytics(jsonb),command_center_private.p13_read_analytics(jsonb,text,timestamptz) from public,anon,authenticated;
grant usage on schema command_center_private to service_role;
grant execute on function command_center_private.p13_analytics_table(text),command_center_private.p13_append_analytics(jsonb),command_center_private.p13_read_analytics(jsonb,text,timestamptz) to service_role;

-- Expiry is the sole permitted evidence deletion; ordinary clients retain no write privileges.
create or replace function public.command_center_reject_analytics_evidence_mutation() returns trigger language plpgsql set search_path='' as $$begin if tg_op='DELETE' and old.record_contract is not null and old.expires_at<=now() then return old;end if;raise exception 'Analytics and governance evidence is immutable';end$$;
create function command_center_private.p13_purge_expired(s jsonb,kind text) returns bigint language plpgsql security invoker set search_path='' as $$declare t text;count_value bigint;begin t:=command_center_private.p13_analytics_table(kind);if t is null then raise exception 'Unsupported analytics kind';end if;execute format('delete from public.%I where owner_user_id=$1 and record_scope=$2 and record_contract is not null and expires_at<=now()',t) using (s->>'ownerId')::uuid,s;get diagnostics count_value=row_count;return count_value;end$$;
revoke all on function command_center_private.p13_purge_expired(jsonb,text) from public,anon,authenticated;
grant execute on function command_center_private.p13_purge_expired(jsonb,text) to service_role;
-- The PIF.7 evaluator owner remains canonical; add distinct replay/staging classes.
alter table public.command_center_evaluation_runs drop constraint command_center_evaluation_runs_evidence_class_check;
alter table public.command_center_evaluation_runs add constraint c13_evaluation_evidence_class check(evidence_class in ('synthetic','replay','simulation','shadow','canary','staging','production','external','owner_verified'));
-- Canonical evaluator registration extends PIF.7; result tables remain projections.
create function command_center_private.p13_register_evaluator(p_owner uuid,d jsonb,evidence text[],expected bigint) returns jsonb language plpgsql security invoker set search_path='' as $$
declare current_version bigint;
begin
 if p_owner is null or coalesce(cardinality(evidence),0)=0 or not(d ? 'protocol') then raise exception 'Evaluator owner/protocol/evidence required';end if;
 if exists(select 1 from unnest(evidence) e where e is null or e !~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$') then raise exception 'Canonical evaluator evidence required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text||':'||(d->>'key'),137));
 select version into current_version from public.command_center_evaluators where owner_id=p_owner and evaluator_key=d->>'key' for update;
 if expected is null then if found or (d->>'version')::bigint<>1 then raise exception 'Evaluator creation conflict';end if;
 elsif not found or current_version<>expected or (d->>'version')::bigint<>expected+1 then raise exception 'Evaluator version conflict';end if;
 insert into public.command_center_evaluators(owner_id,evaluator_key,version,owner_ref,purpose,bias_risks,required_data_classes,prohibited_data_classes,applicable_domains,applicable_task_classes,minimum_evidence_classes,repeat_count,minimum_sample_count,minimum_confidence,acceptance_authority,calibration_evidence_refs,active)
 values(p_owner,d->>'key',(d->>'version')::bigint,d->>'ownerRef',d->>'purpose',array(select jsonb_array_elements_text(d->'biasRisks')),array(select jsonb_array_elements_text(d->'requiredDataClasses')),array(select jsonb_array_elements_text(d->'prohibitedDataClasses')),array(select jsonb_array_elements_text(d->'applicableDomains')),array(select jsonb_array_elements_text(d->'applicableTaskClasses')),array(select jsonb_array_elements_text(d->'minimumEvidenceClasses')),(d->>'repeatCount')::bigint,(d->>'minimumSampleCount')::bigint,(d->>'minimumConfidence')::numeric,d->>'acceptanceAuthority',array(select jsonb_array_elements_text(d->'calibrationEvidenceRefs')),(d->>'active')::boolean)
 on conflict(owner_id,evaluator_key) do update set version=excluded.version,owner_ref=excluded.owner_ref,purpose=excluded.purpose,bias_risks=excluded.bias_risks,required_data_classes=excluded.required_data_classes,prohibited_data_classes=excluded.prohibited_data_classes,applicable_domains=excluded.applicable_domains,applicable_task_classes=excluded.applicable_task_classes,minimum_evidence_classes=excluded.minimum_evidence_classes,repeat_count=excluded.repeat_count,minimum_sample_count=excluded.minimum_sample_count,minimum_confidence=excluded.minimum_confidence,acceptance_authority=excluded.acceptance_authority,calibration_evidence_refs=excluded.calibration_evidence_refs,active=excluded.active,updated_at=now();
 insert into public.command_center_evaluator_versions(owner_id,evaluator_key,version,snapshot,evidence_refs) values(p_owner,d->>'key',(d->>'version')::bigint,d,evidence);
 return d;
end$$;
revoke all on function command_center_private.p13_register_evaluator(uuid,jsonb,text[],bigint) from public,anon,authenticated;
grant execute on function command_center_private.p13_register_evaluator(uuid,jsonb,text[],bigint) to service_role;
grant select,insert,update on public.command_center_evaluators to service_role;
grant select,insert on public.command_center_evaluator_versions to service_role;
create function command_center_private.p13_evaluator_version_immutable() returns trigger language plpgsql set search_path='' as $$begin raise exception 'Evaluator version history is immutable';end$$;
create trigger p13_evaluator_version_immutable before update or delete on public.command_center_evaluator_versions for each row execute function command_center_private.p13_evaluator_version_immutable();
revoke all on function command_center_private.p13_evaluator_version_immutable() from public,anon,authenticated;

-- PIF.7 raw snapshots are server-only; scoped C2 readers expose approved projections.
revoke all on public.command_center_evaluators,public.command_center_evaluator_versions,public.command_center_evaluation_runs,public.command_center_evaluation_outcomes from public,anon,authenticated;
grant select on public.command_center_evaluation_runs,public.command_center_evaluation_outcomes to service_role;

commit;
