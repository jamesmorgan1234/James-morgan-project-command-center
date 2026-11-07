import test from 'node:test';
import assert from 'node:assert/strict';
import {createPcActivationExchangeTransport} from '../src/worker/pc-activation-exchange-transport.mjs';
const id='d9b63121-41f0-4510-a181-1cd2fd638bef';
const token='ccpc_'+'a'.repeat(64);
const claim={saved:{exchangeId:id},lease:{exchangeId:id,fencingToken:1}};
function mock(){const calls=[]; const fetcher=async(url,opts)=>{
 calls.push({url,opts});const action=url.slice(url.lastIndexOf('/')+1);
 return {ok:true,json:async()=>({result:action.endsWith('-next')?claim:action.endsWith('-current')?{current:true}:action.endsWith('-readback')?{receipt:{verified:true}}:true})};
 };return{transport:createPcActivationExchangeTransport({workerToken:token,fetcher}),calls}}
test('transport uses pinned worker-authenticated gateway and no-spend admission',async()=>{
 const {transport,calls}=mock();
 const c=await transport.next();await transport.assertCurrent(c.lease);await transport.commit(c.lease,{outputHash:'a'.repeat(64)});await transport.readback(c.lease);transport.abandon(id);
 assert.equal(calls.length,4);
 for(const call of calls){assert.equal(call.opts.method,'POST');assert.equal(call.opts.headers['x-command-center-worker-token'],token);
  const body=JSON.parse(call.opts.body);assert.equal(body.clientContract,'cc-pc-activation-exchange-v1');
  assert.equal(body.executionAuthorized,false);assert.equal(body.allowPaid,false);assert.equal(body.companyBuildAuthorized,false);
  assert.ok(call.url.startsWith('https://gmlsucpwliegwlxymjvp.supabase.co/functions/v1/command-center-pc-worker/activation-exchange-'))}
});
test('transport refuses missing claim and stale fence',async()=>{
 assert.throws(()=>createPcActivationExchangeTransport({workerToken:'x',fetcher:()=>{}}));
 const {transport}=mock();const claim=await transport.next();await assert.rejects(()=>transport.next(),/one_activation_exchange_at_a_time/);
 await assert.rejects(()=>transport.assertCurrent({...claim.lease,fencingToken:2}),/activation_exchange_fence_changed/);
 transport.abandon(id);await assert.rejects(()=>transport.readback(claim.lease),/activation_exchange_not_claimed/);
});
