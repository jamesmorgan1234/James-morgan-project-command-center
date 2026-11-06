import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createPcLocalOllama} from '../src/brain/pc-local-ollama.mjs';
import {createOwnerPcInferenceWorker} from '../src/brain/pc-owner-inference-worker.mjs';
import {createPcWorkstationRunner} from '../src/worker/pc-worker-supervisor.mjs';
import {validateActivationProbe,sha256Text,PC_ACTIVATION_CONTRACT} from '../src/brain/pc-activation-contract.mjs';
import {projectIdentity} from '../src/brain/pc-brain-readiness.mjs';
const digest='a'.repeat(64),uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const recovery=JSON.parse(readFileSync(new URL('../evidence/brain-activation/installed-worker-recovery-verification.json',import.meta.url),'utf8'));

test('recovered installed worker retains independently hashed original source bytes',()=>{
 const root=new URL('../evidence/brain-activation/recovered-worker-source/',import.meta.url);
 const manifest=readFileSync(new URL('SHA256_MANIFEST.txt',root),'utf8');
 const names=['clean-room/src/worker/pc-worker-cli.mjs','clean-room/src/worker/pc-worker-supervisor.mjs','clean-room/src/worker/pc-worker-transport.mjs','clean-room/src/brain/pc-local-ollama.mjs','clean-room/src/brain/pc-owner-inference-worker.mjs','supabase/functions/command-center-execution/brain-readiness.mjs','COMMAND_CENTER_PC_WINDOWS.ps1'];
 for(const path of names){const bytes=readFileSync(new URL(path,root));const hash=createHash('sha256').update(bytes).digest('hex');assert.ok(manifest.includes(hash),path);}
 assert.equal(recovery.sourceRecoveryBlockerResolved,true);
});
test('recovered client accepts all current specialist identities and new companies without fixed counts',()=>{
 const inventory=JSON.parse(readFileSync(new URL('../evidence/brain-activation/unified-portfolio.json',import.meta.url),'utf8'));
 for(const p of inventory.projects.filter(p=>p.brain_key))assert.equal(projectIdentity(p.project_id).companyId,p.company_id);
 for(const suffix of ['118','999','1000','100000'])assert.equal(projectIdentity('project:company:future:'+suffix).companyId,'company:future:'+suffix);
 for(const id of ['../aro','project:company:future:000','project:company:future:0001','project:company:future:1','ARO'])assert.throws(()=>projectIdentity(id));
});
function ollama(change={}){
 let registryCalls=0;const calls=[];
 const model=createPcLocalOllama({modelId:'qwen3:4b-instruct',fetcher:async(input,init)=>{
  calls.push({input,init});assert.ok(input.startsWith('http://127.0.0.1:11434/'));assert.equal(init.redirect,'error');
  if(input.endsWith('/api/tags'))return {ok:true,json:async()=>({models:[{name:'qwen3:4b-instruct',details:{family:'qwen'},digest:++registryCalls>1&&change.swap?'b'.repeat(64):change.missing?undefined:digest}]})};
  return {ok:true,json:async()=>({model:'qwen3:4b-instruct',done:true,message:{content:'actual adapter fixture'},...change.reply})};
 }});return {model,calls};
}
test('isolated Ollama adapter verifies real response shape and immutable digest before returning evidence',async()=>{
 const {model,calls}=ollama();const result=await model.generate({system:'read only',user:'diagnostic'});
 assert.equal(result.modelDigest,digest);assert.equal(result.verifiedInference,true);assert.equal(result.executionVerified,false);
 assert.deepEqual(calls.map(c=>new URL(c.input).pathname),['/api/tags','/api/chat','/api/tags']);
});
for(const [name,change] of [['missing digest',{missing:true}],['model changed',{swap:true}],['truncated',{reply:{done_reason:'length'}}],['empty response',{reply:{message:{content:''}}}],['incomplete',{reply:{done:false}}]])test('isolated adapter rejects '+name,async()=>{
 const {model}=ollama(change);await assert.rejects(model.generate({system:'read only',user:'diagnostic'}));assert.equal(model.readiness.actualInferenceVerified,false);
});
test('paid/cloud model route cannot be constructed',()=>{assert.throws(()=>createPcLocalOllama({modelId:'qwen:cloud'}));});
async function probe(){
 const projectId='aro',companyId='company:legacy:aro',system='Exact project-only context';
 const task={purpose:'activation_probe',requestId:uuid(1),conversationId:uuid(2),ownerTurnId:uuid(3),workerId:uuid(4),ownerId:uuid(5),projectId,
  ownerAuthenticated:true,ownerAuthorized:true,queueClaimVerified:true,action:'brain.respond.read_only',allowPaid:false,allowProtected:false,writesAuthorized:false,scheduleAuthorized:false,executionAuthorized:false,ownerText:'Explicit diagnostic',redactionState:'safe_text'};
 const scope={ownerId:task.ownerId,projectId,companyId,brainKey:'brain:company:legacy:aro:v1',brainVersion:2,verified:true,specialistEnabled:false,specialistLiveVerified:false,activationProbeVerified:true,system};
 const contract={contract:PC_ACTIVATION_CONTRACT,purpose:task.purpose,authorityRef:'evd_owner-command-center-brain-activation-20261105',requestId:task.requestId,conversationId:task.conversationId,ownerTurnId:task.ownerTurnId,ownerId:task.ownerId,workerId:task.workerId,
  companyBuildAuthorized:false,toolExecutionAuthorized:false,paidUsageAuthorized:false,issuedAt:new Date(Date.now()-1000).toISOString(),expiresAt:new Date(Date.now()+60000).toISOString(),systemHash:await sha256Text(system),routeSnapshot:{projectId,companyId,brainKey:scope.brainKey,brainVersion:2,providerKey:'provider:owner-pc:'+task.workerId,providerVersion:1,modelId:'qwen3:4b-instruct'}};
 const bind=async()=>{task.activationContractText=scope.activationContractText=JSON.stringify(contract);task.activationContractHash=scope.activationContractHash=await sha256Text(task.activationContractText)};
 await bind();return {task,scope,contract,bind};
}
for(const [name,mutate] of [
 ['owner changed',f=>f.task.ownerId=uuid(8)],['central scope',f=>f.task.projectId=null],['context changed',f=>f.scope.system='other'],['version changed',f=>f.scope.brainVersion=3],['permission broadened',f=>f.contract.companyBuildAuthorized=true],['expired',f=>f.contract.expiresAt='2000-01-01T00:00:00Z'],['another task',f=>f.task.requestId=uuid(8)],['worker changed',f=>f.task.workerId=uuid(8)],['unverified contract',f=>f.scope.activationProbeVerified=false]
])test('bounded diagnostic refuses '+name,async()=>{const f=await probe();mutate(f);await f.bind();await assert.rejects(validateActivationProbe(f.task,f.scope));});
test('ordinary chat cannot use a disabled specialist; explicit probe cannot claim job execution',async()=>{
 const f=await probe();let generated=0,persisted=0;
 const text='isolated diagnostic output';
 const worker=createOwnerPcInferenceWorker({claim:async()=>f.task,context:async()=>f.scope,model:{generate:async()=>{generated++;return {verifiedInference:true,text,modelId:'qwen3:4b-instruct',modelDigest:digest}}},
  persist:async data=>{persisted++;assert.equal(data.executionVerified,false);assert.equal(data.canonicalWritesAuthorized,false);return {requestId:f.task.requestId,projectId:f.task.projectId,brainTurnId:uuid(9)}},
  readBack:async()=>({requestId:f.task.requestId,projectId:f.task.projectId,brainTurnId:uuid(9),text,role:'brain',canonicalWritesAuthorized:false,evidenceVerified:true,activationContractHash:f.task.activationContractHash,modelDigest:digest,resultHash:await sha256Text(text)})});
 f.task.purpose='chat';await assert.rejects(worker.processOne(),/specialist_not_operational/);assert.equal(generated,0);
 f.task.purpose='activation_probe';const result=await worker.processOne();assert.equal(result.actualInferenceVerified,true);assert.equal(result.projectExecutionVerified,false);assert.equal(persisted,1);assert.equal(f.scope.specialistEnabled,false);
});
test('stop prevents another claim without touching original worker registration or scheduling',async()=>{
 let calls=0;const runner=createPcWorkstationRunner({workerToken:'ccpc_'+'0'.repeat(64),modelId:'qwen3:4b-instruct',fetcher:async()=>{calls++;throw Error('must not call')}});
 runner.stop();assert.equal((await runner.once()).state,'stopped');assert.equal(calls,0);
});

test('a model failure clears current inference health after an earlier successful response',async()=>{
 const change={};const {model}=ollama(change);await model.generate({system:'read only',user:'diagnostic'});
 assert.equal(model.readiness.actualInferenceVerified,true);
 change.reply={done:false};await assert.rejects(model.generate({system:'read only',user:'diagnostic'}));
 assert.equal(model.readiness.actualInferenceVerified,false);
});
