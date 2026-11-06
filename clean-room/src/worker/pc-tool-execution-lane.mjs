import {createBrainToolRuntime} from '../brain/tool-runtime.js';
import {createPcToolJournal} from './pc-tool-journal.mjs';
import {createPcProjectArtifactHandlers} from './pc-project-file-tool.mjs';
import {createHash} from 'node:crypto';
const ensure=(ok,code)=>{if(!ok)throw Error(code)};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

/**
 * Explicit integration entry for an existing, authenticated job transport.
 * No polling, new worker, inferred authority, model-controlled paths, or
 * read-only PC-token elevation. Missing canonical adapters fail at startup.
 */
export async function createPcToolExecutionLane({workspace,journalRoot,resolve,catalog,createLease,assertCurrent,commitCanonical,readCanonical,now=()=>new Date().toISOString()}){
 ensure([resolve,catalog,createLease,assertCurrent,commitCanonical,readCanonical,now].every(f=>typeof f==='function'),'canonical_job_transport_not_connected');
 const bound=structuredClone(workspace);
 const handlers=await createPcProjectArtifactHandlers(bound);
 const journal=await createPcToolJournal({root:journalRoot,createLease,assertCurrent});
 const scopedResolve=async id=>{
  const saved=await resolve(id),a=saved?.action;
  ensure(a?.ownerId===bound.ownerId&&a?.projectId===bound.projectId&&a?.companyId===bound.companyId&&a?.accountRef===bound.accountRef,'saved_job_workspace_mismatch');
  return saved;
 };
 const runtime=createBrainToolRuntime({resolve:scopedResolve,catalog,assertCurrent,now,
  sha256:async s=>createHash('sha256').update(s).digest('hex'),...journal},handlers);
 return Object.freeze({
  async execute(invocationId){
   const result=await runtime.execute(invocationId);
   // The local journal survives a lost canonical commit response. Retrying
   // submits this SAME immutable receipt; it never repeats the file effect.
   await commitCanonical(structuredClone(result));
   const receipt=await readCanonical(invocationId);
   const l=result.lease;
   ensure(receipt?.invocationId===invocationId&&receipt?.taskId===l.taskId&&receipt?.workerId===l.workerId&&
    receipt?.ownerId===l.ownerId&&receipt?.projectId===l.projectId&&receipt?.companyId===l.companyId&&
    receipt?.generation===l.generation&&receipt?.fencingToken===l.fencingToken&&receipt?.inputHash===result.inputHash&&
    receipt?.toolKey===result.toolKey&&receipt?.actionKey===result.actionKey&&receipt?.toolVersion===result.toolVersion&&
    receipt?.outputHash===result.outputHash&&UUID.test(receipt?.commitId??'')&&
    typeof receipt?.resultRef==='string'&&receipt.resultRef.trim().length>0&&receipt.resultRef.length<=1000&&
    receipt?.canonicalCommitVerified===true,'canonical_tool_result_not_verified');
   return Object.freeze({result,canonicalCommitVerified:true});
  }
 });
}
