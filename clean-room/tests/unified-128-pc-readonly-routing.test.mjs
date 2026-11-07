import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {shouldQueuePcBrainResponse} from "../src/brain/pc-scoped-route.mjs";

const gateway=readFileSync(new URL("../../supabase/functions/command-center-pc-worker/index.ts",import.meta.url),"utf8");
const sql=readFileSync(new URL("../evidence/CC_UNIFIED_128_PC_READONLY_ROUTING_CANDIDATE.sql",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/runtime/owner-security-provider.ts",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/runtime/brain-view.ts",import.meta.url),"utf8");

// Exercise the actual pure scope functions extracted from the staged Deno worker.
// Do not invoke a live HTTP gateway, worker, provider, store or account.
function scopeFunctionsFromCandidate() {
 const future=gateway.match(/^const CC_PROJECT = [^\n]+;$/m)?.[0];
 const legacy=gateway.match(/^const LEGACY_PROJECT = [^\n]+;$/m)?.[0];
 const canonical=gateway.match(/^function canonicalCompanyId\(projectId:string\):string \{[\s\S]*?^\}/m)?.[0];
 const valid=gateway.match(/^function projectIdOk\(p:any\)\{[\s\S]*?^\}/m)?.[0];
 assert.ok(future && legacy && canonical && valid,"exact staged scope declarations must exist");
 const jsCanonical=canonical.replace("canonicalCompanyId(projectId:string):string","canonicalCompanyId(projectId)");
 const jsValid=valid.replace("projectIdOk(p:any)","projectIdOk(p)");
 return new Function(future+"\n"+legacy+"\n"+
   "function failure(msg,status){return Object.assign(new Error(msg),{status})}\n"+
   jsCanonical+"\n"+jsValid+"\nreturn {canonicalCompanyId,projectIdOk}")();
}

const existing=["aro","fanvue-veyla","edge-finder","mini-movies","revocapture",
  "loopwren","coupon-autopilot","torevi","velo-clip","crowdskein","margincrafttools"];

test("scope parser preserves all 117 numbered future companies",()=>{
 const {projectIdOk,canonicalCompanyId}=scopeFunctionsFromCandidate();
 for(let i=1;i<=117;i++){
  const suffix=String(i).padStart(3,"0");
  assert.equal(projectIdOk("project:company:future:"+suffix),true);
  assert.equal(canonicalCompanyId("project:company:future:"+suffix),"company:future:"+suffix);
 }
});
test("scope parser recognizes 11 exact legacy registry identities without rewriting names",()=>{
 const {projectIdOk,canonicalCompanyId}=scopeFunctionsFromCandidate();
 assert.equal(existing.length,11);
 for(const projectId of existing){
  assert.equal(projectIdOk(projectId),true);
  assert.equal(canonicalCompanyId(projectId),"company:legacy:"+projectId);
 }
});
test("scope parser rejects ambiguous, malformed numbered and path-like identifiers",()=>{
 const {projectIdOk,canonicalCompanyId}=scopeFunctionsFromCandidate();
 const bad=["","ARO","margin craft","margincrafttools/../aro","project:company:future:000",
  "project:company:future:01","project:company:future:0001","company:legacy:aro",
  "project:legacy:aro","../margincrafttools","other_project","x:aro"];
 for(const v of bad){
  assert.equal(projectIdOk(v),false,v);
  assert.throws(()=>canonicalCompanyId(v),undefined,v);
 }
 assert.equal(projectIdOk(null),true,"null denotes central Brain scope");
 assert.equal(projectIdOk(undefined),false);
});
test("gateway refuses unverified company claims even after syntactic validation",()=>{
 assert.match(gateway,/ctx\.specialistLiveVerified!==true/);
 assert.match(gateway,/specialistEnabled:live,specialistLiveVerified:live/);
 assert.match(gateway,/b\?\.enabled===true&&b\?\.health==="healthy"&&b\?\.verification_state==="verified"/);
 assert.match(gateway,/b\?\.provider_keys/);
 assert.match(gateway,/p\?\.company_id===companyId/);
 assert.match(gateway,/c\?\.project_id===projectId/);
 assert.match(gateway,/brain\.respond\.read_only/);
 assert.match(gateway,/executionAuthorized!==false/);
});
test("SQL candidate retains exact owner/project validation and read-only claim permissions",()=>{
 assert.match(sql,/ISOLATED CANDIDATE ONLY\. NOT DEPLOYED/);
 assert.match(sql,/public\.is_command_center_authorized\(\)/);
 assert.match(sql,/p\.company_id='company:legacy:'\|\|p_project_id/);
 assert.match(sql,/b\.brain_key='brain:'\|\|p\.company_id\|\|':v1'/);
 assert.match(sql,/p\.company_id=any\(b\.supported_company_ids\)/);
 assert.match(sql,/b\.project_id=any\(b\.supported_project_ids\)/);
 assert.match(sql,/b\.enabled and b\.health='healthy' and b\.verification_state='verified'/);
 assert.match(sql,/pr\.scopes @> array\['company-brain-read-only'\]::text\[\]/);
 assert.match(sql,/r\.request_id/);
 assert.doesNotMatch(sql,/grant execute|grant all|set enabled=true|payment_authorized=true/i);
});
test("client parser is expanded, but UI specialist execution stays closed",()=>{
 assert.match(app,/const validLegacy = \/\^\[a-z0-9\]\+\(\?:-\[a-z0-9\]\+\)\*\$\/u\.test\(projectId\)/);
 assert.match(app,/if \(!validFuture && !validLegacy\)/);
 assert.match(ui,/shouldQueuePcBrainResponse\\(/);
 assert.match(ui,/snapshot\\.brain\\?\\.scopedReadOnlyModelVerifiedProjectIds/);
 assert.equal(shouldQueuePcBrainResponse('project:company:future:004',['project:company:future:004'],{}),true);
 assert.equal(shouldQueuePcBrainResponse('project:company:future:004',[],{'project:company:future:004':'available'}),true);
 assert.equal(shouldQueuePcBrainResponse('project:company:future:004',[],{}),false);
 assert.equal(shouldQueuePcBrainResponse('project:company:future:004',['project:company:future:005'],{}),false);
 assert.match(app,/specialistReadiness = projected\.readiness/);
 assert.match(app,/projectSpecialistBindings/);
});

test('company identifier syntax scales beyond the original batch without granting registry membership',()=>{
 const {projectIdOk,canonicalCompanyId}=scopeFunctionsFromCandidate();
 for(const suffix of ['118','999','1000','1000000']){
  assert.equal(projectIdOk('project:company:future:'+suffix),true);
  assert.equal(canonicalCompanyId('project:company:future:'+suffix),'company:future:'+suffix);
 }
 assert.doesNotMatch(gateway,/of 117 expected|like\("project_id","project:company:future:%"\)/);
 assert.match(gateway,/count:"exact",head:true/);
 assert.doesNotMatch(sql,/between 1 and 117|right\(b.project_id,3\)/i);
});
