import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry,BrainMemoryLedger} from '../dist/brain/index.js';
import {createCoreArchitectureResponsibilityRegistry} from '../dist/kernel/index.js';

function route(overrides={}){
  return {
    key:'ai-route:provider-limit',
    providerKey:'provider-limited',
    modelId:'model-limited',
    versionRef:'v1',
    executionMode:'remote',
    enabled:true,
    capabilities:['brain:reason'],
    cost:'free',
    privacy:'remote',
    health:'available',
    qualityRank:10,
    latencyRank:10,
    quotaAvailable:true,
    ...overrides
  };
}

test('CCR-02156 provider-specific limitations remain replaceable routing state rather than permanent architecture assumptions',()=>{
  const architecture=createCoreArchitectureResponsibilityRegistry();
  const architectureBefore=JSON.stringify(architecture.list());
  const routes=new AiRouteRegistry();

  routes.register(route({quotaAvailable:false}));
  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true}),undefined);
  routes.remove('ai-route:provider-limit');

  routes.register(route({
    key:'ai-route:provider-replacement',
    providerKey:'provider-replacement',
    modelId:'model-replacement',
    executionMode:'self_hosted',
    privacy:'local',
    quotaAvailable:true
  }));
  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).providerKey,'provider-replacement');
  assert.equal(JSON.stringify(architecture.list()),architectureBefore);
});

test('CCR-02157 provider billing and quota models are abstract eligibility inputs rather than permanent architecture assumptions',()=>{
  const architecture=createCoreArchitectureResponsibilityRegistry();
  const architectureBefore=JSON.stringify(architecture.list());
  const routes=new AiRouteRegistry();
  routes.register(route({key:'ai-route:free',providerKey:'provider-free',modelId:'free-model',cost:'free',quotaAvailable:true,qualityRank:5}));
  routes.register(route({key:'ai-route:paid',providerKey:'provider-paid',modelId:'paid-model',cost:'paid',quotaAvailable:true,qualityRank:10}));
  routes.register(route({key:'ai-route:unknown-quota',providerKey:'provider-unknown',modelId:'unknown-model',cost:'unknown',quotaAvailable:'unknown',qualityRank:7}));

  const freeOnly=routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true});
  assert.equal(freeOnly.providerKey,'provider-unknown');
  const paidAllowed=routes.route({capability:'brain:reason',allowPaid:true,maxPrivacy:'remote',preferQuality:true});
  assert.equal(paidAllowed.providerKey,'provider-paid');

  routes.remove('ai-route:paid');
  routes.remove('ai-route:unknown-quota');
  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).providerKey,'provider-free');
  assert.equal(JSON.stringify(architecture.list()),architectureBefore);
});

test('CCR-02158 provider context-window limits are explicit routing capacity rather than architecture assumptions',()=>{
  const routes=new AiRouteRegistry();
  routes.register(route({key:'ai-route:small-context',providerKey:'provider-small',modelId:'small-model',contextWindowTokens:8000,qualityRank:20}));
  routes.register(route({key:'ai-route:large-context',providerKey:'provider-large',modelId:'large-model',contextWindowTokens:128000,qualityRank:10}));
  routes.register(route({key:'ai-route:unknown-context',providerKey:'provider-unknown-context',modelId:'unknown-context-model',contextWindowTokens:'unknown',qualityRank:30}));

  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).providerKey,'provider-unknown-context');
  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true,minimumContextTokens:32000}).providerKey,'provider-large');
  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true,minimumContextTokens:256000}),undefined);
  assert.throws(()=>routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true,minimumContextTokens:0}),/Minimum context tokens/);
  assert.throws(()=>new AiRouteRegistry().register(route({key:'ai-route:bad-context',contextWindowTokens:0})),/context window/);
});

test('CCR-02159 provider memory remains outside canonical Brain memory',()=>{
  const ledger=new BrainMemoryLedger();
  const memory={
    id:'memory:canonical-provider-independent',
    ownerId:'owner-1',
    projectId:'prj_command-center',
    kind:'fact',
    version:1,
    state:'current',
    value:{fact:'Canonical memory belongs to Command Center.'},
    confidence:1,
    sensitivity:'internal',
    sourceRefs:['source:canonical-memory'],
    recordedAt:'2026-10-29T00:00:00Z'
  };
  ledger.append(memory);
  const before=JSON.stringify(ledger.current(memory.ownerId,memory.projectId));
  assert.equal(before.includes('"providerKey"'),false);
  assert.equal(before.includes('"modelId"'),false);

  const routes=new AiRouteRegistry();
  routes.register(route({key:'ai-route:memory-a',providerKey:'provider-memory-a',modelId:'memory-model-a'}));
  routes.remove('ai-route:memory-a');
  routes.register(route({key:'ai-route:memory-b',providerKey:'provider-memory-b',modelId:'memory-model-b',executionMode:'self_hosted',privacy:'local'}));

  assert.equal(JSON.stringify(ledger.current(memory.ownerId,memory.projectId)),before);
  assert.deepEqual(ledger.current(memory.ownerId,memory.projectId),[memory]);
});

test('CCR-02162 future self-hosted model runtime is an explicit routable execution mode',()=>{
  const routes=new AiRouteRegistry();
  routes.register(route({
    key:'ai-route:self-hosted-model',
    providerKey:'provider:self-hosted-model',
    modelId:'owner-model-v1',
    executionMode:'self_hosted',
    privacy:'local',
    contextWindowTokens:65536
  }));
  const selected=routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'local',preferQuality:true,minimumContextTokens:32000});
  assert.equal(selected.executionMode,'self_hosted');
  assert.equal(selected.providerKey,'provider:self-hosted-model');
  assert.equal(selected.modelId,'owner-model-v1');
});

test('CCR-02163 future local-device model runtime is an explicit local-only routing mode',()=>{
  const routes=new AiRouteRegistry();
  routes.register(route({
    key:'ai-route:local-device-model',
    providerKey:'provider:local-device',
    modelId:'device-model-v1',
    executionMode:'local',
    privacy:'local',
    contextWindowTokens:32768
  }));
  routes.register(route({
    key:'ai-route:remote-model',
    providerKey:'provider:remote-model',
    modelId:'remote-model-v1',
    executionMode:'remote',
    privacy:'remote',
    qualityRank:20,
    contextWindowTokens:131072
  }));
  const selected=routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'local',preferQuality:true,minimumContextTokens:16000});
  assert.equal(selected.executionMode,'local');
  assert.equal(selected.providerKey,'provider:local-device');
});
