import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateFinancialDataAccess } from "../dist/finance/index.js";

const envelope={ownerId:"owner-1",subjectOwnerId:"owner-1",assurance:"passkey_uv",scopes:["finance:read"],contextDomain:"finance"};
const request={requestedDataClasses:["balances","transactions"],allowedDataClasses:["balances"],auditRef:"audit:1",incidentState:"normal"};

test("P9.8 finance access requires owner/domain/scope/auth isolation and minimizes released context",()=>{
 const decision=evaluateFinancialDataAccess(envelope,request);
 assert.deepEqual(decision.dataClasses,["balances"]); assert.equal(decision.secretsExposed,false); assert.deepEqual(decision.credentialRefsExposed,[]); assert.equal(decision.protectedActionAuthorized,false);
 assert.throws(()=>evaluateFinancialDataAccess({...envelope,subjectOwnerId:"owner-2"},request),/owner boundary/i);
 assert.throws(()=>evaluateFinancialDataAccess({...envelope,contextDomain:"projects"},request),/unrelated context/i);
 assert.throws(()=>evaluateFinancialDataAccess({...envelope,scopes:[]},request),/read scope missing/i);
});

test("P9.8 company and personal finance boundaries cannot cross",()=>{
 assert.throws(()=>evaluateFinancialDataAccess({...envelope,companyId:"company-a",resourceCompanyId:"company-b"},request),/company\/personal isolation/i);
 assert.doesNotThrow(()=>evaluateFinancialDataAccess({...envelope,companyId:"company-a",resourceCompanyId:"company-a"},request));
});

test("P9.8 compromised non-financial domain is contained unless explicit isolated-read scope exists",()=>{
 assert.throws(()=>evaluateFinancialDataAccess(envelope,{...request,incidentState:"non_financial_compromise"}),/contained from finance data/i);
 const result=evaluateFinancialDataAccess({...envelope,scopes:["finance:read","finance:incident:isolated-read"]},{...request,incidentState:"non_financial_compromise"});
 assert.equal(result.allowed,true); assert.equal(result.incidentState,"non_financial_compromise");
});

test("P9.8 finance containment requires fresh passkey and contained-read scope",()=>{
 assert.throws(()=>evaluateFinancialDataAccess({...envelope,scopes:["finance:read","finance:incident:contained-read"]},{...request,incidentState:"finance_containment"}),/fresh verified/i);
 const result=evaluateFinancialDataAccess({...envelope,assurance:"fresh_passkey_uv",scopes:["finance:read","finance:incident:contained-read"]},{...request,incidentState:"finance_containment"});
 assert.equal(result.allowed,true); assert.equal(result.secretsExposed,false);
});

test("P9.8 context minimization fails closed when requested classes are not authorized",()=>{
 assert.throws(()=>evaluateFinancialDataAccess(envelope,{...request,requestedDataClasses:["credit_report"],allowedDataClasses:["balances"]}),/no authorized data classes/i);
});

test("P9.8 durable finance access audit is immutable owner-scoped secret-free and containment-aware",()=>{
 const sql=readFileSync(new URL("../../supabase/migrations/20261026106000_p9_8_financial_identity_isolation.sql",import.meta.url),"utf8");
 assert.match(sql,/command_center_finance_access_audit_history/i); assert.match(sql,/command_center_finance_incident_containment_history/i);
 assert.match(sql,/context_domain text not null check\(context_domain='finance'\)/i); assert.match(sql,/secrets_exposed boolean not null default false check\(secrets_exposed=false\)/i);
 assert.match(sql,/cardinality\(credential_refs_exposed\)=0/i); assert.match(sql,/owner_id=subject_owner_id/i); assert.match(sql,/blocked_finance_access boolean not null default true check\(blocked_finance_access=true\)/i);
 assert.match(sql,/history is immutable/i); assert.match(sql,/is_command_center_authorized/i);
});
