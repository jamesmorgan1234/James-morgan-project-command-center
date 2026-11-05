import test from 'node:test';
import assert from 'node:assert/strict';
import {createSourceAttestation} from '../scripts/github-runner-proof.mjs';
const revision = 'a'.repeat(40);
const read = p => Buffer.from('source:' + p + ' '.repeat(300));

test('proof hashes two exact central source files but never claims project work', () => {
  const proof = createSourceAttestation({read, revision, requestId:'proof_123'});
  assert.equal(proof.schema, 'command-center.github-runner-proof.v1');
  assert.equal(proof.sourceRevision, revision);
  assert.equal(proof.sourceFiles.length, 2);
  assert.ok(proof.sourceFiles.every(v => /^[a-f0-9]{64}$/.test(v.sha256)));
  assert.equal(proof.projectExecutionVerified, false);
  assert.equal(proof.canonicalProgressChanged, false);
  assert.equal(proof.scheduleUsed, false);
  assert.ok(!JSON.stringify(proof).includes('company:future:'));
});

test('invalid ref and unbounded request rejected before reading source', () => {
  let calls = 0;
  const spy = () => { calls++; return Buffer.from('x'.repeat(300)); };
  assert.throws(() => createSourceAttestation({read:spy, revision:'z'.repeat(40)}), /Invalid source revision/);
  assert.throws(() => createSourceAttestation({read:spy, revision, requestId:'*'}), /Invalid proof identifier/);
  assert.equal(calls, 0);
});

test('missing source rejects instead of fabricating a proof', () => {
  assert.throws(() => createSourceAttestation({read:() => Buffer.from('no'),revision}), /Required source missing/);
});
