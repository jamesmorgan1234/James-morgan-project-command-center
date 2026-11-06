import test from "node:test";
import assert from "node:assert/strict";
import {ManagedOwnerRuntimeProvider} from "../dist/runtime/owner-security-provider.js";
import {createFixtureRuntimeSnapshot} from "../dist/runtime/snapshot.js";

const worker="22222222-2222-4222-8222-222222222222";
const providerKey="provider:owner-pc:"+worker;
const projectId="margincrafttools";
const companyId="company:legacy:margincrafttools";
function response(body){return new Response(JSON.stringify(body),{status:200,headers:{"content-type":"application/json"}});}
async function readiness(overrides={}){
 const session={accessToken:"owner-token",refreshToken:"refresh-token",expiresAt:9999999999,userId:"owner-1"};
 const data={
  command_center_specialist_brains:[{
    project_id:projectId,brain_key:"brain:"+companyId+":v1",enabled:true,
    health:"healthy",verification_state:"verified",lifecycle:"active",cost_class:"free",
    control_plane:"command_center",provider_keys:[providerKey],
    supported_project_ids:[projectId],supported_company_ids:[companyId]
  }],
  command_center_project_profiles:[{project_id:projectId,company_id:companyId,protected:true}],
  command_center_project_roadmaps:[{project_id:projectId,version:1,state:"current",structure_verified:true}],
  command_center_project_checkpoints:[{project_id:projectId,roadmap_version:1}],
  command_center_provider_registry:[{provider_key:providerKey,enabled:true,health:"available",
    verification:"live_verified",cost:"free",capabilities:["brain.respond.read_only"],
    scopes:["company-brain-read-only"]}]
 };
 for(const [key,value] of Object.entries(overrides))if(key!=="workerOnline")data[key]=value;
 const calls=[];
 const fetcher=async (input,options={})=>{
  const url=input instanceof URL?input:new URL(typeof input==="string"?input:input.url);
  calls.push(url.pathname);
  if(url.pathname.endsWith("/rpc/command_center_pc_owner_worker_status"))
    return response([{workerId:worker,enabled:true,revoked:false,online:overrides.workerOnline!==false}]);
  const name=url.pathname.split("/").at(-1);
  return response(data[name]??[]);
 };
 const storage={
  getItem(name){return name==="command-center:owner-session:v1"?JSON.stringify(session):null;},
  setItem(){},removeItem(){}
 };
 const inner={id:"runtime:unified-test",async signIn(){},async signOut(){},
   async load(){return createFixtureRuntimeSnapshot();}};
 const provider=new ManagedOwnerRuntimeProvider({
   inner,storage,supabaseUrl:"https://example.supabase.co",
   publishableKey:"sb_publishable_test",fetcher
 });
 const snapshot=await provider.load();
 assert.equal(snapshot.brain?.availability,"available","canonical saved Brain view remains available");
 return {snapshot,calls};
}
test("runtime exposes a specialist only when profile, checkpoint, provider and worker are verified",async()=>{
 const {snapshot}=await readiness();
 assert.equal(snapshot.brain.specialistReadiness[projectId],"available");
 assert.equal(snapshot.brain.workerOnline,true);
});
test("runtime refuses disabled or not-verified specialist despite a healthy provider",async()=>{
 const states=[{enabled:false},{verification_state:"experimental"},{lifecycle:"suspended"},
   {health:"unavailable"},{brain_key:"brain:company:legacy:aro:v1"}];
 for(const broken of states){
  const base={project_id:projectId,brain_key:"brain:"+companyId+":v1",enabled:true,
    health:"healthy",verification_state:"verified",lifecycle:"active",cost_class:"free",
    control_plane:"command_center",provider_keys:[providerKey],
    supported_project_ids:[projectId],supported_company_ids:[companyId]};
  const {snapshot}=await readiness({command_center_specialist_brains:[{...base,...broken}]});
  assert.notEqual(snapshot.brain.specialistReadiness?.[projectId],"available");
 }
});
test("runtime rejects wrong company, missing checkpoint, unapproved scope and offline worker",async()=>{
 const baseline={project_id:projectId,company_id:companyId,protected:true};
 const baseProvider={provider_key:providerKey,enabled:true,health:"available",
    verification:"live_verified",cost:"free",capabilities:["brain.respond.read_only"],
    scopes:["company-brain-read-only"]};
 const tests=[
  {command_center_project_profiles:[{...baseline,company_id:"company:legacy:aro"}]},
  {command_center_project_profiles:[{...baseline,protected:false}]},
  {command_center_project_checkpoints:[]},
  {command_center_project_roadmaps:[{project_id:projectId,version:1,state:"current",structure_verified:false}]},
  {command_center_provider_registry:[{...baseProvider,scopes:["owner-central-brain"]}]},
  {command_center_provider_registry:[{...baseProvider,provider_key:"provider:owner-pc:wrong"}]},
  {workerOnline:false}
 ];
 for(const change of tests){
  const {snapshot}=await readiness(change);
  assert.notEqual(snapshot.brain.specialistReadiness?.[projectId],"available");
 }
});
test("missing optional specialist evidence does not break central Brain worker health",async()=>{
 const {snapshot}=await readiness({command_center_specialist_brains:[]});
 assert.equal(snapshot.brain.workerOnline,true);
 assert.deepEqual(snapshot.brain.specialistReadiness,{});
});
