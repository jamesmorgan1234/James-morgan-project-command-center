export type ProtectedBookApprovalKind =
  | "title"
  | "subtitle"
  | "cover"
  | "artwork"
  | "manuscript"
  | "interior"
  | "metadata"
  | "pricing"
  | "format"
  | "rollout"
  | "complete_series_cover"
  | "package"
  | "protected_asset";

export type ProtectedBookApprovalState =
  | "proposed"
  | "draft"
  | "reviewed"
  | "approved"
  | "locked"
  | "reopened"
  | "superseded"
  | "rejected";

export interface ProtectedBookApprovalStateEvent {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly kind: ProtectedBookApprovalKind;
  readonly targetVersion: number;
  readonly targetIdentityRef: string;
  readonly state: ProtectedBookApprovalState;
  readonly explicitOwnerAction: boolean;
  readonly ownerActionRef?: string | undefined;
  readonly supersedesEventId?: string | undefined;
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
}

const TRANSITIONS = {
  proposed: ["draft", "reviewed", "rejected"],
  draft: ["reviewed", "rejected"],
  reviewed: ["draft", "approved", "rejected"],
  approved: ["locked", "reopened", "superseded", "rejected"],
  locked: ["reopened", "superseded"],
  reopened: ["draft", "reviewed", "rejected", "superseded"],
  superseded: [],
  rejected: ["proposed", "draft"]
} as const satisfies Readonly<Record<ProtectedBookApprovalState, readonly ProtectedBookApprovalState[]>>;

const OWNER_GOVERNED_STATES = new Set<ProtectedBookApprovalState>(["approved", "locked", "reopened", "superseded", "rejected"]);
const OWNER_GOVERNED_PRIOR_STATES = new Set<ProtectedBookApprovalState>(["approved", "locked"]);

function approvalStateTimestamp(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("book approval state observedAt must be an ISO-compatible timestamp");
  return parsed;
}

function approvalStateRefs(values: readonly string[]): readonly string[] {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error("book approval state source refs must contain nonblank references");
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error("book approval state source refs cannot contain duplicates");
  return Object.freeze(normalized);
}

function stateKey(event: Pick<ProtectedBookApprovalStateEvent, "ownerId" | "projectId" | "bookId" | "kind">): string {
  return `${event.ownerId}:${event.projectId}:${event.bookId}:${event.kind}`;
}

export class ProtectedBookApprovalStateLedger {
  readonly #events = new Map<string, ProtectedBookApprovalStateEvent>();
  readonly #current = new Map<string, ProtectedBookApprovalStateEvent>();

  record(event: ProtectedBookApprovalStateEvent): ProtectedBookApprovalStateEvent {
    if (!event.id.trim() || !event.ownerId.trim() || !event.projectId.trim() || !event.bookId.trim() || !event.targetIdentityRef.trim()) throw new Error("book approval state requires exact event/owner/project/book/target identity");
    if (!Number.isSafeInteger(event.targetVersion) || event.targetVersion < 1) throw new Error("book approval state target version must be positive");
    approvalStateTimestamp(event.observedAt);
    const sourceRefs = approvalStateRefs(event.sourceRefs);
    if (this.#events.has(event.id)) throw new Error("book approval state event id must be unique");

    const key = stateKey(event);
    const prior = this.#current.get(key);
    if (!prior) {
      if (event.supersedesEventId !== undefined) throw new Error("initial book approval state cannot supersede unknown state");
      if (event.state === "reopened" || event.state === "superseded") throw new Error("reopened/superseded state requires existing lineage");
    } else {
      if (event.supersedesEventId !== prior.id) throw new Error("book approval state change must explicitly supersede the current event");
      if (approvalStateTimestamp(event.observedAt) <= approvalStateTimestamp(prior.observedAt)) throw new Error("book approval state observation must advance");
      if (event.targetVersion < prior.targetVersion) throw new Error("book approval state target version cannot move backward");
      if (!TRANSITIONS[prior.state].includes(event.state)) throw new Error(`invalid book approval state transition ${prior.state} -> ${event.state}`);
      const targetChanged = event.targetVersion !== prior.targetVersion || event.targetIdentityRef !== prior.targetIdentityRef;
      if (OWNER_GOVERNED_PRIOR_STATES.has(prior.state) && targetChanged && event.state !== "reopened" && event.state !== "superseded") throw new Error("approved or locked target cannot change without explicit reopen or supersession");
    }

    const ownerGoverned = OWNER_GOVERNED_STATES.has(event.state) || (prior !== undefined && OWNER_GOVERNED_PRIOR_STATES.has(prior.state));
    if (ownerGoverned && (event.explicitOwnerAction !== true || !event.ownerActionRef?.trim())) throw new Error("protected book approval state change requires explicit owner action evidence");
    if (!ownerGoverned && event.explicitOwnerAction && !event.ownerActionRef?.trim()) throw new Error("explicit owner action requires owner action evidence");

    const frozen = Object.freeze({ ...event, sourceRefs });
    this.#events.set(event.id, frozen);
    this.#current.set(key, frozen);
    return frozen;
  }

  current(ownerId: string, projectId: string, bookId: string, kind: ProtectedBookApprovalKind): ProtectedBookApprovalStateEvent | undefined {
    return this.#current.get(`${ownerId}:${projectId}:${bookId}:${kind}`);
  }

  requireLocked(ownerId: string, projectId: string, bookId: string, kind: ProtectedBookApprovalKind, targetVersion: number, targetIdentityRef: string): ProtectedBookApprovalStateEvent {
    const current = this.current(ownerId, projectId, bookId, kind);
    if (!current || current.state !== "locked" || current.targetVersion !== targetVersion || current.targetIdentityRef !== targetIdentityRef || !current.explicitOwnerAction || !current.ownerActionRef?.trim()) throw new Error("exact owner-locked book state is unavailable");
    return current;
  }

  history(ownerId: string, projectId: string, bookId: string, kind?: ProtectedBookApprovalKind): readonly ProtectedBookApprovalStateEvent[] {
    return Object.freeze([...this.#events.values()].filter((event) => event.ownerId === ownerId && event.projectId === projectId && event.bookId === bookId && (kind === undefined || event.kind === kind)).sort((left, right) => approvalStateTimestamp(left.observedAt) - approvalStateTimestamp(right.observedAt)));
  }
}

export function discussionCanChangeProtectedBookApprovalState(): false {
  return false;
}
