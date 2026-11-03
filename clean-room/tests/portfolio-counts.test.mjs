import assert from 'node:assert/strict';
import test from 'node:test';
import { projectCountCell } from '../dist/runtime/home-modules.js';
import { createFixtureRuntimeSnapshot } from '../dist/runtime/snapshot.js';

test('home count includes each individual book and grows from loaded records', () => {
 const base = createFixtureRuntimeSnapshot();
 const snapshot = {...base, projects:Array.from({length:146},(_,i)=>({id:`p${i}`})), books:Array.from({length:43},(_,i)=>({id:`b${i}`}))};
 assert.equal(projectCountCell(snapshot).verifiedCount,189);
 assert.match(projectCountCell(snapshot).supportingText,/146 project records \+ 43 individual books/);
 assert.equal(projectCountCell({...snapshot,books:[...snapshot.books,{id:'new-book'}]}).verifiedCount,190);
 assert.equal(projectCountCell({...snapshot,projects:[...snapshot.projects,{id:'new-project'}]}).verifiedCount,190);
});

test('a failed book catalogue never silently understates the combined total', () => {
 const base=createFixtureRuntimeSnapshot();
 assert.equal(projectCountCell({...base,sources:{...base.sources,'book-catalogue':'unavailable'}}).verifiedCount,undefined);
 assert.equal(projectCountCell({...base,sources:{...base.sources,projects:'unavailable'}}).verifiedCount,undefined);
});
