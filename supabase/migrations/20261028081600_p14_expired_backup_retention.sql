begin;
-- Lawful retention removes expired encrypted payloads while preserving immutable metadata audit.
create or replace function public.command_center_reject_recovery_evidence_mutation() returns trigger language plpgsql set search_path='' as $$begin
 if tg_op='DELETE' and tg_table_name='command_center_recovery_artifacts' then
  if old.record_contract is not null and old.record_scope::text=current_setting('command_center.p14_retention_scope',true) and (old.record_contract#>>'{detail,backup,header,expiresAt}')::timestamptz<=now() then return old;end if;
 end if;
 raise exception 'Recovery and lifecycle evidence is immutable';end$$;
create function command_center_private.p14_expire_backups(s jsonb) returns integer language plpgsql security definer set search_path='' as $$declare r record;n integer:=0;begin
 if not command_center_private.p14_scope(s) then raise exception 'Invalid retention scope';end if;
 perform pg_advisory_xact_lock(hashtext('retention:'||s::text));
 for r in select * from public.command_center_recovery_artifacts where record_scope=s and record_contract is not null and (record_contract#>>'{detail,backup,header,expiresAt}')::timestamptz<=now() for update loop
  insert into public.command_center_recovery_exercises(owner_user_id,exercise_ref,exercise_class,project_ref,source_version_ref,production_side_effects,result,evidence_refs,executed_at)
   values(r.owner_user_id,'retention:'||r.id::text,'revalidation',s->>'projectId',r.record_digest,false,jsonb_build_object('status','expired_ciphertext_purged','originalRecordDigest',r.record_digest,'backupHeader',r.record_contract#>'{detail,backup,header}','currentAuthorityRestored',false),r.record_contract->'evidenceIds',now());
  perform set_config('command_center.p14_retention_scope',s::text,true);
  delete from public.command_center_recovery_artifacts where id=r.id;
  perform set_config('command_center.p14_retention_scope','',true);n:=n+1;
 end loop;return n;end$$;
revoke all on function command_center_private.p14_expire_backups(jsonb) from public,anon,authenticated;
grant execute on function command_center_private.p14_expire_backups(jsonb) to service_role;
commit;
