/** Existing device/accessibility proof only; no runtime or CSS implementation changes. */
export function reviewedDeviceAdaptationMappings(){
 const t=(name)=>`clean-room/tests/category4-accessibility-device-adaptation.test.mjs :: ${name}`;
 const touch=t('P4.7 canonical touch gate requires both 48px geometry and accessible naming');
 const device=t('P4.7 device classification covers compact phone through desktop and reduced motion fails to zero');
 const invalid=t('P4.7 accessibility and reduced-motion contracts fail closed on invalid device or motion input');
 const contrast=t('P4.7 high-contrast and forced-colors adaptation applies to the real card/navigation/status system');
 const css=t('P4.7 shipped CSS provides visible focus, 48px controls and global reduced-motion behavior');
 const g=(ids,loc,pos,neg,notes)=>ids.map(id=>({
  id,
  owningPhases:['P4.7'],
  dependencies:['C1','C2'],
  dependenciesVerified:true,
  applicableCompaniesOrCapabilities:['Command Center','client shell / UX / multi-device adaptation'],
  implementationLocations:loc,
  tests:{
   positive:{applicable:true,references:[pos],justification:null},
   negative:{applicable:true,references:[neg],justification:null},
   failurePath:{applicable:true,references:[neg],justification:null}
  },
  evidence:['Exact canonical requirement reviewed against existing shipped device/accessibility contracts and executable named proof. Qualification reuses unchanged source-bound runtime/test evidence; this mapping does not change runtime, CSS, schema, protected assets or production.'],
  closureNotes:notes
 }));
 return[
  ...g(['CCR-00266'],['clean-room/src/ui/device.ts#assertAccessibleControl','clean-room/src/ui/design-tokens.ts#COMMAND_CENTER_GEOMETRY'],touch,touch,'Interactive targets are governed by one 48px minimum in both the device guard and central geometry token; the named test proves 48px passes and 47px fails closed.'),
  ...g(['CCR-00274'],['clean-room/public/primitive-system.css'],contrast,contrast,'The shipped shared card/navigation/status system has explicit prefers-contrast and forced-colors adaptations, with executable assertions including forced-color focus treatment.'),
  ...g(['CCR-00275'],['clean-room/src/ui/device.ts#assertAccessibleControl','clean-room/public/app.css'],touch,touch,'Minimum interactive dimensions are explicitly 48px; executable proof accepts 48x48, rejects 47x48, and shipped CSS exposes the same 48px tap token.'),
  ...g(['CCR-00276'],['clean-room/src/ui/device.ts#motionDuration','clean-room/public/app.css'],device,invalid,'Reduced-motion profiles collapse motion duration to zero and shipped CSS disables scroll animation, transitions and animations under prefers-reduced-motion; invalid motion input fails closed.'),
  ...g(['CCR-00277'],['clean-room/src/ui/device.ts#classifyLayout'],device,invalid,'The shared layout classifier has an explicit tablet class exercised at 800x1280, providing a future tablet presentation seam without a separate truth model; invalid dimensions fail closed.'),
  ...g(['CCR-00278'],['clean-room/src/ui/device.ts#classifyLayout'],device,invalid,'The shared layout classifier has an explicit desktop class exercised at 1440x900, providing a future desktop presentation seam without changing the underlying application contracts; invalid dimensions fail closed.')
 ];
}
