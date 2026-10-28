/** Existing design-system proof only; no runtime or style implementation changes. */
export function reviewedDesignSystemMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const fingerprint=t('category4-visual-regression','P4.8 shared visual language, geometry and owner interaction rules have a deliberate regression fingerprint');
 const exactAsset=t('category4-visual-regression','P4.8 retrievable approved Projects visual asset remains byte-exact and dimension-exact');
 const authorities=t('category4-visual-regression','P4.8 all approved screenshot authorities remain registered without claiming unmapped identity');
 const noCompeting=t('ui-shell-foundation','unseen screens derive from the four approved screens instead of switching design systems');
 const lockedGeometry=t('runtime-visual-structure','browser visual shell uses the locked beveled phone-first control-system geometry');
 const fixture=t('ui-shell-foundation','visual fixtures preserve approved structures under the current owner card rules');
 const distinctRows=t('runtime-visual-structure','browser runtime keeps approved Projects, Active / Live, Next Up and Project Detail as distinct structures');
 const wholeCard=t('runtime-visual-structure','owner-facing project navigation uses the whole card and no decorative chevron markup');
 const homeHierarchy=t('category4-home-registry','P4.4 core Home catalog is registry-driven and preserves approved one-column hierarchy');
 const g=(ids,loc,pos,neg,notes,phase='P4.8')=>ids.map(id=>({
  id,
  owningPhases:[phase],
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
  ...g(['CCR-00234'],['clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_GEOMETRY','clean-room/src/ui/fixtures.ts#APPROVED_SCREEN_FIXTURES'],fingerprint,fixture,'Central iconFrameSize/iconInnerSize tokens are fingerprinted and approved screen fixtures independently require the left icon-frame treatment on the relevant canonical screens.'),
  ...g(['CCR-00237'],['clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_GEOMETRY','clean-room/src/ui/fixtures.ts#APPROVED_SCREEN_FIXTURES'],fingerprint,lockedGeometry,'Progress-ring diameter and stroke are centralized geometry tokens, fingerprinted against drift, and the approved Projects fixture requires a progress ring in the canonical card structure.'),
  ...g(['CCR-00238'],['clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_GEOMETRY','clean-room/src/ui/fixtures.ts#APPROVED_SCREEN_FIXTURES'],fingerprint,fixture,'Status-pill standard and compact heights are centralized geometry tokens and approved screen fixtures require status-pill treatment on canonical project/active/next-up structures.'),
  ...g(['CCR-00240'],['clean-room/src/ui/home.ts#createHomeGrid'],homeHierarchy,homeHierarchy,'The Home grid contract hard-locks one column and equalCardHeight=true, and the executable registry test asserts that invariant on the shipped core Home catalog.','P4.4'),
  ...g(['CCR-00243'],['clean-room/src/ui/fixtures.ts#APPROVED_SCREEN_FIXTURES','clean-room/src/runtime/browser.ts#renderProjects'],fixture,distinctRows,'The Projects structure is explicitly fixture-defined and rendered by its own runtime function; executable tests prevent it from collapsing into another screen structure.'),
  ...g(['CCR-00244'],['clean-room/src/ui/fixtures.ts#APPROVED_SCREEN_FIXTURES','clean-room/src/runtime/browser.ts#renderActive'],fixture,distinctRows,'The Active / Live row structure is explicitly fixture-defined and rendered by its own runtime function; executable tests preserve that distinct template and whole-card interaction contract.'),
  ...g(['CCR-00245'],['clean-room/src/ui/fixtures.ts#APPROVED_SCREEN_FIXTURES','clean-room/src/runtime/browser.ts#renderNextUp'],fixture,wholeCard,'The Next Up row structure is explicitly fixture-defined and rendered by its own runtime function; executable tests preserve the priority-queue template and reject decorative-chevron navigation.'),
  ...g(['CCR-00260'],['clean-room/tests/category4-visual-regression.test.mjs'],fingerprint,exactAsset,'A dedicated executable visual-regression suite protects exact approved asset bytes/dimensions, a deliberate shared visual-contract fingerprint, and the registered approved screenshot authorities.'),
 ];
}
