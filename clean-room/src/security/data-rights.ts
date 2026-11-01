import type { DataField, SensitivityClass } from "./data-sensitivity.js";

/**
 * Owner data rights and sharing boundaries.
 *
 * Owner correction, archive, export and deletion; deletion preview, dependency
 * blocking, confirmation, soft delete by default, elevated purge with an audit
 * event; anonymization and redaction with a trail; classification inheritance
 * and downgrade refusal; integration/agent scope enforcement; voice privacy;
 * diagnostics and public-endpoint exclusion; default-deny sharing and expiring,
 * isolated public links.
 */

const RANK: Readonly<Record<SensitivityClass, number>> = Object.freeze({ public: 0, private: 1, sensitive: 2, secret: 3 });

function highest(a: SensitivityClass, b: SensitivityClass): SensitivityClass {
  return RANK[a] >= RANK[b] ? a : b;
}

export type OwnerAction = "correct" | "archive" | "export" | "delete";

export function assertOwnerAction(actor: string, action: OwnerAction): void {
  if (actor !== "owner") throw new Error(`Only the owner can ${action} canonical data`);
}

export function auditHistoryChannel(kind: "audit" | "note"): "protected" | "editable" {
  return kind === "audit" ? "protected" : "editable";
}

export interface DeletionPlan {
  readonly entity: string;
  readonly dependencies: readonly string[];
  readonly critical: boolean;
}

export interface DeletionPreview {
  readonly entity: string;
  readonly impact: readonly string[];
  readonly blocked: boolean;
  readonly requiresConfirmation: boolean;
}

export function deletionPreview(plan: DeletionPlan): DeletionPreview {
  if (!plan.entity.trim()) throw new Error("Deletion preview requires an entity");
  return Object.freeze({
    entity: plan.entity,
    impact: Object.freeze([...plan.dependencies]),
    blocked: plan.dependencies.length > 0,
    requiresConfirmation: true
  });
}

export function assertDeletionConfirmed(preview: DeletionPreview, confirmed: boolean): void {
  if (preview.blocked) throw new Error(`Deletion is blocked by dependencies: ${preview.impact.join(", ")}`);
  if (!confirmed) throw new Error("Destructive deletion requires explicit confirmation");
}

export function deletionMode(critical: boolean): "soft" | "purge" {
  return critical ? "soft" : "purge";
}

export function assertPurgeElevated(actor: string, elevated: boolean): void {
  if (actor !== "owner") throw new Error("Purge requires the owner");
  if (!elevated) throw new Error("Purge requires an elevated explicit action");
}

export interface PurgeAuditEvent {
  readonly action: "purge";
  readonly entity: string;
  readonly actor: string;
  readonly at: string;
}

export function purgeAuditEvent(entity: string, actor: string, at: string): PurgeAuditEvent {
  if (!entity.trim() || !actor.trim()) throw new Error("Purge audit event requires entity and actor");
  if (Number.isNaN(Date.parse(at))) throw new Error("Purge audit event requires a valid timestamp");
  return Object.freeze({ action: "purge" as const, entity, actor, at });
}

export function anonymizeFields(fields: readonly DataField[]): readonly { readonly key: string; readonly value: string }[] {
  return Object.freeze(fields.map((field) => ({
    key: field.key,
    value: field.classification === "sensitive" || field.classification === "secret" ? "[anonymized]" : "[kept]"
  })));
}

export function redactFields(fields: readonly DataField[], redactKeys: readonly string[]): readonly { readonly key: string; readonly redacted: boolean }[] {
  if (redactKeys.length === 0) throw new Error("Redaction requires at least one target");
  return Object.freeze(fields.map((field) => ({ key: field.key, redacted: redactKeys.includes(field.key) })));
}

export function redactionTrail(entries: readonly { readonly key: string; readonly at: string }[]): readonly { readonly key: string; readonly at: string }[] {
  if (entries.length === 0) throw new Error("A redaction audit trail requires entries");
  for (const entry of entries) {
    if (!entry.key.trim()) throw new Error("Redaction trail entries require a key");
    if (Number.isNaN(Date.parse(entry.at))) throw new Error("Redaction trail entries require a valid timestamp");
  }
  return Object.freeze(entries.map((entry) => Object.freeze({ ...entry })));
}

export function inheritClassification(parent: SensitivityClass, derived: SensitivityClass): SensitivityClass {
  return highest(parent, derived);
}

export function assertNoDowngrade(original: SensitivityClass, proposed: SensitivityClass): void {
  if (RANK[proposed] < RANK[original]) throw new Error("Sensitivity cannot be downgraded by a derived process");
}

export function assertScopedExport(allowedClasses: readonly SensitivityClass[], field: DataField): void {
  if (!allowedClasses.includes(field.classification)) throw new Error("Integration lacks scope permission for sensitive data");
}

export function assertProjectScope(projectScope: string, targetProject: string): void {
  if (!projectScope.trim() || projectScope !== targetProject) throw new Error("Agent cannot use project data outside its scope");
}

export function voiceTranscriptSensitivity(content: SensitivityClass): SensitivityClass {
  return content;
}

export function assertVoiceRecordingsNotRetained(retained: boolean): void {
  if (retained) throw new Error("Command Center must not retain voice recordings unnecessarily");
}

export function assertProviderRetentionSurfaced(surfaced: boolean): void {
  if (!surfaced) throw new Error("Provider retention policy must be surfaced before use");
}

export function providerPrivacyReview(previousPolicy: string, currentPolicy: string): "review_recommended" | "none" {
  if (!previousPolicy.trim() || !currentPolicy.trim()) throw new Error("Provider privacy policies must be nonblank");
  return previousPolicy === currentPolicy ? "none" : "review_recommended";
}

export function assertNoOwnerPiiInDiagnostics(fields: readonly DataField[]): void {
  const pii = fields.filter((field) => field.classification === "sensitive" || field.classification === "secret");
  if (pii.length > 0) throw new Error(`Owner-specific information must not appear in diagnostics: ${pii.map((field) => field.key).join(", ")}`);
}

export function assertNoPublicProjectEndpoint(endpoints: readonly string[]): void {
  if (endpoints.length > 0) throw new Error(`Public endpoints must not return owner project data: ${endpoints.join(", ")}`);
}

export function sharingDefault(allow: boolean): "deny" | "allow" {
  if (allow) throw new Error("Sharing is default-deny");
  return "deny";
}

export function assertExplicitCollaborationRoles(roles: readonly string[]): void {
  if (roles.length === 0 || roles.some((role) => !role.trim())) throw new Error("Collaboration requires explicit per-role sharing");
}

export function assertPublicLinkIsolated(context: { readonly publicContext: boolean }): void {
  if (!context.publicContext) throw new Error("Public links must be isolated from private application context");
}

export function assertShareLinkUnexpired(expiresAt: string, now: string): void {
  const expiry = Date.parse(expiresAt);
  const current = Date.parse(now);
  if (Number.isNaN(expiry) || Number.isNaN(current)) throw new Error("Share-link timestamps must be valid");
  if (current >= expiry) throw new Error("Share link has expired");
}
