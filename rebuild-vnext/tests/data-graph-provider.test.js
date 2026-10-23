import test from 'node:test';
import assert from 'node:assert/strict';
import { createKernelRuntime } from '../src/index.js';
import { ConcurrencyError } from '../src/data/record-store.js';

test('record store preserves history and rejects lost updates', () => {
  const runtime = createKernelRuntime();
  const one = runtime.records.create({ id: 'p1', type: 'project', data: { name: 'A' }, provenance: { source: 'owner' } });
  const two = runtime.records.update('p1', { name: 'B' }, { expectedVersion: 1, provenance: { source: 'owner-correction' } });
  assert.equal(two.version, 2);
  assert.equal(runtime.records.history('p1').length, 2);
  assert.throws(() => runtime.records.update('p1', { name: 'C' }, { expectedVersion: 1, provenance: { source: 'stale' } }), ConcurrencyError);
});

test('soft deletion and restoration preserve the record and history', () => {
  const runtime = createKernelRuntime();
  runtime.records.create({ id: 'x', type: 'note', data: {}, provenance: { source: 'owner' } });
  const deleted = runtime.records.softDelete('x', { expectedVersion: 1, provenance: { source: 'owner' } });
  assert.equal(deleted.state, 'deleted');
  const restored = runtime.records.restore('x', { expectedVersion: 2, provenance: { source: 'owner' } });
  assert.equal(restored.state, 'active');
  assert.equal(runtime.records.history('x').length, 3);
});

test('protected asset cannot be versioned without explicit protected-change path', () => {
  const runtime = createKernelRuntime();
  runtime.assets.register({ id: 'cover', type: 'image', bytes: 'v1', provenance: { source: 'approved-file' } });
  runtime.assets.protect('cover');
  assert.throws(() => runtime.assets.addVersion('cover', { bytes: 'v2', provenance: { source: 'new-file' } }), /Protected asset/);
  const changed = runtime.assets.addVersion('cover', { bytes: 'v2', provenance: { source: 'owner-authorized' }, allowProtectedChange: true });
  assert.equal(changed.currentVersion, 2);
  assert.notEqual(changed.versions[0].sha256, changed.versions[1].sha256);
});

test('command graph keeps inferred edges distinct from verified edges', () => {
  const runtime = createKernelRuntime();
  runtime.graph.addNode({ id: 'a', type: 'project', provenance: { source: 'owner' } });
  runtime.graph.addNode({ id: 'b', type: 'provider', provenance: { source: 'provider' } });
  runtime.graph.addEdge({ id: 'e1', from: 'a', to: 'b', type: 'depends_on', provenance: { source: 'analysis' }, confidence: 0.7, verificationState: 'inferred' });
  assert.equal(runtime.graph.dependsOn('a')[0].verificationState, 'inferred');
  assert.throws(() => runtime.graph.addEdge({ id: 'e2', from: 'a', to: 'b', type: 'depends_on', provenance: { source: 'analysis' }, confidence: 0.7, verificationState: 'verified' }), /cannot silently become verified/i);
});

test('provider adapters normalize at the boundary and expose health separately', async () => {
  const runtime = createKernelRuntime();
  runtime.providers.register('demo', {
    kind: 'example', version: '1', capabilities: ['read'],
    normalize: payload => ({ canonicalId: payload.external_id, value: payload.v }),
    health: async () => ({ state: 'healthy', freshness: 123 })
  });
  assert.deepEqual(runtime.providers.normalize('demo', { external_id: 'abc', v: 7 }), { canonicalId: 'abc', value: 7 });
  assert.equal((await runtime.providers.health('demo')).state, 'healthy');
});
