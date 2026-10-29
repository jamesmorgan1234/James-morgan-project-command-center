import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry} from '../dist/brain/index.js';
import {evaluateGovernance} from '../dist/kernel/index.js';

function modelRoute(key,providerKey,modelId,executionMode='remote',privacy='remote'){
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
    quotaAvailable:true
  };
}

test('CCR-02167 model migration does not require rewriting canonical governance rules',()=>{
  const context={
    ownerId:'owner-1',
    authorityOwnerId:'owner-1',
    newestInstructionAllows:true,
    instructionState:'current',
    freeFirst:true,
    introducesCost:false,
    action:'read',
    executionSurface:'normal_chat',
    normalChatAvailable:true,
    now:'2026-10-29T00:00:00Z'
  };
  const before=evaluateGovernance(context);
  assert.deepEqual(before,{allowed:true,reason:'allowed_non_protected_action',protected:false});

  const routes=new AiRouteRegistry();
  routes.register(modelRoute('ai-route:model-a','provider-a','model-a'));
  routes.remove('ai-route:model-a');
  routes.register(modelRoute('ai-route:model-b','provider-b','model-b','self_hosted','local'));
  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).modelId,'model-b');

  assert.deepEqual(evaluateGovernance(context),before);
  assert.deepEqual(evaluateGovernance({...context,introducesCost:true}),{allowed:false,reason:'free_first_blocks_cost',protected:true});
});
