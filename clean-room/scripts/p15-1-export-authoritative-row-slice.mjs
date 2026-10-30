import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const source = JSON.parse(readFileSync(resolve(root, 'clean-room/evidence/category15-requirement-traceability.json'), 'utf8'));
const requirements = source.requirements;
if (!Array.isArray(requirements) || requirements.length !== 5852) throw new Error(`Expected 5852 current traceability rows, found ${requirements?.length}`);
const document = Object.freeze({
  schemaVersion: 'cc-p15-1-current-traceability-export-v1',
  startId: 'CCR-00001',
  endId: 'CCR-05852',
  rowCount: requirements.length,
  requirements
});
const text = `${JSON.stringify(document, null, 2)}\n`;
if (process.argv.includes('--write')) writeFileSync(resolve(root, 'clean-room/p15-1-authoritative-row-slice.json'), text);
else process.stdout.write(text);