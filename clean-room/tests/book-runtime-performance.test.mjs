import test from 'node:test';
import assert from 'node:assert/strict';
import {latestOwnerBookMetrics,completeOwnerBookTotals} from '../dist/books/runtime-performance.js';
const scope={ownerId:'owner-1',projectId:'project-1',bookId:'book-1'};
const row=(metric,value,extra={})=>({owner_id:'owner-1',project_id:'project-1',book_id:'book-1',metric_id:'snapshot:'+metric,metric,value,currency:metric==='royalties'?'USD':null,provider_key:'owner_report',edition:'current',format:'all_formats',truth:'confirmed',source:'Owner report',source_date:'2026-11-03T10:00:00Z',observed_at:'2026-11-03T10:00:00Z',source_refs:['owner-message:example'],...extra});
test('owner report preserves cents, genuine zero sales, and exact page counts as separate metrics',()=>{
 const m=latestOwnerBookMetrics([row('royalties','0.25'),row('sales',0),row('pages_read',123)],scope);
 assert.equal(m.find(r=>r.kind==='royalties').value,0.25);assert.equal(m.find(r=>r.kind==='sales').value,0);assert.equal(m.find(r=>r.kind==='pages_read').value,123);
});
test('later cumulative snapshots replace earlier snapshots instead of double counting',()=>{
 const m=latestOwnerBookMetrics([row('royalties',0.25,{metric_id:'old',source_date:'2026-11-02T10:00:00Z'}),row('royalties',0.75,{metric_id:'new'})],scope);
 assert.equal(m.length,1);assert.equal(m[0].value,0.75);assert.equal(m[0].id,'new');
});
test('latest unknown value does not silently become zero or revive an older balance',()=>{
 const m=latestOwnerBookMetrics([row('royalties',1,{source_date:'2026-11-02T10:00:00Z'}),row('royalties',null)],scope);assert.equal(m.length,0);
});
test('other owners, projects, books, estimated and settlement records cannot leak into owner-reported totals',()=>{
 for(const extra of [{owner_id:'other'},{project_id:'other'},{book_id:'other'},{provider_key:'other'},{truth:'estimated'},{truth:'settled'},{edition:'old'},{format:'paperback'},{source_refs:[]}])assert.equal(latestOwnerBookMetrics([row('royalties',100,extra)],scope).length,0);
});
test('incomplete book coverage and mixed currencies cannot produce an apparently complete portfolio total',()=>{
 const metrics=latestOwnerBookMetrics([row('royalties',0.25),row('sales',0),row('pages_read',123)],scope);
 assert.deepEqual(completeOwnerBookTotals([{performance:metrics}]),{royalties:0.25,sales:0,pagesRead:123,currency:'USD'});
 assert.equal(completeOwnerBookTotals([{performance:metrics},{}]),undefined);
 assert.equal(completeOwnerBookTotals([{performance:metrics},{performance:metrics.map(m=>m.kind==='royalties'?{...m,currency:'EUR'}:m)}]),undefined);
});
