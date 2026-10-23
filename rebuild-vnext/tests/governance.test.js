import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthorityRegistry } from '../src/governance/authority.js';
import { RequirementRegistry } from '../src/governance/requirements.js';

test('newer explicit owner instruction supersedes older conflicting owner instruction', () => {
  const authority = new AuthorityRegistry();
  const result = authority.resolve([
    { type: 'owner_instruction', explicit: true, sequence: 10, value: 'old', dimension: 'intent' },
    { type: 'owner_instruction', explicit: true, sequence: 11, value: 'new', dimension: 'intent' }
  ]);
  assert.equal(result.status, 'resolved');
  assert.equal(result.winner.value, 'new');
});

test('different truth dimensions are represented as conflict instead of silently conflated', () => {
  const authority = new AuthorityRegistry();
  const result = authority.resolve([
    { type: 'owner_instruction', explicit: true, sequence: 2, value: 'desired', dimension: 'desired_state' },
    { type: 'verified_live_provider', value: 'actual', dimension: 'actual_state' }
  ]);
  assert.equal(result.status, 'conflicted');
});

test('requirement progress counts only verified or locked', () => {
  const registry = new RequirementRegistry();
  registry.register({ id: 'R1', text: 'planned', architectureOwner: 'A00', state: 'planned' });
  registry.register({ id: 'R2', text: 'verified', architectureOwner: 'A00', state: 'verified' });
  registry.register({ id: 'R3', text: 'locked', architectureOwner: 'A00', state: 'locked' });
  assert.deepEqual(registry.coverage(), { total: 3, verified: 2, percentage: 2 / 3 * 100 });
});
