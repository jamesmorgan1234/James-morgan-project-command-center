/** Owner-only, nonexecuting retrieval of prepared company starting instructions.
 * Every field is reconciled against independently stored canonical records.
 * Only #001–#117 excluding #014 is in scope. This module never writes or starts work.
 */
const UUID = /^[-a-f\d]{36}$/i;
const SHA256 = /^[a-f\d]{64}$/;
const PREPARED_PROJECT = /^project:company:future:(\d{3})$/;
const SOURCE_COMMIT = 'e5069834ecb8d44aeb687bd74a04d929dc515cbc';

type DataRecord = Record<string, unknown>;
function record(value: unknown): DataRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as DataRecord : null;
}
function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
function strList(value: unknown): readonly string[] {
  return Array.isArray(value) && value.every(v => typeof v === 'string') ? value : [];
}
function fail(condition: unknown, code: string): asserts condition {
  if (!condition) throw new Error(code);
}

export function preparedCompanyId(projectId: string): string | null {
  const match = PREPARED_PROJECT.exec(projectId);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isSafeInteger(n) || n < 1 || n > 117 || n === 14) return null;
  return `company:future:${match[1]}`;
}

export interface CompanyBuildStartView {
  readonly projectId: string;
  readonly companyId: string;
  readonly instructions: string;
  readonly instructionsSha256: string;
  readonly roadmapVersion: number;
  readonly checkpointId: string;
  readonly firstWorkUnitId: string;
  readonly reconciliationClaimId: string;
  readonly sourceRefs: readonly string[];
  readonly reconciliationScope: string;
  readonly otherChatHistoriesInspected: false;
  readonly executionAuthorized: false;
  readonly companyProductBuilt: false;
  readonly verifiedSourcePacket: true;
}

export async function validateCompanyBuildStart(
  projectId: string,
  values: Readonly<{ project: unknown; roadmap: unknown; checkpoint: unknown; start: unknown; reconciliation: unknown }>
): Promise<CompanyBuildStartView> {
  const companyId = preparedCompanyId(projectId);
  fail(companyId !== null, 'Company is outside this 116-company preparation scope');
  const project = record(values.project);
  const roadmap = record(values.roadmap);
  const checkpoint = record(values.checkpoint);
  const start = record(values.start);
  const reconciliation = record(values.reconciliation);
  fail(project && project.project_id === projectId && project.company_id === companyId && project.status === 'active', 'Company registration is not verified');
  fail(roadmap && roadmap.project_id === projectId && roadmap.state === 'current' && roadmap.structure_verified === true
    && Number.isSafeInteger(Number(roadmap.version)), 'Company roadmap is not verified');
  fail(checkpoint && UUID.test(str(checkpoint.checkpoint_id)) &&
    Number(checkpoint.roadmap_version) === Number(roadmap.version) &&
    str(checkpoint.exact_next_work_unit_id).startsWith(projectId + ':') &&
    SHA256.test(str(checkpoint.resume_state_hash)), 'Company initial checkpoint is inconsistent');
  const startClaim = 'company-build-start:' + companyId + ':v1';
  const reconciliationClaim = 'company-reconciliation:' + companyId + ':v1';
  fail(start && start.project_id === projectId && start.claim_id === startClaim &&
    start.state === 'current' && start.truth_state === 'known', 'Verified build-start claim is missing');
  fail(reconciliation && reconciliation.project_id === projectId &&
    reconciliation.claim_id === reconciliationClaim && reconciliation.state === 'current' &&
    reconciliation.truth_state === 'known', 'Company reconciliation claim is missing');
  const packet = record(start.value_jsonb);
  const prior = record(reconciliation.value_jsonb);
  fail(packet && prior, 'Company preparation evidence is not readable');
  const instructions = str(packet.instructions);
  const refs = strList(start.source_refs);
  const priorRefs = strList(reconciliation.source_refs);
  fail(packet.company_id === companyId && packet.project_id === projectId &&
    packet.roadmap_version === Number(roadmap.version) && packet.checkpoint_id === checkpoint.checkpoint_id &&
    packet.initial_work_unit === checkpoint.exact_next_work_unit_id &&
    packet.resume_state_hash === checkpoint.resume_state_hash &&
    packet.reconciliation_claim_id === reconciliationClaim &&
    packet.source_checks_completed_in_packet === true && packet.available_prior_records_reconciled === true &&
    packet.product_built === false && packet.brain_operational === false &&
    packet.owner_approval_to_execute === false, 'Company build-start record is inconsistent');
  fail(prior.company_id === companyId && prior.project_id === projectId &&
    prior.roadmap_version === Number(roadmap.version) &&
    prior.initial_checkpoint_id === checkpoint.checkpoint_id &&
    prior.first_roadmap_unit === checkpoint.exact_next_work_unit_id &&
    prior.source_authority_commit === SOURCE_COMMIT &&
    prior.source_files_verified === true && prior.available_canonical_records_reconciled === true &&
    prior.uninspected_other_chat_history === true &&
    SHA256.test(str(prior.roadmap_graph_sha256)), 'Previous-work reconciliation is inconsistent');
  fail(refs.length > 0 && refs.every(ref => priorRefs.includes(ref)) &&
    !refs.some(ref => /company:future:014|\/014_[A-Z]/.test(ref)), 'Company source reference mismatch');
  fail(instructions.length >= 1000 &&
    instructions.includes(companyId) && instructions.includes(reconciliationClaim) &&
    instructions.includes(str(checkpoint.exact_next_work_unit_id)) &&
    SHA256.test(str(packet.instructions_sha256)), 'Build-start instructions are incomplete');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(instructions)));
  const actual = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
  fail(actual === packet.instructions_sha256, 'Build-start instructions failed their integrity check');
  return Object.freeze({
    projectId, companyId, instructions, instructionsSha256: actual,
    roadmapVersion: Number(roadmap.version), checkpointId: str(checkpoint.checkpoint_id),
    firstWorkUnitId: str(checkpoint.exact_next_work_unit_id), reconciliationClaimId: reconciliationClaim,
    sourceRefs: Object.freeze([...refs]), reconciliationScope: str(prior.scope),
    otherChatHistoriesInspected: false as const, executionAuthorized: false as const,
    companyProductBuilt: false as const, verifiedSourcePacket: true as const
  });
}
