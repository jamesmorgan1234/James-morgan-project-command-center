/** Existing voice adapter/transcript/shared-intent proof only; no runtime or schema implementation changes. */
export function reviewedVoiceMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const registry=t('category6-browser-voice','P6.12 voice adapter registry is replaceable and duplicate-safe');
 const capture=t('category6-browser-voice','P6.12 Web Speech adapter requests microphone permission, exposes partial/final transcript, and cancels');
 const denied=t('category6-browser-voice','P6.12 denied microphone permission fails closed while preserving text fallback');
 const review=t('category6-browser-voice','P6.12 Brain composer requires review/edit before persistence and never auto-submits a final transcript');
 const durable=t('category6-voice-interface-persistence','P6.12 durable voice evidence cannot bypass shared intent/security gates');
 const shared=t('category6-voice-interface-persistence','P6.12 voice uses same intent engine and denied/partial input fails closed');
 const adversarial=t('category6-brain-adversarial','P6.15 voice partial/denied input cannot reach final intent and text remains fallback');
 const base=(id,loc,pos,neg,notes)=>({
  id,
  owningPhases:['P6.12'],
  dependencies:['C1','C2','C3','C5'],
  dependenciesVerified:true,
  applicableCompaniesOrCapabilities:['Command Center','Brain voice interface'],
  implementationLocations:loc,
  tests:{
   positive:{applicable:true,references:[pos],justification:null},
   negative:{applicable:true,references:[neg],justification:null},
   failurePath:{applicable:true,references:[neg],justification:null}
  },
  evidence:['Exact canonical requirement reviewed against existing voice adapter/composer/shared-intent implementation and named executable proof. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
  closureNotes:notes
 });
 return[
  base('CCR-00366',['clean-room/src/runtime/browser-voice.ts#BrowserVoiceAdapter','clean-room/src/runtime/browser-voice.ts#BrowserVoiceAdapterRegistry'],registry,registry,'Voice is behind an explicit adapter interface and registry; the executable test proves replaceability, unregisterability and duplicate safety rather than hard-coding one provider into Brain logic.'),
  base('CCR-00368',['clean-room/src/brain/voice.ts#voiceIntent','clean-room/src/brain/conversation.ts#classifyConversationIntent'],shared,shared,'Final voice transcripts are passed directly into the same classifyConversationIntent function used by typed Brain conversation input; the executable test proves a spoken deploy request receives the same protected-action intent classification.'),
  base('CCR-00369',['clean-room/src/runtime/browser-voice.ts#WebSpeechRecognitionAdapter'],capture,denied,'Microphone access is requested inside adapter.start through getUserMedia, not at Brain startup; denied permission fails closed and preserves text input.'),
  base('CCR-00371',['clean-room/src/runtime/brain-view.ts#composer','clean-room/src/runtime/browser-voice.ts#BrowserVoiceCaptureCallbacks'],capture,review,'Partial and final transcript callbacks write normalized speech into the visible Brain composer textarea, and the composer test freezes the review/edit-before-persistence behavior.'),
  base('CCR-00372',['clean-room/src/runtime/browser-voice.ts#BrowserVoiceCapture','clean-room/src/runtime/brain-view.ts#composer'],capture,review,'Voice capture exposes cancel(), the browser adapter aborts recognition, and the composer exposes a Cancel voice path that restores the original typed text.'),
  base('CCR-00373',['clean-room/src/runtime/brain-view.ts#composer'],review,review,'A final transcript is placed into the editable composer and is never auto-submitted; the named test requires explicit review/edit before persistence and verifies the final handler contains no submit or record call.'),
  base('CCR-00375',['clean-room/src/brain/voice.ts#voiceIntent'],durable,shared,'Durable voice evidence has canonical_writes_authorized=false and only a final transcript with shared Brain intent classification may carry executable intent; voice cannot bypass the security/authorization boundary used by typed requests.'),
  base('CCR-00376',['clean-room/src/brain/voice.ts#voiceIntent','clean-room/src/brain/conversation.ts#classifyConversationIntent'],shared,adversarial,'Voice does not implement a separate rule/intent engine: voiceIntent validates provider/finality and then delegates the text to classifyConversationIntent, with denied/partial voice failing closed.'),
  base('CCR-00377',['clean-room/src/runtime/browser-voice.ts#WebSpeechRecognitionAdapter','clean-room/src/brain/voice.ts#voiceIntent'],denied,adversarial,'Voice provider denial/unavailability produces an explicit text-fallback path; the adversarial test confirms unavailable voice cannot finalize intent while the text interface remains available, so Brain does not depend on voice provider availability.')
 ];
}
