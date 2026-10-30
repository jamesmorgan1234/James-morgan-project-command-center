import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { authoritativeTraceabilityRows } from './p15-1-repository-evidence.mjs';
import { currentReviewedMappings } from './p15-1-current-reviewed-mappings.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const source = authoritativeTraceabilityRows(root);
const p3ArchitectureBranches = new Set(['A06','A07','A08','A09']);
const p3Rows = source.requirements.filter((row) => p3ArchitectureBranches.has(row.architectureBranch) || row.architectureBranch === 'Category 3');
if (p3Rows.length !== 633) throw new Error(`Expected 633 authoritative Category-3 rows, found ${p3Rows.length}`);

const reviewed = currentReviewedMappings(root);
const reviewedById = new Map(reviewed.map((row) => [row.id, row]));
const reviewedP3 = p3Rows.filter((row) => reviewedById.has(row.id)).map((row) => ({
  id: row.id,
  requirement: row.requirement,
  architectureBranch: row.architectureBranch,
  reviewedMapping: reviewedById.get(row.id)
}));
const missingP3 = p3Rows.filter((row) => !reviewedById.has(row.id)).map((row) => ({
  id: row.id,
  requirement: row.requirement,
  authoritativeSource: row.authoritativeSource,
  sourceIds: row.sourceIds,
  sourceFiles: row.sourceFiles,
  sourceKinds: row.sourceKinds,
  architectureBranch: row.architectureBranch,
  architectureOwner: row.architectureOwner,
  classification: row.classification,
  activationPrerequisites: row.activationPrerequisites
}));

const document = Object.freeze({
  schemaVersion: 'cc-p3-authoritative-reconciliation-v1',
  canonicalRequirementCount: source.requirements.length,
  p3ExpectedCount: 633,
  p3ReviewedCount: reviewedP3.length,
  p3MissingCount: missingP3.length,
  p3ArchitectureBranches: [...p3ArchitectureBranches, 'Category 3'],
  reviewedP3,
  missingP3
});
const text = `${JSON.stringify(document, null, 2)}\n`;
if (process.argv.includes('--write')) writeFileSync(resolve(root, 'clean-room/p15-1-authoritative-row-slice.json'), text);
else process.stdout.write(text);
