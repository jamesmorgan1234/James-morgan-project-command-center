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
