/** P15.1 Batch 1 Class-A semantic mappings from the completed CCR-00728–CCR-01227 Work diagnostic.
 * Native assembly still verifies every referenced exact-head file/test before any row becomes VERIFIED. */
const yes=references=>({applicable:true,references,justification:null});
const groups={"RG-002":{"phases":["P1.10","P15.1"],"deps":["C0"],"impl":["clean-room/tsconfig.json","clean-room/scripts/check-architecture-contracts.mjs"],"tests":["clean-room/tests/category1-p1-10-extension-contracts.test.mjs","clean-room/tests/p15-1-source-scanner-hardening.test.mjs"]},"RG-005":{"phases":["P4.4","P15.1"],"deps":["C1","C2","C3"],"impl":["clean-room/src/ui/home.ts","clean-room/src/runtime/home-modules.ts"],"tests":["clean-room/tests/category4-home-registry.test.mjs"]},"RG-008":{"phases":["P4.1","P15.1"],"deps":["C1","C2","C3"],"impl":["clean-room/src/ui/design-tokens.ts","clean-room/src/ui/visual-references.ts","clean-room/src/data/assets.ts"],"tests":["clean-room/tests/category4-visual-regression.test.mjs","clean-room/tests/ui-shell-foundation.test.mjs","clean-room/tests/p15-1-protected-asset-authority.test.mjs"]},"RG-011":{"phases":["P1.10","P15.1"],"deps":["C0"],"impl":["clean-room/src/kernel/invariants.ts","clean-room/src/kernel/architecture-contract.ts","clean-room/src/kernel/command-runtime.ts"],"tests":["clean-room/tests/category1-architecture-contract.test.mjs","clean-room/tests/category1-p1-4-command-event-workflow-runtime.test.mjs","clean-room/tests/p15-1-command-scope-state-machine.test.mjs"]},"RG-012":{"phases":["P1.1","P15.1"],"deps":["C0"],"impl":["clean-room/src/kernel/lifecycle.ts","clean-room/src/data/canonical.ts"],"tests":["clean-room/tests/category1-p1-4-command-event-workflow-runtime.test.mjs","clean-room/tests/category3-canonical-lifecycle.test.mjs"]},"RG-015":{"phases":["P3.12","P15.1"],"deps":["C1","C2"],"impl":["clean-room/src/data/recovery.ts","clean-room/src/data/context.ts","clean-room/src/kernel/resilience.ts","clean-room/src/runtime/assembly.ts"],"tests":["clean-room/tests/category3-postgres-execution.test.mjs","clean-room/tests/category3-context-snapshot-boundaries.test.mjs","clean-room/tests/category3-scale-recovery.test.mjs"]},"RG-017":{"phases":["P1.9","P15.1"],"deps":["C0"],"impl":["clean-room/src/kernel/resilience.ts","clean-room/src/kernel/operations.ts"],"tests":["clean-room/tests/category1-runtime-resilience-contracts.test.mjs","clean-room/tests/category1-controlled-side-effects.test.mjs"]},"RG-021":{"phases":["P1.8","P15.1"],"deps":["C0"],"impl":["clean-room/src/kernel/config.ts","clean-room/src/kernel/trusted-environment.mjs","clean-room/src/runtime/startup-config.ts"],"tests":["clean-room/tests/category1-p1-8-configuration-environment-compatibility.test.mjs","clean-room/tests/p15-1-release-health-feature-activation.test.mjs"]},"RG-022":{"phases":["P2.5","P15.1"],"deps":["C1"],"impl":["clean-room/src/security/secrets.ts","clean-room/src/security/secret-channels.ts"],"tests":["clean-room/tests/category2-p25-secret-channels.test.mjs","clean-room/tests/security-foundation.test.mjs"]},"RG-023":{"phases":["P14.12","P15.1"],"deps":["C1","C2","C3","C4","C5","C6","C7","IF","C8","C9","C10","C11","C12","C13"],"impl":["clean-room/src/recovery/lifecycle.ts","clean-room/src/data/assets.ts"],"tests":["clean-room/tests/p14-12-long-horizon-revalidation.test.mjs","clean-room/tests/p15-1-protected-asset-authority.test.mjs"]},"RG-027":{"phases":["P3.1","P15.1"],"deps":["C1","C2"],"impl":["supabase/migrations/20261024112000_category3_canonical_platform.sql","supabase/migrations/20261027174500_category3_declared_schema_compatibility.sql"],"tests":["clean-room/tests/category3-postgres-execution.test.mjs","clean-room/tests/category2-p26-rls-contract.test.mjs"]},"RG-028":{"phases":["P3.1","P15.1"],"deps":["C1","C2"],"impl":["clean-room/src/data/canonical.ts","clean-room/src/data/graph.ts"],"tests":["clean-room/tests/category3-canonical-lifecycle.test.mjs"]},"RG-029":{"phases":["P3.7","P15.1"],"deps":["C1","C2"],"impl":["clean-room/src/data/portability.ts","supabase/migrations/20261024115000_category3_portability_batches.sql"],"tests":["clean-room/tests/category3-postgres-execution.test.mjs","clean-room/tests/p14-durable-recovery.test.mjs","clean-room/tests/category3-portability-validation.test.mjs"]},"RG-030":{"phases":["P3.11","P15.1"],"deps":["C1","C2"],"impl":["clean-room/src/runtime/provider.ts","clean-room/src/runtime/snapshot.ts","clean-room/src/data/protocols.ts"],"tests":["clean-room/tests/runtime-integration.test.mjs","clean-room/tests/supabase-runtime-provider.test.mjs"]},"RG-032":{"phases":["P3.11","P15.1"],"deps":["C1","C2"],"impl":["clean-room/src/runtime/provider.ts","clean-room/src/data/protocols.ts","clean-room/src/kernel/config.ts"],"tests":["clean-room/tests/runtime-integration.test.mjs","clean-room/tests/supabase-runtime-provider.test.mjs","clean-room/tests/category1-p1-8-configuration-environment-compatibility.test.mjs"]},"RG-033":{"phases":["P4.5","P15.1"],"deps":["C1","C2","C3"],"impl":["clean-room/src/runtime/browser.ts","clean-room/src/runtime/browser-navigation.ts","clean-room/src/runtime/route-state.ts","clean-room/public/app.css"],"tests":["clean-room/tests/category4-runtime-contract.test.mjs","clean-room/tests/category4-accessibility-device-adaptation.test.mjs","clean-room/tests/runtime-visual-structure.test.mjs"]}};
const overrides={"CCR-00784":{"phases":["P6.2","P15.1"],"deps":["C1","C2","C3","C5"],"impl":["clean-room/src/brain/providers.ts"],"tests":["clean-room/tests/brain-foundation.test.mjs"]},"CCR-00786":{"phases":["P7.3","P15.1"],"deps":["C1","C2","C3","C5","C6"],"impl":["clean-room/src/agency/registry.ts","clean-room/src/agency/resources.ts"],"tests":["clean-room/tests/agency-foundation.test.mjs"]},"CCR-01050":{"phases":["P2.6","P15.1"],"deps":["C1"],"impl":["supabase/migrations/20261024112000_category3_canonical_platform.sql","supabase/migrations/20261027174500_category3_declared_schema_compatibility.sql"],"tests":["clean-room/tests/category3-postgres-execution.test.mjs","clean-room/tests/category2-p26-rls-contract.test.mjs"]},"CCR-01051":{"phases":["P2.6","P15.1"],"deps":["C1"],"impl":["supabase/migrations/20261024112000_category3_canonical_platform.sql","supabase/migrations/20261027174500_category3_declared_schema_compatibility.sql"],"tests":["clean-room/tests/category3-postgres-execution.test.mjs","clean-room/tests/category2-p26-rls-contract.test.mjs"]},"CCR-01056":{"phases":["P2.4","P15.1"],"deps":["C1"],"impl":["supabase/migrations/20261024112000_category3_canonical_platform.sql","supabase/migrations/20261027174500_category3_declared_schema_compatibility.sql"],"tests":["clean-room/tests/category3-postgres-execution.test.mjs","clean-room/tests/category2-p26-rls-contract.test.mjs"]},"CCR-01165":{"phases":["P3.5","P15.1"],"deps":["C1","C2"],"impl":["clean-room/src/runtime/provider.ts","clean-room/src/runtime/supabase-owner-provider.ts"],"tests":["clean-room/tests/runtime-integration.test.mjs","clean-room/tests/supabase-runtime-provider.test.mjs"]},"CCR-01168":{"phases":["P3.11","P15.1"],"deps":["C1","C2"],"impl":["clean-room/src/data/protocols.ts","clean-room/src/kernel/config.ts"],"tests":["clean-room/tests/category1-p1-8-configuration-environment-compatibility.test.mjs","clean-room/tests/runtime-integration.test.mjs"]},"CCR-01170":{"phases":["P3.5","P15.1"],"deps":["C1","C2"],"impl":["clean-room/src/runtime/provider.ts","clean-room/src/runtime/supabase-owner-provider.ts"],"tests":["clean-room/tests/runtime-integration.test.mjs","clean-room/tests/supabase-runtime-provider.test.mjs"]},"CCR-01182":{"phases":["P1.8","P15.1"],"deps":["C0"],"impl":["clean-room/src/kernel/config.ts","clean-room/src/runtime/startup-config.ts"],"tests":["clean-room/tests/category1-p1-8-configuration-environment-compatibility.test.mjs"]},"CCR-01185":{"phases":["P4.3","P15.1"],"deps":["C1","C2","C3"],"impl":["clean-room/src/runtime/browser-navigation.ts","clean-room/src/runtime/browser-navigation-runtime.ts","clean-room/src/runtime/route-state.ts"],"tests":["clean-room/tests/category4-runtime-contract.test.mjs","clean-room/tests/runtime-visual-structure.test.mjs"]},"CCR-01213":{"phases":["P4.3","P15.1"],"deps":["C1","C2","C3"],"impl":["clean-room/src/runtime/browser-navigation.ts","clean-room/src/runtime/browser-navigation-runtime.ts","clean-room/src/runtime/route-state.ts"],"tests":["clean-room/tests/category4-runtime-contract.test.mjs","clean-room/tests/runtime-visual-structure.test.mjs"]},"CCR-01227":{"phases":["P4.7","P15.1"],"deps":["C1","C2","C3"],"impl":["clean-room/src/ui/design-tokens.ts","clean-room/public/app.css"],"tests":["clean-room/tests/category4-accessibility-device-adaptation.test.mjs","clean-room/tests/category4-visual-regression.test.mjs"]}};
const rows=[
["CCR-00732","Static analysis","RG-002","Map actual analysis scope without claiming exhaustive security scanning"],
["CCR-00764","No assumption of fixed Home capability count internally","RG-005","Map tested dynamic registration"],
["CCR-00765","Future Home capabilities can exist without destroying approved primary grid","RG-005","Map preserved core order and extension behavior"],
["CCR-00784","Future multiple AI providers","RG-007","Map multiple-provider selection/removal boundaries"],
["CCR-00786","Future multiple Agent executors","RG-007","Map extensibility and capability/risk/cost filtering"],
["CCR-00812","Locked logo/launcher identity","RG-008","Map exact approved identity; replace nothing"],
["CCR-00813","Typography standard","RG-008","Map current standard without claiming full rendered parity"],
["CCR-00814","Color standard","RG-008","Map existing approved palette"],
["CCR-00815","Glow/lighting standard","RG-008","Map existing effects standard"],
["CCR-00818","Motion standard","RG-008","Map defined motion behavior"],
["CCR-00820","Component design standard","RG-008","Map actual standard and rejected patterns"],
["CCR-00823","Brand change approval process","RG-008","Map process contract; do not fabricate an owner decision"],
["CCR-00855","Machine-testable invariants","RG-011","Map actual checks with bounded applicability"],
["CCR-00857","State-transition guards","RG-011","Map illegal-transition rejection; account for RG-011 conflict repair"],
["CCR-00864","Fail closed if critical invariant unconfirmed","RG-011","Map current denial behavior"],
["CCR-00865","No silent coercion of invalid state","RG-012","Map malformed/ambiguous-state rejection"],
["CCR-00901","Snapshot rebuildability from history where practical","RG-015","Reuse actual DB tombstone/history rebuild proof"],
["CCR-00905","Cache cannot become canonical without freshness rules","RG-015","Map actual cache contract and stale rejection"],
["CCR-00907","Projection rebuild tests","RG-015","Reuse semantic rebuild proof, not only string-chain helper"],
["CCR-00916","Saga/compensation for distributed operations","RG-017","Map reverse compensation and incomplete-compensation reporting"],
["CCR-00946","Typed configuration schema","RG-021","Map current typed/runtime validation"],
["CCR-00947","Configuration versioning","RG-021","Map supported/unsupported-version checks"],
["CCR-00948","Environment configuration separation","RG-021","Map mismatch rejection"],
["CCR-00951","No production writes from tests","RG-021","Map nonproduction-to-production rejection"],
["CCR-00952","No staging data treated as production","RG-021","Map mixed-identity rejection"],
["CCR-00953","Internal environment identifier","RG-021","Map explicit identity"],
["CCR-00955","Startup configuration validation","RG-021","Map validation before execution"],
["CCR-00956","Missing config fails clearly","RG-021","Map safe recovery messages"],
["CCR-00967","Central capability flags","RG-021","Map dynamic lifecycle/discovery checks"],
["CCR-00968","Central release metadata","RG-021","Map current authoritative release metadata"],
["CCR-00969","Central build metadata","RG-021","Map generated build identity"],
["CCR-00979","Secret-reference abstraction","RG-022","Map reference-only validation"],
["CCR-00980","Secret rotation strategy","RG-022","Map existing bounded rotation behavior"],
["CCR-00981","Credential expiry tracking","RG-022","Map exact expiry handling"],
["CCR-01001","Approved asset hash drift","RG-023","Map mismatch rejection; modify no protected assets"],
["CCR-01031","Foreign-key integrity where appropriate","RG-027","Map actual applicable constraints"],
["CCR-01032","Business-identity uniqueness","RG-027","Map identity collision enforcement"],
["CCR-01033","Valid-value check constraints","RG-027","Map storage-level malformed-value rejection"],
["CCR-01050","DB-layer row ownership","RG-027","Map actual DB ownership enforcement"],
["CCR-01051","Owner-scoped uniqueness","RG-027","Map same-owner collision and separate-owner namespace semantics"],
["CCR-01056","Authenticated is not automatically authorized","RG-027","Map separate authorization checks"],
["CCR-01068","Zero distinct from null","RG-028","Map current canonical/storage proof"],
["CCR-01084","Validate import before mutation","RG-029","Map actual no-activation staging/validation"],
["CCR-01085","Import dry run","RG-029","Map create/update/duplicate/conflict results"],
["CCR-01086","Import conflict report","RG-029","Map divergent-version/hash reporting"],
["CCR-01088","Imports cannot silently overwrite verified truth","RG-029","Map actual stale/divergent rejection"],
["CCR-01089","Import/export provenance preserved","RG-029","Map existing lineage-preserving paths"],
["CCR-01090","Immutable critical artifact/record hashes","RG-029","Map actual integrity contracts"],
["CCR-01107","API versioning","RG-030","Map declared supported version behavior"],
["CCR-01133","Reject unknown dangerous commands","RG-030","Map current fail-closed command/policy behavior"],
["CCR-01138","No retry of ambiguous external effects before reconciliation","RG-030","Map unknown-outcome refusal and explicit reconciliation"],
["CCR-01143","Realtime optional, not startup dependency","RG-030","Map optional-dependency boundary"],
["CCR-01165","Deterministic mock providers","RG-032","Map existing deterministic mocks"],
["CCR-01168","Old-version payload fixtures","RG-032","Map actual supported-old-format cases"],
["CCR-01170","Provider outage fixture","RG-032","Map existing outage simulations"],
["CCR-01182","Client safely refuses incompatible backend","RG-032","Map current fail-closed client behavior"],
["CCR-01185","Single route-state truth","RG-033","Map current URL/history ownership"],
["CCR-01193","Explicit stale state","RG-033","Map current stale presentation and read behavior"],
["CCR-01195","Explicit empty state","RG-033","Map empty versus unavailable/unknown"],
["CCR-01212","Status pill not a fake control","RG-033","Map noninteractive status semantics"],
["CCR-01213","Navigation survives refresh","RG-033","Map refresh without route reset"],
["CCR-01227","Reduced-motion handling","RG-033","Map actual global reduced-motion behavior"],
];
export function reviewedWorkBatch1ExistingProofMappings(){
 return rows.map(([id,label,rg,reviewNote])=>{
  const c=overrides[id]??groups[rg];
  if(!c)throw Error('Missing P15.1 Batch 1 mapping contract '+id);
  return {
   id,owningPhases:c.phases,dependencies:c.deps,dependenciesVerified:true,
   applicableCompaniesOrCapabilities:['Command Center',label],implementationLocations:c.impl,
   tests:{positive:yes(c.tests),negative:yes(c.tests),failurePath:yes(c.tests)},
   evidence:[`P15.1 individually reviewed ${rg} Class-A candidate; current repository inputs are exact-head revalidated before promotion.`],
   closureNotes:`${reviewNote}. Qualification is limited to current repository/nonproduction proof; no production, external-provider, owner-device, or P15.2 claim.`
  };
 });
}
