import test from 'node:test';
import assert from 'node:assert/strict';
import {PortabilityCenter} from '../dist/data/index.js';
import {
  ArchitectureResponsibilityRegistry,
  createCoreArchitectureResponsibilityRegistry
} from '../dist/kernel/index.js';

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

test('CCR-02145 core architecture recovers from durable contracts without relying on this conversation',()=>{
  const canonical=createCoreArchitectureResponsibilityRegistry();
  const portable=canonical.list().map((contract)=>({
    id:`architecture:${contract.responsibility}`,
    entityType:'architecture-responsibility',
    version:1,
    contentHash:`architecture:${contract.responsibility}:v1`,
    sensitivity:'internal',
    provenanceRefs:['source:kernel-architecture-contract'],
    data:{...contract}
  }));

  const manifest=new PortabilityCenter().export(portable);
  const staged=new PortabilityCenter().stageImport('import:architecture-recovery',manifest.records,[]);
  assert.equal(staged.canApplyWithoutOverwrite,true);
  assert.equal(staged.results.every((result)=>result.disposition==='create'),true);

  const recovered=new ArchitectureResponsibilityRegistry();
  for(const record of manifest.records) recovered.register(record.data);
  assert.doesNotThrow(()=>recovered.assertCoreCoverage());
  assert.deepEqual(
    recovered.list().map((contract)=>contract.responsibility).sort(),
    canonical.list().map((contract)=>contract.responsibility).sort()
  );
  for(const contract of recovered.list()){
    assert.ok(contract.owner.trim());
    assert.ok(contract.truthSource.trim());
    assert.ok(contract.verificationPath.trim());
    if(contract.critical) assert.ok(contract.recoveryPath.trim());
  }
});
