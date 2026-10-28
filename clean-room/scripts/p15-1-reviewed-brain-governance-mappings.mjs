/** Existing Brain self-audit/governance/security proof only; no runtime or schema implementation changes. */
export function reviewedBrainGovernanceMappings(){
 const t=(f,n)=>`clean-room/tests/${f}.test.mjs :: ${n}`;
 const selfAudit=t('analytics-foundation','self-audit surfaces implemented-unverified, missing, broken and evidence-free claims truthfully');
 const improvementFormat=t('category6-improvements-persistence','P6.13 runtime improvement proposals require evidence/confidence and never install automatically');
 const roadmapPath=t('category6-brain-runtime-view','P6.13 owner improvement decision and scope conversion use governed RPCs and never direct roadmap mutation');
 const generatedNoAuthority=t('category6-brain-adversarial','P6.15 unsupported generated claims never become verified canonical authority');
 const noExecution=t('category6-brain-adversarial','P6.15 improvements cannot self-install and deterministic core survives AI outage');
 const sourceBoundary=t('category3-post-audit-source-platform','source registry uses stable provider identity and historical/untrusted content cannot grant instruction authority');
 const promptBoundary=t('category6-brain-adversarial','P6.15 prompt-like protected instructions remain classified as requests, not side effects');
 const correction=t('category6-brain-adversarial','P6.15 memory correction preserves superseded lineage');
 const contextBoundary=t('category6-brain-adversarial','P6.15 stale, sensitive, low-relevance and cross-project context is excluded');
 const base=(id,phases,loc,pos,neg,notes)=>({
  id,
  owningPhases:phases,
  dependencies:['C1','C2','C3','C5'],
  dependenciesVerified:true,
  applicableCompaniesOrCapabilities:['Command Center','Brain governance / safety / evidence'],
  implementationLocations:loc,
  tests:{
   positive:{applicable:true,references:[pos],justification:null},
   negative:{applicable:true,references:[neg],justification:null},
   failurePath:{applicable:true,references:[neg],justification:null}
  },
  evidence:['Exact canonical requirement reviewed against existing Brain/governance implementation and named executable proof. No runtime, schema, provider, protected asset or production behavior is changed by this mapping.'],
  closureNotes:notes
 });
 return[
  base('CCR-00346',['P13.9'],['clean-room/src/analytics/self-audit.ts#selfAudit'],selfAudit,selfAudit,'The self-audit contract compares expected targets with verified/implemented-unverified/missing/broken state and evidence, surfacing unresolved implementation reality instead of hiding it.'),
  base('CCR-00349',['P6.13'],['clean-room/src/brain/improvements.ts#ImprovementProposal','clean-room/src/brain/improvements.ts#createImprovementProposal'],improvementFormat,improvementFormat,'Brain improvement proposals have an explicit typed format with identity, area, title, evidence, confidence and a hard false installsAutomatically field; executable proof rejects missing evidence and invalid confidence.'),
  base('CCR-00350',['P6.13'],['clean-room/src/runtime/owner-security-provider.ts#BrainConversationRuntimeProvider','clean-room/src/runtime/brain-view.ts#improvementsCenter'],roadmapPath,roadmapPath,'Accepted Brain improvements convert through a governed scope-request RPC path. The executable runtime test proves owner decision plus conversion and explicitly verifies no direct roadmap create/update/advance call occurs.'),
  base('CCR-00351',['P6.15'],['clean-room/src/brain/core.ts#BrainResponseEnvelope','clean-room/src/brain/core.ts#BrainCore'],generatedNoAuthority,generatedNoAuthority,'Brain reasoning/output is wrapped with canonicalWritesAuthorized=false. Generated claims without evidence cannot become verified canonical authority, so thinking alone does not authorize an action or truth mutation.'),
  base('CCR-00352',['P6.13','P6.15'],['clean-room/src/brain/improvements.ts#ImprovementProposal','clean-room/src/brain/improvements.ts#createImprovementProposal'],noExecution,noExecution,'Evidence-backed Brain improvements are proposals only: installsAutomatically is hard false and the adversarial test verifies improvements cannot self-install, separating recommendation from execution.'),
  base('CCR-00356',['P6.15'],['clean-room/src/data/sources.ts#SourceInstructionPolicy','clean-room/src/data/sources.ts#validateSourceIdentity'],sourceBoundary,sourceBoundary,'External/historical source content is governed by trust plus instructionPolicy. Untrusted or historical sources are required to remain data_only and attempts to grant them owner-statement authority are rejected.'),
  base('CCR-00357',['P6.15'],['clean-room/src/brain/conversation.ts#classifyConversationIntent','clean-room/src/brain/core.ts#BrainResponseEnvelope'],promptBoundary,promptBoundary,'Prompt-like text such as ignore prior rules and deploy production now is classified as a protected-action request, not executed as a side effect; the executable adversarial test freezes that boundary.'),
  base('CCR-00358',['P6.15'],['clean-room/src/data/sources.ts#SourceTrust','clean-room/src/data/sources.ts#validateSourceIdentity'],sourceBoundary,sourceBoundary,'Provider/web/email-like external material entering the source platform under untrusted_external is data-only by contract and cannot be upgraded into instruction authority by content.'),
  base('CCR-00362',['P6.15'],['clean-room/src/brain/memory.ts#BrainMemoryLedger','clean-room/src/brain/memory.ts#BrainMemory'],correction,correction,'Brain memory corrections supersede the prior current record without erasing it; the named adversarial test confirms the corrected value becomes current while the prior value remains visible as superseded history.'),
  base('CCR-00363',['P6.4','P6.15'],['clean-room/src/brain/context-builder.ts#buildBrainContext','clean-room/src/brain/context-builder.ts#BrainContextRequest'],contextBoundary,contextBoundary,'Brain context selection requires matching owner/project scope and the adversarial test explicitly excludes a same-owner item from another project, preventing cross-project memory contamination.')
 ];
}
