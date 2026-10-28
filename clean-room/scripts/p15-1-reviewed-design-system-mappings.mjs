/** Existing design-system proof only; no runtime or style implementation changes. */
export function reviewedDesignSystemMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const fingerprint=t('category4-visual-regression','P4.8 shared visual language, geometry and owner interaction rules have a deliberate regression fingerprint');
 const noCompeting=t('ui-shell-foundation','unseen screens derive from the four approved screens instead of switching design systems');
 const lockedGeometry=t('runtime-visual-structure','browser visual shell uses the locked beveled phone-first control-system geometry');
 const fixture=t('ui-shell-foundation','visual fixtures preserve approved structures under the current owner card rules');
 const g=(ids,loc,pos,neg,notes)=>ids.map(id=>({
  id,
  owningPhases:['P4.8'],
  dependencies:['C1','C2'],
  dependenciesVerified:true,
  applicableCompaniesOrCapabilities:['Command Center','client shell / UX design system'],
  implementationLocations:loc,
  tests:{
   positive:{applicable:true,references:[pos],justification:null},
   negative:{applicable:true,references:[neg],justification:null},
   failurePath:{applicable:true,references:[neg],justification:null}
  },
  evidence:['Exact canonical requirement reviewed against existing source and executable named proof. Qualification reuses unchanged source-bound runtime/test evidence; this mapping commit does not change runtime, CSS, schema or protected assets.'],
  closureNotes:notes
 }));
 return[
  ...g(['CCR-00226'],['clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_COLORS','clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_GEOMETRY','clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_TYPE','clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_EFFECTS'],fingerprint,noCompeting,'The shipped design system is encoded as frozen source-level token objects and protected by a visual-contract regression fingerprint plus an explicit prohibition on switching unseen screens to another design system.'),
  ...g(['CCR-00228'],['clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_GEOMETRY'],fingerprint,noCompeting,'Central outerInset and cardGap spacing tokens are part of the fingerprinted geometry contract rather than screen-local arbitrary spacing.'),
  ...g(['CCR-00231'],['clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_EFFECTS'],fingerprint,noCompeting,'Central borderGlowPx and hotGlowPx values form the shipped glow scale and are included in the exact visual-contract fingerprint.'),
  ...g(['CCR-00233'],['clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_GEOMETRY'],fingerprint,lockedGeometry,'Central cardRadius and clippedCorner values define the bevel geometry scale; shipped CSS/runtime structure is separately checked for the locked clipped/beveled geometry.'),
  ...g(['CCR-00234'],['clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_GEOMETRY','clean-room/src/ui/fixtures.ts#APPROVED_SCREEN_FIXTURES'],fingerprint,fixture,'Central iconFrameSize/iconInnerSize tokens are fingerprinted and approved screen fixtures independently require the left icon-frame treatment on the relevant canonical screens.')
 ];
}
