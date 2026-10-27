import test from 'node:test';
import assert from 'node:assert/strict';
import {FinancialAccessBoundary} from '../dist/finance/index.js';
import {AuthSessionStore} from '../dist/security/index.js';
const now='2026-10-27T22:00:00Z';
function fixture(overrides={}) {
 const sessions=new AuthSessionStore();
 sessions.register({id:'s',ownerId:'o',scopes:['finance:read','finance:write'],assurance:'fresh_passkey_uv',state:'active',createdAt:now,expiresAt:'2026-10-27T23:00:00Z',lastValidatedAt:now,lastVerifiedAt:now,...overrides});
 let grant={sessionId:'s',ownerId:'o',scopeId:'personal',dataClasses:['balances'],canWrite:false,verifiedAt:now,expiresAt:'2026-10-27T22:04:00Z'};
 let contained=false;
 const boundary=new FinancialAccessBoundary(sessions,()=>grant,()=>contained);
 const resource={ownerId:'o',scopeId:'personal'};
 const request={requestedDataClasses:['balances','transactions'],auditRef:'audit:1',incidentState:'normal'};
 return {sessions,resource,request,boundary,setGrant:g=>grant=g,contain:()=>contained=true,run:(write=false)=>boundary.authorize('s',resource,now,request,write)};
}
test('P9.8 server capability minimizes context and never grants action authority',()=>{
 const f=fixture(),d=f.run();assert.deepEqual(d.dataClasses,['balances']);assert.equal(d.protectedActionAuthorized,false);assert.deepEqual(d.credentialRefsExposed,[]);
 assert.throws(()=>f.run(true),/read-only/);
});
test('P9.8 compromised domain cannot self-assert finance scopes or borrow another session capability',()=>{
 const f=fixture();f.setGrant(undefined);assert.throws(()=>f.run(),/capability missing/);
 f.setGrant({sessionId:'other',ownerId:'o',scopeId:'personal'});assert.throws(()=>f.run(),/scope mismatch/);
 const noScope=fixture({scopes:['projects:read']});assert.throws(()=>noScope.run(),/read scope/);
});
test('P9.8 live revoked locked expired and insufficient sessions fail closed',()=>{
 for(const operation of ['revoke','lock','markRisky']) {const f=fixture();f.sessions[operation]('s',now,'incident');assert.throws(()=>f.run(),/revoked|locked|risky/);}
 const f=fixture();assert.throws(()=>f.boundary.authorize('s',f.resource,'2026-10-28T00:00:00Z',f.request),/expired/);
 assert.throws(()=>fixture({assurance:'authenticated'}).run(),/passkey/);
});
test('P9.8 personal company project and owner scopes are exact',()=>{
 const f=fixture();for(const patch of [{ownerId:'other'},{scopeId:'company'},{companyId:'company'},{projectId:'project'}])assert.throws(()=>f.boundary.authorize('s',{...f.resource,...patch},now,f.request),/scope mismatch/);
});
test('P9.8 containment verification expiry unknown incident and secret-like metadata fail closed',()=>{
 const f=fixture();f.contain();assert.throws(()=>f.run(),/contained/);
 const g=fixture();assert.throws(()=>g.boundary.authorize('s',g.resource,'2026-10-27T22:05:00Z',g.request),/stale or expired/);
 assert.throws(()=>fixture().boundary.authorize('s',g.resource,now,{...g.request,incidentState:'unknown'}),/Unknown finance/);
 assert.throws(()=>fixture().boundary.authorize('s',g.resource,now,{...g.request,auditRef:'Bearer abcdefghijklmnopqrstuv'}),/Secret/);
});
