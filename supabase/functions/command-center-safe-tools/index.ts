// COMMAND CENTER existing Supabase free project: independently scoped safe-tool gateway.
// No reusable owner token, worker token, paid provider, company task, or browser session.
import {createClient} from "npm:@supabase/supabase-js@2.79.0";
const URL_BASE=Deno.env.get('SUPABASE_URL')??'';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'';
const ANON=Deno.env.get('SUPABASE_ANON_KEY')??'';
if(new URL(URL_BASE).origin!=='https://gmlsucpwliegwlxymjvp.supabase.co'||!SERVICE||!ANON)throw Error('safe_tool_server_config_missing');
const admin=createClient(URL_BASE,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
const ORIGINS=new Set(['https://command-center-preview-alpha.vercel.app','https://command-center-preview-crestven-holdings.vercel.app']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TOKEN=/^ccpc_[a-f0-9]{64}$/;
const ACTIONS=new Set(['safe-start','safe-status','safe-cancel','worker-next','worker-current','worker-commit','worker-readback']);
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const fail=(error,status)=>({error,status});
const checked=(r)=>{if(r?.error)throw fail('backend_unavailable',503);return r?.data};
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
async function ownerSession(request){
 const auth=request.headers.get('authorization')??'';
 if(!auth.startsWith('Bearer '))throw fail('owner_auth_required',401);
 const user=checked(await admin.auth.getUser(auth.slice(7)))?.user;
 if(!UUID.test(user?.id??''))throw fail('owner_auth_invalid',401);
 const client=createClient(URL_BASE,ANON,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:auth}}});
 if(checked(await client.rpc('is_command_center_authorized'))!==true)throw fail('owner_not_authorized',403);
 return{client,ownerId:user.id};
}
async function workerSession(request){
 const token=request.headers.get('x-command-center-worker-token')??'';
 if(!TOKEN.test(token))throw fail('worker_token_invalid',401);
 const h=await digest(token);
 const row=checked(await admin.from('command_center_pc_worker_registrations')
  .select('owner_id,worker_id,enabled,revoked_at')
  .eq('token_digest',h).eq('enabled',true).is('revoked_at',null).limit(1).maybeSingle());
 if(!row||!UUID.test(row.worker_id)||!UUID.test(row.owner_id))throw fail('worker_not_authorized',401);
 const member=checked(await admin.from('command_center_members').select('user_id,access_status,revoked_at')
  .eq('user_id',row.owner_id).maybeSingle());
 if(!member||member.access_status!=='active'||member.revoked_at!==null)throw fail('worker_owner_inactive',401);
 const ping=checked(await admin.from('command_center_pc_worker_registrations').update({last_seen_at:new Date().toISOString()})
  .eq('owner_id',row.owner_id).eq('worker_id',row.worker_id).eq('token_digest',h)
  .eq('enabled',true).is('revoked_at',null).select('worker_id'));
 if(ping?.length!==1)throw fail('worker_revoked',401);
 return{ownerId:row.owner_id,workerId:row.worker_id};
}
function rejectUnknown(input,allowed){
 if(Object.keys(input).some(k=>!allowed.includes(k)))throw fail('unexpected_input_field',400);
}
Deno.serve(async request=>{
 const origin=request.headers.get('origin');
 const cors=origin&&ORIGINS.has(origin)?{
   'access-control-allow-origin':origin,
   'access-control-allow-headers':'authorization,apikey,content-type,x-command-center-worker-token',
   'access-control-allow-methods':'POST,OPTIONS','vary':'Origin'}:{};
 const reply=(payload,status=200)=>new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json','cache-control':'no-store',...cors}});
 try{
  if(origin&&!ORIGINS.has(origin))throw fail('origin_not_allowed',403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')throw fail('method_not_allowed',405);
  const raw=await request.text();
  if(raw.length>145000)throw fail('body_too_large',413);
  let input;try{input=JSON.parse(raw)}catch{throw fail('invalid_json',400)}
  if(!isObject(input)||!ACTIONS.has(input.action))throw fail('unsupported_action',400);
  if(input.allowPaid!==false||input.allowProtected!==false||input.companyBuildAuthorized!==false)throw fail('scope_expansion_refused',403);
  if(input.action.startsWith('worker-')){
   const worker=await workerSession(request);
   rejectUnknown(input,['action','allowPaid','allowProtected','companyBuildAuthorized','clientContract','jobId','fencingToken','result']);
   if(input.clientContract!=='cc-pc-safe-tools-v1')throw fail('worker_contract_invalid',403);
   const operation=input.action.slice('worker-'.length);
   if(operation!=='next'&&(!UUID.test(input.jobId??'')||!Number.isSafeInteger(input.fencingToken)||input.fencingToken<1))
      throw fail('worker_fence_invalid',400);
   if(operation==='commit'&&!isObject(input.result))throw fail('worker_result_invalid',400);
   const data=checked(await admin.rpc('command_center_pc_safe_tool_worker_service',{
     p_owner:worker.ownerId,p_worker:worker.workerId,p_action:operation,
     p_job:operation==='next'?null:input.jobId,p_fence:operation==='next'?null:input.fencingToken,
     p_result:operation==='commit'?input.result:null
   }));
   return reply({result:data});
  }
  const owner=await ownerSession(request);
  if(input.action==='safe-start'){
    rejectUnknown(input,['action','allowPaid','allowProtected','companyBuildAuthorized','jobId','projectId','actionKey','inputText']);
    if(!UUID.test(input.jobId??'')||typeof input.projectId!=='string'||typeof input.inputText!=='string'||input.inputText.length>16000
      ||!['code.js_syntax_check','research.public_docs_read'].includes(input.actionKey))throw fail('safe_job_invalid',400);
    // Reject non-public research destinations before a job ever reaches Windows.
    let body;try{body=JSON.parse(input.inputText)}catch{throw fail('safe_tool_input_invalid',400)}
    if(!isObject(body))throw fail('safe_tool_input_invalid',400);
    if(input.actionKey==='research.public_docs_read'){
      let target;try{target=new URL(body.url)}catch{throw fail('docs_url_invalid',400)}
      const roots={'developer.mozilla.org':'/en-US/docs/','nodejs.org':'/api/',
        'docs.python.org':'/3/','www.w3.org':'/TR/','www.rfc-editor.org':'/rfc/'};
      if(Object.keys(body).length!==1||target.protocol!=='https:'||target.port||target.username||
         target.password||target.search||target.hash||!Object.hasOwn(roots,target.hostname)||
         !target.pathname.startsWith(roots[target.hostname])||target.href.length>700)
           throw fail('public_docs_scope_refused',403);
    }else if(Object.keys(body).length!==1||typeof body.source!=='string'||body.source.length>12000){
      throw fail('code_syntax_scope_refused',403);
    }
    const receipt=checked(await owner.client.rpc('command_center_pc_safe_tool_enqueue',{
      p_job:input.jobId,p_project:input.projectId,p_action:input.actionKey,p_input:input.inputText
    }));
    if(receipt?.jobId!==input.jobId||!['queued','claimed','completed','cancelled','uncertain'].includes(receipt.state))throw fail('queue_receipt_invalid',503);
    return reply({...receipt,companyBuildStarted:false,paidUsageAuthorized:false},receipt.state==='queued'?202:200);
  }
  rejectUnknown(input,['action','allowPaid','allowProtected','companyBuildAuthorized','jobId']);
  if(!UUID.test(input.jobId??''))throw fail('job_id_invalid',400);
  if(input.action==='safe-cancel'){
    const result=checked(await owner.client.rpc('command_center_pc_safe_tool_cancel',{p_job:input.jobId}));
    if(result?.jobId!==input.jobId)throw fail('cancel_receipt_invalid',503);
    return reply({...result,paidUsageAuthorized:false,companyBuildStarted:false});
  }
  const row=checked(await owner.client.from('command_center_pc_safe_tool_jobs')
    .select('job_id,project_id,company_id,worker_id,action_key,state,fence,commit_id,completed_at,result')
    .eq('owner_id',owner.ownerId).eq('job_id',input.jobId).maybeSingle());
  if(!row)throw fail('job_not_found',404);
  if(row.state==='completed'&&(row.result?.jobId!==row.job_id||!row.commit_id||!row.completed_at))
      throw fail('completed_job_receipt_invalid',503);
  return reply({jobId:row.job_id,projectId:row.project_id,companyId:row.company_id,
    workerId:row.worker_id,actionKey:row.action_key,state:row.state,
    fence:row.fence,commitId:row.commit_id,completedAt:row.completed_at,
    result:row.state==='completed'?row.result:null,
    executionVerified:row.state==='completed'&&!!row.commit_id&&!!row.completed_at,
    companyBuildStarted:false,paidUsageAuthorized:false});
 }catch(e){
  // Error detail is deliberately not reflected: no secrets, URLs or private job content.
  return reply({error:typeof e?.error==='string'?e.error:'safe_tool_unavailable'},Number.isInteger(e?.status)?e.status:503);
 }
});
