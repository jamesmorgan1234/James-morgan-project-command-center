import test from 'node:test';
import assert from 'node:assert/strict';
import { createKernelRuntime } from '../src/index.js';
import { TRUST, SENSITIVITY, deriveSensitivity } from '../src/security/trust.js';
import { SecurityIncident } from '../src/security/incidents.js';

function preparedRuntime(now = Date.now()) {
  const runtime = createKernelRuntime();
  runtime.permissions.define('deploy.production', { risk: 'critical' });
  runtime.protectedActions.define('deployment.promote', { permission: 'deploy.production', irreversible: false });
  runtime.sessions.create({ id: 's1', ownerId: 'james', deviceId: 'phone', expiresAt: now + 60_000 });
  return runtime;
}

test('protected actions are default deny without explicit grant', () => {
  const runtime = preparedRuntime();
  const decision = runtime.security.evaluate({ actionId: 'deployment.promote', ownerId: 'james', sessionId: 's1', sourceTrust: TRUST.OWNER });
  assert.equal(decision.allowed, false);
});

test('authorization is scoped and cannot silently broaden', () => {
  const now = Date.now();
  const runtime = preparedRuntime(now);
  runtime.authorizations.grant({ id: 'g1', ownerId: 'james', permission: 'deploy.production', scope: { projectId: 'cc' }, expiresAt: now + 30_000, evidence: 'explicit-owner-approval' });
  assert.equal(runtime.security.evaluate({ actionId: 'deployment.promote', ownerId: 'james', sessionId: 's1', sourceTrust: TRUST.OWNER, scope: { projectId: 'cc' }, now }).allowed, true);
  assert.equal(runtime.security.evaluate({ actionId: 'deployment.promote', ownerId: 'james', sessionId: 's1', sourceTrust: TRUST.OWNER, scope: { projectId: 'other' }, now }).allowed, false);
});

test('external content and model output cannot authorize actions', () => {
  const now = Date.now();
  const runtime = preparedRuntime(now);
  runtime.authorizations.grant({ id: 'g1', ownerId: 'james', permission: 'deploy.production', scope: {}, expiresAt: now + 30_000, evidence: 'owner' });
  assert.equal(runtime.security.evaluate({ actionId: 'deployment.promote', ownerId: 'james', sessionId: 's1', sourceTrust: TRUST.EXTERNAL_CONTENT, now }).allowed, false);
  assert.equal(runtime.security.evaluate({ actionId: 'deployment.promote', ownerId: 'james', sessionId: 's1', sourceTrust: TRUST.MODEL_OUTPUT, now }).allowed, false);
});

test('expired or revoked session cannot authorize', () => {
  const now = Date.now();
  const runtime = preparedRuntime(now);
  runtime.authorizations.grant({ id: 'g1', ownerId: 'james', permission: 'deploy.production', scope: {}, expiresAt: now + 30_000, evidence: 'owner' });
  runtime.sessions.revoke('s1');
  assert.equal(runtime.security.evaluate({ actionId: 'deployment.promote', ownerId: 'james', sessionId: 's1', sourceTrust: TRUST.OWNER, now }).allowed, false);
});

test('secret registry stores references and rejects secret-bearing fields', () => {
  const runtime = createKernelRuntime();
  const ref = runtime.secrets.register('github', { provider: 'github', locator: 'env:GITHUB_TOKEN', scope: 'repo' });
  assert.equal(ref.locator, 'env:GITHUB_TOKEN');
  assert.throws(() => runtime.secrets.register('bad', { provider: 'x', locator: 'vault:1', token: 'plaintext' }), /forbidden/i);
});

test('derived sensitivity never downgrades the most sensitive input', () => {
  assert.equal(deriveSensitivity([SENSITIVITY.PUBLIC, SENSITIVITY.FINANCIAL, SENSITIVITY.PRIVATE]), SENSITIVITY.FINANCIAL);
});

test('security incident lifecycle is explicit and reversible only through defined transitions', () => {
  const incident = new SecurityIncident({ id: 'inc-1', severity: 'high', summary: 'test' });
  incident.transition('contained', 'isolate');
  incident.transition('resolved', 'fixed', 'evidence');
  incident.transition('reopened', 'regression');
  assert.equal(incident.state, 'reopened');
});
