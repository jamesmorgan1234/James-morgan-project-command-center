export interface BookQaRequirement {
  readonly key: string;
  readonly required: boolean;
}

export interface BookQaEvidence {
  readonly requirementKey: string;
  readonly passed: boolean;
  readonly evidenceRefs: readonly string[];
}

export interface BookSubtypeProfile {
  readonly key: string;
  readonly requirements: readonly BookQaRequirement[];
}

export function evaluateBookQa(profile: BookSubtypeProfile, evidence: readonly BookQaEvidence[]): Readonly<{ pass: boolean; missing: readonly string[]; failed: readonly string[] }> {
  const byKey = new Map(evidence.map((item) => [item.requirementKey, item]));
  const missing: string[] = [];
  const failed: string[] = [];
  for (const requirement of profile.requirements) {
    if (!requirement.required) continue;
    const item = byKey.get(requirement.key);
    if (!item || item.evidenceRefs.length === 0) missing.push(requirement.key);
    else if (!item.passed) failed.push(requirement.key);
  }
  return Object.freeze({ pass: missing.length === 0 && failed.length === 0, missing: Object.freeze(missing), failed: Object.freeze(failed) });
}

export type BookProductionSubtype = "fiction" | "nonfiction" | "cookbook" | "workbook" | "coloring" | "activity";
export type BookQualityGateKind = "editing" | "continuity" | "originality" | "image" | "interior" | "format";

export interface BookSubtypeQualityGate {
  readonly key: string;
  readonly kind: BookQualityGateKind;
  readonly required: boolean;
  readonly description: string;
}

export interface EvidenceBackedBookSubtypeProfile {
  readonly key: string;
  readonly ownerId: string;
  readonly subtype: BookProductionSubtype;
  readonly version: number;
  readonly gates: readonly BookSubtypeQualityGate[];
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
}

export interface EvidenceBackedBookQaEvidence {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly profileKey: string;
  readonly profileVersion: number;
  readonly requirementKey: string;
  readonly passed: boolean;
  readonly evidenceRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly evaluatorRef: string;
  readonly observedAt: string;
}

export interface BookQaAssessment {
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly profileKey: string;
  readonly profileVersion: number;
  readonly pass: boolean;
  readonly mayAdvance: boolean;
  readonly missing: readonly string[];
  readonly failed: readonly string[];
  readonly evidenceIds: readonly string[];
}

function qaTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function qaRefs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

export function validateSubtypeProfile(profile: EvidenceBackedBookSubtypeProfile): EvidenceBackedBookSubtypeProfile {
  if (!profile.key.trim() || !profile.ownerId.trim()) throw new Error("book QA profile identity/owner are required");
  if (!Number.isSafeInteger(profile.version) || profile.version < 1) throw new Error("book QA profile version must be positive");
  qaTimestamp(profile.observedAt, "book QA profile observedAt");
  const sourceRefs = qaRefs(profile.sourceRefs, "book QA profile source refs");
  if (profile.gates.length === 0) throw new Error("book QA profile must define at least one gate");
  const seen = new Set<string>();
  const gates = profile.gates.map((gate) => {
    if (!gate.key.trim() || !gate.description.trim()) throw new Error("book QA gate key/description are required");
    if (seen.has(gate.key)) throw new Error("book QA gate keys must be unique");
    seen.add(gate.key);
    return Object.freeze({ ...gate });
  });
  const requiredKinds = new Set(gates.filter((gate) => gate.required).map((gate) => gate.kind));
  for (const kind of ["editing", "originality", "interior", "format"] as const) if (!requiredKinds.has(kind)) throw new Error(`book QA profile must require ${kind}`);
  if ((profile.subtype === "fiction" || profile.subtype === "nonfiction") && !requiredKinds.has("continuity")) throw new Error("fiction/nonfiction QA profile must require continuity");
  if ((profile.subtype === "cookbook" || profile.subtype === "coloring" || profile.subtype === "activity") && !requiredKinds.has("image")) throw new Error("visual book subtype QA profile must require image quality");
  return Object.freeze({ ...profile, gates: Object.freeze(gates), sourceRefs });
}

export function validateBookQaEvidence(evidence: EvidenceBackedBookQaEvidence, profile: EvidenceBackedBookSubtypeProfile): EvidenceBackedBookQaEvidence {
  if (!evidence.id.trim() || !evidence.ownerId.trim() || !evidence.projectId.trim() || !evidence.bookId.trim() || !evidence.profileKey.trim() || !evidence.requirementKey.trim() || !evidence.evaluatorRef.trim()) throw new Error("book QA evidence identity/project/book/profile/requirement/evaluator are required");
  qaTimestamp(evidence.observedAt, "book QA evidence observedAt");
  const validProfile = validateSubtypeProfile(profile);
  if (evidence.ownerId !== validProfile.ownerId || evidence.profileKey !== validProfile.key || evidence.profileVersion !== validProfile.version) throw new Error("book QA evidence must bind the exact owner-scoped profile version");
  if (!validProfile.gates.some((gate) => gate.key === evidence.requirementKey)) throw new Error("book QA evidence references unknown profile requirement");
  const evidenceRefs = qaRefs(evidence.evidenceRefs, "book QA evidence refs");
  const artifactRefs = qaRefs(evidence.artifactRefs, "book QA artifact refs");
  return Object.freeze({ ...evidence, evidenceRefs, artifactRefs });
}

export function assessBookProductionQa(profile: EvidenceBackedBookSubtypeProfile, evidence: readonly EvidenceBackedBookQaEvidence[], ownerId: string, projectId: string, bookId: string): BookQaAssessment {
  const validProfile = validateSubtypeProfile(profile);
  if (validProfile.ownerId !== ownerId) throw new Error("book QA assessment cannot cross owner scope");
  const scoped = evidence
    .filter((item) => item.ownerId === ownerId && item.projectId === projectId && item.bookId === bookId && item.profileKey === validProfile.key && item.profileVersion === validProfile.version)
    .map((item) => validateBookQaEvidence(item, validProfile));
  const latest = new Map<string, EvidenceBackedBookQaEvidence>();
  for (const item of scoped) {
    const prior = latest.get(item.requirementKey);
    if (!prior || qaTimestamp(item.observedAt, "book QA evidence observedAt") > qaTimestamp(prior.observedAt, "book QA evidence observedAt")) latest.set(item.requirementKey, item);
  }
  const missing: string[] = [];
  const failed: string[] = [];
  for (const gate of validProfile.gates) {
    if (!gate.required) continue;
    const item = latest.get(gate.key);
    if (!item) missing.push(gate.key);
    else if (!item.passed) failed.push(gate.key);
  }
  const pass = missing.length === 0 && failed.length === 0;
  return Object.freeze({ ownerId, projectId, bookId, profileKey: validProfile.key, profileVersion: validProfile.version, pass, mayAdvance: pass, missing: Object.freeze(missing), failed: Object.freeze(failed), evidenceIds: Object.freeze([...latest.values()].map((item) => item.id)) });
}

export function assertBookProductionMayAdvance(assessment: BookQaAssessment): void {
  if (!assessment.pass || !assessment.mayAdvance || assessment.missing.length > 0 || assessment.failed.length > 0) throw new Error("book production cannot advance while required quality gates are missing or failed");
}

export function defaultBookSubtypeProfile(ownerId: string, subtype: BookProductionSubtype, version: number, sourceRefs: readonly string[], observedAt: string): EvidenceBackedBookSubtypeProfile {
  const gates: BookSubtypeQualityGate[] = [
    { key: "editing", kind: "editing", required: true, description: "Substantive and line-level editing evidence is complete." },
    { key: "originality", kind: "originality", required: true, description: "Originality and non-duplication checks pass." },
    { key: "interior", kind: "interior", required: true, description: "Interior layout and recurring design system pass subtype requirements." },
    { key: "format", kind: "format", required: true, description: "Target format and package checks pass." }
  ];
  if (subtype === "fiction" || subtype === "nonfiction") gates.push({ key: "continuity", kind: "continuity", required: true, description: "Continuity, factual consistency, chronology, and internal references pass." });
  if (subtype === "cookbook" || subtype === "coloring" || subtype === "activity") gates.push({ key: "image", kind: "image", required: true, description: "Image/art quality, placement, and subtype-specific visual checks pass." });
  if (subtype === "workbook") gates.push({ key: "continuity", kind: "continuity", required: true, description: "Exercise sequence, instructions, and workbook progression remain coherent." });
  return validateSubtypeProfile({ key: `default:${subtype}`, ownerId, subtype, version, gates, sourceRefs, observedAt });
}
