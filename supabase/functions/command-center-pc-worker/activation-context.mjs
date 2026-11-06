/** Diagnostic context only. Canonical snapshot must come from the service RPC. */
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
const canonical=value=>{
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
 return value;
};
export async function buildActivationContext({task,snapshot,ownerId,workerId,nowMs=Date.now()}){
 const fail=()=>{throw Error('activation_context_not_verified')};
 if(task?.purpose!=='activation_probe'||task.ownerId!==ownerId||task.workerId!==workerId||typeof task.projectId!=='string'||
 typeof task.activationContractText!=='string'||task.activationContractText.length>30000||
 await hash(task.activationContractText)!==task.activationContractHash)fail();
 let c;try{c=JSON.parse(task.activationContractText)}catch{fail()}
 const s=c?.routeSnapshot;
 if(c?.contract!=='cc-pc-activation-probe-v1'||c?.purpose!=='activation_probe'||
 c?.authorityRef!=='evd_owner-command-center-brain-activation-20261105'||c?.ownerId!==ownerId||c?.workerId!==workerId||
 c?.requestId!==task.requestId||c?.conversationId!==task.conversationId||c?.ownerTurnId!==task.ownerTurnId||
 c?.companyBuildAuthorized!==false||c?.toolExecutionAuthorized!==false||c?.paidUsageAuthorized!==false||
 !Number.isFinite(nowMs)||!Number.isFinite(Date.parse(c?.issuedAt))||Date.parse(c.issuedAt)>nowMs+15000||
 !Number.isFinite(Date.parse(c?.expiresAt))||Date.parse(c.expiresAt)<=nowMs||
 Date.parse(c.expiresAt)<=Date.parse(c.issuedAt)||Date.parse(c.expiresAt)-Date.parse(c.issuedAt)>21600000||
 !s||JSON.stringify(canonical(s))!==JSON.stringify(canonical(snapshot))||s.projectId!==task.projectId||
 typeof s.system!=='string'||s.system.length>12000||await hash(s.system)!==c.systemHash)fail();
 return {verified:true,activationProbeVerified:true,ownerId,projectId:s.projectId,companyId:s.companyId,
 brainKey:s.brainKey,brainVersion:s.brainVersion,specialistEnabled:s.specialistEnabled===true,
 specialistLiveVerified:s.specialistEnabled===true&&s.specialistHealth==='healthy'&&s.specialistVerification==='verified'&&s.specialistLifecycle==='active',
 system:s.system,activationContractText:task.activationContractText,activationContractHash:task.activationContractHash};
}
