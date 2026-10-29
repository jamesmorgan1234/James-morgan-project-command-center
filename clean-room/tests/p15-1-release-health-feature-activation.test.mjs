import test from 'node:test';
import assert from 'node:assert/strict';
import {ReleaseFeatureActivationGate,SafeFeatureFlags} from '../dist/kernel/index.js';

const record=(patch={})=>({key:'flag:release',version:2,enabled:true,safeToEnable:true,...patch});
const request=(patch={})=>({candidateId:'candidate-a',deploymentId:'deployment-a',scopeRef:'release:command-center',now:'2026-10-29T08:00:00Z',...patch});
const health=(patch={})=>({id:'health-a',subjectId:'deployment-a',strength:'live_verified',sourceRef:'deployment-health:probe-a',recordedAt:'2026-10-29T07:59:00Z',verified:true,scopeRef:'release:command-center',candidateId:'candidate-a',deploymentId:'deployment-a',health:'healthy',validUntil:'2026-10-29T08:05:00Z',...patch});
function fresh(){const flags=new SafeFeatureFlags();flags.register({key:'flag:release',version:1,enabled:false,safeToEnable:false});return{flags,gate:new ReleaseFeatureActivationGate(flags)};}

test('P15.1 release-controlled feature activation requires exact live verified healthy deployment evidence',()=>{
 const {flags,gate}=fresh();
 gate.enable(record(),1,health(),request());
 assert.equal(flags.enabled('flag:release'),true);
});

test('P15.1 release-controlled feature activation fails before mutation for missing failed stale or mismatched health evidence',()=>{
 const cases=[
  [undefined,/evidence is required/],
  [health({verified:false}),/live-verified/],
  [health({strength:'canonical_record'}),/live-verified/],
  [health({health:'failed'}),/must be healthy/],
  [health({health:'degraded'}),/must be healthy/],
  [health({validUntil:'2026-10-29T08:00:00Z'}),/stale/],
  [health({recordedAt:'2026-10-29T08:01:00Z',validUntil:'2026-10-29T08:06:00Z'}),/future/],
  [health({candidateId:'candidate-b'}),/release candidate/],
  [health({deploymentId:'deployment-b'}),/exact deployment/],
  [health({subjectId:'deployment-b'}),/exact deployment/],
  [health({scopeRef:'release:other'}),/required scope/]
 ];
 for(const [evidence,pattern] of cases){const {flags,gate}=fresh();assert.throws(()=>gate.enable(record(),1,evidence,request()),pattern);assert.equal(flags.enabled('flag:release'),false);}
});

test('P15.1 release health evidence is single-use and optimistic conflicts do not consume evidence',()=>{
 const {flags,gate}=fresh();const first=health();
 assert.throws(()=>gate.enable(record(),2,first,request()),/concurrency conflict/);
 assert.equal(flags.enabled('flag:release'),false);
 gate.enable(record(),1,first,request());
 assert.equal(flags.enabled('flag:release'),true);
 assert.throws(()=>gate.enable(record({version:3}),2,first,request()),/already consumed/);
 const second=health({id:'health-b',recordedAt:'2026-10-29T07:59:30Z'});
 assert.throws(()=>gate.enable(record({version:3}),1,second,request()),/concurrency conflict/);
 gate.enable(record({version:3}),2,second,request());
 assert.equal(flags.enabled('flag:release'),true);
});
