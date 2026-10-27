import type { EnvironmentName } from "../kernel/config.js";
import type { PolicyDecision } from "./policy.js";
import { parseTimestamp } from "./types.js";

export interface PolicyDecisionAuditInput {
  readonly ownerId: string;
  readonly sessionId: string;
  readonly occurredAt: string;
  readonly action: string;
  readonly resourceOwnerId: string;
  readonly resourceProjectId?: string;
  readonly resourceCompanyId?: string;
  readonly resourceAccountId?: string;
  readonly resourceEnvironment?: EnvironmentName;
  readonly decision: PolicyDecision;
}

export interface PolicyDecisionAuditRecord extends PolicyDecisionAuditInput {
  readonly sequence: number;
}

export class PolicyDecisionAuditLedger {
  readonly #records: PolicyDecisionAuditRecord[] = [];
  #sequence = 0;

  append(input: PolicyDecisionAuditInput): PolicyDecisionAuditRecord {
    if (!input.ownerId.trim() || !input.sessionId.trim() || !input.action.trim() || !input.resourceOwnerId.trim()) throw new Error("Policy decision audit identity fields are required");
    parseTimestamp(input.occurredAt, "occurredAt");
    if (input.decision.action !== input.action) throw new Error("Policy decision audit action mismatch");
    this.#sequence += 1;
    const record = Object.freeze({ ...input, sequence: this.#sequence, decision: Object.freeze({ ...input.decision }) });
    this.#records.push(record);
    return record;
  }

  list(ownerId: string): readonly PolicyDecisionAuditRecord[] {
    if (!ownerId.trim()) throw new Error("ownerId is required");
    return Object.freeze(this.#records.filter((record) => record.ownerId === ownerId));
  }
}
