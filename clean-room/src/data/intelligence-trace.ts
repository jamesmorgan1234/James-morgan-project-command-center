import { parseTimestamp } from "../security/types.js";

export type IntelligenceTraceNodeKind =
  | "intent" | "context" | "policy" | "router" | "specialist" | "method" | "tool"
  | "evidence" | "verifier" | "state" | "decision" | "outcome" | "learning"
  | "evaluator" | "ontology" | "module" | "configuration" | "procedure" | "permission" | "budget";

export type IntelligenceTraceRelation =
  | "context_for" | "governs" | "routes_to" | "selects" | "invokes" | "produces_evidence"
  | "verified_by" | "transitions_to" | "records_decision" | "records_outcome" | "produces_learning"
  | "depends_on" | "evaluated_by" | "uses_ontology" | "uses_version";

export type TracePrivacyClass = "ecosystem_shared" | "domain_shared" | "company_private" | "project_private" | "owner_private";

export interface IntelligenceTraceNode {
  readonly id: string;
  readonly kind: IntelligenceTraceNodeKind;
  readonly version: number;
  readonly ownerId: string;
  readonly privacy: TracePrivacyClass;
  readonly scopeRef?: string;
  /** Privacy-safe canonical/reference pointer only. Never raw secrets or payload content. */
  readonly reference: string;
  readonly recordedAt: string;
  readonly evidenceRefs: readonly string[];
}

export interface IntelligenceTraceEdge {
  readonly id: string;
  readonly relation: IntelligenceTraceRelation;
  readonly fromId: string;
  readonly fromVersion: number;
  readonly toId: string;
  readonly toVersion: number;
  readonly version: number;
  readonly recordedAt: string;
  readonly evidenceRefs: readonly string[];
}

export interface TraceExplanation {
  readonly targetRef: string;
  readonly nodeRefs: readonly string[];
  readonly nodes: readonly IntelligenceTraceNode[];
  readonly edgeIds: readonly string[];
}

export interface TraceImpactResult {
  readonly changedRef: string;
  readonly newVersion: number;
  readonly staleDependentRefs: readonly string[];
  readonly evidenceEdgeIds: readonly string[];
}

export interface TraceCompatibilityResult {
  readonly compatible: boolean;
  readonly subjectRef: string;
  readonly incompatibleEdgeIds: readonly string[];
}

const DEPENDENCY_RELATIONS = new Set<IntelligenceTraceRelation>(["depends_on", "evaluated_by", "uses_ontology", "uses_version"]);
const SENSITIVE_REFERENCE_PATTERNS = [/\btoken\s*=/i, /\bpassword\s*=/i, /\bauthorization\s*:/i, /\bbearer\s+[a-z0-9._-]+/i, /\bapi[_-]?key\s*=/i, /\bsecret\s*=/i];

function uniqueNonBlank(values: readonly string[], label: string, requireOne = false): readonly string[] {
  if (requireOne && values.length === 0) throw new Error(`${label} requires evidence`);
  const normalized = values.map((value) => value.trim());
  if (normalized.some((value) => !value) || new Set(normalized).size !== normalized.length) throw new Error(`${label} must be unique and nonblank`);
  return Object.freeze(normalized);
}

function nodeKey(id: string, version: number): string { return `${id}@${version}`; }
function validVersion(value: number, label: string): void { if (!Number.isInteger(value) || value < 1) throw new Error(`${label} must be a positive integer`); }

function assertPrivacySafeReference(reference: string): void {
  if (!reference.trim()) throw new Error("Trace reference is required");
  if (SENSITIVE_REFERENCE_PATTERNS.some((pattern) => pattern.test(reference))) throw new Error("Trace reference contains sensitive payload material");
}

export function validateIntelligenceTraceNode(node: IntelligenceTraceNode): IntelligenceTraceNode {
  if (!node.id.trim() || !node.ownerId.trim()) throw new Error("Trace node identity/owner are required");
  validVersion(node.version, "Trace node version");
  parseTimestamp(node.recordedAt, "Trace node recordedAt");
  assertPrivacySafeReference(node.reference);
  const scoped = node.privacy === "domain_shared" || node.privacy === "company_private" || node.privacy === "project_private";
  if (scoped && !node.scopeRef?.trim()) throw new Error(`${node.privacy} trace node requires scopeRef`);
  if (!scoped && node.scopeRef !== undefined) throw new Error(`${node.privacy} trace node cannot carry scopeRef`);
  return Object.freeze({ ...node, evidenceRefs: uniqueNonBlank(node.evidenceRefs, "Trace node evidence", true) });
}

export function validateIntelligenceTraceEdge(edge: IntelligenceTraceEdge): IntelligenceTraceEdge {
  if (!edge.id.trim() || !edge.fromId.trim() || !edge.toId.trim() || edge.fromId === edge.toId) throw new Error("Trace edge identity/endpoints are invalid");
  validVersion(edge.fromVersion, "Trace edge fromVersion"); validVersion(edge.toVersion, "Trace edge toVersion"); validVersion(edge.version, "Trace edge version");
  parseTimestamp(edge.recordedAt, "Trace edge recordedAt");
  return Object.freeze({ ...edge, evidenceRefs: uniqueNonBlank(edge.evidenceRefs, "Trace edge evidence", true) });
}

/**
 * PIF.9 trace fabric is an immutable, privacy-safe projection over canonical references.
 * It does not own the source entities and never stores raw secret-bearing payloads.
 */
export class IntelligenceTraceFabric {
  readonly #nodes = new Map<string, IntelligenceTraceNode>();
  readonly #latestVersion = new Map<string, number>();
  readonly #edges = new Map<string, IntelligenceTraceEdge>();

  registerNode(input: IntelligenceTraceNode): IntelligenceTraceNode {
    const node = validateIntelligenceTraceNode(input);
    const key = nodeKey(node.id, node.version);
    if (this.#nodes.has(key)) throw new Error(`Trace node version already exists: ${key}`);
    const latest = this.#latestVersion.get(node.id);
    if (latest !== undefined && node.version <= latest) throw new Error(`Trace node version must advance: ${node.id}`);
    this.#nodes.set(key, node); this.#latestVersion.set(node.id, node.version); return node;
  }

  connect(input: IntelligenceTraceEdge): IntelligenceTraceEdge {
    const edge = validateIntelligenceTraceEdge(input);
    if (this.#edges.has(edge.id)) throw new Error(`Trace edge already exists: ${edge.id}`);
    const from = this.#nodes.get(nodeKey(edge.fromId, edge.fromVersion));
    const to = this.#nodes.get(nodeKey(edge.toId, edge.toVersion));
    if (!from || !to) throw new Error(`Trace edge requires exact registered endpoint versions: ${edge.id}`);
    if (from.ownerId !== to.ownerId) throw new Error("Trace edge cannot cross owner boundary");
    if (from.privacy === "project_private" && to.privacy === "project_private" && from.scopeRef !== to.scopeRef) throw new Error("Trace edge cannot cross project-private boundary");
    if (from.privacy === "company_private" && to.privacy === "company_private" && from.scopeRef !== to.scopeRef) throw new Error("Trace edge cannot cross company-private boundary");
    this.#edges.set(edge.id, edge); return edge;
  }

  getNode(id: string, version?: number): IntelligenceTraceNode | undefined {
    const selected = version ?? this.#latestVersion.get(id);
    return selected === undefined ? undefined : this.#nodes.get(nodeKey(id, selected));
  }

  explain(targetId: string, targetVersion?: number): TraceExplanation {
    const target = this.getNode(targetId, targetVersion);
    if (!target) throw new Error(`Unknown trace target: ${targetId}`);
    const visited = new Set<string>();
    const edgeIds = new Set<string>();
    const queue: IntelligenceTraceNode[] = [target];
    while (queue.length > 0) {
      const current = queue.shift(); if (!current) break;
      const key = nodeKey(current.id, current.version); if (visited.has(key)) continue; visited.add(key);
      for (const edge of this.#edges.values()) {
        if (!DEPENDENCY_RELATIONS.has(edge.relation) && edge.toId === current.id && edge.toVersion === current.version) {
          edgeIds.add(edge.id); const upstream = this.getNode(edge.fromId, edge.fromVersion); if (upstream) queue.push(upstream);
        }
        if (DEPENDENCY_RELATIONS.has(edge.relation) && edge.fromId === current.id && edge.fromVersion === current.version) {
          edgeIds.add(edge.id); const dependency = this.getNode(edge.toId, edge.toVersion); if (dependency) queue.push(dependency);
        }
      }
    }
    const nodes = [...visited].map((key) => this.#nodes.get(key)).filter((node): node is IntelligenceTraceNode => node !== undefined)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id) || a.version - b.version);
    return Object.freeze({ targetRef: nodeKey(target.id, target.version), nodeRefs: Object.freeze(nodes.map((node) => nodeKey(node.id, node.version))), nodes: Object.freeze(nodes), edgeIds: Object.freeze([...edgeIds].sort()) });
  }

  affectedDependents(changedId: string, newVersion: number): TraceImpactResult {
    validVersion(newVersion, "Changed version");
    const stale = new Set<string>();
    const edgeIds = new Set<string>();
    const queue: { id: string; version?: number }[] = [{ id: changedId }];
    const seenSubjects = new Set<string>();
    while (queue.length > 0) {
      const subject = queue.shift(); if (!subject) break;
      const subjectKey = `${subject.id}@${subject.version ?? "*"}`; if (seenSubjects.has(subjectKey)) continue; seenSubjects.add(subjectKey);
      for (const edge of this.#edges.values()) {
        if (DEPENDENCY_RELATIONS.has(edge.relation) && edge.toId === subject.id) {
          const targetVersion = subject.id === changedId ? newVersion : subject.version;
          if (targetVersion !== undefined && edge.toVersion === targetVersion) continue;
          const dependentRef = nodeKey(edge.fromId, edge.fromVersion); edgeIds.add(edge.id);
          if (!stale.has(dependentRef)) { stale.add(dependentRef); queue.push({ id: edge.fromId, version: edge.fromVersion }); }
        }
        if (!DEPENDENCY_RELATIONS.has(edge.relation) && subject.version !== undefined && edge.fromId === subject.id && edge.fromVersion === subject.version) {
          const downstreamRef = nodeKey(edge.toId, edge.toVersion); edgeIds.add(edge.id);
          if (!stale.has(downstreamRef)) { stale.add(downstreamRef); queue.push({ id: edge.toId, version: edge.toVersion }); }
        }
      }
    }
    return Object.freeze({ changedRef: changedId, newVersion, staleDependentRefs: Object.freeze([...stale].sort()), evidenceEdgeIds: Object.freeze([...edgeIds].sort()) });
  }

  compatibility(subjectId: string, subjectVersion: number, currentVersions: Readonly<Record<string, number>>): TraceCompatibilityResult {
    const subject = this.getNode(subjectId, subjectVersion); if (!subject) throw new Error(`Unknown compatibility subject: ${subjectId}@${subjectVersion}`);
    const incompatible: string[] = [];
    for (const edge of this.#edges.values()) {
      if (!DEPENDENCY_RELATIONS.has(edge.relation) || edge.fromId !== subjectId || edge.fromVersion !== subjectVersion) continue;
      const current = currentVersions[edge.toId];
      if (current === undefined || current !== edge.toVersion) incompatible.push(edge.id);
    }
    return Object.freeze({ compatible: incompatible.length === 0, subjectRef: nodeKey(subjectId, subjectVersion), incompatibleEdgeIds: Object.freeze(incompatible.sort()) });
  }

  assertCompatible(subjectId: string, subjectVersion: number, currentVersions: Readonly<Record<string, number>>): void {
    const result = this.compatibility(subjectId, subjectVersion, currentVersions);
    if (!result.compatible) throw new Error(`Trace compatibility failed for ${result.subjectRef}: ${result.incompatibleEdgeIds.join(",")}`);
  }
}
