export type MediaWorkflowStage = "research" | "production" | "publishing" | "analytics" | "revenue";
export type MediaWorkerMode = "manual" | "project_auto" | "portfolio_auto";

export interface MediaSourceEvidence {
  readonly id: string;
  readonly ownerId: string;
  readonly sourceRef: string;
  readonly contentRef: string;
  readonly rightsRefs: readonly string[];
  readonly provenanceRefs: readonly string[];
  readonly observedAt: string;
}

export interface MediaWorkflowRoute {
  readonly stage: MediaWorkflowStage;
  readonly capabilityKey: string;
  readonly providerAdapterKey?: string;
  readonly protectedAction: boolean;
}

export interface MediaSpecialistProfile {
  readonly key: "media";
  readonly truthOwner: "specialist:media";
  readonly projectRef: string;
  readonly routes: readonly MediaWorkflowRoute[];
  readonly autonomousWorkerModes: readonly MediaWorkerMode[];
  readonly sourceRefs: readonly string[];
}

export const MEDIA_SPECIALIST_PROFILE: MediaSpecialistProfile = Object.freeze({
  key: "media",
  truthOwner: "specialist:media",
  projectRef: "VeloClip",
  routes: Object.freeze([
    Object.freeze({stage:"research",capabilityKey:"content_research",protectedAction:false}),
    Object.freeze({stage:"production",capabilityKey:"media_processing",protectedAction:false}),
    Object.freeze({stage:"publishing",capabilityKey:"platform_publish",providerAdapterKey:"social-platform",protectedAction:true}),
    Object.freeze({stage:"analytics",capabilityKey:"content_analytics",providerAdapterKey:"social-platform",protectedAction:false}),
    Object.freeze({stage:"revenue",capabilityKey:"revenue_reconciliation",protectedAction:false})
  ]),
  autonomousWorkerModes: Object.freeze(["manual","project_auto"] as MediaWorkerMode[]),
  sourceRefs: Object.freeze(["roadmap:P12.3"])
});

function mediaRefs(values: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(values) || values.length===0 || values.some((value)=>!value.trim())) throw new Error(`${label} required`);
  return Object.freeze([...new Set(values.map((value)=>value.trim()))]);
}

export function validateMediaSourceEvidence(evidence: MediaSourceEvidence): MediaSourceEvidence {
  if (!evidence.id.trim() || !evidence.ownerId.trim() || !evidence.sourceRef.trim() || !evidence.contentRef.trim()) throw new Error("media source identity/provenance required");
  if (!Number.isFinite(Date.parse(evidence.observedAt))) throw new Error("media source observedAt invalid");
  return Object.freeze({...evidence,rightsRefs:mediaRefs(evidence.rightsRefs,"media source rights"),provenanceRefs:mediaRefs(evidence.provenanceRefs,"media source provenance")});
}

export function requireMediaRoute(profile: MediaSpecialistProfile, stage: MediaWorkflowStage): MediaWorkflowRoute {
  if (profile.truthOwner !== "specialist:media") throw new Error("Command Center cannot replace media specialist truth ownership");
  const route=profile.routes.find((candidate)=>candidate.stage===stage);
  if (!route) throw new Error(`media workflow route unavailable: ${stage}`);
  return route;
}

export function assertMediaWorkerModeAllowed(profile: MediaSpecialistProfile, mode: MediaWorkerMode): void {
  if (!profile.autonomousWorkerModes.includes(mode)) throw new Error("media worker mode is outside specialist autonomous boundary");
}

export function assertMediaPublishReady(source: MediaSourceEvidence, authorizationRef?: string): void {
  validateMediaSourceEvidence(source);
  if (!authorizationRef || !/^evd_[a-z0-9]+(?:-[a-z0-9]+)*$/.test(authorizationRef)) throw new Error("media publishing requires canonical protected-action authorization evidence");
}
