import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  ALLOWED_COMPANY_IDS, validateCompany116Manifest, verifyCompany116Sources
} from './verify-company-116-source-manifest.mjs';

const canonicalSource = (id) => `# Company ${id} — Offline Fixture\nCompany ID: company:future:${id}\nProject: project:company:future:${id}\n`;
const fixture = () => ALLOWED_COMPANY_IDS.map((id) => ({
  companyId: `company:future:${id}`,
  projectId: `project:company:future:${id}`,
  sourcePath: `roadmap/portfolio-future-architecture/companies/${id}_OFFLINE_FIXTURE.md`,
  expectedSha256: createHash('sha256').update(canonicalSource(id)).digest('hex')
}));

test('allowlist contains exactly the 116 separately authorized company identities', () => {
  assert.equal(ALLOWED_COMPANY_IDS.length, 116);
  assert.equal(ALLOWED_COMPANY_IDS[0], '001');
  assert.equal(ALLOWED_COMPANY_IDS.at(-1), '117');
  assert.equal(ALLOWED_COMPANY_IDS.includes('014'), false);
  assert.equal(new Set(ALLOWED_COMPANY_IDS).size, 116);
});

test('success: precisely 116 source identities and digests, no external or executor claims', async () => {
  const reads = [];
  const report = await verifyCompany116Sources(fixture(), { root: '/repo', readSource: async (_path, row) => {
    reads.push(row.companyId);
    return canonicalSource(row.companyId.slice(-3));
  }});
  assert.equal(report.scopedCompanyCount, 116);
  assert.equal(reads.length, 116);
  assert.equal(reads.includes('company:future:014'), false);
  assert.equal(report.noWorkerStarted, true);
  assert.equal(report.noExternalProviderCalled, true);
  assert.equal(report.noBuildOrRevenueCertified, true);
  assert.equal(report.sources.every((x) => x.status === 'SOURCE_IDENTITY_AND_DIGEST_VERIFIED_ONLY'), true);
});

test('hard fail BEFORE ANY READ when excluded identity is included', async () => {
  const rows = fixture();
  rows[13] = {...rows[13],companyId: 'company:future:014',projectId:'project:company:future:014',
    sourcePath:'roadmap/portfolio-future-architecture/companies/014_PROTECTED.md'};
  let reads = 0;
  await assert.rejects(verifyCompany116Sources(rows, {readSource: async () => { reads++; return ''; }}), /outside the authorized/);
  assert.equal(reads, 0);
});

test('hard fail BEFORE ANY READ on partial scope, duplicate, traversal or identity mismatch', async () => {
  const corruptions = [
    (rows) => rows.pop(),
    (rows) => {rows[1] = {...rows[0]};},
    (rows) => {rows[0] = {...rows[0],sourcePath:'../014_PROTECTED.md'};},
    (rows) => {rows[0] = {...rows[0],projectId:'project:company:future:117'};},
    (rows) => {rows[0] = {...rows[0],expectedSha256:'unverified'};}
  ];
  for (const corrupt of corruptions) {
    const rows = fixture(); corrupt(rows); let reads = 0;
    await assert.rejects(verifyCompany116Sources(rows, {readSource: async () => {reads++; return ''; }}));
    assert.equal(reads, 0);
  }
});

test('content drift and source identity mismatch cannot be promoted as verified', async () => {
  await assert.rejects(verifyCompany116Sources(fixture(), {root:'/repo',readSource: async (_path,row) =>
    row.companyId === 'company:future:001' ? 'tampered content' : canonicalSource(row.companyId.slice(-3))}), /hash mismatch/);
  const rows = fixture();
  rows[0].expectedSha256 = createHash('sha256').update('wrong source identity').digest('hex');
  await assert.rejects(verifyCompany116Sources(rows, {root:'/repo',readSource: async (_path,row) =>
    row.companyId === 'company:future:001' ? 'wrong source identity' : canonicalSource(row.companyId.slice(-3))}), /title mismatch/);
});

test('manifest input is not mutated, output is deterministic and frozen', () => {
  const rows = fixture().reverse(); const first = rows[0].companyId;
  const validated = validateCompany116Manifest(rows);
  assert.equal(rows[0].companyId, first);
  assert.equal(validated[0].companyId, 'company:future:001');
  assert.ok(Object.isFrozen(validated));
  assert.ok(Object.isFrozen(validated[0]));
});
