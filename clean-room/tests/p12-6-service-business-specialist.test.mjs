import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ServiceBusinessRegistry,
  validateServiceBusinessState,
  validateServiceBusinessJobLink,
  SERVICE_BUSINESS_TRUTH_OWNER
} from "../dist/specialists/index.js";

const binding={
  id:"service-1",
  ownerId:"owner-1",
  projectId:"project-1",
  companyId:"company-1",
  crmRef:"crm-1",
  calendarRef:"calendar-1",
  paymentProviderRef:"payments-1",
  sourceRefs:["service:source"]
};

test("P12.6 service-business specialist owns service-business truth",()=>{
  assert.equal(SERVICE_BUSINESS_TRUTH_OWNER,"specialist:service_business");
});

test("P12.6 service-business projects register generically without hard-coded company logic",()=>{
  const registry=new ServiceBusinessRegistry();
  registry.register(binding);
  registry.register({...binding,id:"service-2",projectId:"future-service",companyId:"company-2",crmRef:"crm-2",calendarRef:"calendar-2",paymentProviderRef:"payments-2",sourceRefs:["future:source"]});
  assert.equal(registry.require("owner-1","future-service").companyId,"company-2");
});

test("P12.6 CRM ownership remains isolated across service-business projects",()=>{
  const registry=new ServiceBusinessRegistry();
  registry.register(binding);
  assert.throws(()=>registry.register({...binding,id:"service-2",projectId:"other-service",companyId:"company-2"}),/CRM is isolated/i);
});

test("P12.6 lead-to-job state and linked records stay company/project scoped",()=>{
  const registry=new ServiceBusinessRegistry();
  const bound=registry.register(binding);
  for(const domain of ["lead","estimate","contract","job","material","schedule","payment","follow_up","reputation"]){
    assert.doesNotThrow(()=>validateServiceBusinessState({id:`state-${domain}`,ownerId:"owner-1",projectId:"project-1",companyId:"company-1",domain,canonicalRef:`ref:${domain}`,state:"ok",sourceRefs:[`source:${domain}`]},bound));
  }
  assert.doesNotThrow(()=>validateServiceBusinessJobLink({id:"link-1",ownerId:"owner-1",projectId:"project-1",companyId:"company-1",leadRef:"lead-1",estimateRef:"estimate-1",contractRef:"contract-1",jobRef:"job-1",scheduleRef:"schedule-1",paymentRef:"payment-1",sourceRefs:["job:source"]},bound));
  assert.throws(()=>validateServiceBusinessState({id:"cross",ownerId:"owner-1",projectId:"other",companyId:"company-1",domain:"job",canonicalRef:"job:cross",state:"open",sourceRefs:["cross:source"]},bound),/cannot cross company\/project boundary/i);
});

test("P12.6 durable service-business evidence preserves company scope sources immutability and recovery",()=>{
  const sql=readFileSync(new URL("../../supabase/migrations/20261026140000_p12_6_service_business_specialist.sql",import.meta.url),"utf8");
  assert.match(sql,/command_center_service_business_history/i);
  assert.match(sql,/command_center_service_business_state_history[\s\S]*company_ref text not null[\s\S]*source_refs jsonb not null/i);
  assert.match(sql,/command_center_service_business_job_link_history[\s\S]*company_ref text not null[\s\S]*source_refs jsonb not null/i);
  assert.match(sql,/Service-business evidence is immutable/i);
  assert.match(sql,/is_command_center_authorized/i);
  assert.match(sql,/recovery_ref text not null/i);
});
