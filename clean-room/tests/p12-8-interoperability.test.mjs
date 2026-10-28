import test from 'node:test';import assert from 'node:assert/strict';
import {SpecialistInteroperability,specialistRequestDigest,specialistC2Authorization,specialistInteroperabilityIntent,applySpecialistEvolution,specialistEvolutionIntent,specialistEvolutionC2Authorization} from '../dist/specialists/index.js';
import {AuthSessionStore,PolicyEngine,ProtectedActionGate,DeviceRegistry,ProtectedAuthorizationRegistry,createIntentBinding} from '../dist/security/index.js';
import {fixture,packet,model,step,scope,sourceScope,NOW,LATER,authority,ready,evolutionReview} from './helpers/specialist-interoperability.mjs';

test('P12.8 governed transfer and inheritance preserve exact lineage without copying private state or authority',async()=>{
 for(const operation of ['transfer','inherit']){const f=fixture(),before=f.brains.listModels();const a=await f.controller.decide({...f.request,operation});assert.equal(a.accepted,true,a.reason);assert.equal(a.artifact.controlPlane,'command_center');assert.equal(a.artifact.executable,false);assert.deepEqual(a.artifact.methods,[{brainId:'brn_recipient',methodId:'mth_analyze',version:1,capabilityKey:'capability:analyze'}]);assert.ok(a.artifact.sourceVersionRefs.includes('lrn_example@1'));assert.ok(a.artifact.rollbackEvidenceIds.includes('evd_rollback'));assert.deepEqual(f.brains.listModels(),before);assert.doesNotMatch(JSON.stringify(a),/PRIVATE DISCOVERY|PRIVATE ACTION|private:source/);assert.deepEqual(await f.controller.decide({...f.request,operation}),a);}
});
for(const [label,mutate] of [
 ['missing compatibility',f=>f.state.review=undefined],['ontology',f=>f.state.review.ontologyVersion=2],['method version',f=>f.state.review.methodVersion=2],['company type',f=>f.state.context.companyType='other'],['domain',f=>f.state.context.domainId='dom_other'],['environment',f=>f.state.context.environment='production'],['provider version',f=>f.state.context.providerModelVersion='remote@2'],['task',f=>f.state.context.taskClass='write'],['sensitivity',f=>f.state.context.sensitivity=1],['budget',f=>f.state.context.resourceBudgetUnits=0],['operating constraints',f=>f.state.context.operatingConstraints=[]],['policy',f=>f.state.review.requiredPolicyKeys=['admin']],['dependency',f=>f.state.review.dependencyVersionRefs=['unknown@2']],['prerequisite',f=>f.state.review.prerequisites=['missing']],['contraindication',f=>{f.state.review.contraindications=['unsafe'];f.state.context.conditions=['unsafe'];}],['shadow required',f=>f.state.review.risk='high'],['unverified evidence',f=>f.state.evidencePatch.record={id:'evd_authority',subjectId:'x',strength:'self_report_only',sourceRef:'x',recordedAt:NOW,verified:true}],['review stale',f=>f.state.review.revalidateAfter=NOW],['revoked authorization',f=>f.state.allowed=false]
])test('P12.8 transfer fails closed: '+label,async()=>{const f=fixture();mutate(f);const before=f.brains.listModels();const a=await f.controller.decide(f.request);assert.equal(a.accepted,false,label);assert.equal(a.artifact,undefined);assert.deepEqual(f.brains.listModels(),before);assert.equal(f.state.records.size,1);});

test('P12.8 private project/company/owner learning cannot leak to unrelated recipients',async()=>{
 for(const privacy of [{classification:'project_private',scopeRef:sourceScope.projectId},{classification:'company_private',scopeRef:sourceScope.companyId},{classification:'owner_private'}]){const f=fixture();f.promotions.submit(packet({version:2,privacy:{ownerId:scope.ownerId,...privacy}}),NOW);f.promotions.decide('lrn_example','prm_example',ready,['validator'],NOW);f.state.review.packetVersion=2;f.request.skills[0].packetVersion=2;f.request.skills[0].promotionVersion=2;assert.equal((await f.controller.decide(f.request)).accepted,false);}
 const f=fixture();f.state.evidencePatch.shareable=false;assert.equal((await f.controller.decide(f.request)).accepted,false);
});

test('P12.8 revoked promotion, unresolved negative evidence and local alternatives prevent propagation',async()=>{
 const f=fixture();f.promotions.retract('prm_example','evd_retracted',NOW);assert.equal((await f.controller.decide(f.request)).accepted,false);
 const g=fixture();g.promotions.submit(packet({version:2,negativeKnowledge:['negative:missing']}),NOW);g.promotions.decide('lrn_example','prm_example',ready,['validator'],NOW);g.state.review.packetVersion=2;g.request.skills[0].packetVersion=2;g.request.skills[0].promotionVersion=2;assert.equal((await g.controller.decide(g.request)).accepted,false);
 const h=fixture();h.promotions.submit(packet({version:2,proposedPromotionClass:'ALTERNATIVE'}),NOW);h.promotions.decide('lrn_example','prm_example',ready,['validator'],NOW);h.state.review.packetVersion=2;h.request.skills[0].packetVersion=2;h.request.skills[0].promotionVersion=2;assert.equal((await h.controller.decide(h.request)).accepted,false);
});

test('P12.8 repeatable procedure learning retains ordered steps, source runs and rollback, and compiles to Agency data only',async()=>{
 const f=fixture(),procedure={id:'mth_analyze',version:1,packetId:'lrn_example',promotionId:'prm_example',sourceRunIds:['run_one','run_two'],prerequisites:[],steps:[step()],rollbackEvidenceId:'evd_rollback'};
 const request={...f.request,operation:'procedure',procedure};const a=await f.controller.decide(request);assert.equal(a.accepted,true,a.reason);assert.deepEqual(a.artifact.procedure,procedure);
 const compiled=await f.controller.decide({...f.request,id:"dec_compiled-procedure",operation:"compile",steps:a.artifact.procedure.steps});assert.equal(compiled.accepted,true,compiled.reason);assert.equal(compiled.artifact.tasks[0].capability,"capability:analyze");
 for(const patch of [{sourceRunIds:['run_one']},{version:2},{steps:[step('tsk_one',{permissionKeys:['admin']})]},{steps:[step('tsk_one',{verificationCriteria:[]})]},{steps:[step('tsk_one',{dependsOn:['tsk_missing']})]}]){const g=fixture();assert.equal((await g.controller.decide({...request,procedure:{...procedure,...patch}})).accepted,false);}
 const g=fixture();g.state.runPatch.verified=false;assert.equal((await g.controller.decide(request)).accepted,false);
 const h=fixture();h.state.runPatch.scope=scope;assert.equal((await h.controller.decide(request)).accepted,false);
});

test('P12.8 composition/compiler interoperability is deterministic, DAG-compatible, scoped and cannot queue execution',async()=>{
 for(const operation of ['compose','compile']){const f=fixture();const request={...f.request,operation,skills:[...f.request.skills,{...f.request.skills[0],recipientBrainId:'brn_other'}],steps:[step(),step('tsk_two',{recipientBrainId:'brn_other',dependsOn:['tsk_one']})]};const a=await f.controller.decide(request);assert.equal(a.accepted,true,a.reason);assert.equal(a.artifact.arbitration,'command_center');assert.deepEqual(a.artifact.dataShared,[]);assert.equal(a.artifact.tasks[1].dependencyIds[0],'tsk_one');assert.ok(a.artifact.tasks.every(t=>t.state==='blocked'&&t.blocker==='requires_current_agency_admission'&&t.projectId===scope.projectId));assert.deepEqual(await f.controller.decide(request),a);}
});
for(const [label,steps] of [['unknown skill',[step('tsk_one',{methodId:'mth_unknown'})]],['permissions',[step('tsk_one',{permissionKeys:['admin']})]],['cycle',[step('tsk_one',{dependsOn:['tsk_two']}),step('tsk_two',{dependsOn:['tsk_one']})]],['unknown construct',[step('tsk_one',{execute:true})]],['duplicate identity',[step(),step()]],['unsupported version',[step('tsk_one',{methodVersion:2})]]])test('P12.8 composition rejects '+label+' without specialist mutation',async()=>{const f=fixture(),before=f.brains.listModels();assert.equal((await f.controller.decide({...f.request,operation:'compile',steps})).accepted,false);assert.deepEqual(f.brains.listModels(),before);});

test('P12.8 fresh C2 exact-digest owner authorization is required and revocation prevents recovery replay',async()=>{
 const f=fixture(),sessions=new AuthSessionStore(),policies=new PolicyEngine(),grants=new ProtectedAuthorizationRegistry();
 sessions.register({id:'session',...scope,environment:'test',assurance:'fresh_passkey_uv',scopes:['specialists:transfer'],state:'active',createdAt:NOW,expiresAt:LATER,lastValidatedAt:NOW,lastVerifiedAt:NOW});
 policies.register({action:'specialists.transfer',version:1,enabled:true,riskClass:'high',requiredScopes:['specialists:transfer'],minimumAssurance:'fresh_passkey_uv',freshVerificationMaxAgeMs:300000,ownerOnly:true,allowProjectWildcard:false});
 const digest=await specialistRequestDigest(f.request),intent=specialistInteroperabilityIntent(f.request,digest,'test');
 grants.register({id:'evd_authority',ownerId:scope.ownerId,sessionId:'session',action:'specialists.transfer',authorizationIntentBinding:createIntentBinding(intent),authoritySource:'owner_verified',sourceRef:'owner:test',state:'authorized',issuedAt:NOW,expiresAt:LATER});
 f.deps.authorize=specialistC2Authorization(new ProtectedActionGate(sessions,policies,new DeviceRegistry()),grants,'session','test');
 const a=await f.controller.decide(f.request);assert.equal(a.accepted,true,a.reason);
 assert.equal((await f.controller.decide({...f.request,version:2})).accepted,false);
 grants.revoke('evd_authority',NOW,'test-revocation');await assert.rejects(f.controller.decide(f.request),/recovery_requires|authorization_changed/);
});

test('P12.8 persistence loss, concurrent revocation, stale restore and digest collisions never return acceptance',async()=>{
 const f=fixture();f.deps.store={async append(){throw new Error('offline');}};await assert.rejects(f.controller.decide(f.request),/offline/);
 const g=fixture();const append=g.store.append;g.deps.store={async append(d){const r=await append(d);g.state.allowed=false;return r;}};await assert.rejects(g.controller.decide(g.request),/authorization_changed/);
 const h=fixture();await h.controller.decide(h.request);await assert.rejects(h.controller.decide({...h.request,operation:'inherit'}),/idempotency/);h.state.now=LATER;await assert.rejects(h.controller.decide(h.request),/recovery_requires|Stale learning/);
});

test('P12.8 dynamic create/evolve/split/merge/suspend/retire uses canonical atomic PIF.3 batches',()=>{
 const f=fixture();
 const created=model('brn_new',{domain:'new'});assert.equal(applySpecialistEvolution(f.brains,{operation:'create',sources:[],targets:[created]},authority,evolutionReview(),()=>true)[0].key,'brn_new');
 applySpecialistEvolution(f.brains,{operation:'evolve',sources:[{id:'brn_new',version:1}],targets:[{...created,version:2,strengths:['improved']}]},authority,evolutionReview(),()=>true);
 const children=[model('brn_child-one',{domain:'child-one'}),model('brn_child-two',{domain:'child-two'})];
 applySpecialistEvolution(f.brains,{operation:'split',sources:[{id:'brn_new',version:2}],targets:children},authority,evolutionReview(),()=>true);assert.equal(f.brains.getModel('brn_new').lifecycle,'retired');
 applySpecialistEvolution(f.brains,{operation:'merge',sources:children.map(m=>({id:m.key,version:1})),targets:[model('brn_merged',{domain:'merged'})]},authority,evolutionReview(),()=>true);assert.ok(children.every(m=>f.brains.getModel(m.key).lifecycle==='retired'));
 applySpecialistEvolution(f.brains,{operation:'suspend',sources:[{id:'brn_merged',version:1}],targets:[]},authority,evolutionReview(),()=>true);assert.equal(f.brains.getModel('brn_merged').lifecycle,'suspended');
 applySpecialistEvolution(f.brains,{operation:'retire',sources:[{id:'brn_merged',version:2}],targets:[]},authority,evolutionReview(),()=>true);assert.equal(f.brains.getModel('brn_merged').learningEligibility,'none');
});

test('P12.8 unsafe evolution rejects atomically: stale versions, duplicates, missing need, authority, ontology, scope and budget',()=>{
 for(const [patch,review,authorized,actor] of [[{version:2},{},true,'command_center'],[{}, {unmetCapabilityKeys:[]},true,'command_center'],[{}, {ontologyVersion:2},true,'command_center'],[{costClass:'paid'},{},true,'command_center'],[{supportedProjectIds:['prj_other']},{},true,'command_center'],[{permissionKeys:['admin']},{},true,'command_center'],[{},{},false,'command_center'],[{},{},true,'specialist']]){
 const f=fixture(),before=f.brains.listModels();assert.throws(()=>applySpecialistEvolution(f.brains,{operation:'create',sources:[],targets:[model('brn_new',{domain:'new',...patch})]},{...authority,actor},evolutionReview(review),()=>authorized));assert.deepEqual(f.brains.listModels(),before);}
 const f=fixture(),before=f.brains.listModels();assert.throws(()=>f.brains.applyModelBatch([{model:model('brn_new'),expectedVersion:null},{model:model('brn_source',{version:2}),expectedVersion:99}],authority),/conflict/);assert.deepEqual(f.brains.listModels(),before);
});

test('P12.8 recipient local contraindications, known failures and missing tools prevent reuse',async()=>{
 const f=fixture();f.state.review.risk='high';f.state.review.shadowEvidenceIds=['evd_shadow'];assert.equal((await f.controller.decide(f.request)).accepted,true);
 const g=fixture();g.state.negative=[{id:'negative:block',version:1,statement:'synthetic contraindication',sourceRegime:{},contraindication:{companyId:scope.companyId},failureSignature:'test',recoveryLessons:['rollback'],evidenceRefs:['evd_failure'],evaluatorEvidenceRefs:['evd_eval'],active:true,invalidatedByEvidenceRefs:[],recordedAt:NOW,revalidateAfter:LATER}];assert.equal((await g.controller.decide(g.request)).accepted,false);
 const h=fixture();const m=h.brains.getModel('brn_recipient');h.brains.replaceModel({...m,version:2,toolKeys:[]},1,authority);assert.equal((await h.controller.decide(h.request)).accepted,false);
});

test('P12.8 canonical lifecycle rejects unsafe transitions and tuple-key collisions without mutation',async()=>{
 const {SpecialistLifecycleRegistry}=await import('../dist/specialists/index.js');const r=new SpecialistLifecycleRegistry();
 assert.throws(()=>r.registerType({typeKey:'example',truthOwner:'command_center',isolationClass:'specialist:example',requiredProviderCapabilities:[],sourceRefs:['source']}),/canonical truth/);
 r.registerType({typeKey:'example',truthOwner:'specialist:example',isolationClass:'specialist:example',requiredProviderCapabilities:[],sourceRefs:['source']});
 const p={id:'one',ownerId:'a:b',projectId:'c',typeKey:'example',displayName:'Example',canonicalRef:'one',status:'active',providerCapabilities:[],sourceRefs:['source']};r.registerProject(p);r.registerProject({...p,id:'two',ownerId:'a',projectId:'b:c',canonicalRef:'two'});assert.equal(r.list().length,2);
 const auth={authorizationRef:'evd_archive',ownerId:'a:b',projectId:'c',action:'archive'};r.archive('a:b','c',auth);const before=r.list();
 assert.throws(()=>r.rename('a:b','c','New',{...auth,action:'rename'}),/inactive/);assert.throws(()=>r.replaceProject('a:b','c',{...p,id:'new',projectId:'new',canonicalRef:'new'},{...auth,action:'replace',targetProjectId:'new'}),/inactive/);assert.deepEqual(r.list(),before);
 assert.throws(()=>r.registerProject({...p,id:'bad',projectId:'bad',canonicalRef:'bad',status:'replaced'}),/must start/);
});


test('P12.8 lifecycle integrates exact C2 plan approval and cannot expand a project session',()=>{
 const f=fixture(),sessions=new AuthSessionStore(),policies=new PolicyEngine(),grants=new ProtectedAuthorizationRegistry();
 sessions.register({id:'session',...scope,environment:'test',assurance:'fresh_passkey_uv',scopes:['specialists:lifecycle'],state:'active',createdAt:NOW,expiresAt:LATER,lastValidatedAt:NOW,lastVerifiedAt:NOW});
 policies.register({action:'specialists.lifecycle',version:1,enabled:true,riskClass:'high',requiredScopes:['specialists:lifecycle'],minimumAssurance:'fresh_passkey_uv',freshVerificationMaxAgeMs:300000,ownerOnly:true,allowProjectWildcard:false});
 const plan={operation:'create',sources:[],targets:[model('brn_new',{domain:'new',supportedCompanyIds:[scope.companyId],supportedProjectIds:[scope.projectId]})]},review=evolutionReview();
 grants.register({id:'evd_authority',ownerId:scope.ownerId,sessionId:'session',action:'specialists.lifecycle',authorizationIntentBinding:createIntentBinding(specialistEvolutionIntent(scope,plan,review,'test')),authoritySource:'owner_verified',sourceRef:'owner:test',state:'authorized',issuedAt:NOW,expiresAt:LATER});
 const authorize=specialistEvolutionC2Authorization(new ProtectedActionGate(sessions,policies,new DeviceRegistry()),grants,f.brains,'session',scope,'test',()=>NOW,f.deps.evidence);
 assert.equal(authorize(plan,review),true);f.state.evidencePatch.shareable=false;assert.equal(authorize(plan,review),false);f.state.evidencePatch={};assert.equal(authorize({...plan,targets:[model('brn_other-new')]},review),false);
 assert.equal(applySpecialistEvolution(f.brains,plan,authority,review,authorize)[0].key,'brn_new');
 grants.revoke('evd_authority',NOW,'revoked');assert.equal(authorize(plan,review),false);
});

test('P12.8 collaboration discovery selects compatible scoped specialists deterministically without private context',async()=>{
 const {discoverSpecialistCollaboration}=await import('../dist/specialists/index.js');const f=fixture();
 const a=discoverSpecialistCollaboration(f.brains,scope,['capability:analyze'],'analysis','example',NOW);assert.equal(a.controlPlane,'command_center');assert.equal(a.executable,false);assert.equal(a.candidates[0].candidates.length,3);assert.deepEqual(discoverSpecialistCollaboration(f.brains,scope,['capability:analyze'],'analysis','example',NOW),a);
 f.brains.suspendModel('brn_other',1,authority);assert.equal(discoverSpecialistCollaboration(f.brains,scope,['capability:analyze'],'analysis','example',NOW).candidates[0].candidates.length,2);
 assert.throws(()=>discoverSpecialistCollaboration(f.brains,{...scope,projectId:'prj_private-other'},['capability:analyze'],'analysis','example',NOW),/no_compatible/);assert.throws(()=>discoverSpecialistCollaboration(f.brains,scope,['capability:unknown'],'analysis','example',NOW),/no_compatible/);
});


test('P12.8 private scoped reuse and compiled schema incompatibility are explicit',async()=>{
 const f=fixture();f.promotions.submit(packet({version:2,privacy:{ownerId:scope.ownerId,classification:'project_private',scopeRef:sourceScope.projectId},proposedScope:{scope:'project',ref:sourceScope.projectId}}),NOW);f.promotions.decide('lrn_example','prm_example',ready,['validator'],NOW);f.state.review.packetVersion=2;f.request.skills[0].packetVersion=2;f.request.skills[0].promotionVersion=2;f.request.scope=sourceScope;
 const resolve=f.deps.evidence;f.deps.evidence=id=>({...resolve(id),scope:sourceScope,shareable:false});const result=await f.controller.decide(f.request);assert.equal(result.accepted,true,result.reason);assert.doesNotMatch(JSON.stringify(result),/PRIVATE DISCOVERY/);
 const g=fixture(),c=g.capabilities.get('capability:analyze');g.capabilities.replace({...c,version:2,outputVersion:2,compatibleOutputVersions:[2]},1);g.request.skills[0].capabilityVersion=2;assert.equal((await g.controller.decide({...g.request,operation:'compile',steps:[step(),step('tsk_two',{dependsOn:['tsk_one']})]})).accepted,false);
});


test('P12.8 durable evolution storage failure leaves all canonical in-process models unchanged',async()=>{
 const {PostgresSpecialistEvolutionStore,commitSpecialistEvolution}=await import('../dist/specialists/index.js');const f=fixture(),before=f.brains.listModels();
 const store=new PostgresSpecialistEvolutionStore(async()=>{throw new Error('isolated storage unavailable');});
 await assert.rejects(commitSpecialistEvolution(scope.ownerId,f.brains,store,{operation:'create',sources:[],targets:[model('brn_new',{domain:'new'})]},authority,evolutionReview(),()=>true),/storage unavailable/);assert.deepEqual(f.brains.listModels(),before);
});
