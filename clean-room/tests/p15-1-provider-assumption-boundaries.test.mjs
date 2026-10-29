import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry} from '../dist/brain/index.js';
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
