import assert from 'node:assert/strict';
import test from 'node:test';
import {createExecutionHandler} from '../../supabase/functions/command-center-execution/handler.mjs';

const base='https://gmlsucpwliegwlxymjvp.supabase.co';
const requestId='00000000-0000-4000-8000-000000000099';
const sourceSha='a'.repeat(40);
function harness({credential='',authorized=true}={}) {
  const upstreamCalls=[],githubCalls=[];
  const fetcher=async(url,init)=>{
    const path=new URL(url).pathname;
    upstreamCalls.push({path,init});
    assert.equal(new URL(url).origin,base);
    if(path==='/auth/v1/user') return Response.json({id:'owner-1'});
    if(path.endsWith('/is_command_center_authorized')) return Response.json(authorized);
    throw Error('Unexpected Supabase read: ' + path);
  };
  const githubFetcher=async(url,init)=>{
    githubCalls.push({url,init});
    if(init.method==='GET') return Response.json({
      full_name:'jamesmorgan1234/James-morgan-project-command-center',
      private:false,visibility:'public',archived:false,disabled:false
    });
    if(init.method==='POST') return Response.json({workflow_run_id:321});
    throw Error('Unsupported GitHub action');
  };
  const handler=createExecutionHandler({supabaseUrl:base,publishableKey:'public-key',
    fetcher,githubFetcher,githubActionsToken:credential});
  const call=(request={})=>handler(new Request(base+'/functions/v1/command-center-execution',{
    method:'POST',headers:{authorization:'Bearer owner-session','content-type':'application/json'},
    body:JSON.stringify({action:'runner_probe',requestId,sourceSha,...request})
  }));
  return {call,upstreamCalls,githubCalls};
}

test('authenticated isolated probe can dispatch with a server-only token but never claims project execution',async()=>{
  const h=harness({credential:'server-only-token'});
  const response=await h.call();
  assert.equal(response.status,202);
  const receipt=await response.json();
  assert.equal(receipt.capability,'repository.source_attestation');
  assert.equal(receipt.dispatchAccepted,true);
  assert.equal(receipt.projectExecutionVerified,false);
  assert.equal(receipt.executionVerified,false);
  assert.equal(receipt.workflowRunId,321);
  assert.equal(h.githubCalls.length,2);
  assert.equal(h.githubCalls[1].init.headers.authorization,'Bearer server-only-token');
  assert.ok(!h.githubCalls[1].init.body.includes('company'));
});

test('without server-side dispatch credential, probe fails closed before GitHub access',async()=>{
  const h=harness();
  const response=await h.call();
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'github_dispatch_credential_not_configured');
  assert.equal(h.githubCalls.length,0);
});
test('non-owner fails before GitHub access even with server-side credential',async()=>{
  const h=harness({credential:'server-only-token',authorized:false});
  const response=await h.call();
  assert.equal(response.status,403);
  assert.equal((await response.json()).error,'unauthorized');
  assert.equal(h.githubCalls.length,0);
});
test('untrusted source revision fails closed without GitHub dispatch',async()=>{
  const h=harness({credential:'server-only-token'});
  const response=await h.call({sourceSha:'not-a-commit'});
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'github_dispatch_sha_invalid');
  assert.equal(h.githubCalls.length,0);
});
