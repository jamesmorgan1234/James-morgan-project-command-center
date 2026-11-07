/** Owner-authenticated client of the existing free Supabase safe-readonly lane.
 * Queue acknowledgement is never described as actual execution. */
import type {ExecutionGatewayOptions} from './execution-gateway.js';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export type SafeToolAction='code.js_syntax_check'|'research.public_docs_read';
export interface SafeToolJobReceipt{
 readonly jobId:string;
 readonly projectId?:string;
 readonly companyId?:string;
 readonly workerId?:string;
 readonly actionKey?:SafeToolAction;
 readonly state:'queued'|'claimed'|'completed'|'cancelled'|'uncertain';
 readonly executionVerified:boolean;
 readonly commitId?:string|null;
 readonly result?:Record<string,unknown>|null;
 readonly paidUsageAuthorized:false;
 readonly companyBuildStarted:false;
}
async function invokeSafeToolGateway(opts:ExecutionGatewayOptions,payload:Record<string,unknown>):Promise<Record<string,unknown>>{
 const url=new URL(opts.supabaseUrl);
 if(url.origin!=='https://gmlsucpwliegwlxymjvp.supabase.co')throw Error('Safe-tool backend not bound to COMMAND CENTER');
 const res=await opts.fetcher(url.origin+'/functions/v1/command-center-safe-tools',{
  method:'POST',headers:{apikey:opts.publishableKey,authorization:'Bearer '+opts.accessToken,'content-type':'application/json'},
  cache:'no-store',redirect:'error',signal:AbortSignal.timeout(45000),
  body:JSON.stringify({...payload,allowPaid:false,allowProtected:false,companyBuildAuthorized:false})
 });
 const body:unknown=await res.json();
 if(!res.ok||!body||typeof body!=='object'||Array.isArray(body))throw Error('Read-only tool gateway did not return a valid receipt');
 return body as Record<string,unknown>;
}
function verifiedReceipt(r:Record<string,unknown>,jobId:string,projectId:string):SafeToolJobReceipt{
 if(r.jobId!==jobId||!['queued','claimed','completed','cancelled','uncertain'].includes(String(r.state))||
    r.paidUsageAuthorized!==false||r.companyBuildStarted!==false)throw Error('Safe tool receipt identity or scope mismatch');
 if(r.projectId!==undefined&&r.projectId!==projectId)throw Error('Cross-project safe tool receipt rejected');
 if(r.state==='completed'&&(!UUID.test(String(r.commitId??''))||r.executionVerified!==true))throw Error('Safe tool completion proof missing');
 if(r.state!=='completed'&&r.executionVerified===true)throw Error('Safe tool queued response cannot assert execution');
 return r as unknown as SafeToolJobReceipt;
}
export async function requestSafeReadOnlyTool(opts:ExecutionGatewayOptions,projectId:string,actionKey:SafeToolAction,inputText:string,jobId:string):Promise<SafeToolJobReceipt>{
 if(!projectId.trim()||!UUID.test(jobId)||!['code.js_syntax_check','research.public_docs_read'].includes(actionKey)||inputText.length>16000)
   throw Error('Invalid safe-tool identity or scope');
 return verifiedReceipt(await invokeSafeToolGateway(opts,{action:'safe-start',projectId,actionKey,inputText,jobId}),jobId,projectId);
}
export async function readSafeReadOnlyTool(opts:ExecutionGatewayOptions,projectId:string,jobId:string):Promise<SafeToolJobReceipt>{
 if(!UUID.test(jobId)||!projectId.trim())throw Error('Safe tool status request invalid');
 const value=verifiedReceipt(await invokeSafeToolGateway(opts,{action:'safe-status',jobId}),jobId,projectId);
 if(value.state==='completed'){
   const r=value.result;
   if(!r||typeof r.outputText!=='string'||typeof r.outputHash!=='string'||r.paidUsageAuthorized!==false||
      r.companyBuildStarted!==false||r.generalCompanyExecution!==false||r.projectId!==projectId||
      r.jobId!==jobId)throw Error('Safe tool canonical result scope invalid');
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(r.outputText))),b=>b.toString(16).padStart(2,'0')).join('');
   if(hash!==r.outputHash)throw Error('Safe tool output hash mismatch');
 }
 return value;
}
export async function cancelSafeReadOnlyTool(opts:ExecutionGatewayOptions,projectId:string,jobId:string):Promise<SafeToolJobReceipt>{
 if(!UUID.test(jobId)||!projectId.trim())throw Error('Safe tool cancel request invalid');
 return verifiedReceipt(await invokeSafeToolGateway(opts,{action:'safe-cancel',jobId}),jobId,projectId);
}
