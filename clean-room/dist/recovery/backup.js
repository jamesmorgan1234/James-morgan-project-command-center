export function validateBackup(policy, manifest) {
    if (!policy.encrypted || policy.scopeKeys.length === 0 || !policy.cadenceRef.trim() || !policy.retentionRef.trim())
        throw new Error("backup policy is incomplete or unencrypted");
    if (!manifest.backupId.trim() || !manifest.createdAt.includes("T") || !manifest.policyHash.trim() || !manifest.contentHash.trim() || manifest.itemCount < 0 || manifest.sourceRefs.length === 0)
        throw new Error("backup manifest lacks independent identity/integrity evidence");
    return Object.freeze({ ...manifest, sourceRefs: Object.freeze([...manifest.sourceRefs]) });
}
import { REQUIRED_INTELLIGENCE_BACKUP_CLASSES } from './acceptance.js';
import { assertRecoveryAccess, assertRecoveryEvidence, assertRecoveryPayload, recoveryDigest, recoveryImmutable, recoveryJson, recoveryList, recoveryRef, recoveryScopeKey, recoveryTime, recoveryVersion, requireRecovery } from './contracts.js';
export const RECOVERY_ARTIFACT_CLASSES = [...REQUIRED_INTELLIGENCE_BACKUP_CLASSES, 'configuration', 'capabilities', 'shadow_state'];
export function validateRecoveryRecord(r) { recoveryRef(r.id); recoveryScopeKey(r.scope); recoveryVersion(r.version); recoveryVersion(r.compatibleVersion); requireRecovery(RECOVERY_ARTIFACT_CLASSES.includes(r.kind), 'recovery_artifact_class'); requireRecovery(['current', 'historical', 'expired', 'revoked', 'superseded', 'invalidated', 'unknown', 'deleted'].includes(r.truth), 'recovery_truth_invalid'); for (const n of [r.policyEpoch, r.revocationEpoch])
    requireRecovery(Number.isSafeInteger(n) && n >= 0, 'recovery_epoch_invalid'); recoveryList(r.dependencyIds); recoveryList(r.evidenceIds, true); assertRecoveryPayload(r.payload); requireRecovery(Object.keys(r).every(k => ['id', 'scope', 'version', 'kind', 'truth', 'policyEpoch', 'revocationEpoch', 'compatibleVersion', 'dependencyIds', 'evidenceIds', 'payload'].includes(k)), 'recovery_record_field'); }
export function validateRecoveryPolicy(p) { recoveryRef(p.id); recoveryVersion(p.version); recoveryScopeKey(p.scope); requireRecovery(p.scope.environment !== 'production', 'production_backup_not_authorized'); recoveryRef(p.keyRef); for (const n of [p.cadenceMs, p.retentionMs, p.maximumAgeMs, p.maximumRecords])
    recoveryVersion(n); requireRecovery(p.cadenceMs <= p.maximumAgeMs && p.maximumAgeMs <= p.retentionMs, 'backup_cadence_retention_invalid'); recoveryList(p.protectedRefs); recoveryList(p.excludedRefs); requireRecovery(!p.protectedRefs.some(r => p.excludedRefs.includes(r)), 'protected_backup_excluded'); recoveryList(p.requiredClasses, true); requireRecovery(RECOVERY_ARTIFACT_CLASSES.every(c => p.requiredClasses.includes(c)) && p.requiredClasses.every(c => RECOVERY_ARTIFACT_CLASSES.includes(c)), 'intelligence_backup_classes_missing'); recoveryList(p.evidenceIds, true); }
function keyValid(key, usage) { requireRecovery(key.type === 'secret' && !key.extractable && key.algorithm.name === 'AES-GCM' && key.algorithm.length === 256 && key.usages.includes(usage), 'backup_key_invalid'); }
export function backupDue(p, lastCreatedAt, now) { validateRecoveryPolicy(p); const time = recoveryTime(now); if (lastCreatedAt === undefined)
    return true; const last = recoveryTime(lastCreatedAt); requireRecovery(last <= time, 'backup_future_timestamp'); return time - last >= p.cadenceMs; }
export async function createEncryptedBackup(a, policyInput, records, id, key, compatibilityVersion) {
    const p = recoveryImmutable(policyInput);
    validateRecoveryPolicy(p);
    assertRecoveryAccess(a, 'backup', p.scope, id);
    assertRecoveryEvidence(a, p.scope, p.evidenceIds);
    keyValid(key, 'encrypt');
    recoveryVersion(compatibilityVersion);
    requireRecovery(records.length > 0 && records.length <= p.maximumRecords, 'backup_record_budget');
    const copy = recoveryImmutable([...records].sort((x, y) => x.id.localeCompare(y.id))), ids = new Set();
    for (const r of copy) {
        validateRecoveryRecord(r);
        requireRecovery(recoveryScopeKey(r.scope) === recoveryScopeKey(p.scope), 'backup_scope_mismatch');
        requireRecovery(!ids.has(r.id) && !p.excludedRefs.includes(r.id), 'backup_duplicate_or_excluded');
        ids.add(r.id);
        assertRecoveryEvidence(a, p.scope, r.evidenceIds);
        requireRecovery(r.compatibleVersion === compatibilityVersion, 'backup_compatibility_mismatch');
    }
    requireRecovery(p.protectedRefs.every(r => ids.has(r)), 'backup_protected_asset_missing');
    for (const r of copy)
        requireRecovery(r.dependencyIds.every(d => ids.has(d)), 'backup_dependency_missing');
    requireRecovery(p.requiredClasses.every(c => copy.some(r => r.kind === c)), 'backup_incomplete_classes');
    const createdAt = a.now(), header = { id, formatVersion: 1, scope: p.scope, createdAt, expiresAt: new Date(recoveryTime(createdAt) + p.retentionMs).toISOString(), policyId: p.id, policyVersion: p.version, policyDigest: await recoveryDigest(p), keyRef: p.keyRef, compatibilityVersion, itemCount: copy.length, classes: p.requiredClasses, contentDigest: await recoveryDigest(copy), evidenceIds: p.evidenceIds };
    const iv = crypto.getRandomValues(new Uint8Array(12)), ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(recoveryJson(header)) }, key, new TextEncoder().encode(recoveryJson(copy))));
    assertRecoveryAccess(a, 'backup', p.scope, id);
    assertRecoveryEvidence(a, p.scope, p.evidenceIds);
    const envelope = { header, iv: Array.from(iv), ciphertext: Array.from(ciphertext) };
    return recoveryImmutable({ ...envelope, envelopeDigest: await recoveryDigest(envelope) });
}
export async function verifyEncryptedBackup(a, policyInput, backupInput, key) {
    const p = recoveryImmutable(policyInput), b = recoveryImmutable(backupInput);
    validateRecoveryPolicy(p);
    assertRecoveryAccess(a, 'restore', p.scope, b.header.id);
    keyValid(key, 'decrypt');
    requireRecovery(b.header.formatVersion === 1 && b.header.policyId === p.id && b.header.policyVersion === p.version && b.header.keyRef === p.keyRef && b.header.policyDigest === await recoveryDigest(p) && recoveryScopeKey(b.header.scope) === recoveryScopeKey(p.scope), 'backup_policy_scope_superseded');
    const now = recoveryTime(a.now()), created = recoveryTime(b.header.createdAt);
    requireRecovery(created <= now && now - created <= p.maximumAgeMs && recoveryTime(b.header.expiresAt) > now && recoveryTime(b.header.expiresAt) === created + p.retentionMs, 'backup_stale_or_expired');
    requireRecovery(b.iv.length === 12 && b.ciphertext.length >= 16 && [...b.iv, ...b.ciphertext].every(n => Number.isInteger(n) && n >= 0 && n <= 255), 'backup_encoding_invalid');
    const envelope = { header: b.header, iv: b.iv, ciphertext: b.ciphertext };
    requireRecovery(b.envelopeDigest === await recoveryDigest(envelope), 'backup_envelope_corrupt');
    const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(b.iv), additionalData: new TextEncoder().encode(recoveryJson(b.header)) }, key, new Uint8Array(b.ciphertext));
    const records = JSON.parse(new TextDecoder().decode(clear));
    requireRecovery(Array.isArray(records) && records.length === b.header.itemCount && records.length <= p.maximumRecords && records.length > 0 && await recoveryDigest(records) === b.header.contentDigest, 'backup_content_incomplete');
    const ids = new Set();
    for (const r of records) {
        validateRecoveryRecord(r);
        requireRecovery(!ids.has(r.id) && !p.excludedRefs.includes(r.id) && recoveryScopeKey(r.scope) === recoveryScopeKey(p.scope) && r.compatibleVersion === b.header.compatibilityVersion, 'backup_record_mismatch');
        ids.add(r.id);
    }
    requireRecovery(p.protectedRefs.every(id => ids.has(id)) && p.requiredClasses.every(c => records.some(r => r.kind === c)) && recoveryJson(b.header.classes) === recoveryJson(p.requiredClasses), 'backup_manifest_incomplete');
    for (const r of records)
        requireRecovery(r.dependencyIds.every(d => ids.has(d)), 'backup_dependency_missing');
    assertRecoveryEvidence(a, p.scope, p.evidenceIds);
    return recoveryImmutable(records);
}
//# sourceMappingURL=backup.js.map