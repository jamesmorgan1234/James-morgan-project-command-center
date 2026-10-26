import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SocialIdentityMapRegistry } from "../dist/social/index.js";

function identity(overrides={}){return {id:"identity-1",ownerId:"owner-1",entityId:"entity-company",companyId:"company-1",brandId:"brand-1",projectId:"project-1",accountIdentityId:"account-1",platform:"youtube",platformIdentityId:"yt-channel-1",displayName:"Brand Channel",aliases:["Brand"],ownershipRefs:["owner-proof:1"],authorizationScopeRefs:["scope:youtube:brand-1"],lineageRefs:["entity:company-1","brand:brand-1","account:account-1"],observedAt:"2026-10-26T16:00:00Z",version:1,...overrides};}

test("P10.1 identity map preserves explicit owner/entity/company/brand/project/account/platform lineage",()=>{
 const registry=new SocialIdentityMapRegistry();const record=registry.register(identity());
 assert.equal(record.ownerId,"owner-1");assert.equal(record.entityId,"entity-company");assert.equal(record.companyId,"company-1");assert.equal(record.brandId,"brand-1");assert.equal(record.projectId,"project-1");assert.equal(record.accountIdentityId,"account-1");assert.equal(record.platformIdentityId,"yt-channel-1");assert.deepEqual(record.lineageRefs,["entity:company-1","brand:brand-1","account:account-1"]);
});

test("P10.1 a platform identity cannot be substituted across canonical brands/accounts",()=>{
 const registry=new SocialIdentityMapRegistry();registry.register(identity());
 assert.throws(()=>registry.register(identity({id:"identity-2",brandId:"brand-2",accountIdentityId:"account-2"})),/already bound/i);
});

test("P10.1 canonical identity lineage cannot mutate during version advance",()=>{
 const registry=new SocialIdentityMapRegistry();registry.register(identity());
 assert.doesNotThrow(()=>registry.register(identity({version:2,displayName:"Renamed Brand Channel",aliases:["Brand","Renamed"]})));
 assert.throws(()=>registry.register(identity({version:3,brandId:"brand-other"})),/cannot be substituted/i);
 assert.throws(()=>registry.register(identity({version:2})),/version must advance/i);
});

test("P10.1 exact identity lookup rejects cross-brand/account/platform substitution",()=>{
 const registry=new SocialIdentityMapRegistry();registry.register(identity());
 assert.equal(registry.requireExact("identity-1","owner-1","brand-1","account-1","youtube","yt-channel-1").id,"identity-1");
 assert.throws(()=>registry.requireExact("identity-1","owner-1","brand-2","account-1","youtube","yt-channel-1"),/lineage mismatch/i);
 assert.throws(()=>registry.requireExact("identity-1","owner-1","brand-1","other-account","youtube","yt-channel-1"),/lineage mismatch/i);
 assert.throws(()=>registry.requireExact("identity-1","owner-1","brand-1","account-1","instagram","yt-channel-1"),/lineage mismatch/i);
});

test("P10.1 ownership authorization and lineage evidence are mandatory",()=>{
 const registry=new SocialIdentityMapRegistry();
 assert.throws(()=>registry.register(identity({ownershipRefs:[]})),/ownership refs/i);
 assert.throws(()=>registry.register(identity({authorizationScopeRefs:[]})),/authorization scopes/i);
 assert.throws(()=>registry.register(identity({lineageRefs:[]})),/lineage refs/i);
});

test("P10.1 durable identity map is immutable owner-scoped and lineage-evidenced",()=>{
 const sql=readFileSync(new URL("../../supabase/migrations/20261026108000_p10_1_social_identity_map.sql",import.meta.url),"utf8");
 assert.match(sql,/command_center_social_identity_map_history/i);assert.match(sql,/entity_id text not null/i);assert.match(sql,/brand_id text not null/i);assert.match(sql,/account_identity_id text not null/i);assert.match(sql,/platform_identity_id text not null/i);assert.match(sql,/ownership_refs text\[\] not null check\(cardinality\(ownership_refs\)>0\)/i);assert.match(sql,/authorization_scope_refs text\[\] not null check\(cardinality\(authorization_scope_refs\)>0\)/i);assert.match(sql,/lineage_refs text\[\] not null check\(cardinality\(lineage_refs\)>0\)/i);assert.match(sql,/history is immutable/i);assert.match(sql,/is_command_center_authorized/i);
});
