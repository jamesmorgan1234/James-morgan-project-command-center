import test from 'node:test';
import assert from 'node:assert/strict';
import {requestGitHubRunnerProof} from '../../supabase/functions/command-center-execution/github-actions-dispatch.mjs';
const requestId='00000000-0000-4000-8000-000000000021';
const sourceSha='a'.repeat(40);
function mock({metadata={full_name:'jamesmorgan1234/James-morgan-project-command-center',private:false,visibility:'public',archived:false,disabled:false},
  failDispatch=false}={}) {
  const calls=[];
  const fetcher=async(url,opts)=>{
    calls.push({url,opts});
    if(opts.method==='GET') return Response.json(metadata);
    if(failDispatch) return Response.json({message:'not installed'}, {status:404});
    return Response.json({workflow_run_id:321});
  };
  return {calls,execute:()=>requestGitHubRunnerProof({token:'server-only-secret',requestId,sourceSha,fetcher})};
}
test('verified public repository launches isolated proof with no schedule, no false project receipt',async()=>{
  const m=mock();const res=await m.execute();
  assert.equal(res.dispatchAccepted,true);
  assert.equal(res.projectExecutionVerified,false);
  assert.equal(res.executionVerified,false);
  assert.equal(res.workflowRunId,321);
  assert.equal(res.scheduledFallback,false);
  assert.equal(m.calls.length,2);
  const post=m.calls[1];
  assert.match(post.url,/\/actions\/workflows\/cc-on-demand-runner-proof\.yml\/dispatches$/);
  assert.equal(post.opts.method,'POST');
  assert.equal(post.opts.redirect,'error');
  const body=JSON.parse(post.opts.body);
  assert.equal(body.ref,'build/cc-on-demand-no-schedule-isolated-20261105');
  assert.deepEqual(body.inputs,{request_id:requestId,source_sha:sourceSha});
  assert.ok(!post.opts.body.includes('objective'));
  assert.ok(!post.opts.body.includes('projectId'));
});
test('no secret or malformed request fails before any network access',async()=>{
  const m=mock();
  await assert.rejects(requestGitHubRunnerProof({token:'',requestId,sourceSha,fetcher:()=>{throw Error('network touched')}}), /credential_not_configured/);
  await assert.rejects(requestGitHubRunnerProof({token:'private',requestId:'untrusted',sourceSha,fetcher:()=>{throw Error('network touched')}}), /request_invalid/);
  await assert.rejects(requestGitHubRunnerProof({token:'private',requestId,sourceSha:'z'.repeat(40),fetcher:()=>{throw Error('network touched')}}), /sha_invalid/);
  assert.equal(m.calls.length,0);
});
test('private, mismatched, or archived repositories reject before dispatch',async()=>{
  for(const metadata of [
    {full_name:'jamesmorgan1234/James-morgan-project-command-center',private:true,visibility:'private'},
    {full_name:'different/repository',private:false,visibility:'public'},
    {full_name:'jamesmorgan1234/James-morgan-project-command-center',private:false,visibility:'public',archived:true}
  ]){
    const m=mock({metadata});
    await assert.rejects(m.execute(),/free_public_repository_not_verified/);
    assert.equal(m.calls.length,1);
  }
});
test('dispatch rejection is not represented as execution',async()=>{
  const m=mock({failDispatch:true});
  await assert.rejects(m.execute(),/github_dispatch_rejected/);
  assert.equal(m.calls.length,2);
});
