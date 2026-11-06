-- Register the existing free local model assignment; do NOT activate a Brain.
-- Conditional/versioned and idempotent; existing nonempty assignments are preserved.
begin;
do $model$
declare u uuid; pr record; b record; snap jsonb; permissions text[]; model jsonb;
begin
 select w.owner_id into strict u from public.command_center_pc_worker_registrations w
 join public.command_center_members m on m.user_id=w.owner_id
 where w.worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f' and w.enabled and w.revoked_at is null
 and m.access_status='active' and m.revoked_at is null for share of w,m;
 perform pg_advisory_xact_lock(hashtextextended('brain-activation:model-binding:'||u::text,0));
 if (select count(*) from public.command_center_specialist_brains where owner_id=u)<>128 then raise exception 'Expected exact 128 specialist identities'; end if;
 select * into strict pr from public.command_center_provider_registry p where p.owner_id=u
 and p.provider_key='provider:owner-pc:737f5e7c-3884-4c61-81ac-634bdfc4828f'
 and p.enabled and p.cost='free' and p.health='available' and p.verification='live_verified'
 and p.configuration->>'execution_mode'='local-ollama' and p.configuration->>'model_id'='qwen3:4b-instruct'
 and p.configuration->>'payment_authorized'='false' and p.configuration->>'company_build_authorized'='false'
 and 'brain.respond.read_only'=any(p.capabilities) for share;
 for b in select x.* from public.command_center_specialist_brains x where x.owner_id=u order by x.brain_key for update loop
   if jsonb_array_length(b.model_assignments)>0 then continue; end if;
   if b.lifecycle<>'suspended' or b.enabled or b.control_plane<>'command_center' or b.cost_class<>'free'
    or cardinality(b.supported_project_ids)<>1 or b.supported_project_ids[1]<>b.project_id
    or not pr.provider_key=any(b.provider_keys)
    or not exists(select 1 from public.command_center_project_profiles p where p.owner_id=u and p.project_id=b.project_id and b.supported_company_ids=array[p.company_id])
    or not exists(select 1 from public.command_center_brain_project_workspaces w where w.owner_id=u and w.project_id=b.project_id)
    then raise exception 'Existing specialist scope/context/configuration requires review: %',b.brain_key; end if;
   model:=jsonb_build_array(jsonb_build_object('providerKey',pr.provider_key,'modelId',pr.configuration->>'model_id',
     'versionRef',pr.provider_key||'@'||pr.version||'/model-tag:'||(pr.configuration->>'model_id'),
     'routeKey','ai-route:'||b.brain_key||':owner-pc'));
   permissions:=array(select distinct k from unnest(b.permission_keys||array[
     'project:'||b.project_id||':context.read','project:'||b.project_id||':roadmap.read',
     'project:'||b.project_id||':inference.read_only','project:'||b.project_id||':memory.read',
     'project:'||b.project_id||':memory.write','project:'||b.project_id||':tools.request']) as v(k) order by k);
   update public.command_center_specialist_brains set model_assignments=model,permission_keys=permissions,
     version=b.version+1,updated_at=now()
     where owner_id=u and brain_key=b.brain_key and version=b.version and model_assignments='[]'::jsonb;
   if not found then raise exception 'Concurrent model binding conflict'; end if;
   select to_jsonb(x)-'owner_id' into strict snap from public.command_center_specialist_brains x where x.owner_id=u and x.brain_key=b.brain_key;
   snap:=snap||jsonb_build_object('activationConfigurationEvidence',jsonb_build_object(
     'id','evd_owner-command-center-brain-activation-20261105',
     'source','James Morgan: existing 128-Brain activation task and instruction to enable full job capabilities',
     'modelTagIsImmutableDigest',false,'liveSpecialistVerificationClaimed',false,
     'companyBuildStarted',false,'permissionSemantics','Project-local context/memory access and tool requests; each actual tool action still requires its exact account and action authority.'));
   insert into public.command_center_specialist_brain_versions(owner_id,specialist_id,version,snapshot,authority_evidence_ids)
     values(u,b.specialist_id,b.version+1,snap,array['evd_owner-command-center-brain-activation-20261105']);
 end loop;
end $model$;
commit;
