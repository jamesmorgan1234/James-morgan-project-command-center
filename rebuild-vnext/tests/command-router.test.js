import test from 'node:test';
import assert from 'node:assert/strict';
import { createKernelRuntime } from '../src/index.js';

test('command bus applies invariants and idempotency', async () => {
  const runtime = createKernelRuntime();
  let executions = 0;
  let checks = 0;
  runtime.invariants.register('always-valid', () => { checks += 1; return true; });
  runtime.commands.define('demo.increment', {
    handler: async command => { executions += 1; return { value: command.value + 1 }; }
  });
  const command = { type: 'demo.increment', requestId: 'req-1', value: 4 };
  const first = await runtime.commands.execute(command);
  const second = await runtime.commands.execute(command);
  assert.equal(first.value.value, 5);
  assert.deepEqual(second, first);
  assert.equal(executions, 1);
  assert.equal(checks, 2);
});

test('router owns history and Back semantics', () => {
  const runtime = createKernelRuntime();
  runtime.routes.register('home', { path: '/', owner: 'A24' });
  runtime.routes.register('projects', { path: '/projects', owner: 'A12' });
  runtime.router.navigate('home', { scrollY: 12 });
  runtime.router.navigate('projects', { scrollY: 0 });
  assert.equal(runtime.router.current.routeId, 'projects');
  assert.equal(runtime.router.back().routeId, 'home');
  assert.equal(runtime.router.current.state.scrollY, 12);
});
