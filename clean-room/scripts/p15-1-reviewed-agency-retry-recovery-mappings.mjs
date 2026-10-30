/** Exact Agency retry/failure/recovery mappings. Runtime/schema changes for CCR-00422..00424 landed separately and are qualified only by the named executable proof below. */
export function reviewedAgencyRetryRecoveryMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const ladderDurable=t('category7-work-ladder-persistence','P7.12 durable Work ladder only escalates capability/complexity within explicit scope and never auto-launches Work');
 const ladderRuntime=t('category7-work-ladder-persistence','P7.12 runtime retries transient failure once, blocks false Work boundaries, and respects rung ceiling');
 const ladderFoundation=t('agency-foundation','Work ladder escalates only on capability/complexity and never on quota/provider/user/protected blockers');
 const breakerLifecycle=t('category7-circuit-breaker-dead-letter','P7 resilience project circuit breaker opens at threshold blocks during cooldown probes half-open and recovers');
 const breakerProbeFailure=t('category7-circuit-breaker-dead-letter','P7 resilience failed half-open probe reopens and refreshes cooldown');
 const portfolioBreaker=t('category7-circuit-breaker-dead-letter','P7 resilience portfolio circuit breaker is independent from project breakers');
 const breakerInvalid=t('category7-circuit-breaker-dead-letter','P7 resilience invalid breaker configuration and unpermitted transitions fail closed');
 const deadLetterCreate=t('category7-circuit-breaker-dead-letter','P7 resilience exhausted and permanent failures enter dead-letter while blockers stay distinct');
 const deadLetterManage=t('category7-circuit-breaker-dead-letter','P7 resilience dead-letter requeue and resolution preserve history and never authorize completion');
 const deadLetterReject=t('category7-circuit-breaker-dead-letter','P7 resilience dead-letter management rejects scope mismatch stale time and repeated transitions');
 const durableResilience=t('category7-circuit-breaker-dead-letter','P7 resilience durable migration is owner-scoped read-only and evidence-gated');
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
   id:'CCR-00422',owningPhases:['P7.12'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency project circuit-breaker intelligence'],
   implementationLocations:['clean-room/src/agency/resilience.ts#createCircuitBreaker','clean-room/src/agency/resilience.ts#requestCircuitBreakerPermit','clean-room/src/agency/resilience.ts#recordCircuitBreakerFailure','clean-room/src/agency/resilience.ts#recordCircuitBreakerSuccess','supabase/migrations/20261030030000_category7_circuit_breaker_dead_letter.sql'],
   tests:{positive:{applicable:true,references:[breakerLifecycle,durableResilience],justification:null},negative:{applicable:true,references:[breakerInvalid],justification:null},failurePath:{applicable:true,references:[breakerProbeFailure],justification:null}},
   evidence:['Exact parked circuit-breaker requirement was revisited only after a named runtime contract, durable owner-scoped migration, and positive/negative/failure-path executable proof were added.'],
   closureNotes:'Project breakers now have explicit closed/open/half-open state, failure threshold, cooldown, single half-open probe, versioned evidence, recovery on successful probe, and cooldown refresh after a failed probe. Open state blocks execution rather than masquerading as completion.'
  },
  {
   id:'CCR-00423',owningPhases:['P7.10'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency portfolio execution circuit breaker'],
   implementationLocations:['clean-room/src/agency/resilience.ts#CircuitBreakerScope','clean-room/src/agency/resilience.ts#createCircuitBreaker','supabase/migrations/20261030030000_category7_circuit_breaker_dead_letter.sql'],
   tests:{positive:{applicable:true,references:[portfolioBreaker,durableResilience],justification:null},negative:{applicable:true,references:[breakerInvalid],justification:null},failurePath:{applicable:true,references:[breakerProbeFailure],justification:null}},
   evidence:['The parked portfolio-breaker row is promoted only after explicit portfolio scope exists independently of project breaker identity and is covered by the same durable fail-closed lifecycle.'],
   closureNotes:'Portfolio breakers are first-class scope records rather than inferred from one project breaker. They retain independent identity/state/threshold/cooldown/evidence and cannot claim a project/run identity in the durable contract.'
  },
  {
   id:'CCR-00424',owningPhases:['P7.1','P7.18'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency dead-letter and blocked-task management'],
   implementationLocations:['clean-room/src/agency/resilience.ts#createDeadLetter','clean-room/src/agency/resilience.ts#manageDeadLetter','supabase/migrations/20261030030000_category7_circuit_breaker_dead_letter.sql'],
   tests:{positive:{applicable:true,references:[deadLetterCreate,deadLetterManage,durableResilience],justification:null},negative:{applicable:true,references:[deadLetterReject],justification:null},failurePath:{applicable:true,references:[deadLetterCreate,deadLetterReject],justification:null}},
   evidence:['The parked dead-letter/blocked-task row is promoted only after explicit durable records and governed transitions were added rather than treating retry attempts or Shift Manager blocker labels as equivalent proof.'],
   closureNotes:'Retry-exhausted/permanent failures enter dead-letter state; owner/input blockers remain a distinct blocked state. Requeue/resolve actions require exact scope, non-stale time, reason and evidence, preserve history, and always keep task_completion_authorized=false so queue management cannot fabricate task completion.'
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
