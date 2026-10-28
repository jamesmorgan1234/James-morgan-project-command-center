export interface TraceEvent {
  readonly traceId: string;
  readonly correlationId: string;
  readonly component: string;
  readonly action: string;
  readonly at: string;
  readonly evidenceRefs: readonly string[];
  readonly fields: Readonly<Record<string, string>>;
}

const SECRET_KEYS = new Set(["token", "password", "secret", "api_key", "authorization"]);

export function redactFields(fields: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) output[key] = SECRET_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  return Object.freeze(output);
}

export class TraceLedger {
  readonly #events: TraceEvent[] = [];
  append(event: TraceEvent): TraceEvent {
    if (!event.traceId.trim() || !event.correlationId.trim() || !event.component.trim() || !event.action.trim() || !event.at.includes("T")) throw new Error("trace identity required");
    const frozen = Object.freeze({ ...event, evidenceRefs: Object.freeze([...event.evidenceRefs]), fields: redactFields(event.fields) });
    this.#events.push(frozen);
    return frozen;
  }
  trace(traceId: string): readonly TraceEvent[] {
    return Object.freeze(this.#events.filter((event) => event.traceId === traceId));
  }
}

import {GovernedIntelligenceTraceFabric} from '../brain/pif-integration.js';
import {validateIntelligenceTraceNode,validateIntelligenceTraceEdge,type IntelligenceTraceNodeKind} from '../data/intelligence-trace.js';
import {authorizeAnalytics,analyticsEvidence,equalScope,immutable,invariant,timestamp,version,stringSet,nonblank,keys,canonicalAnalyticsJson,type AnalyticsScope,type AnalyticsAccess} from './contracts.js';
export const LEARNING_TRACE_STAGES=['request','context','policy','router','specialist','method','tool','evidence','verifier','state','outcome','learning','promotion'] as const;
export type AnalyticsTraceStage=typeof LEARNING_TRACE_STAGES[number]|'provider'|'transfer'|'procedure'|'rollback'|'metric';
export interface ScopedTraceEvent {
 readonly id:string;readonly version:number;readonly scope:AnalyticsScope;readonly traceId:string;readonly correlationId:string;
 readonly stage:AnalyticsTraceStage;readonly parentId:string|null;readonly parentVersion:number|null;
 readonly subjectRef:string;readonly subjectVersion:number;readonly occurredAt:string;readonly receivedAt:string;readonly expiresAt:string;
 readonly evidenceIds:readonly string[];readonly fields:Readonly<{code?:string;durationMs?:number;count?:number}>;
}
/** Scoped extension over the existing PIF.9 trace owner. Raw legacy traces cannot read these records. */
export class ScopedAnalyticsTrace {
 readonly #events=new Map<string,ScopedTraceEvent>();
 readonly #fabric=new GovernedIntelligenceTraceFabric();
 constructor(private readonly access:AnalyticsAccess){}
 append(input:ScopedTraceEvent):ScopedTraceEvent {
  const e=immutable(input);authorizeAnalytics(this.access,'record',e.scope,e.id);version(e.version);version(e.subjectVersion);
  keys(e,['id','version','scope','traceId','correlationId','stage','parentId','parentVersion','subjectRef','subjectVersion','occurredAt','receivedAt','expiresAt','evidenceIds','fields']);
  [e.id,e.traceId,e.correlationId,e.subjectRef].forEach(nonblank);stringSet(e.evidenceIds,true);analyticsEvidence(this.access,e.scope,e.evidenceIds);
  invariant([...LEARNING_TRACE_STAGES,'provider','transfer','procedure','rollback','metric'].includes(e.stage),'unsupported_trace_stage');
  invariant(timestamp(e.occurredAt)<=timestamp(e.receivedAt)&&timestamp(e.receivedAt)<=timestamp(this.access.now())&&timestamp(e.expiresAt)>timestamp(this.access.now()),'invalid_trace_time_retention');
  keys(e.fields,['code','durationMs','count']);if(e.fields.code!==undefined){nonblank(e.fields.code);invariant(/^[a-z0-9_.:-]{1,100}$/.test(e.fields.code),'unsafe_trace_code');}for(const n of [e.fields.durationMs,e.fields.count])if(n!==undefined)invariant(Number.isFinite(n)&&n>=0,'invalid_trace_measurement');
  const key=JSON.stringify([e.scope.ownerId,e.id,e.version]),prior=this.#events.get(key);
  if(prior){invariant(canonicalAnalyticsJson(prior)===canonicalAnalyticsJson(e),'trace_idempotency_conflict');return prior;}
  invariant(![...this.#events.values()].some(p=>p.scope.ownerId===e.scope.ownerId&&p.id===e.id&&p.version>=e.version),'trace_version_conflict');
  let parent:ScopedTraceEvent|undefined;
  if(e.parentId!==null){invariant(e.parentVersion!==null,'trace_parent_version_required');parent=this.#events.get(JSON.stringify([e.scope.ownerId,e.parentId,e.parentVersion]));invariant(parent&&equalScope(parent.scope,e.scope)&&parent.traceId===e.traceId&&parent.correlationId===e.correlationId&&timestamp(parent.occurredAt)<=timestamp(e.occurredAt)&&timestamp(parent.expiresAt)>timestamp(this.access.now()),'trace_parent_scope_time_mismatch');}else invariant(e.parentVersion===null,'orphan_trace_parent_version');
  const kind: IntelligenceTraceNodeKind= e.stage==='request'?'intent':e.stage==='provider'?'tool':e.stage==='promotion'?'learning':e.stage==='transfer'?'decision':e.stage==='rollback'?'state':e.stage==='metric'?'evidence':e.stage;
  const node=validateIntelligenceTraceNode({id:JSON.stringify([e.scope.ownerId,e.id]),version:e.version,ownerId:e.scope.ownerId,kind,privacy:'project_private',scopeRef:e.scope.projectId,reference:`${e.subjectRef}@${e.subjectVersion}`,recordedAt:e.receivedAt,evidenceRefs:e.evidenceIds});
  const edge=parent?validateIntelligenceTraceEdge({id:key,version:1,fromId:JSON.stringify([parent.scope.ownerId,parent.id]),fromVersion:parent.version,toId:node.id,toVersion:node.version,relation:'records_decision',recordedAt:e.receivedAt,evidenceRefs:e.evidenceIds}):undefined;
  this.#fabric.registerNode(node);if(edge)this.#fabric.connect(edge);this.#events.set(key,e);return e;
 }
 read(scope:AnalyticsScope,traceId:string):readonly ScopedTraceEvent[]{authorizeAnalytics(this.access,'read',scope,traceId);return immutable([...this.#events.values()].filter(e=>equalScope(e.scope,scope)&&e.traceId===traceId&&timestamp(e.expiresAt)>timestamp(this.access.now())).sort((a,b)=>timestamp(a.occurredAt)-timestamp(b.occurredAt)||a.id.localeCompare(b.id)));}
 complete(scope:AnalyticsScope,traceId:string):boolean {const events=this.read(scope,traceId);let last:ScopedTraceEvent|undefined;for(const stage of LEARNING_TRACE_STAGES){const e=events.find(e=>e.stage===stage&&(last===undefined||e.parentId===last.id&&e.parentVersion===last.version));if(!e)return false;last=e;}return true;}
}
