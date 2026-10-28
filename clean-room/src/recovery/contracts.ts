import {assertIdentifierKind} from '../kernel/identifiers.js';
import {evidenceMeets,type EvidenceRecord} from '../kernel/evidence.js';
import type {ExecutionScope} from '../kernel/scope.js';
// Reuse the existing canonical JSON/digest implementation; no competing record owner.
export {canonicalAnalyticsJson as recoveryJson,analyticsDigest as recoveryDigest,immutable as recoveryImmutable} from '../analytics/contracts.js';
export interface RecoveryScope extends ExecutionScope {readonly companyId:string;readonly projectId:string}
export type RecoveryOperation='backup'|'restore'|'migrate'|'rollback'|'replace'|'reactivate'|'record'|'read';
export interface RecoveryAccess {
 readonly now:()=>string;
 readonly authorize:(operation:RecoveryOperation,scope:RecoveryScope,reference:string)=>boolean;
 readonly evidence:(id:string)=>{record:EvidenceRecord;scope:RecoveryScope;expiresAt:string}|undefined;
}
export function requireRecovery(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}
export function recoveryTime(value:string):number{const n=Date.parse(value);requireRecovery(Number.isFinite(n),'recovery_time_invalid');return n;}
export function recoveryRef(value:string):void{requireRecovery(typeof value==='string'&&value.length>0&&value===value.trim()&&value.length<=512,'recovery_reference_invalid');requireRecovery(!/(bearer\s|password\s*[:=]|secret\s*[:=]|token\s*[:=]|sk-[a-z0-9]{12})/i.test(value),'recovery_secret_reference');}
export function recoveryList(values:readonly string[],required=false):void{requireRecovery(Array.isArray(values)&&(!required||values.length>0),'recovery_list_required');values.forEach(recoveryRef);requireRecovery(new Set(values).size===values.length,'recovery_duplicate_reference');}
export function recoveryVersion(value:number):void{requireRecovery(Number.isSafeInteger(value)&&value>0,'recovery_version_invalid');}
export function assertRecoveryScope(scope:RecoveryScope):void{recoveryRef(scope.ownerId);assertIdentifierKind(scope.companyId,'company');assertIdentifierKind(scope.projectId,'project');requireRecovery(['local','preview','production','test','development','staging'].includes(scope.environment),'recovery_environment_invalid');requireRecovery(Object.keys(scope).every(k=>['ownerId','companyId','projectId','environment','accountId'].includes(k)),'recovery_scope_field');if(scope.accountId!==undefined)recoveryRef(scope.accountId);}
export function recoveryScopeKey(s:RecoveryScope):string{assertRecoveryScope(s);return JSON.stringify([s.ownerId,s.companyId,s.projectId,s.environment,s.accountId??null]);}
export function assertRecoveryAccess(a:RecoveryAccess,op:RecoveryOperation,s:RecoveryScope,ref:string):void{assertRecoveryScope(s);recoveryRef(ref);recoveryTime(a.now());requireRecovery(a.authorize(op,s,ref),'recovery_access_denied');}
export function assertRecoveryEvidence(a:RecoveryAccess,s:RecoveryScope,ids:readonly string[]):void{recoveryList(ids,true);const now=recoveryTime(a.now());for(const id of ids){assertIdentifierKind(id,'evidence');const e=a.evidence(id);requireRecovery(e&&e.record.id===id&&evidenceMeets(e.record,'canonical_record')&&recoveryScopeKey(e.scope)===recoveryScopeKey(s)&&recoveryTime(e.record.recordedAt)<=now&&recoveryTime(e.expiresAt)>now,'recovery_evidence_not_current_scoped');}}
/** Defense in depth: encrypted payloads still never accept credential/grant material. */
export function assertRecoveryPayload(value:unknown):void{const seen=new WeakSet<object>();const walk=(v:unknown):void=>{if(v===null||typeof v==='boolean')return;if(typeof v==='number'){requireRecovery(Number.isFinite(v),'recovery_nonfinite_payload');return;}if(typeof v==='string'){requireRecovery(!/(bearer\s+[a-z0-9._-]+|-----BEGIN.*PRIVATE KEY|sk-[a-z0-9]{12})/i.test(v),'recovery_secret_payload');return;}requireRecovery(typeof v==='object'&&v!==null&&!seen.has(v),'recovery_payload_not_json');seen.add(v);if(Array.isArray(v)){v.forEach(walk);return;}requireRecovery(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null,'recovery_payload_not_plain');for(const [k,x] of Object.entries(v)){requireRecovery(!/^(password|secret|credential|credentials|accessToken|refreshToken|privateKey|session|authorizationGrant|permissionGrant)$/i.test(k),'recovery_credential_material_forbidden');walk(x);}};walk(value);}
