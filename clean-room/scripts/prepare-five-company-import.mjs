// Pure/local adaptation of the owner-supplied candidate package. Never connects to a service.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {ProjectTypeRegistry,ProjectRegistry} from '../dist/projects/registry.js';
import {validateRoadmap} from '../dist/projects/roadmap.js';
import {validateSpecialistModel} from '../dist/brain/specialists.js';

export const PACKAGE='roadmap/portfolio-future-architecture/five-company-import-2026-11-03/';
const ROOT=new URL('../../',import.meta.url);
const hash=x=>createHash('sha256').update(x).digest('hex');
const read=async p=>readFile(new URL(p,ROOT),'utf8');
const json=async p=>JSON.parse(await read(PACKAGE+'data/'+p+'.json'));
const need=(ok,message)=>{if(!ok)throw Error(message);};

export async function prepareFiveCompanyImport({existingProjects=[],existingBrains=[]}={}){
 const proposals=(await json('COMPANY_REGISTRY_PROPOSALS')).companies;
 const brains=(await json('SPECIALIST_BRAIN_PROPOSALS')).brains;
 const tasks=(await json('AGENCY_TASK_GRAPH')).tasks;
 const checks=(await json('CONFORMANCE_106_CHECK_DRAFT')).checks;
 const phases=(await json('ROADMAP_PHASES')).phases;
 const manifest=(await json('PACKAGE_FILE_MANIFEST')).files;
 for(const f of manifest)need(hash(await readFile(new URL(PACKAGE+f.path,ROOT)))===f.sha256,'Candidate source changed: '+f.path);
 need(proposals.length===5&&brains.length===5&&checks.length===530&&tasks.length===530,'Incomplete five-company package');
 const types=new ProjectTypeRegistry();types.register({key:'project-type:company-build',version:1,label:'Company build project',capabilities:[],requiredDetailSections:[],domainPlaybookKey:'portfolio-company-build'});
 const registry=new ProjectRegistry(types),items=[];
 for(const [i,c] of proposals.entries()){
  const n=String(108+i),pid='project:company:future:'+n,cid='company:future:'+n;
  need(c.ordinal_proposed===108+i&&c.primary_project_id_proposed===pid&&c.company_id_proposed===cid,'Company identity mismatch');
  need(c.money_out_limit_usd===0&&c.execution_authorized===false&&c.no_automatic_spending_or_reinvestment===true,'Candidate grants financial/execution authority');
  need(!existingProjects.some(p=>p.id===pid||p.companyId===cid||p.name===c.working_name),'Existing company collision: '+pid);
  const source=c.proposed_repo_company_roadmap_path,content=await read(source);
  need(hash(content)===c.source_sha256,'Canonical roadmap hash mismatch: '+pid);
  const project={id:pid,typeKey:'project-type:company-build',ownerId:'owner-resolved-only-at-authorized-import',companyId:cid,name:c.working_name,mission:c.business_identity,lifecycle:'candidate',status:'Planned — not built or launched',verification:'unknown',priority:'normal',version:1,createdAt:'2026-11-03T00:00:00Z',updatedAt:'2026-11-03T00:00:00Z',agentAccessEnabled:false,portfolioAutoEnabled:false,protected:false};
  registry.create(project);
  const b=brains.find(b=>b.project_id===pid);need(b&&b.brain_id_proposed===c.brain_id_proposed&&b.parent_control_authority==='command-center'&&b.never_authorized_to_spend_or_reinvest===true&&b.max_automatic_outgoing_spend_usd===0,'Brain authority mismatch: '+pid);
  const key='brn_company-future-'+n;
  need(!existingBrains.some(b=>b.key===key||b.brainKey===c.brain_id_proposed||b.projectId===pid),'Existing Brain collision: '+pid);
  const configurationRef=PACKAGE+b.source_files[0];
  const sourceRef=source+'#sha256='+c.source_sha256;
  const model={key,version:1,enabled:false,controlPlane:'command_center',domain:c.slug,subdomains:[],supportedCompanyIds:[cid],supportedProjectIds:[pid],supportedWorkClasses:['planning','evidence-review'],strengths:b.capability_tree,weaknesses:['Planned configuration; no empirical model evaluation or connected provider'],capabilityKeys:b.capability_tree.map((_,i)=>'cap_company-'+n+'-'+String(i+1).padStart(3,'0')),methodIds:[],permissionKeys:[],protectedActionBoundaries:['owner-only outgoing money; automatic spend limit $0','owner-only publication/account/security/contract actions','Command Center controls all delegation','No cross-company customer/account/data inheritance'],dataClasses:['project-private-metadata'],toolKeys:[],providerKeys:[],modelAssignments:[],dependencyVersionRefs:[sourceRef,configurationRef],calibrationScore:0,evaluationEvidenceIds:['evd_company-'+n+'-source-contract-review'],historicalAccuracy:0,reliabilityScore:0,latencyMs:0,resourceClass:'low',costClass:'free',failureModes:['No inference provider or worker connected','Evidence remains unverified until independent domain evaluations'],degradedModes:['Read-only source planning; abstain from execution'],fallbackSpecialistIds:[],delegationTargets:[],learningEligibility:'none',experimentStatus:'candidate',health:'unavailable',lifecycle:'suspended',rollbackEvidenceId:'evd_company-'+n+'-import-rollback',provenanceEvidenceIds:['evd_company-'+n+'-source-package'],verificationState:'experimental',revalidatedAt:'2026-11-03T00:00:00Z',revalidateAfter:'2026-12-03T00:00:00Z'};
  validateSpecialistModel(model);
  const localTasks=tasks.filter(t=>t.project_id===pid),localIds=new Set(localTasks.map(t=>t.id));
  need(localTasks.length>90&&new Set(localTasks.map(t=>t.id)).size===localTasks.length,'Task inventory invalid: '+pid);
  const roadmap={projectId:pid,version:1,gates:phases.filter(p=>p.project_id===pid).map(p=>({id:pid+':'+p.phase.toLowerCase()+':approval',satisfied:false,evidenceRefs:[]})),workUnits:localTasks.map(t=>{
   need(t.status==='planned'&&t.execution_authorized===false&&t.dependency_ids.every(d=>localIds.has(d)),'Cross-project dependency or unauthorized task: '+t.id);
   return {id:t.id,categoryId:'company-build',phaseId:t.phase,title:t.title,status:'planned',applicable:true,dependencyIds:t.dependency_ids,gateIds:t.id.endsWith(':gate')?[pid+':'+t.phase.toLowerCase()+':approval']:[],acceptanceCriteria:[...new Set(t.acceptance_criteria)],evidenceRefs:[sourceRef,PACKAGE+'data/AGENCY_TASK_GRAPH.json#'+t.id]};
  })};validateRoadmap(roadmap);need(roadmap.gates.length===8,'Phase gate inventory invalid');
  const mapped=checks.filter(x=>x.project_id===pid);need(mapped.length===106&&mapped.filter(x=>x.group==='28_PASS').length===28&&mapped.filter(x=>x.group==='A_BZ').length===78,'Conformance map incomplete');
  const flat=s=>s.replace(/\s+/g,' ').trim();
  const conformance=mapped.map(x=>{need(x.independent_verification===false&&flat(content).includes(flat(x.evidence)),'Untraceable or falsely completed check: '+x.check_id);return {...x,canonicalSource:sourceRef,importAudit:'Source mapping and preservation verified; substantive implementation and external validation pending'};});
  items.push({project,brainKey:c.brain_id_proposed,brain:model,configurationRef,sourceRef,sourceSha256:c.source_sha256,roadmap,conformance,route:'/project/'+encodeURIComponent(pid)});
 }
 return {schemaVersion:1,state:'PREPARED_NOT_IMPORTED',productionApplied:false,companyCount:5,expectedPlannedCompanyCountAfterImport:112,existingCompanyCount:107,expectedProjectCountAfterImport:151,bookCountPreserved:43,expectedHomeCountAfterImport:194,automaticSpendLimitUsd:0,items};
}

export function generateFiveCompanyImportSql(bundle){
 const snake=s=>s.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());
 const records=bundle.items.map(item=>{
  const p=item.project,m=item.brain;
  const brain=Object.fromEntries(Object.entries(m).map(([k,v])=>[snake(k),v]));
  delete brain.key;delete brain.capability_keys;
  Object.assign(brain,{specialist_id:m.key,brain_key:item.brainKey,scope:'project',project_id:p.id,capabilities:m.capabilityKeys,allowed_memory_kinds:['project-private-metadata'],configuration_ref:item.configurationRef,provenance_refs:[item.sourceRef,item.configurationRef],evaluation_history:[]});
  return {projectId:p.id,sourceRef:item.sourceRef,sourceSha256:item.sourceSha256,
   entity:{entity_id:p.id,project_id:p.id,entity_type:'company-project',payload:{schemaVersion:1,companyId:p.companyId,projectId:p.id,sequence:Number(p.id.slice(-3)),truthState:'PLANNED',source:item.sourceRef,sourceSha256:item.sourceSha256},content_hash:hash(JSON.stringify({projectId:p.id,sourceRef:item.sourceRef}))},
   profile:{project_id:p.id,canonical_entity_id:p.id,type_key:p.typeKey,company_id:p.companyId,name:p.name,mission:p.mission,lifecycle:p.lifecycle,status:p.status,verification:p.verification,priority:p.priority,source_ref:item.sourceRef,stage:'Source roadmap and specialized Brain plan registered; implementation not started',next_action:item.roadmap.workUnits.find(u=>u.dependencyIds.length===0&&u.gateIds.length===0)?.title??'Review source plan',status_source_refs:[item.sourceRef,item.configurationRef],status_observed_at:p.createdAt},
   brain,roadmap:{project_id:p.id,version:1,state:'current',structure_verified:false,denominator_trusted:false,denominator_evidence_refs:[],source_ref:item.sourceRef},
   checkpoint:{project_id:p.id,roadmap_version:1,exact_next_work_unit_id:item.roadmap.workUnits.find(u=>u.dependencyIds.length===0&&u.gateIds.length===0)?.id??null,blocker:'No verified free inference provider or execution worker connected',required_environment:'any_device',owner_action:'Review the working name and company-specific plan. Public branding, external accounts, legal acceptance, publication and spending remain separate owner decisions.',verification_method:'Native source, identity, scope and dependency checks; implementation and independent domain evaluation remain pending',evidence_refs:[item.sourceRef,item.configurationRef],resume_state_hash:hash(JSON.stringify(item.roadmap)),created_at:p.createdAt},
   units:item.roadmap.workUnits.map(u=>({project_id:p.id,roadmap_version:1,work_unit_id:u.id,category_id:u.categoryId,phase_id:u.phaseId,title:u.title,status:'planned',applicable:true,dependency_ids:u.dependencyIds,gate_ids:u.gateIds,acceptance_criteria:u.acceptanceCriteria,evidence_refs:u.evidenceRefs})),
   gates:item.roadmap.gates.map(g=>({project_id:p.id,roadmap_version:1,gate_id:g.id,satisfied:false,evidence_refs:[]}))};
 });
 const insert=(table,property,sample)=>{const cols=['owner_id',...Object.keys(sample)];return `insert into public.${table}(${cols.join(',')}) select ${cols.map(k=>'x.'+k).join(',')} from jsonb_populate_record(null::public.${table},${property}||jsonb_build_object('owner_id',v_owner)) x;`;};
 const sample=records[0];
 return `-- PREPARED ONLY. Apply only after James separately authorizes this exact production import.\n-- Atomic and additive; never executes workers, changes accounts, spends, resets or overwrites existing projects.\nbegin;\ndo $import$\ndeclare v_owner uuid; item jsonb; unit jsonb; gate jsonb; prior record;\nbegin\n select owner_id into strict v_owner from public.command_center_project_profiles where project_id='command-center';\n perform pg_advisory_xact_lock(hashtextextended(v_owner::text,108));\n for item in select value from jsonb_array_elements($records$${JSON.stringify(records)}$records$::jsonb) loop\n  select * into prior from public.command_center_project_profiles where owner_id=v_owner and project_id=item->>'projectId';\n  if found then\n   if prior.company_id<>item->'profile'->>'company_id' or prior.source_ref<>item->>'sourceRef' or not exists(select 1 from public.command_center_specialist_brains where owner_id=v_owner and brain_key=item->'brain'->>'brain_key' and configuration_ref=item->'brain'->>'configuration_ref') then raise exception 'Company identity/source or partial import conflict: %',item->>'projectId'; end if;\n   continue;\n  end if;\n  if exists(select 1 from public.command_center_project_profiles where owner_id=v_owner and (company_id=item->'profile'->>'company_id' or name=item->'profile'->>'name')) or exists(select 1 from public.command_center_canonical_entities where owner_id=v_owner and entity_id=item->>'projectId') or exists(select 1 from public.command_center_specialist_brains where owner_id=v_owner and (brain_key=item->'brain'->>'brain_key' or specialist_id=item->'brain'->>'specialist_id')) then raise exception 'Existing identity collision: %',item->>'projectId'; end if;\n  ${insert('command_center_canonical_entities',"item->'entity'",sample.entity)}\n  ${insert('command_center_project_profiles',"item->'profile'",sample.profile)}\n  ${insert('command_center_specialist_brains',"item->'brain'",sample.brain)}\n  insert into public.command_center_specialist_brain_versions(owner_id,specialist_id,version,snapshot,authority_evidence_ids) select v_owner,b.specialist_id,1,to_jsonb(b)-'owner_id',array['evd_company-'||right(item->>'projectId',3)||'-source-import'] from public.command_center_specialist_brains b where b.owner_id=v_owner and b.brain_key=item->'brain'->>'brain_key';\n  ${insert('command_center_project_roadmaps',"item->'roadmap'",sample.roadmap)}\n  for unit in select value from jsonb_array_elements(item->'units') loop ${insert('command_center_project_work_units','unit',sample.units[0])} end loop;\n  for gate in select value from jsonb_array_elements(item->'gates') loop ${insert('command_center_project_roadmap_gates','gate',sample.gates[0])} end loop;\n  perform command_center_private.c5_assert_roadmap_integrity(v_owner,item->>'projectId',1);\n  update public.command_center_project_roadmaps set structure_verified=true where owner_id=v_owner and project_id=item->>'projectId' and version=1;\n  ${insert('command_center_project_checkpoints',"item->'checkpoint'",sample.checkpoint)}\n end loop;\nend $import$;\ncommit;\n`;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const bundle=await prepareFiveCompanyImport();
 if(process.argv.includes('--write')){
  await writeFile(new URL('clean-room/evidence/FIVE_COMPANY_NATIVE_IMPORT.json',ROOT),JSON.stringify(bundle,null,2)+'\n');
  await writeFile(new URL('supabase/seeds/five_company_import.sql',ROOT),generateFiveCompanyImportSql(bundle));
 }
 console.log(JSON.stringify({state:bundle.state,companies:bundle.items.length,brains:bundle.items.length,workUnits:bundle.items.reduce((n,c)=>n+c.roadmap.workUnits.length,0),phaseGates:bundle.items.reduce((n,c)=>n+c.roadmap.gates.length,0),sourceMappedChecks:bundle.items.reduce((n,c)=>n+c.conformance.length,0),productionApplied:false}));
}
