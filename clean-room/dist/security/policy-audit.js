import { parseTimestamp } from "./types.js";
export class PolicyDecisionAuditLedger {
    #records = [];
    #sequence = 0;
    append(input) {
        if (!input.ownerId.trim() || !input.sessionId.trim() || !input.action.trim() || !input.resourceOwnerId.trim())
            throw new Error("Policy decision audit identity fields are required");
        parseTimestamp(input.occurredAt, "occurredAt");
        if (input.decision.action !== input.action)
            throw new Error("Policy decision audit action mismatch");
        this.#sequence += 1;
        const record = Object.freeze({ ...input, sequence: this.#sequence, decision: Object.freeze({ ...input.decision }) });
        this.#records.push(record);
        return record;
    }
    list(ownerId) {
        if (!ownerId.trim())
            throw new Error("ownerId is required");
        return Object.freeze(this.#records.filter((record) => record.ownerId === ownerId));
    }
}
//# sourceMappingURL=policy-audit.js.map