// Read-only source verifier for the owner's strictly scoped 116-company build.
// Does not enumerate the company directory, mutate project data, run workers,
// call payment providers, or import the separately protected build's source.
import { createHash } from 'node:crypto';
import { readFile, lstat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

export const PORTFOLIO_SOURCE_DIRECTORY = 'roadmap/portfolio-future-architecture/companies/';
export const ALLOWED_COMPANY_IDS = Object.freeze(
  Array.from({ length: 117 }, (_, i) => String(i + 1).padStart(3, '0'))
    .filter((id) => id !== '014')
);

const ALLOWED = new Set(ALLOWED_COMPANY_IDS);
const SOURCE_PATH = /^roadmap\/portfolio-future-architecture\/companies\/(\d{3})_[A-Z0-9_]+\.md$/;
const HASH = /^[0-9a-f]{64}$/;

function requireValid(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * Validates every company identifier and path before ANY source file is opened.
 * The explicit manifest replaces whole-directory enumeration and prevents the
 * separately protected company from even being considered for a read.
 */
export function validateCompany116Manifest(manifest) {
  requireValid(Array.isArray(manifest), 'Manifest must be an array');
  requireValid(manifest.length === ALLOWED_COMPANY_IDS.length, 'Exactly 116 explicitly scoped entries required');
  const seen = new Set();
  for (const row of manifest) {
    requireValid(row !== null && typeof row === 'object' && !Array.isArray(row), 'Invalid manifest row');
    const id = row.companyId?.match(/^company:future:(\d{3})$/)?.[1];
    requireValid(id && ALLOWED.has(id), 'Company is outside the authorized 116-company scope');
    requireValid(!seen.has(id), `Repeated company identity ${id}`);
    requireValid(row.projectId === `project:company:future:${id}`, `Project identity mismatch ${id}`);
    const pathId = row.sourcePath?.match(SOURCE_PATH)?.[1];
    requireValid(pathId === id, `Unsafe or mismatched canonical source path ${id}`);
    requireValid(typeof row.expectedSha256 === 'string' && HASH.test(row.expectedSha256), `Missing exact source SHA256 ${id}`);
    seen.add(id);
  }
  requireValid(ALLOWED_COMPANY_IDS.every((id) => seen.has(id)), 'A required in-scope company is missing');
  return Object.freeze([...manifest].sort((a, b) => a.companyId.localeCompare(b.companyId))
    .map((row) => Object.freeze({
      companyId: row.companyId,
      projectId: row.projectId,
      sourcePath: row.sourcePath,
      expectedSha256: row.expectedSha256
    })));
}

export async function verifyCompany116Sources(manifest, options = {}) {
  // Preflight the COMPLETE scope before source-reading starts. No partial scans.
  const checked = validateCompany116Manifest(manifest);
  const root = resolve(options.root ?? '.');
  const sourceReader = options.readSource ?? ((path) => readFile(path));
  const results = [];
  for (const row of checked) {
    const absolutePath = resolve(root, row.sourcePath);
    requireValid(absolutePath.startsWith(`${root}${sep}`), 'Source would escape the chosen root');
    // Refuse symlinks (including a protected file hidden behind an allowed name).
    if (options.readSource === undefined) {
      const stat = await lstat(absolutePath);
      requireValid(stat.isFile() && !stat.isSymbolicLink(), `Source must be a regular non-symlink file: ${row.companyId}`);
    }
    const bytes = await sourceReader(absolutePath, row);
    requireValid(typeof bytes === 'string' || bytes instanceof Uint8Array, `Source is not bytes or text: ${row.companyId}`);
    const actualHash = createHash('sha256').update(bytes).digest('hex');
    requireValid(actualHash === row.expectedSha256, `Canonical source hash mismatch: ${row.companyId}`);
    const sourceText = typeof bytes === 'string' ? bytes : Buffer.from(bytes).toString('utf8');
    const id = row.companyId.slice(-3);
    requireValid(new RegExp(`^# Company ${id} \\u2014 .+`, 'm').test(sourceText), `Canonical source title mismatch: ${row.companyId}`);
    requireValid(sourceText.includes(`company:future:${id}`) && sourceText.includes(`project:company:future:${id}`),
      `Canonical source identities missing: ${row.companyId}`);
    results.push(Object.freeze({companyId: row.companyId, projectId: row.projectId,
      sourcePath: row.sourcePath, sourceSha256: actualHash,
      status: 'SOURCE_IDENTITY_AND_DIGEST_VERIFIED_ONLY'}));
  }
  return Object.freeze({ scopedCompanyCount: results.length,
    noWorkerStarted: true, noExternalProviderCalled: true,
    noBuildOrRevenueCertified: true, sources: Object.freeze(results) });
}
