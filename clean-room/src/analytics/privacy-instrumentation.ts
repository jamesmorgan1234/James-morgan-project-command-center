import {
  ANALYTICS_SCHEMA_VERSION,
  EVENT_DICTIONARY,
  type AnalyticsEventEnvelope,
  type AnalyticsEventName,
  type AnalyticsSource,
  type AnalyticsValue,
  validateAnalyticsEventEnvelope
} from "./measurement-schema.js";

export type TelemetryConsent = "granted" | "denied" | "unknown";
export type TelemetryClass = "product_analytics" | "essential_reliability";
export type TelemetryDropReason = "consent_not_granted" | "invalid_event" | "unsafe_payload";

export interface TelemetryDeliveryResult {
  status: "delivered" | "dropped";
  reason?: TelemetryDropReason;
  errors?: readonly string[];
}

export type AnalyticsSink = (event: AnalyticsEventEnvelope) => void | Promise<void>;

const UNSAFE_PROPERTY_KEY = /(email|phone|name|address|token|secret|password|cookie|header|authorization|message|content|body|text|prompt|query|credential|session[_-]?token)/i;
const SECRET_LIKE_VALUE = /(bearer\s+[a-z0-9._~+\/-]+=*|sk-[a-z0-9_-]{12,}|-----begin [a-z ]+private key-----)/i;
const MAX_STRING_PROPERTY_LENGTH = 128;

const safeString = (value: string): boolean => value.length <= MAX_STRING_PROPERTY_LENGTH && !SECRET_LIKE_VALUE.test(value);

export const isPrivacySafeProperty = (key: string, value: AnalyticsValue): boolean => {
  if (UNSAFE_PROPERTY_KEY.test(key)) return false;
  if (typeof value === "string" && !safeString(value)) return false;
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null;
};

export const sanitizeAnalyticsProperties = (
  eventName: AnalyticsEventName,
  properties: Readonly<Record<string, AnalyticsValue>> | undefined
): Readonly<Record<string, AnalyticsValue>> | undefined => {
  if (properties === undefined) return undefined;
  const allowed = EVENT_DICTIONARY[eventName].allowedProperties;
  const sanitized: Record<string, AnalyticsValue> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (allowed.includes(key) && isPrivacySafeProperty(key, value)) sanitized[key] = value;
  }
  return Object.keys(sanitized).length === 0 ? undefined : sanitized;
};

export const minimizeAnalyticsEvent = (
  event: AnalyticsEventEnvelope,
  telemetryClass: TelemetryClass
): AnalyticsEventEnvelope => {
  const { subjectId, properties, ...rest } = event;
  const sanitized = sanitizeAnalyticsProperties(event.eventName, properties);
  return {
    ...rest,
    ...(telemetryClass !== "essential_reliability" && subjectId !== undefined ? { subjectId } : {}),
    ...(sanitized !== undefined ? { properties: sanitized } : {})
  };
};

export const containsUnsafeAnalyticsPayload = (event: AnalyticsEventEnvelope): boolean => {
  if (event.properties === undefined) return false;
  return Object.entries(event.properties).some(([key, value]) => !isPrivacySafeProperty(key, value));
};

export class PrivacySafeAnalyticsEmitter {
  constructor(private readonly clientSink: AnalyticsSink, private readonly serverSink: AnalyticsSink) {}

  async emit(
    event: AnalyticsEventEnvelope,
    consent: TelemetryConsent,
    telemetryClass: TelemetryClass = "product_analytics"
  ): Promise<TelemetryDeliveryResult> {
    if (telemetryClass === "product_analytics" && consent !== "granted") {
      return { status: "dropped", reason: "consent_not_granted" };
    }
    if (containsUnsafeAnalyticsPayload(event)) {
      return { status: "dropped", reason: "unsafe_payload" };
    }
    const minimized = minimizeAnalyticsEvent(event, telemetryClass);
    const errors = validateAnalyticsEventEnvelope(minimized);
    if (errors.length > 0) return { status: "dropped", reason: "invalid_event", errors };
    const sink = minimized.source === "client" ? this.clientSink : this.serverSink;
    await sink(minimized);
    return { status: "delivered" };
  }
}

export interface SafeTelemetryContext {
  eventName: AnalyticsEventName;
  eventId: string;
  occurredAt: string;
  source: AnalyticsSource;
  sessionId: string;
  journeyId: string;
  projectId?: string;
  integrationId?: string;
  runId?: string;
  expertId?: string;
  dotId?: string;
  supportCaseId?: string;
}

export const captureSafeErrorEvent = (
  context: SafeTelemetryContext,
  failureCode: string,
  properties?: Readonly<Record<string, AnalyticsValue>>
): AnalyticsEventEnvelope => {
  const sanitized = sanitizeAnalyticsProperties(context.eventName, properties);
  return {
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    ...context,
    failureCode,
    ...(sanitized !== undefined ? { properties: sanitized } : {})
  };
};

export const captureSafePerformanceEvent = (
  context: SafeTelemetryContext,
  durationMs: number,
  properties?: Readonly<Record<string, AnalyticsValue>>
): AnalyticsEventEnvelope => {
  if (!Number.isFinite(durationMs) || durationMs < 0) throw new Error("duration_ms_invalid");
  const sanitized = sanitizeAnalyticsProperties(context.eventName, properties);
  return {
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    ...context,
    durationMs,
    ...(sanitized !== undefined ? { properties: sanitized } : {})
  };
};
