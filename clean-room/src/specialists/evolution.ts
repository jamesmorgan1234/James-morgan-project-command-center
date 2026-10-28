import { evidenceMeets } from "../kernel/evidence.js";
import { SpecialistBrainRegistry, validateSpecialistModel, type SpecialistModelContract, type SpecialistControlAuthority } from "../brain/specialists.js";
import { SHARED_INTELLIGENCE_ONTOLOGY_ID, SHARED_INTELLIGENCE_ONTOLOGY_VERSION } from "../data/intelligence-contracts.js";
import { assertIdentifierKind } from "../kernel/identifiers.js";

const MODEL_KEYS = new Set(["key","version","enabled","controlPlane","domain","subdomains","supportedCompanyIds","supportedProjectIds","supportedWorkClasses","strengths","weaknesses","capabilityKeys","methodIds","permissionKeys","protectedActionBoundaries","dataClasses","toolKeys","providerKeys","modelAssignments","dependencyVersionRefs","calibrationScore","evaluationEvidenceIds","historicalAccuracy","reliabilityScore","latencyMs","resourceClass","costClass","failureModes","degradedModes","fallbackSpecialistIds","delegationTargets","learningEligibility","experimentStatus","health","lifecycle","rollbackEvidenceId","provenanceEvidenceIds","verificationState","revalidatedAt","revalidateAfter"]);
function assertModelShape(model:SpecialistModelContract):void {if(Object.keys(model).some(k=>!MODEL_KEYS.has(k)))throw new Error("Unsupported specialist model field");}

export interface SpecialistEvolutionReview {
 readonly unmetCapabilityKeys: readonly string[]; readonly ontologyId: string; readonly ontologyVersion: number;
 readonly scopeCompanyIds: readonly string[]; readonly scopeProjectIds: readonly string[];
 readonly permissionKeys: readonly string[]; readonly resourceBudget: "low"|"medium"|"high";
 readonly evaluationEvidenceIds: readonly string[]; readonly fallbackPlanRef: string; readonly retirementPlanRef: string;
 readonly authorizationEvidenceIds: readonly string[];
}
export interface SpecialistEvolution {
 readonly operation: "create"|"evolve"|"split"|"merge"|"suspend"|"retire";
 readonly sources: readonly {readonly id:string;readonly version:number}[];
 readonly targets: readonly SpecialistModelContract[];
}
/** Trusted synchronous control-plane transaction. Review and C2 authorization callbacks must
 * resolve current canonical evidence, never caller booleans. Existing PIF.3 remains model owner. */
export function applySpecialistEvolution(registry:SpecialistBrainRegistry,plan:SpecialistEvolution,authority:SpecialistControlAuthority,review:SpecialistEvolutionReview,authorize:(plan:SpecialistEvolution,review:SpecialistEvolutionReview)=>boolean):readonly SpecialistModelContract[]{
 if(!authorize(plan,review))throw new Error("Current specialist evolution authorization denied");
 if(authority.actor!=="owner"&&authority.actor!=="command_center")throw new Error("Command Center controls specialist evolution");
 for(const refs of [authority.evidenceIds,review.authorizationEvidenceIds,review.evaluationEvidenceIds]){if(refs.length===0)throw new Error("Evolution evidence required");for(const id of refs)assertIdentifierKind(id,"evidence");}
 if(!authority.evidenceIds.every(id=>review.authorizationEvidenceIds.includes(id)))throw new Error("Evolution authority evidence mismatch");
 if(review.ontologyId!==SHARED_INTELLIGENCE_ONTOLOGY_ID||review.ontologyVersion!==SHARED_INTELLIGENCE_ONTOLOGY_VERSION||!review.fallbackPlanRef.trim()||!review.retirementPlanRef.trim())throw new Error("Evolution ontology/evaluation/fallback/retirement required");
 const unique=(v:readonly string[])=>new Set(v).size===v.length;
 if(!unique(plan.sources.map(s=>s.id))||!unique(plan.targets.map(t=>t.key)))throw new Error("Duplicate evolution identity");
 const sources=plan.sources.map(s=>{const m=registry.getModel(s.id);if(!m||m.version!==s.version||m.lifecycle==="retired")throw new Error("Evolution source version/lifecycle conflict");return m;});
 const count=sources.length,targets=plan.targets.length;
 if(!((plan.operation==="create"&&count===0&&targets===1)||(plan.operation==="evolve"&&count===1&&targets===1&&sources[0]!.key===plan.targets[0]!.key)||(plan.operation==="split"&&count===1&&targets>=2)||(plan.operation==="merge"&&count>=2&&targets===1)||(["suspend","retire"].includes(plan.operation)&&count===1&&targets===0)))throw new Error("Invalid evolution topology");
 for(const target of plan.targets){
  assertModelShape(target);validateSpecialistModel(target);
  target.supportedCompanyIds.forEach(id=>assertIdentifierKind(id,"company"));target.supportedProjectIds.forEach(id=>assertIdentifierKind(id,"project"));
  if(target.costClass!=="free"||target.resourceClass!==review.resourceBudget||target.controlPlane!=="command_center"||target.verificationState!=="verified"||target.lifecycle!=="active"||!target.enabled||target.supportedCompanyIds.length===0||target.supportedProjectIds.length===0)throw new Error("Evolution budget/control/verified scope required");
  if(!target.supportedCompanyIds.every(id=>review.scopeCompanyIds.includes(id))||!target.supportedProjectIds.every(id=>review.scopeProjectIds.includes(id))||!target.permissionKeys.every(k=>review.permissionKeys.includes(k)))throw new Error("Evolution scope/permission escalation");
  if(["create","split","merge"].includes(plan.operation)){
   if(registry.getModel(target.key)||target.version!==1)throw new Error("Evolution target already registered");
   if(!review.unmetCapabilityKeys.some(k=>target.capabilityKeys.includes(k)))throw new Error("Unmet capability/domain need required");
   const duplicate=registry.listModels().some(m=>!sources.includes(m)&&m.enabled&&m.domain===target.domain&&target.supportedCompanyIds.some(c=>m.supportedCompanyIds.includes(c))&&target.supportedProjectIds.some(p=>m.supportedProjectIds.includes(p))&&target.capabilityKeys.every(k=>m.capabilityKeys.includes(k)));
   if(duplicate)throw new Error("Duplicate specialist capability scope");
  }
  if(sources.length){
   if(plan.operation==="merge"&&sources.some(s=>!target.supportedCompanyIds.every(id=>s.supportedCompanyIds.includes(id))||!target.supportedProjectIds.every(id=>s.supportedProjectIds.includes(id))||!target.permissionKeys.every(key=>s.permissionKeys.includes(key))))throw new Error("Merge cannot amplify any source privacy/permission boundary");
   for(const field of ["supportedCompanyIds","supportedProjectIds","permissionKeys","dataClasses","toolKeys","methodIds","capabilityKeys"] as const){const allowed=[...new Set(sources.flatMap(s=>s[field]))];if(!target[field].every(v=>allowed.includes(v)))throw new Error("Evolution cannot amplify source scope/capabilities");}
  }
 }
 const changes: {model:SpecialistModelContract;expectedVersion:number|null}[]=sources.filter(s=>plan.operation!=="evolve").map(s=>({model:{...s,version:s.version+1,enabled:false,lifecycle:plan.operation==="suspend"?"suspended" as const:"retired" as const,learningEligibility:plan.operation==="suspend"?s.learningEligibility:"none" as const},expectedVersion:s.version}));
 for(const target of plan.targets)changes.push({model:target,expectedVersion:plan.operation==="evolve"?sources[0]!.version:null});
 return registry.applyModelBatch(changes,authority);
}

/** Maps canonical PIF.3 models to the existing SQL owner, without creating a second model store. */
export function specialistModelDatabaseRow(model:SpecialistModelContract):Readonly<Record<string,unknown>>{
 assertModelShape(model);validateSpecialistModel(model);
 const aliases:Record<string,string>={key:"specialist_id",capabilityKeys:"capabilities"};
 return Object.freeze(Object.fromEntries(Object.entries(model).map(([key,value])=>[aliases[key]??key.replace(/[A-Z]/g,c=>"_"+c.toLowerCase()),value])));
}
/** Trusted server persistence adapter. The caller must apply current C2 policy before opening
 * this transaction. SQL rechecks expected versions atomically and appends immutable PIF.3 history. */
export class PostgresSpecialistEvolutionStore {
 constructor(private readonly query:(sql:string,params:unknown[])=>Promise<{rows:{models:unknown}[]}>){}
 async apply(ownerId:string,changes:readonly {model:SpecialistModelContract;expectedVersion:number|null}[],authorityEvidenceIds:readonly string[]):Promise<unknown>{
  for(const id of authorityEvidenceIds)assertIdentifierKind(id,"evidence");
  const result=await this.query("select command_center_private.apply_specialist_model_batch($1::uuid,$2::jsonb,$3::text[]) as models",[ownerId,JSON.stringify(changes.map(c=>({expectedVersion:c.expectedVersion,model:specialistModelDatabaseRow(c.model)}))),[...authorityEvidenceIds]]);
  if(!result.rows[0])throw new Error("Specialist model batch was not persisted");return result.rows[0].models;
 }
}

import { ProtectedActionGate } from "../security/protected-gate.js";
import { ProtectedAuthorizationRegistry } from "../security/protected-authorizations.js";
import { createIntentBinding } from "../security/intent.js";
import type { EnvironmentName } from "../kernel/config.js";
import type { SpecialistScope, SpecialistInteroperabilityDependencies } from "./interoperability.js";
export function specialistEvolutionIntent(scope:SpecialistScope,plan:SpecialistEvolution,review:SpecialistEvolutionReview,environment:EnvironmentName){return {action:"specialists.lifecycle",ownerId:scope.ownerId,scope:{...scope,environment},targetResourceId:JSON.stringify([...plan.sources.map(s=>s.id),...plan.targets.map(t=>t.key)]),parameters:{plan,review},maximumCostCents:0};}
export function specialistEvolutionC2Authorization(gate:ProtectedActionGate,grants:ProtectedAuthorizationRegistry,registry:SpecialistBrainRegistry,sessionId:string,scope:SpecialistScope,environment:EnvironmentName,now:()=>string,evidence:SpecialistInteroperabilityDependencies["evidence"]):(plan:SpecialistEvolution,review:SpecialistEvolutionReview)=>boolean{
 return (plan,review)=>{try{
  // A project-scoped session cannot mutate a multi-company/project specialist definition.
  const models=[...plan.targets,...plan.sources.map(s=>registry.getModel(s.id))];
  if(models.some(m=>!m||m.supportedCompanyIds.some(id=>id!==scope.companyId)||m.supportedProjectIds.some(id=>id!==scope.projectId)))return false;
  const intent=specialistEvolutionIntent(scope,plan,review,environment),binding=createIntentBinding(intent),at=now();
  for(const id of [...review.evaluationEvidenceIds,...review.authorizationEvidenceIds,...plan.targets.flatMap(m=>[...m.evaluationEvidenceIds,...m.provenanceEvidenceIds,m.rollbackEvidenceId])]){
   assertIdentifierKind(id,"evidence");const p=evidence(id);
   if(!p||p.record.id!==id||p.scope.ownerId!==scope.ownerId||(!(p.scope.companyId===scope.companyId&&p.scope.projectId===scope.projectId)&&p.shareable!==true)||!evidenceMeets(p.record,"canonical_record")||!Number.isFinite(Date.parse(p.record.recordedAt))||Date.parse(p.record.recordedAt)>Date.parse(at)||!Number.isFinite(Date.parse(p.expiresAt))||Date.parse(p.expiresAt)<=Date.parse(at))return false;
  }
  if(review.authorizationEvidenceIds.length!==1)return false;
  const grant=grants.assertUsable(review.authorizationEvidenceIds[0]!,{ownerId:scope.ownerId,sessionId,action:intent.action,authorizationIntentBinding:binding},at);
  if(grant.authoritySource!=="owner_verified")return false;
  return gate.authorize({sessionId,action:intent.action,resourceOwnerId:scope.ownerId,resourceCompanyId:scope.companyId,resourceProjectId:scope.projectId,resourceEnvironment:environment,now:at,intent,authorizationIntentBinding:binding}).allowed;
 }catch{return false;}};
}

/** Persist an independently verified batch before updating the canonical in-process cache.
 * A storage failure leaves the cache unchanged; a concurrent cache conflict requires reload,
 * never blind replay or an attempt to undo newer database work. */
export async function commitSpecialistEvolution(ownerId:string,registry:SpecialistBrainRegistry,store:PostgresSpecialistEvolutionStore,plan:SpecialistEvolution,authority:SpecialistControlAuthority,review:SpecialistEvolutionReview,authorize:(plan:SpecialistEvolution,review:SpecialistEvolutionReview)=>boolean):Promise<readonly SpecialistModelContract[]>{
 const shadow=new SpecialistBrainRegistry();
 for(const model of registry.listModels())shadow.registerModel(model,authority);
 const next=applySpecialistEvolution(shadow,plan,authority,review,authorize);
 const changes=next.map(model=>({model,expectedVersion:registry.getModel(model.key)?.version??null}));
 if(!authorize(plan,review))throw new Error("Current specialist evolution authorization denied before persistence");
 await store.apply(ownerId,changes,authority.evidenceIds);
 try{return registry.applyModelBatch(changes,authority);}catch{throw new Error("Specialist evolution persisted; reload canonical model versions before retry");}
}
