import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {requestPcInference} from '../../supabase/functions/command-center-execution/pc-inference-adapter.mjs';
const c='00000000-0000-4000-8000-000000000001',o='00000000-0000-4000-8000-000000000002',w='737f5e7c-3884-4c61-81ac-634bdfc4828f',b='00000000-0000-4000-8000-000000000003';
function fixture(state='completed'){
 const text='19 plus 23 equals 42.',hash=createHash('sha256').update(text).digest('hex');
 const provider={provider_key:`provider:owner-pc:${w}`,enabled:true,cost:'free',health:'available',verification:'live_verified',capabilities:['brain.respond.read_only'],scopes:['owner-central-brain'],configuration:{worker_id:w,model_id:'qwen3:4b-instruct',gateway_ref:'supabase:functions:command-center-pc-worker',execution_mode:'local-ollama',payment_authorized:false,company_build_authorized:false}};
 const request={worker_id:w,request_id:o,conversation_id:c,owner_turn_id:o,project_id:null,state,brain_turn_id:b,model_id:'qwen3:4b-instruct',content_hash:hash};
 const turn={turn_id:b,conversation_id:c,project_id:null,role:'brain',redaction_state:'safe_text',safe_text:text,content_hash:hash,canonical_writes_authorized:false,evidence_refs:[`brain:response-to:${o}`,`brain:workstation-claim:${o}`,`brain:pc-worker:${w}`,'brain:model:qwen3:4b-instruct']};
 const calls=[];let queued=state!==null;
 const data={request,turn,provider,online:true};
 const readRows=async(table)=>{calls.push(table);if(table==='command_center_pc_inference_requests')return queued?[request]:[];if(table==='command_center_specialist_brains')return [];return [turn]};
 const rpc=async(name,payload)=>{calls.push({name,payload});if(name==='command_center_pc_owner_worker_status')return [{workerId:w,enabled:true,online:data.online,revoked:false}];queued=true;request.state='queued';return {request_id:o,state:'queued'}};
 return {data,calls,invoke:()=>requestPcInference({provider,conversationId:c,ownerTurnId:o,projectId:request.project_id,readRows,rpc})};
}
test('persisted hash and exact worker/model/turn links verify a completed response',async()=>{const f=fixture();const r=await f.invoke();assert.equal(r.inferenceVerified,true);assert.equal(r.brainTurnId,b);assert.equal(f.calls.some(x=>x.name),false)});
test('queue accepted is pending, never inference; retry reads the same request without enqueue',async()=>{const f=fixture(null);for(let i=0;i<2;i++){const r=await f.invoke();assert.equal(r.inferenceVerified,false);assert.equal(r.state,'queued')};assert.equal(f.calls.filter(x=>x.name==='command_center_pc_enqueue_inference').length,1)});
for(const state of ['failed','cancelled'])test(state+' request is terminal and cannot be silently requeued',async()=>{const f=fixture(state);await assert.rejects(f.invoke(),/local_inference_terminal/);assert.equal(f.calls.some(x=>x.name),false)});
test('offline worker cannot receive a new request',async()=>{const f=fixture(null);f.data.online=false;await assert.rejects(f.invoke(),/local_worker_offline/);assert.equal(f.calls.some(x=>x.name==='command_center_pc_enqueue_inference'),false)});
for(const [name,change] of [
 ['other worker',d=>d.request.worker_id=b],['paid provider',d=>d.provider.cost='paid'],['unknown cost',d=>d.provider.cost='unknown'],['cloud model',d=>d.provider.configuration.model_id='qwen:cloud'],['arbitrary gateway',d=>d.provider.configuration.gateway_ref='https://evil.invalid'],['disabled provider',d=>d.provider.enabled=false],['scope expansion',d=>d.provider.configuration.company_build_authorized=true],['other project request',d=>d.request.project_id='aro'],['different conversation',d=>d.request.conversation_id=b],['different output project',d=>d.turn.project_id='other'],['wrong output model',d=>d.request.model_id='other'],['hash tampering',d=>d.turn.safe_text='changed'],['missing exact response link',d=>d.turn.evidence_refs=[]],['canonical writes',d=>d.turn.canonical_writes_authorized=true]
])test(name+' is rejected',async()=>{const f=fixture();change(f.data);await assert.rejects(f.invoke());assert.equal(f.calls.some(x=>x.name==='command_center_pc_enqueue_inference'),false)});
test('a suspended specialist cannot use central provider permission to activate itself',async()=>{const f=fixture();f.data.request.project_id='project:company:future:001';await assert.rejects(f.invoke(),/specialist_activation_not_verified/)});
