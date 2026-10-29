import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry} from '../dist/brain/index.js';

function route(key,providerKey,modelId,executionMode='self_hosted',privacy='local'){
  return {
    key,
    providerKey,
    modelId,
    versionRef:'v1',
    executionMode,
    enabled:true,
    capabilities:['brain:reason'],
    cost:'free',
    privacy,
    health:'available',
    qualityRank:10,
    latencyRank:10,
    quotaAvailable:true,
    contextWindowTokens:65536
  };
}

test('CCR-02171 Command Center architecture can route Brain inference without OpenAI services',()=>{
  const routes=new AiRouteRegistry();
  routes.register(route('ai-route:owner-self-hosted','provider:owner-self-hosted','owner-model-v1'));
  const selected=routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'local',preferQuality:true,minimumContextTokens:32000});
  assert.equal(selected.providerKey,'provider:owner-self-hosted');
  assert.equal(selected.executionMode,'self_hosted');
  assert.equal(routes.list().some((candidate)=>candidate.providerKey.toLowerCase().includes('openai')),false);
});

test('CCR-02172 Command Center architecture can route Brain inference without Anthropic services',()=>{
  const routes=new AiRouteRegistry();
  routes.register(route('ai-route:owner-self-hosted-anthropic-independent','provider:owner-runtime','owner-model-v2'));
  const selected=routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'local',preferQuality:true,minimumContextTokens:32000});
  assert.equal(selected.providerKey,'provider:owner-runtime');
  assert.equal(selected.executionMode,'self_hosted');
  assert.equal(routes.list().some((candidate)=>candidate.providerKey.toLowerCase().includes('anthropic')),false);
});
