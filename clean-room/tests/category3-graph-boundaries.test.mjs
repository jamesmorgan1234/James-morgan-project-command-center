import test from 'node:test';
import assert from 'node:assert/strict';
import {CommandGraph} from '../dist/data/index.js';
test('graph rejects cross-owner edges ambiguous aliases and backwards supersession atomically',()=>{
 const graph=new CommandGraph();
 for(const [id,type,ownerId] of [['alias','alias','owner'],['one','project','owner'],['two','project','owner'],['other','project','other']]) graph.addNode({id,type,ownerId,canonicalName:id});
 const edge={id:'edge',from:'alias',to:'one',relation:'aliases',version:1,sourceRef:'owner-decision',effectiveAt:'2026-10-27T00:00:00Z'};
 assert.throws(()=>graph.addEdge({...edge,to:'other'}), /owner boundaries/);
 graph.addEdge(edge);
 assert.throws(()=>graph.addEdge({...edge,id:'duplicate',to:'two'}), /current canonical target/);
 assert.throws(()=>graph.supersedeEdge(edge.id,'2026-10-26T00:00:00Z'), /predate/);
 assert.equal(graph.resolveAlias('alias').id,'one');
 graph.supersedeEdge(edge.id,'2026-10-28T00:00:00Z');
 graph.addEdge({...edge,id:'next',to:'two',effectiveAt:'2026-10-28T00:00:00Z'});
 assert.equal(graph.resolveAlias('alias').id,'two');
});
