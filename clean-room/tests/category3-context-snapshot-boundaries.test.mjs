import test from 'node:test';
import assert from 'node:assert/strict';
import {createContextSnapshot} from '../dist/data/index.js';
test('context cannot broaden company account environment or purpose scope by omission',()=>{
 const source={id:'source',ownerId:'owner',version:1,sensitivity:'internal',sourceRef:'receipt',value:{nested:{zero:0}}};
 const input={id:'snapshot',ownerId:'owner',projectId:'project',createdAt:'2026-10-27T00:00:00Z',maxSensitivity:'internal',sources:[source]};
 for(const changes of [{companyId:'company'},{accountId:'account'},{environment:'test'},{purpose:['private']},{staleAfter:'invalid'},{version:0}]) assert.equal(createContextSnapshot({...input,sources:[{...source,...changes}]}).sources.length,0);
 assert.throws(()=>createContextSnapshot({...input,createdAt:'invalid'}), /timestamp/);
 const result=createContextSnapshot(input);source.value.nested.zero=1;
 assert.equal(result.sources[0].value.nested.zero,0);
 assert.throws(()=>{result.sources[0].value.nested.zero=2;},TypeError);
 assert.equal(createContextSnapshot({...input,companyId:'company',sources:[{...source,companyId:'company'}]}).sources.length,1);
});
test('context exchange ceiling cannot permit secret material',()=>{
 assert.throws(()=>createContextSnapshot({id:'snapshot',ownerId:'owner',projectId:'project',createdAt:'2026-10-27T00:00:00Z',maxSensitivity:'secret',sources:[]}), /forbids secret/);
});
