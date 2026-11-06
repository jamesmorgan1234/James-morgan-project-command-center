/** Pure, zero-side-effect readiness checks. Do not equate saved Brain records with inference. */
const COMPANY = /^project:company:future:(00[1-9]|0[1-9][0-9]|[1-9][0-9]{2,96})$/;
const LEGACY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export class BrainReadinessError extends Error {
  constructor(code, status=409) { super(code); this.status=status; }
}
export function projectIdentity(projectId) {
  if (projectId === null) return {projectId:null, companyId:null, central:true};
  if (typeof projectId === 'string' && COMPANY.test(projectId))
    return {projectId, companyId:projectId.slice('project:'.length), central:false};
  if (typeof projectId === 'string' && projectId.length <= 120 && LEGACY.test(projectId))
    return {projectId, companyId:`company:legacy:${projectId}`, central:false};
  throw new BrainReadinessError('invalid_or_unscoped_brain_project',403);
}
/** A PC provider needs a current registered-device heartbeat, not just a DB flag. */
export function eligibleInferenceProvider(provider,{devices=[],nowMs=Date.now()}={}) {
  const config=provider?.configuration;
  if (!Number.isFinite(nowMs) || !provider || provider.enabled!==true || provider.health!=='available' ||
    provider.verification!=='live_verified' || provider.cost!=='free' ||
    !provider.capabilities?.includes('brain.respond.read_only') ||
    !config || !UUID.test(config.worker_id??'') || provider.provider_key!==`provider:owner-pc:${config.worker_id}` ||
    config.gateway_ref!=='supabase:functions:command-center-pc-worker' || config.execution_mode!=='local-ollama' ||
    config.payment_authorized!==false || config.company_build_authorized!==false ||
    !UUID.test(config.live_response_evidence??'') || typeof config.model_id!=='string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,130}$/.test(config.model_id) || config.model_id.endsWith(':cloud') || config.model_id.includes('..')) return false;
  return Array.isArray(devices) && devices.some(d=>d?.worker_id===config.worker_id && d?.enabled===true &&
    d?.revoked_at===null && typeof d?.last_seen_at==='string' &&
    Number.isFinite(Date.parse(d.last_seen_at)) && nowMs-Date.parse(d.last_seen_at)>=-15000 && nowMs-Date.parse(d.last_seen_at)<=180000);
}
export function resolveBrainReadiness({projectId,profile,specialist,providers,devices=[],nowMs=Date.now()}) {
  const scope=projectIdentity(projectId);
  const routes=(Array.isArray(providers)?providers:[]).filter(p=>eligibleInferenceProvider(p,{devices,nowMs}));
  if (scope.central) return {available:routes.length>0, code:routes.length?'inference_route_registered':'no_live_verified_free_inference', projectId:null, brainKey:null, provider:routes[0]??null};
  if (!profile || profile.project_id!==projectId || profile.company_id!==scope.companyId || (scope.companyId.startsWith('company:legacy:') && profile.protected!==true))
    return {available:false,code:'project_identity_mismatch',projectId,brainKey:null,provider:null};
  const key=`brain:${scope.companyId}:v1`;
  if (!specialist || specialist.project_id!==projectId || specialist.brain_key!==key)
    return {available:false,code:'specialist_registration_missing',projectId,brainKey:key,provider:null};
  if (specialist.enabled!==true || specialist.health!=='healthy' || specialist.verification_state!=='verified' || specialist.lifecycle!=='active')
    return {available:false,code:'specialist_not_live_verified',projectId,brainKey:key,provider:null};
  const matching=routes.find(p=>specialist.control_plane==='command_center' && specialist.cost_class==='free' && specialist.supported_project_ids?.length===1 && specialist.supported_project_ids[0]===projectId && specialist.supported_company_ids?.length===1 && specialist.supported_company_ids[0]===scope.companyId && p.scopes?.includes('company-brain-read-only') && Array.isArray(specialist.provider_keys)&&specialist.provider_keys.includes(p.provider_key) && specialist.model_assignments?.some(m=>m.providerKey===p.provider_key && m.modelId===p.configuration.model_id && typeof m.versionRef==='string' && m.versionRef.length>0));
  return {available:!!matching,code:matching?'inference_route_registered':'no_project_authorized_inference',projectId,brainKey:key,provider:matching??null};
}
/** Read-only inventory. It NEVER flips enabled or health, and NEVER claims live responses. */
export function auditCompanyBrainCatalog({profiles, specialists, providers, devices=[], nowMs=Date.now(),includeCentral=false}) {
  const p=new Map((profiles??[]).map(v=>[v.project_id,v]));
  const b=new Map((specialists??[]).map(v=>[v.project_id,v]));
  // Specialist membership comes from the complete Brain registry, never a
  // numbered import batch. Projects without Brains remain project records;
  // do not invent specialist identities to make their counts match.
  if(b.size!==(specialists??[]).length)throw new BrainReadinessError('duplicate_specialist_project_identity');
  const ids=[...b.keys()];
  if(includeCentral)ids.unshift(null);
  const results=[...new Set(ids)].map(id=>{
    let ready;
    try { ready=resolveBrainReadiness({projectId:id,profile:p.get(id),specialist:b.get(id),providers,devices,nowMs}); }
    catch { ready={brainKey:b.get(id)?.brain_key??null,available:false,code:'invalid_registered_project_identity'}; }
    return {projectId:id,brainKey:id===null?'command-center':ready.brainKey,readOnlyRouteAvailable:ready.available,reason:ready.code};
  });
  return {total:results.length,readOnlyRoutesAvailable:results.filter(x=>x.readOnlyRouteAvailable).length,fullOperationalVerification:'not-assessed',results};
}
