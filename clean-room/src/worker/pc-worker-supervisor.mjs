/** Controlled, outbound-only polling loop. No permission to execute project builds. */
import {createOwnerPcInferenceWorker} from '../brain/pc-owner-inference-worker.mjs';
import {createPcWorkerTransport} from './pc-worker-transport.mjs';
import {createPcLocalOllama} from '../brain/pc-local-ollama.mjs';
export function createPcWorkstationRunner({workerToken,modelId,fetcher=fetch,log=()=>{},sleep=ms=>new Promise(r=>setTimeout(r,ms)),
  pollMs=60000,maxConsecutiveFailures=5,timeoutMs=120000,artifactJobs=null,activationExchanges=null}={}){
 if(!Number.isSafeInteger(pollMs)||pollMs<10000||pollMs>120000)throw Error('poll_outside_free_safe_range');
 if(!Number.isSafeInteger(maxConsecutiveFailures)||maxConsecutiveFailures<1||maxConsecutiveFailures>12)throw Error('failure_limit_invalid');
 const transport=createPcWorkerTransport({workerToken,fetcher});
 const model=createPcLocalOllama({modelId,fetcher,timeoutMs});
 let stopping=false,failures=0,busy=false,activeAbort=null;
 const restrictedModel={async generate(prompt){
   // Renew the remote fencing lease while the local CPU/GPU is busy.
   let lost=false,inflight=false;
   const currentId=activeRequest;
   activeAbort=new AbortController();
   const interval=setInterval(async()=>{
     if(inflight)return;inflight=true;
     try{await transport.heartbeat(currentId)}catch{lost=true;activeAbort?.abort()}
     finally{inflight=false}
   },45000);
   interval.unref?.();
   try{const reply=await model.generate({...prompt,signal:activeAbort.signal});if(lost||stopping)throw Error('remote_claim_heartbeat_lost_or_worker_stopped');return reply;}
   finally{clearInterval(interval);activeAbort=null}
 }};
 let activeRequest=null;
 const worker=createOwnerPcInferenceWorker({
  claim:async()=>{
   const t=await transport.claim();activeRequest=t?.requestId??null;return t;
  },
  context:a=>transport.context(a),model:restrictedModel,
  persist:a=>transport.persist(a),readBack:a=>transport.readBack(a)
 });
 return Object.freeze({
  get state(){return Object.freeze({stopping,consecutiveFailures:failures,busy,realInferenceVerified:model.readiness.actualInferenceVerified})},
  stop(){stopping=true;activeAbort?.abort();if(typeof artifactJobs?.stop==='function')artifactJobs.stop();if(typeof activationExchanges?.stop==='function')activationExchanges.stop()},
  async selfTest({system='You are a read-only local AI.',user='Respond with the word ready.'}={}){
    return model.generate({system,user});
  },
  async once(){
   if(stopping)return Object.freeze({state:'stopped',executed:false});
   if(busy)throw Error('workstation_busy');busy=true;
   try{
    let result=await worker.processOne();
    // Ordinary owner messages keep priority. Optional artifact jobs require
    // their separate exact-owner queue contract, never inference authority.
    if(result.state==='idle'&&artifactJobs!==null){if(typeof artifactJobs.once!=='function')throw Error('artifact_job_adapter_missing');result=await artifactJobs.once()}
    if(result.state==='idle'&&activationExchanges!==null){if(typeof activationExchanges.once!=='function')throw Error('activation_exchange_adapter_missing');result=await activationExchanges.once()}
    failures=0;
    if(result.state==='verified_response')log({event:'response_verified',requestId:result.requestId});
    if(result.state==='verified_activation_exchange')log({event:'activation_exchange_verified',exchangeId:result.exchangeId});
    return result;
   }catch(e){failures++;
    // No raw message, token, model prompt, or company data in logs.
    log({event:'worker_failed',consecutiveFailures:failures,category:'transport_or_verification'});
    throw e;
   }finally{
    if(activeRequest!==null){transport.abandonClaim(activeRequest);activeRequest=null;}
    busy=false;
   }
  },
  async loop(){
   // Fail before claiming even one queued command if the home-PC AI is not functional.
   try{await this.selfTest()}catch{log({event:'local_model_self_test_failed',companyBuildExecuted:false});
     stopping=true;return {stopped:true,reason:'local_model_unavailable',consecutiveFailures:1};}
   while(!stopping){
    let result;try{result=await this.once()}catch{}
    if(failures>=maxConsecutiveFailures){log({event:'worker_stopped_after_failures'});stopping=true;break;}
    const boundedCheck=(result?.purpose==='activation_probe'&&result?.state==='verified_response')||
      (result?.purpose==='activation_artifact_check'&&result?.state==='verified_artifact_job')||
      (result?.state==='verified_activation_exchange');
    if(!stopping)await sleep(boundedCheck?500:pollMs*Math.min(4,1+failures));
   }
   return {stopped:true,consecutiveFailures:failures};
  }
 });
}
