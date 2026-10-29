import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry} from '../dist/brain/index.js';
import {CommandGraph} from '../dist/data/index.js';

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

test('CCR-02168 model migration does not require rewriting Command Graph',()=>{
  const graph=new CommandGraph();
  graph.addNode({id:'prj_command-center',type:'project',ownerId:'owner-1',canonicalName:'Command Center'});
  graph.addNode({id:'rule:preserve-work',type:'rule',ownerId:'owner-1',canonicalName:'Preserve verified work'});
  graph.addEdge({
    id:'edge:project-references-rule',
    from:'prj_command-center',
    to:'rule:preserve-work',
    relation:'references',
    version:1,
    sourceRef:'source:canonical-graph',
    effectiveAt:'2026-10-29T00:00:00Z'
  });
  const before={
    project:graph.getNode('prj_command-center'),
    rule:graph.getNode('rule:preserve-work'),
    edges:graph.neighbors('prj_command-center')
  };

  const routes=new AiRouteRegistry();
  routes.register(modelRoute('ai-route:model-a','provider-a','model-a'));
  routes.remove('ai-route:model-a');
  routes.register(modelRoute('ai-route:model-b','provider-b','model-b','self_hosted','local'));
  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).modelId,'model-b');

  assert.deepEqual(graph.getNode('prj_command-center'),before.project);
  assert.deepEqual(graph.getNode('rule:preserve-work'),before.rule);
  assert.deepEqual(graph.neighbors('prj_command-center'),before.edges);
});
