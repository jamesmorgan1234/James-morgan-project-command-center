/** Existing Agency run-state and Work-ladder proof only; no runtime or schema implementation changes. */
export function reviewedAgencyRunWorkLadderMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const runDurable=t('category7-run-job-task-state','P7.1 durable Agency state models make queued/working/completed semantics explicit');
 const runRuntime=t('category7-run-job-task-state','P7.1 runtime run transitions reject fake completion and invalid recovery paths');
 const ladderDurable=t('category7-work-ladder-persistence','P7.12 durable Work ladder only escalates capability/complexity within explicit scope and never auto-launches Work');
 const ladderRuntime=t('category7-work-ladder-persistence','P7.12 runtime retries transient failure once, blocks false Work boundaries, and respects rung ceiling');
 return[
  {
   id:'CCR-00430',owningPhases:['P7.1'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency paused-run lifecycle'],
   implementationLocations:['clean-room/src/agency/types.ts#AgencyRunState','clean-room/src/agency/types.ts#transitionRun','supabase/migrations/20261024152500_category7_run_job_task_state.sql'],
   tests:{positive:{applicable:true,references:[runDurable],justification:null},negative:{applicable:true,references:[runRuntime],justification:null},failurePath:{applicable:true,references:[runDurable,runRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against the existing paused run state, transition table, pause-request fence, durable state model and named executable proof.'],
   closureNotes:'Paused is an explicit durable run state; queued/working may enter paused, paused may resume to queued/working or stop, and a pause-requested run is forbidden from entering working until that condition is resolved.'
  },
  {
   id:'CCR-00431',owningPhases:['P7.1'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency stopped-run lifecycle'],
   implementationLocations:['clean-room/src/agency/types.ts#AgencyRunState','clean-room/src/agency/types.ts#transitionRun','supabase/migrations/20261024152500_category7_run_job_task_state.sql'],
   tests:{positive:{applicable:true,references:[runDurable,runRuntime],justification:null},negative:{applicable:true,references:[runRuntime],justification:null},failurePath:{applicable:true,references:[runDurable,runRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against the existing stopped terminal state, stop-request fence, durable transition model and named executable proof.'],
   closureNotes:'Stopped is an explicit terminal run state with no onward runtime transitions; once stopRequested is set, any transition other than stopped is rejected, and durable transitions advance generation on stop.'
  },
  {
   id:'CCR-00461',owningPhases:['P7.12'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency Work ladder'],
   implementationLocations:['clean-room/src/agency/work-ladder.ts#WorkRung','clean-room/src/agency/work-ladder.ts#decideWorkLadder','supabase/migrations/20261024162000_category7_work_ladder.sql'],
   tests:{positive:{applicable:true,references:[ladderDurable,ladderRuntime],justification:null},negative:{applicable:true,references:[ladderRuntime],justification:null},failurePath:{applicable:true,references:[ladderRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against the explicit ordered Work-rung model and durable/runtime proof.'],
   closureNotes:'Agency has an ordered normal_chat -> luna_high -> sol_light -> sol_medium ladder with an explicit ceiling, authorization-gated escalation, retry/block decisions and no automatic Work launch.'
  },
  {
   id:'CCR-00462',owningPhases:['P7.12'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency same-rung retry policy'],
   implementationLocations:['clean-room/src/agency/work-ladder.ts#decideWorkLadder'],
   tests:{positive:{applicable:true,references:[ladderRuntime],justification:null},negative:{applicable:true,references:[ladderRuntime],justification:null},failurePath:{applicable:true,references:[ladderRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against the existing transient same-rung retry-before-escalation decision and executable proof.'],
   closureNotes:'Transient network/provider-timeout failure returns retry_once at the current rung before any escalation is considered; the retry is exactly bounded and then blocks.'
  },
  {
   id:'CCR-00464',owningPhases:['P7.12'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency Work escalation boundary'],
   implementationLocations:['clean-room/src/agency/work-ladder.ts#FailureClass','clean-room/src/agency/work-ladder.ts#decideWorkLadder','supabase/migrations/20261024162000_category7_work_ladder.sql'],
   tests:{positive:{applicable:true,references:[ladderDurable,ladderRuntime],justification:null},negative:{applicable:true,references:[ladderRuntime],justification:null},failurePath:{applicable:true,references:[ladderDurable],justification:null}},
   evidence:['Exact canonical requirement reviewed against the existing capability/complexity-only escalation contract and named executable proof.'],
   closureNotes:'Only capability_insufficient and execution_complexity reach the escalation branch; provider, quota, credential, missing-input, user, protected and verification failures block instead of masquerading as capability boundaries.'
  },
  {
   id:'CCR-00465',owningPhases:['P7.12'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency Work scope preservation'],
   implementationLocations:['clean-room/src/agency/work-ladder.ts#WorkAuthorization','clean-room/src/agency/work-ladder.ts#decideWorkLadder','supabase/migrations/20261024162000_category7_work_ladder.sql'],
   tests:{positive:{applicable:true,references:[ladderDurable],justification:null},negative:{applicable:true,references:[ladderDurable,ladderRuntime],justification:null},failurePath:{applicable:true,references:[ladderDurable],justification:null}},
   evidence:['Exact canonical requirement reviewed against explicit Work authorization/rung ceilings plus durable requested-scope-subset enforcement.'],
   closureNotes:'Escalation cannot broaden authorized scope: durable work-ladder proof enforces requested scopes as a subset of authorized scopes, protected-action authority stays false, and runtime escalation cannot exceed the authorized rung ceiling.'
  }
 ];
}
