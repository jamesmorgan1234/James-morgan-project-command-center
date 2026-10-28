-- Extend the existing canonical PIF.3 owner, not a second specialist registry.
-- Trusted control-plane service only; call after exact-plan current C2 authorization.
create function command_center_private.apply_specialist_model_batch(p_owner uuid,p_changes jsonb,p_authority text[]) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare c jsonb; m jsonb; current_row public.command_center_specialist_brains; next_row public.command_center_specialist_brains; expected bigint; ids text[]:='{}'; results jsonb:='[]'; evidence text;
begin
 if p_owner is null or jsonb_typeof(p_changes)<>'array' or jsonb_array_length(p_changes)=0 or coalesce(cardinality(p_authority),0)=0 then raise exception 'Specialist batch identity/evidence required';end if;
 foreach evidence in array p_authority loop if evidence !~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Canonical authority evidence required';end if;end loop;
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,12));
 for c in select value from jsonb_array_elements(p_changes) order by value->'model'->>'specialist_id' loop
  m:=c->'model';expected:=(c->>'expectedVersion')::bigint;
  if coalesce(m->>'specialist_id','') !~ '^brn_[a-z0-9]+(?:-[a-z0-9]+)*$' or (m->>'specialist_id')=any(ids) then raise exception 'Duplicate/invalid specialist batch identity';end if;
  ids:=array_append(ids,m->>'specialist_id');
  select * into current_row from public.command_center_specialist_brains where owner_id=p_owner and specialist_id=m->>'specialist_id' for update;
  if expected is null then
   if found or (m->>'version')::bigint<>1 then raise exception 'Specialist batch creation conflict';end if;
   m:=m||jsonb_build_object('owner_id',p_owner,'brain_key','brain:'||substr(m->>'specialist_id',5),'scope','custom','project_id',null,'allowed_memory_kinds',jsonb_build_array('metadata'),'provenance_refs',m->'provenance_evidence_ids','created_at',now(),'updated_at',now(),'evaluation_history','[]'::jsonb);
   next_row:=jsonb_populate_record(null::public.command_center_specialist_brains,m);
  else
   if not found or current_row.version<>expected or current_row.lifecycle='retired' or (m->>'version')::bigint<>expected+1 then raise exception 'Specialist batch version/lifecycle conflict';end if;
   m:=m||jsonb_build_object('owner_id',p_owner,'brain_key',current_row.brain_key,'updated_at',now());
   next_row:=jsonb_populate_record(current_row,m);
  end if;
  if next_row.control_plane<>'command_center' or next_row.cost_class<>'free' then raise exception 'Specialist batch control/cost violation';end if;
  if next_row.rollback_evidence_id !~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$' or cardinality(next_row.evaluation_evidence_ids)=0 or cardinality(next_row.provenance_evidence_ids)=0 then raise exception 'Specialist batch evaluation/provenance required';end if;
  foreach evidence in array next_row.evaluation_evidence_ids||next_row.provenance_evidence_ids loop if evidence !~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Canonical model evidence required';end if;end loop;
  insert into public.command_center_specialist_brains select (next_row).* on conflict(owner_id,brain_key) do update set
   version=excluded.version,
   enabled=excluded.enabled,
   control_plane=excluded.control_plane,
   domain=excluded.domain,
   subdomains=excluded.subdomains,
   supported_company_ids=excluded.supported_company_ids,
   supported_project_ids=excluded.supported_project_ids,
   supported_work_classes=excluded.supported_work_classes,
   strengths=excluded.strengths,
   weaknesses=excluded.weaknesses,
   capabilities=excluded.capabilities,
   method_ids=excluded.method_ids,
   permission_keys=excluded.permission_keys,
   protected_action_boundaries=excluded.protected_action_boundaries,
   data_classes=excluded.data_classes,
   tool_keys=excluded.tool_keys,
   provider_keys=excluded.provider_keys,
   model_assignments=excluded.model_assignments,
   dependency_version_refs=excluded.dependency_version_refs,
   calibration_score=excluded.calibration_score,
   evaluation_evidence_ids=excluded.evaluation_evidence_ids,
   historical_accuracy=excluded.historical_accuracy,
   reliability_score=excluded.reliability_score,
   latency_ms=excluded.latency_ms,
   resource_class=excluded.resource_class,
   cost_class=excluded.cost_class,
   failure_modes=excluded.failure_modes,
   degraded_modes=excluded.degraded_modes,
   fallback_specialist_ids=excluded.fallback_specialist_ids,
   delegation_targets=excluded.delegation_targets,
   learning_eligibility=excluded.learning_eligibility,
   experiment_status=excluded.experiment_status,
   health=excluded.health,
   lifecycle=excluded.lifecycle,
   rollback_evidence_id=excluded.rollback_evidence_id,
   provenance_evidence_ids=excluded.provenance_evidence_ids,
   verification_state=excluded.verification_state,
   revalidated_at=excluded.revalidated_at,
   revalidate_after=excluded.revalidate_after,
   updated_at=excluded.updated_at;
  insert into public.command_center_specialist_brain_versions(owner_id,specialist_id,version,snapshot,authority_evidence_ids) values(p_owner,next_row.specialist_id,next_row.version,to_jsonb(next_row)-'owner_id',p_authority);
  results:=results||jsonb_build_array(jsonb_build_object('specialistId',next_row.specialist_id,'version',next_row.version));
 end loop;
 return results;
end$$;
revoke all on function command_center_private.apply_specialist_model_batch(uuid,jsonb,text[]) from public,anon,authenticated;
grant execute on function command_center_private.apply_specialist_model_batch(uuid,jsonb,text[]) to service_role;
grant select,insert,update on public.command_center_specialist_brains to service_role;
grant select,insert on public.command_center_specialist_brain_versions to service_role;
create function command_center_private.p12_8_model_history_immutable() returns trigger language plpgsql set search_path='' as $$begin raise exception 'Canonical specialist model history is immutable';end$$;
create trigger p12_8_model_history_immutable before update or delete on public.command_center_specialist_brain_versions for each row execute function command_center_private.p12_8_model_history_immutable();
revoke all on function command_center_private.p12_8_model_history_immutable() from public,anon,authenticated;
