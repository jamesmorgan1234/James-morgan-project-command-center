import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {generateReconciliationBatches} from '../scripts/write-company-integration-batches.mjs';
test('all original company sources produce self-contained source-hash-proven payloads without enabling providers',async()=>{
 const x=await generateReconciliationBatches();
 assert.equal(x.total,117);assert.equal(x.native.length,10);assert.equal(x.batches.length,27);
 const docs=x.batches.flatMap(y=>JSON.parse(y.content).payloads);
 assert.equal(docs.length,107);
 for(const p of docs){
  assert.equal(createHash('sha256').update(p.sourceText).digest('hex'),p.sourceSha256);
  assert.ok(p.workUnits.length>30);
  assert.equal(p.brain.enabled,false);
  assert.ok(p.brain.capabilities.length>=2);
  assert.ok(p.workUnits.every(w=>w.evidenceRefs.includes(p.sourcePath+'#sha256='+p.sourceSha256)));
  assert.ok(p.gates.every(g=>!g.satisfied));
 }
 assert.equal(docs.filter(x=>x.explicitlyDoNotActivateAutomatically).length,1);
});
