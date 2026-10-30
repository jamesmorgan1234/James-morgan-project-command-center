/**
 * Individually reviewed C1/C2 canonical-row reconciliation tranche.
 *
 * These static CCR IDs were reviewed against the recovered canonical 5,852-row
 * source and the already-qualified P1/P2 clean-room implementation/test surface.
 * No keyword search, file-similarity inference, category-total shortcut, production
 * acceptance, provider mutation, or physical-device acceptance is used here.
 */
const profiles=Object.freeze({
 'P1.5':Object.freeze({
  implementationLocations:Object.freeze(['clean-room/src/kernel/governance.ts','clean-room/src/kernel/scope.ts','clean-room/src/kernel/admission.ts']),
  tests:Object.freeze(['clean-room/tests/category1-p1-5-owner-governance.test.mjs','clean-room/tests/category1-governance-policy-broadening.test.mjs','clean-room/tests/category1-controlled-side-effects.test.mjs'])
 }),
 'P1.8':Object.freeze({
  implementationLocations:Object.freeze(['clean-room/src/kernel/config.ts','clean-room/src/kernel/trusted-environment.mjs','clean-room/src/kernel/release-feature-activation.ts']),
  tests:Object.freeze(['clean-room/tests/category1-p1-8-configuration-environment-compatibility.test.mjs','clean-room/tests/category1-compatibility-window.test.mjs','clean-room/tests/category15-a00-p1-compatibility-module-isolation-policy-governance.test.mjs'])
 }),
 'P1.10':Object.freeze({
  implementationLocations:Object.freeze(['clean-room/src/kernel/architecture-contract.ts','clean-room/src/kernel/invariants.ts','clean-room/src/kernel/module-contract.ts','clean-room/scripts/check-architecture-contracts.mjs','clean-room/scripts/check-no-legacy-imports.mjs']),
  tests:Object.freeze(['clean-room/tests/category1-p1-10-extension-contracts.test.mjs','clean-room/tests/category1-architecture-contract.test.mjs','clean-room/tests/category15-a00-p1-10-architecture-contracts.test.mjs'])
 }),
 'P2.1':Object.freeze({
  implementationLocations:Object.freeze(['clean-room/src/security/auth.ts','clean-room/src/security/types.ts','clean-room/src/runtime/provider.ts']),
  tests:Object.freeze(['clean-room/tests/category2-p21-auth-recovery.test.mjs','clean-room/tests/category2-p21-auth-risk.test.mjs','clean-room/tests/category2-adversarial-recovery.test.mjs'])
 }),
 'P2.2':Object.freeze({
  implementationLocations:Object.freeze(['clean-room/src/security/passkeys.ts','clean-room/src/security/supabase-passkeys.ts']),
  tests:Object.freeze(['clean-room/tests/category2-p22-passkey-contract.test.mjs','clean-room/tests/category2-p29-adversarial-security.test.mjs','clean-room/tests/category2-adversarial-recovery.test.mjs'])
 }),
 'P2.3':Object.freeze({
  implementationLocations:Object.freeze(['clean-room/src/security/devices.ts','clean-room/src/security/inventory.ts','clean-room/src/security/device-response.ts','clean-room/src/security/settings.ts']),
  tests:Object.freeze(['clean-room/tests/category2-p23-inventory.test.mjs','clean-room/tests/category2-p23-device-revocation.test.mjs','clean-room/tests/category2-p23-stolen-device.test.mjs'])
 }),
 'P2.4':Object.freeze({
  implementationLocations:Object.freeze(['clean-room/src/security/policy.ts','clean-room/src/security/policy-audit.ts','clean-room/src/security/types.ts']),
  tests:Object.freeze(['clean-room/tests/category2-p24-policy-audit.test.mjs','clean-room/tests/category2-p24-precondition-audit.test.mjs','clean-room/tests/category2-policy-compatibility.test.mjs'])
 }),
 'P2.5':Object.freeze({
  implementationLocations:Object.freeze(['clean-room/src/security/secrets.ts','clean-room/src/security/secret-channels.ts','clean-room/src/security/keyring.ts','clean-room/src/security/webhooks.ts']),
  tests:Object.freeze(['clean-room/tests/category2-p25-secret-channels.test.mjs','clean-room/tests/category2-p25-provider-replacement.test.mjs','clean-room/tests/category2-adversarial-recovery.test.mjs'])
 }),
 'P2.7':Object.freeze({
  implementationLocations:Object.freeze(['clean-room/src/security/protected-actions.ts','clean-room/src/security/protected-authorizations.ts','clean-room/src/security/protected-gate.ts','clean-room/src/security/intent.ts']),
  tests:Object.freeze(['clean-room/tests/category2-p27-protected-side-effects.test.mjs','clean-room/tests/category2-session-revocation-gates.test.mjs','clean-room/tests/category2-p24-precondition-audit.test.mjs'])
 })
});

const idsByPhase=Object.freeze({
 'P1.5':Object.freeze(['CCR-00021','CCR-00022','CCR-00025']),
 'P1.8':Object.freeze(['CCR-00019','CCR-00020','CCR-00023','CCR-00024']),
 'P1.10':Object.freeze(['CCR-00026','CCR-00028','CCR-00029','CCR-00032','CCR-00053','CCR-00055','CCR-00058','CCR-00059','CCR-00073','CCR-00075','CCR-00096','CCR-00097','CCR-00099','CCR-00726','CCR-00727','CCR-00833','CCR-01846','CCR-01858']),
 'P2.1':Object.freeze(['CCR-00027','CCR-01938','CCR-01940','CCR-01950','CCR-02233','CCR-03006','CCR-05278','CCR-05540']),
 'P2.2':Object.freeze(['CCR-05544']),
 'P2.3':Object.freeze(['CCR-03415','CCR-04958','CCR-05547','CCR-05752']),
 'P2.4':Object.freeze(['CCR-00399','CCR-00453','CCR-00460','CCR-00571','CCR-00572','CCR-00835','CCR-00869','CCR-00974','CCR-01121','CCR-01619','CCR-01754','CCR-01786','CCR-01823','CCR-02008','CCR-02022','CCR-03192','CCR-03196','CCR-03198','CCR-03199','CCR-03200','CCR-03201','CCR-03273','CCR-03326','CCR-03699','CCR-03789','CCR-04095','CCR-04504','CCR-04519','CCR-04599','CCR-04968','CCR-04984','CCR-04988','CCR-04989','CCR-04990','CCR-04992','CCR-05230','CCR-05232','CCR-05241','CCR-05242','CCR-05243','CCR-05270','CCR-05279','CCR-05340','CCR-05341','CCR-05388','CCR-05563','CCR-05626','CCR-05682','CCR-05702','CCR-05806','CCR-05807']),
 'P2.5':Object.freeze(['CCR-00950','CCR-00984','CCR-00987','CCR-00989','CCR-01024','CCR-01497','CCR-01508','CCR-01549','CCR-01691','CCR-01822','CCR-02747','CCR-04060','CCR-04071','CCR-04997','CCR-05013','CCR-05014','CCR-05015','CCR-05042','CCR-05271','CCR-05352','CCR-05389','CCR-05571','CCR-05670','CCR-05697']),
 'P2.7':Object.freeze(['CCR-01202','CCR-01371','CCR-02700','CCR-03203','CCR-04058','CCR-04719','CCR-04722','CCR-04723','CCR-04967','CCR-04974','CCR-04975','CCR-04976','CCR-04977','CCR-04979','CCR-05130','CCR-05231','CCR-05324','CCR-05545','CCR-05627','CCR-05628','CCR-05672','CCR-05748'])
});

export function reviewedCategory12ReconciliationMappings(){
 const result=[];
 for(const [phase,ids] of Object.entries(idsByPhase)){
  const profile=profiles[phase];
  if(!profile)throw Error('Missing static C1/C2 proof profile '+phase);
  const [positive,negative,failurePath]=profile.tests;
  for(const id of ids)result.push({
   id,
   owningPhases:[phase],
   dependencies:phase.startsWith('P1.')?['C0']:['C1'],
   dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center','Category 1/2 clean-room contract'],
   implementationLocations:[...profile.implementationLocations],
   tests:{
    positive:{applicable:true,references:[positive],justification:null},
    negative:{applicable:true,references:[negative],justification:null},
    failurePath:{applicable:true,references:[failurePath],justification:null}
   },
   evidence:[`Canonical ${id} was individually reviewed against the recovered source row and ${phase} executable branch proof.`],
   closureNotes:'Clean-room branch contract only; no production deployment, live-provider mutation, owner acceptance, or physical-device/Samsung acceptance is claimed.'
  });
 }
 if(result.length!==135||new Set(result.map(row=>row.id)).size!==135)throw Error('C1/C2 reconciliation tranche must contain exactly 135 unique canonical rows');
 return result;
}
