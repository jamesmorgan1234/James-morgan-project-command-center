import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SpecialistLifecycleRegistry, assertSpecialistIsolation } from "../dist/specialists/index.js";

const type={typeKey:"service_business",truthOwner:"specialist:service_business",isolationClass:"specialist:service_business",requiredProviderCapabilities:["crm"],sourceRefs:["type:source"]};
const project={id:"lifecycle-1",ownerId:"owner-1",projectId:"project-1",typeKey:"service_business",displayName:"Service One",canonicalRef:"service:project-1",status:"active",providerCapabilities:["crm"],sourceRefs:["project:source"]};

function auth(action,targetProjectId){return {authorizationRef:`auth:${action}`,ownerId:"owner-1",projectId:"project-1",action,...(targetProjectId?{targetProjectId}: {})};}

test("P12.8 future specialist types register without changing Command Center truth ownership",()=>{
  const registry=new SpecialistLifecycleRegistry();
  registry.registerType(type);
  registry.registerType({typeKey:"future_specialist",truthOwner:"specialist:future_specialist",isolationClass:"specialist:future_specialist",requiredProviderCapabilities:[],sourceRefs:["future:type"]});
  registry.registerProject(project);
  registry.registerProject({...project,id:"future-1",projectId:"future-project",typeKey:"future_specialist",displayName:"Future Specialist",canonicalRef:"future:project",providerCapabilities:[],sourceRefs:["future:project"]});
  assert.equal(registry.get("owner-1","future-project").typeKey,"future_specialist");
});

test("P12.8 canonical specialist truth cannot collide across projects",()=>{
  assert.throws(()=>assertSpecialistIsolation([
    {projectId:"a",typeKey:"service_business",truthOwner:"specialist:service_business",canonicalRef:"same",providerRefs:[],sourceRefs:["a"],status:"active"},
    {projectId:"b",typeKey:"service_business",truthOwner:"specialist:service_business",canonicalRef:"same",providerRefs:[],sourceRefs:["b"],status:"active"}
  ]),/truth ownership collision/i);
});

test("P12.8 lifecycle mutations require exact action authorization and provider reactivation readiness",()=>{
  const registry=new SpecialistLifecycleRegistry();
  registry.registerType(type);
  registry.registerProject(project);
  assert.throws(()=>registry.rename("owner-1","project-1","Renamed",{...auth("rename"),authorizationRef:""}),/exact owner\/project\/action authorization/i);
  const renamed=registry.rename("owner-1","project-1","Renamed",auth("rename"));
  assert.equal(renamed.displayName,"Renamed");
  registry.setDormant("owner-1","project-1");
  assert.throws(()=>registry.activate("owner-1","project-1",[],auth("activate")),/unavailable required provider capability/i);
  const active=registry.activate("owner-1","project-1",["crm"],auth("activate"));
  assert.equal(active.status,"active");
});

test("P12.8 provider loss is isolated and does not silently rewrite project truth",()=>{
  const registry=new SpecialistLifecycleRegistry();
  registry.registerType(type);
  registry.registerProject(project);
  const assessment=registry.assessProvider("owner-1","project-1","crm","unavailable",["provider:health"]);
  assert.equal(assessment.isolatedFailure,true);
  assert.equal(registry.get("owner-1","project-1").status,"active");
});

test("P12.8 durable lifecycle evidence is owner-isolated immutable recoverable and future-registration capable",()=>{
  const sql=readFileSync(new URL("../../supabase/migrations/20261026142000_p12_8_specialist_lifecycle_isolation.sql",import.meta.url),"utf8");
  assert.match(sql,/command_center_specialist_types/i);
  assert.match(sql,/command_center_specialist_projects/i);
  assert.match(sql,/command_center_specialist_project_history/i);
  assert.match(sql,/command_center_specialist_provider_assessments/i);
  assert.match(sql,/Specialist lifecycle evidence is immutable/i);
  assert.match(sql,/is_command_center_authorized/i);
  assert.match(sql,/recovery_ref text not null/i);
});

test("P12.8 canonical projection contract forbids project override of specialist truth owner and isolation class",()=>{
  const contracts=readFileSync(new URL("../src/specialists/contracts.ts",import.meta.url),"utf8");
  assert.match(contracts,/Project projection cannot override canonical specialist truth ownership/);
  assert.match(contracts,/Project projection cannot override canonical specialist isolation class/);
});
