-- Append a context revision after model configuration. Never overwrite a turn.
begin;
do $refresh$
declare u uuid; x record; packet jsonb; current_models jsonb; tid uuid; refs text[];
begin
 select w.owner_id into strict u from public.command_center_pc_worker_registrations w
 join public.command_center_members m on m.user_id=w.owner_id
 where w.worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f' and w.enabled and w.revoked_at is null and m.access_status='active' and m.revoked_at is null for share of w,m;
 perform pg_advisory_xact_lock(hashtextextended('brain-activation:project-context:'||u::text,0));
 for x in select w.*,b.brain_key,b.version as brain_version,b.supported_company_ids,coalesce(to_jsonb(b)->'model_assignments','[]'::jsonb) as models,t.safe_text,t.content_hash
 from public.command_center_brain_project_workspaces w
 join public.command_center_specialist_brains b on b.owner_id=w.owner_id and b.project_id=w.project_id
 join public.command_center_brain_conversation_turns t on t.owner_id=w.owner_id and t.project_id=w.project_id and t.conversation_id=w.conversation_id and t.turn_id=w.turn_ids[cardinality(w.turn_ids)] where w.owner_id=u and w.execution_run_id is null and t.role='system' and t.content_ref='brain:activation-context:'||w.project_id
 order by b.brain_key for update of w
 loop
  if x.content_hash<>encode(sha256(convert_to(x.safe_text,'UTF8')),'hex') then raise exception 'Context checksum mismatch';end if;
  packet:=x.safe_text::jsonb;
  if packet->>'projectId'<>x.project_id or packet->>'brainKey'<>x.brain_key or packet->>'companyId'<>x.supported_company_ids[1] then raise exception 'Context identity mismatch';end if;
  current_models:=x.models;
  if packet->>'brainVersion'=x.brain_version::text and packet->'modelAssignments'=current_models then continue;end if;
  refs:=array(select distinct r from unnest(x.evidence_refs||array['supabase:command_center_specialist_brains:'||x.brain_key||'@'||x.brain_version])v(r)order by r);
  packet:=packet||jsonb_build_object('brainVersion',x.brain_version,'modelAssignments',current_models,'sourceRefs',refs,'modelTagIsImmutableDigest',false,'operationalVerificationClaimed',false,'companyBuildStarted',false);
  tid:=gen_random_uuid();
  insert into public.command_center_brain_conversation_turns(owner_id,turn_id,conversation_id,project_id,role,intent,protected_action_possible,redaction_state,safe_text,content_ref,content_hash,evidence_refs,canonical_writes_authorized,created_at)
  values(u,tid,x.conversation_id,x.project_id,'system',null,false,'safe_text',packet::text,'brain:activation-context:'||x.project_id,encode(sha256(convert_to(packet::text,'UTF8')),'hex'),refs,false,now());
  update public.command_center_brain_project_workspaces set version=x.version+1,turn_ids=x.turn_ids||array[tid],evidence_refs=refs,updated_at=now(),recorded_at=now()
  where owner_id=u and project_id=x.project_id and version=x.version;
  if not found then raise exception 'Concurrent workspace revision conflict';end if;
  insert into public.command_center_brain_project_workspace_versions(owner_id,project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at)
  select owner_id,project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at
  from public.command_center_brain_project_workspaces where owner_id=u and project_id=x.project_id;
 end loop;
end $refresh$;
commit;
