import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry,classifyConversationIntent} from '../dist/brain/index.js';
import {PortabilityCenter} from '../dist/data/index.js';

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

test('CCR-02170 model migration preserves retained owner conversations',()=>{
  const turn={
    id:'cnv_retained-model-migration',
    ownerId:'owner-1',
    projectId:'prj_command-center',
    role:'owner',
    text:'What is the next verified step?',
    createdAt:'2026-10-29T00:00:00Z',
    evidenceRefs:['evd_retained-conversation']
  };
  const portable={
    id:turn.id,
    entityType:'conversation-turn',
    version:1,
    contentHash:'conversation:retained-model-migration:v1',
    sensitivity:'internal',
    provenanceRefs:['source:brain-conversation'],
    data:turn
  };
  const manifest=new PortabilityCenter().export([portable]);

  const routes=new AiRouteRegistry();
  routes.register(modelRoute('ai-route:model-a','provider-a','model-a'));
  routes.remove('ai-route:model-a');
  routes.register(modelRoute('ai-route:model-b','provider-b','model-b','self_hosted','local'));
  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).modelId,'model-b');

  const staged=new PortabilityCenter().stageImport('import:retained-conversation-after-model-migration',manifest.records,[]);
  assert.equal(staged.canApplyWithoutOverwrite,true);
  assert.deepEqual(manifest.records[0].data,turn);
  assert.deepEqual(classifyConversationIntent(manifest.records[0].data.text),{intent:'question',protectedActionPossible:false});
});
