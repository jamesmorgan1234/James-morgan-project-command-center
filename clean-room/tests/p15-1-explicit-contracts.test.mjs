import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CURRENT_RUNTIME_API_VERSION,
  CURRENT_RUNTIME_SCHEMA_VERSION,
  SUPPORTED_RUNTIME_API_RANGE,
  SUPPORTED_RUNTIME_SCHEMA_RANGE,
  validateModuleContract
} from '../dist/kernel/index.js';
import {
  FIRST_PARTY_API_CONTRACTS,
  validateFirstPartyApiContract
} from '../dist/runtime/index.js';

const explicitModuleContract={
  key:'mod:explicit-contract-proof',
  version:1,
  enabled:true,
  owner:'kernel/contracts',
  ownsData:['data:explicit-contract-proof'],
  ownsCapabilities:['capability:explicit-contract-proof'],
  usesData:[],
  usesCapabilities:[],
  dependencies:[],
  permissions:['permission:read-contract-proof'],
  routes:['/contract-proof'],
  events:['event:contract-proof'],
  migrations:['migration:contract-proof-v1'],
  healthCheckKey:'health:explicit-contract-proof',
  securityClass:'internal',
  activation:'startup',
  failureBehavior:'fail-closed',
  canDisable:true,
  canUninstall:true,
  tests:['p15-1-explicit-contracts.test.mjs']
};

test('CCR-01850 module runtime and schema behavior is governed by explicit executable contracts',()=>{
  assert.doesNotThrow(()=>validateModuleContract(explicitModuleContract));
  assert.throws(()=>validateModuleContract({...explicitModuleContract,owner:' '}),/owner is required/);
  assert.throws(()=>validateModuleContract({...explicitModuleContract,healthCheckKey:' '}),/healthCheckKey is required/);
  assert.throws(()=>validateModuleContract({...explicitModuleContract,failureBehavior:'assume-success'}),/Invalid module failure behavior/);

  assert.equal(CURRENT_RUNTIME_API_VERSION,1);
  assert.equal(CURRENT_RUNTIME_SCHEMA_VERSION,1);
  assert.deepEqual(SUPPORTED_RUNTIME_API_RANGE,{min:1,max:1});
  assert.deepEqual(SUPPORTED_RUNTIME_SCHEMA_RANGE,{min:1,max:1});

  assert.ok(FIRST_PARTY_API_CONTRACTS.length>0);
  for(const contract of FIRST_PARTY_API_CONTRACTS){
    assert.ok(contract.owner.trim());
    assert.ok(contract.binding.trim());
    assert.ok(contract.requestSchema.trim());
    assert.ok(contract.responseSchema.trim());
    assert.ok(contract.errorEnvelope.trim());
    assert.ok(contract.methods.length>0);
    assert.equal(contract.version,CURRENT_RUNTIME_API_VERSION);
    assert.deepEqual(contract.compatibleApi,SUPPORTED_RUNTIME_API_RANGE);
  }

  const runtime=FIRST_PARTY_API_CONTRACTS[0];
  assert.throws(()=>validateFirstPartyApiContract({...runtime,requestSchema:' '}),/requestSchema must be nonblank/);
  assert.throws(()=>validateFirstPartyApiContract({...runtime,version:2,compatibleApi:{min:2,max:2}}),/Unsupported API contract version/);
});
