import test from 'node:test';
import assert from 'node:assert/strict';
import {rebuildProjection,assertProviderReplacement} from '../dist/data/index.js';
test('recovery rejects empty event identity and unknown-cost replacement while deterministic replay is stable',()=>{
 assert.throws(()=>rebuildProjection([{sequence:1,eventId:' ',payloadHash:'hash'}]), /identity/);
 const events=Array.from({length:5000},(_,i)=>({sequence:i+1,eventId:`event-${i}`,payloadHash:`hash-${i}`}));
 assert.deepEqual(rebuildProjection(events),rebuildProjection(events));
 const provider={key:'provider:old',version:1,enabled:true,authMode:'none',capabilities:['read'],scopes:[],freshnessSeconds:60,cost:'free',health:'available',verification:'tool_result',failureMode:'fail_closed'};
 assert.throws(()=>assertProviderReplacement(provider,{...provider,key:'provider:new',cost:'unknown'},['read'],true), /free-first/);
 assert.doesNotThrow(()=>assertProviderReplacement(provider,{...provider,key:'provider:new'},['read'],true));
 assert.equal(provider.key,'provider:old');
});
