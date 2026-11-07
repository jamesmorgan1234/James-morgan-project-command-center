import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {canonicalPublicDocsUrl,publicIpv4,executePcSafeReadOnly,readAllowedPublicDocs} from '../src/worker/pc-safe-readonly-tools.mjs';
import {createPcSafeToolTransport} from '../src/worker/pc-safe-tool-transport.mjs';
import {createPcSafeToolRunner} from '../src/worker/pc-safe-tool-runner.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex');
const ownerId='7ab6909d-f4bc-451a-b4c5-0512327a3f22';
const workerId='737f5e7c-3884-4c61-81ac-634bdfc4828f';
const jobId='02ef1851-76ec-4820-a7b9-6b2285dce49a';
const projectId='project:company:future:014';
const companyId='company:future:014';
const brainKey='brain:company:future:014:v1';
const inputText=JSON.stringify({source:'const a=1+2;'});
function fixture(){
 const saved={jobId,ownerId,workerId,projectId,companyId,brainKey,brainVersion:2,
   actionKey:'code.js_syntax_check',inputText,inputHash:hash(inputText),toolVersion:'safe-readonly-v1'};
 const lease={jobId,ownerId,workerId,projectId,companyId,actionKey:saved.actionKey,
  fencingToken:1,generation:1,expiresAt:new Date(Date.now()+130000).toISOString()};
 return {saved,lease};
}
test('public docs allowlist rejects private hosts, credentials, non-HTTPS, ports, and unsafe paths',()=>{
 for(const url of ['http://nodejs.org/api/fs.html','https://localhost/api/',
   'https://nodejs.org.evil.example/api/fs.html','https://nodejs.org:8443/api/',
   'https://user:password@developer.mozilla.org/en-US/docs/',
   'https://docs.python.org/private/','https://127.0.0.1/']) {
   assert.throws(()=>canonicalPublicDocsUrl(url));
 }
 assert.equal(canonicalPublicDocsUrl('https://nodejs.org/api/fs.html').hostname,'nodejs.org');
});
test('only publicly routable IPv4 is eligible for allowlisted docs requests',()=>{
 for(const ip of ['0.0.0.0','127.0.0.1','10.2.0.1','172.30.1.1','192.168.3.5',
   '169.254.1.5','198.18.0.1','100.64.1.1','192.0.2.3','198.51.100.1',
   '203.0.113.2','8.8.8.8.evil'])assert.equal(publicIpv4(ip),false);
 assert.equal(publicIpv4('8.8.8.8'),true);
});
test('DNS fail-closed prevents any HTTPS request to private space',async()=>{
 let sent=false;
 await assert.rejects(readAllowedPublicDocs('https://nodejs.org/api/fs.html',{
   dns:async()=>[{family:4,address:'127.0.0.1'}],https:()=>{sent=true;throw Error('network sent')}
 }),/docs_public_dns_required/);
 assert.equal(sent,false);
});
test('syntax check compiles but does not execute supplied code',async()=>{
 globalThis.__cc_potential_execution=false;
 const reply=JSON.parse(await executePcSafeReadOnly('code.js_syntax_check',
    JSON.stringify({source:'globalThis.__cc_potential_execution=true;'})));
 assert.equal(reply.syntaxValid,true);assert.equal(reply.executed,false);
 assert.equal(globalThis.__cc_potential_execution,false);
 delete globalThis.__cc_potential_execution;
 const bad=JSON.parse(await executePcSafeReadOnly('code.js_syntax_check',JSON.stringify({source:'let = ;'})));
 assert.equal(bad.syntaxValid,false);assert.equal(bad.errorCode,'javascript_syntax_error');
 assert.match(reply.sourceHash,/^[a-f0-9]{64}$/);
});
test('read-only research receipts are always marked as untrusted, with no execution',async()=>{
 const url='https://developer.mozilla.org/en-US/docs/Web/JavaScript';
 const raw=await executePcSafeReadOnly('research.public_docs_read',JSON.stringify({url}),
  {readDocs:async provided=>({url:provided,status:200,contentType:'text/html',
     bytes:5,sha256:hash('hello'),excerpt:'hello',untrustedPublicContent:true,executedCompanyWork:false})});
 const output=JSON.parse(raw);assert.equal(output.untrustedPublicContent,true);
 assert.equal(output.executed,false);assert.equal(output.paidUsageAuthorized,false);
 await assert.rejects(executePcSafeReadOnly('research.public_docs_read',
   JSON.stringify({url:'https://127.0.0.1/private'}),{readDocs:async()=>{throw Error('SHOULD_NOT_RUN')}}));
});
test('isolated transport pins worker, action, fence and includes no spending authority',async()=>{
 const {saved,lease}=fixture();let calls=[];
 const fetcher=async(_url,options)=>{
   const req=JSON.parse(options.body);calls.push(req);
   assert.equal(req.allowPaid,false);assert.equal(req.allowProtected,false);
   assert.equal(req.companyBuildAuthorized,false);
   assert.equal(req.clientContract,'cc-pc-safe-tools-v1');
   return {ok:true,json:async()=>({result:req.action==='worker-next'?{saved,lease}:
      req.action==='worker-current'?{current:true}:
      req.action==='worker-commit'?{committed:true}:
      {jobId,state:'completed',fencingToken:1,commitId:'aa4bdacf-01a1-4857-adb5-918ed13c8821',canonicalCommitVerified:true,result:req.result}})};
 };
 const t=createPcSafeToolTransport({workerToken:'ccpc_'+'a'.repeat(64),fetcher});
 assert.deepEqual(await t.next(),{saved,lease});
 await t.current(lease);await t.commit(lease,{jobId});await t.readback(lease);
 t.abandon(jobId);
 assert.deepEqual(calls.map(c=>c.action),['worker-next','worker-current','worker-commit','worker-readback']);
});
test('one safe tool claim gets exactly one fenced commit and canonical readback',async()=>{
 const {saved,lease}=fixture();const calls=[];let actual=null;
 const transport={
  next:async()=>{calls.push('next');return{saved,lease}},
  current:async()=>{calls.push('current')},
  commit:async(_lease,result)=>{calls.push('commit');actual=result},
  readback:async()=>{calls.push('readback');return{jobId,state:'completed',fencingToken:1,
     commitId:'aa4bdacf-01a1-4857-adb5-918ed13c8821',canonicalCommitVerified:true,
     result:Object.fromEntries(Object.entries(actual).reverse())}},
  abandon:()=>calls.push('abandon')
 };
 const runner=createPcSafeToolRunner({transport,execute:executePcSafeReadOnly});
 const out=await runner.once();
 assert.equal(out.state,'verified_safe_tool_job');
 assert.equal(out.canonicalCommitVerified,true);
 assert.equal(actual.companyBuildStarted,false);
 assert.equal(actual.paidUsageAuthorized,false);
 assert.equal(actual.generalCompanyExecution,false);
 assert.equal(actual.inputHash,saved.inputHash);
 assert.equal(actual.outputHash,hash(actual.outputText));
 assert.deepEqual(calls,['next','current','current','commit','readback','abandon']);
});
test('wrong-company scope is rejected before tool invocation',async()=>{
 const {saved,lease}=fixture();let committed=false,executed=false;
 const runner=createPcSafeToolRunner({transport:{
    next:async()=>({saved:{...saved,companyId:'company:future:013'},lease}),
    current:async()=>{},commit:async()=>{committed=true},
    readback:async()=>{},abandon:()=>{}
  },execute:async()=>{executed=true;return '{}'}});
 await assert.rejects(runner.once(),/safe_tool_owner_project_fence_mismatch/);
 assert.equal(executed,false);assert.equal(committed,false);
});
test('no canonical proof means no verified tool result',async()=>{
 const {saved,lease}=fixture();let committed=false;
 const runner=createPcSafeToolRunner({transport:{
    next:async()=>({saved,lease}),current:async()=>{},commit:async()=>{committed=true},
    readback:async()=>({state:'completed',canonicalCommitVerified:false}),abandon:()=>{}
  },execute:executePcSafeReadOnly});
 await assert.rejects(runner.once(),/safe_tool_canonical_readback_mismatch/);
 assert.equal(committed,true);
});
