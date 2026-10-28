export type BuildLessonKind = "scope_drift" | "patch_stacking" | "lost_artifact" | "false_completion" | "bad_sequencing" | "handoff_friction" | "success_pattern";

export interface BuildLesson {
  readonly id: string;
  readonly kind: BuildLessonKind;
  readonly evidenceRefs: readonly string[];
  readonly sourceVersion: string;
  readonly statement: string;
  readonly improvementProposalRef: string;
  readonly autoApplied: false;
}

export function validateBuildLesson(lesson: BuildLesson): BuildLesson {
  if (!lesson.id.trim() || !lesson.sourceVersion.trim() || !lesson.statement.trim() || !lesson.improvementProposalRef.trim() || lesson.evidenceRefs.length === 0) throw new Error("build lesson requires evidence/version/proposal");
  if (lesson.autoApplied !== false) throw new Error("build lessons cannot silently mutate architecture");
  return Object.freeze({ ...lesson, evidenceRefs: Object.freeze([...lesson.evidenceRefs]) });
}

import {validateNegativeKnowledge,type NegativeKnowledgeRecord} from './transferability.js';
import type {SpecialistDecision} from '../specialists/interoperability.js';
import {authorizeAnalytics,analyticsEvidence,immutable,invariant,bounded,timestamp,stringSet,type AnalyticsScope,type AnalyticsAccess} from './contracts.js';
export interface FailureIntelligence {readonly id:string;readonly scope:AnalyticsScope;readonly failureClass:string;readonly sourceVersionRefs:readonly string[];readonly precursorRefs:readonly string[];readonly impactRefs:readonly string[];readonly rootCauseConfidence:number;readonly recoveryRef:string;readonly detectedAfterMs:number|null;readonly recoveredAfterMs:number|null;readonly preventionProposalRef:string;readonly affectedPromotionRefs:readonly string[];readonly negativeKnowledgeRef:string;readonly evidenceIds:readonly string[]}
export function failureIntelligence(access:AnalyticsAccess,input:FailureIntelligence,negative:NegativeKnowledgeRecord){authorizeAnalytics(access,'read',input.scope,input.id);analyticsEvidence(access,input.scope,input.evidenceIds);validateNegativeKnowledge(negative);invariant(negative.id===input.negativeKnowledgeRef,'negative_knowledge_owner_mismatch');invariant(negative.sourceRegime.companyId===undefined||negative.sourceRegime.companyId===input.scope.companyId,'negative_knowledge_scope_mismatch');stringSet(input.sourceVersionRefs,true);stringSet(input.impactRefs,true);invariant(input.recoveryRef.trim()&&input.preventionProposalRef.trim(),"failure_recovery_proposal_required");bounded(input.rootCauseConfidence,0,1);for(const n of [input.detectedAfterMs,input.recoveredAfterMs])if(n!==null)bounded(n);[input.sourceVersionRefs,input.precursorRefs,input.impactRefs,input.affectedPromotionRefs].forEach(a=>stringSet(a));return immutable({...input,negativeKnowledgeVersion:negative.version,discoverable:true,autoApplied:false,compilerSourceOnly:true});}
export function procedureOutcomeHistory(access:AnalyticsAccess,scope:AnalyticsScope,reference:{id:string;version:number},resolve:(id:string,version:number)=>SpecialistDecision|undefined,outcomes:readonly {procedureId:string;procedureVersion:number;success:boolean;observedAt:string;evidenceIds:readonly string[]}[]){
 authorizeAnalytics(access,'read',scope,reference.id);const decision=resolve(reference.id,reference.version),p=decision?.artifact?.procedure;
 invariant(decision?.accepted&&decision.version===reference.version&&p&&decision.scope.ownerId===scope.ownerId&&decision.scope.companyId===scope.companyId&&decision.scope.projectId===scope.projectId&&decision.artifact!.methods.some(m=>m.brainId===scope.brainId),'canonical_p12_procedure_required');
 for(const o of outcomes){invariant(o.procedureId===p.id&&o.procedureVersion===p.version,'procedure_outcome_version_mismatch');invariant(timestamp(o.observedAt)<=timestamp(access.now()),'future_procedure_outcome');analyticsEvidence(access,scope,o.evidenceIds);}
 return immutable({procedureId:p.id,version:p.version,canonicalOwner:'P12.8',sourceDecisionId:decision.id,sourceRuns:p.sourceRunIds,applicabilityScope:decision.scope,evidenceIds:decision.artifact!.evidenceIds,observations:outcomes.length,successes:outcomes.filter(o=>o.success).length,failures:outcomes.filter(o=>!o.success).length,successRate:outcomes.length?outcomes.filter(o=>o.success).length/outcomes.length:null,expired:timestamp(decision.artifact!.expiresAt)<=timestamp(access.now()),mayPromote:false,mayExecute:false});
}
export function summarizeFailureHistory(access:AnalyticsAccess,scope:AnalyticsScope,records:readonly FailureIntelligence[]){authorizeAnalytics(access,'read',scope,'failure-history');const unique=new Map<string,FailureIntelligence>(),counts:Record<string,number>={};for(const r of records){invariant(r.scope.ownerId===scope.ownerId&&r.scope.companyId===scope.companyId&&r.scope.projectId===scope.projectId&&r.scope.brainId===scope.brainId,'failure_history_scope_mismatch');analyticsEvidence(access,scope,r.evidenceIds);const prior=unique.get(r.id);invariant(!prior||JSON.stringify(prior)===JSON.stringify(r),'failure_history_identity_conflict');if(prior)continue;unique.set(r.id,r);counts[r.failureClass]=(counts[r.failureClass]??0)+1;}const recoveries=[...unique.values()].map(r=>r.recoveredAfterMs).filter((n):n is number=>n!==null);return immutable({counts,recurrences:Object.entries(counts).filter(([,n])=>n>1).map(([failureClass,count])=>({failureClass,count})),meanRecoveryMs:recoveries.length?recoveries.reduce((a,b)=>a+b,0)/recoveries.length:null,affectedPromotionRefs:[...new Set([...unique.values()].flatMap(r=>r.affectedPromotionRefs))].sort(),mayAutoRollback:false});}
