// Immediate, owner-gated Agency dispatch. No ChatGPT Tasks scheduling or polling.
// The caller authenticates the owner. Only a healthy, free, same-Supabase
// function with a real worker-claim receipt can satisfy Start.
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const DIGEST=/^[a-f0-9]{64}$/;
const COMPANY=/^project:company:future:(\d{3})$/;
const EDGE=/^supabase-function:([a-z][a-z0-9-]{0,80})$/;
export class ImmediateDispatchError extends Error{
  constructor(code,status=409){super(code);this.status=status;}
}
const check=(condition,code,status)=>{if(!condition)throw new ImmediateDispatchError(code,status)};
const one=async(read,table,params,code)=>{
  const value=await read(table,{...params,limit:'1'});
  check(Array.isArray(value)&&value.length===1,code,404);
  return value[0];
};
export function isOnDemandScopedProject(projectId){
  if(typeof projectId!=='string'||projectId.length<1||projectId.length>240)return false;
  if(COMPANY.test(projectId)){
    const n=Number(COMPANY.exec(projectId)[1]);
    return n>=1&&n<=117&&n!==14;
  }
  return !projectId.startsWith('project:company:future:')&&/^[a-z][a-z0-9_-]{0,120}$/.test(projectId);
}
const bookReviewPolicy=Object.freeze({
  workflow:'book_editorial_quality_review',
  substantiveRevision:true,
  humanVoiceReview:true,
  proofread:true,
  continuityAndFactChecks:true,
  verifySourceManuscript:true,
  authorDefault:'James Morgan',
  publicationAuthorized:false,
  coverApprovedByThisRun:false,
  externalDistributionAuthorized:false,
  paidToolsAuthorized:false
});
function matchingExecutor(executor,type,required){
  const match=EDGE.exec(executor?.executor_ref??'');
  return match&&match[1]!=='command-center-execution'&&executor.enabled===true&&
    executor.health==='available'&&executor.cost_class==='free'&&executor.retired_at===null&&
    Array.isArray(executor.environments)&&executor.environments.includes('deterministic')&&
    Array.isArray(executor.project_type_keys)&&
    (executor.project_type_keys.length===0||executor.project_type_keys.includes(type))&&
    Array.isArray(executor.capabilities)&&required.every(c=>executor.capabilities.includes(c))&&
    ['read_only','propose','execute_reversible'].includes(executor.authority_class);
}

export async function dispatchImmediately({
  projectId,objective,requestId,readRows,readiness,invoke,now=()=>Date.now()
}){
  // Exclude the separately controlled project BEFORE ANY project-specific read.
  check(isOnDemandScopedProject(projectId),'project_outside_immediate_scope',403);
  check(typeof objective==='string'&&objective.trim().length>=1&&objective.trim().length<=4000&&
    UUID.test(requestId??''),'invalid_start',400);
  check(typeof readRows==='function'&&typeof readiness==='function'&&
    typeof invoke==='function','execution_adapter_missing',503);
  const project=await one(readRows,'command_center_project_profiles',{
    project_id:'eq.'+projectId,select:'project_id,company_id,type_key,status'
  },'project_not_available');
  check(project.project_id===projectId&&typeof project.type_key==='string'&&
    project.type_key.length>0,'project_identity_mismatch',403);
  const isFuture=COMPANY.test(projectId);
  if(isFuture)check(project.company_id==='company:future:'+COMPANY.exec(projectId)[1]&&
    project.status==='active','company_not_prepared',409);
  const isBook=project.type_key==='project-type:book';
  // The book must be explicitly unpublished (or a manuscript still being written);
  // mixed/published catalogs are not safe implicit editorial scope.
  if(isBook){
    check(!/\bpublished\b/i.test(project.status??''),'published_book_requires_separate_scope',409);
    check(/unpublished|writing in progress/i.test(project.status??''),
      'book_unpublished_scope_not_verified',409);
  }
  check(!/(^paused$|^blocked$|owner review required|compliance.gated)/i.test(project.status??''),
    'project_hold_requires_owner_review',409);

  const capabilities=isBook?['project.execute','book.editorial.review']:['project.execute'];
  const all=await readRows('command_center_agency_executors',{
    enabled:'eq.true',cost_class:'eq.free',health:'eq.available',retired_at:'is.null',
    select:'executor_key,executor_ref,enabled,health,cost_class,retired_at,environments,capabilities,project_type_keys,authority_class',
    order:'executor_key.asc',limit:'200'
  });
  check(Array.isArray(all),'executor_registry_unavailable',503);
  const worker=all.find(e=>matchingExecutor(e,project.type_key,capabilities));
  // No scheduled-Task fallback. An unavailable direct executor must never
  // create a queue entry and then pretend Start has begun.
  check(worker,'no_verified_free_immediate_executor',503);

  let next=null;
  if(isFuture){
    const roadmap=await one(readRows,'command_center_project_roadmaps',{
      project_id:'eq.'+projectId,state:'eq.current',
      select:'version,state,structure_verified'
    },'roadmap_not_available');
    check(roadmap.structure_verified===true&&Number.isSafeInteger(Number(roadmap.version)),'roadmap_not_verified',409);
    const cp=await one(readRows,'command_center_project_checkpoints',{
      project_id:'eq.'+projectId,roadmap_version:'eq.'+roadmap.version,
      select:'checkpoint_id,exact_next_work_unit_id',order:'created_at.desc'
    },'checkpoint_not_available');
    check(cp.exact_next_work_unit_id?.startsWith(projectId+':'),'checkpoint_inconsistent',409);
    const ready=await readiness({
      p_project_id:projectId,p_roadmap_version:roadmap.version,
      p_work_unit_id:cp.exact_next_work_unit_id
    });
    check(ready?.ready===true,'next_task_not_ready',409);
    next={roadmapVersion:roadmap.version,checkpointId:cp.checkpoint_id,workUnitId:cp.exact_next_work_unit_id};
  }
  const runId='agency-run:'+requestId;
  const payload={
    action:'agency_start',projectId,projectType:project.type_key,
    runId,requestId,objective:objective.trim(),executorKey:worker.executor_key,
    authorizationRef:'owner:on-demand-start:'+runId,
    controlMode:'next_step',next,allowPaid:false,allowProtected:false,
    ownerMayPublish:false,ownerMayApproveCover:false,
    ...(isBook?{bookReviewPolicy}:{})
  };
  // A lost response is an uncertain side effect: NEVER auto-retry.
  await invoke(worker.executor_ref,payload);
  const run=await one(readRows,'command_center_agency_runs',{
    project_id:'eq.'+projectId,run_id:'eq.'+runId,
    select:'run_id,project_id,objective,authorization_ref,control_mode,state,generation,stop_requested,pause_requested'
  },'execution_receipt_missing');
  check(run.project_id===projectId&&run.run_id===runId&&
    run.objective===objective.trim()&&
    run.authorization_ref==='owner:on-demand-start:'+runId&&
    run.control_mode==='next_step'&&
    run.stop_requested!==true&&run.pause_requested!==true,
    'execution_receipt_invalid',503);
  const tasks=await readRows('command_center_agency_tasks',{
    project_id:'eq.'+projectId,run_id:'eq.'+runId,
    select:'task_id,run_id,state,evidence_refs',limit:'200'
  });
  check(Array.isArray(tasks)&&tasks.length>0,'execution_task_not_persisted',503);
  const t=now();
  if(run.state==='working'){
    const claims=await readRows('command_center_agency_task_claims',{
      project_id:'eq.'+projectId,status:'eq.claimed',
      select:'task_id,worker_id,heartbeat_at,expires_at',limit:'200'
    });
    const matched=Array.isArray(claims)?claims.find(c=>
      tasks.some(task=>task.task_id===c.task_id&&task.state==='working')&&
      c.worker_id===worker.executor_key&&
      Date.parse(c.expires_at)>t&&Date.parse(c.heartbeat_at)<=t&&
      t-Date.parse(c.heartbeat_at)<60000):null;
    check(matched,'worker_claim_not_verified',503);
    return Object.freeze({projectId,runId,state:'working',
      taskId:matched.task_id,executorKey:worker.executor_key,
      immediateExecutionVerified:true,scheduledFallback:false,
      bookReview:isBook,publicationAuthorized:false});
  }
  if(run.state==='completed'){
    const verified=tasks.filter(task=>task.state==='verified');
    check(verified.length>0,'completed_task_not_verified',503);
    const commits=await readRows('command_center_agency_task_commits',{
      project_id:'eq.'+projectId,
      select:'task_id,worker_id,result_ref,result_hash,evidence_refs',limit:'200'
    });
    const committed=Array.isArray(commits)?commits.find(c=>
      verified.some(task=>task.task_id===c.task_id)&&c.worker_id===worker.executor_key&&
      typeof c.result_ref==='string'&&c.result_ref.length>0&&
      DIGEST.test(c.result_hash??'')&&
      Array.isArray(c.evidence_refs)&&c.evidence_refs.length>0):null;
    check(committed,'completion_evidence_not_verified',503);
    return Object.freeze({projectId,runId,state:'completed',
      taskId:committed.task_id,executorKey:worker.executor_key,
      immediateExecutionVerified:true,scheduledFallback:false,
      bookReview:isBook,publicationAuthorized:false});
  }
  throw new ImmediateDispatchError('execution_not_verified',503);
}

/** Resume an existing owner-authorized run immediately. Never create another
 * run or queue it for a schedule; retain its original run identity and state.
 */
export async function resumeImmediately({
  projectId,runId,expectedGeneration,requestId,readRows,invoke,now=()=>Date.now()
}){
  check(isOnDemandScopedProject(projectId),'project_outside_immediate_scope',403);
  check(typeof runId==='string'&&/^agency-run:[a-zA-Z0-9._:-]{1,220}$/.test(runId)&&
    Number.isSafeInteger(expectedGeneration)&&expectedGeneration>=1&&
    UUID.test(requestId??''),'invalid_continue',400);
  check(typeof readRows==='function'&&typeof invoke==='function','execution_adapter_missing',503);
  const project=await one(readRows,'command_center_project_profiles',{
    project_id:'eq.'+projectId,select:'project_id,company_id,type_key,status'
  },'project_not_available');
  check(project.project_id===projectId&&typeof project.type_key==='string',
    'project_identity_mismatch',403);
  const isBook=project.type_key==='project-type:book';
  if(isBook){
    check(!/\bpublished\b/i.test(project.status??''),
      'published_book_requires_separate_scope',409);
    check(/unpublished|writing in progress/i.test(project.status??''),
      'book_unpublished_scope_not_verified',409);
  }
  check(!/(^paused$|^blocked$|owner review required|compliance.gated)/i.test(project.status??''),
    'project_hold_requires_owner_review',409);
  const previous=await one(readRows,'command_center_agency_runs',{
    project_id:'eq.'+projectId,run_id:'eq.'+runId,
    select:'run_id,project_id,state,control_mode,authorization_ref,generation,stop_requested,pause_requested,objective'
  },'run_not_available');
  check(previous.project_id===projectId&&previous.run_id===runId&&
    ['blocked','needs_user'].includes(previous.state)&&
    ['next_step','until_work'].includes(previous.control_mode)&&
    ['owner:on-demand-start:'+runId,'owner:normal-chat-start:'+runId].includes(previous.authorization_ref)&&
    Number(previous.generation)===expectedGeneration&&
    previous.stop_requested!==true&&previous.pause_requested!==true,
    'run_not_eligible_to_continue',409);
  const workerList=await readRows('command_center_agency_executors',{
    enabled:'eq.true',cost_class:'eq.free',health:'eq.available',retired_at:'is.null',
    select:'executor_key,executor_ref,enabled,health,cost_class,retired_at,environments,capabilities,project_type_keys,authority_class',
    order:'executor_key.asc',limit:'200'
  });
  const needed=isBook?['project.execute','book.editorial.review']:['project.execute'];
  const worker=Array.isArray(workerList)?
    workerList.find(e=>matchingExecutor(e,project.type_key,needed)):null;
  check(worker,'no_verified_free_immediate_executor',503);
  await invoke(worker.executor_ref,{
    action:'agency_continue',projectId,projectType:project.type_key,runId,
    expectedGeneration,requestId,executorKey:worker.executor_key,
    originalControlMode:previous.control_mode,allowPaid:false,
    allowProtected:false,ownerMayPublish:false,ownerMayApproveCover:false,
    ...(isBook?{bookReviewPolicy}:{})
  });
  // Re-read canonical durable state after the direct worker call.
  const current=await one(readRows,'command_center_agency_runs',{
    project_id:'eq.'+projectId,run_id:'eq.'+runId,
    select:'run_id,project_id,state,generation,stop_requested,pause_requested'
  },'continued_run_not_persisted');
  check(current.project_id===projectId&&current.run_id===runId&&
    ['working','completed'].includes(current.state)&&
    Number(current.generation)>=expectedGeneration&&
    current.stop_requested!==true&&current.pause_requested!==true,
    'continue_not_verified',503);
  const tasks=await readRows('command_center_agency_tasks',{
    project_id:'eq.'+projectId,run_id:'eq.'+runId,
    select:'task_id,state',limit:'200'
  });
  check(Array.isArray(tasks)&&tasks.length>0,'continue_task_missing',503);
  const t=now();
  if(current.state==='working'){
    const claims=await readRows('command_center_agency_task_claims',{
      project_id:'eq.'+projectId,status:'eq.claimed',
      select:'task_id,worker_id,expires_at,heartbeat_at',limit:'200'
    });
    const matched=Array.isArray(claims)?claims.find(c=>
      tasks.some(t=>t.task_id===c.task_id&&t.state==='working')&&
      c.worker_id===worker.executor_key&&
      Date.parse(c.expires_at)>t&&Date.parse(c.heartbeat_at)<=t&&
      t-Date.parse(c.heartbeat_at)<60000):null;
    check(matched,'continued_claim_not_verified',503);
    return Object.freeze({projectId,runId,state:'working',taskId:matched.task_id,
      executorKey:worker.executor_key,immediateExecutionVerified:true,
      scheduledFallback:false,publishAuthorized:false});
  }
  const verified=tasks.filter(task=>task.state==='verified');
  check(verified.length>0,'continue_completion_unverified',503);
  const commits=await readRows('command_center_agency_task_commits',{
    project_id:'eq.'+projectId,
    select:'task_id,worker_id,result_ref,result_hash,evidence_refs',limit:'200'
  });
  const receipt=Array.isArray(commits)?commits.find(c=>
    verified.some(t=>t.task_id===c.task_id)&&
    c.worker_id===worker.executor_key&&
    typeof c.result_ref==='string'&&c.result_ref.length>0&&
    DIGEST.test(c.result_hash??'')&&Array.isArray(c.evidence_refs)&&c.evidence_refs.length>0):null;
  check(receipt,'continue_completion_unverified',503);
  return Object.freeze({projectId,runId,state:'completed',taskId:receipt.task_id,
    executorKey:worker.executor_key,immediateExecutionVerified:true,
    scheduledFallback:false,publishAuthorized:false});
}
