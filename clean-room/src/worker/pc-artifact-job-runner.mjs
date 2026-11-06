import {mkdir,realpath} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {createPcToolJobTransport} from './pc-tool-job-transport.mjs';
import {createPcToolExecutionLane} from './pc-tool-execution-lane.mjs';
import {projectIdentity} from '../brain/pc-brain-readiness.mjs';

/** Existing worker's optional exact-owner-job lane. No separate Task/service. */
export function createPcArtifactJobRunner({workerToken,baseDirectory,fetcher=fetch}){
 if(typeof baseDirectory!=='string'||resolve(baseDirectory)!==baseDirectory)throw Error('trusted_artifact_base_directory_required');
 const transport=createPcToolJobTransport({workerToken,fetcher});
 let busy=false,stopping=false;
 return Object.freeze({
  stop(){stopping=true},
  async once(){
   if(stopping)return{state:'stopped',executed:false};
   if(busy)throw Error('artifact_job_runner_busy');busy=true;let id;
   try{
    const claimed=await transport.next();if(claimed===null)return{state:'idle',executed:false};
    const a=claimed.saved.action;id=claimed.saved.invocationId;
    if(projectIdentity(a.projectId).companyId!==a.companyId||a.accountRef!==`artifact:${a.ownerId}:${a.projectId}`)throw Error('artifact_job_canonical_identity_required');
    const partition=createHash('sha256').update(JSON.stringify([a.ownerId,a.projectId,a.companyId])).digest('hex');
    const directory=join(baseDirectory,partition),root=join(directory,'artifacts'),journalRoot=join(directory,'journal');
    for(const path of [baseDirectory,directory,root,journalRoot]){
     await mkdir(path,{recursive:true,mode:0o700});const actual=await realpath(path);
     if(process.platform==='win32'?actual.toLowerCase()!==path.toLowerCase():actual!==path)throw Error('artifact_workspace_symlink_refused');
    }
    const descriptor={key:'owner-pc-artifacts',ownerId:a.ownerId,provider:'owner-pc:'+claimed.lease.workerId,versionRef:'artifact-v1',
     actionKeys:['artifact.read','artifact.write'],actionEffects:{'artifact.read':'private_read','artifact.write':'local_write'},
     environment:'local',available:true,cost:'free',authenticationRequired:true,authenticated:true,
     projectIds:[a.projectId],companyIds:[a.companyId],accountRefs:[a.accountRef],
     evidenceRef:'local:artifact-handler-canonical-root:'+partition,verifiedAt:new Date().toISOString()};
    const lane=await createPcToolExecutionLane({workspace:{root:await realpath(root),ownerId:a.ownerId,projectId:a.projectId,companyId:a.companyId,accountRef:a.accountRef,toolKey:'owner-pc-artifacts',versionRef:'artifact-v1'},
     journalRoot:await realpath(journalRoot),resolve:transport.resolve,catalog:async()=>[descriptor],createLease:transport.createLease,
     assertCurrent:async lease=>{if(stopping)throw Error('artifact_worker_stopped');return transport.assertCurrent(lease)},commitCanonical:transport.commitCanonical,readCanonical:transport.readCanonical});
    const completed=await lane.execute(id);
    return{state:'verified_artifact_job',invocationId:id,canonicalCommitVerified:completed.canonicalCommitVerified,companyBuildExecuted:false};
   }finally{if(id)transport.abandon(id);busy=false}
  }
 });
}
