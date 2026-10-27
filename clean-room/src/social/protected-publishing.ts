import type { AuthSessionStore } from "../security/auth.js";
import type { PolicyEngine } from "../security/policy.js";
import type { ProtectedAuthorizationRegistry } from "../security/protected-authorizations.js";
import { parseTimestamp } from "../security/types.js";
import { assertSocialDraftIntegrity,assertSocialDraftTarget,type SocialDraft } from "./drafts.js";
import { assessSocialConnectionForIdentity,type SocialConnectionEvidence } from "./connections.js";
import type { SocialIdentityMapRecord } from "./identity.js";
import { transformForProfile,type PlatformProfileRegistry,type PlatformAdapterRegistry } from "./profiles.js";
import { EvidenceBackedPublishLedger,type EvidenceBackedPublishIntent } from "./publishing.js";

export interface SocialPublishReservation {
 readonly ownerId:string; readonly intentId:string; readonly authorizationRef:string;
 readonly idempotencyKey:string; readonly providerRequestRef:string; readonly envelope:string;
}
/** Must commit an atomic unique reservation before resolving. Never restore or rewind this store. */
export interface AtomicSocialPublishStore { reserve(reservation:SocialPublishReservation):Promise<"reserved"|"already_reserved">; }
export function socialPublishAuthorizationBinding(i:EvidenceBackedPublishIntent,identity:SocialIdentityMapRecord):string {
 return JSON.stringify([i.ownerId,identity.entityId,identity.companyId??null,i.brandId,identity.projectId??null,i.accountId,identity.platform,identity.platformIdentityId,identity.version,i.id,i.draftId,i.draftVersion,i.draftContentHash,i.profileKey,i.profileVersion,i.idempotencyKey,i.scheduledAt??null]);
}
/** Trusted-server composition using canonical C2 stores. No draft, provider or Agent can issue a grant. */
export class SocialPublishGate {
 constructor(readonly sessions:AuthSessionStore,readonly policies:PolicyEngine,readonly authorizations:ProtectedAuthorizationRegistry,readonly store:AtomicSocialPublishStore,readonly ledger:EvidenceBackedPublishLedger,readonly liveConnection:(accountId:string)=>SocialConnectionEvidence,readonly clock:()=>string=()=>new Date().toISOString()){}
 async reserve(i:EvidenceBackedPublishIntent,draft:SocialDraft,identity:SocialIdentityMapRecord,profiles:PlatformProfileRegistry,adapters:PlatformAdapterRegistry,sessionId:string,now:string,providerRequestRef:string){
  const check=(atTime:string)=>{
   const session=this.sessions.validateLive(sessionId,atTime);
   if(session.assurance!=="fresh_passkey_uv")throw new Error("Publish requires fresh passkey verification");
   if(session.ownerId!==i.ownerId||session.companyId!==identity.companyId||session.projectId!==identity.projectId||session.accountId!==identity.accountIdentityId)throw new Error("Publish live session company/project/account mismatch");
   const decision=this.policies.evaluate({action:"social.publish",subject:{...session,sessionId:session.id},resourceOwnerId:i.ownerId,...(identity.companyId?{resourceCompanyId:identity.companyId}:{}),...(identity.projectId?{resourceProjectId:identity.projectId}:{}),resourceAccountId:i.accountId,now:atTime,revocationStateFresh:true});
   if(!decision.allowed)throw new Error(`Publish policy denied: ${decision.reason}`);
   const at=parseTimestamp(atTime,"now");
   if(!session.lastVerifiedAt || at-parseTimestamp(session.lastVerifiedAt,"verification")>=300_000 || parseTimestamp(session.lastVerifiedAt,"verification")>at)throw new Error("Publish requires fresh current verification");
  };
  check(now); const connection=this.liveConnection(i.accountId); assertSocialDraftTarget(draft,identity);await assertSocialDraftIntegrity(draft);
  const profile=profiles.get(i.ownerId,i.profileKey);
  if(!profile.publishScope || !i.requiredScopes.includes(profile.publishScope))throw new Error("Exact provider publishing scope missing from current profile/intent");
  if(profile.version!==i.profileVersion || profile.platform!==identity.platform)throw new Error("Publish profile stale or wrong platform");
  // Transformation approval must cover the exact bytes: changing content/disclosures requires a newly sealed approved draft.
  const transformed=transformForProfile({caption:draft.body,mediaKind:draft.assetBindings.length ? draft.assetBindings[0]!.mediaKind??"unknown" : "text",disclosures:draft.disclosures??[],rightsEvidenceRefs:draft.rightsEvidenceRefs,metadata:{mediaCount:draft.assetBindings.length,...(draft.assetBindings[0]?.width!==undefined?{width:draft.assetBindings[0].width}:{}),...(draft.assetBindings[0]?.height!==undefined?{height:draft.assetBindings[0].height}:{}),...(i.scheduledAt?{scheduledAt:i.scheduledAt}:{})},now},profile,adapters);
  if(transformed.caption!==draft.body || transformed.disclosures.some(d=>!draft.disclosures?.includes(d)))throw new Error("Transformed content requires new exact draft approval");
  if(!assessSocialConnectionForIdentity(connection,identity,i.requiredScopes,now,300_000).live)throw new Error("Publish connection not currently live");
  const binding=socialPublishAuthorizationBinding(i,identity),use={ownerId:i.ownerId,sessionId,action:"social.publish",authorizationIntentBinding:binding};
  const grant=this.authorizations.assertUsable(i.authorizationRef,use,now);
  if(grant.issuedAt!==i.authorizationObservedAt || grant.expiresAt!==i.authorizationExpiresAt || parseTimestamp(now,"now")-parseTimestamp(grant.issuedAt,"grant")>=300_000)throw new Error("Publish authorization freshness/metadata mismatch");
  if(grant.authoritySource!=="owner_verified")throw new Error("Publishing requires exact verified owner authorization");
  if(parseTimestamp(grant.issuedAt,"grant")<parseTimestamp(draft.observedAt,"draft"))throw new Error("Publish authorization predates exact content");
  if(!providerRequestRef.trim())throw new Error("Stable provider request identity required");
  if(this.ledger.intent(i.id) && this.ledger.intent(i.id)!.scheduledAt!==i.scheduledAt)throw new Error("Rescheduled publication requires new exact owner authorization/intent");
  this.ledger.prepare(i,draft,connection,now,300_000);
  if(i.scheduledAt && parseTimestamp(i.scheduledAt,"schedule")>parseTimestamp(now,"now"))throw new Error("Publish schedule not due");
  const result=await this.store.reserve({ownerId:i.ownerId,intentId:i.id,authorizationRef:i.authorizationRef,idempotencyKey:i.idempotencyKey,providerRequestRef,envelope:binding});
  if(result!=="reserved")return Object.freeze({dispatchAllowed:false as const,state:"reconciliation_required" as const});
  const finalNow=this.clock(); check(finalNow);
  if(!assessSocialConnectionForIdentity(this.liveConnection(i.accountId),identity,i.requiredScopes,finalNow,300_000).live)throw new Error("Publish connection lost before dispatch");
  this.authorizations.consume(i.authorizationRef,use,finalNow);
  this.ledger.startAttempt({attemptId:providerRequestRef,intentId:i.id,accountId:i.accountId,idempotencyKey:i.idempotencyKey,state:"submitted",providerRequestRef,observedAt:finalNow});
  return Object.freeze({dispatchAllowed:true as const,state:"reserved" as const,providerRequestRef});
 }
}
