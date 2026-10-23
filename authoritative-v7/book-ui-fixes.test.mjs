import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

async function publicationModule(){
  const source=await readFile(new URL('./publication-truth.js',import.meta.url),'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const metric=(projectId,book)=>({
  project_id:projectId,
  key:`bookmap.${book.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.metadata`,
  value_text:JSON.stringify(book),
  verified:true
});

test('unpublished production-complete book requires Agent review and is never Live',async()=>{
  const {projectPublicationDisplay}=await publicationModule();
  const project={id:'kdp-example',category:'Amazon Books / KDP — Individual Book',status:'Production complete / unpublished'};
  const metrics=[metric(project.id,{title:'Example',publication_state:'unpublished',publication_status:'Production complete / ready for KDP; not published'})];
  assert.deepEqual(projectPublicationDisplay(project,metrics),{label:'Agent Review Needed',cls:'agent-review'});
});

test('Agent review, owner review, Ready to Publish, and Needs Changes remain distinct',async()=>{
  const {projectPublicationDisplay}=await publicationModule();
  const metrics=[];
  assert.deepEqual(projectPublicationDisplay({id:'kdp-a',category:'Amazon Books / KDP',status:'Agent review required / unpublished'},metrics),{label:'Agent Review Needed',cls:'agent-review'});
  assert.deepEqual(projectPublicationDisplay({id:'kdp-b',category:'Amazon Books / KDP',status:'Owner review required — Agent verified / unpublished'},metrics),{label:'Owner Review Needed',cls:'owner-review'});
  assert.deepEqual(projectPublicationDisplay({id:'kdp-c',category:'Amazon Books / KDP',status:'Ready to publish — owner approved / unpublished'},metrics),{label:'Ready to Publish',cls:'ready'});
  assert.deepEqual(projectPublicationDisplay({id:'kdp-d',category:'Amazon Books / KDP',status:'Corrections required / unpublished'},metrics),{label:'Needs Changes',cls:'needs-changes'});
});

test('partially published series is Publishing, not Live',async()=>{
  const {projectPublicationDisplay}=await publicationModule();
  const project={id:'kdp-series',category:'Amazon Books / KDP',status:'Publishing in progress'};
  const metrics=[
    metric(project.id,{title:'One',publication_state:'published',publication_status:'Live — all formats',formats:{kindle:'live',paperback:'live',hardcover:'live'}}),
    metric(project.id,{title:'Two',publication_state:'published',publication_status:'Live — Kindle; paperback pending',formats:{kindle:'live',paperback:'not_published',hardcover:'not_published'}})
  ];
  assert.deepEqual(projectPublicationDisplay(project,metrics),{label:'Publishing',cls:'publishing'});
});

test('series is Live only when every required book format is live',async()=>{
  const {projectPublicationDisplay}=await publicationModule();
  const project={id:'kdp-series-live',category:'Amazon Books / KDP',status:'Published / live'};
  const allLive=[
    metric(project.id,{title:'One',publication_state:'published',publication_status:'Live',formats:{kindle:'live',paperback:'live',hardcover:'live'}}),
    metric(project.id,{title:'Two',publication_state:'published',publication_status:'Live',formats:{kindle:'live',paperback:'live',hardcover:'live'}})
  ];
  assert.deepEqual(projectPublicationDisplay(project,allLive),{label:'Live',cls:'live'});
});

test('rebuild remains In Progress even when one book is already live',async()=>{
  const {projectPublicationDisplay}=await publicationModule();
  const project={id:'kdp-rebuild',category:'Amazon Books / KDP',status:'Rebuild in progress — Book 1 published'};
  const metrics=[
    metric(project.id,{title:'One',publication_state:'published',publication_status:'Published / live — paperback',formats:{paperback:'live',kindle:'not_planned',hardcover:'not_planned'}}),
    metric(project.id,{title:'Two',publication_state:'unpublished',publication_status:'100% complete / approved; not published',formats:{paperback:'not_published',kindle:'not_planned',hardcover:'not_planned'}})
  ];
  assert.deepEqual(projectPublicationDisplay(project,metrics),{label:'In Progress',cls:'active-rebuild'});
});

test('root UI uses approved atlas path, larger mobile cards, synchronous no-Work prepublish review, and cached execution client',async()=>{
  const [index,ui,css,sw,agentExecution]=await Promise.all([
    readFile(new URL('../index.html',import.meta.url),'utf8'),
    readFile(new URL('./book-ui-fixes.js',import.meta.url),'utf8'),
    readFile(new URL('./book-ui-fixes.css',import.meta.url),'utf8'),
    readFile(new URL('../service-worker.js',import.meta.url),'utf8'),
    readFile(new URL('./agent-execution.js',import.meta.url),'utf8')
  ]);
  assert.match(index,/book-ui-fixes\.js\?v=1/);
  assert.match(index,/book-ui-fixes\.css\?v=1/);
  assert.match(index,/home-books-refinement\.js\?v=2/);
  assert.ok(index.indexOf('book-ui-fixes.js?v=1')<index.indexOf('home-books-refinement.js?v=2'));
  assert.match(ui,/authoritative-v7\/assets\/book-cover-atlas-v2\.webp/);
  assert.match(ui,/\[PRE-PUBLISH BOOK REVIEW\]/);
  assert.match(ui,/allowWork:false/);
  assert.match(ui,/executeAgentRun\(run\.id\)/);
  assert.match(agentExecution,/cc7_agent_owner_execute_run/);
  assert.match(agentExecution,/p_run_id:runId/);
  assert.match(css,/height:86px!important/);
  assert.match(css,/\.cc-status\.needs-changes/);
  assert.match(sw,/command-center-v7-root-6/);
  assert.match(sw,/book-ui-fixes\.js\?v=1/);
  assert.match(sw,/publication-truth\.js/);
  assert.match(sw,/agent-execution\.js/);
  assert.match(sw,/home-books-refinement\.js\?v=2/);
});
