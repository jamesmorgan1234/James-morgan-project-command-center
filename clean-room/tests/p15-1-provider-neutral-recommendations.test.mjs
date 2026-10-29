import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry,validateBrainPlan} from '../dist/brain/index.js';
import {PortabilityCenter} from '../dist/data/index.js';

const plan={
  id:'plan:provider-neutral-recommendation',
  projectId:'prj_command-center',
  objective:'Choose the safest compatible next action',
  claims:[{
    id:'recommendation:provider-neutral',
    class:'recommendation',
    statement:'Prefer the verified compatible path.',
    evidenceRefs:['evd_provider-neutral'],
    confidence:0.9
  }],
  proposedActions:['action:verified-compatible-path'],
  requiresOwnerDecision:true
};

function route(key,providerKey,executionMode,privacy){
  return {
    key,
    providerKey,
    modelId:`${providerKey}-model`,
    versionRef:'v1',
    executionMode,
    enabled:true,
    capabilities:['recommendation:generate'],
    cost:'free',
    privacy,
    health:'available',
    qualityRank:10,
    latencyRank:10,
    quotaAvailable:true
  };
}

test('CCR-02150 canonical recommendation records remain provider-neutral and portable',()=>{
  assert.doesNotThrow(()=>validateBrainPlan(plan));
  const serialized=JSON.stringify(plan);
  assert.equal(serialized.includes('"providerKey"'),false);
  assert.equal(serialized.includes('"modelId"'),false);

  const routes=new AiRouteRegistry();
  routes.register(route('ai-route:recommendation-a','provider-a','remote','remote'));
  assert.equal(routes.route({capability:'recommendation:generate',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).providerKey,'provider-a');
  routes.remove('ai-route:recommendation-a');
  routes.register(route('ai-route:recommendation-b','provider-b','self_hosted','local'));
  assert.equal(routes.route({capability:'recommendation:generate',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).providerKey,'provider-b');
  assert.doesNotThrow(()=>validateBrainPlan(plan));
  assert.equal(JSON.stringify(plan),serialized);

  const portable={
    id:'recommendation:provider-neutral',
    entityType:'brain-recommendation',
    version:1,
    contentHash:'recommendation:provider-neutral:v1',
    sensitivity:'internal',
    provenanceRefs:['source:brain-planning'],
    data:plan
  };
  const manifest=new PortabilityCenter().export([portable]);
  const staged=new PortabilityCenter().stageImport('import:provider-neutral-recommendation',manifest.records,[]);
  assert.equal(staged.canApplyWithoutOverwrite,true);
  assert.deepEqual(manifest.records[0].data,plan);
});
