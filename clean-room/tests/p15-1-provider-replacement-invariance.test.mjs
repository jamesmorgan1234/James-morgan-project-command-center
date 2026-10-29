import test from 'node:test';
import assert from 'node:assert/strict';
import {AiRouteRegistry,BrainMemoryLedger,voiceIntent} from '../dist/brain/index.js';

const T0='2026-10-29T08:00:00Z';

test('P15.1 replacing an AI provider route does not erase or rewrite canonical Brain memory lineage',()=>{
 const memory=new BrainMemoryLedger();
 memory.append({id:'memory-1',ownerId:'owner-1',projectId:'command-center',kind:'fact',version:1,state:'current',value:{rule:'Command Center remains top-level'},confidence:1,sensitivity:'internal',sourceRefs:['owner:rule'],recordedAt:T0});
 memory.append({id:'memory-2',ownerId:'owner-1',projectId:'command-center',kind:'fact',version:2,state:'current',value:{rule:'Command Center remains permanent top-level'},confidence:1,sensitivity:'internal',sourceRefs:['owner:rule-update'],recordedAt:'2026-10-29T08:01:00Z',supersedes:'memory-1'});
 const beforeCurrent=structuredClone(memory.current('owner-1','command-center'));
 const beforeHistory=structuredClone(memory.history('memory-1'));
 const routes=new AiRouteRegistry();
 routes.register({key:'ai-route:old',providerKey:'provider-old',modelId:'model-old',versionRef:'v1',executionMode:'remote',enabled:true,capabilities:['reason'],cost:'free',privacy:'private_remote',health:'available',qualityRank:5,latencyRank:2,quotaAvailable:true});
 assert.equal(routes.route({capability:'reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true})?.providerKey,'provider-old');
 routes.remove('ai-route:old');
 routes.register({key:'ai-route:new',providerKey:'provider-new',modelId:'model-new',versionRef:'v2',executionMode:'local',enabled:true,capabilities:['reason'],cost:'free',privacy:'local',health:'available',qualityRank:6,latencyRank:1,quotaAvailable:true});
 assert.equal(routes.route({capability:'reason',allowPaid:false,maxPrivacy:'remote',preferQuality:true})?.providerKey,'provider-new');
 assert.deepEqual(memory.current('owner-1','command-center'),beforeCurrent);
 assert.deepEqual(memory.history('memory-1'),beforeHistory);
});

test('P15.1 changing voice adapters preserves canonical intent while permission finality availability and adapter identity still fail closed',()=>{
 const first={key:'speech:first',available:true,permission:'granted'};
 const second={key:'speech:second',available:true,permission:'granted'};
 const text='deploy this now';
 const firstIntent=voiceIntent(first,{text,final:true,adapterKey:first.key});
 const secondIntent=voiceIntent(second,{text,final:true,adapterKey:second.key});
 assert.deepEqual(secondIntent,firstIntent);
 assert.equal(firstIntent.intent,'protected_action_request');
 assert.throws(()=>voiceIntent({...second,permission:'denied'},{text,final:true,adapterKey:second.key}),/permission/);
 assert.throws(()=>voiceIntent({...second,available:false},{text,final:true,adapterKey:second.key}),/unavailable/);
 assert.throws(()=>voiceIntent(second,{text,final:false,adapterKey:second.key}),/partial transcript/);
 assert.throws(()=>voiceIntent(second,{text,final:true,adapterKey:first.key}),/adapter mismatch/);
});
