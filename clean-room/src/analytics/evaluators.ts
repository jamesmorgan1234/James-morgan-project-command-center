export type EvaluationEvidenceClass = "synthetic" | "replay" | "staging" | "simulation" | "shadow" | "canary" | "production" | "external" | "owner_verified";
export type EvaluationDecision = "better" | "worse" | "equivalent" | "insufficient_evidence";
export type OutcomeTruth = "observed" | "verified" | "calculated" | "synthetic";

export interface EvaluatorDefinition {
  readonly key: string;
  readonly version: number;
  readonly ownerRef: string;
  readonly purpose: string;
  readonly biasRisks: readonly string[];
  readonly requiredDataClasses: readonly string[];
  readonly prohibitedDataClasses: readonly string[];
  readonly applicableDomains: readonly string[];
  readonly applicableTaskClasses: readonly string[];
  readonly minimumEvidenceClasses: readonly EvaluationEvidenceClass[];
  readonly repeatCount: number;
  readonly minimumSampleCount: number;
  readonly minimumConfidence: number;
  readonly acceptanceAuthority: "command_center" | "owner";
  readonly calibrationEvidenceRefs: readonly string[];
  readonly active: boolean;
  readonly protocol?: EvaluatorProtocol;
}

export interface DecisionTimeSnapshot {
  readonly capturedAt: string;
  readonly candidateRef: string;
  readonly baselineRef: string;
  readonly evaluatorKey: string;
  readonly evaluatorVersion: number;
  readonly inputFingerprint: string;
  readonly environmentFingerprint: string;
  readonly constraintRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
}

export interface EvaluationObservation {
  readonly runRef: string;
  readonly evidenceClass: EvaluationEvidenceClass;
  readonly sampleCount: number;
  readonly repeatIndex: number;
  readonly baselineScore: number;
  readonly candidateScore: number;
  readonly confidence: number;
  readonly sourceRefs: readonly string[];
  readonly synthetic: boolean;
}

export interface EvaluationResult {
  readonly evaluatorKey: string;
  readonly evaluatorVersion: number;
  readonly decision: EvaluationDecision;
  readonly calibratedConfidence: number;
  readonly meanDelta: number;
  readonly eligibleProductionEvidence: boolean;
  readonly acceptanceEligible: boolean;
  readonly evidenceClasses: readonly EvaluationEvidenceClass[];
  readonly evidenceRefs: readonly string[];
  readonly reasonCodes: readonly string[];
}

export interface ActualOutcomeRecord {
  readonly id: string;
  readonly evaluationRunRef: string;
  readonly candidateRef: string;
  readonly observedAt: string;
  readonly truth: OutcomeTruth;
  readonly metricKey: string;
  readonly value: number;
  readonly sourceRefs: readonly string[];
  readonly confounders: readonly string[];
  readonly causalAttribution: "none" | "possible" | "supported";
}

function score(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${label} must be between 0 and 1`);
}
function unique(values: readonly string[], label: string, requireOne = false): void {
  if (requireOne && values.length === 0) throw new Error(`${label} requires at least one value`);
  if (values.some((value) => !value.trim()) || new Set(values).size !== values.length) throw new Error(`${label} must be unique and nonblank`);
}
function ts(value: string, label: string): void { if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} must be a valid timestamp`); }

export function validateEvaluator(definition: EvaluatorDefinition): EvaluatorDefinition {
  if (!definition.key.startsWith("evaluator:") || !definition.ownerRef.trim() || !definition.purpose.trim()) throw new Error("Evaluator identity/owner/purpose are required");
  if (!Number.isInteger(definition.version) || definition.version < 1) throw new Error("Evaluator version must be positive");
  if (!Number.isInteger(definition.repeatCount) || definition.repeatCount < 1 || !Number.isInteger(definition.minimumSampleCount) || definition.minimumSampleCount < 1) throw new Error("Evaluator repeat/sample bounds must be positive integers");
  score(definition.minimumConfidence, "Evaluator minimum confidence");
  unique(definition.biasRisks, "Evaluator bias risks", true); unique(definition.requiredDataClasses, "Evaluator required data"); unique(definition.prohibitedDataClasses, "Evaluator prohibited data");
  unique(definition.applicableDomains, "Evaluator domains", true); unique(definition.applicableTaskClasses, "Evaluator task classes", true); unique(definition.calibrationEvidenceRefs, "Evaluator calibration evidence", true);
  if (definition.protocol) validateEvaluatorProtocol(definition.protocol);
  if (definition.minimumEvidenceClasses.some(c=>!["synthetic","replay","simulation","shadow","canary","staging","production","external","owner_verified"].includes(c))) throw new Error("Unknown evaluator benchmark class");
  if (definition.minimumEvidenceClasses.length === 0) throw new Error("Evaluator minimum evidence classes are required");
  return immutable({ ...definition, ...(definition.protocol?{protocol:structuredClone(definition.protocol)}:{}), biasRisks: Object.freeze([...definition.biasRisks]), requiredDataClasses: Object.freeze([...definition.requiredDataClasses]), prohibitedDataClasses: Object.freeze([...definition.prohibitedDataClasses]), applicableDomains: Object.freeze([...definition.applicableDomains]), applicableTaskClasses: Object.freeze([...definition.applicableTaskClasses]), minimumEvidenceClasses: Object.freeze([...definition.minimumEvidenceClasses]), calibrationEvidenceRefs: Object.freeze([...definition.calibrationEvidenceRefs]) });
}

export class EvaluatorRegistry {
  readonly #versions = new Map<string, EvaluatorDefinition[]>();
  register(definition: EvaluatorDefinition): EvaluatorDefinition {
    const valid = validateEvaluator(definition); const history = this.#versions.get(valid.key) ?? []; const latest = history.at(-1);
    if (latest && valid.version <= latest.version) throw new Error("Evaluator version must advance");
    this.#versions.set(valid.key, [...history, valid]); return valid;
  }
  get(key: string, version?: number): EvaluatorDefinition | undefined {
    const history = this.#versions.get(key) ?? []; return version === undefined ? history.at(-1) : history.find((item) => item.version === version);
  }
}

export function evaluateCandidate(definition: EvaluatorDefinition, snapshot: DecisionTimeSnapshot, observations: readonly EvaluationObservation[], context: { domain: string; taskClass: string; candidateOwnerRef: string; calibrationScore: number }): EvaluationResult {
  validateEvaluator(definition); score(context.calibrationScore, "Evaluator calibration score"); ts(snapshot.capturedAt, "Decision snapshot time");
  if (!snapshot.candidateRef.trim() || !snapshot.baselineRef.trim() || !snapshot.inputFingerprint.trim() || !snapshot.environmentFingerprint.trim()) throw new Error("Decision snapshot candidate/baseline/input/environment identity is required");
  unique(snapshot.constraintRefs, "Decision snapshot constraints");
  unique(snapshot.evidenceRefs, "Decision snapshot evidence", true);
  if (snapshot.evaluatorKey !== definition.key || snapshot.evaluatorVersion !== definition.version) throw new Error("Decision snapshot must pin exact evaluator version");
  if (new Set(observations.map(o=>o.runRef)).size!==observations.length || new Set(observations.map(o=>o.repeatIndex)).size!==observations.length) throw new Error("Duplicate evaluator run/repeat");
  for(const o of observations){
    if(!Number.isSafeInteger(o.sampleCount)||o.sampleCount<1||!Number.isSafeInteger(o.repeatIndex)||o.repeatIndex<1||!Number.isFinite(o.baselineScore)||!Number.isFinite(o.candidateScore)) throw new Error("Invalid evaluator observation");
    score(o.confidence,"Observation confidence");unique(o.sourceRefs,"Observation sources",true);
    if(!["synthetic","replay","simulation","shadow","canary","staging","production","external","owner_verified"].includes(o.evidenceClass))throw new Error("Unknown observation benchmark class");
    if(o.synthetic&&["production","external","owner_verified"].includes(o.evidenceClass))throw new Error("Synthetic observation cannot claim production class");
  }
  const reasons: string[] = [];
  if (!definition.active) reasons.push("evaluator_inactive");
  if (!definition.applicableDomains.includes(context.domain)) reasons.push("domain_out_of_scope");
  if (!definition.applicableTaskClasses.includes(context.taskClass)) reasons.push("task_out_of_scope");
  if (observations.length < definition.repeatCount) reasons.push("repeatability_not_met");
  const totalSamples = observations.reduce((sum, item) => sum + item.sampleCount, 0); if (totalSamples < definition.minimumSampleCount) reasons.push("sample_count_not_met");
  const observedClasses = [...new Set(observations.map((item) => item.evidenceClass))];
  if(observedClasses.length>1)reasons.push("benchmark_classes_require_separate_results");
  if (!definition.minimumEvidenceClasses.every((required) => observedClasses.includes(required))) reasons.push("required_evidence_class_missing");
  const productionEvidence = observations.some((item) => !item.synthetic && (item.evidenceClass === "production" || item.evidenceClass === "external" || item.evidenceClass === "owner_verified"));
  if (!productionEvidence) reasons.push("no_production_grade_outcome_evidence");
  const allSources = observations.flatMap((item) => item.sourceRefs); if (allSources.length === 0 || allSources.some((source) => !source.trim())) reasons.push("provenance_missing");
  const evidenceRefs = Object.freeze([...new Set([...definition.calibrationEvidenceRefs, ...snapshot.evidenceRefs, ...allSources])].sort());
  const meanDelta = observations.length === 0 ? 0 : observations.reduce((sum, item) => sum + (item.candidateScore - item.baselineScore), 0) / observations.length;
  const rawConfidence = observations.length === 0 ? 0 : observations.reduce((sum, item) => sum + item.confidence, 0) / observations.length;
  const calibratedConfidence = rawConfidence * context.calibrationScore;
  if (calibratedConfidence < definition.minimumConfidence) reasons.push("confidence_below_threshold");
  const selfEvaluator = definition.ownerRef === context.candidateOwnerRef; if (selfEvaluator) reasons.push("self_evaluator_cannot_control_acceptance");
  const evidenceSufficient = reasons.filter((reason) => reason !== "self_evaluator_cannot_control_acceptance").length === 0;
  const decision: EvaluationDecision = !evidenceSufficient ? "insufficient_evidence" : Math.abs(meanDelta) < 1e-9 ? "equivalent" : meanDelta > 0 ? "better" : "worse";
  return Object.freeze({ evaluatorKey: definition.key, evaluatorVersion: definition.version, decision, calibratedConfidence, meanDelta, eligibleProductionEvidence: productionEvidence, acceptanceEligible: evidenceSufficient && !selfEvaluator, evidenceClasses: Object.freeze(observedClasses), evidenceRefs, reasonCodes: Object.freeze(reasons.length ? reasons : ["eligible_evidence_and_bounds_satisfied"]) });
}

export function validateActualOutcome(outcome: ActualOutcomeRecord): ActualOutcomeRecord {
  invariant(["observed","verified","calculated","synthetic"].includes(outcome.truth)&&["none","possible","supported"].includes(outcome.causalAttribution),"invalid_outcome_truth");
  if (!outcome.id.trim() || !outcome.evaluationRunRef.trim() || !outcome.candidateRef.trim() || !outcome.metricKey.trim()) throw new Error("Outcome identity/run/candidate/metric are required");
  ts(outcome.observedAt, "Outcome observedAt"); if (!Number.isFinite(outcome.value)) throw new Error("Outcome value must be finite"); unique(outcome.sourceRefs, "Outcome sources", true); unique(outcome.confounders, "Outcome confounders");
  if (outcome.truth === "synthetic" && outcome.causalAttribution !== "none") throw new Error("Synthetic result cannot claim causal production outcome");
  if (outcome.causalAttribution === "supported" && (outcome.truth !== "verified" || outcome.confounders.length > 0)) throw new Error("Supported causality requires verified outcome with resolved confounders");
  return Object.freeze({ ...outcome, sourceRefs: Object.freeze([...outcome.sourceRefs]), confounders: Object.freeze([...outcome.confounders]) });
}

import {authorizeAnalytics,analyticsEvidence,immutable,invariant,timestamp,version as contractVersion,canonicalAnalyticsJson,type AnalyticsScope,type AnalyticsAccess} from './contracts.js';
export interface EvaluatorProtocol {readonly targetRef:string;readonly criterionRef:string;readonly benchmarkRef:string;readonly benchmarkVersion:number;readonly environment:string;readonly minimumDelta:number;readonly maximumDelta:number;readonly invalidationTriggers:readonly string[];readonly revalidateAfter:string}
function validateEvaluatorProtocol(p:EvaluatorProtocol):void {contractVersion(p.benchmarkVersion);invariant(p.targetRef.trim()&&p.criterionRef.trim()&&p.benchmarkRef.trim()&&p.environment.trim()&&Number.isFinite(p.minimumDelta)&&Number.isFinite(p.maximumDelta)&&p.minimumDelta<=p.maximumDelta&&p.invalidationTriggers.length>0,'invalid_evaluator_protocol');timestamp(p.revalidateAfter);}
export function scopedEvaluation(access:AnalyticsAccess,scope:AnalyticsScope,registry:EvaluatorRegistry,key:string,version:number,snapshot:DecisionTimeSnapshot,observations:readonly EvaluationObservation[],context:{domain:string;taskClass:string;dataClasses:readonly string[];candidateOwnerRef:string;calibrationScore:number;environment:string;benchmarkRef:string;benchmarkVersion:number;invalidated:boolean}){
 authorizeAnalytics(access,'read',scope,key);const definition=registry.get(key,version);invariant(definition&&registry.get(key)?.version===version&&definition.protocol,'current_protocol_evaluator_required');const p=definition.protocol;
 invariant(!context.invalidated&&timestamp(p.revalidateAfter)>timestamp(access.now())&&timestamp(snapshot.capturedAt)<=timestamp(access.now()),'evaluator_stale_invalidated_or_future');
 invariant(p.environment===context.environment&&p.benchmarkRef===context.benchmarkRef&&p.benchmarkVersion===context.benchmarkVersion&&p.targetRef===snapshot.candidateRef,'evaluator_benchmark_target_mismatch');
 analyticsEvidence(access,scope,[...new Set([...definition.calibrationEvidenceRefs,...snapshot.evidenceRefs,...observations.flatMap(o=>o.sourceRefs)])]);
 invariant(definition.requiredDataClasses.every(c=>context.dataClasses.includes(c))&&!definition.prohibitedDataClasses.some(c=>context.dataClasses.includes(c)),"evaluator_data_class_boundary");
 const result=evaluateCandidate(definition,snapshot,observations,context);const withinBounds=result.meanDelta>=p.minimumDelta&&result.meanDelta<=p.maximumDelta;
 return immutable({...result,sampleCount:observations.reduce((n,o)=>n+o.sampleCount,0),meanDelta:observations.length&&result.evidenceClasses.length===1?result.meanDelta:null,reasonCodes:withinBounds?result.reasonCodes:[...result.reasonCodes,"benchmark_bounds_not_met"],benchmarkRef:p.benchmarkRef,benchmarkVersion:p.benchmarkVersion,environment:p.environment,productionObserved:observations.some(o=>o.evidenceClass==='production'&&!o.synthetic),acceptanceEligible:result.acceptanceEligible&&withinBounds,requiresRecalibration:context.calibrationScore<definition.minimumConfidence,authorizationGranted:false});
}
export interface EvaluatorStore {append(scope:AnalyticsScope,definition:EvaluatorDefinition,evidenceIds:readonly string[],expectedVersion:number|null):Promise<EvaluatorDefinition>}
export async function registerDurableEvaluator(access:AnalyticsAccess,registry:EvaluatorRegistry,store:EvaluatorStore,scope:AnalyticsScope,definition:EvaluatorDefinition,evidenceIds:readonly string[]):Promise<EvaluatorDefinition>{
 const {metadataOnly}=await import('./storage.js');metadataOnly(definition);
 authorizeAnalytics(access,'record',scope,definition.key);const d=validateEvaluator(definition),current=registry.get(d.key);invariant(d.protocol&&d.version===(current?current.version+1:1),'evaluator_registration_version_protocol_required');analyticsEvidence(access,scope,evidenceIds);
 const {analyticsDigest}=await import('./contracts.js');const digest=await analyticsDigest({id:d.key,version:d.version,scope,kind:'evaluator',definition:d});invariant(evidenceIds.some(id=>access.evidence(id)?.record.subjectId===d.key&&access.evidence(id)?.record.configDigest===digest),'evaluator_source_receipt_digest_mismatch');
 authorizeAnalytics(access,'record',scope,d.key);const stored=await store.append(scope,d,evidenceIds,current?.version??null);invariant(canonicalAnalyticsJson(stored)===canonicalAnalyticsJson(d),'evaluator_store_contract_conflict');registry.register(stored);return stored;
}
