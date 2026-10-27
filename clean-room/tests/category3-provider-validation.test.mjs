import test from 'node:test';
import assert from 'node:assert/strict';
import {ProviderRegistry} from '../dist/data/index.js';
const provider={key:'provider:one',version:1,enabled:true,authMode:'none',capabilities:['read'],scopes:[],freshnessSeconds:60,cost:'free',health:'available',verification:'tool_result',failureMode:'fail_closed'};
test('provider substitution preserves domain independence and malformed contracts fail before mutation',()=>{
 const registry=new ProviderRegistry();registry.register(provider);
 for(const changes of [{enabled:'true'},{authMode:'future'},{cost:'future'},{health:'future'},{verification:'future'},{failureMode:'future'},{capabilities:['']},{scopes:['']}]){
  assert.throws(()=>registry.replace({...provider,version:2,...changes},1));assert.equal(registry.get(provider.key).version,1);
 }
 registry.register({...provider,key:'provider:two'});
 registry.replace({...provider,enabled:false,version:2},1);
 assert.deepEqual(registry.forCapability('read').map(x=>x.key),['provider:two']);
 registry.remove(provider.key,2);
 assert.equal(registry.get(provider.key),undefined);
});
