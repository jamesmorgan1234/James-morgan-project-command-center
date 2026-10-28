import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SoftwarePlatformRegistry,
  validateSoftwarePlatformState,
  validateSoftwareDeploymentEvidence,
  SOFTWARE_PLATFORM_TRUTH_OWNER
} from "../dist/specialists/index.js";

const binding={
  id:"software-1",
  ownerId:"owner-1",
  projectId:"project-1",
  companyId:"company-1",
  repositoryRef:"repo-1",
  deploymentProviderRef:"deploy-provider-1",
  analyticsProviderRefs:["analytics-1"],
  supportProviderRefs:["support-1"],
  sourceRefs:["software:source"]
};

test("P12.7 software-platform specialist owns software-platform truth",()=>{
  assert.equal(SOFTWARE_PLATFORM_TRUTH_OWNER,"specialist:software_platform");
});

test("P12.7 software-platform projects register generically without hard-coded product identity",()=>{
  const registry=new SoftwarePlatformRegistry();
  registry.register(binding);
  registry.register({...binding,id:"software-2",projectId:"future-platform",companyId:"company-2",repositoryRef:"repo-2",deploymentProviderRef:"deploy-provider-2",sourceRefs:["future:source"]});
  assert.equal(registry.require("owner-1","future-platform").repositoryRef,"repo-2");
});

test("P12.7 repository ownership remains isolated across software-platform projects",()=>{
  const registry=new SoftwarePlatformRegistry();
  registry.register(binding);
  assert.throws(()=>registry.register({...binding,id:"software-2",projectId:"other-platform",companyId:"company-2"}),/repository is isolated/i);
});

test("P12.7 roadmap repository deployment provider analytics support and monetization state stay exact-project scoped",()=>{
  const registry=new SoftwarePlatformRegistry();
  const bound=registry.register(binding);
  for(const domain of ["user","role","roadmap","repository","deployment","provider","analytics","support","monetization"]){
    assert.doesNotThrow(()=>validateSoftwarePlatformState({id:`state-${domain}`,ownerId:"owner-1",projectId:"project-1",companyId:"company-1",domain,canonicalRef:`ref:${domain}`,state:"ok",sourceRefs:[`source:${domain}`]},bound));
  }
  assert.doesNotThrow(()=>validateSoftwareDeploymentEvidence({id:"deployment-1",ownerId:"owner-1",projectId:"project-1",companyId:"company-1",repositoryRef:"repo-1",commitRef:"abc123",environmentRef:"preview",deploymentProviderRef:"deploy-provider-1",deploymentRef:"deployment:1",sourceRefs:["deploy:source"]},bound));
  assert.throws(()=>validateSoftwareDeploymentEvidence({id:"deployment-cross",ownerId:"owner-1",projectId:"project-1",companyId:"company-1",repositoryRef:"wrong-repo",commitRef:"abc123",environmentRef:"preview",deploymentProviderRef:"deploy-provider-1",deploymentRef:"deployment:2",sourceRefs:["deploy:cross"]},bound),/exact project repository and provider/i);
});

test("P12.7 durable software-platform evidence preserves company source context and exact deployment binding",()=>{
  const sql=readFileSync(new URL("../../supabase/migrations/20261026141000_p12_7_software_platform_specialist.sql",import.meta.url),"utf8");
  assert.match(sql,/command_center_software_platform_history[\s\S]*company_ref text not null[\s\S]*source_refs jsonb not null/i);
  assert.match(sql,/command_center_software_platform_state_history[\s\S]*company_ref text not null[\s\S]*source_refs jsonb not null/i);
  assert.match(sql,/command_center_software_platform_deployments/i);
  assert.match(sql,/Software-platform evidence is immutable/i);
  assert.match(sql,/is_command_center_authorized/i);
  assert.match(sql,/recovery_ref text not null/i);
  assert.match(sql,/commit_ref text not null/i);
  assert.match(sql,/deployment_ref text not null/i);
});
