-- Activation context binding only. Existing identities/roadmaps/runs are never changed.
-- Trusted connector transaction; no auth.uid/JWT impersonation and no new schema.
begin;
do $bind$
declare
 u uuid; b record; r record; cp record; c uuid; t uuid; packet text; refs text[];
begin
 select w.owner_id into strict u
 from public.command_center_pc_worker_registrations w
 join public.command_center_members m on m.user_id=w.owner_id
 where w.worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f'
   and w.enabled and w.revoked_at is null and m.access_status='active' and m.revoked_at is null
 for share of w,m;
 perform pg_advisory_xact_lock(hashtextextended('brain-activation:project-context:'||u::text,0));
 if (select count(*) from public.command_center_specialist_brains where owner_id=u)<>128 then raise exception 'Expected exact existing 128 specialist identities'; end if;
 if exists(select 1 from public.command_center_specialist_brains x
   left join public.command_center_project_profiles p on p.owner_id=x.owner_id and p.project_id=x.project_id
   where x.owner_id=u and (p.project_id is null or x.control_plane<>'command_center'
     or x.supported_project_ids is distinct from array[x.project_id]
     or x.supported_company_ids is distinct from array[p.company_id])) then raise exception 'Specialist project/company identity mismatch'; end if;
 for b in select x.owner_id,x.project_id,x.brain_key,x.version,x.provenance_refs,p.company_id,p.version as spec_version
   from public.command_center_specialist_brains x
   join public.command_center_project_profiles p on p.owner_id=x.owner_id and p.project_id=x.project_id
   where x.owner_id=u order by x.brain_key for share of x,p
 loop
   -- Preserve any workspace created by an owner or another authorized task.
   if exists(select 1 from public.command_center_brain_project_workspaces w where w.owner_id=u and w.project_id=b.project_id) then continue; end if;
   if (select count(*) from public.command_center_project_roadmaps rm where rm.owner_id=u and rm.project_id=b.project_id and rm.state='current')<>1 then raise exception 'One current roadmap required for %',b.project_id; end if;
   select * into strict r from public.command_center_project_roadmaps rm where rm.owner_id=u and rm.project_id=b.project_id and rm.state='current' for share;
   select * into cp from public.command_center_project_checkpoints ck where ck.owner_id=u and ck.project_id=b.project_id and ck.roadmap_version=r.version order by ck.created_at desc,ck.checkpoint_id desc limit 1 for share;
   if not found then raise exception 'Current roadmap checkpoint missing for %',b.project_id; end if;
   refs:=array(select distinct v from unnest(coalesce(b.provenance_refs,'{}'::text[])||array[
     'supabase:command_center_specialist_brains:'||b.brain_key||'@'||b.version,
     'supabase:command_center_project_profiles:'||b.project_id||'@'||b.spec_version,
     'supabase:command_center_project_roadmaps:'||b.project_id||'@'||r.version,
     'supabase:command_center_project_checkpoints:'||cp.checkpoint_id::text,
     'owner:brain-activation-only:2026-11-05']) as item(v) order by v);
   packet:=jsonb_build_object('purpose','brain_activation_context','controlPlane','command_center',
     'brainKey',b.brain_key,'brainVersion',b.version,'projectId',b.project_id,'companyId',b.company_id,
     'sourceRefs',refs,'roadmapVersion',r.version,'checkpointId',cp.checkpoint_id,
     'nextPreservedWorkUnit',cp.exact_next_work_unit_id,
     'contextPolicy','Retrieve this project''s relevant instructions, sources, roadmap, decisions, memory and approved assets; preserve provenance and company isolation.',
     'toolPolicy','No blanket tool/browser/coding exclusions. Discover relevant available tools; authorize each exact action and company account using existing free resources. Tool discovery is not permission to spend or perform protected actions.',
     'companyBuildStarted',false,'operationalVerificationClaimed',false)::text;
   c:=gen_random_uuid();t:=gen_random_uuid();
   insert into public.command_center_brain_conversations(owner_id,conversation_id,project_id,title,state)
     values(u,c,b.project_id,'Specialist activation context — '||b.project_id,'active');
   insert into public.command_center_brain_conversation_turns(owner_id,turn_id,conversation_id,project_id,role,intent,protected_action_possible,redaction_state,safe_text,content_ref,content_hash,evidence_refs,canonical_writes_authorized,created_at)
     values(u,t,c,b.project_id,'system',null,false,'safe_text',packet,'brain:activation-context:'||b.project_id,
       encode(sha256(convert_to(packet,'UTF8')),'hex'),refs,false,now());
   insert into public.command_center_brain_project_workspaces(owner_id,project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at)
     values(u,b.project_id,1,b.spec_version,c,array[t],'{}'::text[],null,
       array['brain-activation:live-specialist-inference-unverified','brain-activation:tool-execution-bindings-unverified'],refs,'{}'::text[],now());
   insert into public.command_center_brain_project_workspace_versions(owner_id,project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at)
     select owner_id,project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at
       from public.command_center_brain_project_workspaces where owner_id=u and project_id=b.project_id;
 end loop;
end $bind$;
commit;
