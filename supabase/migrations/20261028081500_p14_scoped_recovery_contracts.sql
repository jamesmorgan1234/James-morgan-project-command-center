begin;
create schema if not exists command_center_private;
revoke all on schema command_center_private from public,anon,authenticated;
grant usage on schema command_center_private to service_role;
alter table public.command_center_recovery_artifacts add column record_scope jsonb, add column record_contract jsonb, add column record_digest text, add column record_version integer;
create unique index p14_recovery_artifacts_scoped_identity on public.command_center_recovery_artifacts ((record_scope::text), (record_contract->>'id'),record_version) where record_contract is not null;
revoke all on public.command_center_recovery_artifacts from public,anon,authenticated,service_role;
alter table public.command_center_recovery_exercises add column record_scope jsonb, add column record_contract jsonb, add column record_digest text, add column record_version integer;
create unique index p14_recovery_exercises_scoped_identity on public.command_center_recovery_exercises ((record_scope::text), (record_contract->>'id'),record_version) where record_contract is not null;
revoke all on public.command_center_recovery_exercises from public,anon,authenticated,service_role;
alter table public.command_center_dependency_replacements add column record_scope jsonb, add column record_contract jsonb, add column record_digest text, add column record_version integer;
create unique index p14_dependency_replacements_scoped_identity on public.command_center_dependency_replacements ((record_scope::text), (record_contract->>'id'),record_version) where record_contract is not null;
revoke all on public.command_center_dependency_replacements from public,anon,authenticated,service_role;
alter table public.command_center_dormant_reactivations add column record_scope jsonb, add column record_contract jsonb, add column record_digest text, add column record_version integer;
create unique index p14_dormant_reactivations_scoped_identity on public.command_center_dormant_reactivations ((record_scope::text), (record_contract->>'id'),record_version) where record_contract is not null;
revoke all on public.command_center_dormant_reactivations from public,anon,authenticated,service_role;
alter table public.command_center_future_boundaries add column record_scope jsonb, add column record_contract jsonb, add column record_digest text, add column record_version integer;
create unique index p14_future_boundaries_scoped_identity on public.command_center_future_boundaries ((record_scope::text), (record_contract->>'id'),record_version) where record_contract is not null;
revoke all on public.command_center_future_boundaries from public,anon,authenticated,service_role;
alter table public.command_center_drift_revalidation add column record_scope jsonb, add column record_contract jsonb, add column record_digest text, add column record_version integer;
create unique index p14_drift_revalidation_scoped_identity on public.command_center_drift_revalidation ((record_scope::text), (record_contract->>'id'),record_version) where record_contract is not null;
revoke all on public.command_center_drift_revalidation from public,anon,authenticated,service_role;

create function command_center_private.p14_table(k text) returns text language sql immutable set search_path='' as $$select case k when 'artifact' then 'command_center_recovery_artifacts' when 'exercise' then 'command_center_recovery_exercises' when 'replacement' then 'command_center_dependency_replacements' when 'dormant' then 'command_center_dormant_reactivations' when 'boundary' then 'command_center_future_boundaries' when 'drift' then 'command_center_drift_revalidation' end$$;
create function command_center_private.p14_scope(s jsonb) returns boolean language sql immutable set search_path='' as $$select coalesce(jsonb_typeof(s)='object' and (s->>'ownerId')::uuid is not null and s->>'companyId' ~ '^cmp_[a-z0-9]+(-[a-z0-9]+)*$' and s->>'projectId' ~ '^prj_[a-z0-9]+(-[a-z0-9]+)*$' and s->>'environment' in ('local','preview','test','development','staging') and not exists(select 1 from jsonb_object_keys(s) k where k not in ('ownerId','companyId','projectId','environment','accountId')),false)$$;
create function command_center_private.p14_append(r jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare t text; prior jsonb; d jsonb; s jsonb; slot text; mapped jsonb; c text; f text;
begin
 if r is null or jsonb_typeof(r)<>'object' then raise exception 'Recovery object required'; end if;
 foreach f in array array['id','version','scope','kind','recordClass','occurredAt','evidenceIds','sourceRef','targetRef','detail','digest'] loop if not (r ? f) or r->f='null'::jsonb then raise exception 'Recovery field required: %',f; end if; end loop;
 s:=r->'scope'; t:=command_center_private.p14_table(r->>'kind'); d:=r->'detail'; c:=r->>'recordClass';
 if not (d ? 'boundary' and d ? 'productionSideEffects') then raise exception 'Recovery boundary required'; end if;
 if t is null or not command_center_private.p14_scope(s) or jsonb_typeof(r)<>'object' or coalesce(r->>'id','')='' or (r->>'version') !~ '^[1-9][0-9]*$' or (r->>'version')::numeric>2147483647 or r->>'digest' !~ '^[a-f0-9]{64}$' or coalesce(r->>'sourceRef','')='' or coalesce(r->>'targetRef','')='' or (r->>'occurredAt')::timestamptz>now() or jsonb_typeof(r->'evidenceIds')<>'array' or jsonb_array_length(r->'evidenceIds')=0 or exists(select 1 from jsonb_array_elements_text(r->'evidenceIds') e where e !~ '^evd_[a-z0-9]+(-[a-z0-9]+)*$') or jsonb_typeof(d)<>'object' or d->>'boundary'<>'isolated' or d->'productionSideEffects'<>'false'::jsonb then raise exception 'Invalid scoped recovery contract'; end if;
 if exists(select 1 from jsonb_object_keys(r) k where k not in ('id','version','scope','kind','recordClass','occurredAt','evidenceIds','sourceRef','targetRef','detail','digest')) then raise exception 'Unsupported recovery field'; end if;
 if r->>'kind'='artifact' then
  if not (d ? 'backup') or not (d#>'{backup,header}' ?& array['id','scope','formatVersion','keyRef','contentDigest','policyDigest','createdAt','expiresAt','itemCount']) or not (d->'backup' ?& array['ciphertext','iv','envelopeDigest']) then raise exception 'Encrypted backup fields required'; end if;
  if jsonb_typeof(d->'backup')<>'object' or d#>>'{backup,header,id}'<>r->>'id' or d#>'{backup,header,scope}'<>s or d#>>'{backup,header,formatVersion}'<>'1' or jsonb_typeof(d#>'{backup,ciphertext}')<>'array' or jsonb_array_length(d#>'{backup,ciphertext}')<16 or jsonb_array_length(d#>'{backup,iv}')<>12 or d#>>'{backup,envelopeDigest}' !~ '^[a-f0-9]{64}$' or exists(select 1 from jsonb_object_keys(d) k where k not in ('boundary','productionSideEffects','backup')) then raise exception 'Encrypted recovery artifact required'; end if;
 else
  if exists(select 1 from jsonb_object_keys(d) k where k not in ('boundary','productionSideEffects','status','reasonCodes','summaryDigest','checkpointRef','rollbackRef','revalidationState','stage','currentPolicyRef','currentRevocationRef')) then raise exception 'Recovery metadata only'; end if;
 end if;
 -- Scoped advisory lock serializes duplicate/retry writes without global contention.
 perform pg_advisory_xact_lock(hashtext(s::text||':'||(r->>'kind')||':'||(r->>'id')));
 execute format('select record_contract from public.%I where record_scope=$1 and record_contract->>''id''=$2 and record_version=$3',t) into prior using s,r->>'id',(r->>'version')::integer;
 if prior is not null then if prior<>r then raise exception 'Recovery idempotency collision'; end if; return prior; end if;
 slot:=md5(s::text||':'||(r->>'id'))||':'||(r->>'version');
 mapped:=jsonb_build_object('owner_user_id',s->>'ownerId','record_scope',s,'record_contract',r,'record_digest',r->>'digest','record_version',(r->>'version')::integer);
 case r->>'kind'
 when 'artifact' then mapped:=mapped||jsonb_build_object('artifact_ref',slot,'artifact_class',c,'version_ref',r->>'version','checksum',r->>'digest','storage_ref','encrypted:'||(r->>'id'),'policy_snapshot_ref',d#>>'{backup,header,policyDigest}','revocation_snapshot_ref',r->>'sourceRef','source_refs',r->'evidenceIds');
 when 'exercise' then mapped:=mapped||jsonb_build_object('exercise_ref',slot,'exercise_class',c,'project_ref',s->>'projectId','source_version_ref',r->>'sourceRef','target_version_ref',r->>'targetRef','production_side_effects',false,'deterministic_replay_ref',d->>'checkpointRef','result',d,'evidence_refs',r->'evidenceIds','executed_at',r->>'occurredAt');
 when 'replacement' then mapped:=mapped||jsonb_build_object('replacement_ref',slot,'dependency_class',c,'project_ref',s->>'projectId','old_ref',r->>'sourceRef','new_ref',r->>'targetRef','compatibility_state','revalidation_required','rollback_ref',d->>'rollbackRef','evidence_refs',r->'evidenceIds','assessed_at',r->>'occurredAt');
 when 'dormant' then mapped:=mapped||jsonb_build_object('reactivation_ref',slot,'dormant_class',c,'project_ref',s->>'projectId','dormant_ref',r->>'sourceRef','prior_version_ref',r->>'version','current_policy_ref',d->>'currentPolicyRef','current_revocation_ref',d->>'currentRevocationRef','revalidation_state',d->>'revalidationState','evidence_refs',r->'evidenceIds','assessed_at',r->>'occurredAt');
 when 'boundary' then mapped:=mapped||jsonb_build_object('boundary_ref',slot,'boundary_class',c,'status','dormant','may_inherit_private_state',false,'evidence_refs',r->'evidenceIds');
 when 'drift' then mapped:=mapped||jsonb_build_object('finding_ref',slot,'finding_class',c,'project_ref',s->>'projectId','expected_ref',r->>'sourceRef','observed_ref',r->>'targetRef','state','revalidation_required','evidence_refs',r->'evidenceIds','observed_at',r->>'occurredAt');
 end case;
 -- Populate only declared columns; database defaults generate immutable row identity/time.
 execute format('insert into public.%I select x.* from jsonb_populate_record(null::public.%I,$1) x',t,t) using mapped||jsonb_build_object('id',gen_random_uuid(),'created_at',now(),'recorded_at',now());
 return r;
end $$;
create function command_center_private.p14_read(s jsonb,k text) returns setof jsonb language plpgsql security definer set search_path='' as $$declare t text;begin if not command_center_private.p14_scope(s) then raise exception 'Invalid recovery scope';end if;t:=command_center_private.p14_table(k);if t is null then raise exception 'Invalid recovery kind';end if;return query execute format('select record_contract from public.%I where record_scope=$1 and record_contract is not null order by record_contract->>''id'',record_version',t) using s;end$$;
revoke all on function command_center_private.p14_table(text),command_center_private.p14_scope(jsonb),command_center_private.p14_append(jsonb),command_center_private.p14_read(jsonb,text) from public,anon,authenticated;
grant execute on function command_center_private.p14_append(jsonb),command_center_private.p14_read(jsonb,text) to service_role;
commit;
