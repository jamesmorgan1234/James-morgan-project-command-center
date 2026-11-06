// Bind the existing local worker queue; this is not an inference engine.
import {projectIdentity} from './brain-readiness.mjs';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export class PcInferenceError extends Error { constructor(code, status=503) { super(code); this.status=status; } }
export async function requestPcInference({provider, conversationId, ownerTurnId, projectId, readRows, rpc}) {
  const config=provider.configuration;
  const workerId=config?.worker_id;
  if (!UUID.test(workerId??'') || provider.provider_key!==`provider:owner-pc:${workerId}` ||
      config.gateway_ref!=='supabase:functions:command-center-pc-worker' || config.execution_mode!=='local-ollama' ||
      config.payment_authorized!==false || config.company_build_authorized!==false ||
      provider.enabled!==true || provider.cost!=='free' || provider.health!=='available' || provider.verification!=='live_verified' ||
      !provider.capabilities?.includes('brain.respond.read_only') || typeof config.model_id!=='string' ||
      !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,130}$/.test(config.model_id) || config.model_id.endsWith(':cloud') || config.model_id.includes('..'))
    throw new PcInferenceError('local_provider_not_eligible');
  if (!UUID.test(conversationId)||!UUID.test(ownerTurnId)) throw new PcInferenceError('invalid_conversation',400);
  if (projectId!==null) {
    let companyId;
    try { companyId=projectIdentity(projectId).companyId; }
    catch { throw new PcInferenceError('invalid_registered_project_identity',403); }
    const brains=await readRows('command_center_specialist_brains',{project_id:`eq.${projectId}`,select:'brain_key,enabled,lifecycle,health,verification_state,control_plane,supported_project_ids,supported_company_ids,provider_keys',limit:'2'});
    const b=brains[0];
    if (brains.length!==1||b.brain_key!==`brain:${companyId}:v1`||b.control_plane!=='command_center'||b.enabled!==true||b.lifecycle!=='active'||b.health!=='healthy'||b.verification_state!=='verified'||!b.supported_project_ids?.includes(projectId)||!b.supported_company_ids?.includes(companyId)||!b.provider_keys?.includes(provider.provider_key)||!provider.scopes?.includes('company-brain-read-only'))
      throw new PcInferenceError('specialist_activation_not_verified',409);
    const profiles=await readRows('command_center_project_profiles',{project_id:`eq.${projectId}`,select:'project_id,company_id',limit:'2'});
    if(profiles.length!==1||profiles[0].project_id!==projectId||profiles[0].company_id!==companyId)
      throw new PcInferenceError('project_identity_mismatch',403);
  } else if (!provider.scopes?.includes('owner-central-brain')) throw new PcInferenceError('local_provider_scope_mismatch',403);
  const params={conversation_id:`eq.${conversationId}`,owner_turn_id:`eq.${ownerTurnId}`,select:'request_id,conversation_id,owner_turn_id,project_id,state,brain_turn_id,worker_id,model_id,content_hash',limit:'2'};
  let requests=await readRows('command_center_pc_inference_requests',params);
  if (requests.length>1) throw new PcInferenceError('local_request_identity_mismatch');
  let q=requests[0];
  if (!q) {
    const workers=await rpc('command_center_pc_owner_worker_status',{});
    if (!Array.isArray(workers)||!workers.some(w=>w.workerId===workerId&&w.enabled===true&&w.online===true&&w.revoked===false)) throw new PcInferenceError('local_worker_offline');
    await rpc('command_center_pc_enqueue_inference',{p_request_id:ownerTurnId,p_conversation_id:conversationId,p_owner_turn_id:ownerTurnId,p_project_id:projectId});
    requests=await readRows('command_center_pc_inference_requests',params);
    if(requests.length!==1) throw new PcInferenceError('local_request_not_persisted');
    q=requests[0];
  }
  if(q.conversation_id!==conversationId||q.owner_turn_id!==ownerTurnId||q.project_id!==projectId||!UUID.test(q.request_id??'')) throw new PcInferenceError('local_request_identity_mismatch');
  if(q.worker_id!==null&&q.worker_id!==undefined&&q.worker_id!==workerId) throw new PcInferenceError('local_request_worker_mismatch');
  if(q.state==='queued'||q.state==='claimed') return {requestId:q.request_id,state:q.state,inferenceVerified:false,canonicalWritesAuthorized:false};
  if(q.state!=='completed') throw new PcInferenceError('local_inference_terminal',409);
  if(q.worker_id!==workerId||q.model_id!==config.model_id||!UUID.test(q.brain_turn_id??'')) throw new PcInferenceError('local_response_not_verified');
  const turns=await readRows('command_center_brain_conversation_turns',{conversation_id:`eq.${conversationId}`,turn_id:`eq.${q.brain_turn_id}`,role:'eq.brain',select:'turn_id,conversation_id,project_id,role,safe_text,redaction_state,content_hash,canonical_writes_authorized,evidence_refs',limit:'2'});
  const t=turns[0];
  if(turns.length!==1||t.turn_id!==q.brain_turn_id||t.conversation_id!==conversationId||t.project_id!==projectId||t.role!=='brain'||t.redaction_state!=='safe_text'||t.canonical_writes_authorized!==false||typeof t.safe_text!=='string'||!t.safe_text.trim()||!t.evidence_refs?.includes(`brain:response-to:${ownerTurnId}`)||!t.evidence_refs?.includes(`brain:workstation-claim:${q.request_id}`)||!t.evidence_refs?.includes(`brain:pc-worker:${workerId}`)||!t.evidence_refs?.includes(`brain:model:${config.model_id}`)) throw new PcInferenceError('local_response_not_verified');
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t.safe_text))),x=>x.toString(16).padStart(2,'0')).join('');
  if(digest!==q.content_hash||digest!==t.content_hash) throw new PcInferenceError('local_response_not_verified');
  return {requestId:q.request_id,state:'completed',brainTurnId:t.turn_id,inferenceVerified:true,canonicalWritesAuthorized:false};
}
