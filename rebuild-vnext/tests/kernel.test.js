import test from 'node:test';
import assert from 'node:assert/strict';
import { createKernelRuntime } from '../src/index.js';
import { StateMachine } from '../src/kernel/state-machine.js';

const coreManifest = (dependencies = []) => ({
  version: '1.0.0', owner: 'A01', activationState: 'CORE — ACTIVE', dependencies,
  failureBehavior: 'recovery_required', disableBehavior: 'not permitted while core', removalBehavior: 'migration required'
});

test('state machine rejects invalid transitions', () => {
  const machine = new StateMachine({ initialState: 'a', transitions: { a: ['b'], b: [] } });
  assert.throws(() => machine.transition('c', { reason: 'invalid' }), /Cannot transition/);
});

test('module dependency cycles fail before startup', () => {
  const runtime = createKernelRuntime();
  runtime.modules.register('a', coreManifest(['b']));
  runtime.modules.register('b', coreManifest(['a']));
  assert.throws(() => runtime.modules.validateDependencyGraph(), /Circular module dependency/);
});

test('capability registry prevents duplicate canonical owner', () => {
  const runtime = createKernelRuntime();
  const cap = owner => ({ owner, inputs: {}, outputs: {}, permissions: [], riskLevel: 'low', activationState: 'CORE — ACTIVE', verification: 'contract-test' });
  runtime.capabilities.register('search.query', cap('A19'));
  assert.throws(() => runtime.capabilities.register('search.query', cap('A10')), /canonical owner|duplicate id/);
});

test('optional module failure degrades but does not take down core', async () => {
  const runtime = createKernelRuntime();
  runtime.modules.register('core', coreManifest());
  runtime.modules.register('optional', {
    ...coreManifest(['core']), owner: 'A20', activationState: 'BUILT — DORMANT', failureBehavior: 'isolate'
  });
  const result = await runtime.bootstrap.start({
    core: async () => ({ ok: true }),
    optional: async () => { throw new Error('optional down'); }
  });
  assert.equal(result.state, 'degraded');
});

test('core module failure enters recovery_required', async () => {
  const runtime = createKernelRuntime();
  runtime.modules.register('core', coreManifest());
  await assert.rejects(runtime.bootstrap.start({ core: async () => { throw new Error('boom'); } }), /Core module core failed/);
  assert.equal(runtime.bootstrap.lifecycle.state, 'recovery_required');
});
