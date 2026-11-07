import test from 'node:test';
import assert from 'node:assert/strict';
import {checkedCloudDocUrl,boundedCloudPublicDocs,digestPublicDocs} from
  '../../supabase/functions/command-center-safe-tools/cloud-public-docs.mjs';
const url='https://www.rfc-editor.org/rfc/rfc2549.txt';
test('exact host and HTTPS only, no credentials redirects or private endpoints',()=>{
 const denied=['http://www.rfc-editor.org/rfc/rfc2549.txt',
  'https://localhost/rfc/', 'https://127.0.0.1/rfc/',
  'https://www.rfc-editor.org.attacker.test/rfc/rfc2549.txt',
  'https://user:pass@www.rfc-editor.org/rfc/rfc2549.txt',
  'https://www.rfc-editor.org:8443/rfc/rfc2549.txt',
  'https://www.rfc-editor.org/private',
  'https://www.rfc-editor.org/rfc/rfc2549.txt?token=x',
  'https://www.rfc-editor.org/rfc/rfc2549.txt#x'
 ];
 for(const target of denied)assert.throws(()=>checkedCloudDocUrl(target));
 assert.equal(checkedCloudDocUrl(url).href,url);
});
test('refuses untrusted private or arbitrary host before starting egress',async()=>{
 let called=0;
 await assert.rejects(boundedCloudPublicDocs('https://localhost/private',{
  fetcher:async()=>{called++;throw Error('must not execute')}
 }),/docs_scope_denied/);
 assert.equal(called,0);
});
test('allowlisted public text returns exact SHA, no code execution or paid authority',async()=>{
 let settings;
 const result=await boundedCloudPublicDocs(url,{fetcher:async(_url,options)=>{
  settings=options;
  return new Response('hello',{status:200,headers:{'content-type':'text/plain'}});
 }});
 assert.equal(result.readSucceeded,true);
 assert.equal(result.sha256,await digestPublicDocs('hello'));
 assert.equal(result.excerpt,'hello');
 assert.equal(result.untrustedPublicContent,true);
 assert.equal(result.companyBuildStarted,false);
 assert.equal(result.generalCompanyExecution,false);
 assert.equal(result.paidUsageAuthorized,false);
 assert.equal(result.executed,false);
 assert.equal(settings.redirect,'manual');
 assert.equal(settings.credentials,'omit');
 assert.equal(settings.cache,'no-store');
});
test('never follows a redirect into a different domain',async()=>{
 const result=await boundedCloudPublicDocs(url,{fetcher:async()=>
  new Response(null,{status:302,headers:{location:'https://127.0.0.1/private'}})});
 assert.equal(result.readSucceeded,false);
 assert.equal(result.errorCode,'docs_redirect_denied');
});
test('non-text and oversize documents fail closed with no snippet persisted',async()=>{
 const binary=await boundedCloudPublicDocs(url,{fetcher:async()=>
  new Response('hello',{status:200,headers:{'content-type':'application/octet-stream'}})});
 assert.equal(binary.errorCode,'docs_text_required');
 const huge=await boundedCloudPublicDocs(url,{fetcher:async()=>
  new Response('a'.repeat(65537),{status:200,headers:{'content-type':'text/html'}})});
 assert.equal(huge.errorCode,'docs_body_limit');
 assert.equal(huge.excerpt,undefined);
});
test('absolute timeout interrupts an in-flight fetch attempt',async()=>{
 const reply=await boundedCloudPublicDocs(url,{timeoutMs:25,fetcher:(_,opts)=>
   new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}))});
 assert.equal(reply.readSucceeded,false);
 assert.equal(reply.errorCode,'docs_cloud_timeout');
});
test('unknown errors never disclose raw credentials or system stack',async()=>{
 const result=await boundedCloudPublicDocs(url,{fetcher:async()=>
  {throw Error('PRIVATE_SECRET_FROM_TLS_LAYER')}});
 assert.equal(result.readSucceeded,false);
 assert.equal(result.errorCode,'docs_cloud_unavailable');
 assert.equal(JSON.stringify(result).includes('PRIVATE_SECRET'),false);
});
