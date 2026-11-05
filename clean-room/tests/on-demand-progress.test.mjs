import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {verifiedWorkUnitPercent,formatProgressPercent} from '../dist/runtime/progress-precision.js';

test('precise percentage comes from verified work and trusted denominator, not the Start click',()=>{
 const units=Array.from({length:200},(_,i)=>({applicable:true,status:i<11?'verified':'ready'}));
 assert.equal(verifiedWorkUnitPercent(units),5.5);
 assert.equal(formatProgressPercent(verifiedWorkUnitPercent(units)),'5.5%');
 units[11].status='working';
 assert.equal(verifiedWorkUnitPercent(units),5.5);
 units[11].status='verified';
 assert.equal(verifiedWorkUnitPercent(units),6);
});
test('zero or uncertified applicable denominator cannot produce a fabricated percentage',()=>{
 assert.equal(verifiedWorkUnitPercent([]),undefined);
 assert.equal(verifiedWorkUnitPercent([{applicable:false,status:'verified'}]),undefined);
 assert.throws(()=>formatProgressPercent(Number.NaN),/out of range/);
});
test('on-demand Start card distinguishes canonical roadmap progress and historical recorded data',async()=>{
 const source=await readFile(new URL('../src/runtime/project-workspace-view.ts',import.meta.url),'utf8');
 assert.match(source,/project\.progressPercent/);
 assert.match(source,/project\.progressBasis === "roadmap"/);
 assert.match(source,/Last recorded, not necessarily current:/);
 assert.match(source,/Completion percent not verified/);
 assert.match(source,/verified of/);
 assert.match(source,/immediateScope/);
});
