/** Existing Agency retry/failure-classification/reconciliation proof only; no runtime or schema implementation changes. */
export function reviewedAgencyRetryRecoveryMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const ladderDurable=t('category7-work-ladder-persistence','P7.12 durable Work ladder only escalates capability/complexity within explicit scope and never auto-launches Work');
 const ladderRuntime=t('category7-work-ladder-persistence','P7.12 runtime retries transient failure once, blocks false Work boundaries, and respects rung ceiling');
 const ladderFoundation=t('agency-foundation','Work ladder escalates only on capability/complexity and never on quota/provider/user/protected blockers');
 const outboxClaim=t('category7-side-effect-outbox-inbox','side-effect claims are atomic, fenced, and exclude dispatched or unknown effects from retry');
 const outboxDispatch=t('category7-side-effect-outbox-inbox','dispatch is generation-bound and records external-effect possibility before any retry can occur');
 const outboxReconcile=t('category7-side-effect-outbox-inbox','unknown external outcomes must reconcile to no-effect or succeeded before retry');
 return[
  {
   id:'CCR-00418',owningPhases:['P7.12'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency bounded retry policy'],
   implementationLocations:['clean-room/src/agency/work-ladder.ts#decideWorkLadder'],
   tests:{positive:{applicable:true,references:[ladderRuntime,ladderFoundation],justification:null},negative:{applicable:true,references:[ladderRuntime],justification:null},failurePath:{applicable:true,references:[ladderRuntime,ladderFoundation],justification:null}},
   evidence:['Exact canonical requirement reviewed against the existing Agency Work-ladder retry budget and named executable proof.'],
   closureNotes:'Transient network/provider-timeout failures get at most one retry at the same rung; after one transient retry the decision becomes block rather than silently extending the retry budget.'
  },
  {
   id:'CCR-00419',owningPhases:['P7.12'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency retry/failure classification'],
   implementationLocations:['clean-room/src/agency/work-ladder.ts#FailureClass','clean-room/src/agency/work-ladder.ts#decideWorkLadder'],
   tests:{positive:{applicable:true,references:[ladderDurable,ladderRuntime,ladderFoundation],justification:null},negative:{applicable:true,references:[ladderRuntime],justification:null},failurePath:{applicable:true,references:[ladderFoundation],justification:null}},
   evidence:['Exact canonical requirement reviewed against explicit Agency FailureClass vocabulary and executable decision proof.'],
   closureNotes:'Agency failures are explicitly classified into transient connectivity/provider timeout, provider unavailable, quota, credentials, missing input, owner/protected boundaries, capability insufficiency, complexity and verification failure before retry/escalate/block is selected.'
  },
  {
   id:'CCR-00420',owningPhases:['P7.12'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency capability-versus-connectivity failure handling'],
   implementationLocations:['clean-room/src/agency/work-ladder.ts#FailureClass','clean-room/src/agency/work-ladder.ts#decideWorkLadder'],
   tests:{positive:{applicable:true,references:[ladderRuntime,ladderFoundation],justification:null},negative:{applicable:true,references:[ladderRuntime],justification:null},failurePath:{applicable:true,references:[ladderFoundation],justification:null}},
   evidence:['Exact canonical requirement reviewed against distinct capability_insufficient and transient_network/provider-timeout branches with executable proof.'],
   closureNotes:'Capability insufficiency is an escalation-class failure, while transient connectivity is a one-retry class; the runtime does not collapse those conditions into the same retry behavior.'
  },
  {
   id:'CCR-00421',owningPhases:['P7.12'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency quota-versus-capability failure handling'],
   implementationLocations:['clean-room/src/agency/work-ladder.ts#FailureClass','clean-room/src/agency/work-ladder.ts#decideWorkLadder'],
   tests:{positive:{applicable:true,references:[ladderDurable,ladderFoundation],justification:null},negative:{applicable:true,references:[ladderRuntime],justification:null},failurePath:{applicable:true,references:[ladderFoundation],justification:null}},
   evidence:['Exact canonical requirement reviewed against distinct quota_unavailable and capability_insufficient branches with executable proof.'],
   closureNotes:'Quota unavailability blocks rather than being misreported as capability insufficiency; capability insufficiency may escalate only within the authorized Work ladder.'
  },
  {
   id:'CCR-00425',owningPhases:['P7.1'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency interrupted external-action reconciliation'],
   implementationLocations:['supabase/migrations/20261025014500_category7_side_effect_outbox_inbox.sql'],
   tests:{positive:{applicable:true,references:[outboxReconcile],justification:null},negative:{applicable:true,references:[outboxClaim,outboxDispatch],justification:null},failurePath:{applicable:true,references:[outboxReconcile,outboxDispatch],justification:null}},
   evidence:['Exact canonical requirement reviewed against durable uncertain/interrupted external-effect reconciliation and retry gating proof.'],
   closureNotes:'When dispatch may have produced an external effect, the durable state records that possibility, excludes the effect from ordinary retry, marks unresolved outcomes unknown, and requires reconciliation to succeeded or no_effect before any retry can be considered.'
  }
 ];
}
