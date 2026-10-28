/** Existing recommendation/improvement evidence proof only; no runtime or analytics implementation changes. */
export function reviewedRecommendationMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const improvement=t('category6-improvements-persistence','P6.13 runtime improvement proposals require evidence/confidence and never install automatically');
 const recommendation=t('analytics-foundation','recommendations record outcomes and cannot self-install');
 const durableOutcome=t('category13-durable-governance-evidence','P13.6 separates predicted actual process decision and transfer outcomes');
 return [
  {
   id:'CCR-00340',owningPhases:['P6.13'],dependencies:['C1','C2','C3','C5'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Brain recommendation / improvement evidence'],
   implementationLocations:['clean-room/src/brain/improvements.ts#ImprovementProposal','clean-room/src/brain/improvements.ts#createImprovementProposal'],
   tests:{positive:{applicable:true,references:[improvement],justification:null},negative:{applicable:true,references:[improvement],justification:null},failurePath:{applicable:true,references:[improvement],justification:null}},
   evidence:['Exact canonical requirement reviewed against the existing improvement/recommendation evidence contract and named executable proof. No runtime, schema, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'Improvement recommendations cannot be created without evidenceRefs and bounded confidence; the named runtime test accepts evidence-backed proposals and rejects evidence-free or invalid-confidence proposals.'
  },
  {
   id:'CCR-00345',owningPhases:['P13.6'],dependencies:['C1','C2','C3','C5','C6','C7','IF','C8','C12'],dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','analytics / recommendation outcome measurement'],
   implementationLocations:['clean-room/src/analytics/recommendations.ts#RecommendationRecord','clean-room/src/analytics/recommendations.ts#validateRecommendation','clean-room/src/analytics/recommendations.ts#analyzeDecisionOutcome'],
   tests:{positive:{applicable:true,references:[recommendation],justification:null},negative:{applicable:true,references:[recommendation],justification:null},failurePath:{applicable:true,references:[durableOutcome],justification:null}},
   evidence:['Exact canonical requirement reviewed against the existing recommendation outcome contract and named executable/durable evidence proofs. No runtime, schema, protected asset or production behavior is changed by this mapping.'],
   closureNotes:'Recommendations carry explicit successCriteria; measured status requires actualOutcomeRefs, and outcome analysis separates predicted value, actual outcome, process quality, decision quality and confounding evidence.'
  }
 ];
}
