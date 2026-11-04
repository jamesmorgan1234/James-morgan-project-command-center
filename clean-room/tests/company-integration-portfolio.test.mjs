import test from 'node:test';
import assert from 'node:assert/strict';
import {compilePortfolio,compileCompanySource,sourceSections} from '../scripts/compile-company-integration.mjs';
test('company source recovery recognizes all 117 sources and keeps later native graphs unchanged',async()=>{
 const p=await compilePortfolio();
 assert.equal(p.sourceCount,117);assert.equal(p.compiled,107);assert.equal(p.preservedNative,10);
 assert.equal(new Set(p.companies.map(c=>c.projectId)).size,117);
 for(const c of p.companies){
  assert.match(c.sourceSha256,/^[a-f0-9]{64}$/);
  if(c.mode==='PRESERVE_NATIVE_DAG'){assert.equal(c.graph,undefined);assert.match(c.specialistSource,/SPECIALIZED_BRAIN\.md$/);continue;}
  assert.ok(c.graph.workUnits.length>30,c.projectId+' has no detailed DAG');
  assert.ok(c.coverage.sections.every(s=>c.graph.workUnits.some(t=>t.id===s.sectionUnit)));
  assert.equal(c.graph.gates.length,4);assert.ok(c.graph.gates.every(g=>!g.satisfied));
  assert.equal(c.brain.enabled,false);
  assert.equal(c.brain.health,'unavailable');
  assert.equal(c.coverage.denominatorTrusted,false);
  assert.equal(c.graph.workUnits.filter(u=>u.status==='ready').length,1);
  assert.ok(c.graph.workUnits.every(t=>t.evidenceRefs.some(x=>x===c.sourceRef)));
  assert.ok(c.graph.workUnits.every(t=>t.dependencyIds.every(d=>c.graph.workUnits.some(u=>u.id===d))));
  assert.ok(c.graph.workUnits.some(t=>t.categoryId==='brain'));
  assert.ok(c.graph.workUnits.some(t=>t.categoryId==='agent'));
 }
 const first=p.companies.find(c=>c.projectId.endsWith(':001')),large=p.companies.find(c=>c.projectId.endsWith(':101'));
 assert.ok(first.coverage.supplementalSections>0);
 assert.ok(large.coverage.sourceSectionCount>30);
});
test('wrong identity fails before any work and cannot grant workers',()=>{
 const sample='# Company 008 — Fictitious\n**Company ID:** company:future:008\n**Primary project:** project:company:future:008\n## Brain\none\n## Agent\none';
 assert.throws(()=>compileCompanySource(9,'009_FICTITIOUS.md',sample),/mismatch/);
});
test('source parser preserves all section text without mistaking fenced headings for real headings',()=>{
 const x=sourceSections('# Company 001 — Sample\n## Brain\nraw\n~~~\n## fake\n~~~\n## Agents\nagent');
 assert.equal(x.length,3);assert.match(x[1].body,/## fake/);
});
