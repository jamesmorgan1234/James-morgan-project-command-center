import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {financeDatabase,seedAction,U} from './helpers/finance-postgres.mjs';
test('P9.9 durable pre-dispatch reservation and exact reconciliation execute in PostgreSQL',async t=>{
 const db=await financeDatabase();
 const reserve=async(id,attempt='attempt:'+id)=>{
 await db.exec('set role authenticated');
 try{return (await db.query(`select command_center_finance_reserve_attempt($1,$2,$3) as result`,[id,'auth:'+id,attempt])).rows[0].result;}finally{await db.exec('reset role');}
 };
 const outcome=async(id,event,status='uncertain',receipt=null,patch={})=>db.query(`select command_center_private.finance_record_outcome($1,$2,$3,$4,$5,'reconciliation:verified',array['provider:evidence'],$6,$7,$8,$9)`,[U,'attempt:'+id,event,status,receipt,patch.provider===undefined?'finance-provider:fixture':patch.provider,patch.accounts===undefined?['account']:patch.accounts,patch.amount===undefined?500:patch.amount,patch.hash===undefined?'hash:'+id:patch.hash]);
 try{
 await t.test('first reservation is durable and repeated or alternate attempts never permit blind redispatch',async()=>{
 await seedAction(db,'one');const first=await reserve('one');assert.equal(first.state,'reserved_requires_trusted_dispatch');assert.equal(first.dispatchAllowed,false);
 const replay=await reserve('one');assert.equal(replay.state,'reconciliation_required');assert.equal(replay.dispatchAllowed,false);
 await assert.rejects(reserve('one','different'),/replay|prior attempt/);
 assert.equal((await db.query('select count(*) as n from command_center_private.finance_action_attempts')).rows[0].n,1);
 });
 await t.test('persisted ledger restart cannot replay authorization or erase an uncertain attempt',async()=>{
 const image=await db.dumpDataDir();const restarted=new PGlite({loadDataDir:image});
 try {await restarted.exec('set role authenticated');
 const result=(await restarted.query("select command_center_finance_reserve_attempt('one','auth:one','attempt:one') as result")).rows[0].result;
 assert.equal(result.state,'reconciliation_required');assert.equal(result.dispatchAllowed,false);
 await assert.rejects(restarted.query("select command_center_finance_reserve_attempt('one','auth:one','restart-retry')"),/replay/);
 }finally{await restarted.close();}
 });
 await t.test('timeout or crash without a receipt stays reserved across a new SQL invocation',async()=>{
 assert.equal((await reserve('one')).state,'reconciliation_required');
 await outcome('one','uncertain-one');await assert.rejects(reserve('one','retry-after-timeout'),/replay/);
 await assert.rejects(outcome('one','missing-receipt','confirmed_executed'),/check constraint/);
 });
 await t.test('provider receipt scope mismatch null fields and wrong account or amount cannot invent success',async()=>{
 for(const patch of [{provider:'other'},{provider:null},{accounts:['other']},{accounts:null},{amount:501},{amount:null},{hash:'other'},{hash:null}])await assert.rejects(outcome('one','bad','confirmed_executed','receipt:bad',patch),/scope mismatch/);
 assert.equal((await db.query("select count(*) as n from command_center_private.finance_action_outcomes where outcome='confirmed_executed'")).rows[0].n,0);
 });
 await t.test('receipt reconciliation is idempotent and immutable without creating new money authority',async()=>{
 await db.exec('set role service_role');await outcome('one','confirmed-one','confirmed_executed','receipt:one');await assert.rejects(db.exec("delete from command_center_private.finance_action_attempts"),/permission denied/);await db.exec('reset role');await outcome('one','confirmed-one','confirmed_executed','receipt:one');
 await assert.rejects(outcome('one','contradiction','confirmed_not_executed','receipt:two'),/Final outcome/);
 await assert.rejects(outcome('one','confirmed-one','partial','receipt:one'),/identity collision/);
 await assert.rejects(db.exec("delete from command_center_private.finance_action_attempts"),/immutable/);
 await assert.rejects(db.exec("update command_center_private.finance_action_outcomes set outcome='uncertain'"),/immutable/);
 await db.exec('set role authenticated');await assert.rejects(db.exec('select * from command_center_private.finance_action_attempts'),/permission denied/);
 await assert.rejects(db.query(`select command_center_private.finance_record_outcome($1,'attempt:one','forged','confirmed_executed','fake','fake',array['fake'],'finance-provider:fixture',array['account'],500,'hash:one')`,[U]),/permission denied/);await db.exec('reset role');
 });
 await t.test('provider unavailable timeout degradation compromise permission capability and credential loss block before reservation',async()=>{
 const faults=["health='unavailable'","health='degraded'","health='compromised'","connection_state='expired'","connection_state='revoked'","connection_state='disconnected'","consent_state='revoked'","credential_state='expired'","credential_state='revoked'","capabilities='{}'","capabilities=array[null]::text[]","observed_at=now()-interval '31 seconds'"];
 let n=0;for(const fault of faults){const id='provider-'+n++;await seedAction(db,id);await db.exec(`update command_center_private.finance_provider_runtime_state set ${fault}`);await assert.rejects(reserve(id),/provider state|provider action capability/);await db.exec("update command_center_private.finance_provider_runtime_state set health='available',connection_state='connected',consent_state='granted',credential_state='healthy',capabilities=array['payment.write'],observed_at=now()");}
 });
 await t.test('stale restored consumed mismatched amountless and recommendation authority fail closed',async()=>{
 for(const [id,changes] of [['expired',{expires:-1}],['old',{age:301}],['consumed',{consumed:true}],['mismatch',{grantAmount:501}],['amountless',{intentAmount:null}],['recommendation',{source:'recommendation'}]]){
 await seedAction(db,id,changes);await assert.rejects(reserve(id),/stale mismatched|Invalid exact/);
 }
 await seedAction(db,'low-assurance');await db.exec("update command_center_owner_sessions set assurance='aal1'");await assert.rejects(reserve('low-assurance'),/capability denied/);await db.exec("update command_center_owner_sessions set assurance='aal2'");
 await seedAction(db,'revoked-session');await db.exec('update command_center_owner_sessions set revoked_at=now()');await assert.rejects(reserve('revoked-session'),/capability denied/);await db.exec('update command_center_owner_sessions set revoked_at=null');
 });
 await t.test('failed transaction rolls reservation back before dispatch; failures after commit never release fences',async()=>{
 await seedAction(db,'rollback');await db.exec('begin');await reserve('rollback');await assert.rejects(db.exec('select 1/0'));await db.exec('rollback');
 assert.equal((await db.query("select count(*) as n from command_center_private.finance_action_attempts where intent_id='rollback'")).rows[0].n,0);
 await reserve('rollback');await outcome('rollback','pre-dispatch-failure','failed_before_dispatch');await assert.rejects(reserve('rollback','retry-failed'),/replay/);
 });
 await t.test('partial success requires reconciliation; unchanged action hash cannot create a duplicate attempt',async()=>{
 await seedAction(db,'partial');await reserve('partial');await outcome('partial','partial','partial','receipt:partial');await assert.rejects(reserve('partial','retry-partial'),/replay/);
 await seedAction(db,'duplicate-hash',{hash:'hash:partial'});await assert.rejects(reserve('duplicate-hash'),/replay/);
 await outcome('partial','reconciled-partial','confirmed_executed','receipt:reconciled');
 });
 }finally{await db.close();}
});
