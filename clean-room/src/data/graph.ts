import { parseTimestamp } from "../security/types.js";

export type GraphNodeType = "project" | "business" | "person" | "account" | "book" | "provider" | "asset" | "rule" | "decision" | "task" | "metric" | "obligation" | "alias" | "release";
export type GraphRelation = "owns" | "belongs_to" | "uses" | "depends_on" | "aliases" | "renamed_to" | "merged_into" | "supersedes" | "derived_from" | "references" | "produced_by" | "causes" | "supports" | "refutes" | "contradicts" | "impacts";
export type GraphDependencyImpact = "none" | "low" | "medium" | "high" | "blocking";

export interface GraphNode {
  readonly id: string;
  readonly type: GraphNodeType;
  readonly ownerId: string;
  readonly canonicalName: string;
}

export interface GraphEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly relation: GraphRelation;
  readonly version: number;
  readonly sourceRef: string;
  readonly effectiveAt: string;
  readonly supersededAt?: string;
  readonly graphVersion?: number;
  readonly confidence?: number;
  readonly contradictionRef?: string;
  readonly lineageRefs?: readonly string[];
  readonly dependencyImpact?: GraphDependencyImpact;
}

export class CommandGraph {
  readonly #nodes = new Map<string, GraphNode>();
  readonly #edges = new Map<string, GraphEdge>();

  addNode(node: GraphNode): void {
    if (!node.id.trim() || !node.ownerId.trim() || !node.canonicalName.trim()) throw new Error("Graph node identity fields are required");
    if (this.#nodes.has(node.id)) throw new Error(`Graph node already exists: ${node.id}`);
    this.#nodes.set(node.id, Object.freeze({ ...node }));
  }

  addEdge(edge: GraphEdge): void {
    if (!edge.id.trim()) throw new Error("Graph edge identity is required");
    if (!this.#nodes.has(edge.from) || !this.#nodes.has(edge.to)) throw new Error(`Graph edge references unknown node: ${edge.id}`);
    if (this.#nodes.get(edge.from)?.ownerId !== this.#nodes.get(edge.to)?.ownerId) throw new Error("Graph edge cannot cross owner boundaries");
    if (edge.from === edge.to) throw new Error(`Graph self-edge is forbidden: ${edge.id}`);
    if (!Number.isSafeInteger(edge.version) || edge.version < 1) throw new Error("Graph edge version must be positive");
    if (!edge.sourceRef.trim()) throw new Error("Graph edge requires provenance sourceRef");
    parseTimestamp(edge.effectiveAt, "effectiveAt");
    if (edge.supersededAt !== undefined && parseTimestamp(edge.supersededAt, "supersededAt") < parseTimestamp(edge.effectiveAt, "effectiveAt")) throw new Error("Graph supersession cannot predate effective time");
    if (edge.graphVersion !== undefined && (!Number.isSafeInteger(edge.graphVersion) || edge.graphVersion < 1)) throw new Error("Graph version must be positive");
    if (edge.confidence !== undefined && (!Number.isFinite(edge.confidence) || edge.confidence < 0 || edge.confidence > 1)) throw new Error("Graph edge confidence must be between 0 and 1");
    if (edge.contradictionRef !== undefined && !edge.contradictionRef.trim()) throw new Error("Graph contradiction reference cannot be blank");
    if (edge.lineageRefs !== undefined && (edge.lineageRefs.some((ref) => !ref.trim()) || new Set(edge.lineageRefs).size !== edge.lineageRefs.length)) throw new Error("Graph lineage references must be unique and nonblank");
    if (edge.dependencyImpact !== undefined && !["none", "low", "medium", "high", "blocking"].includes(edge.dependencyImpact)) throw new Error("Unsupported graph dependency impact");
    if (edge.relation === "contradicts" && !edge.contradictionRef) throw new Error("Contradiction edges require contradictionRef");
    if (edge.relation === "depends_on" && edge.dependencyImpact === undefined) throw new Error("Dependency edges require dependencyImpact");
    if (edge.relation === "aliases" && [...this.#edges.values()].some((item) => item.from === edge.from && item.relation === "aliases" && !item.supersededAt) && !edge.supersededAt) throw new Error("Alias already has a current canonical target");
    if (this.#edges.has(edge.id)) throw new Error(`Graph edge already exists: ${edge.id}`);
    this.#edges.set(edge.id, Object.freeze({ ...edge, lineageRefs: edge.lineageRefs === undefined ? undefined : Object.freeze([...edge.lineageRefs]) }));
  }

  supersedeEdge(id: string, at: string): GraphEdge {
    const current = this.#edges.get(id);
    if (!current) throw new Error(`Unknown graph edge: ${id}`);
    if (current.supersededAt) throw new Error(`Graph edge already superseded: ${id}`);
    if (parseTimestamp(at, "at") < parseTimestamp(current.effectiveAt, "effectiveAt")) throw new Error("Graph supersession cannot predate effective time");
    const updated = Object.freeze({ ...current, version: current.version + 1, graphVersion: current.graphVersion === undefined ? undefined : current.graphVersion + 1, supersededAt: at });
    this.#edges.set(id, updated);
    return updated;
  }

  neighbors(id: string, relation?: GraphRelation): readonly GraphEdge[] {
    if (!this.#nodes.has(id)) throw new Error(`Unknown graph node: ${id}`);
    return Object.freeze([...this.#edges.values()].filter((edge) => !edge.supersededAt && (edge.from === id || edge.to === id) && (!relation || edge.relation === relation)));
  }

  resolveAlias(aliasNodeId: string): GraphNode {
    const alias = this.#nodes.get(aliasNodeId);
    if (!alias || alias.type !== "alias") throw new Error(`Unknown alias node: ${aliasNodeId}`);
    const edge = [...this.#edges.values()].find((candidate) => candidate.from === aliasNodeId && candidate.relation === "aliases" && !candidate.supersededAt);
    if (!edge) throw new Error(`Alias has no current canonical target: ${aliasNodeId}`);
    const target = this.#nodes.get(edge.to);
    if (!target) throw new Error(`Alias target missing: ${edge.to}`);
    return target;
  }

  getNode(id: string): GraphNode | undefined { return this.#nodes.get(id); }
}
