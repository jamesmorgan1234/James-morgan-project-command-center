import test from 'node:test';
import assert from 'node:assert/strict';
import {PortabilityCenter} from '../dist/data/index.js';
test('portable round-trip freezes independent snapshots and rejects ambiguous provenance and sensitivity',()=>{
 const center=new PortabilityCenter();const record={id:'entity',entityType:'project',version:1,contentHash:'hash',sensitivity:'internal',provenanceRefs:['receipt'],data:{nested:{value:0}}};
 const exported=center.export([record]);record.data.nested.value=1;
 assert.equal(exported.records[0].data.nested.value,0);
 assert.throws(()=>{exported.records[0].data.nested.value=2;},TypeError);
 assert.equal(center.stageImport('batch',JSON.parse(JSON.stringify(exported.records)),exported.records).results[0].disposition,'duplicate');
 for(const changes of [{sensitivity:'future'},{provenanceRefs:['']},{provenanceRefs:['same','same']},{data:null},{data:{value:undefined}}]) assert.throws(()=>center.export([{...record,...changes}]));
 assert.throws(()=>center.stageImport('batch',[record],[record,record]), /unique/);
 assert.equal(center.export([{...record,sensitivity:'secret'}]).redactedCount,1);
});
