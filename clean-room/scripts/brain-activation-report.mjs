import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {assessSpecialistActivation} from '../dist/brain/activation.js';
const root=realpathSync(new URL('../../',import.meta.url).pathname);
const base=new URL('../evidence/brain-activation/',import.meta.url);
const snapshot=JSON.parse(readFileSync(new URL('full-specialist-registry.json',base)));
const runtime=JSON.parse(readFileSync(new URL('runtime-verification.json',base)));
const camel=s=>s.replace(/_([a-z])/g,(_,x)=>x.toUpperCase());
const manifest=snapshot.brains.map(row=>{
 const profile=snapshot.profiles.find(p=>p.project_id===row.project_id);
 const brain=Object.fromEntries(Object.entries(row).map(([k,v])=>[camel(k),v]));
 Object.assign(brain,{key:row.brain_key,capabilityKeys:row.capabilities});
 const sourceRefs=row.provenance_refs.map(ref=>{
  if(ref===`supabase:command_center_project_profiles:${row.project_id}`)return {ref,result:profile?'profile_identity_verified':'profile_missing'};
  const match=/^([^#]+)#(sha256|blob)=([a-f0-9]{40,64})$/.exec(ref) ?? (!ref.includes(':') && !ref.includes('#') ? [ref,ref,'head',null] : null);
  if(!match)return {ref,result:'unverified_reference_format'};
  const path=resolve(root,match[1]);
  try{if(!realpathSync(path).startsWith(root+sep))throw Error('outside_repository');const bytes=readFileSync(path);const actual=match[2]==='blob'?createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'):createHash('sha256').update(bytes).digest('hex');return {ref,result:match[2]==='head'?'head_file_verified':actual===match[3]?'hash_verified':'hash_mismatch',actualHash:actual};}catch{return {ref,result:'source_unavailable'};}
 });
 const assessment=assessSpecialistActivation({brain,projectId:row.project_id,companyId:profile?.company_id??'',routes:[],permittedToolKeys:[],allowedMemoryKinds:row.allowed_memory_kinds,evidence:[],now:snapshot.observed_at,maximumEvidenceAgeMs:180000});
 const blockers=[...assessment.blockers,'application_gateway_not_deployed','provider_specialist_scope_missing','specialist_probe_bootstrap_missing','live_specialist_tool_enforcement_unverified'];
 if(!row.project_id.startsWith('project:company:future:'))blockers.push('legacy_project_rejected_by_deployed_gateway_and_sql');
 if(sourceRefs.some(r=>!['profile_identity_verified','hash_verified','head_file_verified'].includes(r.result)))blockers.push('source_provenance_requires_reconciliation');
 return {brainKey:row.brain_key,specialistId:row.specialist_id,projectId:row.project_id,companyId:profile?.company_id,domain:row.domain,mission:profile?.mission,identityMapped:row.supported_project_ids.length===1&&row.supported_project_ids[0]===row.project_id&&row.supported_company_ids.length===1&&row.supported_company_ids[0]===profile?.company_id,controlPlane:row.control_plane,registered:true,operational:false,lifecycle:row.lifecycle,health:row.health,modelAssignments:row.model_assignments,permissionKeys:row.permission_keys,toolKeys:row.tool_keys,sourceRefs,blockers:[...new Set(blockers)],proposedReadOnlyConnection:{status:'proposal_only_not_granted',providerKey:row.provider_keys[0],modelId:snapshot.provider[0].configuration.model_id,modelVersionRef:null,modelVersionBlocker:'installed_immutable_model_digest_not_recovered',permissionKeys:[`project:${row.project_id}:context.read`,`project:${row.project_id}:inference.read_only`],requiredInternalTool:'project-scoped-read-only-context',externalToolGrants:[],businessExecutionAuthorized:false,activationPrerequisite:'fresh live per-specialist inference, persisted output, negative permission/isolation and recovery checks'}};
});
if(manifest.length!==128||new Set(manifest.map(r=>r.brainKey)).size!==128||manifest.some(r=>!r.identityMapped))throw Error('Specialist identity count/mapping mismatch');
const report={observedAt:snapshot.observed_at,sourceHead:'39801ce12f0344b2d52167d9e1d48f22e92aa406',registered:manifest.length,operational:0,blocked:manifest.length,verifiedSpecialistToolConnections:0,verifiedSpecialistProviderConnections:0,verifiedCentralProviderConnections:runtime.probe.persistence_verified?1:0,legacyProjectRouteBlockers:manifest.filter(r=>r.blockers.includes('legacy_project_rejected_by_deployed_gateway_and_sql')).length,sourceProvenanceIssues:manifest.filter(r=>r.blockers.includes('source_provenance_requires_reconciliation')).length,manifest};
writeFileSync(new URL('activation-results.json',base),JSON.stringify(report,null,2)+'\n');
const rows=manifest.map(r=>`| ${r.brainKey} | ${r.projectId} | ${r.companyId} | blocked | ${r.blockers.join(', ')} |`).join('\n');
writeFileSync(new URL('activation-results.md',base),`# Specialist activation results\n\nObserved ${report.observedAt}. Registered **128**, operational **0**, blocked **128**. Central local inference was verified; no specialist inference or tool connection was verified. This is a saved live-state assessment, not a deployment or activation receipt.\n\nEleven legacy identities are outside the live PC queue contract. Permission/model/tool proposals in the JSON are ungranted, and contain no external account permissions.\n\n| Brain | Project | Company | Result | Exact blockers |\n| --- | --- | --- | --- | --- |\n${rows}\n`);
console.log(JSON.stringify({...report,manifest:undefined}));
