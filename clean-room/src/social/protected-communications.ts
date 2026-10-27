import type {AuthSessionStore} from "../security/auth.js";
import type {PolicyEngine} from "../security/policy.js";
import type {ProtectedAuthorizationRegistry} from "../security/protected-authorizations.js";
import type {AtomicSocialPublishStore} from "./protected-publishing.js";
import {socialReplyContentHash,type EvidenceBackedExternalMessage,type EvidenceBackedReplyDraft} from "./inbox.js";
import type {SocialIdentityMapRecord} from "./identity.js";
import {assessSocialConnectionForIdentity,type SocialConnectionEvidence} from "./connections.js";
import {assertSecretChannelSafe} from "../security/secret-channels.js";
export function communicationAuthorizationBinding(id:string,key:string,d:EvidenceBackedReplyDraft,m:EvidenceBackedExternalMessage,identity:SocialIdentityMapRecord){return JSON.stringify([d.ownerId,identity.entityId,identity.companyId??null,d.brandId,identity.projectId??null,d.accountId,identity.platform,identity.platformIdentityId,d.threadId,m.externalAuthorRef,d.messageId,d.id,d.version,d.contentHash,id,key]);}
/** Trusted composition only; raw external text and plain authorization DTOs never authorize sends. */
export class CommunicationSendGate {
 constructor(readonly sessions:AuthSessionStore,readonly policies:PolicyEngine,readonly authorizations:ProtectedAuthorizationRegistry,readonly store:AtomicSocialPublishStore,readonly liveConnection:(accountId:string)=>SocialConnectionEvidence,readonly requiredScope:string,readonly clock:()=>string=()=>new Date().toISOString()){}
 async reserve(id:string,key:string,authorizationRef:string,providerRequestRef:string,d:EvidenceBackedReplyDraft,m:EvidenceBackedExternalMessage,identity:SocialIdentityMapRecord,sessionId:string,now:string){
  if(!id.trim()||!key.trim()||!providerRequestRef.trim()||!this.requiredScope.trim())throw new Error("Exact send/request/provider scope required");
  if(d.ownerId!==identity.ownerId||d.brandId!==identity.brandId||d.accountId!==identity.accountIdentityId||m.ownerId!==d.ownerId||m.brandId!==d.brandId||m.accountId!==d.accountId||m.id!==d.messageId||m.threadId!==d.threadId||m.platform!==identity.platform)throw new Error("Reply canonical account/message/thread mismatch");
  assertSecretChannelSafe("brain_memory",d);
  if(d.contentHash!==await socialReplyContentHash(d))throw new Error("Reply content integrity mismatch");
  const binding=communicationAuthorizationBinding(id,key,d,m,identity),use={ownerId:d.ownerId,sessionId,action:"social.send",authorizationIntentBinding:binding};
  const check=(at:string)=>{const s=this.sessions.validateLive(sessionId,at);if(s.assurance!=="fresh_passkey_uv"||s.ownerId!==d.ownerId||s.companyId!==identity.companyId||s.projectId!==identity.projectId||s.accountId!==d.accountId)throw new Error("Send live identity/assurance mismatch");
   const decision=this.policies.evaluate({action:"social.send",subject:{...s,sessionId:s.id},resourceOwnerId:d.ownerId,...(identity.companyId?{resourceCompanyId:identity.companyId}:{}),...(identity.projectId?{resourceProjectId:identity.projectId}:{}),resourceAccountId:d.accountId,now:at,revocationStateFresh:true});if(!decision.allowed)throw new Error("Send policy denied");
   if(!s.lastVerifiedAt||!Number.isFinite(Date.parse(at))||Date.parse(s.lastVerifiedAt)>Date.parse(at)||Date.parse(at)-Date.parse(s.lastVerifiedAt)>=300_000)throw new Error("Send verification stale");
   if(!assessSocialConnectionForIdentity(this.liveConnection(d.accountId),identity,[this.requiredScope],at,300_000).live)throw new Error("Send connection unavailable");
  };
  check(now);const grant=this.authorizations.assertUsable(authorizationRef,use,now);
  if(grant.authoritySource!=="owner_verified"||Date.parse(grant.issuedAt)<Date.parse(d.createdAt)||Date.parse(now)-Date.parse(grant.issuedAt)>=300_000)throw new Error("Send requires fresh exact owner authorization");
  const result=await this.store.reserve({ownerId:d.ownerId,intentId:id,authorizationRef,idempotencyKey:key,providerRequestRef,envelope:binding});
  if(result!=="reserved")return Object.freeze({sendAuthorized:false as const,state:"reconciliation_required" as const});
  const finalNow=this.clock();check(finalNow);if(Date.parse(finalNow)-Date.parse(this.authorizations.assertUsable(authorizationRef,use,finalNow).issuedAt)>=300_000)throw new Error("Send authorization became stale during persistence");this.authorizations.consume(authorizationRef,use,finalNow);
  return Object.freeze({sendAuthorized:true as const,providerRequestRef,externalTextInstructionAuthority:"none" as const});
 }
}
