import test from "node:test";
import assert from "node:assert/strict";
import { ServiceBusinessRegistry, validateServiceBusinessState, validateServiceBusinessJobLink, SERVICE_BUSINESS_TRUTH_OWNER } from "../dist/specialists/index.js";

const binding={id:"svc-1",ownerId:"owner-1",projectId:"garage-doors",companyId:"company-gd",crmRef:"crm:gd",calendarRef:"calendar:gd",paymentProviderRef:"payments:gd",sourceRefs:["owner:binding"]};

test("P12.6 service-business archetype registers without project-name hard coding",()=>{const registry=new ServiceBusinessRegistry();const one=registry.register(binding);assert.equal(one.companyId,"company-gd");const two=registry.register({...binding,id:"svc-2",projectId:"future-service",companyId:"company-2",crmRef:"crm:future",calendarRef:"calendar:future",paymentProviderRef:"payments:future"});assert.equal(two.projectId,"future-service");assert.equal(SERVICE_BUSINESS_TRUTH_OWNER,"specialist:service_business");});

test("P12.6 company/project data stays isolated",()=>{const registry=new ServiceBusinessRegistry();const one=registry.register(binding);assert.throws(()=>registry.register({...binding,id:"svc-2",projectId:"other"}),/isolated to another project/i);assert.throws(()=>validateServiceBusinessState({id:"state-1",ownerId:"owner-1",projectId:"other",companyId:"company-gd",domain:"job",canonicalRef:"job:1",state:"scheduled",sourceRefs:["job:source"]},one),/cannot cross company\/project boundary/i);});

test("P12.6 lead estimate contract job schedule payment lineage remains explicit",()=>{const registry=new ServiceBusinessRegistry();const one=registry.register(binding);const link=validateServiceBusinessJobLink({id:"link-1",ownerId:"owner-1",projectId:"garage-doors",companyId:"company-gd",leadRef:"lead:1",estimateRef:"estimate:1",contractRef:"contract:1",jobRef:"job:1",scheduleRef:"schedule:1",paymentRef:"payment:1",sourceRefs:["pipeline:1"]},one);assert.equal(link.jobRef,"job:1");assert.throws(()=>validateServiceBusinessJobLink({...link,id:"bad",leadRef:undefined,estimateRef:undefined,contractRef:undefined,scheduleRef:undefined,paymentRef:undefined},one),/at least one linked business record/i);});
