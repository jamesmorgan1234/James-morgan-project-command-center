import test from 'node:test';
import assert from 'node:assert/strict';
import {stageChatExport} from '../dist/data/index.js';
const conversation=(text)=>({id:'conversation',mapping:{root:{id:'root',children:[],message:{id:'message',author:{role:'user'},content:{parts:[text]}}}}});
test('historical staging redacts secret text even when caller policy asks to keep it',()=>{
 const raw=[conversation('Bearer '+'a'.repeat(24))];
 const stage=stageChatExport(raw,'batch',()=> 'keep');
 assert.equal(stage.redactedNodeCount,1);assert.equal(stage.conversations[0].nodes[0].text,undefined);
 assert.equal(stage.conversations[0].nodes[0].contentState,'redact');
 assert.throws(()=>stageChatExport([conversation('safe')],'batch',()=> 'future'), /decision/);
 assert.throws(()=>stageChatExport([conversation('safe'),conversation('safe')],'batch'), /Duplicate/);
 assert.equal(stageChatExport([conversation('safe')],'batch').nodeCount,1);
});
