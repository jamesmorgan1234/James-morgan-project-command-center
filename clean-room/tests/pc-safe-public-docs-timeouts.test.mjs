import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readAllowedPublicDocs,executePcSafeReadOnly} from '../src/worker/pc-safe-readonly-tools.mjs';

const url='https://www.rfc-editor.org/rfc/rfc1149.txt';

test('nonresponsive DNS is bounded before any HTTPS request',async()=>{
 let httpsCalled=false;
 await assert.rejects(
   readAllowedPublicDocs(url,{
     dns:()=>new Promise(()=>{}),dnsTimeoutMs:25,
     https:()=>{httpsCalled=true;throw Error('HTTPS MUST NOT BE CALLED')}
   }),/docs_dns_timeout/);
 assert.equal(httpsCalled,false);
});

test('nonresponsive HTTPS is bounded and destroyed without a private fallback',async()=>{
 let destroyed=false,requestCount=0;
 const dns=async()=>[{family:4,address:'8.8.8.8'}];
 const https=(_options,callback)=>{
   requestCount++;
   const req=new EventEmitter();
   req.end=()=>{};
   req.destroy=()=>{destroyed=true;req.emit('error',Error('socket_closed'));};
   return req;
 };
 await assert.rejects(
   readAllowedPublicDocs(url,{dns,https,dnsTimeoutMs:25,httpsTimeoutMs:25}),/docs_timeout/);
 assert.equal(requestCount,1);
 assert.equal(destroyed,true);
});

test('public-doc DNS failures commit a sanitized negative receipt, not a fake success',async()=>{
 const response=JSON.parse(await executePcSafeReadOnly(
  'research.public_docs_read',JSON.stringify({url}),
  {readDocs:async()=>{throw Error('docs_dns_timeout')}}
 ));
 assert.deepEqual(response,{
   tool:'research.public_docs_read',readSucceeded:false,url,
   errorCode:'docs_dns_timeout',executed:false,paidUsageAuthorized:false,
   untrustedPublicContent:true,executedCompanyWork:false
 });
});

test('unknown raw transport errors cannot leak into canonical receipts',async()=>{
 const response=JSON.parse(await executePcSafeReadOnly(
  'research.public_docs_read',JSON.stringify({url}),
  {readDocs:async()=>{throw Error('private internal credential details')}}
 ));
 assert.equal(response.readSucceeded,false);
 assert.equal(response.errorCode,'docs_fetch_unavailable');
 assert.equal(JSON.stringify(response).includes('credential'),false);
});

test('unsafe URLs are denied before the read callback even on failed fetches',async()=>{
 let calls=0;
 await assert.rejects(executePcSafeReadOnly(
   'research.public_docs_read',
   JSON.stringify({url:'https://127.0.0.1/private'}),
   {readDocs:async()=>{calls++;return {}}}
 ),/docs_scope_denied/);
 assert.equal(calls,0);
});

test('verified public text still succeeds without company execution or paid usage',async()=>{
 const response=JSON.parse(await executePcSafeReadOnly(
  'research.public_docs_read',JSON.stringify({url}),
  {readDocs:async()=>({url,status:200,contentType:'text/plain',
    bytes:5,sha256:'2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    excerpt:'hello',untrustedPublicContent:true,executedCompanyWork:false})}
 ));
 assert.equal(response.readSucceeded,true);
 assert.equal(response.status,200);
 assert.equal(response.excerpt,'hello');
 assert.equal(response.executed,false);
 assert.equal(response.paidUsageAuthorized,false);
});
