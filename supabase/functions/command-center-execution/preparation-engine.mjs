// Deterministic central execution adapter for source-integrity preparation only.
// It never builds a company, starts a specialist Brain, authorizes protected work,
// activates a provider, or processes the separately controlled company.
const SOURCE_ROOT = 'roadmap/portfolio-future-architecture/companies/';
const SOURCE_PATH = /^roadmap\/portfolio-future-architecture\/companies\/(\d{3})_[A-Z0-9_]+\.md$/;
const HEX64 = /^[a-f0-9]{64}$/;
const HEX40 = /^[a-f0-9]{40}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const SOURCE_LIMIT_BYTES = 1024 * 1024;

export class PreparationError extends Error {
  constructor(code, status = 409) { super(code); this.status = status; }
}
function ensure(value, code, status = 409) {
  if (!value) throw new PreparationError(code, status);
}
export function allowedPreparationProject(projectId) {
  const match = /^project:company:future:(\d{3})$/.exec(projectId ?? '');
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isSafeInteger(n) || n < 1 || n > 117 || n === 14) return null;
  return match[1];
}
export function validatePreparationRequest(body) {
  ensure(body && typeof body === 'object' && !Array.isArray(body), 'invalid_action', 400);
  const id = allowedPreparationProject(body.projectId);
  ensure(id !== null, 'project_outside_preparation_scope', 403);
  ensure(UUID.test(body.requestId ?? ''), 'invalid_request_identity', 400);
  ensure(body.action === 'source_integrity', 'invalid_action', 400);
  return id;
}
export function boundSourceRecord(id, projectId, profile, roadmap, unit) {
  ensure(profile?.company_id === 'company:future:' + id && profile?.project_id === projectId,
    'project_identity_mismatch', 403);
  ensure(roadmap?.state === 'current' && roadmap?.structure_verified === true
    && Number.isSafeInteger(Number(roadmap.version)), 'roadmap_not_verified');
  ensure(unit?.work_unit_id === projectId + ':recovery:source-integrity'
    && Number(unit?.roadmap_version) === Number(roadmap.version)
    && unit.status === 'ready' && unit.applicable === true
    && unit.category_id === 'authority' && unit.phase_id === 'source'
    && unit.title === 'Verify canonical source digest and project identity',
    'source_integrity_not_ready');
  ensure(Array.isArray(unit.dependency_ids) && unit.dependency_ids.length === 0
    && Array.isArray(unit.gate_ids) && unit.gate_ids.length === 0,
    'source_integrity_not_ready');
  const path = String(profile.source_ref ?? '').split('#')[0];
  const match = SOURCE_PATH.exec(path);
  ensure(match?.[1] === id && path.startsWith(SOURCE_ROOT), 'source_path_not_authorized', 403);
  const hashes = (Array.isArray(unit.evidence_refs) ? unit.evidence_refs : [])
    .filter(x => typeof x === 'string' && x.startsWith(path + '#sha256='))
    .map(x => x.slice(path.length + '#sha256='.length));
  ensure(hashes.length === 1 && HEX64.test(hashes[0]), 'source_digest_not_authoritative');
  return Object.freeze({projectId,companyId:profile.company_id,workUnitId:unit.work_unit_id,
    roadmapVersion:Number(roadmap.version),sourcePath:path,sourceSha256:hashes[0]});
}
async function boundedBytes(response) {
  ensure(response?.ok === true && response.body?.getReader, 'source_not_available', 503);
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > SOURCE_LIMIT_BYTES) { await reader.cancel(); throw new PreparationError('source_too_large', 413); }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
function sourceTitleAndIdentity(id, text) {
  const title = text.split(/\r?\n/, 1)[0];
  return title.startsWith('# Company ' + id + ' — ')
    && text.includes('company:future:' + id)
    && text.includes('project:company:future:' + id);
}
export async function proveSourceIntegrity(record, sourceCommit, fetchSource) {
  ensure(HEX40.test(sourceCommit ?? ''), 'unverified_source_authority');
  const url = 'https://raw.githubusercontent.com/jamesmorgan1234/James-morgan-project-command-center/'
    + sourceCommit + '/' + record.sourcePath;
  // The host, repository, SHA and source path are fixed or independently validated,
  // not supplied as an arbitrary network endpoint by a task or provider.
  const response = await fetchSource(url, {method:'GET', redirect:'error', cache:'no-store',
    signal:AbortSignal.timeout(20000)});
  const bytes = await boundedBytes(response);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const actualSha = [...digest].map(x => x.toString(16).padStart(2,'0')).join('');
  ensure(actualSha === record.sourceSha256, 'source_digest_mismatch');
  let text;
  try { text = new TextDecoder('utf-8', {fatal:true}).decode(bytes); }
  catch { throw new PreparationError('source_encoding_invalid'); }
  ensure(sourceTitleAndIdentity(record.companyId.slice(-3), text), 'source_identity_mismatch');
  return Object.freeze({sourceCommit,sourceSha256:actualSha,sourcePath:record.sourcePath});
}
export async function executeSourcePreparation({body,ownerId,readRows,readiness,fetchSource,
  persistProof,sourceCommit}) {
  // Scope check precedes every database/source read. Other company chats never enter this path.
  const id = validatePreparationRequest(body);
  ensure(typeof ownerId === 'string' && UUID.test(ownerId), 'unauthorized', 401);
  const projects = await readRows('command_center_project_profiles', {project_id:'eq.' + body.projectId,
    select:'project_id,company_id,source_ref', limit:'1'});
  ensure(projects.length === 1, 'project_not_available', 404);
  ensure(projects[0].company_id === 'company:future:' + id, 'project_identity_mismatch', 403);
  const roadmaps = await readRows('command_center_project_roadmaps',
    {project_id:'eq.' + body.projectId,state:'eq.current',select:'version,state,structure_verified',limit:'1'});
  ensure(roadmaps.length === 1, 'roadmap_not_verified');
  const unitId = body.projectId + ':recovery:source-integrity';
  const units = await readRows('command_center_project_work_units',
    {project_id:'eq.' + body.projectId,roadmap_version:'eq.' + roadmaps[0].version,
      work_unit_id:'eq.' + unitId,select:'work_unit_id,roadmap_version,status,applicable,category_id,phase_id,title,dependency_ids,gate_ids,evidence_refs',limit:'1'});
  ensure(units.length === 1, 'source_integrity_not_ready');
  const record = boundSourceRecord(id, body.projectId, projects[0],roadmaps[0],units[0]);
  const ready = await readiness({p_project_id:body.projectId,p_roadmap_version:record.roadmapVersion,
    p_work_unit_id:record.workUnitId});
  ensure(ready?.ready === true, 'source_integrity_not_ready');
  const proof = await proveSourceIntegrity(record,sourceCommit,fetchSource);
  const receipt = await persistProof({p_owner_id:ownerId,p_project_id:record.projectId,
    p_work_unit_id:record.workUnitId,p_source_path:record.sourcePath,
    p_source_sha256:proof.sourceSha256,p_source_commit:proof.sourceCommit,
    p_request_id:body.requestId});
  ensure(receipt && receipt.status === 'verified_source_only' && receipt.work_unit_id === record.workUnitId
    && receipt.source_sha256 === proof.sourceSha256, 'source_persistence_not_verified', 503);
  return Object.freeze({state:'verified_source_only',projectId:record.projectId,
    workUnitId:record.workUnitId,sourceSha256:proof.sourceSha256,receiptId:receipt.receipt_id,
    productBuilt:false,brainEnabled:false,productionEnabled:false});
}
