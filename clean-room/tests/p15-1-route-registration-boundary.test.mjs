import test from 'node:test';import assert from 'node:assert/strict';import {RouteRegistry,createCoreRouteRegistry} from '../dist/ui/routes.js';
const route=(patch={})=>({key:'route:test',path:'/test',title:'Test',moduleKey:'module:test',scrollOwner:'shell',backBehavior:'history',...patch});
test('P15.1 route registry rejects unknown navigation and scroll ownership states before registration',()=>{
 for(const patch of [{scrollOwner:'module'},{scrollOwner:null},{scrollOwner:undefined},{backBehavior:'unknown'},{backBehavior:null},{backBehavior:undefined}]){const routes=new RouteRegistry();assert.throws(()=>routes.register(route(patch)));assert.equal(routes.list().length,0);}
});
test('P15.1 canonical route aliases cannot register competing owners under trailing slashes',()=>{
 const routes=new RouteRegistry();routes.register(route());assert.throws(()=>routes.register(route({key:'route:other',path:'/test/'})),/Duplicate/);assert.equal(routes.resolve('/test/').route.key,'route:test');assert.equal(routes.list().length,1);
});
test('P15.1 equivalent parameter patterns repeated parameters and URL-like route declarations reject',()=>{
 const routes=new RouteRegistry();routes.register(route({path:'/project/:id'}));assert.throws(()=>routes.register(route({key:'route:other',path:'/project/:projectId'})),/Duplicate/);
 for(const path of ['/:id/:id','/:__proto__','/:constructor','/test?mode=one','/test#anchor','//outside.example/test','/test//child'])assert.throws(()=>new RouteRegistry().register(route({path})),path);
});
test('P15.1 valid route extension preserves decoded parameters exact-route precedence safe malformed paths and removal',()=>{
 const routes=new RouteRegistry();routes.register(route({path:'/project/:id/'}));assert.equal(routes.resolve('/project/project%3Aalpha?x=1#anchor').params.id,'project:alpha');assert.equal(routes.resolve('/project/%E0%A4%A'),undefined);
 routes.register(route({key:'route:settings',path:'/project/settings'}));assert.equal(routes.resolve('/project/settings').route.key,'route:settings');routes.remove('route:test');routes.register(route({key:'route:replacement',path:'/project/:projectId'}));assert.equal(routes.resolve('/project/alpha').route.key,'route:replacement');assert.equal(createCoreRouteRegistry().resolve('/projects').route.key,'route:projects');
});