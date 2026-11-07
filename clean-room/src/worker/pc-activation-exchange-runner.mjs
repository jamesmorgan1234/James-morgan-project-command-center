/**
 * Bounded COMMAND CENTER -> project specialist activation exchange.
 * Not project.execute, company Start, browser access or general tools.
 * Only canonical transport supplies leases, authority and durable receipts.
 */
import {createHash} from 'node:crypto';
import {projectIdentity} from '../brain/pc-brain-readiness.mjs';
const ensure=(ok,code)=>{if(!ok)throw Error(code)};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/;
const sha=s=>createHash('sha256').update(s,'utf8').digest('hex');
const keys=o=>Object.keys(o).sort().join(',');
const EXPECTED_RESPONSE_KEYS='accepted,companyBuildStarted,companyId,exchangeId,nonce,paidUsageAuthorized,parentResponseHash,projectId,targetBrainKey';
const MAX_LEASE_MS=180_000;

export function validateActivationExchangeClaim(claim,{workerId,modelId,now=Date.now()}={}){
  ensure(claim&&typeof claim==='object'&&!Array.isArray(claim),'exchange_claim_missing');
  const {saved:s,lease:l}=claim;
  ensure(s&&l&&typeof s==='object'&&typeof l==='object','exchange_claim_incomplete');
  ensure(UUID.test(workerId??'')&&s.workerId===workerId&&l.workerId===workerId,'exchange_worker_binding_mismatch');
  ensure(UUID.test(s.exchangeId??'')&&s.exchangeId===l.exchangeId&&UUID.test(s.ownerId??'')&&
    s.ownerId===l.ownerId&&UUID.test(s.nonce??''),'exchange_identity_invalid');
  ensure(typeof s.projectId==='string'&&s.projectId.length<=240&&s.projectId.trim()&&
    s.companyId===l.companyId&&s.projectId===l.projectId,'exchange_project_scope_mismatch');
  const identity=projectIdentity(s.projectId);
  ensure(!identity.central&&identity.companyId===s.companyId,'exchange_company_identity_mismatch');
  ensure(s.parentBrainKey==='command_center'&&s.controlPlane==='command_center'&&
    s.targetBrainKey==='brain:'+s.companyId+':v1'&&s.targetBrainKey===l.targetBrainKey,
    'exchange_target_not_command_center_bound');
  ensure(Number.isSafeInteger(s.brainVersion)&&s.brainVersion>=1&&s.brainVersion===l.brainVersion,
    'exchange_brain_version_mismatch');
  ensure(s.purpose==='activation_exchange'&&s.authorityRef==='evd_owner-command-center-brain-activation-20261105'&&
    s.allowPaid===false&&s.allowProtected===false&&s.companyBuildAuthorized===false&&
    s.companyExecutionAuthorized===false&&s.generalToolsAuthorized===false,
    'exchange_outside_activation_authority');
  ensure(s.modelId===modelId&&typeof modelId==='string'&&modelId.length>0&&
    HASH.test(s.expectedModelDigest??'')&&HASH.test(s.parentResponseHash??''),'exchange_model_binding_missing');
  const text=JSON.stringify({exchangeId:s.exchangeId,projectId:s.projectId,companyId:s.companyId,
    targetBrainKey:s.targetBrainKey,nonce:s.nonce,parentResponseHash:s.parentResponseHash});
  ensure(s.inputHash===sha(text),'exchange_input_hash_mismatch');
  ensure(l.fencingToken>=1&&Number.isSafeInteger(l.fencingToken)&&l.generation===1&&
    Number.isFinite(now)&&Number.isFinite(Date.parse(l.expiresAt))&&
    Date.parse(l.expiresAt)>now&&Date.parse(l.expiresAt)-now<=MAX_LEASE_MS,
    'exchange_lease_invalid');
  return Object.freeze({...s,inputText:text});
}

export function createPcActivationExchangeRunner({transport,model,workerId,modelId,now=()=>Date.now()}){
  ensure(transport&&['next','assertCurrent','commit','readback','abandon'].every(k=>typeof transport[k]==='function')&&
    typeof model?.generate==='function'&&typeof now==='function', 'activation_exchange_adapter_missing');
  let busy=false,stopped=false;
  return Object.freeze({
    stop(){stopped=true},
    async once(){
      if(stopped)return {state:'stopped',executed:false};
      ensure(!busy,'activation_exchange_busy');
      busy=true;let exchangeId;
      try{
        const claim=await transport.next();
        if(claim===null)return {state:'idle',executed:false};
        exchangeId=claim?.saved?.exchangeId;
        // The paired token is authenticated by the pinned gateway; a supplied local
        // worker ID must also match the server-bound claim when available.
        const boundWorkerId=workerId??claim?.saved?.workerId;
        const s=validateActivationExchangeClaim(claim,{workerId:boundWorkerId,modelId,now:now()});
        await transport.assertCurrent(claim.lease);
        const expected={exchangeId:s.exchangeId,projectId:s.projectId,companyId:s.companyId,
          targetBrainKey:s.targetBrainKey,nonce:s.nonce,parentResponseHash:s.parentResponseHash,accepted:true,
          companyBuildStarted:false,paidUsageAuthorized:false};
        const response=await model.generate({
          system:'You are a bounded local specialist activation exchange under COMMAND CENTER. Return ONLY the requested JSON object without markdown. You have no tools, no company execution permission, no spending authority, and no authority to access other projects.',
          user:'Return exactly this JSON object with the same field names and values: '+JSON.stringify(expected),json:true
        });
        ensure(response?.verifiedInference===true&&response.modelId===s.modelId&&
          response.modelDigest===s.expectedModelDigest&&typeof response.text==='string'&&
          response.text.length<=3000,'exchange_live_inference_not_verified');
        let parsed;try{parsed=JSON.parse(response.text)}catch{throw Error('exchange_model_response_not_json')}
        ensure(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&
          keys(parsed)===EXPECTED_RESPONSE_KEYS&&
          Object.entries(expected).every(([k,v])=>parsed[k]===v),
          'exchange_model_response_scope_mismatch');
        await transport.assertCurrent(claim.lease);
        const receipt={exchangeId:s.exchangeId,workerId:boundWorkerId,ownerId:s.ownerId,projectId:s.projectId,
          companyId:s.companyId,targetBrainKey:s.targetBrainKey,brainVersion:s.brainVersion,
          generation:claim.lease.generation,fencingToken:claim.lease.fencingToken,
          modelId:s.modelId,modelDigest:response.modelDigest,inputHash:s.inputHash,
          outputText:response.text,outputHash:sha(response.text),
          companyBuildStarted:false,paidUsageAuthorized:false,generalToolsExecuted:false};
        await transport.commit(claim.lease,receipt);
        const saved=await transport.readback(claim.lease);
        ensure(saved?.canonicalCommitVerified===true&&UUID.test(saved.commitId??'')&&
          saved.exchangeId===receipt.exchangeId&&saved.workerId===receipt.workerId&&
          saved.ownerId===receipt.ownerId&&saved.projectId===receipt.projectId&&
          saved.companyId===receipt.companyId&&saved.targetBrainKey===receipt.targetBrainKey&&
          saved.brainVersion===receipt.brainVersion&&saved.generation===receipt.generation&&
          saved.fencingToken===receipt.fencingToken&&saved.inputHash===receipt.inputHash&&
          saved.outputHash===receipt.outputHash&&saved.outputText===receipt.outputText&&
          saved.modelId===receipt.modelId&&saved.modelDigest===receipt.modelDigest&&
          saved.companyBuildStarted===false&&saved.paidUsageAuthorized===false&&
          saved.generalToolsExecuted===false,'exchange_canonical_readback_mismatch');
        return Object.freeze({state:'verified_activation_exchange',exchangeId:s.exchangeId,
          targetBrainKey:s.targetBrainKey,canonicalCommitVerified:true,
          companyBuildExecuted:false,generalToolsVerified:false});
      }finally{if(exchangeId)transport.abandon(exchangeId);busy=false}
    }
  });
}
