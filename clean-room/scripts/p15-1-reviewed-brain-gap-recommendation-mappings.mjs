/** Existing knowledge-gap/recommendation/risk proof only; no runtime or schema implementation changes. */
export function reviewedBrainGapRecommendationMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const unknown=t('p13-9-governance-critic','P13.9 measured routing/calibration/method/correlation weaknesses produce bounded proposals; absent evidence stays unknown');
 const epistemic=t('pif5-epistemics','PIF.5 uncertain states cannot manufacture certainty and high-impact routing raises threshold');
 const optimizer=t('p13-9-governance-critic','P13.9 optimizer proposals are evidence-backed, revocable, bounded and never execute or promote');
 const integrated=t('pif-integrated-hardening','PIF integrated acceptance chains PIF.1-10 with scoped exact-version evidence and downstream invalidation');
 return[
  {
   id:'CCR-00334',
   owningPhases:['PIF.5','P13.9'],
   dependencies:['C1','C2','C3','C5','C6','C7','IF','C8','C12'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Brain knowledge-gap / epistemic detection'],
   implementationLocations:['clean-room/src/data/epistemics.ts#resolveEpistemicAssessments','clean-room/src/analytics/self-audit.ts#inspectEcosystemGovernance'],
   tests:{
    positive:{applicable:true,references:[unknown],justification:null},
    negative:{applicable:true,references:[epistemic],justification:null},
    failurePath:{applicable:true,references:[epistemic],justification:null}
   },
   evidence:['Exact canonical requirement reviewed against existing unknown/abstain paths and named executable proof. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'The epistemic resolver emits unknown/abstain rather than manufacturing certainty when current applicable knowledge is absent or insufficient, and the governance inspector explicitly records absent evidence in its unknown list before proposal generation.'
  },
  {
   id:'CCR-00337',
   owningPhases:['P13.9'],
   dependencies:['C1','C2','C3','C5','C6','C7','IF','C8','C12'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Recommendation / ecosystem optimization engine'],
   implementationLocations:['clean-room/src/analytics/self-audit.ts#ecosystemOptimizer','clean-room/src/analytics/self-audit.ts#inspectEcosystemGovernance'],
   tests:{
    positive:{applicable:true,references:[optimizer,unknown],justification:null},
    negative:{applicable:true,references:[optimizer],justification:null},
    failurePath:{applicable:true,references:[unknown],justification:null}
   },
   evidence:['Exact canonical requirement reviewed against the existing governed optimizer and named executable proposal-generation proof. No runtime, analytics schema, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'Measured routing/calibration/method/correlation weaknesses are converted into bounded evidence-backed GovernanceProposal records by ecosystemOptimizer; proposals are revocable, expire, cannot self-apply, and the engine exposes unknown observations instead of inventing recommendations.'
  },
  {
   id:'CCR-00343',
   owningPhases:['PIF.10'],
   dependencies:['C1','C2','C3','C5','C6','C7'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Recommendation / self-improvement risk governance'],
   implementationLocations:['clean-room/src/brain/improvement-governor.ts#ImprovementRiskClass','clean-room/src/brain/improvement-governor.ts#SelfImprovementGovernor.assessRisk'],
   tests:{
    positive:{applicable:true,references:[integrated],justification:null},
    negative:{applicable:false,references:[],justification:'This row requires explicit risk classification in the governed recommendation lifecycle; separate authorization/scope gates govern invalid or unsafe transitions.'},
    failurePath:{applicable:false,references:[],justification:'Failure and rollback semantics are governed by the same improvement lifecycle but are separate requirements from the presence of risk classification.'}
   },
   evidence:['Exact canonical requirement reviewed against existing self-improvement risk classification and integrated PIF acceptance proof. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'SelfImprovementGovernor carries an explicit low/moderate/high/critical risk class and requires the lifecycle to pass through risk_assessed; the integrated PIF acceptance test executes assessRisk with a moderate classification before evaluation and authorization.'
  }
 ];
}
