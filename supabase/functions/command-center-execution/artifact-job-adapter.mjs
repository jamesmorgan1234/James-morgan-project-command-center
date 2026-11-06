import {projectIdentity} from './brain-readiness.mjs';
export class ArtifactJobError extends Error{constructor(code,status=409){super(code);this.status=status}}
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/;
const check=(ok,code,status=409)=>{if(!ok)throw new ArtifactJobError(code,status)};
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');

/** Owner JWT and RLS are supplied by the existing execution gateway. */
export async function dispatchOwnerArtifactJob({request,ownerId,readRows,rpc}){
 const {projectId,invocationId}=request;
 check(UUID.test(invocationId??''),'invalid_artifact_invocation',400);
 let companyId;try{const identity=projectIdentity(projectId);check(!identity.central,'invalid_artifact_project',403);companyId=identity.companyId}catch{throw new ArtifactJobError('invalid_artifact_project',403)}
 const profiles=await readRows('command_center_project_profiles',{project_id:'eq.'+projectId,select:'project_id,company_id',limit:'2'});
 check(profiles.length===1&&profiles[0].project_id===projectId&&profiles[0].company_id===companyId,'artifact_project_identity_mismatch',403);
 const params={project_id:'eq.'+projectId,invocation_id:'eq.'+invocationId,select:'invocation_id,owner_id,worker_id,project_id,company_id,brain_key,brain_version,action_key,input_text,input_hash,state,fence,lease_expires_at,expires_at,result,commit_id',limit:'2'};
 async function saved(){
  const rows=await readRows('command_center_pc_tool_jobs',params);check(rows.length===1,'artifact_job_not_available',404);
  const j=rows[0];check(j.owner_id===ownerId&&j.project_id===projectId&&j.company_id===companyId&&j.invocation_id===invocationId&&UUID.test(j.worker_id??'')&&j.brain_key===`brain:${companyId}:v1`,'artifact_job_identity_mismatch',403);
  return j;
 }
 if(request.action==='artifact_job_start'){
  check(request.allowPaid===false&&request.allowProtected===false&&request.executionAuthorized===true,'artifact_action_scope_required',403);
  const {workerId,actionKey,input}=request;
  check(UUID.test(workerId??'')&&['artifact.read','artifact.write'].includes(actionKey)&&input&&typeof input==='object'&&!Array.isArray(input),'invalid_artifact_action',400);
  check(typeof input.name==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.-]{0,119}$/.test(input.name)&&!(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(input.name))&&!input.name.endsWith('.')&&Object.keys(input).every(k=>['name','content'].includes(k)),'invalid_artifact_input',400);
  check(actionKey==='artifact.write'?typeof input.content==='string'&&new TextEncoder().encode(input.content).byteLength<=100000:input.content===undefined,'invalid_artifact_input',400);
  // Match the canonical saved-input column's bounded JSON representation.
  check(JSON.stringify(input).length<=119900,'artifact_saved_input_too_large',400);
  const admitted=await rpc('command_center_pc_enqueue_artifact_job',{p_invocation:invocationId,p_project:projectId,p_worker:workerId,p_action:actionKey,p_input:input});
  check(admitted?.invocationId===invocationId&&admitted.projectId===projectId&&admitted.companyBuildStarted===false,'artifact_admission_not_verified',503);
  const j=await saved();let actual;try{actual=JSON.parse(j.input_text)}catch{throw new ArtifactJobError('artifact_input_not_persisted',503)}
  check(j.worker_id===workerId&&j.action_key===actionKey&&actual.name===input.name&&actual.content===input.content&&Object.keys(actual).every(k=>['name','content'].includes(k))&&j.input_hash===await sha(j.input_text),'artifact_input_not_persisted',503);
  return receipt(j);
 }
 let j=await saved();
 if(request.action==='artifact_job_cancel'){
  await rpc('command_center_pc_cancel_artifact_job',{p_invocation:invocationId});j=await saved();
 }else check(request.action==='artifact_job_status','invalid_artifact_action',400);
 return receipt(j);

 async function receipt(j){
  check(['queued','claimed','completed','cancelled','uncertain'].includes(j.state),'artifact_job_state_invalid',503);
  if(j.state!=='completed')return{invocationId,projectId,companyId,workerId:j.worker_id,state:j.state,executionVerified:false,companyBuildStarted:false,allowPaid:false};
  const r=j.result,l=r?.lease;
  check(UUID.test(j.commit_id??'')&&l?.invocationId===invocationId&&l.ownerId===ownerId&&l.projectId===projectId&&l.companyId===companyId&&l.workerId===j.worker_id&&l.taskId==='pc-tool:'+invocationId&&l.generation===1&&l.fencingToken===Number(j.fence)&&Number.isFinite(Date.parse(l.expiresAt))&&Date.parse(l.expiresAt)===Date.parse(j.lease_expires_at)&&r.toolKey==='owner-pc-artifacts'&&r.actionKey===j.action_key&&r.toolVersion==='artifact-v1'&&r.inputHash===j.input_hash&&j.input_hash===await sha(j.input_text)&&typeof r.outputText==='string'&&new TextEncoder().encode(r.outputText).byteLength<=120000&&HASH.test(r.outputHash??'')&&r.outputHash===await sha(r.outputText),'artifact_result_not_verified',503);
  return{invocationId,projectId,companyId,workerId:j.worker_id,state:'completed',executionVerified:true,scope:'exact_owner_artifact_job',commitId:j.commit_id,outputText:r.outputText,outputHash:r.outputHash,companyBuildStarted:false,allowPaid:false};
 }
}
