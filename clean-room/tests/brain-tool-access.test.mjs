import test from 'node:test';import assert from 'node:assert/strict';
import{discoverBrainTools,authorizeBrainToolAction}from'../dist/brain/tool-access.js';
const now='2026-11-06T04:20:00Z';
function fixture(key='browser'){
 const tool={key,ownerId:'owner',provider:'included',versionRef:'v1',actionKeys:['public.read','account.read','file.write','publish'],actionEffects:{'public.read':'public_read','account.read':'private_read','file.write':'local_write',publish:'publish'},environment:'included_chat',available:true,cost:'free',authenticationRequired:false,authenticated:true,projectIds:['project:001'],companyIds:['company:001'],accountRefs:['account:001'],evidenceRef:'evidence:verified-runtime',verifiedAt:now};
 const request={ownerId:'owner',projectId:'project:001',companyId:'company:001',toolKey:key,actionKey:'public.read',effect:'public_read',now,maximumHealthAgeMs:180000,authority:{issuer:'command_center',ownerId:'owner',projectId:'project:001',companyId:'company:001',actionKeys:tool.actionKeys,accountRefs:tool.accountRefs,reference:'owner:authorized-task',expiresAt:'2026-11-06T05:00:00Z',protectedActionAuthorized:false}};
 return{tool,request};
}
for(const key of ['browser','code','research','files','memory','planning','github','new-tool-never-hard-coded'])test(key+' is discoverable and usable for its authorized task',()=>{const{tool,request}=fixture(key);const c=discoverBrainTools([tool]);assert.equal(c[0].key,key);assert.equal(authorizeBrainToolAction(c,request).allowed,true)});
test('browser can research another company public information without accessing its private account',()=>{const{tool,request}=fixture();request.resourceCompanyId='competitor';assert.equal(authorizeBrainToolAction([tool],request).allowed,true)});
test('private account read and local file writes are allowed inside their authorized company',()=>{for(const[action,effect]of[['account.read','private_read'],['file.write','local_write']]){const{tool,request}=fixture();Object.assign(request,{actionKey:action,effect,accountRef:'account:001',resourceCompanyId:'company:001'});assert.equal(authorizeBrainToolAction([tool],request).allowed,true)}});
for(const[label,change,reason]of[
 ['private cross-company read',r=>Object.assign(r.request,{actionKey:'account.read',effect:'private_read',accountRef:'account:001',resourceCompanyId:'company:002'}),'cross_company_or_project_resource'],
 ['wrong account',r=>Object.assign(r.request,{actionKey:'account.read',effect:'private_read',accountRef:'account:002'}),'exact_account_binding_required'],
 ['paid route',r=>r.tool.cost='paid','zero_cost_route_required'],['unknown cost',r=>r.tool.cost='unknown','zero_cost_route_required'],
 ['unavailable runtime',r=>r.tool.available=false,'tool_runtime_unavailable'],['missing runtime proof',r=>r.tool.evidenceRef='','fresh_tool_health_evidence_required'],
 ['stale health',r=>r.tool.verifiedAt='2026-11-05T00:00:00Z','fresh_tool_health_evidence_required'],
 ['forged public effect',r=>Object.assign(r.request,{actionKey:'account.read',effect:'public_read'}),'action_effect_contract_mismatch'],
 ['publication without approval',r=>Object.assign(r.request,{actionKey:'publish',effect:'publish',accountRef:'account:001'}),'specific_protected_action_authority_required'],
 ['expired authority',r=>r.request.authority.expiresAt='2026-11-05T00:00:00Z','current_action_authority_required']
])test(label+' blocks only the action, never excludes the capability',()=>{const f=fixture();change(f);const v=authorizeBrainToolAction([f.tool],f.request);assert.equal(v.allowed,false);assert.equal(v.reason,reason);assert.equal(v.capabilityExcluded,false);assert.equal(discoverBrainTools([f.tool]).length,1)});
test('approved protected action still uses exact account, cost and scope checks',()=>{const{tool,request}=fixture();Object.assign(request,{actionKey:'publish',effect:'publish',accountRef:'account:001'});request.authority.protectedActionAuthorized=true;assert.equal(authorizeBrainToolAction([tool],request).allowed,true);request.accountRef='account:002';assert.equal(authorizeBrainToolAction([tool],request).allowed,false)});
