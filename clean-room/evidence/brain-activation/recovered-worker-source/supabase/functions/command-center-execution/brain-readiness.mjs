/** Pure, zero-side-effect readiness checks. Do not equate saved Brain records with inference. */
const COMPANY = /^project:company:future:(00[1-9]|0[1-9][0-9]|1[01][0-9])$/;
const EDGE = /^supabase-function:([a-z][a-z0-9-]{0,80})$/;
const PC_WORKER = /^owner-pc-worker:([a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})$/i;
export class BrainReadinessError extends Error {
  constructor(code, status=409) { super(code); this.status=status; }
}
export function projectIdentity(projectId) {
  if (projectId === null) return {projectId:null, companyId:null, central:true};
  if (typeof projectId !== 'string' || !COMPANY.test(projectId) || Number(projectId.slice(-3)) > 117)
    throw new BrainReadinessError('invalid_or_unscoped_brain_project',403);
  return {projectId, companyId:`company:future:${projectId.slice(-3)}`, central:false};
}
/** A PC provider needs a current registered-device heartbeat, not just a DB flag. */
export function eligibleInferenceProvider(provider,{devices=[],nowMs=Date.now()}={}) {
  if (!provider || provider.enabled!==true || provider.health!=='available' || provider.verification!=='live_verified' ||
    provider.cost!=='free' || !Array.isArray(provider.capabilities) || !provider.capabilities.includes('brain.respond') ||
    !provider.configuration || typeof provider.configuration!=='object') return false;
  const ref=provider.configuration.execution_ref??'';
  const edge=EDGE.exec(ref);
  if(edge)return edge[1]!=='command-center-execution'&&edge[1]!=='command-center-refresh';
  const pc=PC_WORKER.exec(ref);
  if(!pc || provider.configuration.transport!=='authenticated_outbound' ||
     provider.configuration.canonical_readback_verified!==true ||
     !/^ccpc-acceptance:[a-f0-9]{64}$/.test(provider.configuration.acceptance_ref??''))return false;
  return Array.isArray(devices) && devices.some(d=>d?.worker_id===pc[1] && d?.enabled===true &&
    d?.revoked_at===null && typeof d?.last_seen_at==='string' &&
    Number.isFinite(Date.parse(d.last_seen_at)) &&
    nowMs-Date.parse(d.last_seen_at)>=-15000 && nowMs-Date.parse(d.last_seen_at)<=180000);
}
export function resolveBrainReadiness({projectId,profile,specialist,providers,devices=[],nowMs=Date.now()}) {
  const scope=projectIdentity(projectId);
  const routes=(Array.isArray(providers)?providers:[]).filter(p=>eligibleInferenceProvider(p,{devices,nowMs}));
  if (scope.central) return {available:routes.length>0, code:routes.length?'inference_route_registered':'no_live_verified_free_inference', projectId:null, brainKey:null, provider:routes[0]??null};
  if (!profile || profile.project_id!==projectId || profile.company_id!==scope.companyId)
    return {available:false,code:'project_identity_mismatch',projectId,brainKey:null,provider:null};
  const key=`brain:${scope.companyId}:v1`;
  if (!specialist || specialist.project_id!==projectId || specialist.brain_key!==key)
    return {available:false,code:'specialist_registration_missing',projectId,brainKey:key,provider:null};
  if (specialist.enabled!==true || specialist.health!=='available' || specialist.verification_state!=='live_verified' || specialist.lifecycle!=='active')
    return {available:false,code:'specialist_not_live_verified',projectId,brainKey:key,provider:null};
  const matching=routes.find(p=>Array.isArray(specialist.provider_keys)&&specialist.provider_keys.includes(p.provider_key));
  return {available:!!matching,code:matching?'inference_route_registered':'no_project_authorized_inference',projectId,brainKey:key,provider:matching??null};
}
/** Read-only inventory. It NEVER flips enabled or health, and NEVER claims live responses. */
export function auditCompanyBrainCatalog({profiles, specialists, providers, devices=[], nowMs=Date.now()}) {
  const p=new Map((profiles??[]).map(v=>[v.project_id,v]));
  const b=new Map((specialists??[]).map(v=>[v.project_id,v]));
  const results=[];
  for(let n=1;n<=117;n++) {
    const id=`project:company:future:${String(n).padStart(3,'0')}`;
    const ready=resolveBrainReadiness({projectId:id,profile:p.get(id),specialist:b.get(id),providers,devices,nowMs});
    results.push({projectId:id,brainKey:ready.brainKey,operational:ready.available,reason:ready.code});
  }
  return {total:117,operational:results.filter(x=>x.operational).length,results};
}
