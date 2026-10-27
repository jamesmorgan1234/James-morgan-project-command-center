import test from 'node:test';
import assert from 'node:assert/strict';
import {KnowledgeLedger,known} from '../dist/data/index.js';
const original={id:'claim-1',subjectId:'subject',version:1,kind:'verified',state:'current',value:known(0),confidence:1,sourceRefs:['receipt'],observedAt:'2026-10-27T00:00:00Z',recordedAt:'2026-10-27T00:00:00Z'};
test('rejected supersession cannot remove the last verified current claim',()=>{
 const ledger=new KnowledgeLedger();ledger.append(original);
 for(const changes of [{kind:'inferred',confidence:1},{sourceRefs:['']},{kind:'future'},{state:'future'},{value:{state:'unknown',value:0}}]){
  assert.throws(()=>ledger.append({...original,id:'candidate',version:2,supersedes:original.id,...changes}));
  assert.equal(ledger.current('subject').id,original.id);
  assert.equal(ledger.history('subject').length,1);
 }
 ledger.append({...original,id:'claim-2',version:2,supersedes:original.id,kind:'inferred',confidence:.5});
 assert.equal(ledger.current('subject').id,'claim-2');
 assert.equal(ledger.history('subject')[0].state,'superseded');
});
