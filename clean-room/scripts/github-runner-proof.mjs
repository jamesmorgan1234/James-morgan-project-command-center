#!/usr/bin/env node
/**
 * Read-only, source-exact proof that a GitHub-hosted standard runner executed.
 * Deliberately NOT a company builder, AI worker, or canonical progress event.
 */
import {readFileSync, appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const paths = Object.freeze([
  'supabase/functions/command-center-execution/handler.mjs',
  'supabase/functions/command-center-execution/immediate-dispatch.mjs'
]);
const SHA = /^[a-f0-9]{40}$/i;
const PROOF = /^[a-zA-Z0-9_-]{1,64}$/;
export function createSourceAttestation({read, revision, requestId = 'local-test'}) {
  if (typeof revision !== 'string' || !SHA.test(revision)) throw Error('Invalid source revision');
  if (typeof requestId !== 'string' || !PROOF.test(requestId)) throw Error('Invalid proof identifier');
  const hashes = paths.map(path => {
    const data = read(path);
    if (!data || data.length < 100) throw Error('Required source missing: ' + path);
    return Object.freeze({path, sha256: createHash('sha256').update(data).digest('hex')});
  });
  return Object.freeze({
    schema: 'command-center.github-runner-proof.v1',
    sourceRevision: revision.toLowerCase(),
    proofRequestId: requestId,
    capability: 'repository.source_attestation',
    sourceFiles: hashes,
    projectExecutionVerified: false,
    canonicalProgressChanged: false,
    billingMode: 'public-standard-github-hosted-runner',
    scheduleUsed: false
  });
}

function main() {
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
  const expected = process.env.CC_EXPECTED_SHA;
  if (expected && (!SHA.test(expected) || expected.toLowerCase() !== revision.toLowerCase()))
    throw Error('Source revision does not match the dispatched request');
  const receipt = createSourceAttestation({
    read: p => readFileSync(resolve(root, p)), revision,
    requestId: process.env.CC_PROOF_REQUEST_ID || 'local-test'
  });
  const json = JSON.stringify(receipt);
  console.log('CC_SOURCE_ATTESTATION=' + json);
  // GitHub job summary is readable as execution evidence without uploading
  // storage artifacts, pushing commits, or accessing production credentials.
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      '### COMMAND CENTER — read-only runner proof\n\nSource: ' + revision + '\n\n' +
      'Capability: repository.source_attestation (not project execution).\n\n' +
      'Proof request: ' + receipt.proofRequestId + '\n');
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) {
    console.error('CC_SOURCE_ATTESTATION_FAILED=' + (error instanceof Error ? error.message : 'unknown'));
    process.exitCode = 1;
  }
}
