/** Existing capability/project-lock/classification/verification proof only; no runtime or schema implementation changes. */
export function reviewedAgencyLockClassificationMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const capabilityPositive=t('category1-p1-2-registry-capability-fabric','P1.2 capability fabric registers discovers enables disables and unregisters an extensible capability');
 const capabilityNegative=t('category1-p1-2-registry-capability-fabric','P1.2 capability registry fails closed on duplicate invalid and stale lifecycle mutations');
 const preflightDurable=t('category7-protected-preflight','P7.20 durable protected preflight validates exact live scope without consuming authorization');
 const preflightRuntime=t('category7-protected-preflight','P7.20 runtime protected preflight rejects wrong project, stale auth, provider health and credential scope');
 const booksDurable=t('category7-agent-auto-portfolio','P7.10 durable Agent Auto uses stored priority, explicit authorization, concurrency limits and Books exclusion');
 const booksRuntime=t('category7-agent-auto-portfolio','P7.10 runtime eligibility rejects excluded projects and Books');
 const executorDurable=t('category7-executor-registry-persistence','P7.2 durable executor registry is versioned, scoped and browser read-only');
 const executorRuntime=t('category7-executor-registry-persistence','P7.2 runtime registry remains capability/risk/free-first driven and replaceable');
 const stateDurable=t('category7-run-job-task-state','P7.1 durable Agency state models make queued/working/completed semantics explicit');
 const verifyDurable=t('category7-independent-verification','P7.16 durable verification enforces separation of duties for high/critical risk');
 const verifyRuntime=t('category7-independent-verification','P7.16 runtime high-risk executor cannot self-certify');
 return[
  {
   id:'CCR-00396',owningPhases:['P1.2'],dependencies:['C0'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Canonical Capability Registry'],
   implementationLocations:['clean-room/src/kernel/capabilities.ts#CapabilityRegistry','clean-room/src/kernel/capabilities.ts#CapabilityContract'],
   tests:{positive:{applicable:true,references:[capabilityPositive],justification:null},negative:{applicable:true,references:[capabilityNegative],justification:null},failurePath:{applicable:true,references:[capabilityNegative],justification:null}},
   evidence:['Exact canonical requirement reviewed against the existing extensible versioned Capability Registry and named executable proof.'],
   closureNotes:'Capabilities are canonical registry records with versions, enablement, input/output compatibility, maturity and security metadata; registration/discovery/lifecycle changes are data-driven and fail closed on duplicate, invalid or stale mutations.'
  },
  {
   id:'CCR-00400',owningPhases:['P7.20'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency protected project lock'],
   implementationLocations:['clean-room/src/agency/protected.ts#ProtectedPreflight','clean-room/src/agency/protected.ts#assertProtectedPreflight'],
   tests:{positive:{applicable:true,references:[preflightDurable,preflightRuntime],justification:null},negative:{applicable:true,references:[preflightRuntime],justification:null},failurePath:{applicable:true,references:[preflightDurable],justification:null}},
   evidence:['Exact canonical requirement reviewed against protected-preflight project lock and executable proof.'],
   closureNotes:'Protected execution requires the requested project, project lock and credential project to match exactly; wrong-project scope fails before authorization consumption or side effect execution.'
  },
  {
   id:'CCR-00403',owningPhases:['P7.10'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agent Auto Books target lock'],
   implementationLocations:['clean-room/src/agency/modes.ts#assertAgentAutoProjectEligible'],
   tests:{positive:{applicable:true,references:[booksDurable,booksRuntime],justification:null},negative:{applicable:true,references:[booksRuntime],justification:null},failurePath:{applicable:true,references:[booksDurable],justification:null}},
   evidence:['Exact canonical requirement reviewed against explicit Books portfolio-auto exclusion and named executable proof.'],
   closureNotes:'Agent Auto eligibility explicitly rejects project types beginning with project-type:book, and the durable selector encodes books_portfolio_auto_excluded rather than allowing Books to enter portfolio automation silently.'
  },
  {
   id:'CCR-00404',owningPhases:['P7.1','P7.2','P7.16'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency task/executor risk classification'],
   implementationLocations:['clean-room/src/agency/types.ts#AgencyRisk','clean-room/src/agency/types.ts#AgencyTask.risk','clean-room/src/agency/registry.ts#AgencyExecutor.maxRisk'],
   tests:{positive:{applicable:true,references:[stateDurable,executorRuntime,verifyDurable],justification:null},negative:{applicable:true,references:[verifyRuntime],justification:null},failurePath:{applicable:true,references:[verifyRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against explicit Agency risk vocabulary, task risk, executor max-risk and risk-dependent verification proof.'],
   closureNotes:'Agency work carries low/medium/high/critical task risk, executor eligibility enforces a maximum supported risk, and high/critical work changes verification requirements.'
  },
  {
   id:'CCR-00406',owningPhases:['P7.1','P7.2'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency task/executor cost classification'],
   implementationLocations:['clean-room/src/agency/registry.ts#AgencyExecutor.costClass','clean-room/src/agency/registry.ts#AgencyExecutorRegistry.eligible'],
   tests:{positive:{applicable:true,references:[stateDurable,executorDurable,executorRuntime],justification:null},negative:{applicable:true,references:[executorRuntime],justification:null},failurePath:{applicable:true,references:[executorRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against explicit free/paid/unknown executor cost classification, durable cost_class storage and free-first eligibility proof.'],
   closureNotes:'Agency executor cost is explicitly classified free/paid/unknown and durable Agency state includes cost_class; runtime eligibility excludes paid execution when allowPaid is false.'
  },
  {
   id:'CCR-00407',owningPhases:['P7.1','P7.2'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency required execution environment'],
   implementationLocations:['clean-room/src/agency/types.ts#AgencyEnvironment','clean-room/src/agency/types.ts#AgencyTask.preferredEnvironment','clean-room/src/agency/registry.ts#AgencyExecutor.environments'],
   tests:{positive:{applicable:true,references:[stateDurable,executorRuntime],justification:null},negative:{applicable:true,references:[executorRuntime],justification:null},failurePath:{applicable:true,references:[executorRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against explicit task preferred-environment and executor-environment eligibility proof.'],
   closureNotes:'Agency tasks classify their preferred environment and executors declare supported environments; eligibility requires an exact environment match rather than dispatching to an incompatible execution lane.'
  },
  {
   id:'CCR-00408',owningPhases:['P7.16'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency task verification requirements'],
   implementationLocations:['clean-room/src/agency/verification.ts#VerificationRequest','clean-room/src/agency/verification.ts#validateIndependentVerification'],
   tests:{positive:{applicable:true,references:[verifyDurable,verifyRuntime],justification:null},negative:{applicable:true,references:[verifyRuntime],justification:null},failurePath:{applicable:true,references:[verifyRuntime],justification:null}},
   evidence:['Exact canonical requirement reviewed against explicit verification request/decision contracts and risk-based separation-of-duties proof.'],
   closureNotes:'Verification requests bind task, executor, verifier, risk and evidence; high/critical work requires a distinct verifier and durable decisions carry a review type and accepted/rejected outcome.'
  },
  {
   id:'CCR-00409',owningPhases:['P7.1','P7.16'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Agency task evidence requirements'],
   implementationLocations:['clean-room/src/agency/types.ts#AgencyTask.evidenceRefs','clean-room/src/agency/verification.ts#VerificationRequest.evidenceRefs'],
   tests:{positive:{applicable:true,references:[stateDurable,verifyDurable,verifyRuntime],justification:null},negative:{applicable:true,references:[verifyRuntime],justification:null},failurePath:{applicable:true,references:[stateDurable],justification:null}},
   evidence:['Exact canonical requirement reviewed against task/verification evidenceRefs and durable completion-evidence requirements.'],
   closureNotes:'Agency tasks and verification requests carry explicit evidence references; verification rejects empty evidence and durable Agency completion requires verification evidence rather than status alone.'
  }
 ];
}
