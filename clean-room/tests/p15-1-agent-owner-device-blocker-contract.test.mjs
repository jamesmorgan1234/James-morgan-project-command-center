import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const deviceRequirementsUrl=new URL('../../supabase/migrations/20261021231000_agent_mode_device_requirements.sql',import.meta.url);
const blockerRuntimeUrl=new URL('../../supabase/migrations/20261021232000_agent_mode_service_work_and_user_blockers.sql',import.meta.url);
const [deviceRequirements,blockerRuntime]=await Promise.all([
 readFile(deviceRequirementsUrl,'utf8'),
 readFile(blockerRuntimeUrl,'utf8')
]);

test('P15.1 owner device blockers preserve exact environment reason action resume and verification-pending contract',()=>{
 assert.match(blockerRuntime,/new_status:=case when[\s\S]*'needs_user_action'[\s\S]*else 'blocked' end/);
 assert.match(blockerRuntime,/p_required_environment not in \('pc','phone','local_browser','any_device'\)/);
 assert.match(blockerRuntime,/Blocker reason is required/);
 assert.match(blockerRuntime,/'blocker_reason',btrim\(p_reason\)/);
 assert.match(blockerRuntime,/'required_environment',p_required_environment/);
 assert.match(blockerRuntime,/'user_action_instructions',nullif\(btrim\(p_user_action_instructions\),''\)/);
 assert.match(blockerRuntime,/'resume_after_user_action',true/);
 assert.match(deviceRequirements,/'required_environment',coalesce\(nullif\(metadata->>'required_environment',''\),'any_device'\)/);
 assert.match(deviceRequirements,/'user_action_instructions',nullif\(metadata->>'user_action_instructions',''\)/);
 assert.match(deviceRequirements,/'resume_after_user_action',coalesce\(\(metadata->>'resume_after_user_action'\)::boolean,true\)/);
});

test('P15.1 owner device blocker rejects invalid environment blank reason and acknowledgement-as-proof',()=>{
 assert.match(blockerRuntime,/if coalesce\(btrim\(p_reason\),''\)='' then raise exception 'Blocker reason is required'; end if/);
 assert.match(blockerRuntime,/if p_required_environment is not null and p_required_environment not in \('pc','phone','local_browser','any_device'\) then raise exception 'Invalid required environment'; end if/);
 assert.match(blockerRuntime,/if st.status<>'needs_user_action' then raise exception 'Step is not awaiting user action'; end if/);
 assert.match(blockerRuntime,/status='verification_pending'/);
 assert.match(blockerRuntime,/'awaiting_downstream_verification',true/);
 assert.doesNotMatch(blockerRuntime,/update public\.agent_steps set status='verified'[\s\S]*user_action_claimed/);
});

test('P15.1 owner device blocker keeps owner action verification pending before same-session resume',()=>{
 assert.match(blockerRuntime,/'Owner reports required action completed'/);
 assert.match(blockerRuntime,/update public\.agent_sessions set status='active',exact_next_action='Verify user action: '\|\|st\.title where id=st\.session_id and owner_id=u/);
 assert.match(blockerRuntime,/update public\.agent_session_projects set state='active' where session_id=st\.session_id and owner_id=u and project_id=st\.project_id/);
 assert.match(blockerRuntime,/'user_action_claimed','Owner reports user-only requirement completed; downstream verification still required'/);
 assert.match(blockerRuntime,/return jsonb_build_object\('ok',true,'step_id',st\.id,'verification_pending',true\)/);
});
