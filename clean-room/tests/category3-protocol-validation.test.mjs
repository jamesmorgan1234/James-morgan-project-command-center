import test from 'node:test';
import assert from 'node:assert/strict';
import {ProtocolAdapterRegistry} from '../dist/data/index.js';
test('unsupported protocol contracts never become routable and removing adapter preserves other adapters',()=>{
 const registry=new ProtocolAdapterRegistry();const adapter={key:'protocol:one',version:1,enabled:true,protocol:'mcp',capabilities:['read'],securityRouteKey:'security.route'};
 for(const changes of [{protocol:'future'},{enabled:'true'},{capabilities:['']},{capabilities:['read','read']}]) assert.throws(()=>registry.register({...adapter,...changes}));
 assert.equal(registry.forCapability('read').length,0);
 registry.register(adapter);registry.register({...adapter,key:'protocol:two',protocol:'a2a'});
 registry.remove(adapter.key,1);assert.deepEqual(registry.forCapability('read').map(x=>x.key),['protocol:two']);
});
