import { test } from "node:test";
import assert from "node:assert/strict";
import { filterRuntimeProjects, groupRuntimeProjects } from "../dist/runtime/project-screen.js";
import { projectArtwork } from "../dist/runtime/project-art.js";
const known = value => ({ state: "known", value });
const make = (id, percent) => ({ id, name: id, mission: known(""), lifecycle: known("active"), progressPercent: percent === undefined ? { state: "unknown" } : known(percent) });
test("highest completion outranks activation order, with unknown progress last", () => {
  const rows = [make("new", undefined), make("started", 43), make("complete", 100), make("empty", 0)];
  assert.deepEqual(filterRuntimeProjects(rows, {}).map(p => p.id), ["complete", "started", "empty", "new"]);
  assert.deepEqual(groupRuntimeProjects(rows)[0].projects.map(p => p.id), ["complete", "started", "empty", "new"]);
  assert.equal(rows[0].id, "new");
});
test("a project overtakes the leader when its recorded progress changes", () => {
  const initial = [make("leader", 70), make("working", 60)];
  assert.equal(filterRuntimeProjects(initial, {})[0].id, "leader");
  const updated = [initial[0], make("working", 80)];
  assert.equal(filterRuntimeProjects(updated, {})[0].id, "working");
  assert.equal(groupRuntimeProjects(updated, "lifecycle")[0].projects[0].id, "working");
});
test("invalid percentages never take the top spot", () => {
  assert.equal(filterRuntimeProjects([make("invalid", NaN), make("over", 200), make("valid", 10)], {})[0].id, "valid");
});
test("project backgrounds follow the business subject and preserve approved covers", () => {
  const garage = projectArtwork(make("Morgan's Garage Doors", 50), []);
  const video = projectArtwork(make("VeloClip video", 60), []);
  assert.notEqual(garage.position, video.position);
  const book = projectArtwork(make("kdp-repeat-button", 100), [{ id:"book", title:"Repeat Button", author:"James Morgan", coverSlot:25, coverApproved:true }]);
  assert.equal(book.url, "/assets/book-cover-atlas-v2.webp");
  assert.equal(book.subject, "Repeat Button");
});
import { SupabaseOwnerRuntimeSnapshotProvider } from '../dist/runtime/supabase-owner-provider.js';
function providerFixture({ roadmap = false, metric = 38, verified = true, profile = {}, bookOverride = {} } = {}) {
  const values = new Map([['command-center:owner-session:v1', JSON.stringify({ accessToken: 'test', refreshToken: 'test-refresh', expiresAt: 4102444800, userId: 'owner-1' })]]);
  const fetcher = async input => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get('owner_id'), 'eq.owner-1');
    const table = url.pathname.split('/').at(-1);
    let result = [];
    if (table === 'cc7_owner_access') result = [{ enabled: true }];
    if (table === 'command_center_project_profiles') result = [{ project_id:'velo-clip', name:'VeloClip', lifecycle:'candidate', status:'Blocked / local HTTPS trust', updated_at:'2026-11-03T00:00:00Z', ...profile }];
    if (table === 'analytics_project_kpis' && url.searchParams.get('metric_key')) result = [{ project_id:'velo-clip', metric_key:'current_scope_progress_percent', value_numeric:metric, verified, observed_at:'2026-10-19T00:00:00Z' }];
    if (roadmap && table === 'command_center_project_roadmaps') result = [{ project_id:'velo-clip', version:2, state:'current', structure_verified:true, denominator_trusted:true }];
    if (roadmap && table === 'command_center_project_work_units') result = [{ project_id:'velo-clip', roadmap_version:2, work_unit_id:'done', status:'verified', applicable:true }];
    if (table === 'command_center_book_catalogue') result = [{ book_id:'book-1', title:'Repeat Button', author_name:'James Morgan', cover_slot:25, cover_approved:true, ...bookOverride }];
    return new Response(JSON.stringify(result), { status:200 });
  };
  return new SupabaseOwnerRuntimeSnapshotProvider({ supabaseUrl:'https://test.supabase.co', publishableKey:'sb_publishable_test', storage:{ getItem:k=>values.get(k)??null, setItem:(k,v)=>values.set(k,v), removeItem:k=>values.delete(k) }, fetcher });
}
test('original project progress is recovered with its observation date and unchanged stored status', async()=>{
  const snapshot = await providerFixture().load(); const project = snapshot.projects[0];
  assert.equal(project.progressPercent.value,38); assert.equal(project.progressBasis,'last_recorded');
  assert.equal(project.progressObservedAt,'2026-10-19T00:00:00Z'); assert.equal(project.status.value,'Blocked / local HTTPS trust');
  assert.equal(snapshot.books.length,1); assert.match(snapshot.surfaces.find(s=>s.key==='books').summary.value,/1 books in your catalogue/);
});
test('current verified roadmap progress takes precedence over a historical percentage', async()=>{
  const snapshot=await providerFixture({roadmap:true}).load();
  assert.equal(snapshot.projects[0].progressPercent.value,100); assert.equal(snapshot.projects[0].progressBasis,'roadmap');
});
test('unverified or out-of-range saved metrics never become progress',async()=>{
  for (const options of [{verified:false},{metric:101},{metric:-1}]) assert.equal((await providerFixture(options).load()).projects[0].progressPercent.state,'unknown');
});

test('absent numeric progress stays unknown while source-backed final integration state survives projection',async()=>{
 const project=(await providerFixture({metric:null,profile:{stage:'Frozen candidate: 876/876 PASS',progress_summary:'Final integration',next_action:'Verify host and certify',blocker:'Host missing',status_observed_at:'2026-10-25T22:56:50Z',status_source_refs:['library:exact-proof']}}).load()).projects[0];
 assert.equal(project.progressPercent.state,'unknown');assert.equal(project.progressSummary,'Final integration');assert.equal(project.stage.value,'Frozen candidate: 876/876 PASS');assert.equal(project.nextAction.value,'Verify host and certify');assert.deepEqual(project.blockers.value,['Host missing']);assert.ok(project.evidence.some(ref=>ref.source==='library:exact-proof'));
});

test('title production evidence and format-specific publication survive runtime loading without converting absent progress to zero',async()=>{
 const snapshot=await providerFixture({bookOverride:{production_state:'Production complete; publication unconfirmed',production_percent:null,project_id:'kdp-weight-between-tasks',publication:{Kindle:'Not confirmed',Paperback:'Not confirmed'},state_observed_at:'2026-10-05T00:00:00Z',state_evidence_refs:['library:exact-book-source'],cover_slot:null,cover_approved:false}}).load();
 const book=snapshot.books[0];assert.equal(book.productionPercent,undefined);assert.equal(book.coverSlot,undefined);assert.equal(book.coverApproved,false);assert.equal(book.projectId,'kdp-weight-between-tasks');assert.equal(book.publication.Kindle,'Not confirmed');assert.equal(book.stateEvidenceRefs[0],'library:exact-book-source');
});
