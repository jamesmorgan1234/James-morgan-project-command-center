/** Existing Brain/provider/context/planning proof only; no runtime or schema implementation changes. */
export function reviewedBrainContextMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const ai=t('brain-foundation','AI routing preserves free-first/privacy/health and can replace providers');
 const context=t('brain-foundation','context builder minimizes by owner/project/relevance/sensitivity/freshness');
 const contextBoundary=t('category6-context-builder-persistence','P6.4 Context Builder filters cross-project, stale, sensitivity and low-relevance candidates');
 const plannerDurable=t('category6-planner-persistence','P6.5 durable planner keeps truth classes, evidence/confidence and proposed actions separate from execution');
 const plannerReject=t('category6-planner-persistence','P6.5 planning validator rejects unsupported certainty and unbounded uncertainty');
 const g=(ids,phase,loc,pos,neg,notes)=>ids.map(id=>({
  id,
  owningPhases:[phase],
  dependencies:['C1','C2','C3','C5'],
  dependenciesVerified:true,
  applicableCompaniesOrCapabilities:['Command Center','Brain / context / decision-support platform'],
  implementationLocations:loc,
  tests:{
   positive:{applicable:true,references:[pos],justification:null},
   negative:{applicable:true,references:[neg],justification:null},
   failurePath:{applicable:true,references:[neg],justification:null}
  },
  evidence:['Exact canonical requirement reviewed against existing Brain source and executable named proof. Qualification reuses unchanged source-bound runtime/test evidence; no runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
  closureNotes:notes
 }));
 return[
  ...g(['CCR-00322'],'P6.2',['clean-room/src/brain/providers.ts#AiRouteRegistry','clean-room/src/brain/providers.ts#AiModelRoute'],ai,ai,'AI provider/model routes are registered behind a replaceable registry with explicit provider/model/version/capability/cost/privacy/health/quota metadata; the executable proof removes a provider route and verifies policy-preserving replacement behavior.'),
  ...g(['CCR-00325'],'P6.4',['clean-room/src/brain/context-builder.ts#buildBrainContext','clean-room/src/brain/context-builder.ts#BrainContextRequest'],context,contextBoundary,'The context builder accepts an explicit project scope and emits an immutable project-scoped packet; cross-project, stale, over-sensitive and low-relevance candidates are rejected by named executable proof.'),
  ...g(['CCR-00327'],'P6.4',['clean-room/src/brain/context-builder.ts#buildBrainContext','clean-room/src/brain/context-builder.ts#BrainContextPacket'],context,contextBoundary,'Project context is selected only when item.projectId matches request.projectId; the executable boundary test proves cross-project candidates are excluded rather than silently mixed into a broader context.'),
  ...g(['CCR-00330'],'P6.5',['clean-room/src/brain/planning.ts#ClaimClass','clean-room/src/brain/planning.ts#validateBrainPlan'],plannerDurable,plannerReject,'The planner models owner_decision and recommendation as distinct claim classes and keeps proposed actions separate from execution; unsupported certainty and unbounded uncertainty fail validation.'),
  ...g(['CCR-00333'],'P6.5',['clean-room/src/brain/planning.ts#PlanningClaim','clean-room/src/brain/planning.ts#validateBrainPlan'],plannerDurable,plannerReject,'Uncertain claim classes require explicit bounded confidence while evidence-backed fact/decision claims require sources; named executable proof rejects missing confidence and unsupported certainty.'),
  ...g(['CCR-00336'],'P6.4',['clean-room/src/brain/context-builder.ts#buildBrainContext','clean-room/src/brain/context-builder.ts#BrainContextPacket'],context,contextBoundary,'The context builder evaluates staleAfter against the build time, excludes stale items and reports omittedStaleIds; named executable proof explicitly checks stale-context exclusion.')
 ];
}
