-- Owner-only central source reconciliation for canonical 001–107 company plans other than #014.
-- No worker start, paid provisioning, launch, percentage certification or specialist enablement.
create or replace function command_center_private.reconcile_company_source_contract(p jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $cc$
declare
 v_id text:=p->>'projectId'; v_cid text:=p->>'companyId';
 v_path text:=p->>'sourcePath'; v_source text:=p->>'sourceText';
 v_sha text:=p->>'sourceSha256'; v_ref text; v_supp_path text:=coalesce(p->>'conformancePath','');
 v_supp text:=coalesce(p->>'conformanceText',''); v_supp_ref text;
 v_ord text; v_owner uuid; v_old bigint; v_new bigint; v_count integer;
 v_b jsonb:=p->'brain'; v_brain_key text; v_specialist text;
begin
 if jsonb_typeof(p)<>'object' or jsonb_typeof(p->'workUnits')<>'array'
  or jsonb_typeof(p->'gates')<>'array' or jsonb_typeof(v_b)<>'object'
 then raise exception 'Invalid integration contract';end if;
 if v_id !~ '^project:company:future:[0-9]{3}$'
  or v_cid<>'company:future:'||right(v_id,3)
  or v_path !~ '^roadmap/portfolio-future-architecture/companies/[0-9]{3}_[A-Z0-9_]+[.]md$'
  or substring(v_path from '/([0-9]{3})_')<>right(v_id,3)
 then raise exception 'Source identity mismatch';end if;
 v_ord:=right(v_id,3);
 if v_ord::integer<1 or v_ord::integer>107 or v_ord='014'
 then raise exception 'Project outside uninitialized source-import scope';end if;
 if length(v_source)<1500 or position('# Company '||v_ord||' — ' in v_source)=0
    or position(v_cid in v_source)=0 or position(v_id in v_source)=0
    or v_sha !~ '^[a-f0-9]{64}$'
    or encode(pg_catalog.sha256(convert_to(v_source,'UTF8')),'hex')<>v_sha
 then raise exception 'Canonical source content or SHA256 mismatch';end if;
 v_ref:=v_path||'#sha256='||v_sha;
 if v_ord::integer<=100 then
   if v_supp_path<>replace(replace(v_path,'/companies/','/companies/conformance/'),'.md','_CURRENT_STANDARD.md')
    or length(v_supp)<500 then raise exception 'Conformance complement not recovered';end if;
   v_supp_ref:=v_supp_path||'#sha256='||encode(pg_catalog.sha256(convert_to(v_supp,'UTF8')),'hex');
 elsif v_supp_path<>'' or v_supp<>'' then raise exception 'Unexpected supplement for native company';end if;
 v_brain_key:=v_b->>'brainKey';v_specialist:=v_b->>'specialistId';
 if v_brain_key<>'brain:company:future:'||v_ord||':v1'
  or v_specialist<>'brn_company-future-'||v_ord
  or jsonb_typeof(v_b->'capabilities')<>'array'
  or jsonb_array_length(v_b->'capabilities')<1
  or coalesce((v_b->>'enabled')::boolean,false) then raise exception 'Specialist identity or execution boundary mismatch';end if;
 if jsonb_array_length(p->'workUnits')<30
    or jsonb_array_length(p->'gates')<>4 then raise exception 'Incomplete scoped graph or protected gates';end if;
 if (select count(distinct x->>'id') from jsonb_array_elements(p->'workUnits') x)<>jsonb_array_length(p->'workUnits')
 or (select count(distinct x->>'id') from jsonb_array_elements(p->'gates') x)<>4
 then raise exception 'Duplicate graph identity';end if;
 if exists(select 1 from jsonb_array_elements(p->'workUnits') x
  where x->>'id' not like v_id||':recovery:%'
    or coalesce(x->>'title','')=''
    or jsonb_typeof(x->'acceptanceCriteria')<>'array' or jsonb_array_length(x->'acceptanceCriteria')<2
    or jsonb_typeof(x->'dependencyIds')<>'array' or jsonb_typeof(x->'gateIds')<>'array'
    or jsonb_typeof(x->'evidenceRefs')<>'array'
    or not(x->'evidenceRefs' ? v_ref)
    or x->>'status' not in ('planned','ready')
    or coalesce((x->>'applicable')::boolean,false)<>true
 ) then raise exception 'Untraceable source task';end if;
 if exists(select 1 from jsonb_array_elements(p->'gates') x
  where x->>'id' not like v_id||':recovery:gate-%'
    or coalesce((x->>'satisfied')::boolean,false)
    or jsonb_typeof(x->'evidenceRefs')<>'array'
    or jsonb_array_length(x->'evidenceRefs')<>0
 ) then raise exception 'Unapproved protected gate';end if;
 select owner_id into v_owner from public.command_center_project_profiles
  where project_id=v_id and company_id=v_cid and lifecycle='candidate' and status='planned'
    and source_ref=v_path for update;
 if v_owner is null then raise exception 'Current company source/state changed';end if;
 if exists(select 1 from public.command_center_specialist_brains where owner_id=v_owner and project_id=v_id)
   or exists(select 1 from public.command_center_agency_runs
               where owner_id=v_owner and project_id=v_id and state in ('queued','working'))
 then raise exception 'Existing specialist or Agency run requires preservation';end if;
 select version into v_old from public.command_center_project_roadmaps
  where owner_id=v_owner and project_id=v_id and state='current' for update;
 if v_old is distinct from 1
    or (select count(*) from public.command_center_project_work_units
        where owner_id=v_owner and project_id=v_id and roadmap_version=1)<>2
    or exists(select 1 from public.command_center_project_work_units
        where owner_id=v_owner and project_id=v_id and roadmap_version=1
          and status not in ('planned','ready'))
 then raise exception 'Original task evidence changed; no reset permitted';end if;
 v_new:=v_old+1;
 update public.command_center_project_roadmaps set state='superseded',superseded_at=now()
 where owner_id=v_owner and project_id=v_id and version=v_old and state='current';
 insert into public.command_center_project_roadmaps
  (owner_id,project_id,version,state,structure_verified,denominator_trusted,denominator_evidence_refs,source_ref)
 values(v_owner,v_id,v_new,'current',false,false,array_remove(array[v_ref,v_supp_ref],null),v_ref);
 insert into public.command_center_project_roadmap_gates
  (owner_id,project_id,roadmap_version,gate_id,satisfied,evidence_refs)
 select v_owner,v_id,v_new,x->>'id',false,array[]::text[]
 from jsonb_array_elements(p->'gates') x;
 insert into public.command_center_project_work_units
  (owner_id,project_id,roadmap_version,work_unit_id,category_id,phase_id,title,status,applicable,
    dependency_ids,gate_ids,acceptance_criteria,evidence_refs)
 select v_owner,v_id,v_new,w.id,w."categoryId",w."phaseId",w.title,w.status,w.applicable,
   w."dependencyIds",w."gateIds",w."acceptanceCriteria",w."evidenceRefs"
 from jsonb_to_recordset(p->'workUnits') as w
 (id text,"categoryId" text,"phaseId" text,title text,status text,applicable boolean,
  "dependencyIds" text[],"gateIds" text[],"acceptanceCriteria" text[],"evidenceRefs" text[]);
 perform command_center_private.c5_assert_roadmap_integrity(v_owner,v_id,v_new);
 select count(*) into v_count from public.command_center_project_work_units
   where owner_id=v_owner and project_id=v_id and roadmap_version=v_new;
 if v_count<>jsonb_array_length(p->'workUnits')
  or not exists(select 1 from public.command_center_project_work_units
           where owner_id=v_owner and project_id=v_id and roadmap_version=v_new and category_id='brain')
  or not exists(select 1 from public.command_center_project_work_units
           where owner_id=v_owner and project_id=v_id and roadmap_version=v_new and category_id='agent')
 then raise exception 'Brain, Agent or roadmap graph incomplete';end if;
 insert into public.command_center_specialist_brains(
  owner_id,brain_key,version,scope,project_id,capabilities,allowed_memory_kinds,enabled,
  configuration_ref,provenance_refs,specialist_id,domain,subdomains,supported_company_ids,
  supported_project_ids,supported_work_classes,strengths,weaknesses,protected_action_boundaries,
  data_classes,dependency_version_refs,resource_class,cost_class,failure_modes,degraded_modes,
  learning_eligibility,experiment_status,health,lifecycle,verification_state)
 values(v_owner,v_brain_key,1,'project',v_id,
  array(select jsonb_array_elements_text(v_b->'capabilities')),
  array['source','evidence','decision','checkpoint']::text[],false,v_ref,
  array_remove(array[v_ref,v_supp_ref],null),v_specialist,
  'company-future-'||v_ord,
  array['source-specific-specialization']::text[],array[v_cid],array[v_id],
  array['source-audit','offline-build','independent-qa']::text[],
  array['source-traceable-specialist']::text[],array['executor-not-verified']::text[],
  array['no-spend','no-live-external-action','no-publication','no-cross-company-data']::text[],
  array['company-private-evidence']::text[],array[v_ref],
  'low','free',array['no-model-provider']::text[],array['read-only-source-state']::text[],
  'none','experimental','unavailable','suspended','experimental');
 insert into public.command_center_specialist_brain_versions(
  owner_id,specialist_id,version,snapshot,authority_evidence_ids)
 select owner_id,specialist_id,version,to_jsonb(b)-'owner_id',array_remove(array[v_ref,v_supp_ref],null)
 from public.command_center_specialist_brains b
 where b.owner_id=v_owner and b.project_id=v_id and b.brain_key=v_brain_key;
 update public.command_center_project_roadmaps set structure_verified=true
 where owner_id=v_owner and project_id=v_id and version=v_new;
 update public.command_center_project_profiles
 set lifecycle='active',status='active',
 stage='Active Build — original exhaustive source, Brain/Agent requirements and executable roadmap registered',
 verification='Verified original source SHA256 and graph integrity; specialist registered but runtime not yet connected',
 progress_summary='0 of '||v_count||' current work units verified; complete scope denominator pending certification',
 next_action='Verify and connect genuine project-specific Brain/Agent execution before worker start',
 blocker='Company inference provider/Agency executor unverified; no automatic execution yet',
 status_source_refs=array_remove(array[v_ref,v_supp_ref],null),
 status_observed_at=now(),updated_at=now()
 where owner_id=v_owner and project_id=v_id;
 return jsonb_build_object('projectId',v_id,'activeBuild',true,'roadmapVersion',v_new,'units',v_count,
  'specialistId',v_specialist,'workerStarted',false,'runtimeVerified',false,'denominatorTrusted',false);
end $cc$;
revoke all on function command_center_private.reconcile_company_source_contract(jsonb) from public,anon,authenticated;
grant execute on function command_center_private.reconcile_company_source_contract(jsonb) to service_role;
