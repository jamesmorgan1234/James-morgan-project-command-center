export interface MigrationStep {
  readonly id: string;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly preconditionRefs: readonly string[];
  readonly backupRef: string;
  readonly rollbackRef: string;
  readonly compatibleFrom: readonly number[];
}

export function dryRunMigration(step: MigrationStep, currentVersion: number): Readonly<{ canApply: boolean; reason: string }> {
  if (step.toVersion <= step.fromVersion || step.preconditionRefs.length === 0 || !step.backupRef.trim() || !step.rollbackRef.trim()) return Object.freeze({ canApply: false, reason: "migration_contract_incomplete" });
  if (currentVersion !== step.fromVersion || !step.compatibleFrom.includes(currentVersion)) return Object.freeze({ canApply: false, reason: "incompatible_source_version" });
  return Object.freeze({ canApply: true, reason: "dry_run_passed" });
}

export function rollbackRequired(result: "applied" | "failed" | "uncertain"): boolean {
  return result !== "applied";
}

import {IsolatedRecoveryWorkspace,type RecoveryProjection} from './restore.js';
import {validateRecoveryRecord,type RecoveryRecord} from './backup.js';
import {assertRecoveryAccess,assertRecoveryEvidence,recoveryDigest,recoveryImmutable,recoveryJson,recoveryScopeKey,recoveryVersion,requireRecovery,type RecoveryAccess,type RecoveryScope} from './contracts.js';
export interface RecoveryMigrationPlan {readonly id:string;readonly scope:RecoveryScope;readonly fromVersion:number;readonly toVersion:number;readonly compatibleFrom:readonly number[];readonly compatibleBackTo:readonly number[];readonly backupRef:string;readonly rollbackRef:string;readonly sourceDigest:string;readonly evidenceIds:readonly string[]}
export interface RecoveryMigrationReceipt {readonly id:string;readonly scope:RecoveryScope;readonly sourceDigest:string;readonly targetDigest:string;readonly sourceRevision:number;readonly targetRevision:number;readonly source:readonly RecoveryProjection[];readonly plan:RecoveryMigrationPlan;readonly planDigest:string}
function migrationPlan(p:RecoveryMigrationPlan):void{recoveryVersion(p.fromVersion);recoveryVersion(p.toVersion);requireRecovery(p.toVersion>p.fromVersion&&p.compatibleFrom.includes(p.fromVersion)&&p.compatibleBackTo.includes(p.fromVersion),'migration_compatibility_invalid');requireRecovery(p.backupRef.length>0&&p.rollbackRef.length>0&&/^[a-f0-9]{64}$/.test(p.sourceDigest),'migration_preconditions_missing');}
export async function migrateIsolatedWorkspace(a:RecoveryAccess,w:IsolatedRecoveryWorkspace,p:RecoveryMigrationPlan,expectedRevision:number,transform:(record:RecoveryRecord)=>RecoveryRecord,failAtId?:string):Promise<RecoveryMigrationReceipt>{
 const plan=recoveryImmutable(p);migrationPlan(plan);requireRecovery(recoveryScopeKey(w.scope)===recoveryScopeKey(plan.scope),'migration_scope');assertRecoveryAccess(a,'migrate',p.scope,p.id);assertRecoveryEvidence(a,p.scope,p.evidenceIds);const source=w.snapshot(),sourceDigest=await recoveryDigest(source),planDigest=await recoveryDigest(plan);const prior=w.receipt('migration:'+plan.id);if(prior){requireRecovery(prior.digest===planDigest&&prior.revision===w.revision,'migration_idempotency_collision_or_superseded');throw new Error('migration_already_applied_use_recorded_receipt');}requireRecovery(w.revision===expectedRevision&&source.length>0&&sourceDigest===plan.sourceDigest,'migration_source_stale');
 const staged:RecoveryProjection[]=[];for(const item of source){requireRecovery(item.record.compatibleVersion===plan.fromVersion,'migration_source_incompatible');if(item.record.id===failAtId)throw new Error('migration_injected_failure_no_commit');const next=item.record.truth==='deleted'?{...item.record,compatibleVersion:plan.toVersion,version:item.record.version+1}:transform(recoveryImmutable(item.record));validateRecoveryRecord(next);requireRecovery(next.id===item.record.id&&next.kind===item.record.kind&&recoveryScopeKey(next.scope)===recoveryScopeKey(item.record.scope)&&next.version===item.record.version+1&&next.compatibleVersion===plan.toVersion,'migration_identity_or_version_changed');requireRecovery(next.policyEpoch===item.record.policyEpoch&&next.revocationEpoch===item.record.revocationEpoch&&next.truth===item.record.truth&&recoveryJson(next.evidenceIds)===recoveryJson(item.record.evidenceIds)&&recoveryJson(next.dependencyIds)===recoveryJson(item.record.dependencyIds),'migration_authority_or_history_changed');staged.push({...item,record:next});}
 const targetDigest=await recoveryDigest(staged);assertRecoveryAccess(a,'migrate',p.scope,p.id);assertRecoveryEvidence(a,p.scope,p.evidenceIds);const targetRevision=w.commit(expectedRevision,'migration:'+p.id,planDigest,staged);return recoveryImmutable({id:p.id,scope:p.scope,sourceDigest,targetDigest,sourceRevision:expectedRevision,targetRevision,source,plan,planDigest});
}
export async function rollbackIsolatedMigration(a:RecoveryAccess,w:IsolatedRecoveryWorkspace,receipt:RecoveryMigrationReceipt,erasedIds:readonly string[],current:(record:RecoveryRecord)=>RecoveryProjection):Promise<number>{
 requireRecovery(recoveryScopeKey(w.scope)===recoveryScopeKey(receipt.scope)&&receipt.plan.id===receipt.id&&receipt.planDigest===await recoveryDigest(receipt.plan)&&receipt.sourceDigest===await recoveryDigest(receipt.source),'rollback_receipt_invalid');assertRecoveryAccess(a,'rollback',receipt.scope,receipt.id);assertRecoveryEvidence(a,receipt.scope,receipt.plan.evidenceIds);requireRecovery(w.revision===receipt.targetRevision&&await recoveryDigest(w.snapshot())===receipt.targetDigest,'rollback_destination_superseded');const source=receipt.source.map(p=>{const projection=current(recoveryImmutable(p.record));validateRecoveryRecord(projection.record);requireRecovery(projection.record.id===p.record.id&&recoveryScopeKey(projection.record.scope)===recoveryScopeKey(p.record.scope)&&recoveryJson(projection.record)===recoveryJson(p.record),'rollback_source_identity_changed');if(erasedIds.includes(p.record.id)||p.record.truth==='deleted')return {record:{...p.record,truth:'deleted' as const,payload:{}},disposition:'historical' as const,reason:'erasure_preserved'};requireRecovery(projection.disposition!=='usable_data'||['canonical_data','assets','configuration'].includes(p.record.kind),'rollback_cannot_activate_intelligence');return projection;});const digest=await recoveryDigest({receipt:receipt.planDigest,source});assertRecoveryAccess(a,'rollback',receipt.scope,receipt.id);return w.commit(receipt.targetRevision,'rollback:'+receipt.id,digest,source);
}
/** Retry checks the immutable applied plan before returning the original recorded receipt. */
export async function resumeIsolatedMigration(w:IsolatedRecoveryWorkspace,p:RecoveryMigrationPlan,r:RecoveryMigrationReceipt):Promise<RecoveryMigrationReceipt>{requireRecovery(p.id===r.id&&await recoveryDigest(p)===r.planDigest&&w.receipt('migration:'+p.id)?.digest===r.planDigest&&w.revision===r.targetRevision&&await recoveryDigest(w.snapshot())===r.targetDigest,'migration_resume_mismatch');return recoveryImmutable(r);}
