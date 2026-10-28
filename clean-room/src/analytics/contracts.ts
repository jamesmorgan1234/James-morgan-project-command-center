import {assertIdentifierKind} from '../kernel/identifiers.js';
import {evidenceMeets,type EvidenceRecord} from '../kernel/evidence.js';
export interface AnalyticsScope {readonly ownerId:string;readonly companyId:string;readonly projectId:string;readonly brainId:string}
export type BenchmarkClass='synthetic'|'replay'|'simulation'|'shadow'|'canary'|'staging'|'production'|'external'|'owner_verified';
export const BENCHMARK_CLASSES:readonly BenchmarkClass[]=['synthetic','replay','simulation','shadow','canary','staging','production','external','owner_verified'];
export interface AnalyticsAccess {
 readonly now:()=>string;
 readonly authorize:(operation:'read'|'record'|'export'|'propose',scope:AnalyticsScope,reference:string)=>boolean;
 readonly evidence:(id:string)=>{readonly record:EvidenceRecord;readonly scope:AnalyticsScope;readonly expiresAt:string}|undefined;
}
export function invariant(condition:unknown,reason:string):asserts condition {if(!condition)throw new Error(reason);}
export function timestamp(value:string):number {const n=Date.parse(value);invariant(Number.isFinite(n),'invalid_analytics_time');return n;}
export function version(n:number):void {invariant(Number.isSafeInteger(n)&&n>0,'invalid_analytics_version');}
export function nonblank(s:string):void {invariant(typeof s==='string'&&s.length>0&&s===s.trim(),'invalid_analytics_reference');invariant(!/(bearer\s+|sk-[a-z0-9]{12}|password\s*[:=]|token\s*[:=]|secret\s*[:=]|@[^\s]+\.)/i.test(s),'unsafe_analytics_reference');}
export function stringSet(a:readonly string[],required=false):void {invariant(Array.isArray(a)&&(!required||a.length>0),'analytics_list_required');a.forEach(nonblank);invariant(new Set(a).size===a.length,'duplicate_analytics_reference');}
export function bounded(n:number,min=0,max=Infinity):void {invariant(Number.isFinite(n)&&n>=min&&n<=max,'invalid_analytics_number');}
export function scoped(s:AnalyticsScope):void {nonblank(s.ownerId);assertIdentifierKind(s.companyId,'company');assertIdentifierKind(s.projectId,'project');assertIdentifierKind(s.brainId,'brain');Object.values(s).forEach(nonblank);keys(s,['ownerId','companyId','projectId','brainId']);}
export function equalScope(a:AnalyticsScope,b:AnalyticsScope):boolean {return a.ownerId===b.ownerId&&a.companyId===b.companyId&&a.projectId===b.projectId&&a.brainId===b.brainId;}
export function keys(o:object,allowed:readonly string[]):void {invariant(Object.keys(o).every(k=>allowed.includes(k)),'unsupported_analytics_field');}
export function immutable<T>(input:T):T {const copy=structuredClone(input);const freeze=(o:unknown):void=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}};freeze(copy);return copy;}
export function canonicalAnalyticsJson(value:unknown):string {if(Array.isArray(value))return '['+value.map(canonicalAnalyticsJson).join(',')+']';if(value!==null&&typeof value==='object')return '{'+Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>JSON.stringify(k)+':'+canonicalAnalyticsJson(v)).join(',')+'}';if(typeof value==='number')invariant(Number.isFinite(value),'nonfinite_analytics_json');return JSON.stringify(value);}
export async function analyticsDigest(value:unknown):Promise<string>{return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalAnalyticsJson(value)))),n=>n.toString(16).padStart(2,'0')).join('');}
export function authorizeAnalytics(access:AnalyticsAccess,operation:'read'|'record'|'export'|'propose',scope:AnalyticsScope,ref:string):void {scoped(scope);nonblank(ref);timestamp(access.now());invariant(access.authorize(operation,scope,ref),'analytics_access_denied');}
export function analyticsEvidence(access:AnalyticsAccess,scope:AnalyticsScope,ids:readonly string[]):void {stringSet(ids,true);const now=timestamp(access.now());for(const id of ids){assertIdentifierKind(id,'evidence');const p=access.evidence(id);invariant(p&&p.record.id===id&&equalScope(p.scope,scope)&&evidenceMeets(p.record,'canonical_record')&&timestamp(p.record.recordedAt)<=now&&timestamp(p.expiresAt)>now,'analytics_evidence_not_current_verified_scoped');}}
