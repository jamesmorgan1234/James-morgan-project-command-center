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
