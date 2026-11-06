import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessSpecialistActivation} from '../dist/brain/activation.js';
const snapshot=JSON.parse(readFileSync(new URL('../evidence/brain-activation/live-registry-snapshot.json',import.meta.url)));
const checks=Object.fromEntries(['identity','context','permissions','tools','isolation','stop','pause','checkpoint','recovery','authorization','inference','persistence','health'].map(k=>[k,true]));
const fixture=()=>{
 const brain={revalidatedAt:'2026-11-06T03:30:00Z',revalidateAfter:'2026-11-06T04:30:00Z',evaluationEvidenceIds:['evidence:evaluation'],provenanceEvidenceIds:['evidence:source'],rollbackEvidenceId:'evidence:rollback',key:'brain:company:future:001:v1',version:2,controlPlane:'command_center',supportedProjectIds:['project:company:future:001'],supportedCompanyIds:['company:future:001'],enabled:true,lifecycle:'active',health:'healthy',verificationState:'verified',costClass:'free',capabilityKeys:['brain.respond.read_only'],permissionKeys:['project:project:company:future:001:context.read','project:project:company:future:001:inference.read_only'],toolKeys:['tool:context:001'],protectedActionBoundaries:['no-spend','no-live-external-action','no-publication','no-cross-company-data'],providerKeys:['provider:pc'],modelAssignments:[{providerKey:'provider:pc',modelId:'qwen3:4b-instruct',versionRef:'model:v1',routeKey:'ai-route:001'}]};
 const route={key:'ai-route:001',providerKey:'provider:pc',modelId:'qwen3:4b-instruct',versionRef:'model:v1',enabled:true,cost:'free',health:'available',quotaAvailable:true,privacy:'local',executionMode:'local',capabilities:['brain.respond.read_only'],brainKeys:[brain.key]};
 const evidence={brainKey:brain.key,brainVersion:2,projectId:brain.supportedProjectIds[0],companyId:brain.supportedCompanyIds[0],routeKey:route.key,modelId:route.modelId,providerKey:route.providerKey,requestId:'request:1',outputRef:'evidence:1',outputHash:'a'.repeat(64),recomputedHash:'a'.repeat(64),observedAt:'2026-11-06T03:30:00Z',mode:'live',checks:{...checks}};
 return {allowedMemoryKinds:['source','evidence','decision','checkpoint'],brain,projectId:brain.supportedProjectIds[0],companyId:brain.supportedCompanyIds[0],routes:[route],permittedToolKeys:brain.toolKeys,evidence:[evidence],now:'2026-11-06T03:31:00Z',maximumEvidenceAgeMs:180000};
};
test('complete synthetic evidence passes the pure assessor but causes no activation mutation',()=>{
 const request=fixture(); const before=JSON.stringify(request); const result=assessSpecialistActivation(request);
 assert.equal(result.operational,true);assert.deepEqual(result.verifiedProviderKeys,['provider:pc']);assert.equal(JSON.stringify(request),before);
});
for(const field of Object.keys(checks))test('missing live '+field+' check blocks readiness',()=>{const r=fixture();r.evidence[0].checks[field]=false;assert.equal(assessSpecialistActivation(r).operational,false)});
for(const [label,change] of [
 ['expired revalidation',r=>r.brain.revalidateAfter='2026-11-05T00:00:00Z'],['missing rollback evidence',r=>r.brain.rollbackEvidenceId=null],['global memory scope',r=>r.allowedMemoryKinds=['*']],['isolated tests',r=>r.evidence[0].mode='isolated'],['other project output',r=>r.evidence[0].projectId='other'],['other company output',r=>r.evidence[0].companyId='other'],['old specialist version',r=>r.evidence[0].brainVersion=1],['forged digest',r=>r.evidence[0].recomputedHash='b'.repeat(64)],['future evidence',r=>r.evidence[0].observedAt='2026-11-07T03:30:00Z'],['stale evidence',r=>r.evidence[0].observedAt='2026-11-05T03:30:00Z'],['unknown cost',r=>r.routes[0].cost='unknown'],['paid route',r=>r.routes[0].cost='paid'],['unknown quota',r=>r.routes[0].quotaAvailable='unknown'],['wrong model',r=>r.routes[0].modelId='other'],['wrong route version',r=>r.routes[0].versionRef='other'],['wrong provider',r=>r.routes[0].providerKey='other'],['unhealthy provider',r=>r.routes[0].health='degraded'],['unscoped model',r=>r.routes[0].brainKeys=[]],['global permission',r=>r.brain.permissionKeys=['*']],['unapproved tool',r=>r.permittedToolKeys=[]],['suspended specialist',r=>r.brain.lifecycle='suspended'],['self authority',r=>r.brain.controlPlane='specialist']
])test(label+' cannot qualify a specialist',()=>{const r=fixture();change(r);const out=assessSpecialistActivation(r);assert.equal(out.operational,false);assert.deepEqual(out.verifiedToolKeys,[])});
test('live registry recovery has 128 distinct identities, exact company mappings, no operational specialists',()=>{
 assert.equal(snapshot.brains.length,128);assert.equal(new Set(snapshot.brains.map(b=>b.key)).size,128);
 for(const b of snapshot.brains){
  assert.equal(b.control,'command_center');assert.deepEqual(b.supported_project_ids,[b.project_id]);assert.deepEqual(b.supported_company_ids,[b.company_id]);
  const r=fixture();Object.assign(r,{projectId:b.project_id,companyId:b.company_id,routes:[],evidence:[],permittedToolKeys:[]});
  Object.assign(r.brain,{key:b.key,enabled:false,lifecycle:b.lifecycle,health:b.health,verificationState:b.verification,supportedProjectIds:b.supported_project_ids,supportedCompanyIds:b.supported_company_ids,permissionKeys:b.permissions,toolKeys:b.tools,modelAssignments:b.models,providerKeys:b.providers});
  assert.equal(assessSpecialistActivation(r).operational,false,b.key);
 }
});
