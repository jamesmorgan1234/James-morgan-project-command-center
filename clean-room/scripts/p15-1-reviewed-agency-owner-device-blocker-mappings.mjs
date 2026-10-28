/** Exact semantic review of P15.1 owner/device blocker presentation and acknowledgement boundaries. */
export function reviewedAgencyOwnerDeviceBlockerMappings(){
 const t=(name)=>`clean-room/tests/p15-1-agent-owner-device-blocker-contract.test.mjs :: ${name}`;
 const positive=t('P15.1 owner device blockers preserve exact environment reason action resume and verification-pending contract');
 const negative=t('P15.1 owner device blocker rejects invalid environment blank reason and acknowledgement-as-proof');
 const failure=t('P15.1 owner device blocker keeps owner action verification pending before same-session resume');
 const device='supabase/migrations/20261021231000_agent_mode_device_requirements.sql';
 const blocker='supabase/migrations/20261021232000_agent_mode_service_work_and_user_blockers.sql';
 const row=(id,locations,notes)=>({
  id,owningPhases:['P7.9'],dependencies:['C1','C2','C3','C5','C6'],dependenciesVerified:true,
  applicableCompaniesOrCapabilities:['Command Center','Agent owner/device blocker contract'],
  implementationLocations:locations,
  tests:{
   positive:{applicable:true,references:[positive],justification:null},
   negative:{applicable:true,references:[negative],justification:null},
   failurePath:{applicable:true,references:[failure],justification:null}
  },
  evidence:['Exact canonical owner/device blocker requirement reviewed against current durable blocker metadata, status projection and acknowledgement verification gate.'],
  closureNotes:notes
 });
 return [
  row('CCR-00446',[blocker],"Owner-only blockers enter the explicit needs_user_action state; ordinary non-owner blockers remain blocked. The state is written to the same step, session and project rather than being inferred from UI text."),
  row('CCR-00447',[blocker,device],"The blocker contract accepts and returns the exact pc required_environment value, and status projection preserves it for the owner-facing Agent state."),
  row('CCR-00448',[blocker,device],"The blocker contract accepts and returns the exact phone required_environment value, and status projection preserves it for the owner-facing Agent state."),
  row('CCR-00449',[blocker,device],"The blocker contract accepts and returns the exact local_browser required_environment value, and status projection preserves it for the owner-facing Agent state."),
  row('CCR-00450',[blocker,device],"The blocker contract accepts any_device as the non-device-specific owner environment and status projection defaults missing environment metadata to any_device."),
  row('CCR-00451',[blocker],"A blocker cannot be recorded with an empty reason. The exact trimmed blocker reason is durably stored in step metadata and logged as the step_blocked event message."),
  row('CCR-00452',[blocker,device],"The exact owner action instructions are accepted by the blocker service, durably stored as user_action_instructions and projected unchanged through Agent status."),
  row('CCR-00454',[blocker,device],"The blocker metadata carries resume_after_user_action=true and the status projection exposes that exact resume contract. Owner completion moves the same blocked step into verification_pending instead of completing it."),
  row('CCR-00455',[blocker],"Owner acknowledgement is explicitly not verification: command_center_agent_complete_user_action changes needs_user_action to verification_pending, records awaiting_downstream_verification=true and makes verification the session's exact next action.")
 ];
}
