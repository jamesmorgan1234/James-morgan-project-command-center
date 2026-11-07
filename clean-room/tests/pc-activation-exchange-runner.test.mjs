import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createPcActivationExchangeRunner,validateActivationExchangeClaim} from '../src/worker/pc-activation-exchange-runner.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
const exchangeId='d9b63121-41f0-4510-a181-1cd2fd638bef';
const nonce='b5e52ca0-3c63-4560-9702-2a52c526d983';
const ownerId='a207eb41-2cab-4797-8dfa-864ee69ee8e2';
const workerId='737f5e7c-3884-4c61-81ac-634bdfc4828f';
const projectId='project:company:future:014';
const companyId='company:future:014';
const targetBrainKey='brain:company:future:014:v1';
const modelId='qwen3:4b-instruct';
const modelDigest='0edcdef34593eac1aa2be9c7d06c432dcf81945adca5eca2f27662c18f168ba0';
const clock=Date.parse('2026-11-07T01:10:00Z');
const inputText=JSON.stringify({exchangeId,projectId,companyId,targetBrainKey,nonce});
const base={saved:{exchangeId,workerId,ownerId,projectId,companyId,targetBrainKey,brainVersion:2,
  parentBrainKey:'command_center',controlPlane:'command_center',purpose:'activation_exchange',
  authorityRef:'evd_owner-command-center-brain-activation-20261105',nonce,modelId,
  expectedModelDigest:modelDigest,inputHash:sha(inputText),allowPaid:false,allowProtected:false,
  companyBuildAuthorized:false,companyExecutionAuthorized:false,generalToolsAuthorized:false},
 lease:{exchangeId,workerId,ownerId,projectId,companyId,targetBrainKey,brainVersion:2,
  generation:1,fencingToken:1,expiresAt:new Date(clock+90_000).toISOString()}};
const expected={exchangeId,projectId,companyId,targetBrainKey,nonce,accepted:true,
 companyBuildStarted:false,paidUsageAuthorized:false};
function mock({claim=base,text=JSON.stringify(expected),digest=modelDigest,mutateReadback=x=>x}={}){
 const calls=[];let result;
 const transport={async next(){calls.push('next');return claim},async assertCurrent(){calls.push('current')},
 async commit(lease,receipt){calls.push('commit');result=receipt},
 async readback(){calls.push('readback');return mutateReadback({...result,commitId:'e25c3960-d76f-4510-a1c7-790977f0ba7e',canonicalCommitVerified:true})},
 abandon(id){calls.push('abandon:'+id)}};
 const model={async generate(args){calls.push('generate');assert.equal(args.json,true);
 return{verifiedInference:true,modelId,modelDigest:digest,text}}};
 return {runner:createPcActivationExchangeRunner({transport,model,workerId,modelId,now:()=>clock}),calls};
}
test('real model output and exact canonical readback produce one exchange proof',async()=>{
 const {runner,calls}=mock(); const result=await runner.once();
 assert.equal(result.state,'verified_activation_exchange');
 assert.equal(result.canonicalCommitVerified,true);
 assert.equal(result.companyBuildExecuted,false);
 assert.equal(result.generalToolsVerified,false);
 assert.deepEqual(calls,['next','current','generate','current','commit','readback','abandon:'+exchangeId]);
});
test('stopped and idle runner cannot imply activity',async()=>{
 const {runner}=mock();runner.stop();assert.deepEqual(await runner.once(),{state:'stopped',executed:false});
 const transport={next:async()=>null,assertCurrent:async()=>{},commit:async()=>{},readback:async()=>{},abandon:()=>{}};
 assert.deepEqual(await createPcActivationExchangeRunner({transport,model:{generate:async()=>{throw Error('should_not_run')}},workerId,modelId}).once(),{state:'idle',executed:false});
});
test('identity, authorization, version and no-spend violations fail closed before model runs',async()=>{
 const invalid=[
  {saved:{...base.saved,parentBrainKey:'brain:company:future:001:v1'}},
  {saved:{...base.saved,controlPlane:'other'}},
  {saved:{...base.saved,companyId:'company:future:013'}},
  {saved:{...base.saved,targetBrainKey:'brain:company:future:013:v1'}},
  {saved:{...base.saved,projectId:'project:company:future:013'}},
  {saved:{...base.saved,allowPaid:true}},
  {saved:{...base.saved,allowProtected:true}},
  {saved:{...base.saved,companyBuildAuthorized:true}},
  {saved:{...base.saved,companyExecutionAuthorized:true}},
  {saved:{...base.saved,generalToolsAuthorized:true}},
  {saved:{...base.saved,modelId:'qwen3:cloud'}},
  {saved:{...base.saved,expectedModelDigest:'foo'}},
  {saved:{...base.saved,brainVersion:3}},
  {saved:{...base.saved,inputHash:'0'.repeat(64)}},
  {saved:{...base.saved,ownerId:'239c3c40-b9d9-42f4-b807-f2172c7dbc8b'}},
  {lease:{...base.lease,workerId:'239c3c40-b9d9-42f4-b807-f2172c7dbc8b'}},
  {lease:{...base.lease,expiresAt:new Date(clock-1000).toISOString()}},
  {lease:{...base.lease,expiresAt:new Date(clock+3600_000).toISOString()}},
  {lease:{...base.lease,fencingToken:0}}
 ];
 for(const mutation of invalid){
   const claim={...base,...mutation};
   assert.throws(()=>validateActivationExchangeClaim(claim,{workerId,modelId,now:clock}),undefined,JSON.stringify(mutation));
   const {runner,calls}=mock({claim});await assert.rejects(()=>runner.once());assert.ok(!calls.includes('generate'));
 }
});
test('model output mismatch or unverified digest cannot produce canonical commit',async()=>{
 const cases=[{text:'not json'},{text:JSON.stringify({...expected,accepted:false})},
  {text:JSON.stringify({...expected,paidUsageAuthorized:true})},
  {text:JSON.stringify({...expected,extra:'extra'})},
  {text:JSON.stringify({...expected,targetBrainKey:'brain:company:future:013:v1'})},
  {digest:'a'.repeat(64)}];
 for(const c of cases){const {runner,calls}=mock(c);await assert.rejects(()=>runner.once());assert.ok(!calls.includes('commit'));}
});
test('canonical readback mismatch never counts as complete',async()=>{
 const cases=[x=>({...x,outputHash:'f'.repeat(64)}),x=>({...x,canonicalCommitVerified:false}),
  x=>({...x,commitId:'bad'}),x=>({...x,projectId:'project:company:future:013'}),
  x=>({...x,generalToolsExecuted:true}),x=>({...x,outputText:'fabricated'})];
 for(const mutateReadback of cases){const {runner}=mock({mutateReadback});await assert.rejects(()=>runner.once(),/exchange_canonical_readback_mismatch/)}
});
