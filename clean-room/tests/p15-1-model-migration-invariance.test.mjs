import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry} from '../dist/brain/index.js';
import {ProjectRegistry,ProjectTypeRegistry} from '../dist/projects/index.js';

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

test('CCR-02166 model migration does not require rewriting canonical projects',()=>{
  const types=new ProjectTypeRegistry();
  types.register({
    key:'project-type:command-center',
    version:1,
    label:'Command Center',
    capabilities:['project:read'],
    requiredDetailSections:['overview'],
    domainPlaybookKey:'playbook:command-center'
  });
  const projects=new ProjectRegistry(types);
  const project={
    id:'prj_command-center',
    typeKey:'project-type:command-center',
    ownerId:'owner-1',
    name:'Command Center',
    mission:'Operate the canonical control plane.',
    lifecycle:'active',
    status:'P15.1 open',
    verification:'partial',
    priority:'critical',
    version:1,
    createdAt:'2026-10-29T00:00:00Z',
    updatedAt:'2026-10-29T00:00:00Z',
    agentAccessEnabled:true,
    portfolioAutoEnabled:false,
    protected:true
  };
  projects.create(project);
  const before=JSON.stringify(projects.get(project.id));

  const routes=new AiRouteRegistry();
  routes.register(modelRoute('ai-route:model-a','provider-a','model-a'));
  routes.remove('ai-route:model-a');
  routes.register(modelRoute('ai-route:model-b','provider-b','model-b','self_hosted','local'));
  assert.equal(routes.route({capability:'brain:reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true}).modelId,'model-b');

  assert.equal(JSON.stringify(projects.get(project.id)),before);
  assert.deepEqual(projects.get(project.id),project);
});
