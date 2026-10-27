export const LIFECYCLE_VOCABULARY_VERSION = 1 as const;

export const REQUIREMENT_STATES = ["draft","owner_review","locked","implemented_unverified","verified_complete","superseded","excluded"] as const;
export const PROJECT_STATES = ["candidate","active","paused","blocked","completed","closed","superseded","merged","abandoned","unknown"] as const;
export const MODULE_STATES = ["registered","enabled","degraded","disabled","retired"] as const;
export const CAPABILITY_STATES = ["absent","dormant","configured","connected","authorized","enabled","degraded","disabled","retired"] as const;
export const COMMAND_STATES = ["created","accepted","rejected","executing","succeeded","failed","cancelled"] as const;
export const EVENT_STATES = ["recorded","published","consumed","superseded"] as const;
export const WORKFLOW_STATES = ["draft","ready","running","paused","blocked","completed","failed","cancelled"] as const;
export const AGENCY_RUN_STATES = ["planned","queued","working","needs_owner","blocked","paused","stopped","failed","completed"] as const;
export const AGENCY_JOB_STATES = ["planned","queued","claimed","working","verification_pending","verified","blocked","failed","cancelled"] as const;
export const AGENCY_TASK_STATES = ["planned","queued","claimed","working","verification_pending","verified","blocked","needs_owner","paused","stopped","failed","completed"] as const;
export const EVIDENCE_STATES = ["self_report_only","recorded","verified","rejected","stale","superseded"] as const;
export const ASSET_STATES = ["referenced","available","missing","protected","superseded","reconstructed","retired"] as const;
export const PROVIDER_STATES = ["unknown","available","degraded","unavailable","retired"] as const;
export const RELEASE_STATES = ["draft","candidate","staged","authorized","deployed_unverified","live_verified","rolled_back","retired"] as const;
export const DECISION_STATES = ["proposed","current","superseded","revoked"] as const;
export const RULE_STATES = ["draft","current","superseded","revoked"] as const;
export const LINEAGE_STATES = ["recorded","verified","superseded","invalidated"] as const;
export const CHECKPOINT_STATES = ["recorded","verified","superseded","invalidated"] as const;
export const CONVERSATION_STATES = ["active","archived","superseded","merged"] as const;

export const P1_1_REQUIRED_LIFECYCLE_VOCABULARIES = Object.freeze({
  requirement: REQUIREMENT_STATES,
  project: PROJECT_STATES,
  module: MODULE_STATES,
  capability: CAPABILITY_STATES,
  command: COMMAND_STATES,
  event: EVENT_STATES,
  workflow: WORKFLOW_STATES,
  agencyRun: AGENCY_RUN_STATES,
  agencyJob: AGENCY_JOB_STATES,
  evidence: EVIDENCE_STATES,
  asset: ASSET_STATES,
  provider: PROVIDER_STATES,
  release: RELEASE_STATES,
  decision: DECISION_STATES,
  rule: RULE_STATES,
  lineage: LINEAGE_STATES
});

export type RequirementState = (typeof REQUIREMENT_STATES)[number];
export type ProjectState = (typeof PROJECT_STATES)[number];
export type ModuleState = (typeof MODULE_STATES)[number];
export type CapabilityState = (typeof CAPABILITY_STATES)[number];
export type CommandState = (typeof COMMAND_STATES)[number];
export type EventState = (typeof EVENT_STATES)[number];
export type WorkflowState = (typeof WORKFLOW_STATES)[number];
export type AgencyRunState = (typeof AGENCY_RUN_STATES)[number];
export type AgencyJobState = (typeof AGENCY_JOB_STATES)[number];
export type AgencyTaskState = (typeof AGENCY_TASK_STATES)[number];
export type EvidenceState = (typeof EVIDENCE_STATES)[number];
export type AssetState = (typeof ASSET_STATES)[number];
export type ProviderState = (typeof PROVIDER_STATES)[number];
export type ReleaseState = (typeof RELEASE_STATES)[number];
export type DecisionState = (typeof DECISION_STATES)[number];
export type RuleState = (typeof RULE_STATES)[number];
export type LineageState = (typeof LINEAGE_STATES)[number];
export type CheckpointState = (typeof CHECKPOINT_STATES)[number];
export type ConversationState = (typeof CONVERSATION_STATES)[number];

export function isState<T extends string>(value: string, vocabulary: readonly T[]): value is T {
  return (vocabulary as readonly string[]).includes(value);
}

export function assertState<T extends string>(value: string, vocabulary: readonly T[], label: string): T {
  if (!isState(value, vocabulary)) throw new Error(`Invalid ${label} state: ${value}`);
  return value;
}

export function validateLifecycleVocabularySchema(): true {
  const vocabularyVersion: number = LIFECYCLE_VOCABULARY_VERSION;
  if (!Number.isSafeInteger(vocabularyVersion) || vocabularyVersion < 1) throw new Error("Lifecycle vocabulary version must be a positive safe integer");
  for (const [label, vocabulary] of Object.entries(P1_1_REQUIRED_LIFECYCLE_VOCABULARIES)) {
    if (vocabulary.length === 0) throw new Error(`P1.1 lifecycle vocabulary is empty: ${label}`);
    if (new Set(vocabulary).size !== vocabulary.length) throw new Error(`P1.1 lifecycle vocabulary contains duplicates: ${label}`);
    if (vocabulary.some((state) => !state.trim())) throw new Error(`P1.1 lifecycle vocabulary contains a blank state: ${label}`);
  }
  return true;
}

validateLifecycleVocabularySchema();
