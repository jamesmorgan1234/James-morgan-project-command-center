import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SpecialistFrameworkRegistry, validateSpecialistFrameworkContract } from "../dist/specialists/index.js";

const contract={typeKey:"example",ownerId:"owner-1",version:1,capabilityOwners:{analyze:"specialist:example"},dataContracts:["data:example"],brainHooks:["brain:example"],agencyHooks:["agency:example"],detailSections:["overview"],metricKeys:["throughput"],providerAdapters:["provider:example"],isolationClass:"specialist:example",sourceRefs:["owner:spec"]};

test("P12.1 generic specialist framework covers ownership data hooks surfaces metrics providers and isolation",()=>{const valid=validateSpecialistFrameworkContract(contract);assert.equal(valid.capabilityOwners.analyze,"specialist:example");assert.deepEqual(valid.dataContracts,["data:example"]);});

test("P12.1 future specialist type registers without project-name core edits",()=>{const registry=new SpecialistFrameworkRegistry();registry.register(contract);registry.register({...contract,typeKey:"future",capabilityOwners:{future:"specialist:future"},isolationClass:"specialist:future",sourceRefs:["future:spec"]});assert.equal(registry.require("owner-1","future").typeKey,"future");});

test("P12.1 missing ownership or data/detail/provenance fails closed",()=>{assert.throws(()=>validateSpecialistFrameworkContract({...contract,capabilityOwners:{}}),/capability ownership/i);assert.throws(()=>validateSpecialistFrameworkContract({...contract,dataContracts:[]}),/data\/detail\/provenance/i);});

test("P12.1 framework version must advance",()=>{const registry=new SpecialistFrameworkRegistry();registry.register(contract);assert.throws(()=>registry.register(contract),/version must advance/i);assert.doesNotThrow(()=>registry.register({...contract,version:2}));});

test("P12.1 durable specialist framework is immutable and owner scoped",()=>{const sql=readFileSync(new URL("../../supabase/migrations/20261026130000_p12_1_specialist_framework.sql",import.meta.url),"utf8");assert.match(sql,/command_center_specialist_framework_history/i);assert.match(sql,/capability_owners jsonb not null/i);assert.match(sql,/specialist framework evidence is immutable/i);assert.match(sql,/is_command_center_authorized/i);});
