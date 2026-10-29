import test from 'node:test';
import assert from 'node:assert/strict';
import {proveReproducibleBuild} from '../scripts/p15-1-reproducible-build-proof.mjs';

test('P15.1 reproducible build produces byte-identical artifacts in two isolated clean workspaces',async()=>{
 const report=await proveReproducibleBuild();
 assert.equal(report.reproducible,true,JSON.stringify(report.differences,null,2));
 assert.equal(report.sourceCommit,report.releaseId);
 assert.equal(report.environment,'test');
 assert.equal(report.typescriptVersion,'5.8.3');
 assert.ok(report.inputFileCount>0);
 assert.ok(report.outputFileCount>0);
 assert.match(report.inputManifestHash,/^[a-f0-9]{64}$/);
 assert.match(report.firstOutputManifestHash,/^[a-f0-9]{64}$/);
 assert.equal(report.firstOutputManifestHash,report.secondOutputManifestHash);
 assert.deepEqual(report.differences,[]);
});
