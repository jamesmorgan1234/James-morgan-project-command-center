import test from 'node:test';
import assert from 'node:assert/strict';
import {AssetRegistry} from '../dist/data/index.js';

const base={id:'future-artifact',ownerId:'owner',name:'Future artifact',version:1,sensitivity:'internal',originalState:'available',approvalState:'unreviewed',sourceRef:'future:source-v1',createdAt:'2026-10-25T00:00:00Z',updatedAt:'2026-10-26T00:00:00Z',mediaType:'application/vnd.command-center.future+json',sha256:'9'.repeat(64)};

test('content registry accepts previously unknown future artifact media types without enum changes',()=>{
 const registry=new AssetRegistry();
 registry.register(base);
 assert.equal(registry.get(base.id).mediaType,'application/vnd.command-center.future+json');
 registry.replace({...base,version:2,sourceRef:'future:source-v2',sha256:'a'.repeat(64)},1);
 const current=registry.get(base.id);
 assert.equal(current.id,'future-artifact');
 assert.equal(current.version,2);
 assert.equal(current.mediaType,'application/vnd.command-center.future+json');
});
