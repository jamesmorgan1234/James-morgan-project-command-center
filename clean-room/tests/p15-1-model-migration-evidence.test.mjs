import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry} from '../dist/brain/index.js';
import {evidenceMeets,validateEvidenceRecord} from '../dist/kernel/index.js';

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

test('CCR-02169 model migration does not invalidate historical evidence',()=>{
  const evidence=validateEvidenceRecord({
    id:'evd_model-migration-history',
    subjectId:'prj_command-center',
    strength:'canonical_record',
    sourceRef:'source:historical-verification',
    recordedAt:'2026-10-29T00:00:00Z',
    verified:true,
    codeRef:'commit:historical-proof',
    schemaVersion:1,
    environment:'test',
    testRef:'test:historical-proof',
    scopeRef:'project:prj_command-center'
  });
  const before=JSON.stringify(evidence);
  assert.equal(evidenceMeets(evidence,'canonical_record'),true);

  const routes=new AiRouteRegistry();
  routes.register(modelRoute('ai-route:model-a','provider-a','model-a'));
  routes.remove('ai-route:model-a');
  routes.register(modelRoute('ai-route:model-b','provider-b','model-b','self_hosted','local'));
  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).modelId,'model-b');

  assert.equal(JSON.stringify(evidence),before);
  assert.equal(evidenceMeets(evidence,'canonical_record'),true);
  assert.equal(evidence.sourceRef,'source:historical-verification');
  assert.equal(evidence.codeRef,'commit:historical-proof');
});
