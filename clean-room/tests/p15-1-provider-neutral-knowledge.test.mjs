import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry} from '../dist/brain/index.js';
import {
  SHARED_INTELLIGENCE_CONTRACT_VERSION,
  SHARED_INTELLIGENCE_ONTOLOGY_ID,
  SHARED_INTELLIGENCE_ONTOLOGY_VERSION,
  validateSharedIntelligenceEnvelope
} from '../dist/data/index.js';

const envelope={
  contractVersion:SHARED_INTELLIGENCE_CONTRACT_VERSION,
  ontology:{id:SHARED_INTELLIGENCE_ONTOLOGY_ID,version:SHARED_INTELLIGENCE_ONTOLOGY_VERSION},
  claim:{
    id:'knowledge:provider-neutral',
    subjectId:'prj_command-center',
    version:1,
    kind:'verified',
    state:'current',
    value:{state:'known',value:{lesson:'canonical knowledge survives provider replacement'}},
    confidence:1,
    sourceRefs:['source:canonical-knowledge'],
    observedAt:'2026-10-29T00:00:00Z',
    recordedAt:'2026-10-29T00:01:00Z'
  },
  epistemicLabel:'verified',
  temporalLabel:'current',
  causalLabel:'not_claimed',
  applicability:{scope:'project',ref:'prj_command-center'},
  privacy:{ownerId:'owner-1',classification:'project_private',scopeRef:'prj_command-center'},
  evidenceIds:['evd_provider-neutral']
};
const context={ownerId:'owner-1',authorizedScopeKeys:['project:prj_command-center']};

function route(key,providerKey,executionMode,privacy){
  return {
    key,
    providerKey,
    modelId:`${providerKey}-model`,
    versionRef:'v1',
    executionMode,
    enabled:true,
    capabilities:['knowledge:interpret'],
    cost:'free',
    privacy,
    health:'available',
    qualityRank:10,
    latencyRank:10,
    quotaAvailable:true
  };
}

test('CCR-02146 stored canonical knowledge remains valid when the eligible AI provider is replaced',()=>{
  const routes=new AiRouteRegistry();
  routes.register(route('ai-route:provider-a','provider-a','remote','remote'));
  assert.equal(routes.route({capability:'knowledge:interpret',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).providerKey,'provider-a');
  const before=JSON.stringify(envelope);
  assert.equal(validateSharedIntelligenceEnvelope(envelope,context),envelope);

  routes.remove('ai-route:provider-a');
  routes.register(route('ai-route:provider-b','provider-b','self_hosted','local'));
  assert.equal(routes.route({capability:'knowledge:interpret',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).providerKey,'provider-b');
  assert.equal(validateSharedIntelligenceEnvelope(envelope,context),envelope);
  assert.equal(JSON.stringify(envelope),before);
});
