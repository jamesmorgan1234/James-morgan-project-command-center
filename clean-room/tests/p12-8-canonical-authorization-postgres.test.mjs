import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {assertIdentifierKind} from "../dist/kernel/identifiers.js";

const owner="00000000-0000-0000-0000-000000000001";
const guard=readFileSync(new URL("../../supabase/migrations/20261028010000_p12_8_canonical_authorization_evidence.sql",import.meta.url),"utf8");
async function database(){
  const db=new PGlite();
  try{
    await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${owner}');create function auth.uid() returns uuid language sql as $$select '${owner}'::uuid$$;create function public.is_command_center_authorized() returns boolean language sql as $$select true$$;`);
    for(const file of ["20261026128000_p12_8_specialist_lifecycle.sql","20261026142000_p12_8_specialist_lifecycle_isolation.sql"])
      await db.exec(readFileSync(new URL("../../supabase/migrations/"+file,import.meta.url),"utf8"));
    await db.exec(`insert into command_center_specialist_projects(owner_user_id,project_ref,type_key,display_name,canonical_ref,lifecycle_status,recovery_ref,version) values('${owner}','project','example','Example','specialist:example','active','recovery:1',1);`);
    return db;
  }catch(error){await db.close();throw error;}
}
function history(db,ref,action="rename",version=1){return db.query(`insert into command_center_specialist_project_history(owner_user_id,project_ref,version,type_key,display_name,canonical_ref,lifecycle_status,action,authorization_ref,actor_ref,occurred_at) values($1,'project',$2,'example','Example','specialist:example','active',$3,$4,'owner',now())`,[owner,version,action,ref]);}
function legacy(db,ref,event="event"){return db.query(`insert into command_center_specialist_lifecycle_history(owner_id,lifecycle_event_id,project_id,type_key,display_name,canonical_ref,status,authorization_ref,source_refs,observed_at) values($1,$2,'project','example','Example','specialist:example','active',$3,array['source'],now())`,[owner,event,ref]);}

test("P12.8 actual PostgreSQL rejects malformed authorization in both durable history surfaces",async()=>{
 const db=await database();try{
  await db.exec(guard);
  for(const ref of ["rename:1","merge:1","auth:activate","","   ","evd_","evd_UPPER","evd_double--hyphen","prj_wrong-kind"," evd_padded","evd_trailing\n"]){
   if(ref === ref.trim())assert.throws(()=>assertIdentifierKind(ref,"evidence"));
   await assert.rejects(history(db,ref),/p12_8_project_canonical_authorization/);
   await assert.rejects(legacy(db,ref),ref.trim() === "" ? /command_center_specialist_lifecycle_his_authorization_ref_check/ : /p12_8_lifecycle_canonical_authorization/);
  }
  for(const action of ["rename","merge","activate","replace","archive"])
   await assert.rejects(history(db,null,action),/p12_8_protected_action_requires_authorization/);
  assert.equal((await db.query("select count(*)::int as n from command_center_specialist_project_history")).rows[0].n,0);
  assert.equal((await db.query("select count(*)::int as n from command_center_specialist_lifecycle_history")).rows[0].n,0);
  for(const [i,action] of ["rename","merge","activate","replace","archive"].entries()){
   const ref=`evd_lifecycle-${action}-1`;assert.equal(assertIdentifierKind(ref,"evidence"),ref);
   await history(db,ref,action,i+1);
  }
  await legacy(db,"evd_lifecycle-rename-1");
  // Registration does not pretend to carry a protected-action authorization.
  await history(db,null,"register",6);await legacy(db,null,"register");
  await assert.rejects(db.exec("update command_center_specialist_project_history set display_name='Altered'"),/immutable/);
  await assert.rejects(db.exec("delete from command_center_specialist_lifecycle_history"),/immutable/);
 }finally{await db.close();}
});

test("P12.8 invalid immutable legacy rows block migration atomically without rewriting evidence",async()=>{
 const db=await database();try{
  await history(db,"rename:1");
  await assert.rejects(db.exec(guard),/p12_8_project_canonical_authorization/);
  await db.exec("rollback");
  assert.equal((await db.query("select authorization_ref from command_center_specialist_project_history")).rows[0].authorization_ref,"rename:1");
  assert.equal((await db.query("select count(*)::int as n from pg_constraint where conname like 'p12_8_%authorization%'")).rows[0].n,0);
 }finally{await db.close();}
});
