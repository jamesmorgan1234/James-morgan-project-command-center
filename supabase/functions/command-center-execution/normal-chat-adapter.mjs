// Bind owner-initiated agency starts to the EXISTING hosted ChatGPT Task worker.
// This is durable queue admission, not a new worker or an immediate execution claim.
// Membership is resolved from the existing owner/project/Brain registry.
import { PreparationReadError } from './preparation-read.mjs';
import { projectIdentity } from './brain-readiness.mjs';

export const NORMAL_CHAT_WORKER_KEY='executor:chatgpt-tasks-normal-chat';
export const NORMAL_CHAT_WORKER_REF='chatgpt-task:6ada7af0b254819184456ca1246e3f69';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function checked(state,code,status=409){if(!state)throw new PreparationReadError(code,status);}
async function one(read,table,params,code,status=409){const rows=await read(table,{...params,limit:'2'});checked(Array.isArray(rows)&&rows.length===1,code,status);return rows[0];}

export async function queueOnExistingNormalChatWorker({projectId,objective,requestId,readRows,rpc}) {
  // Syntax only identifies a candidate; it never grants membership or authority.
  let identity;
  try { identity=projectIdentity(projectId); } catch { throw new PreparationReadError('invalid_company_project',403); }
  checked(!identity.central,'invalid_company_project',403);
  const companyId=identity.companyId;
  checked(typeof objective==='string'&&objective.trim().length>0&&objective.trim().length<=4000&&UUID.test(requestId??''),'invalid_start',400);
  checked(typeof readRows==='function'&&typeof rpc==='function','adapter_not_configured',503);
  const project=await one(readRows,'command_center_project_profiles',{
    project_id:'eq.'+projectId,select:'project_id,company_id,status,type_key,protected'
  },'project_not_available');
  checked(project.project_id===projectId&&project.company_id===companyId&&project.status==='active','project_identity_mismatch',403);
  checked(!companyId.startsWith('company:legacy:')||project.protected===true,'project_identity_mismatch',403);
  const brain=await one(readRows,'command_center_specialist_brains',{
    project_id:'eq.'+projectId,select:'project_id,brain_key,control_plane,supported_project_ids,supported_company_ids'
  },'specialist_registration_missing',403);
  checked(brain.project_id===projectId&&brain.brain_key===`brain:${companyId}:v1`&&brain.control_plane==='command_center'&&
    Array.isArray(brain.supported_project_ids)&&brain.supported_project_ids.length===1&&brain.supported_project_ids[0]===projectId&&
    Array.isArray(brain.supported_company_ids)&&brain.supported_company_ids.length===1&&brain.supported_company_ids[0]===companyId,
    'specialist_identity_mismatch',403);
  // Health=degraded means immediate execution must not be claimed; it does not
  // invalidate the registered free hosted Task as a durable queue consumer.
  const workers=await readRows('command_center_agency_executors',{
    executor_key:'eq.'+NORMAL_CHAT_WORKER_KEY,enabled:'eq.true',
    retired_at:'is.null',cost_class:'eq.free',
    select:'executor_key,executor_ref,enabled,health,cost_class,retired_at,environments,capabilities,authority_class'
  });
  const worker=Array.isArray(workers)?workers.find(w=>
    w.executor_key===NORMAL_CHAT_WORKER_KEY&&w.executor_ref===NORMAL_CHAT_WORKER_REF&&w.enabled===true&&
    w.retired_at===null&&w.cost_class==='free'&&Array.isArray(w.environments)&&w.environments.includes('normal_chat')&&
    Array.isArray(w.capabilities)&&w.capabilities.includes('project.execute')&&
    ['read_only','propose','execute_reversible'].includes(w.authority_class)):null;
  checked(worker,'existing_worker_unavailable',503);

  const roadmap=await one(readRows,'command_center_project_roadmaps',{
    project_id:'eq.'+projectId,state:'eq.current',select:'version,state,structure_verified'
  },'roadmap_not_verified');
  checked(roadmap.state==='current'&&roadmap.structure_verified===true&&Number.isSafeInteger(Number(roadmap.version)),'roadmap_not_verified');
  const checkpoint=await one(readRows,'command_center_project_checkpoints',{
    project_id:'eq.'+projectId,roadmap_version:'eq.'+roadmap.version,
    select:'checkpoint_id,roadmap_version,exact_next_work_unit_id',
    order:'created_at.desc'
  },'checkpoint_not_available');
  checked(Number(checkpoint.roadmap_version)===Number(roadmap.version)&&
    checkpoint.exact_next_work_unit_id?.startsWith(projectId+':'),'checkpoint_inconsistent');

  // Only the existing owner-only, atomic/idempotent RPC may create a real run.
  // It validates the owner, free worker registration, active runs and exact
  // authorization_ref; never fabricate a JWT, claim, task, heartbeat or result.
  const runId='agency-run:'+requestId;
  const receipt=await rpc('command_center_agency_start_normal_chat',{
    p_project_id:projectId,p_run_id:runId,p_objective:objective.trim()
  });
  checked(receipt&&receipt.run_id===runId&&Number(receipt.generation)>=1&&
    ['queued','working','paused','blocked','needs_user','completed'].includes(receipt.state),'queue_receipt_not_verified',503);
  const run=await one(readRows,'command_center_agency_runs',{
    project_id:'eq.'+projectId,run_id:'eq.'+runId,
    select:'run_id,project_id,objective,control_mode,authorization_ref,state,generation,stop_requested,pause_requested'
  },'queue_not_persisted');
  checked(run.run_id===runId&&run.project_id===projectId&&run.objective===objective.trim()&&
    run.control_mode==='until_work'&&run.authorization_ref==='owner:normal-chat-start:'+runId&&
    run.state===receipt.state&&Number(run.generation)===Number(receipt.generation),'queue_not_persisted',503);
  // A stopped run is never a success or permission to requeue.
  checked(run.stop_requested!==true&&run.state!=='stopped','run_stopped',409);
  return Object.freeze({
    companyId,projectId,runId,runState:run.state,generation:Number(run.generation),
    workerKey:NORMAL_CHAT_WORKER_KEY,workerRef:NORMAL_CHAT_WORKER_REF,
    workerHealth:worker.health,queueAccepted:true,duplicate:receipt.duplicate===true,
    executionVerified:false,workingTaskId:null,workerImmediatelyInvoked:false,
    controlMode:'until_work',allowPaid:false,allowProtected:false
  });
}
