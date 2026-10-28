/** Explicit semantic review for P15.1 Section 2, first A00 Owner Authority / Governance batch. */
export function reviewedSection2AuthoritySourceMappings(){
  const test=(name)=>`clean-room/tests/category1-authority-source-lineage.test.mjs :: ${name}`;
  const row=(ids,locations,positive,negative,failurePath,notes)=>ids.map(id=>({
    id,
    owningPhases:['P1.6'],
    dependencies:['C0'],
    dependenciesVerified:true,
    applicableCompaniesOrCapabilities:['Command Center','A00 Owner Authority / Governance','P1.6 authority-source and requirement-lineage kernel'],
    implementationLocations:locations,
    tests:{
      positive:{applicable:true,references:[positive],justification:null},
      negative:{applicable:true,references:[negative],justification:null},
      failurePath:{applicable:true,references:[failurePath??negative],justification:null}
    },
    evidence:['Exact canonical A00 wording reviewed individually against current authority-source implementation and focused acceptance/rejection/failure-path tests; exact-source repository qualification remains mandatory.'],
    closureNotes:notes
  }));

  const sourcePositive=test('P15.1 A00 authority source registry proves CCR-01875 through CCR-01880 with explicit registered authority identities');
  const sourceNegative=test('P15.1 A00 authority sources fail closed on unknown types, missing identity, inactive sources, and non-advancing revisions');
  const truthPositive=test('P15.1 A00 owner requirements and truth dimensions prove CCR-01886 through CCR-01892 without implicit override or fabrication');
  const truthNegative=test('P15.1 A00 owner and live truth separation rejects invalid state mutation while preserving last valid state');
  const relocationPositive=test('P15.1 A00 stable source identity proves CCR-01901 CCR-01902 and CCR-01905 across provider repository and schema relocation');
  const lineagePositive=test('P15.1 A00 requirement lineage proves CCR-01907 through CCR-01912 while preserving original owner intent and source linkage');
  const lineageNegative=test('P15.1 A00 requirement lineage fails closed on intent-changing normalization, missing parents, and source-statement replacement');

  return [
    ...row(
      ['CCR-01876','CCR-01877','CCR-01878','CCR-01879','CCR-01880'],
      [
        'clean-room/src/kernel/authority-source.ts#CORE_AUTHORITY_SOURCE_TYPES',
        'clean-room/src/kernel/authority-source.ts#AuthoritySourceRegistry.registerType',
        'clean-room/src/kernel/authority-source.ts#AuthoritySourceRegistry.registerSource',
        'clean-room/src/kernel/authority-source.ts#AuthoritySourceRegistry.recordFact'
      ],
      sourcePositive,
      sourceNegative,
      sourceNegative,
      'The canonical authority-source registry formally defines owner instruction plus verified live-provider, repository and database state as distinct first-class source types. Unknown types, missing/inactive sources and stale revisions fail closed. CCR-01875 is intentionally not claimed because this batch does not prove that every important fact system-wide is routed through this registry.'
    ),
    ...row(
      ['CCR-01886','CCR-01887','CCR-01888','CCR-01889','CCR-01890','CCR-01891','CCR-01892'],
      [
        'clean-room/src/kernel/authority-source.ts#RequirementLineageRegistry.registerOwnerRequirement',
        'clean-room/src/kernel/authority-source.ts#RequirementLineageRegistry.remove',
        'clean-room/src/kernel/authority-source.ts#GovernedTruthStore.create',
        'clean-room/src/kernel/authority-source.ts#GovernedTruthStore.update'
      ],
      truthPositive,
      truthNegative,
      truthNegative,
      'Nonconflicting owner requirements remain independently active until explicit removal, while desired, actual, planned, implemented, verified and owner-accepted truth dimensions remain separately stored. Invalid or unknown truth-state mutation rejects without changing the last valid record.'
    ),
    ...row(
      ['CCR-01901','CCR-01902','CCR-01905'],
      [
        'clean-room/src/kernel/authority-source.ts#AuthoritySourceRegistry.reviseSource',
        'clean-room/src/kernel/authority-source.ts#AuthoritySourceRegistry.sourceHistory',
        'clean-room/src/kernel/authority-source.ts#AuthoritySourceRegistry.recordFact'
      ],
      relocationPositive,
      sourceNegative,
      sourceNegative,
      'Stable authority-source identity preserves fact linkage while provider, repository and database-schema locators advance through explicit versioned revisions. Non-advancing revisions reject and preserve the prior source record. No project/module/Brain/Agent lineage claim is inferred.'
    ),
    ...row(
      ['CCR-01907','CCR-01909','CCR-01910','CCR-01911','CCR-01912'],
      [
        'clean-room/src/kernel/authority-source.ts#RequirementLineageRegistry.registerOwnerRequirement',
        'clean-room/src/kernel/authority-source.ts#RequirementLineageRegistry.normalize',
        'clean-room/src/kernel/authority-source.ts#RequirementLineageRegistry.deriveRequirement',
        'clean-room/src/kernel/authority-source.ts#RequirementLineageRegistry.history'
      ],
      lineagePositive,
      lineageNegative,
      lineageNegative,
      'Requirement lineage retains the immutable original owner statement and source linkage while derived requirements carry explicit parent IDs and multiple children can share one parent without replacing it. Missing parents and mismatched normalization intent basis reject without rewriting source history. CCR-01908 is intentionally not claimed because arbitrary normalized wording is not yet semantically constrained enough to prove intent preservation.'
    )
  ];
}
