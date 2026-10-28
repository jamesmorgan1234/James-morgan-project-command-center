import test from 'node:test';import assert from 'node:assert/strict';import {AssetRegistry} from '../dist/data/assets.js';
const initial=()=>({id:'asset:synthetic-p151',ownerId:'owner:synthetic',projectId:'project:synthetic-a',name:'Synthetic fixture only',sha256:'a'.repeat(64),version:1,sensitivity:'protected',originalState:'available',approvalState:'locked',sourceRef:'test:synthetic-fixture',createdAt:'2026-10-28T00:00:00Z',updatedAt:'2026-10-28T00:00:00Z'});
const replacement=patch=>({...initial(),version:2,sha256:'b'.repeat(64),updatedAt:'2026-10-28T00:01:00Z',...patch});
test('P15.1 locked synthetic asset rejects truthy nonboolean replacement authority without changing its identity',()=>{
 for(const authorized of ['false','true',1,{},null,undefined,false]){const registry=new AssetRegistry();registry.register(initial());assert.throws(()=>registry.replace(replacement(),1,{authorized,ownerDecisionRef:'owner:synthetic-decision'}),/explicit owner decision/);assert.equal(registry.get('asset:synthetic-p151').sha256,'a'.repeat(64));assert.equal(registry.get('asset:synthetic-p151').version,1);}
});
test('P15.1 locked synthetic asset accepts only an explicit true snapshot with a nonblank decision reference',()=>{
 const registry=new AssetRegistry();registry.register(initial());
 for(const ownerDecisionRef of ['', '  ',null,42,undefined])assert.throws(()=>registry.replace(replacement(),1,{authorized:true,ownerDecisionRef}),/explicit owner decision/);
 registry.replace(replacement(),1,{authorized:true,ownerDecisionRef:'owner:synthetic-decision'});assert.equal(registry.get('asset:synthetic-p151').sha256,'b'.repeat(64));assert.equal(registry.get('asset:synthetic-p151').version,2);
});
test('P15.1 synthetic asset authorization cannot change owner project creation identity or stale version rules',()=>{
 for(const patch of [{ownerId:'owner:other'},{projectId:'project:other'},{createdAt:'2026-10-27T00:00:00Z'},{version:3}]){const registry=new AssetRegistry();registry.register(initial());assert.throws(()=>registry.replace(replacement(patch),1,{authorized:true,ownerDecisionRef:'owner:synthetic-decision'}));assert.deepEqual(registry.get('asset:synthetic-p151'),initial());}
});