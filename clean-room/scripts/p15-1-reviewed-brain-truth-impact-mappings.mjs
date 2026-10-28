/** Existing Brain truth/provenance/contradiction/impact proof only; no runtime or schema implementation changes. */
export function reviewedBrainTruthImpactMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const memoryVocabulary=t('category6-memory-governance','P6.3 durable memory migration supports full canonical memory vocabulary and append-only retention evidence');
 const contextEvidence=t('category6-context-builder-persistence','P6.4 durable context build binds selection evidence to immutable owner/project snapshot');
 const plannerEvidence=t('category6-planner-persistence','P6.5 durable planner keeps truth classes, evidence/confidence and proposed actions separate from execution');
 const plannerReject=t('category6-planner-persistence','P6.5 planning validator rejects unsupported certainty and unbounded uncertainty');
 const contradiction=t('pif5-epistemics','PIF.5 material same-authority disagreement abstains and preserves conflicting evidence');
 const contradictionDurable=t('pif5-epistemics','PIF.5 durable schema is an epistemic companion to canonical knowledge, with immutable versions and contradiction records');
 const impact=t('category13-authoritative-acceptance','P13.9 critic/optimizer proposals require requirement impact evidence dependencies and cannot self-apply');
 return[
  {
   id:'CCR-00329',
   owningPhases:['P6.3'],
   dependencies:['C1','C2','C3','C5'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Brain memory / truth taxonomy'],
   implementationLocations:['clean-room/src/brain/memory.ts#MemoryKind','clean-room/src/brain/memory.ts#BrainMemory'],
   tests:{
    positive:{applicable:true,references:[memoryVocabulary],justification:null},
    negative:{applicable:false,references:[],justification:'This requirement is a structural taxonomy separation: fact and rule are distinct canonical memory kinds. Invalid taxonomy behavior is governed by the memory-governance contract rather than a separate rule-vs-fact negative case.'},
    failurePath:{applicable:false,references:[],justification:'No runtime side effect is authorized by this structural separation; malformed memory metadata is handled by the broader memory-governance validators.'}
   },
   evidence:['Exact canonical requirement reviewed against existing Brain memory taxonomy and executable durable-schema proof. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'The canonical Brain memory vocabulary stores fact and rule as distinct memory kinds rather than overloading one truth class; the durable migration test explicitly requires both kinds in the persisted vocabulary.'
  },
  {
   id:'CCR-00332',
   owningPhases:['P6.4','P6.5'],
   dependencies:['C1','C2','C3','C5'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Brain evidence / provenance'],
   implementationLocations:['clean-room/src/brain/core.ts#BrainResponseEnvelope','clean-room/src/brain/memory.ts#BrainMemory','clean-room/src/brain/planning.ts#PlanningClaim'],
   tests:{
    positive:{applicable:true,references:[contextEvidence,plannerEvidence],justification:null},
    negative:{applicable:true,references:[plannerReject],justification:null},
    failurePath:{applicable:true,references:[plannerReject],justification:null}
   },
   evidence:['Exact canonical requirement reviewed against existing Brain evidenceRefs/sourceRefs contracts and named executable proof. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'Brain response, memory and planning contracts retain explicit evidence/source references. Durable context selection binds evidence to immutable owner/project snapshots, while unsupported fact certainty is rejected when evidence is absent.'
  },
  {
   id:'CCR-00335',
   owningPhases:['PIF.5'],
   dependencies:['C1','C2','C3','C5','C6','C7'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Epistemic contradiction detection'],
   implementationLocations:['clean-room/src/data/epistemics.ts#EpistemicResolution','clean-room/src/data/epistemics.ts#resolveEpistemicAssessments'],
   tests:{
    positive:{applicable:true,references:[contradiction],justification:null},
    negative:{applicable:true,references:[contradiction],justification:null},
    failurePath:{applicable:true,references:[contradictionDurable],justification:null}
   },
   evidence:['Exact canonical requirement reviewed against existing epistemic resolution and durable contradiction proof. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'Epistemic resolution explicitly detects same-authority or explicit conflicting assessments, returns abstain, preserves conflicting assessment IDs, and the durable schema records contradiction evidence rather than silently selecting one value.'
  },
  {
   id:'CCR-00341',
   owningPhases:['P13.9'],
   dependencies:['C1','C2','C3','C5','C6','C7','IF','C8','C12'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Recommendation / governance impact analysis'],
   implementationLocations:['clean-room/src/analytics/intelligence-governance.ts#GovernanceProposal','clean-room/src/analytics/intelligence-governance.ts#validateGovernanceProposal'],
   tests:{
    positive:{applicable:true,references:[impact],justification:null},
    negative:{applicable:true,references:[impact],justification:null},
    failurePath:{applicable:true,references:[impact],justification:null}
   },
   evidence:['Exact canonical requirement reviewed against existing governance proposal impact contract and named executable proof. No runtime, analytics schema, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'Governance/recommendation proposals are invalid unless they carry explicit requirementRefs, impactRefs, evidenceRefs and dependencyRefs; the executable acceptance test proves a complete proposal is accepted while self-application is rejected.'
  }
 ];
}
