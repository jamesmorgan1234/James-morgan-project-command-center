import test from 'node:test';
import assert from 'node:assert/strict';
import {AssetRegistry} from '../dist/data/index.js';
const asset={id:'asset',ownerId:'owner',name:'Original missing',version:1,sensitivity:'internal',originalState:'missing',approvalState:'unreviewed',sourceRef:'source',createdAt:'2026-10-25T00:00:00Z',updatedAt:'2026-10-26T00:00:00Z'};
test('asset replacement validates original state identity provenance and time before changing registry',()=>{
 const registry=new AssetRegistry();registry.register(asset);
 for(const changes of [{originalState:'available'},{sensitivity:'future'},{originalState:'future'},{approvalState:'future'},{sourceRef:''},{updatedAt:asset.createdAt},{projectId:''}]){
  assert.throws(()=>registry.replace({...asset,version:2,...changes},1));
  assert.equal(registry.get(asset.id).version,1);
  assert.equal(registry.get(asset.id).originalState,'missing');
 }
 registry.replace({...asset,version:2,originalState:'reconstruction',sourceRef:'explicit-reconstruction'},1);
 assert.equal(registry.get(asset.id).originalState,'reconstruction');
 registry.replace({...asset,version:3,originalState:'available',sha256:'a'.repeat(64),sourceRef:'recovered-original'},2);
 assert.equal(registry.get(asset.id).sha256,'a'.repeat(64));
});
