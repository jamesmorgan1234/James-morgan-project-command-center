import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileSync} from '../dist/data/index.js';
test('next record version cannot silently overwrite truth with backwards effective update time',()=>{
 const local={entityId:'entity',version:2,updatedAt:'2026-10-27T00:00:00Z',contentHash:'current',sourceNode:'phone',payload:{amount:0}};
 const incoming={...local,version:3,updatedAt:'2026-10-26T00:00:00Z',contentHash:'next',sourceNode:'desktop'};
 assert.deepEqual(reconcileSync(local,incoming),{action:'conflict',reason:'temporal_regression'});
 assert.equal(local.payload.amount,0);
 assert.equal(reconcileSync(local,{...incoming,updatedAt:local.updatedAt}).action,'accept');
 assert.equal(reconcileSync(local,{...incoming,version:1}).action,'reject_stale');
 assert.equal(reconcileSync(local,{...incoming,version:5}).action,'reconcile_gap');
});
