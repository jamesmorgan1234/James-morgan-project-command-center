-- P12.8 foundations only. Repository migration; never apply to production implicitly.
-- Decisions and compiler outputs are immutable DATA, never executable grants.
create table public.command_center_specialist_interoperability_decisions (
 owner_id uuid not null references auth.users(id),
 decision_id text not null check(decision_id ~ '^dec_[a-z0-9]+(?:-[a-z0-9]+)*$'),
 version bigint not null check(version>0),
 company_id text not null check(company_id ~ '^cmp_[a-z0-9]+(?:-[a-z0-9]+)*$'),
 project_id text not null check(project_id ~ '^prj_[a-z0-9]+(?:-[a-z0-9]+)*$'),
 request_digest text not null check(request_digest ~ '^[a-f0-9]{64}$'),
 decision jsonb not null check(jsonb_typeof(decision)='object'),
 primary key(owner_id,decision_id,version),
 check(decision->>'id'=decision_id and (decision->>'version')::bigint=version and decision->>'requestDigest'=request_digest),
 check(decision->'scope'=jsonb_build_object('ownerId',owner_id::text,'companyId',company_id,'projectId',project_id)),
 check(decision->>'operation' in ('transfer','inherit','procedure','compose','compile')),
 check(decision->>'authorizationEvidenceId' ~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$'),
 check(decision->>'reason' ~ '^[a-z_]+$'),
 check(jsonb_typeof(decision->'accepted')='boolean'),
 check(decision ?& array['id','version','scope','operation','requestDigest','accepted','reason','recordedAt','authorizationEvidenceId']),
 check((decision->>'accepted')::boolean = (decision ? 'artifact')),
 check(not (decision ? 'artifact') or (
  decision->'artifact' ?& array['schemaVersion','scope','operation','controlPlane','executable','sourceVersionRefs','evidenceIds','acceptanceCriteria','rollbackEvidenceIds','monitoringRefs','expiresAt','methods']
  and decision->'artifact'->'scope'=decision->'scope' and decision->'artifact'->>'operation'=decision->>'operation'
  and decision->'artifact' @> '{"schemaVersion":1,"controlPlane":"command_center","executable":false}'::jsonb
  and jsonb_typeof(decision->'artifact'->'acceptanceCriteria')='array'
  and jsonb_array_length(decision->'artifact'->'acceptanceCriteria')>0
  and jsonb_typeof(decision->'artifact'->'methods')='array'
  and jsonb_array_length(decision->'artifact'->'methods')>0
  and jsonb_typeof(decision->'artifact'->'evidenceIds')='array'
  and jsonb_array_length(decision->'artifact'->'evidenceIds')>0
 ))
);
alter table public.command_center_specialist_interoperability_decisions enable row level security;
-- No browser/specialist can read all owner decisions or mint a compiler/learning approval.
revoke all on public.command_center_specialist_interoperability_decisions from public,anon,authenticated;
grant select,insert on public.command_center_specialist_interoperability_decisions to service_role;
create function command_center_private.p12_8_interoperability_immutable() returns trigger language plpgsql set search_path='' as $$begin raise exception 'Specialist interoperability decisions are immutable';end$$;
create trigger p12_8_interoperability_immutable before update or delete on public.command_center_specialist_interoperability_decisions for each row execute function command_center_private.p12_8_interoperability_immutable();
create function command_center_private.append_specialist_decision(p_decision jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare prior jsonb; owner_value uuid; version_value bigint; k text;
begin
 owner_value:=(p_decision->'scope'->>'ownerId')::uuid;
 version_value:=(p_decision->>'version')::bigint;
 if (p_decision->>'recordedAt')::timestamptz is null then raise exception 'Decision time required';end if;
 for k in select jsonb_object_keys(p_decision) loop
  if k not in ('id','version','scope','operation','requestDigest','accepted','reason','recordedAt','authorizationEvidenceId','artifact') then raise exception 'Unsupported decision field';end if;
 end loop;
 if p_decision ? 'artifact' then
  if coalesce(p_decision->'artifact'->>'expiresAt','')='' then raise exception 'Artifact expiry required';end if;
  if (p_decision->'artifact'->>'expiresAt')::timestamptz <= (p_decision->>'recordedAt')::timestamptz then raise exception 'Expired artifact';end if;
  for k in select jsonb_array_elements_text(p_decision->'artifact'->'evidenceIds') loop
   if k is null or k !~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Canonical evidence required';end if;
  end loop;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_value::text||':'||(p_decision->>'id')||':'||version_value::text,0));
 select decision into prior from public.command_center_specialist_interoperability_decisions where owner_id=owner_value and decision_id=p_decision->>'id' and version=version_value;
 if found then
  if prior->>'requestDigest'<>p_decision->>'requestDigest' then raise exception 'Decision idempotency conflict';end if;
  return prior;
 end if;
 insert into public.command_center_specialist_interoperability_decisions values(owner_value,p_decision->>'id',version_value,p_decision->'scope'->>'companyId',p_decision->'scope'->>'projectId',p_decision->>'requestDigest',p_decision);
 return p_decision;
end$$;
revoke all on function command_center_private.append_specialist_decision(jsonb) from public,anon,authenticated;
revoke all on function command_center_private.p12_8_interoperability_immutable() from public,anon,authenticated;
grant usage on schema command_center_private to service_role;
grant execute on function command_center_private.append_specialist_decision(jsonb) to service_role;
