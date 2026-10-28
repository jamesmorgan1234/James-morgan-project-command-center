import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {authoritativeTraceabilityRows} from '../scripts/p15-1-repository-evidence.mjs';
test('P15.1 REV3 authoritative references are canonical filenames rather than host checkout paths',()=>{
 const d=authoritativeTraceabilityRows(fileURLToPath(new URL('../..',import.meta.url)));
 const rows=d.requirements.slice(5825);assert.equal(rows.length,27);
 for(const row of rows){assert.equal(row.authoritativeSource,`REV3:Command_Center_Canonical_Owner_Additions_REV3.json#${row.id}`);assert.equal(row.sourceFiles[0],'Command_Center_Canonical_Owner_Additions_REV3.json');assert.match(row.sourceVersion,/^[a-f0-9]{64}$/);}
});
