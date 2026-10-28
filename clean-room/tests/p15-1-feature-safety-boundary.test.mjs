import test from 'node:test';import assert from 'node:assert/strict';import {SafeFeatureFlags} from '../dist/kernel/index.js';
const record=(patch={})=>({key:'flag:test',version:1,enabled:false,safeToEnable:false,...patch});
test('P15.1 feature safety and enabled states reject ambiguous booleans before registration',()=>{
 for(const field of ['enabled','safeToEnable'])for(const value of ['false','true',0,1,null,undefined]){const flags=new SafeFeatureFlags();assert.throws(()=>flags.register(record({[field]:value})),/boolean/);assert.equal(flags.enabled('flag:test'),false);}
});
test('P15.1 unsafe feature replacement cannot use truthy safety text or consume its current version',()=>{
 const flags=new SafeFeatureFlags();flags.register(record());
 assert.throws(()=>flags.replace(record({version:2,enabled:true,safeToEnable:'false'}),1),/boolean/);assert.equal(flags.enabled('flag:test'),false);
 flags.replace(record({version:2,enabled:true,safeToEnable:true}),1);assert.equal(flags.enabled('flag:test'),true);
 assert.throws(()=>flags.replace(record({version:3,enabled:true,safeToEnable:false}),2),/Unsafe/);assert.equal(flags.enabled('flag:test'),true);
});
test('P15.1 valid feature flags retain explicit safe enablement stale-write rejection and unknown-off defaults',()=>{
 const flags=new SafeFeatureFlags();assert.equal(flags.enabled('missing'),false);flags.register(record());assert.equal(flags.enabled('flag:test'),false);
 flags.replace(record({version:2,enabled:true,safeToEnable:true}),1);assert.equal(flags.enabled('flag:test'),true);
 assert.throws(()=>flags.replace(record({version:3}),1),/Optimistic/);assert.equal(flags.enabled('flag:test'),true);
});