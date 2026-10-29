import test from 'node:test';
import assert from 'node:assert/strict';
import {AssetRegistry} from '../dist/data/index.js';

const base={id:'archive',ownerId:'owner',name:'Package',version:1,sensitivity:'internal',originalState:'available',approvalState:'unreviewed',sourceRef:'source',createdAt:'2026-10-25T00:00:00Z',updatedAt:'2026-10-26T00:00:00Z',mediaType:'application/zip',sha256:'7'.repeat(64)};

test('content registry supports archives with immutable safe manifests',()=>{
 const registry=new AssetRegistry();
 const archiveManifest={entries:[{path:'manuscript/book.pdf',sha256:'8'.repeat(64)},{path:'metadata/book.json'}]};
 registry.register({...base,archiveManifest});
 const stored=registry.get(base.id);
 assert.deepEqual(stored.archiveManifest,archiveManifest);
 assert.equal(Object.isFrozen(stored.archiveManifest),true);
 assert.equal(Object.isFrozen(stored.archiveManifest.entries),true);
 assert.equal(Object.isFrozen(stored.archiveManifest.entries[0]),true);
});

test('archive manifests reject missing media type empty contents traversal duplicates and invalid hashes',()=>{
 assert.throws(()=>new AssetRegistry().register({...base,id:'no-type',mediaType:undefined,archiveManifest:{entries:[{path:'file.txt'}]}}),/requires a media type/);
 assert.throws(()=>new AssetRegistry().register({...base,id:'empty',archiveManifest:{entries:[]}}),/at least one entry/);
 assert.throws(()=>new AssetRegistry().register({...base,id:'traversal',archiveManifest:{entries:[{path:'../secret.txt'}]}}),/safe relative path/);
 assert.throws(()=>new AssetRegistry().register({...base,id:'duplicate',archiveManifest:{entries:[{path:'file.txt'},{path:'file.txt'}]}}),/duplicate path/);
 assert.throws(()=>new AssetRegistry().register({...base,id:'bad-hash',archiveManifest:{entries:[{path:'file.txt',sha256:'bad'}]}}),/64 hexadecimal characters/);
});
