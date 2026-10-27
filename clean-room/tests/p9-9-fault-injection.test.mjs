import test from 'node:test';
import assert from 'node:assert/strict';
import {assessFinancialSyncBatch,assessFinancialRecovery,reconcileFinancialSnapshot} from '../dist/finance/index.js';
const now='2026-10-27T22:30:00Z';
const snapshot={ownerId:'owner',providerKey:'finance-provider:fixture',capturedAt:now,contentHash:'hash:verified',accountIds:['a']};
const batch={snapshot,expectedPageIds:['1','2'],receivedPageIds:['1','2'],complete:true,integrityVerified:true,provenanceVerified:true,providerHealth:'available',connectionState:'connected',consentGranted:true,credentialUsable:true,capabilityPresent:true,permissionPresent:true,expectedAccountIds:['a'],evidenceRefs:['sync:verified']};
const restoreValidation={knownGoodSnapshotRef:'backup:verified',backupHashVerified:true,currentAuthorizationRevalidated:true,currentRevocationsRevalidated:true,immutableHistoryPreserved:true,missingAccountRefs:[]};
const recovery={id:'restore',ownerId:'owner',providerKey:snapshot.providerKey,incidentKind:'restore',observedAt:now,evidenceRefs:['backup:verified'],auditRef:'audit:restore',integrityVerified:true,provenanceVerified:true,providerHealth:'available',canonicalAccountRefs:['a'],priorExecutionRefs:['reserved:do-not-restore'],receiptRefs:[],restoreValidation};
test('P9.9 complete sync accepts once; duplicate out-of-order and conflicting events do not replace truth',()=>{
 assert.equal(assessFinancialSyncBatch(undefined,batch,now,30000).promoteCurrent,true);
 assert.equal(assessFinancialSyncBatch(snapshot,batch,now,30000).state,'duplicate');
 const newer={...snapshot,capturedAt:'2026-10-27T22:30:01Z'};assert.equal(assessFinancialSyncBatch(newer,batch,now,30000).state,'reject_stale');
 assert.equal(assessFinancialSyncBatch({...snapshot,contentHash:'other'},batch,now,30000).state,'manual_conflict');
 assert.equal(reconcileFinancialSnapshot(snapshot,{...snapshot,accountIds:['other']}),'manual_conflict');
});
test('P9.9 partial interrupted missing duplicate and malformed pages never promote canonical truth',()=>{
 for(const patch of [{complete:false},{receivedPageIds:['1']},{receivedPageIds:['1','1']},{receivedPageIds:['1','3']},{integrityVerified:false},{provenanceVerified:false},{evidenceRefs:[]},{expectedAccountIds:['a','missing']},{snapshot:{...snapshot,accountIds:['a','a']}}])assert.equal(assessFinancialSyncBatch(snapshot,{...batch,...patch},now,30000).promoteCurrent,false);
 assert.throws(()=>assessFinancialSyncBatch(snapshot,{...batch,snapshot:{...snapshot,capturedAt:'malformed'}},now,30000));
 assert.deepEqual(snapshot.accountIds,['a']);
});
test('P9.9 provider errors permission credential capability loss and compromise retain last known truth',()=>{
 for(const patch of [{providerHealth:'unavailable'},{providerHealth:'degraded'},{providerHealth:'compromised'},{providerHealth:'malformed'},{connectionState:'disconnected'},{connectionState:'expired'},{connectionState:'revoked'},{consentGranted:false},{credentialUsable:false},{capabilityPresent:false},{permissionPresent:false}])assert.equal(assessFinancialSyncBatch(snapshot,{...batch,...patch},now,30000).promoteCurrent,false);
 assert.equal(assessFinancialSyncBatch(snapshot,batch,'2026-10-27T22:31:00Z',30000).reason,'stale_or_future_financial_data');
 assert.equal(assessFinancialSyncBatch(undefined,batch,now,30000).promoteCurrent,true);
});
test('P9.9 restore never resurrects access and requires current revocation authorization hash and account checks',()=>{
 assert.equal(assessFinancialRecovery({...recovery,restoreValidation:undefined}).disposition,'reject');
 for(const patch of [{knownGoodSnapshotRef:''},{backupHashVerified:false},{currentAuthorizationRevalidated:false},{currentRevocationsRevalidated:false},{immutableHistoryPreserved:false},{missingAccountRefs:['missing']}]){
 const d=assessFinancialRecovery({...recovery,restoreValidation:{...restoreValidation,...patch}});assert.equal(d.disposition,'reject');assert.equal(d.canonicalIdentityPreserved,false);assert.equal(d.actionReplayAllowed,false);
 }
 const a=assessFinancialRecovery(recovery),b=assessFinancialRecovery(recovery);assert.deepEqual(a,b);assert.equal(a.disposition,'accept');assert.equal(a.protectedActionAuthorized,false);assert.equal(a.rollbackAuthorized,false);
});
test('P9.9 provider loss and changed canonical identity cannot certify a relink',()=>{
 const relink={...recovery,incidentKind:'account_relink',relinkedAccountRefs:['a']};assert.equal(assessFinancialRecovery(relink).disposition,'accept');
 assert.equal(assessFinancialRecovery({...relink,providerHealth:'degraded'}).disposition,'defer');
 assert.equal(assessFinancialRecovery({...relink,relinkedAccountRefs:['other']}).disposition,'manual_review');
 assert.equal(assessFinancialRecovery({...recovery,providerHealth:'malformed'}).disposition,'reject');
 assert.equal(assessFinancialRecovery({...recovery,integrityVerified:'true'}).disposition,'reject');
});

test('P9.9 restoration revalidates live session/capability instead of trusting historical flags',async()=>{
 const {FinancialAccessBoundary,assessFinancialRestoreWithLiveAccess}=await import('../dist/finance/index.js');
 const {AuthSessionStore}=await import('../dist/security/index.js');
 const sessions=new AuthSessionStore();sessions.register({id:'s',ownerId:'owner',scopes:['finance:read','finance:write'],assurance:'fresh_passkey_uv',state:'active',createdAt:now,expiresAt:'2026-10-27T23:00:00Z',lastValidatedAt:now,lastVerifiedAt:now});
 let capability={sessionId:'s',ownerId:'owner',scopeId:'personal',dataClasses:['recovery'],canWrite:true,verifiedAt:now,expiresAt:'2026-10-27T22:34:00Z'};
 const boundary=new FinancialAccessBoundary(sessions,()=>capability,()=>false),resource={ownerId:'owner',scopeId:'personal'};
 assert.equal(assessFinancialRestoreWithLiveAccess(boundary,'s',resource,now,recovery).disposition,'accept');
 capability=undefined;assert.throws(()=>assessFinancialRestoreWithLiveAccess(boundary,'s',resource,now,recovery),/capability missing/);
 sessions.revoke('s',now,'incident');assert.throws(()=>assessFinancialRestoreWithLiveAccess(boundary,'s',resource,now,recovery),/revoked/);
});

test('P9.9 secret-like evidence cannot pass the ordinary recovery sync surface',()=>{
 assert.throws(()=>assessFinancialSyncBatch(snapshot,{...batch,evidenceRefs:['Bearer abcdefghijklmnopqrstuv']},now,30000),/Secret/);
});
