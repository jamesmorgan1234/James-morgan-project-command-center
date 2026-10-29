import test from 'node:test';
import assert from 'node:assert/strict';
import {AssetRegistry} from '../dist/data/index.js';
const asset={id:'asset',ownerId:'owner',name:'Original missing',version:1,sensitivity:'internal',originalState:'missing',approvalState:'unreviewed',sourceRef:'source',createdAt:'2026-10-25T00:00:00Z',updatedAt:'2026-10-26T00:00:00Z'};
test('asset replacement validates original state identity provenance and time before changing registry',()=>{
 const registry=new AssetRegistry();registry.register(asset);
 for(const changes of [{originalState:'available'},{sensitivity:'future'},{originalState:'future'},{approvalState:'future'},{sourceRef:''},{updatedAt:asset.createdAt},{projectId:''},{originRequirementId:''},{originTaskId:''}]){
  assert.throws(()=>registry.replace({...asset,version:2,...changes},1));
  assert.equal(registry.get(asset.id).version,1);
  assert.equal(registry.get(asset.id).originalState,'missing');
 }
 registry.replace({...asset,version:2,originalState:'reconstruction',sourceRef:'explicit-reconstruction'},1);
 assert.equal(registry.get(asset.id).originalState,'reconstruction');
 registry.replace({...asset,version:3,originalState:'available',sha256:'a'.repeat(64),sourceRef:'recovered-original'},2);
 assert.equal(registry.get(asset.id).sha256,'a'.repeat(64));
});

test('asset requirement and task provenance is typed, backfillable, and cannot be silently rewritten',()=>{
 const registry=new AssetRegistry();
 const linked={...asset,id:'linked',projectId:'project:1',originRequirementId:'CCR-02121',originTaskId:'task:generate-content'};
 registry.register(linked);
 assert.equal(registry.get(linked.id).originRequirementId,'CCR-02121');
 assert.equal(registry.get(linked.id).originTaskId,'task:generate-content');
 registry.replace({...linked,version:2,sourceRef:'source-v2'},1);
 assert.throws(()=>registry.replace({...linked,version:3,sourceRef:'source-v3',originRequirementId:'CCR-other'},2),/originating requirement/);
 assert.throws(()=>registry.replace({...linked,version:3,sourceRef:'source-v3',originTaskId:'task:other'},2),/originating task/);
 assert.equal(registry.get(linked.id).version,2);

 const backfill=new AssetRegistry();
 backfill.register({...asset,id:'backfill'});
 backfill.replace({...asset,id:'backfill',version:2,originRequirementId:'CCR-02121',originTaskId:'task:legacy'},1);
 assert.equal(backfill.get('backfill').originRequirementId,'CCR-02121');
 assert.equal(backfill.get('backfill').originTaskId,'task:legacy');

 assert.throws(()=>new AssetRegistry().register({...asset,id:'blank-requirement',originRequirementId:''}),/originating requirement/);
 assert.throws(()=>new AssetRegistry().register({...asset,id:'blank-task',originTaskId:''}),/originating task/);
});

test('asset generation provenance identifies generator tool or provider and cannot be silently rewritten',()=>{
 const registry=new AssetRegistry();
 const generation={generatorRef:'generator:content-pipeline',toolRef:'tool:writer-v1',providerRef:'provider:local'};
 const linked={...asset,id:'generated',generation};
 registry.register(linked);
 assert.deepEqual(registry.get(linked.id).generation,generation);
 assert.equal(Object.isFrozen(registry.get(linked.id).generation),true);
 registry.replace({...linked,version:2,sourceRef:'source-v2'},1);
 for(const changed of [{generatorRef:'generator:other'},{toolRef:'tool:other'},{providerRef:'provider:other'}]){
  assert.throws(()=>registry.replace({...linked,version:3,sourceRef:'source-v3',generation:{...generation,...changed}},2),/generation provenance/);
 }
 assert.throws(()=>registry.replace({...linked,version:3,sourceRef:'source-v3',generation:undefined},2),/generation provenance/);
 assert.equal(registry.get(linked.id).version,2);

 const backfill=new AssetRegistry();
 backfill.register({...asset,id:'generated-backfill'});
 backfill.replace({...asset,id:'generated-backfill',version:2,generation:{toolRef:'tool:legacy'}},1);
 assert.equal(backfill.get('generated-backfill').generation.toolRef,'tool:legacy');

 assert.throws(()=>new AssetRegistry().register({...asset,id:'empty-generation',generation:{}}),/requires a generator, tool, or provider/);
 assert.throws(()=>new AssetRegistry().register({...asset,id:'blank-generation',generation:{providerRef:' '}}),/references must be nonblank/);
 assert.throws(()=>new AssetRegistry().register({...asset,id:'null-generation',generation:null}),/must be an object/);
});
