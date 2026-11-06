/** Outbound authenticated artifact-job transport; never accepts model authority. */
const CC='https://gmlsucpwliegwlxymjvp.supabase.co';
const ensure=(ok,code)=>{if(!ok)throw Error(code)};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function createPcToolJobTransport({workerToken,fetcher=fetch}){
 ensure(/^ccpc_[a-f0-9]{64}$/.test(workerToken??''),'paired_worker_token_required');
 const active=new Map();
 async function post(action,body){
  const response=await fetcher(CC+'/functions/v1/command-center-pc-worker/tool-'+action,{method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000),
   headers:{'content-type':'application/json','x-command-center-worker-token':workerToken},
   body:JSON.stringify({...body,clientContract:'cc-pc-tools-v1',executionAuthorized:true,allowPaid:false,allowProtected:false})});
  ensure(response?.ok,'tool_job_transport_failed');const value=await response.json();
  ensure(value&&Object.hasOwn(value,'result'),'tool_job_receipt_invalid');return value.result;
 }
 const current=id=>{const entry=active.get(id);ensure(entry,'tool_job_not_claimed');return entry};
 const identity=l=>({invocationId:l.invocationId,fencingToken:l.fencingToken});
 return Object.freeze({
  async next(){
   ensure(active.size===0,'one_tool_job_at_a_time');const result=await post('next',{});if(result===null)return null;
   const s=result.saved,l=result.lease;
   ensure(s&&l&&UUID.test(s.invocationId??'')&&l.invocationId===s.invocationId&&l.taskId===s.taskId&&l.workerId===s.workerId&&
    l.ownerId===s.action?.ownerId&&l.projectId===s.action?.projectId&&l.companyId===s.action?.companyId&&
    Number.isSafeInteger(l.fencingToken)&&l.fencingToken>=1&&l.generation===1&&
    s.action?.toolKey==='owner-pc-artifacts'&&['artifact.write','artifact.read'].includes(s.action?.actionKey)&&
    ['owner:explicit-artifact-job:'+s.invocationId,'command-center:activation-artifact-check:'+s.invocationId].includes(s.action?.authority?.reference),'tool_job_claim_identity_invalid');
   if(s.action.authority.reference.startsWith('command-center:activation-artifact-check:')){
    let input;try{input=JSON.parse(s.inputText)}catch{throw Error('activation_artifact_input_invalid')}
    ensure(s.action.actionKey==='artifact.write'&&Object.keys(input).length===2&&
     input.name==='activation-check-'+s.invocationId+'.txt'&&input.content==='COMMAND_CENTER_ACTIVATION_CHECK:'+s.action.projectId+':'+s.invocationId,
     'activation_artifact_scope_invalid');
   }
   active.set(s.invocationId,structuredClone(result));return structuredClone(result);
  },
  async resolve(id){return structuredClone(current(id).saved)},
  async createLease(saved){const c=current(saved.invocationId);ensure(JSON.stringify(c.saved)===JSON.stringify(saved),'tool_saved_job_changed');return structuredClone(c.lease)},
  async assertCurrent(lease){const c=current(lease.invocationId);ensure(JSON.stringify(c.lease)===JSON.stringify(lease),'tool_job_fence_changed');ensure((await post('current',identity(lease)))?.current===true,'tool_job_no_longer_current')},
  async commitCanonical(result){const c=current(result.lease.invocationId);ensure(JSON.stringify(c.lease)===JSON.stringify(result.lease),'tool_job_fence_changed');await post('commit',{...identity(result.lease),result})},
  async readCanonical(id){const c=current(id);const r=await post('readback',identity(c.lease));ensure(r?.receipt,'tool_canonical_receipt_missing');return r.receipt},
  abandon(id){active.delete(id)}
 });
}
