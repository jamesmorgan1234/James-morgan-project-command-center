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
