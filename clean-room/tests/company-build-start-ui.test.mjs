import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { preparedCompanyId, validateCompanyBuildStart } from '../dist/runtime/company-build-start.js';

const companyId='company:future:001';
const projectId='project:company:future:001';
const checkpointId='00000000-0000-4000-8000-000000000001';
const firstWorkUnit=projectId+':recovery:source-integrity';
const reconciliationClaim='company-reconciliation:'+companyId+':v1';
const source='roadmap/portfolio-future-architecture/companies/001_API_AS_A_BUSINESS_FACTORY.md#sha256='+'a'.repeat(64);
const instructions=('OWNER: James Morgan. Source authority and verified roadmap instructions; first task '+firstWorkUnit+'; '+reconciliationClaim+'; '+companyId+'. ').repeat(20);
const digest=s=>createHash('sha256').update(s).digest('hex');
function fixture(){
 return {
  project:{project_id:projectId,company_id:companyId,status:'active'},
  roadmap:{project_id:projectId,version:2,state:'current',structure_verified:true},
  checkpoint:{checkpoint_id:checkpointId,roadmap_version:2,exact_next_work_unit_id:firstWorkUnit,resume_state_hash:'b'.repeat(64)},
  start:{project_id:projectId,claim_id:'company-build-start:'+companyId+':v1',state:'current',truth_state:'known',source_refs:[source],
   value_jsonb:{project_id:projectId,company_id:companyId,roadmap_version:2,checkpoint_id:checkpointId,
    initial_work_unit:firstWorkUnit,resume_state_hash:'b'.repeat(64),reconciliation_claim_id:reconciliationClaim,
    source_checks_completed_in_packet:true,available_prior_records_reconciled:true,
    product_built:false,brain_operational:false,owner_approval_to_execute:false,
    instructions,instructions_sha256:digest(instructions)}},
  reconciliation:{project_id:projectId,claim_id:reconciliationClaim,state:'current',truth_state:'known',source_refs:[source],
   value_jsonb:{company_id:companyId,project_id:projectId,roadmap_version:2,
    initial_checkpoint_id:checkpointId,first_roadmap_unit:firstWorkUnit,
    source_authority_commit:'e5069834ecb8d44aeb687bd74a04d929dc515cbc',
    source_files_verified:true,available_canonical_records_reconciled:true,uninspected_other_chat_history:true,
    roadmap_graph_sha256:'c'.repeat(64),scope:'Scoped records only'}}
 };
}
test('exact prepared company catalog includes 116 and excludes 014',()=>{
 let valid=0;
 for(let i=1;i<=117;i++){
  const id=String(i).padStart(3,'0'),got=preparedCompanyId('project:company:future:'+id);
  assert.equal(got,i===14?null:'company:future:'+id);
  if(got)valid++;
 }
 assert.equal(valid,116);
 for(const s of ['project:company:future:000','project:company:future:118','project:company:future:1','project:company:past:001','project:company:future:014:extra','xproject:company:future:001'])assert.equal(preparedCompanyId(s),null);
});
test('reads correct packet, distinguishes source verification from product execution',async()=>{
 const receipt=await validateCompanyBuildStart(projectId,fixture());
 assert.equal(receipt.projectId,projectId);assert.equal(receipt.companyId,companyId);
 assert.equal(receipt.roadmapVersion,2);assert.equal(receipt.instructions,instructions);
 assert.equal(receipt.instructionsSha256,digest(instructions));assert.equal(receipt.firstWorkUnitId,firstWorkUnit);
 assert.equal(receipt.executionAuthorized,false);assert.equal(receipt.companyProductBuilt,false);
 assert.equal(receipt.otherChatHistoriesInspected,false);assert.equal(receipt.verifiedSourcePacket,true);
 assert.deepEqual(receipt.sourceRefs,[source]);
});
test('Company 014 is rejected before any record can be accepted',async()=>{
 await assert.rejects(validateCompanyBuildStart('project:company:future:014',fixture()),/outside this 116-company preparation scope/);
});
test('tampered packet text fails integrity validation',async()=>{
 const f=fixture();f.start.value_jsonb.instructions+=' changed';await assert.rejects(validateCompanyBuildStart(projectId,f),/integrity check/);
});
test('cross-company identity mismatch fails closed',async()=>{
 const f=fixture();f.project.company_id='company:future:002';await assert.rejects(validateCompanyBuildStart(projectId,f),/registration/);
});
test('unverified roadmap fails closed',async()=>{
 const f=fixture();f.roadmap.structure_verified=false;await assert.rejects(validateCompanyBuildStart(projectId,f),/roadmap/);
});
test('mismatched checkpoint version fails closed',async()=>{
 const f=fixture();f.checkpoint.roadmap_version=3;await assert.rejects(validateCompanyBuildStart(projectId,f),/checkpoint/);
});
test('unreconciled work fails closed',async()=>{
 const f=fixture();f.start.value_jsonb.available_prior_records_reconciled=false;await assert.rejects(validateCompanyBuildStart(projectId,f),/build-start record/);
});
test('false product completion or owner execution authorization is rejected',async()=>{
 for(const field of ['product_built','brain_operational','owner_approval_to_execute']){
  const f=fixture();f.start.value_jsonb[field]=true;
  await assert.rejects(validateCompanyBuildStart(projectId,f),/build-start record/);
 }
});
test('reconciliation must remain scoped and source-verified',async()=>{
 for(const [key,value] of [['source_files_verified',false],['uninspected_other_chat_history',false],['roadmap_graph_sha256','bad']]){
  const f=fixture();f.reconciliation.value_jsonb[key]=value;
  await assert.rejects(validateCompanyBuildStart(projectId,f),/reconciliation/);
 }
});
test('source references must be included in reconciliation',async()=>{
 const f=fixture();f.reconciliation.source_refs=[];await assert.rejects(validateCompanyBuildStart(projectId,f),/source reference/);
});
test('no cross-project or Company 014 source references can enter the packet',async()=>{
 const f=fixture();f.start.source_refs.push('roadmap/portfolio-future-architecture/companies/014_OUTSIDE.md#sha256='+'f'.repeat(64));
 f.reconciliation.source_refs=f.start.source_refs;
 await assert.rejects(validateCompanyBuildStart(projectId,f),/source reference/);
});
test('missing canonical source claim is rejected',async()=>{
 const f=fixture();f.start.claim_id='unrelated';await assert.rejects(validateCompanyBuildStart(projectId,f),/build-start claim/);
});
