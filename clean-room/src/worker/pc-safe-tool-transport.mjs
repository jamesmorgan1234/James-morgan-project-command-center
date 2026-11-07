/** Existing paired PC token, isolated safe-tool queue. No new worker/service. */
const URL='https://gmlsucpwliegwlxymjvp.supabase.co/functions/v1/command-center-safe-tools';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const ensure=(ok,code)=>{if(!ok)throw Error(code)};
export function createPcSafeToolTransport({workerToken,fetcher=fetch}={}){
 ensure(/^ccpc_[a-f0-9]{64}$/.test(workerToken??''),'paired_pc_worker_token_required');
 const active=new Map();
 async function post(action,data={}){
  const response=await fetcher(URL,{method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000),
    headers:{'content-type':'application/json','x-command-center-worker-token':workerToken},
    body:JSON.stringify({action:'worker-'+action,clientContract:'cc-pc-safe-tools-v1',
      allowPaid:false,allowProtected:false,companyBuildAuthorized:false,...data})});
  ensure(response?.ok,'safe_tool_transport_unavailable');
  const value=await response.json();
  ensure(value&&Object.hasOwn(value,'result'),'safe_tool_transport_receipt_invalid');
  return value.result;
 }
 function claim(id){ensure(active.has(id),'safe_tool_not_claimed');return active.get(id)}
 function scoped(saved,lease){
  ensure(UUID.test(saved?.jobId??'')&&lease?.jobId===saved.jobId &&
    lease?.ownerId===saved.ownerId&&lease?.workerId===saved.workerId&&lease?.projectId===saved.projectId&&
    lease?.companyId===saved.companyId&&lease?.actionKey===saved.actionKey&&
    Number.isSafeInteger(lease?.fencingToken)&&lease.fencingToken>=1&&lease.generation===1 &&
    saved?.toolVersion==='safe-readonly-v1'&&
    ['code.js_syntax_check','research.public_docs_read'].includes(saved.actionKey)&&
    typeof saved.inputText==='string'&&saved.inputText.length<=16000&&
    /^[a-f0-9]{64}$/.test(saved.inputHash??'')&&
    UUID.test(saved.ownerId??'')&&UUID.test(saved.workerId??'')&&
    typeof saved.projectId==='string'&&typeof saved.companyId==='string'&&typeof saved.brainKey==='string'&&
    Number.isSafeInteger(saved.brainVersion)&&saved.brainVersion>=1 &&
    Date.parse(lease.expiresAt)>Date.now()&&Date.parse(lease.expiresAt)<Date.now()+190000,
    'safe_tool_claim_invalid');
 }
 return Object.freeze({
  async next(){
   ensure(active.size===0,'one_safe_tool_at_a_time');
   const value=await post('next');if(value===null)return null;
   scoped(value.saved,value.lease);active.set(value.saved.jobId,structuredClone(value));return structuredClone(value);
  },
  async current(lease){
   const v=claim(lease.jobId);ensure(JSON.stringify(v.lease)===JSON.stringify(lease),'safe_tool_fence_changed');
   const result=await post('current',{jobId:lease.jobId,fencingToken:lease.fencingToken});
   ensure(result?.current===true,'safe_tool_lease_no_longer_current');
  },
  async commit(lease,result){
   const v=claim(lease.jobId);ensure(JSON.stringify(v.lease)===JSON.stringify(lease),'safe_tool_fence_changed');
   const receipt=await post('commit',{jobId:lease.jobId,fencingToken:lease.fencingToken,result});
   ensure(receipt?.committed===true,'safe_tool_commit_not_accepted');
  },
  async readback(lease){
   const v=claim(lease.jobId);ensure(JSON.stringify(v.lease)===JSON.stringify(lease),'safe_tool_fence_changed');
   return post('readback',{jobId:lease.jobId,fencingToken:lease.fencingToken});
  },
  abandon(id){active.delete(id)}
 });
}
