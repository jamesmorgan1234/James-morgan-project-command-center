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

test('asset QA status is linked to an evidence receipt and remains version-specific',()=>{
 const registry=new AssetRegistry();
 const passed={...asset,id:'qa-linked',qa:{status:'passed',evidenceId:'evidence:qa-v1'}};
 registry.register(passed);
 assert.deepEqual(registry.get(passed.id).qa,{status:'passed',evidenceId:'evidence:qa-v1'});
 assert.equal(Object.isFrozen(registry.get(passed.id).qa),true);
 registry.replace({...passed,version:2,sourceRef:'source-v2',qa:{status:'failed',evidenceId:'evidence:qa-v2'}},1);
 assert.deepEqual(registry.get(passed.id).qa,{status:'failed',evidenceId:'evidence:qa-v2'});

 assert.throws(()=>new AssetRegistry().register({...asset,id:'qa-blank',qa:{status:'passed',evidenceId:' '}}),/nonblank evidence receipt id/);
 assert.throws(()=>new AssetRegistry().register({...asset,id:'qa-missing',qa:{status:'passed'}}),/nonblank evidence receipt id/);
 assert.throws(()=>new AssetRegistry().register({...asset,id:'qa-unknown',qa:{status:'unknown',evidenceId:'evidence:qa'}}),/Unsupported asset QA status/);
 assert.throws(()=>new AssetRegistry().register({...asset,id:'qa-null',qa:null}),/QA receipt must be an object/);
});

test('asset registry detects exact duplicate content by normalized sha256 and updates the index on replacement',()=>{
 const registry=new AssetRegistry();
 const hash='a'.repeat(64);
 const otherHash='b'.repeat(64);
 const first={...asset,id:'duplicate-a',sha256:hash,originalState:'available'};
 const second={...asset,id:'duplicate-b',sha256:hash.toUpperCase(),originalState:'available'};
 registry.register(first);
 assert.deepEqual(registry.findDuplicatesBySha256(hash),[]);
 registry.register(second);
 assert.deepEqual(registry.findDuplicatesBySha256(hash).map((record)=>record.id),['duplicate-a','duplicate-b']);
 assert.deepEqual(registry.findDuplicatesBySha256(hash.toUpperCase()).map((record)=>record.id),['duplicate-a','duplicate-b']);
 registry.replace({...second,version:2,sha256:otherHash,sourceRef:'source-v2'},1);
 assert.deepEqual(registry.findDuplicatesBySha256(hash),[]);
 assert.deepEqual(registry.findDuplicatesBySha256(otherHash),[]);
 assert.throws(()=>registry.findDuplicatesBySha256('not-a-hash'),/64 hexadecimal characters/);
});

test('content registry supports PDF assets through canonical media type metadata',()=>{
 const registry=new AssetRegistry();
 const pdf={...asset,id:'pdf-asset',mediaType:'application/pdf',sha256:'c'.repeat(64),originalState:'available'};
 registry.register(pdf);
 assert.equal(registry.get(pdf.id).mediaType,'application/pdf');
 assert.throws(()=>new AssetRegistry().register({...asset,id:'bad-media-type',mediaType:'applicationpdf'}),/canonical type\/subtype/);
 assert.throws(()=>new AssetRegistry().register({...asset,id:'parameterized-media-type',mediaType:'application/pdf; charset=binary'}),/canonical type\/subtype/);
});

test('content registry supports EPUB assets through the open canonical media type seam',()=>{
 const registry=new AssetRegistry();
 const epub={...asset,id:'epub-asset',mediaType:'application/epub+zip',sha256:'d'.repeat(64),originalState:'available'};
 registry.register(epub);
 assert.equal(registry.get(epub.id).mediaType,'application/epub+zip');
});

test('content registry supports DOCX assets through canonical media type metadata',()=>{
 const registry=new AssetRegistry();
 const docx={...asset,id:'docx-asset',mediaType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',sha256:'e'.repeat(64),originalState:'available'};
 registry.register(docx);
 assert.equal(registry.get(docx.id).mediaType,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
});

test('content registry supports image assets through canonical media type metadata',()=>{
 const registry=new AssetRegistry();
 const image={...asset,id:'image-asset',mediaType:'image/png',sha256:'f'.repeat(64),originalState:'available'};
 registry.register(image);
 assert.equal(registry.get(image.id).mediaType,'image/png');
});
