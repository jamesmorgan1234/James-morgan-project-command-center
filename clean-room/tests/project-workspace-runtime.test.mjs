import assert from 'node:assert/strict';
import test from 'node:test';
import { ManagedOwnerRuntimeProvider } from '../dist/runtime/owner-security-provider.js';
const nonce='00000000-0000-4000-8000-000000000001';
function setup({project=true,existing=[],runs=[]}={}) {
 const calls=[]; const values=new Map([['command-center:owner-session:v1',JSON.stringify({accessToken:'test-token',refreshToken:'test-refresh',expiresAt:9999999999,userId:'owner-1'})]]);
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const fetcher=async (input,init={})=>{ const url=new URL(String(input)); const body=init.body?JSON.parse(init.body):null; calls.push({url,init,body}); let data;
 if(url.pathname.endsWith('/command_center_project_profiles'))data=project?[{project_id:'project-1'}]:[];
 else if(url.pathname.endsWith('/command_center_canonical_entities'))data=existing;
 else if(url.pathname.endsWith('/command_center_agency_runs'))data=runs;
 else if(url.pathname.includes('/rpc/'))data={ok:true};
 else throw Error('Unexpected '+url.pathname);
 return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
 };
 const inner={id:'test',async load(){return {};},async signIn(){},async signOut(){}};
 return {calls,provider:new ManagedOwnerRuntimeProvider({inner,storage,supabaseUrl:'https://example.supabase.co',publishableKey:'sb_publishable_test',fetcher})};
}
test('workspace writes use authenticated canonical RPC, exact project, and request-only integration state',async()=>{
 const {provider,calls}=setup(); const id=await provider.saveProjectRecord('project-1','integration_request','GitHub','Project-only repository access','https://github.com',nonce);
 assert.equal(id,'integration_request:'+nonce); const post=calls.find(c=>c.init.method==='POST');
 assert.equal(post.url.pathname,'/rest/v1/rpc/command_center_canonical_create_entity'); assert.equal(post.body.p_project_id,'project-1');
 assert.equal(post.body.p_payload.state,'setup_requested'); assert.equal(post.body.p_payload.execution_authorized,false);
 for(const call of calls.filter(c=>c.init.method!=='POST'))assert.equal(call.url.searchParams.get('owner_id'),'eq.owner-1');
});
test('unknown project cannot create any record or Agency run',async()=>{
 const {provider,calls}=setup({project:false});
 await assert.rejects(provider.saveProjectRecord('project-1','decision','Test','Test',undefined,nonce),/not available/);
 await assert.rejects(provider.createProjectAgencyRun('project-1','Test',nonce),/not available/);
 assert.equal(calls.some(c=>c.init.method==='POST'),false);
});
test('secret-bearing references are rejected before database access',async()=>{
 const {provider,calls}=setup();
 for(const url of ['https://user:password@example.com','https://example.com?api_key=secret','http://example.com'])await assert.rejects(provider.saveProjectRecord('project-1','asset_reference','Test','Test',url,nonce),/secure reference/);
 assert.equal(calls.length,0);
});
test('saved record retries are idempotent and cannot reuse an identity across projects',async()=>{
 const existing=[{entity_id:'decision:'+nonce,project_id:'project-1',payload:{title:'Test',body:'Test'}}]; const {provider,calls}=setup({existing});
 assert.equal(await provider.saveProjectRecord('project-1','decision','Test','Test',undefined,nonce),'decision:'+nonce);
 existing[0].project_id='other-project'; await assert.rejects(provider.saveProjectRecord('project-1','decision','Test','Test',undefined,nonce),/different project/);
 assert.equal(calls.some(c=>c.init.method==='POST'),false);
});
test('Agency prepare creates manual draft through canonical function without queueing or executor calls',async()=>{
 const {provider,calls}=setup(); assert.equal(await provider.createProjectAgencyRun('project-1','Prepare diagnostic only',nonce),'agency-run:'+nonce);
 const writes=calls.filter(c=>c.init.method==='POST'); assert.equal(writes.length,1);assert.equal(writes[0].url.pathname,'/rest/v1/rpc/command_center_agency_create_run');
 assert.equal(writes[0].body.p_control_mode,'manual_task'); assert.equal(writes[0].body.p_checkpoint_id,null);assert.equal(writes[0].body.p_priority,0);
});
test('Agency stop rejects a run outside the selected project',async()=>{
 const {provider,calls}=setup({runs:[{project_id:'other-project',run_id:'agency-run:'+nonce}]});
 await assert.rejects(provider.stopProjectAgencyRun('project-1','agency-run:'+nonce,1),/outside this project/); assert.equal(calls.some(c=>c.init.method==='POST'),false);
});
