import test from 'node:test';
import assert from 'node:assert/strict';
import {PortabilityCenter} from '../dist/data/index.js';

const durableRecord={
  id:'state:command-center-durable',
  entityType:'command-center-state',
  version:3,
  contentHash:'sha256:durable-state-v3',
  sensitivity:'internal',
  provenanceRefs:['source:command-center-canonical-state','evidence:durable-state-v3'],
  data:{
    projectId:'command-center',
    phase:'P15.1',
    status:'open',
    nested:{owner:'command-center'}
  }
};

test('CCR-02144 durable Command Center state exports and stages for fresh import without ChatGPT product memory',()=>{
  const sourceCenter=new PortabilityCenter();
  const manifest=sourceCenter.export([durableRecord]);

  assert.equal(manifest.recordCount,1);
  assert.equal(manifest.redactedCount,0);
  assert.equal(Object.isFrozen(manifest.records),true);
  assert.equal(Object.isFrozen(manifest.records[0]),true);
  assert.equal(Object.isFrozen(manifest.records[0].data),true);
  assert.equal(Object.isFrozen(manifest.records[0].data.nested),true);
  assert.deepEqual(manifest.records[0],durableRecord);

  const freshCenter=new PortabilityCenter();
  const staged=freshCenter.stageImport('import:memory-independent-recovery',manifest.records,[]);

  assert.equal(staged.canApplyWithoutOverwrite,true);
  assert.deepEqual(staged.results,[{
    id:'state:command-center-durable',
    disposition:'create',
    reason:'new_id'
  }]);
  assert.deepEqual(manifest.records[0].provenanceRefs,durableRecord.provenanceRefs);
  assert.deepEqual(manifest.records[0].data,durableRecord.data);
});
