export interface CapacitySample {
  readonly projects: number;
  readonly books: number;
  readonly accounts: number;
  readonly socialChannels: number;
  readonly agencyJobs: number;
  readonly knowledgeRecords: number;
  readonly cpuPercent: number;
  readonly memoryPercent: number;
  readonly queueDepth: number;
  readonly providerDegraded: boolean;
}

export function capacityDecision(sample: CapacitySample): "accept" | "backpressure" {
  const invalid = Object.values(sample).some((value) => typeof value === "number" && (!Number.isFinite(value) || value < 0));
  if (invalid) throw new Error("invalid capacity sample");
  if (sample.cpuPercent >= 85 || sample.memoryPercent >= 85 || sample.queueDepth >= 1000 || sample.providerDegraded) return "backpressure";
  return "accept";
}

import {recoveryDigest,recoveryImmutable,recoveryJson,recoveryRef,recoveryScopeKey,recoveryVersion,requireRecovery,type RecoveryScope} from './contracts.js';
export type RecoveryLoadClass='projects'|'businesses'|'books'|'accounts'|'social_channels'|'agency_jobs'|'knowledge_records'|'learning_packets'|'evaluations'|'method_history'|'traces'|'cross_brain_routes';
export interface RecoveryLoadUnit{readonly id:string;readonly scope:RecoveryScope;readonly kind:RecoveryLoadClass;readonly version:number;readonly dependencyRefs:readonly string[]}
export interface RecoveryLoadBudget{readonly multiplier:10|100;readonly baselineUnits:number;readonly maximumAccepted:number;readonly maximumBytes:number;readonly perScopeLimit:number;readonly providerDegraded:boolean}
/** Admission exercise only, not a competing Agency queue. Every offered unit is accounted for. */
export async function exerciseRecoveryCapacity(units:readonly RecoveryLoadUnit[],budget:RecoveryLoadBudget){for(const n of [budget.baselineUnits,budget.maximumBytes,budget.perScopeLimit])recoveryVersion(n);requireRecovery([10,100].includes(budget.multiplier)&&Number.isSafeInteger(budget.maximumAccepted)&&budget.maximumAccepted>=0&&units.length===budget.baselineUnits*budget.multiplier&&units.length<=1000000,'recovery_load_bounds');const seen=new Set<string>(),accepted:string[]=[],backpressured:string[]=[],perScope=new Map<string,number>(),classes=new Map<string,number>();let bytes=0;const ordered=[...units].sort((a,b)=>recoveryScopeKey(a.scope).localeCompare(recoveryScopeKey(b.scope))||a.id.localeCompare(b.id));for(const unit of ordered){recoveryRef(unit.id);recoveryVersion(unit.version);requireRecovery(['projects','businesses','books','accounts','social_channels','agency_jobs','knowledge_records','learning_packets','evaluations','method_history','traces','cross_brain_routes'].includes(unit.kind),'recovery_load_class');const sk=recoveryScopeKey(unit.scope),identity=sk+':'+unit.id;requireRecovery(!seen.has(identity),'recovery_load_duplicate');seen.add(identity);classes.set(unit.kind,(classes.get(unit.kind)??0)+1);const size=new TextEncoder().encode(recoveryJson(unit)).byteLength;const used=perScope.get(sk)??0;const decision=capacityDecision({projects:classes.get('projects')??0,books:classes.get('books')??0,accounts:classes.get('accounts')??0,socialChannels:classes.get('social_channels')??0,agencyJobs:classes.get('agency_jobs')??0,knowledgeRecords:classes.get('knowledge_records')??0,cpuPercent:0,memoryPercent:bytes/budget.maximumBytes*100,queueDepth:accepted.length,providerDegraded:budget.providerDegraded});if(decision==='backpressure'||accepted.length>=budget.maximumAccepted||bytes+size>budget.maximumBytes||used>=budget.perScopeLimit){backpressured.push(identity);continue;}accepted.push(identity);bytes+=size;perScope.set(sk,used+1);}const checkpointDigest=await recoveryDigest({accepted,backpressured,budget});return recoveryImmutable({boundary:'isolated_synthetic',offered:units.length,accepted,backpressured,lost:0,bytesUsed:bytes,maximumBytes:budget.maximumBytes,byClass:Object.fromEntries(classes),checkpointDigest,productionCapacityCertified:false});}
