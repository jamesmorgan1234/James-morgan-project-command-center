import test from 'node:test';
import assert from 'node:assert/strict';
import {validateConversationGraph} from '../dist/data/index.js';
const node=(id,parent,children=[])=>({id,parent,children,contentState:'none'});
test('historical graph validation detects cycles duplicate identities and incomplete bidirectional lineage',()=>{
 for(const nodes of [[node('x','y',['y']),node('y','x',['x'])],[node('x'),node('x')],[node('x'),node('y','x')],[node('x',undefined,['y','y']),node('y','x')]]) assert.equal(validateConversationGraph({conversationId:'c',title:'same',nodes}).valid,false);
 const nodes=[node('root',undefined,['a','b']),node('a','root'),node('b','root')];
 const result=validateConversationGraph({conversationId:'c',title:'same',nodes});assert.equal(result.valid,true);assert.deepEqual(result.branchPoints,['root']);
});
