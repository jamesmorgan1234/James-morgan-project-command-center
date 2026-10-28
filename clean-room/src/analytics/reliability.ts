export interface ReliabilitySignal {
  readonly domain: string;
  readonly kind: "availability" | "latency" | "error_rate" | "queue_depth" | "retry_rate" | "provider_health" | "resource_saturation" | "cache_health" | "update_health";
  readonly severity: "ok" | "warning" | "critical";
  readonly value: number;
  readonly sourceRefs: readonly string[];
}

export function identifyReliabilityBottleneck(signals: readonly ReliabilitySignal[]): Readonly<{ domain: string; severity: "warning" | "critical"; reasons: readonly string[] }> | null {
  const ranked = signals.filter((signal) => signal.severity !== "ok");
  if (ranked.length === 0) return null;
  const byDomain = new Map<string, ReliabilitySignal[]>();
  for (const signal of ranked) byDomain.set(signal.domain, [...(byDomain.get(signal.domain) ?? []), signal]);
  const candidates = [...byDomain.entries()].map(([domain, domainSignals]) => ({ domain, domainSignals, score: domainSignals.reduce((sum, signal) => sum + (signal.severity === "critical" ? 2 : 1), 0) })).sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain));
  const top = candidates[0];
  if (!top) return null;
  return Object.freeze({ domain: top.domain, severity: top.domainSignals.some((signal) => signal.severity === "critical") ? "critical" : "warning", reasons: Object.freeze(top.domainSignals.map((signal) => signal.kind)) });
}

import {authorizeAnalytics,analyticsEvidence,immutable,invariant,bounded,timestamp,equalScope,type AnalyticsAccess,type AnalyticsScope} from './contracts.js';
export interface ObservedReliabilitySignal extends Omit<ReliabilitySignal,'value'> {readonly value:number|null;readonly scope:AnalyticsScope;readonly observedAt:string;readonly freshnessMs:number;readonly truth:'observed'|'estimated'|'unknown';readonly dependencyVersionRef:string;readonly sloCandidateRef:string|null;readonly revalidateAfter:string}
export function scopedReliability(access:AnalyticsAccess,scope:AnalyticsScope,signals:readonly ObservedReliabilitySignal[]){
 authorizeAnalytics(access,'read',scope,'reliability');const current:ObservedReliabilitySignal[]=[],unknown:string[]=[];
 for(const s of signals){invariant(['observed','estimated','unknown'].includes(s.truth)&&(s.truth==='unknown')===(s.value===null),'ambiguous_reliability_truth');invariant(equalScope(s.scope,scope),'reliability_scope_mismatch');bounded(s.freshnessMs);invariant(s.dependencyVersionRef.trim(),'dependency_version_required');if(s.truth==='unknown'||s.value===null||timestamp(access.now())-timestamp(s.observedAt)>s.freshnessMs||timestamp(s.revalidateAfter)<=timestamp(access.now())){unknown.push(s.domain+':'+s.kind);continue;}invariant(timestamp(s.observedAt)<=timestamp(access.now()),'future_reliability_signal');bounded(s.value);analyticsEvidence(access,scope,s.sourceRefs);current.push(s);}
 return immutable({observed:current.filter(s=>s.truth==='observed'),inferred:current.filter(s=>s.truth==='estimated'),unknown:unknown.sort(),bottleneck:identifyReliabilityBottleneck(current.filter(s=>s.truth==='observed').map(s=>({...s,value:s.value!}))),authorizationGranted:false});
}
export const ECOSYSTEM_HEALTH_SIGNALS=['calibration_drift','contradiction_growth','stale_memory_rate','evaluator_coverage','routing_regret','fallback_rate','verifier_rejection_rate','repeated_failure_count','overconfidence','cross_specialist_disagreement','transfer_success_rate','quarantine_backlog','architecture_drift','negative_knowledge_recurrence'] as const;
export function ecosystemHealth(access:AnalyticsAccess,scope:AnalyticsScope,inputs:readonly {key:typeof ECOSYSTEM_HEALTH_SIGNALS[number];numerator:number|null;denominator:number|null;observedAt:string;freshnessMs:number;evidenceIds:readonly string[]}[]){
 authorizeAnalytics(access,'read',scope,'ecosystem-health');invariant(new Set(inputs.map(i=>i.key)).size===inputs.length,'duplicate_health_metric');const values:Record<string,{value:number|null;state:'known'|'unknown';evidenceIds:readonly string[]}>={};
 for(const key of ECOSYSTEM_HEALTH_SIGNALS){const i=inputs.find(i=>i.key===key);if(!i||i.numerator===null||timestamp(access.now())-timestamp(i.observedAt)>i.freshnessMs){values[key]={value:null,state:'unknown',evidenceIds:[]};continue;}bounded(i.numerator);bounded(i.freshnessMs);invariant(timestamp(i.observedAt)<=timestamp(access.now()),'future_health_evidence');analyticsEvidence(access,scope,i.evidenceIds);const count=['contradiction_growth','repeated_failure_count','quarantine_backlog','architecture_drift','negative_knowledge_recurrence'].includes(key);if(!count&&(i.denominator===null||i.denominator===0)){values[key]={value:null,state:'unknown',evidenceIds:i.evidenceIds};continue;}if(i.denominator!==null)bounded(i.denominator);values[key]={value:count?i.numerator:i.numerator/i.denominator!,state:'known',evidenceIds:i.evidenceIds};}
 return immutable({scope,values,authorizationGranted:false});
}
import {MetricRegistry,type MetricDefinition} from './metrics.js';
/** Static semantics only. No health observation is minted by registering these definitions. */
export function registerEcosystemHealthMetrics(registry:MetricRegistry):readonly MetricDefinition[]{return ECOSYSTEM_HEALTH_SIGNALS.map(key=>{
 const count=['contradiction_growth','repeated_failure_count','quarantine_backlog','architecture_drift','negative_knowledge_recurrence'].includes(key),unit=count?'events':key==='routing_regret'?'utility':key==='calibration_drift'||key==='overconfidence'?'probability_delta':'ratio';
 const d:MetricDefinition={key:'metric:health-'+key,version:1,domain:'ecosystem',owner:'command_center',sourceKind:'canonical_evidence',formulaRef:'formula:'+key+'-v1',freshnessMs:60000,truth:'calculated',format:unit,zeroMeaning:'Evidence-backed observed zero; never missing data',missingMeaning:'unknown',semantics:{definition:key.replaceAll('_',' ')+' from scoped, versioned evidence; not an authorization signal',applicabilityScopeKeys:['global'],unit,dataType:count?'integer':'number',aggregation:'last',direction:key==='evaluator_coverage'||key==='transfer_success_rate'?'higher':'lower',min:key==='contradiction_growth'||key==='calibration_drift'?null:0,max:unit==='ratio'?1:null,numeratorRef:null,denominatorRef:null,windowMs:3600000,timeBasis:'event_time',eventTimeField:'occurredAt',processingTimeField:'receivedAt',calibration:'not_applicable',privacy:'project_private',causalLimitation:'correlational',dependencyVersionRefs:['amendment20:38@1'],lifecycle:'active',supersedesVersion:null,validationState:'verified',metricClass:'ecosystem_health'}};
 const existing=registry.list().find(x=>x.key===d.key);if(existing){invariant(JSON.stringify(existing)===JSON.stringify(d),'ecosystem_metric_semantic_collision');return existing;}return registry.register(d);
});}
