export interface AgencyAnalyticsSample {
  readonly projectId: string;
  readonly workerId: string;
  readonly claimLatencyMs: number;
  readonly leaseLosses: number;
  readonly staleWriteBlocks: number;
  readonly conflicts: number;
  readonly verifierRejects: number;
  readonly steals: number;
  readonly queueDepth: number;
  readonly resourceUnits: number;
  readonly sensitiveTaskContentIncluded: boolean;
}

export function summarizeAgency(samples: readonly AgencyAnalyticsSample[]): Readonly<{ workers: number; averageClaimLatencyMs: number; leaseLosses: number; staleWriteBlocks: number; conflicts: number; verifierRejects: number; queueDepth: number; resourceUnits: number }> {
  if (samples.some((sample) => sample.sensitiveTaskContentIncluded)) throw new Error("Agency analytics must not expose sensitive task content");
  if (samples.length === 0) return Object.freeze({ workers: 0, averageClaimLatencyMs: 0, leaseLosses: 0, staleWriteBlocks: 0, conflicts: 0, verifierRejects: 0, queueDepth: 0, resourceUnits: 0 });
  return Object.freeze({
    workers: new Set(samples.map((sample) => sample.workerId)).size,
    averageClaimLatencyMs: samples.reduce((sum, sample) => sum + sample.claimLatencyMs, 0) / samples.length,
    leaseLosses: samples.reduce((sum, sample) => sum + sample.leaseLosses, 0),
    staleWriteBlocks: samples.reduce((sum, sample) => sum + sample.staleWriteBlocks, 0),
    conflicts: samples.reduce((sum, sample) => sum + sample.conflicts, 0),
    verifierRejects: samples.reduce((sum, sample) => sum + sample.verifierRejects, 0),
    queueDepth: samples.reduce((sum, sample) => sum + sample.queueDepth, 0),
    resourceUnits: samples.reduce((sum, sample) => sum + sample.resourceUnits, 0)
  });
}

import {authorizeAnalytics,analyticsEvidence,immutable,invariant,bounded,timestamp,equalScope,canonicalAnalyticsJson,type AnalyticsAccess,type AnalyticsScope,type BenchmarkClass} from './contracts.js';
import type {DecisionTimeSnapshot} from './evaluators.js';
export interface AgencyTelemetry extends AgencyAnalyticsSample {readonly id:string;readonly benchmarkClass:BenchmarkClass;readonly workerState?:"working"|"idle"|"degraded"|"unknown";readonly leadState?:"working"|"idle"|"degraded"|"unknown";readonly freshnessMs?:number;readonly scope:AnalyticsScope;readonly queueId:string;readonly leadId:string;readonly observedAt:string;readonly evidenceIds:readonly string[];readonly queueAgeMs:number;readonly utilization:number;readonly taskDurationMs:number;readonly retries:number;readonly fairWaitRounds:number;readonly backpressure:boolean;readonly failovers:number;readonly budgetCents:number|null}
export function scopedAgencyAnalytics(access:AnalyticsAccess,scope:AnalyticsScope,samples:readonly AgencyTelemetry[]){
 authorizeAnalytics(access,'read',scope,'agency');const ids=new Map<string,AgencyTelemetry>(),workers=new Map<string,AgencyTelemetry>(),queues=new Map<string,AgencyTelemetry>();
 for(const s of samples){invariant(equalScope(s.scope,scope)&&s.projectId===scope.projectId,'agency_scope_mismatch');analyticsEvidence(access,scope,s.evidenceIds);invariant(timestamp(s.observedAt)<=timestamp(access.now()),'future_agency_sample');invariant(!s.sensitiveTaskContentIncluded,'Agency analytics must not expose sensitive task content');if(timestamp(access.now())-timestamp(s.observedAt)>(s.freshnessMs??60000))continue;for(const n of [s.claimLatencyMs,s.leaseLosses,s.staleWriteBlocks,s.conflicts,s.verifierRejects,s.steals,s.queueDepth,s.resourceUnits,s.queueAgeMs,s.taskDurationMs,s.retries,s.fairWaitRounds,s.failovers])bounded(n);bounded(s.utilization,0,1);if(s.budgetCents!==null)bounded(s.budgetCents);const prior=ids.get(s.id);invariant(!prior||canonicalAnalyticsJson(prior)===canonicalAnalyticsJson(s),'agency_sample_collision');if(prior)continue;ids.set(s.id,s);for(const [map,key] of [[workers,s.workerId],[queues,s.queueId]] as const){const old=map.get(key);if(!old||timestamp(old.observedAt)<timestamp(s.observedAt))map.set(key,s);else if(timestamp(old.observedAt)===timestamp(s.observedAt))invariant(map!==queues||old.queueDepth===s.queueDepth&&old.queueAgeMs===s.queueAgeMs,'conflicting_queue_snapshots');}}
 if(!workers.size)return immutable({state:'unknown',queueDepth:null,workers:null,authorizationGranted:false});
 invariant(new Set(samples.map(s=>s.benchmarkClass)).size===1,'agency_benchmark_mixing');
 const result=summarizeAgency([...workers.values()]);return immutable({...result,state:'observed',benchmarkClass:samples[0]!.benchmarkClass,workerStates:Object.fromEntries([...workers].map(([id,s])=>[id,s.workerState??'unknown'])),leadStates:Object.fromEntries([...workers.values()].map(s=>[s.leadId,s.leadState??'unknown'])),steals:[...workers.values()].reduce((n,s)=>n+s.steals,0),failovers:[...workers.values()].reduce((n,s)=>n+s.failovers,0),meanTaskDurationMs:[...workers.values()].reduce((n,s)=>n+s.taskDurationMs,0)/workers.size,queueDepth:[...queues.values()].reduce((n,s)=>n+s.queueDepth,0),queueAgeMs:Math.max(...[...queues.values()].map(s=>s.queueAgeMs)),retries:[...workers.values()].reduce((n,s)=>n+s.retries,0),utilization:[...workers.values()].reduce((n,s)=>n+s.utilization,0)/workers.size,fairnessMaxWaitRounds:Math.max(...[...workers.values()].map(s=>s.fairWaitRounds)),backpressuredQueues:[...queues.values()].filter(s=>s.backpressure).length,budgetCents:[...workers.values()].some(s=>s.budgetCents===null)?null:[...workers.values()].reduce((n,s)=>n+s.budgetCents!,0),authorizationGranted:false});
}
export interface RoutingAlternative {readonly routeRef:string;readonly utilityUnit:string;readonly utilityVersionRef:string;readonly availableAt:string;readonly expectedUtility:number|null;readonly measuredUtility:number|null;readonly measuredAt:string|null;readonly inputFingerprint:string;readonly environmentFingerprint:string;readonly benchmarkClass:BenchmarkClass}
export function routingRegret(access:AnalyticsAccess,scope:AnalyticsScope,snapshot:DecisionTimeSnapshot,alternatives:readonly RoutingAlternative[],evidenceIds:readonly string[]){
 authorizeAnalytics(access,'read',scope,'routing-regret');analyticsEvidence(access,scope,evidenceIds);analyticsEvidence(access,scope,snapshot.evidenceRefs);for(const id of snapshot.evidenceRefs)invariant(timestamp(access.evidence(id)!.record.recordedAt)<=timestamp(snapshot.capturedAt),'routing_uses_hindsight_evidence');invariant(timestamp(snapshot.capturedAt)<=timestamp(access.now()),'future_routing_decision');invariant(new Set(alternatives.map(a=>a.routeRef)).size===alternatives.length,'duplicate_route_alternative');
 const eligible=alternatives.filter(a=>timestamp(a.availableAt)<=timestamp(snapshot.capturedAt));const selected=eligible.find(a=>a.routeRef===snapshot.candidateRef);invariant(selected,'selected_route_not_available_at_decision');
 for(const a of alternatives){if(a.expectedUtility!==null)bounded(a.expectedUtility,-Infinity);if(a.measuredUtility!==null){bounded(a.measuredUtility,-Infinity);invariant(a.measuredAt!==null&&timestamp(a.measuredAt)>=timestamp(snapshot.capturedAt)&&timestamp(a.measuredAt)<=timestamp(access.now()),'invalid_route_outcome_time');}}
 invariant(eligible.every(a=>a.utilityUnit===selected.utilityUnit&&a.utilityVersionRef===selected.utilityVersionRef),'routing_utility_semantic_mismatch');
 const expected=selected.expectedUtility===null||eligible.some(a=>a.expectedUtility===null)?null:Math.max(...eligible.map(a=>a.expectedUtility!))-selected.expectedUtility;
 const paired=eligible.filter(a=>a.measuredUtility!==null&&a.inputFingerprint===snapshot.inputFingerprint&&a.environmentFingerprint===snapshot.environmentFingerprint&&a.benchmarkClass===selected.benchmarkClass);
 return immutable({scope,selectedRouteRef:selected.routeRef,decisionTimeAlternativeRefs:eligible.map(a=>a.routeRef).sort(),predictedRegret:expected,benchmarkRegret:paired.length===eligible.length&&selected.measuredUtility!==null?Math.max(...paired.map(a=>a.measuredUtility!))-selected.measuredUtility:null,causalClaim:false,limitations:['Decision quality uses decision-time alternatives','Benchmark outcomes are not unexecuted causal outcomes'],authorizationGranted:false});
}
