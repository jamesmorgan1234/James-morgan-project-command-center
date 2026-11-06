/** Bounded read-only verification. Never substitutes diagnostic permission for activation. */
export const PC_ACTIVATION_CONTRACT='cc-pc-activation-probe-v1';
export const PC_CLIENT_CONTRACT='cc-pc-inference-activation-v1';
const HASH=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export async function sha256Text(text){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');}
export async function validateActivationProbe(task,scope,{nowMs=Date.now()}={}){
 const fail=()=>{throw Error('activation_probe_contract_not_verified')};
 if(task.purpose!=='activation_probe'||scope.activationProbeVerified!==true||
   typeof task.activationContractText!=='string'||task.activationContractText.length>30000||
   task.activationContractText!==scope.activationContractText||!HASH.test(task.activationContractHash??'')||
   task.activationContractHash!==scope.activationContractHash||await sha256Text(task.activationContractText)!==task.activationContractHash)fail();
 let c;try{c=JSON.parse(task.activationContractText)}catch{fail()}
 const expiry=Date.parse(c?.expiresAt),issued=Date.parse(c?.issuedAt);
 const s=c?.routeSnapshot;
 if(c?.contract!==PC_ACTIVATION_CONTRACT||c?.purpose!=='activation_probe'||
   c?.authorityRef!=='evd_owner-command-center-brain-activation-20261105'||
   c?.requestId!==task.requestId||c?.conversationId!==task.conversationId||c?.ownerTurnId!==task.ownerTurnId||
   !UUID.test(c?.workerId??'')||c.workerId!==task.workerId||!UUID.test(c?.ownerId??'')||
   c.ownerId!==task.ownerId||c.ownerId!==scope.ownerId||typeof task.projectId!=='string'||!task.projectId||
   c?.companyBuildAuthorized!==false||c?.toolExecutionAuthorized!==false||c?.paidUsageAuthorized!==false||
   !Number.isFinite(nowMs)||!Number.isFinite(expiry)||!Number.isFinite(issued)||issued>nowMs+15000||
   expiry<=nowMs||expiry-issued>21600000||expiry<=issued||
   !s||s.projectId!==task.projectId||s.projectId!==scope.projectId||s.companyId!==scope.companyId||
   s.brainKey!==scope.brainKey||!Number.isSafeInteger(s.brainVersion)||s.brainVersion<1||s.brainVersion!==scope.brainVersion||
   s.providerKey!==`provider:owner-pc:${task.workerId}`||!Number.isSafeInteger(s.providerVersion)||s.providerVersion<1||
   typeof s.modelId!=='string'||!s.modelId||!HASH.test(c?.systemHash??'')||
   typeof scope.system!=='string'||scope.system.length>12000||await sha256Text(scope.system)!==c.systemHash)fail();
 return Object.freeze(c);
}
