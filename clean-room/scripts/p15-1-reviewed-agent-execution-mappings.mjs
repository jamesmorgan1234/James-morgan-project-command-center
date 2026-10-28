/** Existing Project Agent / Project Auto / durable Agency state proof only; no runtime or schema implementation changes. */
export function reviewedAgentExecutionMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const durableState=t('category7-run-job-task-state','P7.1 durable Agency state models make queued/working/completed semantics explicit');
 const runTransitions=t('category7-run-job-task-state','P7.1 runtime run transitions reject fake completion and invalid recovery paths');
 const durableAgent=t('category7-project-agent-persistence','P7.1 durable Project Agent is server-authoritative, versioned, generation-fenced, and checkpoint scoped');
 const agentRuntime=t('category7-project-agent-persistence','P7.1 runtime Project Agent state survives worker replacement semantics');
 const autoDurable=t('category7-project-auto-persistence','P7.9 durable Project Auto binds one exact project/checkpoint/generation and returns working or truthful blocker');
 const autoRuntime=t('category7-project-auto-persistence','P7.9 runtime Project Auto never drifts projects or fakes queued state');
 return[
  {
   id:'CCR-00381',
   owningPhases:['P7.1'],
   dependencies:['C1','C2','C3','C5','C6'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency / Project Agent execution infrastructure'],
   implementationLocations:['clean-room/src/agency/project-agent.ts#ProjectAgentStore','clean-room/src/agency/project-agent.ts#ProjectAgentState'],
   tests:{
    positive:{applicable:true,references:[durableAgent,agentRuntime],justification:null},
    negative:{applicable:true,references:[durableAgent],justification:null},
    failurePath:{applicable:true,references:[agentRuntime],justification:null}
   },
   evidence:['Exact canonical requirement reviewed against existing persistent Project Agent execution state and named executable proof. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'Project Agent is persisted as server-authoritative execution state with mission, queues, checkpoints, versions, generation fencing and replaceable worker leases. The runtime proof shows worker replacement does not erase the Project Agent mission/checkpoint state, establishing execution infrastructure beyond a chat persona.'
  },
  {
   id:'CCR-00382',
   owningPhases:['P7.9'],
   dependencies:['C1','C2','C3','C5','C6'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Project Auto immediate owner-directed dispatch'],
   implementationLocations:['clean-room/src/agency/modes.ts#activateProjectAuto','clean-room/src/agency/modes.ts#ProjectAutoActivationResult'],
   tests:{
    positive:{applicable:true,references:[autoRuntime],justification:null},
    negative:{applicable:true,references:[autoDurable,autoRuntime],justification:null},
    failurePath:{applicable:true,references:[autoDurable],justification:null}
   },
   evidence:['Exact canonical requirement reviewed against existing Project Auto dispatch implementation and named executable proof. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'Given an authorized project_auto run, selected project, first ready task and eligible executor, activateProjectAuto immediately returns working with the exact run/project/task/executor. Missing readiness, executor eligibility or scope returns a truthful blocker instead of queued fiction.'
  },
  {
   id:'CCR-00384',
   owningPhases:['P7.1'],
   dependencies:['C1','C2','C3','C5','C6'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Durable Agency run state'],
   implementationLocations:['clean-room/src/agency/types.ts#AgencyRun','clean-room/src/agency/types.ts#transitionRun'],
   tests:{
    positive:{applicable:true,references:[durableState,runTransitions],justification:null},
    negative:{applicable:true,references:[runTransitions],justification:null},
    failurePath:{applicable:true,references:[runTransitions],justification:null}
   },
   evidence:['Exact canonical requirement reviewed against existing Agency run model, durable schema and transition tests. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'AgencyRun has explicit owner/project/control-mode/objective/state/authorization/generation/timestamps/stop/pause fields, while durable storage persists run history and rejects invalid transitions or fake completion paths.'
  },
  {
   id:'CCR-00385',
   owningPhases:['P7.1'],
   dependencies:['C1','C2','C3','C5','C6'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Durable Agency task state'],
   implementationLocations:['clean-room/src/agency/types.ts#AgencyTask','clean-room/src/agency/types.ts#AgencyTaskState'],
   tests:{
    positive:{applicable:true,references:[durableState],justification:null},
    negative:{applicable:true,references:[durableState],justification:null},
    failurePath:{applicable:true,references:[durableState],justification:null}
   },
   evidence:['Exact canonical requirement reviewed against existing Agency task model and durable schema proof. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'AgencyTask explicitly carries run/project identity, lifecycle state, dependencies, capability, risk, environment, evidence, idempotency and blocker state; the durable P7.1 schema persists tasks/jobs/runs and state events with checkpoints, retries and verification evidence.'
  }
 ];
}
