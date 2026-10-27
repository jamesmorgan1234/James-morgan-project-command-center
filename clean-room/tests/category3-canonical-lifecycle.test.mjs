import test from 'node:test';
import assert from 'node:assert/strict';
import { CanonicalStore } from '../dist/data/index.js';
const entity = {id:'entity-1',entityType:'project',ownerId:'owner-1',version:1,createdAt:'2026-10-25T00:00:00Z',updatedAt:'2026-10-26T00:00:00Z',payload:{amount:0}};
test('canonical lifecycle rejects backwards writes atomically and preserves verified zero', () => {
  const store = new CanonicalStore(); store.create(entity);
  assert.throws(() => store.replace({...entity,version:2,updatedAt:entity.createdAt},1), /backwards/);
  assert.throws(() => store.tombstone(entity.id,1,entity.createdAt), /latest update/);
  assert.equal(store.get(entity.id).version,1);
  assert.equal(store.get(entity.id).payload.amount,0);
  store.replace({...entity,version:2,updatedAt:'2026-10-27T00:00:00Z'},1);
  assert.equal(store.get(entity.id).version,2);
});
test('canonical deletion requires explicit tombstone and cannot silently revive or repeat', () => {
  const store = new CanonicalStore(); store.create(entity);
  const deletedAt='2026-10-27T00:00:00Z';
  assert.throws(() => store.replace({...entity,version:2,deletedAt,updatedAt:deletedAt},1), /Use tombstone/);
  const tombstone=store.tombstone(entity.id,1,deletedAt);
  assert.equal(store.list().length,0); assert.equal(store.list(true).length,1);
  assert.throws(() => store.replace({...entity,version:3,updatedAt:deletedAt},2), /silently revived/);
  assert.throws(() => store.tombstone(entity.id,2,deletedAt), /already tombstoned/);
  assert.equal(store.get(entity.id),tombstone);
});

test('canonical schema compatibility distinguishes schema version from record version', () => {
  for (const schemaVersion of [0,2,-1,1.5,null,'1',NaN]) {
    const store=new CanonicalStore();
    assert.throws(()=>store.create({...entity,schemaVersion}), /schema version/);
    assert.equal(store.list(true).length,0);
  }
  const store=new CanonicalStore(); store.create({...entity,schemaVersion:1});
  store.replace({...entity,schemaVersion:1,version:2},1);
  assert.equal(store.get(entity.id).version,2);
  for (const payload of [null,[],0,'']) assert.throws(()=>new CanonicalStore().create({...entity,payload}), /payload/);
  assert.throws(()=>new CanonicalStore().create({...entity,projectId:''}), /scope/);
});

test('truth decoding rejects ambiguity and preserves explicit zero unknown and N/A', async () => {
  const {parseTruthValue}=await import('../dist/data/index.js');
  const number=(value)=>{if(typeof value!=='number'||!Number.isFinite(value)) throw new Error('number required');return value;};
  assert.deepEqual(parseTruthValue(JSON.parse('{"state":"known","value":0}'),number),{state:'known',value:0});
  for(const state of ['unknown','not_applicable']) assert.deepEqual(parseTruthValue({state},number),{state});
  for(const input of [null,{},0,{state:'known'},{state:'known',value:null},{state:'known',value:'0'},{state:'unknown',value:0},{state:'not_applicable',value:undefined},{state:'known',value:0,verified:true},{state:'future'}]) assert.throws(()=>parseTruthValue(input,number));
});

test('canonical records own immutable JSON snapshots and failed serialization leaves state unchanged',()=>{
  const payload={nested:{zero:0},items:[{name:'original'}]};
  const store=new CanonicalStore(); store.create({...entity,payload});
  payload.nested.zero=10; payload.items[0].name='changed';
  assert.equal(store.get(entity.id).payload.nested.zero,0);
  assert.equal(store.get(entity.id).payload.items[0].name,'original');
  assert.throws(()=>{store.get(entity.id).payload.nested.zero=20;},TypeError);
  const cycle={}; cycle.self=cycle;
  for(const invalid of [{x:undefined},{x:NaN},{x:Infinity},{x:1n},{x:new Date()},cycle,{x:[,]}]){
    assert.throws(()=>store.replace({...entity,version:2,payload:invalid},1), /JSON/);
    assert.equal(store.get(entity.id).version,1);
  }
});
