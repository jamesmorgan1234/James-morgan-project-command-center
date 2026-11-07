/** One-at-a-time read-only capability lane under the EXISTING Windows worker. */
import {createHash} from 'node:crypto';
import {projectIdentity} from '../brain/pc-brain-readiness.mjs';
import {createPcSafeToolTransport} from './pc-safe-tool-transport.mjs';
import {executePcSafeReadOnly} from './pc-safe-readonly-tools.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
const ensure=(ok,code)=>{if(!ok)throw Error(code)};
const WORKER_ID='737f5e7c-3884-4c61-81ac-634bdfc4828f';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const canonical=value=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?'['+value.map(canonical).join(',')+']':'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
export function createPcSafeToolRunner({workerToken,fetcher=fetch,transport=null,execute=executePcSafeReadOnly}={}){
 const channel=transport??createPcSafeToolTransport({workerToken,fetcher});
 ensure(typeof execute==='function','safe_tool_execute_missing');
 let busy=false,stopping=false;
 return Object.freeze({
  stop(){stopping=true},
  async once(){
   if(stopping)return {state:'stopped',executed:false};
   if(busy)throw Error('safe_tool_runner_busy');
   busy=true;let id=null;
   try{
    const claim=await channel.next();if(claim===null)return {state:'idle',executed:false};
    const {saved,lease}=claim;id=saved.jobId;
    // A model cannot invent worker or project identity. SQL admission verifies
    // owner intent; the local worker independently verifies company and hashes.
    ensure(saved.workerId===WORKER_ID&&lease.workerId===WORKER_ID&&
       projectIdentity(saved.projectId).companyId===saved.companyId &&
       saved.brainKey==='brain:'+saved.companyId+':v1'&&
       saved.inputHash===sha(saved.inputText)&&
       saved.toolVersion==='safe-readonly-v1'&&
       lease.jobId===id&&lease.fencingToken>=1&&lease.generation===1,
       'safe_tool_owner_project_fence_mismatch');
    await channel.current(lease);
    ensure(!stopping,'safe_tool_worker_stopped');
    const outputText=await execute(saved.actionKey,saved.inputText);
    ensure(typeof outputText==='string'&&Buffer.byteLength(outputText,'utf8')<120000,'safe_tool_output_too_large');
    let output;try{output=JSON.parse(outputText)}catch{throw Error('safe_tool_output_invalid')}
    ensure(output?.tool===saved.actionKey&&output?.executed===false&&output?.paidUsageAuthorized===false,
       'safe_tool_output_scope_invalid');
    await channel.current(lease);
    ensure(!stopping,'safe_tool_worker_stopped');
    const result={
      jobId:id,ownerId:saved.ownerId,workerId:saved.workerId,projectId:saved.projectId,
      companyId:saved.companyId,brainKey:saved.brainKey,brainVersion:saved.brainVersion,
      actionKey:saved.actionKey,toolVersion:'safe-readonly-v1',inputHash:saved.inputHash,
      fencingToken:lease.fencingToken,generation:1,outputText,outputHash:sha(outputText),
      paidUsageAuthorized:false,companyBuildStarted:false,generalCompanyExecution:false
    };
    await channel.commit(lease,result);
    const receipt=await channel.readback(lease);
    ensure(receipt?.state==='completed'&&receipt?.canonicalCommitVerified===true&&
      receipt?.jobId===id&&receipt?.fencingToken===lease.fencingToken&&
      UUID.test(receipt?.commitId??'')&&
      canonical(receipt.result)===canonical(result),
      'safe_tool_canonical_readback_mismatch');
    return Object.freeze({state:'verified_safe_tool_job',jobId:id,actionKey:saved.actionKey,
      canonicalCommitVerified:true,companyBuildExecuted:false,paidUsageAuthorized:false});
   }finally{if(id)channel.abandon(id);busy=false}
  }
 });
}
