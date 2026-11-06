/** Outbound COMMAND CENTER workstation transport. No Supabase service role or browser tokens. */
export class PcTransportError extends Error {constructor(code,status=0){super(code);this.name='PcTransportError';this.status=status;}}
const CC='https://gmlsucpwliegwlxymjvp.supabase.co';
const TOKEN=/^ccpc_[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const ok=(condition,code)=>{if(!condition)throw new PcTransportError(code);};
export function createPcWorkerTransport({supabaseUrl=CC,workerToken,fetcher=fetch,timeoutMs=20000}={}){
 const url=new URL(supabaseUrl);
 ok(url.origin===CC && url.pathname==='/' && !url.search && !url.hash,'unapproved_supabase_destination');
 ok(TOKEN.test(workerToken??''),'worker_token_not_configured');
 ok(typeof fetcher==='function','transport_fetch_missing');
 ok(Number.isSafeInteger(timeoutMs)&&timeoutMs>=1000&&timeoutMs<=60000,'timeout_invalid');
 const pending=new Map();
 async function post(action,body){
  const response=await fetcher(`${CC}/functions/v1/command-center-pc-worker/${action}`,{
   method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(timeoutMs),
   headers:{'content-type':'application/json','x-command-center-worker-token':workerToken},
   body:JSON.stringify({allowPaid:false,allowProtected:false,executionAuthorized:false,...body})});
  if(!response?.ok)throw new PcTransportError(`remote_${action}_failed`,response?.status??0);
  const result=await response.json();
  ok(result&&typeof result==='object'&&!Array.isArray(result),'worker_response_invalid');
  return result;
 }
 const routeFor=(id)=>{const p=pending.get(id);ok(p!==undefined,'claim_not_cached');return p;};
 return Object.freeze({
  endpoint:CC,
  async claim(){
   ok(pending.size===0,'one_claim_at_a_time');
   const result=await post('claim',{});
   if(result.task===null)return null;
   const t=result.task;
   ok(t&&UUID.test(t.requestId??'')&&Number.isSafeInteger(t.fencingToken)&&t.fencingToken>=1&&
      result.context?.projectId===(t.projectId??null)&&result.context?.verified===true,'claim_context_invalid');
   pending.set(t.requestId,{task:t,context:result.context});
   return t;
  },
  async context({projectId,requestId}){
   const cached=routeFor(requestId);
   ok(cached.task.projectId===(projectId??null),'project_scope_changed');
   return cached.context;
  },
  async heartbeat(requestId){
   const c=routeFor(requestId);
   const r=await post('heartbeat',{requestId,fencingToken:c.task.fencingToken});
   ok(r.renewed===true,'lease_renewal_refused');
   return true;
  },
  async persist({requestId,projectId,text,modelId,inferenceVerified,executionVerified,canonicalWritesAuthorized}){
   const c=routeFor(requestId);
   ok(c.task.projectId===(projectId??null)&&inferenceVerified===true&&executionVerified===false&&
    canonicalWritesAuthorized===false,'response_scope_or_evidence_invalid');
   const result=await post('complete',{requestId,fencingToken:c.task.fencingToken,text,modelId});
   ok(result.requestId===requestId&&result.projectId===(projectId??null)&&UUID.test(result.brainTurnId??''),'commit_receipt_invalid');
   return result;
  },
  async readBack({requestId,projectId,brainTurnId}){
   const c=routeFor(requestId);
   ok(c.task.projectId===(projectId??null),'readback_scope_changed');
   const result=await post('readback',{requestId,fencingToken:c.task.fencingToken});
   ok(result.requestId===requestId&&result.brainTurnId===brainTurnId&&result.projectId===(projectId??null),'readback_receipt_mismatch');
   pending.delete(requestId);
   return result;
  },
  abandonClaim(requestId){
   // Does not claim completion or release the server's fenced lease.
   pending.delete(requestId);
  }
 });
}
