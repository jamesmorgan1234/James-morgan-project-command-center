import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {readCompanyBuildPreparation, scopedCompanyId} from '../../supabase/functions/command-center-execution/preparation-read.mjs';
const project='project:company:future:001';
const company='company:future:001';
const checkpoint='00000000-0000-4000-8000-000000000001';
const unit=project+':recovery:source-integrity';
const sha=text=>createHash('sha256').update(text).digest('hex');
const instructions='OWNER: James Morgan. Read the entire original company roadmap and supplement. '.repeat(25);
function fixture(changes={}) {
 const source='roadmap/portfolio-future-architecture/companies/001_API_AS_A_BUSINESS_FACTORY.md#sha256='+'b'.repeat(64);
 const data={
   command_center_project_profiles:[{project_id:project,company_id:company,status:'active',source_ref:source,stage:'Active'}],
   command_center_project_roadmaps:[{project_id:project,version:2,state:'current',structure_verified:true,source_ref:source}],
   command_center_specialist_brains:[{project_id:project,brain_key:'brain:'+company+':v1',enabled:false,verification_state:'experimental',configuration_ref:source,provenance_refs:[source]}],
   command_center_project_checkpoints:[{checkpoint_id:checkpoint,roadmap_version:2,exact_next_work_unit_id:unit,resume_state_hash:'a'.repeat(64),evidence_refs:[source],blocker:'No executable Brain',owner_action:'Build separately'}],
   command_center_project_work_units:[{work_unit_id:unit,title:'Verify source identity',status:'ready',applicable:true,dependency_ids:[],gate_ids:[],evidence_refs:[source]}],
   command_center_knowledge_claims:[
      {project_id:project,claim_id:'company-build-start:'+company+':v1',kind:'generated',state:'current',truth_state:'known',source_refs:[source],value_jsonb:{company_id:company,project_id:project,brain_key:'brain:'+company+':v1',roadmap_version:2,checkpoint_id:checkpoint,initial_work_unit:unit,resume_state_hash:'a'.repeat(64),source_checks_completed_in_packet:true,available_prior_records_reconciled:true,reconciliation_claim_id:'company-reconciliation:'+company+':v1',instructions,instructions_sha256:sha(instructions)}},
      {project_id:project,claim_id:'company-reconciliation:'+company+':v1',kind:'calculated',state:'current',truth_state:'known',source_refs:[source],value_jsonb:{company_id:company,project_id:project,roadmap_version:2,brain_key:'brain:'+company+':v1',initial_checkpoint_id:checkpoint,first_roadmap_unit:unit,available_canonical_records_reconciled:true,source_files_verified:true,roadmap_graph_sha256:'d'.repeat(64),source_authority_commit:'e5069834ecb8d44aeb687bd74a04d929dc515cbc',current_unit_count:163,superseded_history_unit_count:2,uninspected_other_chat_history:true,scope:'available records'}}
   ]
 };
 Object.assign(data,changes);
 const calls=[];
 const read=async (table,params)=>{
   calls.push({table,params});
   assert.equal(params.project_id,'eq.'+project,'Must scope every company read to exact project');
   const rows=data[table]??[];
   const key=params.claim_id??params.brain_key??'';
   return key.startsWith('eq.') ? rows.filter(r=>r.claim_id===key.slice(3)||r.brain_key===key.slice(3)) : rows;
 };
 return {data,read,calls};
}
test('116-only exact scope including company exclusion',()=>{
 let n=0;for(let i=1;i<=117;i++){const id=String(i).padStart(3,'0');const valid=scopedCompanyId('project:company:future:'+id);if(i===14)assert.equal(valid,null);else{assert.equal(valid,'company:future:'+id);n++}}
 assert.equal(n,116);
 for(const s of ['project:company:future:000','project:company:future:118','project:company:future:1','project:company:future:014','project:company:past:001','project:company:future:001:extra'])assert.equal(scopedCompanyId(s),null);
});
test('excluded project rejected before any database read',async()=>{
 let calls=0;await assert.rejects(readCompanyBuildPreparation('project:company:future:014',()=>{calls++;return[];}),e=>e.message==='project_outside_preparation_scope'&&e.status===403);assert.equal(calls,0);
});
test('complete read of owner-scoped canonical data produces non-executing receipt',async()=>{
 const {read,calls}=fixture();const result=await readCompanyBuildPreparation(project,read);
 assert.equal(result.companyId,company);assert.equal(result.firstWorkUnitId,unit);assert.equal(result.instructionsSha256,sha(instructions));assert.equal(result.roadmapVersion,2);assert.equal(result.currentWorkUnitCount,163);
 assert.equal(result.productBuilt,false);assert.equal(result.liveWorkerExecutionVerified,false);assert.equal(result.ownerAuthorizationForBuildRequired,true);assert.equal(result.uninspectedOtherChats,true);
 assert.equal(calls.length,7);assert.ok(calls.every(c=>c.params.project_id==='eq.'+project));
 assert.ok(calls.find(c=>c.table==='command_center_knowledge_claims').params.claim_id.startsWith('eq.'));
});
test('fails closed on source company identity mismatch',async()=>{
 const f=fixture();f.data.command_center_project_profiles[0].company_id='company:future:002';await assert.rejects(readCompanyBuildPreparation(project,f.read),/project_identity_mismatch/);
});
test('fails closed on nonverified roadmap',async()=>{
 const f=fixture();f.data.command_center_project_roadmaps[0].structure_verified=false;await assert.rejects(readCompanyBuildPreparation(project,f.read),/roadmap_not_verified/);
});
test('fails closed on missing first work unit',async()=>{
 const f=fixture({command_center_project_work_units:[]});await assert.rejects(readCompanyBuildPreparation(project,f.read),/next_unit_not_available/);
});
test('fails closed on tampered instruction hash',async()=>{
 const f=fixture();f.data.command_center_knowledge_claims[0].value_jsonb.instructions+='tampered';await assert.rejects(readCompanyBuildPreparation(project,f.read),/instruction_hash_mismatch/);
});
test('fails closed on incorrect reconciliation source authority',async()=>{
 const f=fixture();f.data.command_center_knowledge_claims[1].value_jsonb.source_authority_commit='f'.repeat(40);await assert.rejects(readCompanyBuildPreparation(project,f.read),/reconciliation_inconsistent/);
});
test('fails closed on missing source evidence',async()=>{
 const f=fixture();f.data.command_center_knowledge_claims[1].source_refs=[];await assert.rejects(readCompanyBuildPreparation(project,f.read),/source_references_inconsistent/);
});
test('fails closed on missing reconciliation claim',async()=>{
 const f=fixture();f.data.command_center_knowledge_claims.pop();await assert.rejects(readCompanyBuildPreparation(project,f.read),/reconciliation_missing/);
});
