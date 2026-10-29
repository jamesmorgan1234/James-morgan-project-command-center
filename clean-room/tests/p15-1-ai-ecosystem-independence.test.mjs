import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry} from '../dist/brain/index.js';

function route(key,providerKey,modelId,executionMode='self_hosted',privacy='local',capabilities=['brain:reason']){
  return {
    key,
    providerKey,
    modelId,
    versionRef:'v1',
    executionMode,
    enabled:true,
    capabilities,
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

test('CCR-02173 several AI ecosystems can coexist and route distinct canonical capabilities simultaneously',()=>{
  const routes=new AiRouteRegistry();
  routes.register(route('ai-route:ecosystem-a','provider:ecosystem-a','reason-model','remote','remote',['brain:reason']));
  routes.register(route('ai-route:ecosystem-b','provider:ecosystem-b','vision-model','self_hosted','local',['brain:vision']));
  routes.register(route('ai-route:ecosystem-c','provider:ecosystem-c','coding-model','hybrid','private_remote',['brain:code']));

  assert.equal(routes.list().length,3);
  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).providerKey,'provider:ecosystem-a');
  assert.equal(routes.route({capability:'brain:vision',allowPaid:false,maxPrivacy:'local',preferQuality:true}).providerKey,'provider:ecosystem-b');
  assert.equal(routes.route({capability:'brain:code',allowPaid:false,maxPrivacy:'private_remote',preferQuality:true}).providerKey,'provider:ecosystem-c');
});

test('CCR-02174 synthetic AI-provider replacement preserves canonical capability routing',()=>{
  const routes=new AiRouteRegistry();
  routes.register(route('ai-route:replacement-a','provider:synthetic-a','synthetic-model-a','remote','remote',['brain:reason']));
  const before=routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true});
  assert.equal(before.providerKey,'provider:synthetic-a');
  assert.deepEqual(before.capabilities,['brain:reason']);

  routes.remove('ai-route:replacement-a');
  routes.register(route('ai-route:replacement-b','provider:synthetic-b','synthetic-model-b','self_hosted','local',['brain:reason']));
  const after=routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true});
  assert.equal(after.providerKey,'provider:synthetic-b');
  assert.deepEqual(after.capabilities,['brain:reason']);
  assert.notEqual(after.modelId,before.modelId);
});
