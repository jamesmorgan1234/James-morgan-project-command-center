import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createBrainToolRuntime} from '../dist/brain/tool-runtime.js';

const hash=async s=>createHash('sha256').update(s).digest('hex');
function fixture(){
 const now=new Date().toISOString();
 const tool={key:'project-files',ownerId:'owner',provider:'local',versionRef:'files@1',actionKeys:['file.write'],actionEffects:{'file.write':'local_write'},environment:'local',available:true,cost:'free',authenticationRequired:true,authenticated:true,projectIds:['project:001'],companyIds:['company:001'],accountRefs:['workspace:001'],evidenceRef:'local:handler-check',verifiedAt:now};
 const action={ownerId:'owner',projectId:'project:001',companyId:'company:001',toolKey:tool.key,actionKey:'file.write',effect:'local_write',accountRef:'workspace:001',resourceProjectId:'project:001',resourceCompanyId:'company:001',now,maximumHealthAgeMs:180000,authority:{issuer:'command_center',ownerId:'owner',projectId:'project:001',companyId:'company:001',actionKeys:['file.write'],accountRefs:['workspace:001'],reference:'owner:saved-command',expiresAt:new Date(Date.now()+60000).toISOString(),protectedActionAuthorized:false}};
 const saved={invocationId:'invocation:1',taskId:'task:1',workerId:'worker:1',inputText:'verified content',action};
 const lease={invocationId:saved.invocationId,taskId:saved.taskId,workerId:saved.workerId,ownerId:action.ownerId,projectId:action.projectId,companyId:action.companyId,generation:1,fencingToken:1,expiresAt:new Date(Date.now()+30000).toISOString()};
 let state='new',result,calls=0,checks=0;
 const adapters={resolve:async()=>saved,catalog:async()=>[tool],now:()=>new Date().toISOString(),sha256:hash,
  begin:async()=>{if(state==='completed')return{state,result};if(state!=='new')return{state:'uncertain'};state='started';return{state:'fresh',lease}},
  assertCurrent:async()=>{checks++},commit:async r=>{result=structuredClone(r);state='completed'},readBack:async()=>structuredClone(result)};
 const handler={toolKey:tool.key,actionKey:'file.write',versionRef:tool.versionRef,invoke:async({inputText})=>{calls++;return inputText}};
 return{tool,action,saved,lease,adapters,handler,get calls(){return calls},get checks(){return checks},get state(){return state},get result(){return result},runtime(){return createBrainToolRuntime(adapters,[handler])}};
}

test('invokes an actual file handler, hashes persisted output, then replays without repeating the effect',async()=>{
 const f=fixture(),dir=await mkdtemp(join(tmpdir(),'cc-tool-'));let effects=0;
 try{
  f.handler.invoke=async({inputText,action,signal})=>{assert.equal(action.accountRef,'workspace:001');signal.throwIfAborted();effects++;await writeFile(join(dir,'result.txt'),inputText,{flag:'wx'});return readFile(join(dir,'result.txt'),'utf8')};
  const runtime=f.runtime(),first=await runtime.execute(f.saved.invocationId);
  assert.equal(await readFile(join(dir,'result.txt'),'utf8'),'verified content');
  assert.equal(first.outputHash,await hash('verified content'));assert.equal(first.lease.fencingToken,1);
  assert.deepEqual(await runtime.execute(f.saved.invocationId),first);assert.equal(effects,1);assert.equal(f.checks,2);
 }finally{await rm(dir,{recursive:true,force:true})}
});
for(const[label,change,error]of[
 ['cross company',f=>f.action.resourceCompanyId='company:002','cross_company_or_project_resource'],
 ['wrong account',f=>f.action.accountRef='workspace:002','exact_account_binding_required'],
 ['unapproved action',f=>f.action.authority.actionKeys=[],'specific_action_not_authorized'],
 ['unknown cost',f=>f.tool.cost='unknown','zero_cost_route_required'],
 ['paid route',f=>f.tool.cost='paid','zero_cost_route_required'],
 ['expired authorization',f=>f.action.authority.expiresAt='2000-01-01T00:00:00Z','current_action_authority_required'],
 ['stale tool proof',f=>f.tool.verifiedAt='2000-01-01T00:00:00Z','fresh_tool_health_evidence_required'],
 ['missing login',f=>f.tool.authenticated=false,'tool_authentication_required'],
 ['forged effect',f=>f.action.effect='public_read','action_effect_contract_mismatch'],
 ['changed implementation',f=>f.handler.versionRef='files@2','callable_tool_handler_missing_or_version_mismatch'],
 ['wrong fence project',f=>f.lease.projectId='project:002','tool_lease_identity_mismatch'],
 ['expired lease',f=>f.lease.expiresAt='2000-01-01T00:00:00Z','tool_lease_expired'],
 ['mismatched saved ID',f=>f.saved.invocationId='invocation:other','saved_invocation_invalid']
])test(label+' cannot invoke the handler',async()=>{const f=fixture();change(f);await assert.rejects(f.runtime().execute('invocation:1'),new RegExp(error));assert.equal(f.calls,0)});

test('a descriptor without a real handler is not an executable tool',async()=>{const f=fixture();await assert.rejects(createBrainToolRuntime(f.adapters,[]).execute('invocation:1'),/callable_tool_handler_missing/);assert.equal(f.state,'new')});
test('duplicate handler identities fail at binding',()=>{const f=fixture();assert.throws(()=>createBrainToolRuntime(f.adapters,[f.handler,f.handler]),/ambiguous_tool_handler/)});
test('Stop or fence loss before invocation prevents the effect',async()=>{const f=fixture();f.adapters.assertCurrent=async()=>{throw Error('stopped_or_stale_fence')};await assert.rejects(f.runtime().execute('invocation:1'),/stopped_or_stale/);assert.equal(f.calls,0)});
test('authority expiring while claim is checked is revalidated before invoking',async()=>{const f=fixture();let now=Date.now();f.adapters.now=()=>new Date(now).toISOString();f.adapters.assertCurrent=async()=>{now+=120000};await assert.rejects(f.runtime().execute('invocation:1'),/expired/);assert.equal(f.calls,0)});
test('tool revocation while claiming is revalidated before invoking',async()=>{const f=fixture();f.adapters.assertCurrent=async()=>{f.tool.available=false};await assert.rejects(f.runtime().execute('invocation:1'),/tool_runtime_unavailable/);assert.equal(f.calls,0)});
test('Stop after an effect prevents completion and retry requires reconciliation',async()=>{const f=fixture();let checks=0;f.adapters.assertCurrent=async()=>{if(++checks>1)throw Error('stop_requested')};const runtime=f.runtime();await assert.rejects(runtime.execute('invocation:1'),/stop_requested/);assert.equal(f.calls,1);assert.equal(f.state,'started');await assert.rejects(runtime.execute('invocation:1'),/prior_tool_effect_requires_reconciliation/);assert.equal(f.calls,1)});
test('lost commit response cannot cause an action to run twice',async()=>{const f=fixture(),commit=f.adapters.commit;f.adapters.commit=async r=>{await commit(r);throw Error('connection_lost_after_commit')};const runtime=f.runtime();await assert.rejects(runtime.execute('invocation:1'),/connection_lost/);assert.equal(f.calls,1);assert.equal((await runtime.execute('invocation:1')).outputText,'verified content');assert.equal(f.calls,1)});
test('failed handler is left uncertain and never blindly retried',async()=>{const f=fixture();let effects=0;f.handler.invoke=async()=>{effects++;throw Error('effect_outcome_unknown')};const runtime=f.runtime();await assert.rejects(runtime.execute('invocation:1'),/effect_outcome_unknown/);await assert.rejects(runtime.execute('invocation:1'),/requires_reconciliation/);assert.equal(effects,1)});
test('corrupted stored output cannot be reported completed',async()=>{const f=fixture(),read=f.adapters.readBack;f.adapters.readBack=async id=>({...await read(id),outputText:'corrupted'});await assert.rejects(f.runtime().execute('invocation:1'),/readback_mismatch/);assert.equal(f.calls,1)});
test('same output with a different saved fence is not the committed receipt',async()=>{const f=fixture(),read=f.adapters.readBack;f.adapters.readBack=async id=>{const r=await read(id);r.lease.fencingToken++;return r};await assert.rejects(f.runtime().execute('invocation:1'),/changed_after_commit/)});
test('duplicate concurrent dispatch cannot enter the tool twice',async()=>{const f=fixture();let release;const hold=new Promise(r=>release=r);f.handler.invoke=async()=>{await hold;return 'done'};const runtime=f.runtime(),first=runtime.execute('invocation:1');await assert.rejects(runtime.execute('invocation:1'),/busy/);release();await first});
test('Stop during a running handler aborts it and does not commit',async()=>{const f=fixture();let checks=0,aborted=false;f.adapters.assertCurrent=async()=>{if(++checks>1)throw Error('stop_requested')};f.handler.invoke=async({signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason)},{once:true}));await assert.rejects(f.runtime().execute('invocation:1'),/cancelled|revoked/);assert.equal(aborted,true);assert.equal(f.state,'started')});
