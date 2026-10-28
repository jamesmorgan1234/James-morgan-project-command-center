import test from 'node:test';import assert from 'node:assert/strict';
import {VersionedLedger} from '../dist/kernel/index.js';
const entry=(overrides={})=>({id:'rule:one',version:1,scope:'owner:architecture',state:'current',sourceRef:'owner:instruction:one',effectiveAt:'2026-10-28T00:00:00Z',precedence:100,value:{policy:{allowSpend:false},sources:['owner:one']},...overrides});
test('P15.1 authority ledger snapshots caller values before recording history',()=>{
 const ledger=new VersionedLedger(),input=entry();const result=ledger.append(input);
 input.value.policy.allowSpend=true;input.value.sources.push('unapproved');result.value.policy.allowSpend=true;
 assert.deepEqual(ledger.governing(input.scope).value,{policy:{allowSpend:false},sources:['owner:one']});
});
test('P15.1 all authority ledger read surfaces return isolated value snapshots',()=>{
 const ledger=new VersionedLedger();ledger.append(entry());
 for(const read of [()=>ledger.current('owner:architecture'),()=>ledger.governing('owner:architecture'),()=>ledger.history('owner:architecture')[0]]){
  const value=read().value;value.policy.allowSpend=true;value.sources.push('tampered');
  assert.equal(ledger.current('owner:architecture').value.policy.allowSpend,false);
  assert.deepEqual(ledger.history('owner:architecture')[0].value.sources,['owner:one']);
 }
 ledger.recordConflict(entry({id:'conflict:one',version:2,state:'unresolved_conflict',conflictsWith:['rule:one']}));
 const conflict=ledger.unresolvedConflicts()[0];conflict.value.sources.push('tampered');
 assert.deepEqual(ledger.unresolvedConflicts()[0].value.sources,['owner:one']);
 assert.throws(()=>ledger.governing('owner:architecture'),/Unresolved authority conflict/);
});
test('P15.1 unserializable authority values reject before changing governing or conflict history',()=>{
 const ledger=new VersionedLedger();ledger.append(entry());
 assert.throws(()=>ledger.append(entry({id:'rule:bad',version:2,supersedes:'rule:one',value:{run:()=>true}})));
 assert.equal(ledger.current('owner:architecture').id,'rule:one');assert.equal(ledger.history('owner:architecture').length,1);
 ledger.recordConflict(entry({id:'conflict:one',version:2,state:'unresolved_conflict',conflictsWith:['rule:one']}));
 assert.throws(()=>ledger.resolveConflict('conflict:one',entry({id:'rule:resolved',version:3,supersedes:'rule:one',resolutionReason:'owner resolution',value:{run:()=>true}})));
 assert.equal(ledger.unresolvedConflicts().length,1);assert.equal(ledger.history('owner:architecture').length,2);
});