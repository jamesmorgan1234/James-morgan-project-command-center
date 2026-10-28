/** Existing Agency dependency/state/claim/executor proof only; no runtime or schema implementation changes. */
export function reviewedAgencyHardeningCoreMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const dependencyDurable=t('category7-dependency-scheduler-persistence','P7.6 durable dependency scheduler requires same-project existing dependencies and stable readiness ordering');
 const dependencyRuntime=t('category7-dependency-scheduler-persistence','P7.6 runtime scheduler unlocks only verified/skipped dependencies and safe stealing respects capability/anti-affinity');
 const runDurable=t('category7-run-job-task-state','P7.1 durable Agency state models make queued/working/completed semantics explicit');
 const runRuntime=t('category7-run-job-task-state','P7.1 runtime run transitions reject fake completion and invalid recovery paths');
 const claimDurable=t('category7-task-claims-persistence','P7.4 durable task claims reject stale/expired workers and enforce idempotent single commit');
 const claimRuntime=t('category7-task-claims-persistence','P7.4 runtime task claim fencing rejects stale worker after reclaim');
 const executorDurable=t('category7-executor-registry-persistence','P7.2 durable executor registry is versioned, scoped and browser read-only');
 const executorRuntime=t('category7-executor-registry-persistence','P7.2 runtime registry remains capability/risk/free-first driven and replaceable');
 return[
  {
   id:'CCR-00386',owningPhases:['P7.6'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency durable task dependency graph'],
   implementationLocations:['clean-room/src/agency/dag.ts#validateDependencyGraph','clean-room/src/agency/dag.ts#readyTasks'],
   tests:{positive:{applicable:true,references:[dependencyDurable,dependencyRuntime],justification:null},negative:{applicable:true,references:[dependencyDurable],justification:null},failurePath:{applicable:true,references:[dependencyRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against existing durable dependency graph and named executable proof. No runtime or schema implementation is changed by this mapping.'],
   closureNotes:'Task dependencies are explicit task IDs in the durable same-project/run graph; missing/cross-scope dependencies are rejected and only tasks whose prerequisites are verified/skipped become ready.'
  },
  {
   id:'CCR-00387',owningPhases:['P7.1'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency run lifecycle'],
   implementationLocations:['clean-room/src/agency/types.ts#AgencyRunState','clean-room/src/agency/types.ts#transitionRun'],
   tests:{positive:{applicable:true,references:[runDurable,runRuntime],justification:null},negative:{applicable:true,references:[runRuntime],justification:null},failurePath:{applicable:true,references:[runRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against existing Agency run transition machine and durable state proof.'],
   closureNotes:'Agency runs have an explicit finite state vocabulary and transition table; invalid direct completion, stop/pause violations and illegal recovery paths fail closed.'
  },
  {
   id:'CCR-00389',owningPhases:['P7.4'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency executor task claim / lease'],
   implementationLocations:['clean-room/src/agency/leases.ts#TaskClaim','clean-room/src/agency/leases.ts#TaskClaimStore.claim'],
   tests:{positive:{applicable:true,references:[claimDurable,claimRuntime],justification:null},negative:{applicable:true,references:[claimRuntime],justification:null},failurePath:{applicable:true,references:[claimDurable],justification:null}},
   evidence:['Exact canonical requirement reviewed against existing task-claim lease/fencing implementation and named executable proof.'],
   closureNotes:'Task claims bind task, worker, fencing token, claim time and expiry; a second live claimant is rejected and replacement only occurs after expiry with an advanced fencing token.'
  },
  {
   id:'CCR-00390',owningPhases:['P7.4'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency claim lease expiration'],
   implementationLocations:['clean-room/src/agency/leases.ts#TaskClaim.expiresAt','clean-room/src/agency/leases.ts#TaskClaimStore.assertCommitAllowed'],
   tests:{positive:{applicable:true,references:[claimDurable,claimRuntime],justification:null},negative:{applicable:true,references:[claimDurable],justification:null},failurePath:{applicable:true,references:[claimRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against existing claim expiration/fencing implementation and executable proof.'],
   closureNotes:'Claims carry explicit expiresAt and expired claims cannot commit; a new worker may reclaim after expiry while the old fencing token becomes invalid.'
  },
  {
   id:'CCR-00391',owningPhases:['P7.4'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency stale-claim recovery'],
   implementationLocations:['clean-room/src/agency/leases.ts#TaskClaimStore.claim','clean-room/src/agency/leases.ts#TaskClaimStore.assertCommitAllowed'],
   tests:{positive:{applicable:true,references:[claimRuntime],justification:null},negative:{applicable:true,references:[claimRuntime],justification:null},failurePath:{applicable:true,references:[claimDurable],justification:null}},
   evidence:['Exact canonical requirement reviewed against existing reclaim/fencing recovery and executable proof.'],
   closureNotes:'After lease expiry a replacement worker can reclaim with a higher fencing token; stale worker commits are rejected, providing deterministic stale-claim recovery.'
  },
  {
   id:'CCR-00393',owningPhases:['P7.2'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency executor availability'],
   implementationLocations:['clean-room/src/agency/registry.ts#AgencyExecutor.health','clean-room/src/agency/registry.ts#AgencyExecutorRegistry.eligible'],
   tests:{positive:{applicable:true,references:[executorRuntime],justification:null},negative:{applicable:true,references:[executorRuntime],justification:null},failurePath:{applicable:true,references:[executorDurable],justification:null}},
   evidence:['Exact canonical requirement reviewed against existing enabled/health/capability executor eligibility contract and named executable proof.'],
   closureNotes:'Executor availability is explicit through enabled plus available/degraded/unavailable health and eligibility filtering; unavailable or removed executors are not returned as executable candidates.'
  },
  {
   id:'CCR-00397',owningPhases:['P7.2'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency Executor Registry'],
   implementationLocations:['clean-room/src/agency/registry.ts#AgencyExecutor','clean-room/src/agency/registry.ts#AgencyExecutorRegistry'],
   tests:{positive:{applicable:true,references:[executorDurable,executorRuntime],justification:null},negative:{applicable:true,references:[executorDurable],justification:null},failurePath:{applicable:true,references:[executorRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against existing versioned durable Executor Registry and runtime registry proof.'],
   closureNotes:'Executors are registry-driven records with version, environments, capabilities, project types, permission scopes, cost, health, verification strategy and maximum risk; registration/removal and eligibility are replaceable rather than hard-coded.'
  }
 ];
}
