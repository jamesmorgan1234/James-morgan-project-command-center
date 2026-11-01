import { canonicalAnalyticsJson } from "./contracts.js";
export function normalizeAnalyticsEvents(events) {
    const seen = new Map();
    const output = [];
    for (const event of events) {
        const prior = seen.get(event.id);
        if (event.containsSensitivePayload)
            throw new Error("analytics event violates privacy minimization");
        if (!["short", "standard", "long"].includes(event.retentionClass) || !Number.isFinite(Date.parse(event.occurredAt)))
            throw new Error("invalid analytics retention/time");
        if (!event.metricKey.trim() || !event.occurredAt.includes("T") || !event.sourceRef.trim() || !Number.isFinite(event.value))
            throw new Error("invalid analytics event");
        if (prior) {
            if (canonicalAnalyticsJson(prior) !== canonicalAnalyticsJson(event))
                throw new Error("Conflicting duplicate analytics event");
            continue;
        }
        seen.set(event.id, event);
        output.push(Object.freeze({ ...event }));
    }
    return Object.freeze(output.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id)));
}
export function recalculate(events, metricKey) {
    const result = normalizeAnalyticsEvents(events).filter((event) => event.metricKey === metricKey).reduce((sum, event) => sum + event.value, 0);
    if (!Number.isFinite(result))
        throw new Error("Analytics aggregation overflow");
    return result;
}
//# sourceMappingURL=accuracy.js.map