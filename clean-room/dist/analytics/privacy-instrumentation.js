import { ANALYTICS_SCHEMA_VERSION, EVENT_DICTIONARY, validateAnalyticsEventEnvelope } from "./measurement-schema.js";
const UNSAFE_PROPERTY_KEY = /(email|phone|name|address|token|secret|password|cookie|header|authorization|message|content|body|text|prompt|query|credential|session[_-]?token)/i;
const SECRET_LIKE_VALUE = /(bearer\s+[a-z0-9._~+\/-]+=*|sk-[a-z0-9_-]{12,}|-----begin [a-z ]+private key-----)/i;
const MAX_STRING_PROPERTY_LENGTH = 128;
const safeString = (value) => value.length <= MAX_STRING_PROPERTY_LENGTH && !SECRET_LIKE_VALUE.test(value);
export const isPrivacySafeProperty = (key, value) => {
    if (UNSAFE_PROPERTY_KEY.test(key))
        return false;
    if (typeof value === "string" && !safeString(value))
        return false;
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null;
};
export const sanitizeAnalyticsProperties = (eventName, properties) => {
    if (properties === undefined)
        return undefined;
    const allowed = EVENT_DICTIONARY[eventName].allowedProperties;
    const sanitized = {};
    for (const [key, value] of Object.entries(properties)) {
        if (allowed.includes(key) && isPrivacySafeProperty(key, value))
            sanitized[key] = value;
    }
    return Object.keys(sanitized).length === 0 ? undefined : sanitized;
};
export const minimizeAnalyticsEvent = (event, telemetryClass) => {
    const { subjectId, properties, ...rest } = event;
    const sanitized = sanitizeAnalyticsProperties(event.eventName, properties);
    return {
        ...rest,
        ...(telemetryClass !== "essential_reliability" && subjectId !== undefined ? { subjectId } : {}),
        ...(sanitized !== undefined ? { properties: sanitized } : {})
    };
};
export const containsUnsafeAnalyticsPayload = (event) => {
    if (event.properties === undefined)
        return false;
    return Object.entries(event.properties).some(([key, value]) => !isPrivacySafeProperty(key, value));
};
export class PrivacySafeAnalyticsEmitter {
    clientSink;
    serverSink;
    constructor(clientSink, serverSink) {
        this.clientSink = clientSink;
        this.serverSink = serverSink;
    }
    async emit(event, consent, telemetryClass = "product_analytics") {
        if (telemetryClass === "product_analytics" && consent !== "granted") {
            return { status: "dropped", reason: "consent_not_granted" };
        }
        if (containsUnsafeAnalyticsPayload(event)) {
            return { status: "dropped", reason: "unsafe_payload" };
        }
        const minimized = minimizeAnalyticsEvent(event, telemetryClass);
        const errors = validateAnalyticsEventEnvelope(minimized);
        if (errors.length > 0)
            return { status: "dropped", reason: "invalid_event", errors };
        const sink = minimized.source === "client" ? this.clientSink : this.serverSink;
        await sink(minimized);
        return { status: "delivered" };
    }
}
export const captureSafeErrorEvent = (context, failureCode, properties) => {
    const sanitized = sanitizeAnalyticsProperties(context.eventName, properties);
    return {
        schemaVersion: ANALYTICS_SCHEMA_VERSION,
        ...context,
        failureCode,
        ...(sanitized !== undefined ? { properties: sanitized } : {})
    };
};
export const captureSafePerformanceEvent = (context, durationMs, properties) => {
    if (!Number.isFinite(durationMs) || durationMs < 0)
        throw new Error("duration_ms_invalid");
    const sanitized = sanitizeAnalyticsProperties(context.eventName, properties);
    return {
        schemaVersion: ANALYTICS_SCHEMA_VERSION,
        ...context,
        durationMs,
        ...(sanitized !== undefined ? { properties: sanitized } : {})
    };
};
//# sourceMappingURL=privacy-instrumentation.js.map