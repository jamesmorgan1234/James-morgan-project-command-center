import {immutable, invariant, nonblank, version, bounded, stringSet, timestamp, type AnalyticsScope, scoped, equalScope, canonicalAnalyticsJson, BENCHMARK_CLASSES} from "./contracts.js";
export type MetricTruth = "verified" | "calculated" | "estimated";
export type MissingSemantics = "unknown" | "not_applicable";

export interface MetricDefinition {
  readonly key: string;
  readonly version?: number;
  readonly semantics?: MetricSemantics;
  readonly domain: string;
  readonly owner: string;
  readonly sourceKind: string;
  readonly formulaRef: string | null;
  readonly freshnessMs: number;
  readonly truth: MetricTruth;
  readonly format: string;
  readonly zeroMeaning: string;
  readonly missingMeaning: MissingSemantics;
}

export interface MetricValue {
  readonly metricKey: string;
  readonly value: number | null;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
  readonly truth: MetricTruth;
}

export class MetricRegistry {
  readonly #definitions = new Map<string, MetricDefinition>();
  readonly #history = new Map<string, MetricDefinition[]>();
  register(definition: MetricDefinition): MetricDefinition {
    invariant(["verified","calculated","estimated"].includes(definition.truth)&&["unknown","not_applicable"].includes(definition.missingMeaning),"invalid_metric_truth_semantics");[definition.domain,definition.owner,definition.sourceKind,definition.format,definition.zeroMeaning].forEach(nonblank);
    nonblank(definition.key); bounded(definition.freshnessMs);
    if (definition.version !== undefined) version(definition.version);
    if (definition.semantics) validateMetricSemantics(definition.semantics);
    if (!definition.key.trim() || !definition.domain.trim() || !definition.owner.trim() || !definition.sourceKind.trim() || definition.freshnessMs < 0) throw new Error("metric semantic definition incomplete");
    if (this.#definitions.has(definition.key)) throw new Error("metric already registered");
    invariant(definition.version === undefined || definition.version === 1,"metric_initial_version_must_be_one");
    const frozen = immutable(definition);
    this.#definitions.set(definition.key, frozen);
    this.#history.set(definition.key,[frozen]);
    return frozen;
  }
  registerVersion(definition: MetricDefinition, expectedVersion: number): MetricDefinition {
    const current=this.get(definition.key);
    invariant((current.version??1)===expectedVersion&&definition.version===expectedVersion+1,"metric_version_conflict");
    invariant(current.domain===definition.domain&&current.owner===definition.owner,"metric_owner_domain_collision");
    invariant(definition.semantics,"versioned_metric_semantics_required");validateMetricSemantics(definition.semantics);invariant(definition.semantics.supersedesVersion===expectedVersion,"metric_supersession_mismatch");bounded(definition.freshnessMs);
    const frozen=immutable(definition);this.#definitions.set(definition.key,frozen);this.#history.set(definition.key,[...this.#history.get(definition.key)!,frozen]);return frozen;
  }
  get(key: string, exactVersion?: number): MetricDefinition {
    if(exactVersion!==undefined){const found=this.#history.get(key)?.find(d=>(d.version??1)===exactVersion);invariant(found,"unknown_metric_version");return found;}
    const definition = this.#definitions.get(key);
    if (!definition) throw new Error(`unknown metric: ${key}`);
    return definition;
  }
  list(): readonly MetricDefinition[] { return Object.freeze([...this.#definitions.values()]); }
}

export function validateMetricValue(registry: MetricRegistry, value: MetricValue, nowMs: number): MetricValue {
  const definition = registry.get(value.metricKey);
  if (!value.observedAt.includes("T") || value.sourceRefs.length === 0) throw new Error("metric value requires freshness and provenance");
  if (value.value !== null && !Number.isFinite(value.value)) throw new Error("metric value must be finite or explicit missing");
  if (value.truth === "estimated" && definition.truth === "verified") throw new Error("estimated value cannot populate verified-only metric");
  const age = nowMs - Date.parse(value.observedAt);
  if (!Number.isFinite(age) || age < 0 || age > definition.freshnessMs) throw new Error("metric value is stale or invalid");
  return Object.freeze({ ...value, sourceRefs: Object.freeze([...value.sourceRefs]) });
}

export interface MetricSemantics {
 readonly definition:string;readonly applicabilityScopeKeys:readonly string[];readonly unit:string;readonly dataType:'integer'|'number';
 readonly aggregation:'sum'|'mean'|'last'|'ratio'|'count';readonly direction:'higher'|'lower'|'neutral';
 readonly min:number|null;readonly max:number|null;readonly numeratorRef:string|null;readonly denominatorRef:string|null;
 readonly windowMs:number;readonly timeBasis:'event_time';readonly eventTimeField:string;readonly processingTimeField:string;
 readonly calibration:'not_applicable'|'probability';readonly privacy:'project_private';readonly causalLimitation:'correlational';
 readonly dependencyVersionRefs:readonly string[];readonly lifecycle:'active'|'deprecated';readonly supersedesVersion:number|null;
 readonly validationState:'verified';readonly metricClass:string;
}
export type ObservationState='known'|'unknown'|'not_applicable'|'absent'|'deleted'|'stale'|'conflicting';
export interface SemanticMetricObservation {
 readonly id:string;readonly metricKey:string;readonly metricVersion:number;readonly scope:AnalyticsScope;
 readonly unit:string;readonly windowStart:string;readonly windowEnd:string;readonly occurredAt:string;readonly receivedAt:string;
 readonly state:ObservationState;readonly value:number|null;readonly truth:MetricTruth;
 readonly uncertainty:number|null;readonly confidence:number|null;readonly evidenceIds:readonly string[];
 readonly benchmarkClass:import('./contracts.js').BenchmarkClass;
}
export function validateMetricSemantics(s:MetricSemantics):void {
 [s.definition,s.unit,s.eventTimeField,s.processingTimeField,s.metricClass].forEach(nonblank);
 invariant(['not_applicable','probability'].includes(s.calibration),'invalid_calibration_semantics');
 invariant(['integer','number'].includes(s.dataType)&&['sum','mean','last','ratio','count'].includes(s.aggregation)&&['higher','lower','neutral'].includes(s.direction),'invalid_metric_semantics');
 invariant(s.timeBasis==='event_time'&&s.privacy==='project_private'&&s.causalLimitation==='correlational'&&s.validationState==='verified'&&['active','deprecated'].includes(s.lifecycle),'invalid_metric_contract');
 stringSet(s.applicabilityScopeKeys,true);bounded(s.windowMs,1);stringSet(s.dependencyVersionRefs,true);
 if(s.min!==null)bounded(s.min,-Infinity);if(s.max!==null)bounded(s.max,-Infinity);invariant(s.min===null||s.max===null||s.min<=s.max,'invalid_metric_range');
 invariant(s.aggregation!=='ratio'||(s.numeratorRef&&s.denominatorRef),'ratio_requires_declared_operands');
 if(s.supersedesVersion!==null)version(s.supersedesVersion);
}
export function validateSemanticObservation(registry:MetricRegistry,o:SemanticMetricObservation,now:string,historical=false):SemanticMetricObservation {
 scoped(o.scope);nonblank(o.id);invariant(BENCHMARK_CLASSES.includes(o.benchmarkClass),"invalid_benchmark_class");
 const d=registry.get(o.metricKey,o.metricVersion),s=d.semantics;invariant(s,'canonical_metric_semantics_required');
 invariant(historical||((registry.get(o.metricKey).version??1)===o.metricVersion&&s.lifecycle==='active'),'metric_not_current');
 invariant(o.unit===s.unit,'incompatible_metric_unit');invariant(s.applicabilityScopeKeys.some(k=>['global',`company:${o.scope.companyId}`,`project:${o.scope.projectId}`,`brain:${o.scope.brainId}`].includes(k)),'metric_applicability_mismatch');
 const start=timestamp(o.windowStart),end=timestamp(o.windowEnd),at=timestamp(o.occurredAt),received=timestamp(o.receivedAt),current=timestamp(now);
 invariant(end-start===s.windowMs&&at>=start&&at<=end&&received>=at&&received<=current&&at<=current,'invalid_metric_window_time');
 invariant(['known','unknown','not_applicable','absent','deleted','stale','conflicting'].includes(o.state),'invalid_metric_truth_state');
 invariant(o.state==='known'?o.value!==null:o.value===null,'ambiguous_metric_truth');
 if(o.value!==null){bounded(o.value,s.min??-Infinity,s.max??Infinity);if(s.dataType==='integer')invariant(Number.isSafeInteger(o.value),'metric_requires_integer');}
 if(o.confidence!==null)bounded(o.confidence,0,1);if(o.uncertainty!==null)bounded(o.uncertainty,0,1);
 invariant(['verified','calculated','estimated'].includes(o.truth)&&!(d.truth==='verified'&&o.truth!=='verified'),'metric_truth_strength_mismatch');
 invariant(historical||current-at<=d.freshnessMs,'stale_metric_observation');
 stringSet(o.evidenceIds,true);return immutable(o);
}
export function aggregateSemanticObservations(registry:MetricRegistry,observations:readonly SemanticMetricObservation[],now:string,historical=false){
 invariant(observations.length>0,'metric_observations_required');const first=observations[0]!,d=registry.get(first.metricKey,first.metricVersion),s=d.semantics!;
 const byId=new Map<string,SemanticMetricObservation>();
 for(const o of observations){validateSemanticObservation(registry,o,now,historical);invariant(o.metricKey===first.metricKey&&o.metricVersion===first.metricVersion&&o.unit===first.unit&&o.windowStart===first.windowStart&&o.windowEnd===first.windowEnd&&equalScope(o.scope,first.scope)&&o.benchmarkClass===first.benchmarkClass,'incompatible_metric_aggregation');const prior=byId.get(o.id);invariant(!prior||canonicalAnalyticsJson(prior)===canonicalAnalyticsJson(o),'metric_event_collision');byId.set(o.id,o);}
 const values=[...byId.values()];if(values.some(o=>o.state!=='known'))return immutable({value:null,state:'unknown' as const,truth:'calculated' as const,reason:'incomplete_or_conflicting_input',evidenceIds:values.flatMap(o=>o.evidenceIds)});
 invariant(s.aggregation!=='ratio','ratio_requires_explicit_numerator_denominator');
 const ordered=values.sort((a,b)=>timestamp(a.occurredAt)-timestamp(b.occurredAt)||a.id.localeCompare(b.id));
 const sum=ordered.reduce((total,o)=>total+o.value!,0);
 const value=s.aggregation==='count'?ordered.length:s.aggregation==='last'?ordered.at(-1)!.value!:s.aggregation==='mean'?sum/ordered.length:sum;
 bounded(value,-Infinity);return immutable({value,state:'known' as const,truth:'calculated' as const,reason:historical?'historical_recalculation':'declared_formula',evidenceIds:[...new Set(values.flatMap(o=>o.evidenceIds))].sort()});
}
export function semanticRatio(numerator:number|null,denominator:number|null){if(numerator===null||denominator===null||denominator===0)return {state:'unknown' as const,value:null};bounded(numerator);bounded(denominator);return {state:'known' as const,value:numerator/denominator};}
export function semanticMetricView(registry:MetricRegistry,observation:SemanticMetricObservation,now:string){const d=registry.get(observation.metricKey,observation.metricVersion);validateSemanticObservation(registry,observation,now,true);let current=true;try{validateSemanticObservation(registry,observation,now);}catch{current=false;}return immutable({metricKey:d.key,version:observation.metricVersion,meaning:d.semantics!.definition,unit:d.semantics!.unit,sourceEvidenceIds:observation.evidenceIds,observedAt:observation.occurredAt,freshnessMs:d.freshnessMs,temporalState:current?'current':'historical',state:current?observation.state:'stale',value:current?observation.value:null,historicalValue:current?null:observation.value,truth:observation.truth});}
