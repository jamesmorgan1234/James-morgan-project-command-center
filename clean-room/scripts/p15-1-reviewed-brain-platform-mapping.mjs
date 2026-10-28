/** Existing multi-surface Brain platform proof only; no runtime or schema implementation changes. */
export function reviewedBrainPlatformMapping(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const runtime=t('category6-brain-runtime-view','P6.7/P6.8/P6.13 managed owner runtime reads canonical Brain conversations, workspaces and improvements');
 const surfaces=t('category6-brain-runtime-view','P6.7/P6.13 shipped Brain route uses dedicated conversation and Improvements Center surfaces');
 return [{
  id:'CCR-00321',
  owningPhases:['P6.7','P6.8','P6.13'],
  dependencies:['C1','C2','C3','C5'],
  dependenciesVerified:true,
  applicableCompaniesOrCapabilities:['Command Center','Brain platform / conversation / workspace / improvements'],
  implementationLocations:['clean-room/src/runtime/brain-view.ts#renderBrainView','clean-room/src/runtime/owner-security-provider.ts#BrainConversationRuntimeProvider'],
  tests:{
   positive:{applicable:true,references:[runtime,surfaces],justification:null},
   negative:{applicable:true,references:[surfaces],justification:null},
   failurePath:{applicable:true,references:[runtime],justification:null}
  },
  evidence:['Exact canonical requirement reviewed against the existing dedicated Brain runtime, project workspace and Improvements Center surfaces with named executable proof. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
  closureNotes:'Brain is implemented as a platform spanning persistent conversations, durable project workspaces, evidence-backed improvements and a dedicated Brain route. The executable UI/runtime proof explicitly rejects rendering Brain as the generic canonical surface and verifies the managed runtime loads conversations, workspaces and improvements independently.'
 }];
}
