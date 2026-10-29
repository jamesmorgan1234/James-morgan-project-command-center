import test from 'node:test';
import assert from 'node:assert/strict';
import {AssetRegistry} from '../dist/data/index.js';

const base={id:'content:stable-1',ownerId:'owner',name:'Stable content',version:1,sensitivity:'internal',originalState:'missing',approvalState:'unreviewed',sourceRef:'source:v1',createdAt:'2026-10-25T00:00:00Z',updatedAt:'2026-10-26T00:00:00Z'};

test('content registry requires a stable nonblank content id and preserves it across revisions',()=>{
 const registry=new AssetRegistry();
 assert.throws(()=>registry.register({...base,id:' '}),/identity\/provenance fields are required/);
 registry.register(base);
 registry.replace({...base,version:2,sourceRef:'source:v2'},1);
 const current=registry.get(base.id);
 assert.equal(current.id,'content:stable-1');
 assert.equal(current.version,2);
 assert.throws(()=>registry.replace({...base,id:'content:other',version:2,sourceRef:'source:v2'},1),/Unknown asset/);
});

test('content identity is independent of filename or display name',()=>{
 const registry=new AssetRegistry();
 const first={...base,id:'content:same-name-a',name:'shared-output.pdf',sourceRef:'file:a'};
 const second={...base,id:'content:same-name-b',name:'shared-output.pdf',sourceRef:'file:b'};
 registry.register(first);
 registry.register(second);
 assert.equal(registry.get(first.id).name,'shared-output.pdf');
 assert.equal(registry.get(second.id).name,'shared-output.pdf');
 assert.equal(registry.get(first.id).id,'content:same-name-a');
 assert.equal(registry.get(second.id).id,'content:same-name-b');
 assert.notEqual(registry.get(first.id).id,registry.get(second.id).id);
});

test('content registry tracks every successful version and failed stale writes do not mutate history',()=>{
 const registry=new AssetRegistry();
 registry.register(base);
 registry.replace({...base,version:2,sourceRef:'source:v2'},1);
 registry.replace({...base,version:3,sourceRef:'source:v3'},2);
 const history=registry.history(base.id);
 assert.deepEqual(history.map((record)=>record.version),[1,2,3]);
 assert.deepEqual(history.map((record)=>record.sourceRef),['source:v1','source:v2','source:v3']);
 assert.equal(Object.isFrozen(history),true);
 assert.throws(()=>registry.replace({...base,version:4,sourceRef:'stale-write'},1),/version conflict/);
 assert.deepEqual(registry.history(base.id).map((record)=>record.version),[1,2,3]);
 assert.deepEqual(registry.history('content:unknown'),[]);
});

test('approved historical content version remains identifiable after a newer revision exists',()=>{
 const registry=new AssetRegistry();
 registry.register(base);
 registry.replace({...base,version:2,sourceRef:'source:v2',approvalState:'approved'},1);
 registry.replace({...base,version:3,sourceRef:'source:v3',approvalState:'unreviewed'},2);
 const approved=registry.history(base.id).filter((record)=>record.approvalState==='approved');
 assert.deepEqual(approved.map((record)=>record.version),[2]);
 assert.equal(approved[0].sourceRef,'source:v2');
 assert.equal(registry.get(base.id).version,3);
 assert.equal(registry.get(base.id).approvalState,'unreviewed');
});

test('superseded content versions remain traceable with their original provenance',()=>{
 const registry=new AssetRegistry();
 const v1={...base,sha256:'a'.repeat(64),originalState:'available'};
 registry.register(v1);
 registry.replace({...v1,version:2,sourceRef:'source:v2',sha256:'b'.repeat(64)},1);
 registry.replace({...v1,version:3,sourceRef:'source:v3',sha256:'c'.repeat(64)},2);
 const history=registry.history(base.id);
 assert.deepEqual(history.map((record)=>record.sha256),['a'.repeat(64),'b'.repeat(64),'c'.repeat(64)]);
 assert.deepEqual(history.map((record)=>record.sourceRef),['source:v1','source:v2','source:v3']);
 assert.equal(history[0].version,1);
 assert.equal(history[1].version,2);
 assert.equal(registry.get(base.id).version,3);
});

test('draft unreviewed content is distinguishable from approved and locked content',()=>{
 const registry=new AssetRegistry();
 registry.register(base);
 registry.replace({...base,version:2,sourceRef:'source:v2',approvalState:'approved'},1);
 registry.replace({...base,version:3,sourceRef:'source:v3',approvalState:'locked'},2);
 const states=registry.history(base.id).map((record)=>record.approvalState);
 assert.deepEqual(states,['unreviewed','approved','locked']);
 assert.notEqual(states[0],states[1]);
 assert.notEqual(states[1],states[2]);
 assert.throws(()=>new AssetRegistry().register({...base,id:'content:bad-state',approvalState:'draft'}),/Unsupported asset state/);
});

test('generated content identifies its originating project and project ownership cannot be silently rewritten',()=>{
 const registry=new AssetRegistry();
 const generated={...base,id:'content:generated-project',projectId:'project:alpha',generation:{generatorRef:'generator:content-pipeline'}};
 registry.register(generated);
 assert.equal(registry.get(generated.id).projectId,'project:alpha');
 registry.replace({...generated,version:2,sourceRef:'source:v2'},1);
 assert.equal(registry.get(generated.id).projectId,'project:alpha');
 assert.throws(()=>registry.replace({...generated,version:3,sourceRef:'source:v3',projectId:'project:beta'},2),/project ownership/);
 assert.equal(registry.get(generated.id).projectId,'project:alpha');
 assert.throws(()=>new AssetRegistry().register({...generated,id:'content:blank-project',projectId:' '}),/project scope must be nonblank/);
});
