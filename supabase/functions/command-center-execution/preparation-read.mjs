// Owner-scoped, read-only bridge from canonical COMMAND CENTER company records to an
// individual company's future build. No product build, worker, payment, or launch.
const PROJECT_PATTERN = /^project:company:future:(\d{3})$/;
const SHA256 = /^[a-f0-9]{64}$/;
const SOURCE_AUTHORITY = 'e5069834ecb8d44aeb687bd74a04d929dc515cbc';
export class PreparationReadError extends Error {
  constructor(code, status = 409) {
    super(code);
    this.status = status;
  }
}
const requireState = (ok, code, status) => {
  if (!ok) throw new PreparationReadError(code, status);
};
export function scopedCompanyId(projectId) {
  const match = PROJECT_PATTERN.exec(projectId ?? '');
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isSafeInteger(n) || n < 1 || n > 117 || n === 14) return null;
  return `company:future:${match[1]}`;
}
async function readOne(read, table, params, absent, status = 409) {
  const rows = await read(table, { ...params, limit: '1' });
  requireState(Array.isArray(rows) && rows.length === 1, absent, status);
  return rows[0];
}
async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest, x => x.toString(16).padStart(2, '0')).join('');
}

export async function readCompanyBuildPreparation(projectId, read) {
  // Exclusion is checked before ANY database read, including owner-scoped listings.
  const companyId = scopedCompanyId(projectId);
  requireState(companyId !== null, 'project_outside_preparation_scope', 403);
  requireState(typeof read === 'function', 'invalid_read_adapter', 503);
  const project = await readOne(read, 'command_center_project_profiles', {
    project_id: `eq.${projectId}`, select: 'project_id,company_id,status,source_ref,stage'
  }, 'project_not_available', 404);
  requireState(project.project_id === projectId && project.company_id === companyId && project.status === 'active', 'project_identity_mismatch', 403);

  const [roadmap, brain] = await Promise.all([
    readOne(read, 'command_center_project_roadmaps', {
      project_id: `eq.${projectId}`, state: 'eq.current', select: 'project_id,version,state,structure_verified,source_ref'
    }, 'roadmap_not_verified'),
    readOne(read, 'command_center_specialist_brains', {
      project_id: `eq.${projectId}`, brain_key: `eq.brain:${companyId}:v1`, select: 'project_id,brain_key,enabled,verification_state,configuration_ref,provenance_refs'
    }, 'brain_registration_missing')
  ]);
  requireState(roadmap.project_id === projectId && roadmap.state === 'current' && roadmap.structure_verified === true && Number.isSafeInteger(Number(roadmap.version)), 'roadmap_not_verified');
  requireState(brain.project_id === projectId && brain.brain_key === `brain:${companyId}:v1`, 'brain_identity_mismatch');

  const checkpoint = await readOne(read, 'command_center_project_checkpoints', {
    project_id: `eq.${projectId}`, roadmap_version: `eq.${roadmap.version}`,
    select: 'checkpoint_id,roadmap_version,exact_next_work_unit_id,resume_state_hash,evidence_refs,blocker,owner_action',
    order: 'created_at.desc'
  }, 'checkpoint_not_available');
  requireState(Number(checkpoint.roadmap_version) === Number(roadmap.version) &&
    checkpoint.exact_next_work_unit_id?.startsWith(`${projectId}:`) && SHA256.test(checkpoint.resume_state_hash ?? '') &&
    Array.isArray(checkpoint.evidence_refs) && checkpoint.evidence_refs.length > 0, 'checkpoint_inconsistent');

  const unit = await readOne(read, 'command_center_project_work_units', {
    project_id: `eq.${projectId}`, roadmap_version: `eq.${roadmap.version}`,
    work_unit_id: `eq.${checkpoint.exact_next_work_unit_id}`,
    select: 'work_unit_id,title,status,applicable,dependency_ids,gate_ids,evidence_refs'
  }, 'next_unit_not_available');
  requireState(unit.work_unit_id === checkpoint.exact_next_work_unit_id &&
    Array.isArray(unit.evidence_refs) && unit.evidence_refs.length > 0, 'next_unit_inconsistent');

  const [start, reconciliation] = await Promise.all([
    readOne(read, 'command_center_knowledge_claims', {
      project_id: `eq.${projectId}`, claim_id: `eq.company-build-start:${companyId}:v1`,
      select: 'claim_id,project_id,kind,state,truth_state,value_jsonb,source_refs'
    }, 'build_start_packet_missing'),
    readOne(read, 'command_center_knowledge_claims', {
      project_id: `eq.${projectId}`, claim_id: `eq.company-reconciliation:${companyId}:v1`,
      select: 'claim_id,project_id,kind,state,truth_state,value_jsonb,source_refs'
    }, 'reconciliation_missing')
  ]);
  const packet = start.value_jsonb;
  const record = reconciliation.value_jsonb;
  requireState(start.project_id === projectId && start.state === 'current' && start.truth_state === 'known' &&
    packet && packet.project_id === projectId && packet.company_id === companyId &&
    packet.brain_key === brain.brain_key && packet.roadmap_version === Number(roadmap.version) &&
    packet.checkpoint_id === checkpoint.checkpoint_id && packet.initial_work_unit === unit.work_unit_id &&
    packet.resume_state_hash === checkpoint.resume_state_hash &&
    packet.source_checks_completed_in_packet === true && packet.available_prior_records_reconciled === true &&
    typeof packet.instructions === 'string' && packet.instructions.length > 1000 &&
    SHA256.test(packet.instructions_sha256 ?? '') &&
    packet.reconciliation_claim_id === reconciliation.claim_id, 'build_start_packet_inconsistent');
  requireState(reconciliation.project_id === projectId && reconciliation.state === 'current' && reconciliation.truth_state === 'known' &&
    record && record.company_id === companyId && record.project_id === projectId &&
    record.roadmap_version === Number(roadmap.version) && record.brain_key === brain.brain_key &&
    record.initial_checkpoint_id === checkpoint.checkpoint_id &&
    record.first_roadmap_unit === unit.work_unit_id && record.available_canonical_records_reconciled === true &&
    record.source_files_verified === true && SHA256.test(record.roadmap_graph_sha256 ?? '') &&
    record.source_authority_commit === SOURCE_AUTHORITY, 'reconciliation_inconsistent');
  requireState(Array.isArray(start.source_refs) && start.source_refs.length > 0 &&
    Array.isArray(reconciliation.source_refs) && start.source_refs.every(ref => reconciliation.source_refs.includes(ref)), 'source_references_inconsistent');
  requireState(await sha256(packet.instructions) === packet.instructions_sha256, 'instruction_hash_mismatch');

  return {
    companyId, projectId, companyStatus: project.status, preparationStatus: 'source_verified_and_record_reconciled',
    roadmapVersion: Number(roadmap.version), roadmapGraphSha256: record.roadmap_graph_sha256,
    currentWorkUnitCount: record.current_unit_count, historicalWorkUnitCount: record.superseded_history_unit_count,
    brainKey: brain.brain_key, brainRegistered: true, brainEnabled: brain.enabled === true,
    brainExecutionVerified: false, checkpointId: checkpoint.checkpoint_id,
    resumeStateHash: checkpoint.resume_state_hash, firstWorkUnitId: unit.work_unit_id,
    firstWorkUnitTitle: unit.title, firstWorkUnitStatus: unit.status, firstWorkUnitEvidence: unit.evidence_refs,
    blocker: checkpoint.blocker, ownerAction: checkpoint.owner_action,
    sourceRefs: start.source_refs, reconciliationClaimId: reconciliation.claim_id,
    reconciliationScope: record.scope, uninspectedOtherChats: record.uninspected_other_chat_history === true,
    instructions: packet.instructions, instructionsSha256: packet.instructions_sha256,
    productBuilt: false, liveWorkerExecutionVerified: false, ownerAuthorizationForBuildRequired: true,
    sourceAuthorityCommit: SOURCE_AUTHORITY
  };
}
