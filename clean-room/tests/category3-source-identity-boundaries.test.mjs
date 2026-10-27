import test from 'node:test';
import assert from 'node:assert/strict';
import {SourceRegistry} from '../dist/data/index.js';
test('source identity tuple encoding cannot collide or silently reassign delimiter-bearing scopes',()=>{
 const source={id:'source:one',providerKey:'provider:test',sourceType:'document',externalStableId:'external',scope:{ownerId:'owner',companyId:'a|b',projectId:'c'},trust:'verified_provider',instructionPolicy:'data_only',sensitivity:'internal',purpose:['read'],retentionClass:'standard',lifecycle:'active',version:1,createdAt:'2026-10-27T00:00:00Z',updatedAt:'2026-10-27T00:00:00Z'};
 const registry=new SourceRegistry();registry.register(source);
 const other={...source,id:'source:two',scope:{ownerId:'owner',companyId:'a',projectId:'b|c'}};
 registry.register(other);assert.equal(registry.list().length,2);
 assert.throws(()=>registry.replace({...source,version:2,scope:other.scope},1), /scope/);
 for(const changes of [{trust:'future'},{sensitivity:'future'},{lifecycle:'future'},{instructionPolicy:'future'},{scope:{ownerId:'owner',environment:'future'}}]) assert.throws(()=>registry.register({...source,id:'source:bad',...changes}), /Unsupported/);
});
