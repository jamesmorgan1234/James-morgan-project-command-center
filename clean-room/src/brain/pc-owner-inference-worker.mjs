/**
 * Outbound-only, owner-scoped local inference worker core.
 * Adapters must be attached to existing authenticated COMMAND CENTER records.
 * This doesn't create a queue, accept untrusted shell commands, or enable
 * company builds. It never marks a task complete without canonical readback.
 */
import {validateActivationProbe,sha256Text} from './pc-activation-contract.mjs';
import {projectIdentity} from './pc-brain-readiness.mjs';
export class PcWorkerError extends Error { constructor(code) {super(code);this.name='PcWorkerError';} }
const ensure=(ok,code)=>{if(!ok)throw new PcWorkerError(code);};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const text=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;

/** All adapters must already be bound to the same authenticated owner, server-side. */
export function createOwnerPcInferenceWorker({claim,context,model,persist,readBack}) {
  ensure([claim,context,persist,readBack].every(x=>typeof x==='function')&&typeof model?.generate==='function','pc_worker_adapter_incomplete');
  let busy=false;
  return Object.freeze({
    async processOne() {
      ensure(!busy,'pc_worker_busy');
      busy=true;
      try {
        const task=await claim();
        if(task===null)return Object.freeze({state:'idle',executed:false});
        ensure(task&&UUID.test(task.requestId)&&UUID.test(task.conversationId)&&UUID.test(task.ownerTurnId),'invalid_inference_task');
        ensure(task.ownerAuthenticated===true&&task.ownerAuthorized===true&&task.queueClaimVerified===true,'owner_claim_unverified');
        ensure(task.action==='brain.respond.read_only'&&task.allowPaid===false&&task.allowProtected===false&&task.writesAuthorized===false&&task.scheduleAuthorized===false&&task.executionAuthorized===false,'task_outside_readonly_scope');
        ensure(text(task.ownerText,12000)&&task.redactionState==='safe_text','owner_text_invalid');
        const id=projectIdentity(task.projectId??null);
        const scope=await context({projectId:task.projectId??null,companyId:id.companyId??null,requestId:task.requestId});
        ensure(scope&&scope.verified===true&&scope.projectId===(task.projectId??null),'context_not_verified');
        let activation=null;
        if(task.purpose==='activation_probe')activation=await validateActivationProbe(task,scope);
        if(task.projectId!==null) {
          ensure(scope.companyId===id.companyId&&scope.brainKey===`brain:${id.companyId}:v1`,'specialist_identity_mismatch');
          if(!activation)ensure(scope.specialistEnabled===true&&scope.specialistLiveVerified===true,'specialist_not_operational');
        }
        ensure(text(scope.system,12000),'system_context_invalid');
        const response=await model.generate({system:scope.system,user:task.ownerText,json:activation!==null});
        ensure(response?.verifiedInference===true&&text(response?.text,8000)&&text(response?.modelId,150),'inference_not_verified');
        ensure(/^[a-f0-9]{64}$/.test(response.modelDigest??''),'model_digest_not_verified');
        if(activation)ensure(response.modelId===activation.routeSnapshot.modelId,'activation_model_mismatch');
        const saved=await persist({requestId:task.requestId,conversationId:task.conversationId,ownerTurnId:task.ownerTurnId,
          projectId:task.projectId??null,text:response.text,modelId:response.modelId,modelDigest:response.modelDigest,
          inferenceVerified:true,executionVerified:false,canonicalWritesAuthorized:false});
        ensure(saved?.requestId===task.requestId&&saved?.projectId===(task.projectId??null)&&UUID.test(saved.brainTurnId??''),'inference_not_persisted');
        const proof=await readBack({requestId:task.requestId,projectId:task.projectId??null,brainTurnId:saved.brainTurnId});
        ensure(proof?.requestId===task.requestId&&proof?.projectId===(task.projectId??null)&&proof?.brainTurnId===saved.brainTurnId&&
          proof?.text===response.text&&proof?.role==='brain'&&proof?.canonicalWritesAuthorized===false&&proof?.evidenceVerified===true,'inference_readback_failed');
        if(activation)ensure(proof.activationContractHash===task.activationContractHash && proof.modelDigest===response.modelDigest && proof.resultHash===await sha256Text(response.text),'activation_readback_failed');
        return Object.freeze({purpose:task.purpose??'chat',state:'verified_response',requestId:task.requestId,brainTurnId:saved.brainTurnId,
          actualInferenceVerified:true,projectExecutionVerified:false});
      } finally {busy=false;}
    }
  });
}
