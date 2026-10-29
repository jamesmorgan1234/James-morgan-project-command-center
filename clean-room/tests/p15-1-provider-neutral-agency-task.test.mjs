import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDependencyGraph} from '../dist/agency/index.js';
import {AiRouteRegistry} from '../dist/brain/index.js';

const task={
  id:'tsk_provider-neutral',
  runId:'run_provider-neutral',
  projectId:'prj_command-center',
  title:'Interpret canonical knowledge',
  state:'ready',
  dependencyIds:[],
  capability:'capability:knowledge:interpret',
  risk:'low',
  preferredEnvironment:'deterministic',
  evidenceRefs:['evd_provider-neutral'],
  idempotencyKey:'task:provider-neutral:v1',
  priority:1,
  createdSequence:1,
  affinityKeys:[],
  antiAffinityKeys:[]
};

function route(key,providerKey,executionMode,privacy){
  return {
    key,
    providerKey,
    modelId:`${providerKey}-model`,
    versionRef:'v1',
    executionMode,
    enabled:true,
    capabilities:[task.capability],
    cost:'free',
    privacy,
    health:'available',
    qualityRank:10,
    latencyRank:10,
    quotaAvailable:true
  };
}

test('CCR-02149 canonical Agency task remains unchanged when the eligible provider is replaced',()=>{
  assert.deepEqual(validateDependencyGraph([task]),{taskCount:1,edgeCount:0,acyclic:true});
  const serialized=JSON.stringify(task);
  assert.equal(serialized.includes('"providerKey"'),false);
  assert.equal(serialized.includes('"modelId"'),false);

  const routes=new AiRouteRegistry();
  routes.register(route('ai-route:task-provider-a','provider-a','remote','remote'));
  assert.equal(routes.route({capability:task.capability,allowPaid:false,maxPrivacy:'remote',preferQuality:true}).providerKey,'provider-a');

  routes.remove('ai-route:task-provider-a');
  routes.register(route('ai-route:task-provider-b','provider-b','self_hosted','local'));
  assert.equal(routes.route({capability:task.capability,allowPaid:false,maxPrivacy:'remote',preferQuality:true}).providerKey,'provider-b');

  assert.deepEqual(validateDependencyGraph([task]),{taskCount:1,edgeCount:0,acyclic:true});
  assert.equal(JSON.stringify(task),serialized);
});
