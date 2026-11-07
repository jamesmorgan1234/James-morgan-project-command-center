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

/** Separate $0 Supabase cloud public-documents fallback, not a PC or browser-agent job. */
export interface CloudPublicDocsReceipt {
 readonly jobId:string;
 readonly projectId:string;
 readonly companyId:string;
 readonly state:'claimed'|'completed'|'uncertain';
 readonly commitId:string|null;
 readonly completedAt:string|null;
 readonly outputHash:string|null;
 readonly result:Record<string,unknown>|null;
 readonly executionVerified:boolean;
 readonly readSucceeded:boolean;
 readonly paidUsageAuthorized:false;
 readonly companyBuildStarted:false;
}
function canonicalCloudJson(value:unknown):string {
 if(Array.isArray(value))return '['+value.map(canonicalCloudJson).join(',')+']';
 if(value!==null&&typeof value==='object')
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+
    canonicalCloudJson((value as Record<string,unknown>)[k])).join(',')+'}';
 return JSON.stringify(value);
}
async function validateCloudReceipt(raw:Record<string,unknown>,jobId:string,projectId:string):Promise<CloudPublicDocsReceipt>{
 if(raw.jobId!==jobId||raw.projectId!==projectId||typeof raw.companyId!=='string'||
    !['claimed','completed','uncertain'].includes(String(raw.state))||
    raw.companyBuildStarted!==false||raw.paidUsageAuthorized!==false)
    throw Error('Cloud documentation receipt scope mismatch');
 if(raw.state==='completed'){
   if(!UUID.test(String(raw.commitId??''))||typeof raw.completedAt!=='string'||
      typeof raw.outputHash!=='string'||raw.executionVerified!==true||
      !raw.result||typeof raw.result!=='object'||Array.isArray(raw.result))
      throw Error('Cloud documentation canonical receipt missing');
   const r=raw.result as Record<string,unknown>;
   if(r.tool!=='research.public_docs_read'||r.source!=='existing_supabase_cloud_read_only'||
      r.companyBuildStarted!==false||r.paidUsageAuthorized!==false||
      r.generalCompanyExecution!==false||r.executed!==false||
      typeof r.readSucceeded!=='boolean'||raw.readSucceeded!==r.readSucceeded)
      throw Error('Cloud documentation content or action scope mismatch');
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
      new TextEncoder().encode(canonicalCloudJson(r)))),b=>b.toString(16).padStart(2,'0')).join('');
   if(hash!==raw.outputHash)throw Error('Cloud documentation stored output SHA-256 mismatch');
 }else if(raw.executionVerified===true||raw.readSucceeded===true||raw.result!=null)
   throw Error('Uncommitted cloud documentation cannot claim execution');
 return raw as unknown as CloudPublicDocsReceipt;
}
export async function requestCloudPublicDocs(opts:ExecutionGatewayOptions,projectId:string,url:string,jobId:string):Promise<CloudPublicDocsReceipt>{
 if(!projectId.trim()||!UUID.test(jobId)||typeof url!=='string'||url.length>700)
   throw Error('Cloud documentation request identity invalid');
 const receipt=await invokeSafeToolGateway(opts,{action:'cloud-doc-start',projectId,url,jobId});
 return validateCloudReceipt(receipt,jobId,projectId);
}
export async function readCloudPublicDocs(opts:ExecutionGatewayOptions,projectId:string,jobId:string):Promise<CloudPublicDocsReceipt>{
 if(!projectId.trim()||!UUID.test(jobId))throw Error('Cloud documentation status identity invalid');
 return validateCloudReceipt(await invokeSafeToolGateway(opts,{action:'cloud-doc-status',projectId,jobId}),jobId,projectId);
}
