#!/usr/bin/env node
/** Owner's local PC only. Never run within Edge Functions, GitHub Actions, Vercel. */
import {createPcWorkstationRunner} from './pc-worker-supervisor.mjs';
import {createPcLocalOllama} from '../brain/pc-local-ollama.mjs';
import {createPcArtifactJobRunner} from './pc-artifact-job-runner.mjs';
import {createPcActivationExchangeRunner} from './pc-activation-exchange-runner.mjs';
import {createPcActivationExchangeTransport} from './pc-activation-exchange-transport.mjs';
import {resolve} from 'node:path';
const {CC_PC_WORKER_TOKEN:workerToken,CC_PC_LOCAL_MODEL:modelId}=process.env;
const onlySelfTest=process.argv.includes('--self-test');
if(!modelId || (!workerToken && !onlySelfTest)){
 console.error('Configuration required: CC_PC_WORKER_TOKEN and CC_PC_LOCAL_MODEL (never put credentials in code).');
 process.exitCode=2;
}else{
 try{
  if(onlySelfTest){
    const result=await createPcLocalOllama({modelId}).generate({system:'You are a read-only local AI.',user:'Respond with the word ready.'});
    console.log(JSON.stringify({localModelId:result.modelId,modelDigest:result.modelDigest,realInferenceVerified:result.verifiedInference,remoteInference:false}));
  }else{
    const artifactJobs=process.platform==='win32'&&process.env.LOCALAPPDATA
      ?createPcArtifactJobRunner({workerToken,baseDirectory:resolve(process.env.LOCALAPPDATA,'COMMAND_CENTER_PC_WORKER','project-artifacts')}):null;
    const activationExchanges=process.platform==='win32'&&process.env.LOCALAPPDATA
      ?createPcActivationExchangeRunner({
        transport:createPcActivationExchangeTransport({workerToken}),
        model:createPcLocalOllama({modelId}),modelId
       }):null;
    const runner=createPcWorkstationRunner({workerToken,modelId,artifactJobs,activationExchanges,log:v=>console.log(JSON.stringify(v))});
    process.on('SIGINT',()=>runner.stop());process.on('SIGTERM',()=>runner.stop());
    console.log(JSON.stringify({event:'worker_started',mode:activationExchanges?'read_only_inference_artifacts_and_activation_exchange':'read_only',destination:'existing_supabase',noPaidFallback:true}));
    await runner.loop();
  }
 }catch(e){console.error('Workstation initialization failed (no work was claimed).');process.exitCode=1}
}
