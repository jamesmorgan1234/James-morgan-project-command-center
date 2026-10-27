import {assuranceAtLeast} from "../security/types.js";
import type {AuthSessionStore} from "../security/auth.js";
import type {PolicyEngine} from "../security/policy.js";
import type {SocialIdentityMapRecord} from "./identity.js";
import {assertSecretChannelSafe} from "../security/secret-channels.js";
export interface SocialAccountCapability {
 readonly ownerId:string;readonly sessionId:string;readonly accountId:string;readonly brandId:string;
 readonly companyId?:string;readonly projectId?:string;readonly dataClasses:readonly string[];
 readonly canWrite:boolean;readonly verifiedAt:string;readonly expiresAt:string;readonly revoked:boolean;readonly contained:boolean;
}
/** Server-held lookups only. A caller cannot choose or self-assert its capability/identity. */
export class SocialAccessBoundary {
 constructor(readonly sessions:AuthSessionStore,readonly policies:PolicyEngine,readonly identityLookup:(accountId:string)=>SocialIdentityMapRecord|undefined,readonly capabilityLookup:(sessionId:string,accountId:string)=>SocialAccountCapability|undefined,readonly clock:()=>string=()=>new Date().toISOString()){}
 authorize(sessionId:string,accountId:string,requested:readonly string[],now:string,write=false){
  const s=this.sessions.validateLive(sessionId,now),identity=this.identityLookup(accountId),c=this.capabilityLookup(sessionId,accountId);
  if(!identity||!c||c.sessionId!==s.id||c.ownerId!==s.ownerId||c.ownerId!==identity.ownerId||c.accountId!==accountId||identity.accountIdentityId!==accountId||c.brandId!==identity.brandId||c.companyId!==identity.companyId||c.projectId!==identity.projectId||s.companyId!==identity.companyId||s.projectId!==identity.projectId||s.accountId!==accountId)throw new Error("Social account/company/project capability mismatch");
  const at=Date.parse(now),verified=Date.parse(c.verifiedAt),expires=Date.parse(c.expiresAt);
  if(c.revoked!==false||c.contained!==false||!assuranceAtLeast(s.assurance,write?"fresh_passkey_uv":"passkey_uv")||!Number.isFinite(verified)||!Number.isFinite(expires)||verified>at||at-verified>=300_000||expires<=at||(write&&!c.canWrite)||!s.lastVerifiedAt||Date.parse(s.lastVerifiedAt)<verified)throw new Error("Social capability revoked contained expired stale or read-only");
  const decision=this.policies.evaluate({action:write?"social.write":"social.read",subject:{...s,sessionId:s.id},resourceOwnerId:identity.ownerId,...(identity.companyId?{resourceCompanyId:identity.companyId}:{}),...(identity.projectId?{resourceProjectId:identity.projectId}:{}),resourceAccountId:accountId,now,revocationStateFresh:true});
  if(!decision.allowed)throw new Error("Social access policy denied");
  assertSecretChannelSafe("brain_memory",{requested});
  if(!requested.length||requested.some(x=>!x.trim()||!c.dataClasses.includes(x)||/secret|credential|token/i.test(x)))throw new Error("Social context data classes denied");
  return Object.freeze({identity:Object.freeze({ownerId:identity.ownerId,entityId:identity.entityId,companyId:identity.companyId,brandId:identity.brandId,projectId:identity.projectId,accountIdentityId:identity.accountIdentityId,platform:identity.platform,platformIdentityId:identity.platformIdentityId,version:identity.version}),dataClasses:Object.freeze([...new Set(requested)]),protectedActionAuthorized:false as const});
 }
}
export interface SocialRecoverySnapshot {
 readonly schemaVersion:1;
 readonly ownerId:string;readonly accountId:string;readonly platformIdentityId:string;
 readonly records:readonly Readonly<{id:string;kind:"draft"|"asset_reference"|"metric_observation"|"untrusted_message";value:unknown}>[];
 readonly evidenceRefs:readonly string[];
}
export async function socialRecoverySnapshotHash(snapshot:SocialRecoverySnapshot):Promise<string>{const d=await globalThis.crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(snapshot)));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("");}
export async function planSocialDataRestore(boundary:SocialAccessBoundary,sessionId:string,now:string,snapshot:SocialRecoverySnapshot,knownGoodHash:string){
 if(snapshot.schemaVersion!==1)throw new Error("Unsupported social recovery schema version");
 const access=boundary.authorize(sessionId,snapshot.accountId,["recovery"],now,true);
 if(access.identity.ownerId!==snapshot.ownerId||access.identity.platformIdentityId!==snapshot.platformIdentityId||!snapshot.evidenceRefs.length||snapshot.evidenceRefs.some(x=>!x.trim()))throw new Error("Restore canonical account/provenance mismatch");
 if(new Set(snapshot.records.map(r=>r.id)).size!==snapshot.records.length||snapshot.records.some(r=>!r.id.trim()||!["draft","asset_reference","metric_observation","untrusted_message"].includes(r.kind)))throw new Error("Restore cannot import credentials/capabilities/publish/send authority or duplicate records");
 assertSecretChannelSafe("brain_memory",snapshot);
 if(knownGoodHash!==await socialRecoverySnapshotHash(snapshot))throw new Error("Known-good recovery integrity mismatch");
 boundary.authorize(sessionId,snapshot.accountId,["recovery"],boundary.clock(),true);
 return Object.freeze({recordIds:Object.freeze(snapshot.records.map(r=>r.id)),stagingOnly:true as const,replayAllowed:false as const,restoreAuthority:false as const,currentRevocationsRevalidated:true as const});
}

/** Reuse the existing owner Needs Me queue; never copy external text into a control-plane instruction. */
export function queueSocialInboxFollowUp(queue:import("../personal/needs-me.js").NeedsMeQueue,boundary:SocialAccessBoundary,sessionId:string,message:import("./inbox.js").EvidenceBackedExternalMessage,dueAt:string,ownerRequestRef:string,now:string){
 const {identity}=boundary.authorize(sessionId,message.accountId,["messages"],now,true);
 if(identity.ownerId!==message.ownerId||identity.brandId!==message.brandId||identity.platform!==message.platform||!message.threadId.trim()||!ownerRequestRef.trim()||!message.sourceRefs.length||!Number.isFinite(Date.parse(dueAt))||Date.parse(dueAt)<Date.parse(now))throw new Error("Scoped owner follow-up identity/time/evidence mismatch");
 const scope=JSON.stringify([message.ownerId,message.brandId,message.accountId,message.threadId,dueAt]),id=`social-follow-up:${scope}`;
 queue.upsert({id,ownerId:message.ownerId,needKey:id,title:`Review social communication at ${dueAt}`,reason:"A scoped owner follow-up requires review",urgency:"normal",requiredEnvironment:"any_device",ownerAction:"Review the intended account/thread and prepare a reply; sending requires fresh separate authorization",unlockRefs:[ownerRequestRef],resumeRefs:[`social-thread:${JSON.stringify([message.ownerId,message.brandId,message.accountId,message.threadId])}`],sourceRefs:[ownerRequestRef],state:"open"});
 return Object.freeze({needId:id,sendAuthorized:false as const,externalInstructionAuthority:"none" as const});
}
