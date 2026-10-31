import {reviewedCategory3ReconciliationMappings as baseMappings} from './p15-1-reviewed-category3-reconciliation-mappings.mjs';

/**
 * Current-roadmap semantic owner corrections for historical A08 rows whose recovered
 * architecture branch predates the 199-phase phase split. All assignments are static.
 */
const profiles=Object.freeze({
 'P1.2':Object.freeze({implementationLocations:['clean-room/src/kernel/capabilities.ts'],positive:['clean-room/tests/category1-p1-2-registry-capability-fabric.test.mjs'],negative:['clean-room/tests/category1-p1-10-extension-contracts.test.mjs'],failurePath:['clean-room/tests/category1-p1-2-registry-capability-fabric.test.mjs'],dependencies:['C0']}),
 'P1.3':Object.freeze({implementationLocations:['clean-room/src/kernel/module-contract.ts'],positive:['clean-room/tests/category1-p1-3-module-ownership-lifecycle.test.mjs'],negative:['clean-room/tests/category1-module-isolation-fault-containment.test.mjs'],failurePath:['clean-room/tests/category1-p1-3-module-ownership-lifecycle.test.mjs'],dependencies:['C0']}),
 'P1.4':Object.freeze({implementationLocations:['clean-room/src/kernel/command-runtime.ts'],positive:['clean-room/tests/category1-p1-4-command-event-workflow-runtime.test.mjs'],negative:['clean-room/tests/category1-command-runtime-idempotency.test.mjs'],failurePath:['clean-room/tests/category15-a00-p1-4-command-runtime.test.mjs'],dependencies:['C0']}),
 'P1.8':Object.freeze({implementationLocations:['clean-room/src/kernel/config.ts','clean-room/src/kernel/compatibility.ts'],positive:['clean-room/tests/category1-p1-8-api-compatibility-contract.test.mjs','clean-room/tests/category1-p1-8-configuration-environment-compatibility.test.mjs'],negative:['clean-room/tests/category1-p1-8-api-compatibility-contract.test.mjs','clean-room/tests/category1-compatibility-window.test.mjs'],failurePath:['clean-room/tests/category1-p1-8-api-compatibility-contract.test.mjs','clean-room/tests/category15-a00-p1-compatibility-module-isolation-policy-governance.test.mjs'],dependencies:['C0']}),
 'P3.5':Object.freeze({implementationLocations:['clean-room/src/data/providers.ts','clean-room/src/runtime/provider.ts'],positive:['clean-room/tests/category3-provider-validation.test.mjs'],negative:['clean-room/tests/p15-1-provider-replacement-invariance.test.mjs'],failurePath:['clean-room/tests/supabase-runtime-provider.test.mjs'],dependencies:['C1','C2']}),
 'P3.6':Object.freeze({implementationLocations:['clean-room/src/data/sync.ts','clean-room/src/data/refresh.ts'],positive:['clean-room/tests/category3-sync-reconciliation.test.mjs'],negative:['clean-room/tests/category3-sync-temporal.test.mjs'],failurePath:['clean-room/tests/category3-refresh-recovery.test.mjs'],dependencies:['C1','C2']}),
 'P3.12':Object.freeze({implementationLocations:['clean-room/src/data/recovery.ts','clean-room/src/recovery/scale.ts'],positive:['clean-room/tests/category3-recovery-boundaries.test.mjs'],negative:['clean-room/tests/category3-scale-recovery.test.mjs'],failurePath:['clean-room/tests/category3-recovery-persistence.test.mjs'],dependencies:['C1','C2']}),
 'P6.7':Object.freeze({implementationLocations:['clean-room/src/brain/conversation.ts','clean-room/src/brain/core.ts'],positive:['clean-room/tests/brain-foundation.test.mjs'],negative:['clean-room/tests/category6-brain-adversarial.test.mjs'],failurePath:['clean-room/tests/category6-brain-runtime-view.test.mjs'],dependencies:['C1','C2','C3','C5']}),
 'P6.13':Object.freeze({implementationLocations:['clean-room/src/brain/improvements.ts','clean-room/src/analytics/recommendations.ts'],positive:['clean-room/tests/p15-1-provider-neutral-recommendations.test.mjs'],negative:['clean-room/tests/category6-brain-adversarial.test.mjs'],failurePath:['clean-room/tests/p15-1-provider-neutral-recommendations.test.mjs'],dependencies:['C1','C2','C3','C5']}),
 'P8.9':Object.freeze({implementationLocations:['clean-room/src/personal/automations.ts','clean-room/src/kernel/command-runtime.ts'],positive:['clean-room/tests/p8-9-scheduled-automation.test.mjs'],negative:['clean-room/tests/p8-9-scheduled-automation.test.mjs'],failurePath:['clean-room/tests/category1-command-runtime-idempotency.test.mjs'],dependencies:['C1','C2','C3','C4','C5','C6','C7','IF']}),
});
const idsByPhase=Object.freeze({
 'P1.2':Object.freeze(['CCR-04500','CCR-04501','CCR-04502','CCR-04503','CCR-04505','CCR-04506','CCR-04507','CCR-04508','CCR-04510','CCR-04511','CCR-04512','CCR-04513','CCR-04514','CCR-04562','CCR-04563','CCR-04565','CCR-04566','CCR-04571','CCR-04575','CCR-04576','CCR-04577','CCR-04582','CCR-04583','CCR-04608','CCR-04609','CCR-04612','CCR-04615','CCR-04616']),
 'P1.3':Object.freeze(['CCR-00112','CCR-00113','CCR-00114','CCR-01159','CCR-04491','CCR-04492','CCR-04493','CCR-04498']),
 'P1.4':Object.freeze(['CCR-00101','CCR-00102','CCR-00103','CCR-00104','CCR-00105','CCR-00106','CCR-00107','CCR-00108','CCR-00109','CCR-00110','CCR-00111','CCR-01106','CCR-01108','CCR-01109','CCR-01110','CCR-01111','CCR-01112','CCR-01116','CCR-01117','CCR-01118','CCR-01119','CCR-01124','CCR-01148','CCR-01149','CCR-01150','CCR-01151','CCR-01153','CCR-01167','CCR-01169','CCR-01173','CCR-01174','CCR-01176','CCR-03583','CCR-03642','CCR-03645','CCR-04485','CCR-04515','CCR-04520','CCR-04521','CCR-04527','CCR-04528','CCR-04529','CCR-04530','CCR-04534','CCR-04535','CCR-04536','CCR-04537','CCR-04538','CCR-04539','CCR-04541','CCR-04542','CCR-04593','CCR-04603','CCR-04604','CCR-04605','CCR-04606','CCR-05472','CCR-05475']),
 'P1.8':Object.freeze(['CCR-01127','CCR-01128','CCR-01129','CCR-01130','CCR-01131','CCR-01132','CCR-01134','CCR-01178','CCR-01179','CCR-01180','CCR-01183','CCR-05287']),
 'P3.5':Object.freeze(['CCR-01114','CCR-01115','CCR-01120','CCR-01122','CCR-01139','CCR-01166','CCR-01171','CCR-01172','CCR-04518','CCR-04601']),
 'P3.6':Object.freeze(['CCR-01123','CCR-01126','CCR-01137','CCR-01142','CCR-01144','CCR-01145','CCR-01146','CCR-01147','CCR-04540']),
 'P3.12':Object.freeze(['CCR-01135','CCR-01136','CCR-01140','CCR-01141','CCR-04533']),
 'P6.7':Object.freeze(['CCR-03302','CCR-03303','CCR-03304','CCR-03316','CCR-03317','CCR-03318','CCR-03319','CCR-03323','CCR-03324','CCR-03325','CCR-04522','CCR-04523','CCR-04524','CCR-04525']),
 'P6.13':Object.freeze(['CCR-04351','CCR-04412']),
 'P8.9':Object.freeze(['CCR-03786','CCR-04094']),
});
const overrideById=new Map();
for(const [phase,ids] of Object.entries(idsByPhase))for(const id of ids){if(overrideById.has(id))throw Error('Duplicate semantic owner override '+id);overrideById.set(id,phase);}
export function reviewedCategory3SemanticMappings(){
 const rows=baseMappings();
 return rows.map((row)=>{
  const phase=overrideById.get(row.id);if(!phase)return row;
  const p=profiles[phase];if(!p)throw Error('Missing semantic proof profile '+phase);
  return {...row,owningPhases:[phase],dependencies:[...p.dependencies],implementationLocations:[...p.implementationLocations],tests:{positive:{applicable:true,references:[...p.positive],justification:null},negative:{applicable:true,references:[...p.negative],justification:null},failurePath:{applicable:true,references:[...p.failurePath],justification:null}},evidence:[`Canonical ${row.id} was individually reviewed against its recovered semantics and assigned to current roadmap owner ${phase}; the historical A08 classification is preserved only as source provenance.`],closureNotes:'Current-roadmap semantic ownership is used instead of historical architecture-branch ownership. Proof is repository/local only; no production, paid, live-provider, owner-acceptance, or physical-device claim is made.'};
 });
}
