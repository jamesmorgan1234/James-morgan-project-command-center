import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { authoritativeTraceabilityRows } from './p15-1-repository-evidence.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const start = Number(process.env.P15_ROW_SLICE_START ?? 688);
const end = Number(process.env.P15_ROW_SLICE_END ?? 727);
if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start) throw new Error('Invalid P15 row slice bounds');

const source = authoritativeTraceabilityRows(root);
const ids = new Set(Array.from({ length: end - start + 1 }, (_, offset) => `CCR-${String(start + offset).padStart(5, '0')}`));
const requirements = source.requirements.filter((row) => ids.has(row.id));
if (requirements.length !== ids.size) throw new Error(`Expected ${ids.size} canonical rows, found ${requirements.length}`);
const document = Object.freeze({
  schemaVersion: 'cc-p15-1-authoritative-row-slice-v1',
  startId: `CCR-${String(start).padStart(5, '0')}`,
  endId: `CCR-${String(end).padStart(5, '0')}`,
  rowCount: requirements.length,
  requirements
});
const text = `${JSON.stringify(document, null, 2)}\n`;
if (process.argv.includes('--write')) writeFileSync(resolve(root, 'clean-room/p15-1-authoritative-row-slice.json'), text);
else process.stdout.write(text);
