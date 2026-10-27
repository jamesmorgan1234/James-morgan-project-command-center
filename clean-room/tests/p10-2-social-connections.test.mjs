import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assessSocialConnection } from "../dist/social/index.js";

const base={id:"conn-1",ownerId:"owner-1",canonicalAccountId:"account-1",platformIdentityId:"yt-channel-1",state:"connected",credentialRef:"secret-ref:social:1",grantedScopes:["publish","analytics"],credentialState:"healthy",providerHealth:"available",tokenPresent:true,verifiedAt:"2026-10-26T16:00:00Z",observedAt:"2026-10-26T16:00:10Z",evidenceRefs:["provider:connection:1"]};

test("P10.2 live status requires connected state available provider credential reference token fresh verification and scopes",()=>{
 const result=assessSocialConnection(base,["publish"],"2026-10-26T16:01:00Z",120000);assert.equal(result.live,true);assert.equal(result.secretsExposed,false);assert.equal(result.protectedActionAuthorized,false);
 assert.equal(assessSocialConnection({...base,tokenPresent:false},["publish"],"2026-10-26T16:01:00Z",120000).live,false);
 assert.equal(assessSocialConnection({...base,credentialRef:undefined},["publish"],"2026-10-26T16:01:00Z",120000).live,false);
 assert.equal(assessSocialConnection({...base,credentialState:"healthy",providerHealth:"degraded"},["publish"],"2026-10-26T16:01:00Z",120000).live,false);
 assert.equal(assessSocialConnection(base,["publish"],"2026-10-26T17:00:00Z",120000).live,false);
});

test("P10.2 token presence alone never means connected live",()=>{
 const disconnected={...base,state:"disconnected",requiredOwnerActionRef:"owner-action:connect",reconnectRef:"reconnect:1"};const result=assessSocialConnection(disconnected,["publish"],"2026-10-26T16:01:00Z",120000);assert.equal(result.live,false);assert.equal(result.ownerActionRequired,true);assert.equal(result.reconnectRef,"reconnect:1");
});

test("P10.2 disconnected expired revoked states require recoverable reconnect and owner action evidence",()=>{
 for(const state of ["disconnected","expired","revoked"]){assert.throws(()=>assessSocialConnection({...base,state},["publish"],"2026-10-26T16:01:00Z",120000),/owner-action evidence|reconnect reference/i);const result=assessSocialConnection({...base,state,requiredOwnerActionRef:`owner:${state}`,reconnectRef:`reconnect:${state}`},["publish"],"2026-10-26T16:01:00Z",120000);assert.equal(result.live,false);assert.equal(result.ownerActionRequired,true);}
});

test("P10.2 missing scopes are explicit and keep connection non-live",()=>{
 const result=assessSocialConnection(base,["publish","messages.write"],"2026-10-26T16:01:00Z",120000);assert.equal(result.live,false);assert.deepEqual(result.missingScopes,["messages.write"]);
});

test("P10.2 durable connection truth is immutable owner-scoped secret-free and recoverable",()=>{
 const sql=readFileSync(new URL("../../supabase/migrations/20261026109000_p10_2_social_connections.sql",import.meta.url),"utf8");assert.match(sql,/command_center_social_connection_history/i);assert.match(sql,/state text not null check\(state in \('connected','disconnected','expired','revoked'\)\)/i);assert.match(sql,/provider_health text not null/i);assert.match(sql,/granted_scopes text\[\]/i);assert.match(sql,/required_owner_action_ref text/i);assert.match(sql,/reconnect_ref text/i);assert.match(sql,/secrets_exposed boolean not null default false check\(secrets_exposed=false\)/i);assert.match(sql,/history is immutable/i);assert.match(sql,/is_command_center_authorized/i);
});
