import test from 'node:test';import assert from 'node:assert/strict';import {ModuleRegistry,validateModuleContract} from '../dist/kernel/index.js';
const arrays=['ownsData','ownsCapabilities','usesData','usesCapabilities','dependencies','permissions','routes','events','migrations','tests'];
const fixture=(patch={})=>({key:'mod:alpha',version:1,enabled:true,owner:'owner:alpha',ownsData:['data:alpha'],ownsCapabilities:['cap:alpha'],usesData:[],usesCapabilities:[],dependencies:[],permissions:['permission:read'],routes:['route:alpha'],events:['event:alpha'],migrations:['migration:alpha'],healthCheckKey:'health:alpha',securityClass:'internal',activation:'manual',failureBehavior:'isolate',canDisable:true,canUninstall:true,tests:['module:test'],...patch});
test('P15.1 module registration snapshots caller-owned reference arrays before authority decisions',()=>{
 const registry=new ModuleRegistry(),input=fixture();registry.register(input);input.ownsData.push('data:private');input.permissions.push('permission:write');
 assert.deepEqual(registry.get('mod:alpha').ownsData,['data:alpha']);assert.deepEqual(registry.get('mod:alpha').permissions,['permission:read']);
 assert.throws(()=>registry.assertDataAccess('mod:alpha','data:private'),/Undeclared/);
});
test('P15.1 module read surfaces cannot mutate ownership dependencies permissions or lifecycle evidence',()=>{
 const registry=new ModuleRegistry();registry.register(fixture());
 for(const surface of [registry.get('mod:alpha'),registry.list()[0]])for(const field of arrays){assert.ok(Object.isFrozen(surface[field]),field);assert.throws(()=>surface[field].push('injected'),TypeError);}
 registry.replace(fixture({version:2}),1);assert.ok(Object.isFrozen(registry.get('mod:alpha').ownsData));
});
test('P15.1 module lifecycle flags must be explicit booleans before registration or replacement',()=>{
 for(const field of ['enabled','canDisable','canUninstall'])for(const value of ['false','true',0,null,undefined]){
  const registry=new ModuleRegistry();assert.throws(()=>registry.register(fixture({[field]:value})),/boolean/);assert.equal(registry.list().length,0);
  registry.register(fixture());assert.throws(()=>registry.replace(fixture({version:2,[field]:value}),1),/boolean/);assert.equal(registry.get('mod:alpha').version,1);
 }
});
test('P15.1 module manifests require arrays of unique nonblank references for each declared contract area',()=>{
 assert.doesNotThrow(()=>validateModuleContract(fixture()));
 for(const field of ["owner","healthCheckKey"])assert.throws(()=>validateModuleContract(fixture({[field]:""})),/required/);
 for(const field of arrays)for(const value of ['xyz',undefined,null,[''],['same','same']])assert.throws(()=>validateModuleContract(fixture({[field]:value})),field);
});