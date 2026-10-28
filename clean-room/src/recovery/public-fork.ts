export interface ForkBundle {
  readonly codeRefs: readonly string[];
  readonly publicConfigRefs: readonly string[];
  readonly privateDataRefs: readonly string[];
  readonly secretRefs: readonly string[];
  readonly ownerPolicyRefs: readonly string[];
}

export function assertPublicForkSafe(bundle: ForkBundle): void {
  if (bundle.codeRefs.length === 0) throw new Error("fork requires code identity");
  if (bundle.privateDataRefs.length > 0 || bundle.secretRefs.length > 0 || bundle.ownerPolicyRefs.length > 0) throw new Error("public fork cannot clone private data, secrets, or owner-specific policy");
}

import {recoveryDigest,recoveryImmutable,recoveryList,recoveryRef,requireRecovery} from './contracts.js';
export interface SyntheticForkEntry{readonly ref:string;readonly kind:'code'|'config'|'data'|'policy'|'credential';readonly classification:'public'|'private'|'owner_policy'|'credential';readonly contentDigest:string}
export async function prepareDormantPublicFork(entries:readonly SyntheticForkEntry[],expectedSourceDigest:string){requireRecovery(entries.length>0&&expectedSourceDigest===await recoveryDigest(entries),'fork_source_changed');recoveryList(entries.map(e=>e.ref),true);for(const e of entries){recoveryRef(e.ref);requireRecovery(['code','config','data','policy','credential'].includes(e.kind)&&['public','private','owner_policy','credential'].includes(e.classification)&&/^[a-f0-9]{64}$/.test(e.contentDigest),'fork_source_invalid');requireRecovery(e.ref.startsWith('synthetic:'),'fork_synthetic_only');requireRecovery(!(e.classification==='public'&&['data','policy','credential'].includes(e.kind)),'fork_ambiguous_public_private_kind');}const selected=entries.filter(e=>e.classification==='public');const bundle={codeRefs:selected.filter(e=>e.kind==='code').map(e=>e.ref),publicConfigRefs:selected.filter(e=>e.kind==='config').map(e=>e.ref),privateDataRefs:[],secretRefs:[],ownerPolicyRefs:[]};assertPublicForkSafe(bundle);return recoveryImmutable({bundle,selectedDigests:selected.map(e=>({ref:e.ref,digest:e.contentDigest})),sourceDigest:expectedSourceDigest,forkDigest:await recoveryDigest(bundle),status:'dormant' as const,mayPublish:false as const,mayClonePrivateState:false as const});}
