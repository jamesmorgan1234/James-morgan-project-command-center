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
